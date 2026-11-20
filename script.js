/* =========================================================
   سكربت صفحة هبوط وكالة مدار
   JavaScript خام بدون مكتبات: القائمة، التصفية، النموذج
   ========================================================= */

'use strict';

// هل طلب المستخدم تقليل الحركة من إعدادات نظامه؟
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. قائمة الهمبرغر ---------- */
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.getElementById('nav-menu');

// فتح أو إغلاق القائمة مع تحديث aria-expanded ونص الزر
function setMenuOpen(isOpen) {
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'إغلاق القائمة' : 'فتح القائمة');
  navMenu.classList.toggle('is-open', isOpen);
}

navToggle.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  setMenuOpen(!isOpen);
});

// إغلاق القائمة عند اختيار أي رابط منها
navMenu.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    setMenuOpen(false);
  }
});

// إغلاق القائمة بمفتاح Escape وإرجاع التركيز إلى الزر
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navMenu.classList.contains('is-open')) {
    setMenuOpen(false);
    navToggle.focus();
  }
});

/* ---------- 2. تصفية معرض الأعمال ---------- */
const filterButtons = document.querySelectorAll('.filter-btn');
const projects = document.querySelectorAll('.project-card');
const FADE_MS = prefersReducedMotion ? 0 : 300; // مدة الحركة (تطابق CSS)
let filterTimer = null;

function filterProjects(category) {
  clearTimeout(filterTimer);

  // المرحلة 1: إخفاء تدريجي للبطاقات غير المطابقة
  projects.forEach((card) => {
    const matches = category === 'all' || card.dataset.category === category;
    if (!matches) card.classList.add('is-fading');
  });

  // المرحلة 2: بعد انتهاء الحركة نزيلها من التخطيط ونُظهر المطابقة
  filterTimer = setTimeout(() => {
    projects.forEach((card) => {
      const matches = category === 'all' || card.dataset.category === category;
      card.hidden = !matches;
      if (matches) {
        card.classList.add('is-fading');
        void card.offsetWidth; // إجبار المتصفح على إعادة الحساب حتى تعمل الحركة
        card.classList.remove('is-fading');
      }
    });
  }, FADE_MS);
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    // تحديث الزر النشط وحالة aria-pressed
    filterButtons.forEach((btn) => {
      const active = btn === button;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    filterProjects(button.dataset.filter);
  });
});

/* ---------- 3. التحقق من نموذج التواصل ---------- */
const form = document.getElementById('contact-form');
const successMsg = document.getElementById('form-success');
const MIN_MESSAGE_LENGTH = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// قواعد التحقق لكل حقل: تُرجع نص الخطأ أو نصاً فارغاً إن كان الحقل صحيحاً
const validators = {
  name(value) {
    if (!value) return 'الرجاء إدخال اسمك.';
    if (value.length < 2) return 'الاسم قصير جداً.';
    return '';
  },
  email(value) {
    if (!value) return 'الرجاء إدخال بريدك الإلكتروني.';
    if (!EMAIL_PATTERN.test(value)) return 'صيغة البريد غير صحيحة، مثال: name@example.com';
    return '';
  },
  subject(value) {
    if (!value) return 'الرجاء كتابة موضوع الرسالة.';
    return '';
  },
  message(value) {
    if (!value) return 'الرجاء كتابة رسالتك.';
    if (value.length < MIN_MESSAGE_LENGTH) {
      return `الرسالة قصيرة: ${value.length} من ${MIN_MESSAGE_LENGTH} حرفاً على الأقل.`;
    }
    return '';
  },
};

// يتحقق من حقل واحد ويعرض الخطأ بجانبه
function validateField(field) {
  const error = validators[field.name](field.value.trim());
  const errorEl = document.getElementById(`${field.id}-error`);
  errorEl.textContent = error;
  field.setAttribute('aria-invalid', error ? 'true' : 'false');
  return !error;
}

// التحقق أثناء الكتابة فقط بعد أن يُظهر الحقل خطأً، حتى لا نزعج المستخدم مبكراً
form.querySelectorAll('input, textarea').forEach((field) => {
  field.addEventListener('blur', () => {
    if (field.value.trim()) validateField(field);
  });
  field.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') === 'true') validateField(field);
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault(); // لا يوجد خادم: نمنع الإرسال الحقيقي
  successMsg.hidden = true;

  const fields = [...form.querySelectorAll('input, textarea')];
  const results = fields.map(validateField);
  const firstInvalid = fields[results.indexOf(false)];

  if (firstInvalid) {
    firstInvalid.focus(); // نقل التركيز لأول حقل فيه خطأ
    return;
  }

  // محاكاة إرسال إلى خادم بتأخير قصير
  const submitBtn = form.querySelector('[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'جارٍ الإرسال…';

  setTimeout(() => {
    const name = form.elements.namedItem('name').value.trim();
    successMsg.textContent = `شكراً ${name}! وصلتنا رسالتك وسنتواصل معك قريباً.`;
    successMsg.hidden = false;
    form.reset();
    fields.forEach((f) => f.removeAttribute('aria-invalid'));
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }, 800);
});

/* ---------- 4. سنة حقوق النشر تلقائياً ---------- */
document.getElementById('year').textContent = new Date().getFullYear();
