// ========== НАСТРОЙКИ (config.js на хостинге) ==========
const SITE_CONFIG = window.SITE_CONFIG || {};
const TELEGRAM_BOT_TOKEN = SITE_CONFIG.telegramBotToken || '';
const TELEGRAM_CHAT_ID = SITE_CONFIG.telegramChatId || '';

function isTelegramConfigured() {
    return Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID);
}

async function sendToTelegram(message) {
    if (!isTelegramConfigured()) {
        console.log('Telegram не настроен. Данные заявки:', message);
        return false;
    }
    
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
        return false;
    }
}

// ========== TOAST ==========
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========== МАСКА И ВАЛИДАЦИЯ ТЕЛЕФОНА ==========
function normalizePhoneDigits(value) {
    let digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';

    if (digits.startsWith('8')) {
        digits = '7' + digits.slice(1);
    } else if (!digits.startsWith('7')) {
        digits = '7' + digits;
    }

    return digits.slice(0, 11);
}

function formatPhoneMask(value) {
    const digits = normalizePhoneDigits(value);
    if (!digits) return '';

    let formatted = '+7';

    if (digits.length > 1) {
        formatted += ' (' + digits.slice(1, 4);
    }
    if (digits.length >= 5) {
        formatted += ') ' + digits.slice(4, 7);
    }
    if (digits.length >= 8) {
        formatted += '-' + digits.slice(7, 9);
    }
    if (digits.length >= 10) {
        formatted += '-' + digits.slice(9, 11);
    }

    return formatted;
}

function validatePhone(phone) {
    const digits = normalizePhoneDigits(phone);
    return digits.length === 11;
}

function attachPhoneMask(input) {
    if (!input || input.dataset.phoneMask === 'true') return;

    input.dataset.phoneMask = 'true';
    input.setAttribute('inputmode', 'tel');
    input.setAttribute('maxlength', '18');

    const applyMask = () => {
        const formatted = formatPhoneMask(input.value);
        input.value = formatted;
    };

    input.addEventListener('focus', () => {
        if (!input.value.trim()) {
            input.value = '+7 (';
        }
    });

    input.addEventListener('blur', () => {
        const digits = normalizePhoneDigits(input.value);
        if (digits.length <= 1) {
            input.value = '';
        } else {
            input.value = formatPhoneMask(input.value);
        }
    });

    input.addEventListener('input', applyMask);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && (input.value === '+7 (' || input.value === '+7')) {
            e.preventDefault();
            input.value = '';
        }
    });

    if (input.value) {
        input.value = formatPhoneMask(input.value);
    }
}

function initAllPhoneMasks() {
    document.querySelectorAll('input[type="tel"]').forEach(attachPhoneMask);
}

document.addEventListener('DOMContentLoaded', initAllPhoneMasks);

// ========== ПЛАВНАЯ ПРОКРУТКА ==========
document.querySelectorAll('.nav a, .footer-links a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                const nav = document.getElementById('mainNav');
                if (nav && nav.classList.contains('active')) {
                    nav.classList.remove('active');
                }
            }
        }
    });
});

// ========== АКТИВНАЯ ССЫЛКА ==========
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav a');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ========== МОБИЛЬНОЕ МЕНЮ ==========
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mainNav = document.getElementById('mainNav');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mainNav.classList.toggle('active');
    });
}

// ========== МОДАЛЬНОЕ ОКНО ==========
const modal = document.getElementById('callbackModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.querySelector('#callbackModal .modal-close');

if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
        if (modal) modal.style.display = 'flex';
    });
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        if (modal) modal.style.display = 'none';
    }
});

// ========== ОБРАБОТКА ФОРМ ==========
async function handleFormSubmit(formId, getMessage, onSuccess, getOrderData) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const phoneInput = form.querySelector('input[type="tel"]');
        if (phoneInput && !validatePhone(phoneInput.value)) {
            showToast('Введите корректный номер телефона (10 цифр)', 'error');
            return;
        }
        
        form.classList.add('loading');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn?.textContent || '';
        if (submitBtn) submitBtn.textContent = 'Отправка...';
        
        const message = getMessage(form);
        const sent = await sendToTelegram(message);
        
        if (sent) {
            showToast(onSuccess || 'Заявка успешно отправлена!', 'success');
            form.reset();
            if (getOrderData) {
                const order = getOrderData(form);
                if (order) saveOrder(order);
            }
        } else {
            showToast('Ошибка отправки. Позвоните нам.', 'error');
            console.log('Данные заявки:', message);
        }
        
        form.classList.remove('loading');
        if (submitBtn) submitBtn.textContent = originalText;
    });
}

handleFormSubmit('callbackForm', (form) => {
    const name = form.querySelector('input[placeholder="Ваше имя"]')?.value || 'Не указан';
    const phone = form.querySelector('input[type="tel"]')?.value || 'Не указан';
    const device = form.querySelector('select')?.value || 'Не выбрано';
    const problem = form.querySelector('textarea')?.value || 'Не указана';
    return `🔧 НОВАЯ ЗАЯВКА\n\n👤 Имя: ${name}\n📞 Телефон: ${phone}\n🖨️ Устройство: ${device}\n📝 Проблема: ${problem}\n\n⏰ ${new Date().toLocaleString()}`;
}, 'Спасибо за заявку! Мы свяжемся с вами.', (form) => ({
    id: `order_${Date.now()}`,
    type: 'Заявка на ремонт',
    name: form.querySelector('input[placeholder="Ваше имя"]')?.value || 'Не указан',
    phone: form.querySelector('input[type="tel"]')?.value || 'Не указан',
    device,
    problem,
    createdAt: new Date().toISOString()
}));

handleFormSubmit('modalForm', (form) => {
    const name = form.querySelector('input[placeholder="Ваше имя"]')?.value || 'Не указан';
    const phone = form.querySelector('input[type="tel"]')?.value || 'Не указан';
    return `📞 ЗАКАЗ ЗВОНКА\n\n👤 Имя: ${name}\n📞 Телефон: ${phone}\n\n⏰ ${new Date().toLocaleString()}`;
}, 'Спасибо! Мы перезвоним через 15 минут.', (form) => ({
    id: `order_${Date.now()}`,
    type: 'Обратный звонок',
    name: form.querySelector('input[placeholder="Ваше имя"]')?.value || 'Не указан',
    phone: form.querySelector('input[type="tel"]')?.value || 'Не указан',
    createdAt: new Date().toISOString()
}));

// ========== МОДЕРАЦИЯ ОТЗЫВОВ ==========
const REVIEW_MOD_GUEST_KEY = 'technoservice_guest_moderation_id';
const REVIEW_BLOCKED_GUESTS_KEY = 'technoservice_review_blocked_guests';

const PROFANITY_ROOTS = [
    'хуй', 'хуя', 'хуе', 'хуи', 'хую', 'пизд', 'пздц', 'бляд', 'блять', 'бля',
    'ебан', 'ебат', 'ебал', 'ебут', 'ебаш', 'ебет', 'ебля', 'заеб', 'выеб', 'отъеб', 'проеб', 'уеб',
    'сука', 'сучк', 'мудак', 'мудил', 'мудоз', 'пидор', 'пидар', 'педик', 'педераст',
    'залуп', 'говно', 'говню', 'дерьм', 'шлюх', 'проститу',
    'нахуй', 'похуй', 'охуел', 'ахуел', 'долбо', 'долбоеб', 'мраз', 'ублюд', 'гандон', 'чмошник'
];

function normalizeModerationText(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[@]/g, 'а')
        .replace(/[0]/g, 'о')
        .replace(/[1!|]/g, 'и')
        .replace(/[3]/g, 'з')
        .replace(/[4]/g, 'ч')
        .replace(/[5\$]/g, 'с')
        .replace(/[6]/g, 'б')
        .replace(/[7]/g, 'т')
        .replace(/[\s\-_*.+,/\\|]+/g, '')
        .replace(/(.)\1{2,}/g, '$1$1');
}

function containsProfanity(text) {
    const normalized = normalizeModerationText(text);
    if (!normalized || normalized.length < 3) return false;
    return PROFANITY_ROOTS.some((root) => normalized.includes(root));
}

function getGuestModerationId() {
    let id = localStorage.getItem(REVIEW_MOD_GUEST_KEY);
    if (!id) {
        id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(REVIEW_MOD_GUEST_KEY, id);
    }
    return id;
}

function getBlockedGuests() {
    try {
        const raw = localStorage.getItem(REVIEW_BLOCKED_GUESTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveBlockedGuests(list) {
    localStorage.setItem(REVIEW_BLOCKED_GUESTS_KEY, JSON.stringify(list));
}

function isReviewerBlocked() {
    const user = getCurrentUser();
    if (user) {
        if (isAdmin(user)) return false;
        return Boolean(user.blocked);
    }
    const guestId = getGuestModerationId();
    return getBlockedGuests().some((entry) => entry.guestId === guestId);
}

function blockCurrentReviewer(displayName) {
    const user = getCurrentUser();
    const reason = 'Нецензурная лексика в отзыве';

    if (user && !isAdmin(user)) {
        const users = getStoredUsers();
        const index = users.findIndex((u) => u.id === user.id);
        if (index !== -1) {
            users[index].blocked = true;
            users[index].blockedAt = new Date().toISOString();
            users[index].blockReason = reason;
            saveStoredUsers(users);
        }
        setCurrentUser(null);
        return;
    }

    const blocked = getBlockedGuests();
    if (!blocked.some((entry) => entry.guestId === getGuestModerationId())) {
        blocked.push({
            guestId: getGuestModerationId(),
            name: (displayName || 'Гость').trim(),
            blockedAt: new Date().toISOString(),
            reason
        });
        saveBlockedGuests(blocked);
    }
}

function validateReviewContent(name, reviewText, { allowAdmin = false } = {}) {
    if (allowAdmin) {
        return { ok: true };
    }

    if (containsProfanity(name)) {
        return { ok: false, field: 'name', message: 'В имени обнаружена нецензурная лексика' };
    }

    if (containsProfanity(reviewText)) {
        return { ok: false, field: 'text', message: 'В тексте отзыва обнаружена нецензурная лексика' };
    }

    return { ok: true };
}

function applyReviewFormBlockedState() {
    const form = document.getElementById('reviewForm');
    const wrap = document.querySelector('.reviews-add');
    if (!form || !wrap) return;

    const blocked = isReviewerBlocked();
    form.querySelectorAll('input, textarea, select, button').forEach((el) => {
        el.disabled = blocked;
    });

    let notice = wrap.querySelector('.review-blocked-notice');
    if (blocked) {
        if (!notice) {
            notice = document.createElement('p');
            notice.className = 'review-blocked-notice';
            wrap.insertBefore(notice, form);
        }
        notice.textContent =
            'Вы заблокированы за нарушение правил (нецензурная лексика). Отправка отзывов недоступна.';
    } else if (notice) {
        notice.remove();
    }
}

// ========== ОТЗЫВЫ (сохранение в localStorage) ==========
const REVIEWS_STORAGE_KEY = 'technoservice_reviews';
const REVIEWS_INITIALIZED_KEY = 'technoservice_reviews_initialized';
const ORDERS_STORAGE_KEY = 'technoservice_orders';

const DEFAULT_REVIEWS = [
    {
        id: 'review_default_1',
        name: 'Алексей Д.',
        rating: 5,
        text: 'Отличный сервис! Принтер HP перестал печатать, привез в сервис, диагностировали бесплатно, починили за 2 дня. Рекомендую!',
        createdAt: '2025-03-15T10:00:00.000Z',
        isDefault: true
    },
    {
        id: 'review_default_2',
        name: 'Екатерина С.',
        rating: 5,
        text: 'Вызывала мастера на дом для ремонта МФУ Canon. Приехал быстро, всё объяснил, сделал качественно. Цена адекватная. Спасибо!',
        createdAt: '2025-03-03T10:00:00.000Z',
        isDefault: true
    },
    {
        id: 'review_default_3',
        name: 'Михаил К.',
        rating: 5,
        text: 'Ремонтировали сканер Brother. Сделали быстро и недорого. Вежливый персонал, удобное расположение. Буду обращаться ещё!',
        createdAt: '2025-02-20T10:00:00.000Z',
        isDefault: true
    },
    {
        id: 'review_default_4',
        name: 'Ольга В.',
        rating: 5,
        text: 'Очень довольна работой сервиса. Принтер Xerox работал как новый после ремонта. Дают гарантию 6 месяцев. Спасибо!',
        createdAt: '2025-02-05T10:00:00.000Z',
        isDefault: true
    },
    {
        id: 'review_default_5',
        name: 'Дмитрий П.',
        rating: 5,
        text: 'Профессионалы своего дела. Отремонтировали МФУ Kyocera с проблемой зажевывания бумаги. Теперь работает отлично. Рекомендую!',
        createdAt: '2025-01-18T10:00:00.000Z',
        isDefault: true
    },
    {
        id: 'review_default_6',
        name: 'Наталья М.',
        rating: 5,
        text: 'Быстро и качественно. Принтер Epson заправили и починили за один день. Спасибо мастеру Алексею!',
        createdAt: '2025-01-10T10:00:00.000Z',
        isDefault: true
    }
];

function getStoredReviews() {
    try {
        const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveAllReviews(reviews) {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

function ensureReviewsInitialized() {
    if (localStorage.getItem(REVIEWS_INITIALIZED_KEY)) return;

    const existing = getStoredReviews();
    const merged = [...existing];
    const existingIds = new Set(existing.map((r) => r.id));

    DEFAULT_REVIEWS.forEach((review) => {
        if (!existingIds.has(review.id)) {
            merged.push(review);
        }
    });

    saveAllReviews(merged);
    localStorage.setItem(REVIEWS_INITIALIZED_KEY, '1');
}

function saveStoredReview(review) {
    const reviews = getStoredReviews();
    reviews.unshift(review);
    saveAllReviews(reviews);
}

function updateStoredReview(reviewId, updates) {
    const reviews = getStoredReviews();
    const index = reviews.findIndex((r) => r.id === reviewId);
    if (index === -1) return false;

    reviews[index] = { ...reviews[index], ...updates };
    saveAllReviews(reviews);
    return true;
}

function deleteStoredReview(reviewId) {
    const reviews = getStoredReviews().filter((r) => r.id !== reviewId);
    saveAllReviews(reviews);
}

// ========== ХРАНЕНИЕ ЗАКАЗОВ (localStorage) ==========
function getStoredOrders() {
    try {
        const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveStoredOrders(orders) {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

function saveOrder(order) {
    const orders = getStoredOrders();
    orders.unshift(order);
    saveStoredOrders(orders);
}

function deleteStoredOrder(orderId) {
    const orders = getStoredOrders().filter((o) => o.id !== orderId);
    saveStoredOrders(orders);
}

function getReviewById(reviewId) {
    return getStoredReviews().find((r) => r.id === reviewId) || null;
}

function getRatingStars(rating) {
    const stars = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

function getReviewAvatarLetter(name) {
    const trimmed = name.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

function formatReviewDate(dateValue) {
    const date = dateValue ? new Date(dateValue) : new Date();
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function escapeReviewHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function createReviewCardElement(review) {
    const card = document.createElement('div');
    card.className = 'review-card';
    if (!review.isDefault) {
        card.classList.add('review-card--user');
    }
    card.dataset.reviewId = review.id;

    const displayName = review.name.trim() || 'Гость';
    const quotedText = review.text.trim().startsWith('"')
        ? review.text.trim()
        : `"${review.text.trim()}"`;

    card.innerHTML = `
        <div class="review-header">
            <div class="review-avatar">${escapeReviewHtml(getReviewAvatarLetter(displayName))}</div>
            <div class="review-info">
                <h3>${escapeReviewHtml(displayName)}</h3>
                <div class="review-rating">${getRatingStars(review.rating)}</div>
            </div>
        </div>
        <p class="review-text">${escapeReviewHtml(quotedText)}</p>
        <span class="review-date">${escapeReviewHtml(formatReviewDate(review.createdAt))}</span>
    `;

    return card;
}

function renderAllReviews() {
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;

    const reviews = getStoredReviews().sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    grid.innerHTML = '';

    reviews.forEach((review) => {
        const card = createReviewCardElement(review);
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        grid.appendChild(card);

        if (typeof observer !== 'undefined' && observer) {
            observer.observe(card);
        }
    });
}

function initReviews() {
    ensureReviewsInitialized();
    renderAllReviews();

    const reviewForm = document.getElementById('reviewForm');
    if (!reviewForm) return;

    applyReviewFormBlockedState();

    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isReviewerBlocked()) {
            showToast('Вы заблокированы и не можете оставлять отзывы', 'error');
            return;
        }

        const name = reviewForm.querySelector('input[type="text"]').value.trim();
        const rating = reviewForm.querySelector('select').value;
        const reviewText = reviewForm.querySelector('textarea').value.trim();

        if (!name || !reviewText) {
            showToast('Заполните имя и текст отзыва', 'error');
            return;
        }

        const moderation = validateReviewContent(name, reviewText);
        if (!moderation.ok) {
            blockCurrentReviewer(name);
            applyReviewFormBlockedState();
            updateAuthUI();
            reviewForm.reset();
            showToast(
                `${moderation.message}. Отзыв не опубликован. Доступ к отзывам заблокирован.`,
                'error'
            );
            return;
        }

        const currentUser = getCurrentUser();
        const review = {
            id: `review_${Date.now()}`,
            name,
            rating,
            text: reviewText,
            createdAt: new Date().toISOString(),
            isDefault: false,
            userId: currentUser ? currentUser.id : null,
            userEmail: currentUser ? currentUser.email : null
        };

        saveStoredReview(review);
        renderAllReviews();

        const message = `⭐ НОВЫЙ ОТЗЫВ\n\n👤 Имя: ${name}\n⭐ Оценка: ${rating}/5\n📝 Отзыв: ${reviewText}\n\n⏰ ${new Date().toLocaleString()}`;
        await sendToTelegram(message);

        reviewForm.reset();
        showToast('Спасибо! Ваш отзыв опубликован.', 'success');

        document.getElementById('reviewsGrid')?.querySelector('.review-card')?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    });
}

document.addEventListener('DOMContentLoaded', initReviews);

// ========== АНИМАЦИЯ ==========
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

const useScrollReveal = window.matchMedia('(min-width: 769px)').matches;

if (useScrollReveal) {
    document.querySelectorAll('.service-card, .advantage, .device-category, .review-card').forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ========== КАРТОЧКИ УСЛУГ ==========
const serviceCards = document.querySelectorAll('.service-card');
let serviceModal = document.getElementById('serviceOrderModal');

if (!serviceModal) {
    serviceModal = document.createElement('div');
    serviceModal.id = 'serviceOrderModal';
    serviceModal.className = 'modal';
    serviceModal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h2>Оформление заказа</h2>
            <p id="selectedServiceName" style="background: #f0fdfa; padding: 10px; border-radius: 8px; margin: 15px 0; border-left: 3px solid #0d9488;"></p>
            <form id="serviceOrderForm">
                <input type="text" placeholder="Ваше имя" required>
                <input type="tel" placeholder="Телефон" required>
                <input type="email" placeholder="Email (необязательно)">
                <textarea placeholder="Дополнительная информация" rows="3"></textarea>
                <button type="submit" class="btn btn-primary">Отправить заявку</button>
            </form>
        </div>
    `;
    document.body.appendChild(serviceModal);
}

function openServiceOrderModal(serviceName, servicePrice) {
    const selectedServiceSpan = document.getElementById('selectedServiceName');
    if (selectedServiceSpan) {
        selectedServiceSpan.innerHTML = `<strong>Вы выбрали:</strong> ${serviceName}<br><strong>Цена:</strong> ${servicePrice}`;
    }
    if (serviceModal) serviceModal.style.display = 'flex';
}

serviceCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
        if (e.target.closest('.service-price')) return;
        const title = card.querySelector('h3')?.innerText || 'Услуга';
        const price = card.querySelector('.service-price')?.innerText || 'по договорённости';
        openServiceOrderModal(title, price);
    });
});

const serviceOrderForm = document.getElementById('serviceOrderForm');
if (serviceOrderForm) {
    serviceOrderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = serviceOrderForm.querySelector('input[placeholder="Ваше имя"]')?.value || '';
        const phone = serviceOrderForm.querySelector('input[type="tel"]')?.value || '';
        
        if (!validatePhone(phone)) {
            showToast('Введите корректный номер телефона', 'error');
            return;
        }
        
        const email = serviceOrderForm.querySelector('input[placeholder="Email (необязательно)"]')?.value || '';
        const comment = serviceOrderForm.querySelector('textarea')?.value || '';
        const serviceInfo = document.getElementById('selectedServiceName')?.innerText || '';
        
        const message = `🛠️ ЗАКАЗ УСЛУГИ\n\n${serviceInfo}\n\n👤 Имя: ${name}\n📞 Телефон: ${phone}\n📧 Email: ${email || 'Не указан'}\n📝 Комментарий: ${comment}\n\n⏰ ${new Date().toLocaleString()}`;
        
        const sent = await sendToTelegram(message);
        
        if (sent) {
            showToast(`Спасибо, ${name}! Заявка принята.`, 'success');
            saveOrder({
                id: `order_${Date.now()}`,
                type: 'Заказ услуги',
                name,
                phone,
                email: email || '',
                comment,
                serviceInfo,
                createdAt: new Date().toISOString()
            });
            serviceOrderForm.reset();
            if (serviceModal) serviceModal.style.display = 'none';
        } else {
            showToast('Ошибка отправки. Позвоните нам.', 'error');
        }
    });
}

const closeServiceModal = document.querySelector('#serviceOrderModal .modal-close');
if (closeServiceModal) {
    closeServiceModal.addEventListener('click', () => {
        if (serviceModal) serviceModal.style.display = 'none';
    });
}

// ========== БРЕНДЫ ==========
const modelsDatabase = {
    'HP': ['LaserJet Pro M404dn', 'LaserJet M234sdw', 'Color LaserJet MFP M281fdw', 'DeskJet 2755', 'OfficeJet Pro 9015e'],
    'Canon': ['PIXMA G3411', 'MAXIFY GX6040', 'LBP 6030', 'MF 3010', 'i-SENSYS MF445dw'],
    'Xerox': ['Phaser 3020', 'WorkCentre 3025', 'VersaLink B405', 'PrimaLink B9070', 'WorkCentre 6515'],
    'Epson': ['L8050', 'L11050', 'WorkForce Pro WF-3820', 'EcoTank L3250', 'EcoTank L5290'],
    'Brother': ['HL-1212WR', 'DCP-1612WR', 'MFC-L2710DW', 'HL-L2350DW', 'DCP-L2520DWR'],
    'Kyocera': ['ECOSYS MA2100cx', 'ECOSYS P2040dw', 'ECOSYS M2635dw', 'TASKalfa 3212i', 'ECOSYS FS-1040'],
    'Samsung': ['Xpress SL-M2020', 'Xpress SL-M2070', 'MultiXpress SL-K7400LX', 'Xpress SL-C430', 'MultiXpress SL-X4300LX'],
    'Pantum': ['P2500W', 'M6550NW', 'P3300DN', 'M7100DN', 'BM5100ADW']
};

let brandModal = document.getElementById('brandModelModal');

if (!brandModal) {
    brandModal = document.createElement('div');
    brandModal.id = 'brandModelModal';
    brandModal.className = 'modal';
    brandModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <span class="modal-close">&times;</span>
            <h2 id="brandModalTitle">Выберите модель</h2>
            <p id="brandModalSubtitle" style="color: #666; margin-bottom: 20px;"></p>
            <div id="modelsList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; max-height: 400px; overflow-y: auto; margin-bottom: 20px;"></div>
            <div style="margin-top: 20px; text-align: center;">
                <button id="otherModelBtn" class="btn btn-secondary" style="margin-right: 10px;">Моей модели нет</button>
                <button id="closeModelModal" class="btn btn-primary">Закрыть</button>
            </div>
        </div>
    `;
    document.body.appendChild(brandModal);
}

function showBrandModels(brandName) {
    const models = modelsDatabase[brandName] || ['Другие модели уточняйте по телефону'];
    
    const modalTitle = document.getElementById('brandModalTitle');
    const modalSubtitle = document.getElementById('brandModalSubtitle');
    const modelsContainer = document.getElementById('modelsList');
    
    if (modalTitle) modalTitle.innerHTML = `📋 ${brandName} — выберите модель`;
    if (modalSubtitle) modalSubtitle.innerHTML = `Нажмите на модель, чтобы оставить заявку`;
    
    if (modelsContainer) {
        modelsContainer.innerHTML = '';
        models.forEach(model => {
            const modelBtn = document.createElement('button');
            modelBtn.textContent = model;
            modelBtn.style.cssText = `padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; text-align: left; transition: all 0.3s; font-size: 14px;`;
            modelBtn.addEventListener('mouseenter', () => { modelBtn.style.background = '#0d9488'; modelBtn.style.color = 'white'; modelBtn.style.borderColor = '#0d9488'; });
            modelBtn.addEventListener('mouseleave', () => { modelBtn.style.background = '#f8fafc'; modelBtn.style.color = '#333'; modelBtn.style.borderColor = '#e2e8f0'; });
            modelBtn.addEventListener('click', () => {
                if (brandModal) brandModal.style.display = 'none';
                openOrderFormForDevice(brandName, model);
            });
            modelsContainer.appendChild(modelBtn);
        });
    }
    if (brandModal) brandModal.style.display = 'flex';
}

async function openOrderFormForDevice(brand, model) {
    let orderModal = document.getElementById('deviceOrderModal');
    
    if (!orderModal) {
        orderModal = document.createElement('div');
        orderModal.id = 'deviceOrderModal';
        orderModal.className = 'modal';
        orderModal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <h2>Заявка на ремонт</h2>
                <div id="deviceInfo" style="background: #f0fdfa; padding: 15px; border-radius: 10px; margin: 15px 0; border-left: 4px solid #0d9488;"></div>
                <form id="deviceOrderForm">
                    <input type="text" placeholder="Ваше имя" required>
                    <input type="tel" placeholder="Телефон" required>
                    <input type="email" placeholder="Email (необязательно)">
                    <textarea id="problemDesc" placeholder="Опишите проблему" rows="3"></textarea>
                    <button type="submit" class="btn btn-primary">Отправить заявку</button>
                </form>
            </div>
        `;
        document.body.appendChild(orderModal);
        attachPhoneMask(orderModal.querySelector('input[type="tel"]'));
    }
    
    const deviceInfoDiv = document.getElementById('deviceInfo');
    if (deviceInfoDiv) {
        deviceInfoDiv.innerHTML = `<strong>📟 Устройство:</strong> ${brand} ${model}`;
    }
    
    const form = document.getElementById('deviceOrderForm');
    const closeBtn = orderModal.querySelector('.modal-close');
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = form.querySelector('input[placeholder="Ваше имя"]')?.value || '';
        const phone = form.querySelector('input[type="tel"]')?.value || '';
        
        if (!validatePhone(phone)) {
            showToast('Введите корректный номер телефона', 'error');
            return;
        }
        
        const email = form.querySelector('input[placeholder="Email (необязательно)"]')?.value || '';
        const problem = document.getElementById('problemDesc')?.value || '';
        
        const message = `🔧 ЗАЯВКА НА РЕМОНТ\n\n📟 Устройство: ${brand} ${model}\n👤 Имя: ${name}\n📞 Телефон: ${phone}\n📧 Email: ${email || 'Не указан'}\n📝 Проблема: ${problem}\n\n⏰ ${new Date().toLocaleString()}`;
        
        const sent = await sendToTelegram(message);
        
        if (sent) {
            showToast(`Спасибо, ${name}! Заявка принята.`, 'success');
            saveOrder({
                id: `order_${Date.now()}`,
                type: 'Заявка на ремонт',
                name,
                phone,
                email: email || '',
                device: `${brand} ${model}`,
                problem,
                createdAt: new Date().toISOString()
            });
            form.reset();
            if (orderModal) orderModal.style.display = 'none';
        } else {
            showToast('Ошибка отправки. Позвоните нам.', 'error');
        }
    };
    
    form.onsubmit = handleSubmit;
    
    if (closeBtn) {
        closeBtn.onclick = () => { if (orderModal) orderModal.style.display = 'none'; };
    }
    
    if (orderModal) orderModal.style.display = 'flex';
}

document.querySelectorAll('.brand').forEach(brand => {
    brand.style.cursor = 'pointer';
    brand.addEventListener('click', () => showBrandModels(brand.textContent.trim()));
});

const otherModelBtn = document.getElementById('otherModelBtn');
if (otherModelBtn) {
    otherModelBtn.addEventListener('click', () => {
        if (brandModal) brandModal.style.display = 'none';
        openOrderFormForDevice('Другая марка', 'Модель не указана');
    });
}

const closeModelModal = document.getElementById('closeModelModal');
if (closeModelModal) {
    closeModelModal.addEventListener('click', () => {
        if (brandModal) brandModal.style.display = 'none';
    });
}

const brandModalClose = document.querySelector('#brandModelModal .modal-close');
if (brandModalClose) {
    brandModalClose.addEventListener('click', () => {
        if (brandModal) brandModal.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    if (e.target === serviceModal) {
        if (serviceModal) serviceModal.style.display = 'none';
    }
    if (e.target === brandModal) {
        if (brandModal) brandModal.style.display = 'none';
    }
});

// ========== КНОПКА "НАВЕРХ" ==========
const scrollToTopBtn = document.getElementById('scrollToTop');
if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });
    
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ========== КАРТА ==========
const MAP_CONFIG = {
    lat: 55.751574,
    lng: 37.673856,
    zoom: 16,
    title: 'ТехноСервис+',
    address: 'г. Москва, ул. Техническая, д. 15, стр. 2',
    hint: 'м. Авиамоторная, 5 мин пешком'
};

let mapInstance = null;
let mapInitStarted = false;

function getMapContainer() {
    return document.getElementById('map');
}

function setMapLoading(message) {
    const el = getMapContainer();
    if (!el || el.dataset.mapReady === 'true') return;
    el.innerHTML = `<div class="map-loading">${message}</div>`;
}

function loadScript(src) {
    return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
}

async function loadLeafletJS() {
    if (typeof L !== 'undefined') return true;
    const sources = [
        'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    ];
    for (const src of sources) {
        const ok = await loadScript(src);
        if (ok && typeof L !== 'undefined') return true;
    }
    return false;
}

function createLeafletMarkerIcon() {
    return L.divIcon({
        html: `<div style="
            width: 36px; height: 36px;
            background: linear-gradient(135deg, #0d9488, #06b6d4);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 3px 12px rgba(13,148,136,0.5);
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; color: white;
        ">🖨️</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -22]
    });
}

function bindLeafletMarker(map) {
    const { lat, lng, title, address, hint } = MAP_CONFIG;
    L.marker([lat, lng], { icon: createLeafletMarkerIcon() })
        .addTo(map)
        .bindPopup(`
            <div style="font-family: inherit; min-width: 180px;">
                <strong style="font-size: 15px;">${title}</strong><br>
                <span style="color: #475569; font-size: 13px;">
                    ${address}<br>${hint}
                </span>
            </div>
        `)
        .openPopup();
}

function initLeafletMap() {
    const container = getMapContainer();
    if (!container || typeof L === 'undefined') return false;

    container.innerHTML = '';
    container.dataset.mapReady = 'true';

    const { lat, lng, zoom } = MAP_CONFIG;
    const map = L.map(container, {
        center: [lat, lng],
        zoom,
        scrollWheelZoom: false,
        attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
        maxZoom: 19
    }).addTo(map);

    map.attributionControl?.remove();
    bindLeafletMarker(map);

    mapInstance = map;
    const refresh = () => {
        try {
            map.invalidateSize({ animate: false });
        } catch (_) { /* ignore */ }
    };
    setTimeout(refresh, 100);
    setTimeout(refresh, 500);
    window.addEventListener('resize', refresh);
    return true;
}

function loadYandexMapsApi(apiKey) {
    return new Promise((resolve) => {
        if (window.ymaps && window.ymaps.ready) {
            resolve(true);
            return;
        }
        const src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
        if (document.querySelector(`script[src^="https://api-maps.yandex.ru"]`)) {
            const wait = setInterval(() => {
                if (window.ymaps) {
                    clearInterval(wait);
                    resolve(true);
                }
            }, 100);
            setTimeout(() => {
                clearInterval(wait);
                resolve(Boolean(window.ymaps));
            }, 8000);
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
}

function initYandexMap(apiKey) {
    const container = getMapContainer();
    if (!container || !apiKey) return Promise.resolve(false);

    return loadYandexMapsApi(apiKey).then((loaded) => {
        if (!loaded || !window.ymaps) return false;

        return new Promise((resolve) => {
            window.ymaps.ready(() => {
                try {
                    container.innerHTML = '';
                    container.dataset.mapReady = 'true';
                    const { lat, lng, zoom, title, address, hint } = MAP_CONFIG;
                    const map = new window.ymaps.Map(container, {
                        center: [lat, lng],
                        zoom,
                        controls: ['zoomControl', 'fullscreenControl']
                    });
                    const placemark = new window.ymaps.Placemark(
                        [lat, lng],
                        {
                            balloonContentHeader: title,
                            balloonContentBody: `${address}<br>${hint}`
                        },
                        { preset: 'islands#greenDotIcon' }
                    );
                    map.geoObjects.add(placemark);
                    placemark.balloon.open();
                    mapInstance = map;
                    resolve(true);
                } catch (e) {
                    console.error('Yandex Maps init error:', e);
                    resolve(false);
                }
            });
        });
    });
}

function initYandexWidgetFallback() {
    const container = getMapContainer();
    if (!container) return false;

    const { lat, lng, zoom, title } = MAP_CONFIG;
    const ll = `${lng},${lat}`;
    const pt = `${lng},${lat},pm2rdm`;
    const params = new URLSearchParams({
        ll,
        z: String(zoom),
        pt,
        l: 'map',
        text: title
    });

    container.innerHTML = '';
    container.dataset.mapReady = 'true';

    const iframe = document.createElement('iframe');
    iframe.src = `https://yandex.ru/map-widget/v1/?${params.toString()}`;
    iframe.title = 'Карта — ТехноСервис+';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    container.appendChild(iframe);
    return true;
}

async function initSiteMap() {
    if (mapInitStarted) return;
    mapInitStarted = true;

    const container = getMapContainer();
    if (!container) return;

    setMapLoading('Загрузка карты…');

    const yandexKey = (SITE_CONFIG.yandexMapsApiKey || '').trim();
    if (yandexKey) {
        const yandexOk = await initYandexMap(yandexKey);
        if (yandexOk) return;
    }

    const leafletLoaded = await loadLeafletJS();
    if (leafletLoaded && initLeafletMap()) return;

    initYandexWidgetFallback();
}

function setupMapLazyInit() {
    const container = getMapContainer();
    if (!container) return;

    const start = () => initSiteMap();

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    observer.disconnect();
                    start();
                }
            },
            { rootMargin: '120px', threshold: 0.05 }
        );
        observer.observe(container);
    } else {
        start();
    }

    window.addEventListener('load', () => {
        if (container.dataset.mapReady !== 'true') start();
    });
}

setupMapLazyInit();

// ========== ВХОД И РЕГИСТРАЦИЯ (localStorage на этом ПК) ==========
const AUTH_USERS_KEY = 'technoservice_users';
const AUTH_SESSION_KEY = 'technoservice_current_user';
const ADMIN_EMAIL = 'admin@technoservice.ru';
const ADMIN_PASSWORD = 'admin123';

function getStoredUsers() {
    try {
        const raw = localStorage.getItem(AUTH_USERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveStoredUsers(users) {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
    const userId = localStorage.getItem(AUTH_SESSION_KEY);
    if (!userId) return null;
    return getStoredUsers().find((u) => u.id === userId) || null;
}

function setCurrentUser(userId) {
    if (userId) {
        localStorage.setItem(AUTH_SESSION_KEY, userId);
    } else {
        localStorage.removeItem(AUTH_SESSION_KEY);
    }
}

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function isAdmin(user) {
    return Boolean(user && user.role === 'admin');
}

function ensureAdminAccount() {
    const users = getStoredUsers();
    let admin = users.find((u) => u.email === ADMIN_EMAIL);

    if (!admin) {
        admin = {
            id: 'user_admin',
            name: 'Администратор',
            email: ADMIN_EMAIL,
            phone: '',
            password: ADMIN_PASSWORD,
            role: 'admin',
            registeredAt: new Date().toISOString()
        };
        users.push(admin);
        saveStoredUsers(users);
        return;
    }

    if (admin.role !== 'admin' || admin.password !== ADMIN_PASSWORD) {
        admin.role = 'admin';
        admin.password = ADMIN_PASSWORD;
        admin.name = admin.name || 'Администратор';
        saveStoredUsers(users);
    }
}

function registerUser({ name, email, phone, password }) {
    const users = getStoredUsers();
    const normalizedEmail = normalizeEmail(email);

    if (normalizedEmail === ADMIN_EMAIL) {
        return { ok: false, error: 'Этот email зарезервирован для администратора' };
    }

    if (users.some((u) => u.email === normalizedEmail)) {
        return { ok: false, error: 'Пользователь с таким email уже зарегистрирован' };
    }

    if (password.length < 6) {
        return { ok: false, error: 'Пароль должен быть не короче 6 символов' };
    }

    const user = {
        id: `user_${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password,
        registeredAt: new Date().toISOString()
    };

    users.push(user);
    saveStoredUsers(users);
    setCurrentUser(user.id);
    return { ok: true, user };
}

function loginUser(email, password) {
    const normalizedEmail = normalizeEmail(email);
    const user = getStoredUsers().find(
        (u) => u.email === normalizedEmail && u.password === password
    );

    if (!user) {
        return { ok: false, error: 'Неверный email или пароль' };
    }

    if (user.blocked && !isAdmin(user)) {
        return {
            ok: false,
            error: 'Аккаунт заблокирован за нарушение правил (нецензурная лексика в отзыве).'
        };
    }

    setCurrentUser(user.id);
    return { ok: true, user };
}

function logoutUser() {
    setCurrentUser(null);
}

function updateAuthUI() {
    const guestBlock = document.getElementById('authGuest');
    const loggedInBlock = document.getElementById('authLoggedIn');
    const profileBtn = document.getElementById('profileBtn');
    const user = getCurrentUser();

    if (!guestBlock || !loggedInBlock) return;

    if (user) {
        guestBlock.hidden = true;
        guestBlock.style.display = 'none';
        loggedInBlock.hidden = false;
        loggedInBlock.style.display = 'flex';
        if (profileBtn) {
            profileBtn.textContent = isAdmin(user) ? 'Панель админа' : (user.name || user.email);
            profileBtn.title = isAdmin(user) ? 'Панель администратора' : 'Личный кабинет';
        }
        prefillFormsForUser(user);
    } else {
        guestBlock.hidden = false;
        guestBlock.style.display = 'flex';
        loggedInBlock.hidden = true;
        loggedInBlock.style.display = 'none';
    }

    applyReviewFormBlockedState();
}

function prefillFormsForUser(user) {
    document.querySelectorAll('input[placeholder="Ваше имя"]').forEach((input) => {
        if (!input.value && user.name) input.value = user.name;
    });
    document.querySelectorAll('input[type="tel"]').forEach((input) => {
        if (!input.value && user.phone) {
            input.value = formatPhoneMask(user.phone);
        }
    });
}

function openModal(modal) {
    if (modal) modal.style.display = 'flex';
}

function closeModal(modal) {
    if (modal) modal.style.display = 'none';
}

function initAuthModals() {
    if (document.getElementById('loginModal')) return;

    const loginModal = document.createElement('div');
    loginModal.id = 'loginModal';
    loginModal.className = 'modal';
    loginModal.innerHTML = `
        <div class="modal-content auth-modal-content">
            <span class="modal-close" data-close-modal>&times;</span>
            <h2>Вход в аккаунт</h2>
            <form id="loginForm">
                <input type="email" name="email" placeholder="Email" required autocomplete="email">
                <input type="password" name="password" placeholder="Пароль" required autocomplete="current-password">
                <button type="submit" class="btn btn-primary">Войти</button>
            </form>
            <p class="auth-switch">Нет аккаунта? <a href="#" id="switchToRegister">Зарегистрируйтесь</a></p>
            <p class="auth-form-note">Данные хранятся только в браузере на этом компьютере (localStorage).</p>
        </div>
    `;

    const registerModal = document.createElement('div');
    registerModal.id = 'registerModal';
    registerModal.className = 'modal';
    registerModal.innerHTML = `
        <div class="modal-content auth-modal-content">
            <span class="modal-close" data-close-modal>&times;</span>
            <h2>Регистрация</h2>
            <form id="registerForm">
                <input type="text" name="name" placeholder="Имя" required autocomplete="name">
                <input type="email" name="email" placeholder="Email" required autocomplete="email">
                <input type="tel" name="phone" placeholder="+7 (___) ___-__-__" autocomplete="tel">
                <input type="password" name="password" placeholder="Пароль (мин. 6 символов)" required minlength="6" autocomplete="new-password">
                <input type="password" name="passwordConfirm" placeholder="Повторите пароль" required minlength="6" autocomplete="new-password">
                <button type="submit" class="btn btn-primary">Зарегистрироваться</button>
            </form>
            <p class="auth-switch">Уже есть аккаунт? <a href="#" id="switchToLogin">Войдите</a></p>
            <p class="auth-form-note">Аккаунт сохраняется локально в этом браузере. На другом ПК или в другом браузере нужна новая регистрация.</p>
        </div>
    `;

    const profileModal = document.createElement('div');
    profileModal.id = 'profileModal';
    profileModal.className = 'modal';
    profileModal.innerHTML = `
        <div class="modal-content auth-modal-content">
            <span class="modal-close" data-close-modal>&times;</span>
            <h2>Личный кабинет</h2>
            <div id="profileContent" class="profile-info"></div>
            <button type="button" class="btn btn-secondary" id="logoutBtn" style="width:100%;margin-top:16px;">Выйти из аккаунта</button>
        </div>
    `;

    document.body.appendChild(loginModal);
    document.body.appendChild(registerModal);
    document.body.appendChild(profileModal);

    attachPhoneMask(registerModal.querySelector('input[name="phone"]'));

    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
        btn.addEventListener('click', () => {
            closeModal(btn.closest('.modal'));
        });
    });

    [loginModal, registerModal, profileModal].forEach((modal) => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    document.getElementById('loginBtn')?.addEventListener('click', () => {
        closeModal(registerModal);
        openModal(loginModal);
    });

    document.getElementById('registerBtn')?.addEventListener('click', () => {
        closeModal(loginModal);
        openModal(registerModal);
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        logoutUser();
        updateAuthUI();
        closeModal(loginModal);
        closeModal(registerModal);
        closeModal(profileModal);
        if (adminModal) closeModal(adminModal);
        if (adminEditModal) closeModal(adminEditModal);
        showToast('Вы вышли из аккаунта', 'success');
    });

    document.getElementById('switchToRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(loginModal);
        openModal(registerModal);
    });

    document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(registerModal);
        openModal(loginModal);
    });

    document.getElementById('profileBtn')?.addEventListener('click', () => {
        const user = getCurrentUser();
        if (!user) return;

        if (isAdmin(user)) {
            openAdminPanel();
            return;
        }

        const box = document.getElementById('profileContent');
        if (!box) return;

        const registered = user.registeredAt
            ? new Date(user.registeredAt).toLocaleString('ru-RU')
            : '—';

        const blockedHtml = user.blocked
            ? `<p style="color:#ef4444;margin-top:12px;padding:10px;background:#fef2f2;border-radius:8px;"><strong>Заблокирован</strong><br>Причина: ${escapeHtml(user.blockReason || 'Нарушение правил')}</p>`
            : '';

        box.innerHTML = `
            <p><strong>Имя:</strong> ${escapeHtml(user.name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(user.email)}</p>
            <p><strong>Телефон:</strong> ${escapeHtml(user.phone || 'не указан')}</p>
            <p><strong>Дата регистрации:</strong> ${registered}</p>
            ${blockedHtml}
        `;
        openModal(profileModal);
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        logoutUser();
        closeModal(profileModal);
        updateAuthUI();
        showToast('Вы вышли из аккаунта', 'success');
    });

    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const email = form.email.value;
        const password = form.password.value;
        const result = loginUser(email, password);

        if (result.ok) {
            form.reset();
            closeModal(loginModal);
            updateAuthUI();
            showToast(`Добро пожаловать, ${result.user.name}!`, 'success');
        } else {
            showToast(result.error, 'error');
        }
    });

    document.getElementById('registerForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const password = form.password.value;
        const passwordConfirm = form.passwordConfirm.value;

        if (password !== passwordConfirm) {
            showToast('Пароли не совпадают', 'error');
            return;
        }

        if (form.phone.value && !validatePhone(form.phone.value)) {
            showToast('Введите номер полностью: +7 (___) ___-__-__', 'error');
            return;
        }

        const result = registerUser({
            name: form.name.value,
            email: form.email.value,
            phone: form.phone.value,
            password
        });

        if (result.ok) {
            form.reset();
            closeModal(registerModal);
            updateAuthUI();
            showToast(`Регистрация успешна! Добро пожаловать, ${result.user.name}!`, 'success');
        } else {
            showToast(result.error, 'error');
        }
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== ПАНЕЛЬ АДМИНИСТРАТОРА (отзывы, пользователи, заказы) ==========
let adminModal = null;
let adminEditModal = null;

function initAdminModals() {
    if (document.getElementById('adminModal')) return;

    adminModal = document.createElement('div');
    adminModal.id = 'adminModal';
    adminModal.className = 'modal';
    adminModal.innerHTML = `
        <div class="modal-content admin-modal-content">
            <span class="modal-close" data-close-admin>&times;</span>
            <h2>Панель администратора</h2>
            <div class="admin-tabs">
                <button class="admin-tab active" data-tab="reviews">Отзывы</button>
                <button class="admin-tab" data-tab="users">Пользователи</button>
                <button class="admin-tab" data-tab="orders">Заказы</button>
            </div>
            <div class="admin-tab-content active" id="adminTabReviews"></div>
            <div class="admin-tab-content" id="adminTabUsers"></div>
            <div class="admin-tab-content" id="adminTabOrders"></div>
            <p class="auth-form-note" style="margin-top:16px;">Вход: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}</p>
        </div>
    `;

    adminEditModal = document.createElement('div');
    adminEditModal.id = 'adminEditModal';
    adminEditModal.className = 'modal';
    adminEditModal.innerHTML = `
        <div class="modal-content admin-modal-content">
            <span class="modal-close" data-close-admin>&times;</span>
            <h2>Редактировать отзыв</h2>
            <form id="adminEditReviewForm" class="admin-edit-form">
                <input type="hidden" name="reviewId" id="adminReviewId">
                <label class="admin-label">Имя клиента</label>
                <input type="text" name="name" required>
                <label class="admin-label">Оценка</label>
                <select name="rating" required>
                    <option value="5">5 — отлично</option>
                    <option value="4">4 — хорошо</option>
                    <option value="3">3 — нормально</option>
                    <option value="2">2 — плохо</option>
                    <option value="1">1 — очень плохо</option>
                </select>
                <label class="admin-label">Текст отзыва</label>
                <textarea name="text" rows="4" required></textarea>
                <label class="admin-label">Дата</label>
                <input type="date" name="date" required>
                <div class="admin-edit-actions">
                    <button type="button" class="btn btn-secondary" id="adminEditCancelBtn">Отмена</button>
                    <button type="submit" class="btn btn-primary">Сохранить</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(adminModal);
    document.body.appendChild(adminEditModal);

    adminModal.querySelectorAll('[data-close-admin]').forEach((btn) => {
        btn.addEventListener('click', () => closeModal(adminModal));
    });

    adminEditModal.querySelectorAll('[data-close-admin]').forEach((btn) => {
        btn.addEventListener('click', () => closeModal(adminEditModal));
    });

    adminModal.addEventListener('click', (e) => {
        if (e.target === adminModal) closeModal(adminModal);
    });

    adminEditModal.addEventListener('click', (e) => {
        if (e.target === adminEditModal) closeModal(adminEditModal);
    });

    document.getElementById('adminEditCancelBtn')?.addEventListener('click', () => {
        closeModal(adminEditModal);
        openModal(adminModal);
    });

    document.getElementById('adminEditReviewForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const reviewId = form.reviewId.value;
        const name = form.name.value.trim();
        const rating = form.rating.value;
        const text = form.text.value.trim();
        const dateValue = form.date.value;

        if (!name || !text || !dateValue) {
            showToast('Заполните все поля', 'error');
            return;
        }

        const moderation = validateReviewContent(name, text, { allowAdmin: true });
        if (!moderation.ok) {
            showToast(`${moderation.message}. Сохранение отменено.`, 'error');
            return;
        }

        const createdAt = new Date(dateValue + 'T12:00:00').toISOString();
        const updated = updateStoredReview(reviewId, { name, rating, text, createdAt });

        if (!updated) {
            showToast('Отзыв не найден', 'error');
            return;
        }

        renderAllReviews();
        closeModal(adminEditModal);
        openAdminPanel('reviews');
        showToast('Отзыв обновлён', 'success');
    });

    adminModal.querySelectorAll('.admin-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            adminModal.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
            adminModal.querySelectorAll('.admin-tab-content').forEach((c) => c.classList.remove('active'));
            tab.classList.add('active');
            const content = document.getElementById(`adminTab${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`);
            if (content) content.classList.add('active');
            renderAdminTab(tab.dataset.tab);
        });
    });
}

function renderAdminTab(tabName) {
    if (tabName === 'reviews') renderAdminReviewsList();
    else if (tabName === 'users') renderAdminUsersList();
    else if (tabName === 'orders') renderAdminOrdersList();
}

function renderAdminReviewsList() {
    const list = document.getElementById('adminTabReviews');
    if (!list) return;

    const reviews = getStoredReviews().sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    if (!reviews.length) {
        list.innerHTML = '<p class="admin-empty">Отзывов пока нет</p>';
        return;
    }

    list.innerHTML = reviews.map((review) => {
        const preview = review.text.length > 90 ? `${review.text.slice(0, 90)}…` : review.text;
        const userInfo = review.userEmail
            ? `<span style="font-size:12px;color:#64748b;">от ${escapeHtml(review.userEmail)}${review.userId ? ' (ID: ' + escapeHtml(review.userId) + ')' : ''}</span>`
            : '<span style="font-size:12px;color:#94a3b8;">Гость (без аккаунта)</span>';
        return `
            <article class="admin-review-item" data-review-id="${escapeHtml(review.id)}">
                <div class="admin-review-item-head">
                    <strong>${escapeHtml(review.name)}</strong>
                    <span>${getRatingStars(review.rating)}</span>
                </div>
                <p class="admin-review-item-text">${escapeHtml(preview)}</p>
                <span class="admin-review-item-date">${escapeHtml(formatReviewDate(review.createdAt))}</span>
                <div style="margin-bottom:8px;">${userInfo}</div>
                <div class="admin-review-item-actions">
                    <button type="button" class="btn btn-primary btn-sm admin-edit-review-btn" data-id="${escapeHtml(review.id)}">Редактировать</button>
                    <button type="button" class="btn btn-secondary btn-sm admin-delete-review-btn" data-id="${escapeHtml(review.id)}">Удалить</button>
                </div>
            </article>
        `;
    }).join('');

    list.querySelectorAll('.admin-edit-review-btn').forEach((btn) => {
        btn.addEventListener('click', () => openAdminEditReview(btn.dataset.id));
    });

    list.querySelectorAll('.admin-delete-review-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const review = getReviewById(btn.dataset.id);
            if (!review) return;

            const confirmed = confirm(`Удалить отзыв от «${review.name}»?`);
            if (!confirmed) return;

            deleteStoredReview(btn.dataset.id);
            renderAllReviews();
            renderAdminReviewsList();
            showToast('Отзыв удалён', 'success');
        });
    });
}

function renderAdminUsersList() {
    const list = document.getElementById('adminTabUsers');
    if (!list) return;

    const users = getStoredUsers().filter((u) => u.role !== 'admin');

    if (!users.length) {
        list.innerHTML = '<p class="admin-empty">Зарегистрированных пользователей нет</p>';
        return;
    }

    list.innerHTML = users.map((user) => `
        <div class="admin-user-item">
            <div class="admin-user-item-head">
                <strong>${escapeHtml(user.name || 'Без имени')}</strong>
                <span style="font-size:12px;color:#94a3b8;">${escapeHtml(user.registeredAt ? new Date(user.registeredAt).toLocaleDateString() : '')}</span>
            </div>
            <div class="admin-user-info">
                Email: ${escapeHtml(user.email)}<br>
                Телефон: ${escapeHtml(user.phone || '—')}
                ${user.blocked ? '<br><span style="color:#ef4444;">Заблокирован</span>' : ''}
            </div>
        </div>
    `).join('');
}

function renderAdminOrdersList() {
    const list = document.getElementById('adminTabOrders');
    if (!list) return;

    const orders = getStoredOrders().sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    if (!orders.length) {
        list.innerHTML = '<p class="admin-empty">Заказов пока нет</p>';
        return;
    }

    list.innerHTML = orders.map((order) => `
        <div class="admin-order-item">
            <div class="admin-order-item-head">
                <strong>${escapeHtml(order.type)}</strong>
                <span style="font-size:12px;color:#94a3b8;">${new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div class="admin-order-info">
                Имя: ${escapeHtml(order.name)}<br>
                Телефон: ${escapeHtml(order.phone)}${order.email ? '<br>Email: ' + escapeHtml(order.email) : ''}${order.device ? '<br>Устройство: ' + escapeHtml(order.device) : ''}${order.serviceInfo ? '<br>Услуга: ' + escapeHtml(order.serviceInfo) : ''}${order.problem ? '<br>Проблема: ' + escapeHtml(order.problem) : ''}${order.comment ? '<br>Комментарий: ' + escapeHtml(order.comment) : ''}
            </div>
            <div class="admin-order-item-actions">
                <button type="button" class="btn btn-secondary btn-sm admin-delete-order-btn" data-id="${escapeHtml(order.id)}">Удалить</button>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('.admin-delete-order-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (!confirm('Удалить заказ?')) return;
            deleteStoredOrder(btn.dataset.id);
            renderAdminOrdersList();
            showToast('Заказ удалён', 'success');
        });
    });
}

function openAdminPanel(tab) {
    if (!adminModal) initAdminModals();
    const targetTab = tab || 'reviews';
    adminModal.querySelectorAll('.admin-tab').forEach((t) => {
        t.classList.toggle('active', t.dataset.tab === targetTab);
    });
    adminModal.querySelectorAll('.admin-tab-content').forEach((c) => {
        c.classList.toggle('active', c.id === `adminTab${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`);
    });
    renderAdminTab(targetTab);
    openModal(adminModal);
}

function openAdminEditReview(reviewId) {
    const review = getReviewById(reviewId);
    if (!review || !adminEditModal) return;

    const form = document.getElementById('adminEditReviewForm');
    if (!form) return;

    const date = new Date(review.createdAt);
    const dateInput = date.toISOString().slice(0, 10);

    form.reviewId.value = review.id;
    form.name.value = review.name;
    form.rating.value = String(review.rating || 5);
    form.text.value = review.text;
    form.date.value = dateInput;

    closeModal(adminModal);
    openModal(adminEditModal);
}

function initAuth() {
    ensureAdminAccount();

    const sessionUser = getCurrentUser();
    if (sessionUser && sessionUser.blocked && !isAdmin(sessionUser)) {
        setCurrentUser(null);
    }

    initAuthModals();
    initAdminModals();
    updateAuthUI();
}

document.addEventListener('DOMContentLoaded', initAuth);

// ========== КОМАНДА (страница «О компании») ==========
const TEAM_MEMBERS = {
    sokolov: {
        name: 'Алексей Соколов',
        role: 'Ведущий инженер',
        exp: 'Стаж 12 лет',
        avatar: '👨‍🔧',
        about: 'Руководит сложными ремонтами оргтехники и обучает молодых мастеров. Специализируется на диагностике печатных узлов и восстановлении копировальной техники.',
        specialization: 'Лазерные принтеры, копиры, прошивка и настройка сетевой печати',
        skills: ['HP', 'Canon', 'Xerox', 'Kyocera'],
        education: 'Московский колледж радиоэлектроники, повышение квалификации HP LaserJet',
        fact: 'Более 1800 успешно выполненных ремонтов'
    },
    volkova: {
        name: 'Мария Волкова',
        role: 'Специалист по МФУ',
        exp: 'Стаж 8 лет',
        avatar: '👩‍🔧',
        about: 'Эксперт по многофункциональным устройствам: печать, сканирование, копирование и fax-модули. Работает с офисной техникой любого объёма.',
        specialization: 'Ремонт МФУ, замена роликов, восстановление сканирующих модулей',
        skills: ['Canon', 'Epson', 'Brother', 'Samsung'],
        education: 'Сертификат Canon imageRUNNER, курсы по ремонту МФУ Epson',
        fact: 'Среднее время ремонта МФУ — 1–2 рабочих дня'
    },
    morozov: {
        name: 'Дмитрий Морозов',
        role: 'Мастер по принтерам',
        exp: 'Стаж 10 лет',
        avatar: '👨‍🔧',
        about: 'Занимается струйными и лазерными принтерами, заправкой и восстановлением картриджей. Выезжает к клиентам по Москве.',
        specialization: 'Струйные и лазерные принтеры, печатающие головки, заправка',
        skills: ['Epson', 'HP', 'Pantum', 'Xerox'],
        education: 'Профильные курсы Epson EcoTank и HP Ink Tank',
        fact: 'Проводит бесплатную первичную диагностику на выезде'
    },
    novikova: {
        name: 'Елена Новикова',
        role: 'Руководитель отдела',
        exp: 'Стаж 7 лет',
        avatar: '👩‍💼',
        about: 'Координирует работу сервиса, общается с клиентами и контролирует сроки ремонта. Помогает подобрать оптимальное решение по цене и срокам.',
        specialization: 'Приём заявок, гарантийное обслуживание, работа с корпоративными клиентами',
        skills: ['Сервис', 'Гарантия', 'Логистика', 'Консультации'],
        education: 'Высшее экономическое, управление сервисными центрами',
        fact: 'Лично курирует каждый срочный заказ'
    }
};

function openTeamModal(memberId) {
    const member = TEAM_MEMBERS[memberId];
    const modal = document.getElementById('teamModal');
    const body = document.getElementById('teamModalBody');
    if (!member || !modal || !body) return;

    const skillsHtml = member.skills
        .map((skill) => `<span class="team-modal-tag">${escapeHtml(skill)}</span>`)
        .join('');

    body.innerHTML = `
        <div class="team-modal-header">
            <div class="team-modal-avatar">${member.avatar}</div>
            <h2>${escapeHtml(member.name)}</h2>
            <p class="team-modal-role">${escapeHtml(member.role)}</p>
            <span class="team-modal-exp">${escapeHtml(member.exp)}</span>
        </div>
        <div class="team-modal-details">
            <p><strong>О специалисте:</strong> ${escapeHtml(member.about)}</p>
            <p><strong>Специализация:</strong> ${escapeHtml(member.specialization)}</p>
            <p><strong>Бренды:</strong></p>
            <div class="team-modal-tags">${skillsHtml}</div>
            <p><strong>Образование и сертификаты:</strong> ${escapeHtml(member.education)}</p>
            <p><strong>Достижения:</strong> ${escapeHtml(member.fact)}</p>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeTeamModal() {
    const modal = document.getElementById('teamModal');
    if (modal) modal.style.display = 'none';
}

function initTeamCards() {
    const cards = document.querySelectorAll('.team-card[data-member]');
    const modal = document.getElementById('teamModal');
    if (!cards.length || !modal) return;

    cards.forEach((card) => {
        const open = () => openTeamModal(card.dataset.member);

        card.addEventListener('click', open);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open();
            }
        });
    });

    document.getElementById('teamModalClose')?.addEventListener('click', closeTeamModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeTeamModal();
    });
}

document.addEventListener('DOMContentLoaded', initTeamCards);

// ========== СЕРТИФИКАТЫ (страница «О компании») ==========
const CERTIFICATES = {
    hp: {
        brand: 'HP',
        brandColor: '#0096d6',
        title: 'Authorized Partner',
        fullTitle: 'Сертификат HP Authorized Partner',
        company: 'ТехноСервис+',
        number: 'HP-RU-MSK-2018-0042',
        issued: '15 марта 2018',
        validUntil: '31 декабря 2026',
        description: 'Подтверждает право на профессиональный ремонт и обслуживание принтеров и МФУ HP с использованием оригинальных запчастей.',
        scope: 'Диагностика, ремонт лазерных и струйных моделей, прошивка, настройка сети'
    },
    canon: {
        brand: 'Canon',
        brandColor: '#bc002d',
        title: 'Professional Service',
        fullTitle: 'Canon Professional Service',
        company: 'ТехноСервис+',
        number: 'CPS-RU-2019-1187',
        issued: '10 июня 2019',
        validUntil: '30 июня 2027',
        description: 'Сертификат официального сервисного партнёра Canon для ремонта МФУ и печатающей техники.',
        scope: 'Ремонт imageRUNNER, MAXIFY, PIXMA, замена узлов и профилактика'
    },
    xerox: {
        brand: 'Xerox',
        brandColor: '#d92228',
        title: 'Certified Center',
        fullTitle: 'Xerox Certified Center',
        company: 'ТехноСервис+',
        number: 'XCC-MOW-2020-056',
        issued: '22 сентября 2020',
        validUntil: '22 сентября 2026',
        description: 'Удостоверяет компетенции центра в ремонте копировальной техники и МФУ Xerox.',
        scope: 'Phaser, WorkCentre, VersaLink — ремонт механики и электроники'
    },
    epson: {
        brand: 'Epson',
        brandColor: '#10218b',
        title: 'Authorized Service',
        fullTitle: 'Epson Authorized Service',
        company: 'ТехноСервис+',
        number: 'EAS-RU-2021-3310',
        issued: '5 февраля 2021',
        validUntil: '5 февраля 2027',
        description: 'Разрешает обслуживание и ремонт принтеров Epson, включая модели EcoTank и WorkForce.',
        scope: 'Восстановление печатающих головок, ремонт подачи бумаги, заправка'
    }
};

function openCertModal(certId) {
    const cert = CERTIFICATES[certId];
    const modal = document.getElementById('certModal');
    const body = document.getElementById('certModalBody');
    if (!cert || !modal || !body) return;

    body.innerHTML = `
        <div class="cert-preview" style="border-color: ${cert.brandColor}">
            <div class="cert-preview-brand" style="color: ${cert.brandColor}">${escapeHtml(cert.brand)}</div>
            <div class="cert-preview-title">${escapeHtml(cert.title)}</div>
            <div class="cert-preview-company">${escapeHtml(cert.company)}</div>
            <div class="cert-preview-meta">
                <span><strong>№:</strong> ${escapeHtml(cert.number)}</span>
                <span><strong>Выдан:</strong> ${escapeHtml(cert.issued)}</span>
                <span><strong>Действует до:</strong> ${escapeHtml(cert.validUntil)}</span>
                <span><strong>Статус:</strong> Действителен</span>
            </div>
            <div class="cert-preview-stamp">🏅</div>
        </div>
        <div class="cert-details">
            <p><strong>${escapeHtml(cert.fullTitle)}</strong></p>
            <p>${escapeHtml(cert.description)}</p>
            <p><strong>Область применения:</strong> ${escapeHtml(cert.scope)}</p>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeCertModal() {
    const modal = document.getElementById('certModal');
    if (modal) modal.style.display = 'none';
}

function initCertificates() {
    const cards = document.querySelectorAll('.cert-card[data-cert]');
    const modal = document.getElementById('certModal');
    if (!cards.length || !modal) return;

    cards.forEach((card) => {
        const open = () => openCertModal(card.dataset.cert);

        card.addEventListener('click', open);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open();
            }
        });
    });

    document.getElementById('certModalClose')?.addEventListener('click', closeCertModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCertModal();
    });
}

document.addEventListener('DOMContentLoaded', initCertificates);

// ========== ПЛАВНОЕ ПОЯВЛЕНИЕ ЭЛЕМЕНТОВ ПРИ СКРОЛЛЕ ==========

// Функция для проверки видимости элемента
function isElementInViewport(el, offset = 100) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top <= windowHeight - offset && rect.bottom >= 0;
}

// Добавляем классы анимации ко всем элементам
function addAnimationClasses() {
    // Секции для анимации
    const sections = [
        { selector: '.services .section-title', class: 'section-title' },
        { selector: '.services .section-subtitle', class: 'section-subtitle' },
        { selector: '.service-card', class: 'fade-up' },
        { selector: '.brand', class: 'scale-up' },
        { selector: '.advantages .section-title', class: 'section-title' },
        { selector: '.advantage', class: 'fade-up' },
        { selector: '.devices .section-title', class: 'section-title' },
        { selector: '.device-category', class: 'fade-left' },
        { selector: '.reviews .section-title', class: 'section-title' },
        { selector: '.reviews .section-subtitle', class: 'section-subtitle' },
        { selector: '.review-card', class: 'fade-up' },
        { selector: '.reviews-add', class: 'fade-up' },
        { selector: '.contacts .section-title', class: 'section-title' },
        { selector: '.contacts-info', class: 'fade-right' },
        { selector: '.contact-form', class: 'fade-left' },
        { selector: '.map-container', class: 'fade-up' }
    ];
    
    // Для страницы about.html
    const aboutSections = [
        { selector: '.about-hero h1', class: 'fade-up' },
        { selector: '.about-hero p', class: 'fade-up delay-1' },
        { selector: '.about-text', class: 'fade-left' },
        { selector: '.about-stats', class: 'fade-right' },
        { selector: '.about-mission h2', class: 'section-title' },
        { selector: '.mission-item', class: 'scale-up' },
        { selector: '.about-team h2', class: 'section-title' },
        { selector: '.team-card', class: 'fade-up' },
        { selector: '.about-certificates h2', class: 'section-title' },
        { selector: '.cert-card', class: 'scale-up' }
    ];
    
    // Объединяем секции
    const allSections = [...sections, ...aboutSections];
    
    allSections.forEach(item => {
        const elements = document.querySelectorAll(item.selector);
        elements.forEach(el => {
            if (!el.classList.contains(item.class)) {
                // Убираем существующие классы анимации
                const existingClasses = ['fade-up', 'fade-left', 'fade-right', 'scale-up', 'section-title', 'section-subtitle'];
                existingClasses.forEach(cls => el.classList.remove(cls));
                el.classList.add(item.class);
            }
        });
    });
}

// Функция для проверки и показа элементов
function checkVisibility() {
    // Анимируем заголовки секций
    document.querySelectorAll('.section-title, .section-subtitle').forEach(el => {
        if (isElementInViewport(el, 100)) {
            el.classList.add('visible');
        }
    });
    
    // Анимируем карточки услуг
    document.querySelectorAll('.service-card').forEach((el, index) => {
        if (isElementInViewport(el, 100)) {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 50);
        }
    });
    
    // Анимируем бренды
    document.querySelectorAll('.brand').forEach((el, index) => {
        if (isElementInViewport(el, 100)) {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 30);
        }
    });
    
    // Анимируем преимущества
    document.querySelectorAll('.advantage').forEach((el, index) => {
        if (isElementInViewport(el, 100)) {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 50);
        }
    });
    
    // Анимируем категории устройств
    document.querySelectorAll('.device-category').forEach((el, index) => {
        if (isElementInViewport(el, 100)) {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 100);
        }
    });
    
    // Анимируем отзывы
    document.querySelectorAll('.review-card').forEach((el, index) => {
        if (isElementInViewport(el, 100)) {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 80);
        }
    });
    
    // Анимируем блок добавления отзыва
    document.querySelectorAll('.reviews-add').forEach(el => {
        if (isElementInViewport(el, 100)) {
            el.classList.add('visible');
        }
    });
    
    // Анимируем контакты
    document.querySelectorAll('.contacts-info, .contact-form, .map-container').forEach(el => {
        if (isElementInViewport(el, 100)) {
            el.classList.add('visible');
        }
    });
    
    // Для страницы about.html
    document.querySelectorAll('.mission-item').forEach((el, index) => {
        if (isElementInViewport(el, 100)) {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 80);
        }
    });
    
    document.querySelectorAll('.team-card').forEach((el, index) => {
        if (isElementInViewport(el, 100)) {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 100);
        }
    });
    
    document.querySelectorAll('.cert-card').forEach((el, index) => {
        if (isElementInViewport(el, 100)) {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 60);
        }
    });
    
    document.querySelectorAll('.about-text, .about-stats').forEach(el => {
        if (isElementInViewport(el, 100)) {
            el.classList.add('visible');
        }
    });
}

// ========== ИЗМЕНЕНИЕ ШАПКИ ПРИ СКРОЛЛЕ ==========
function handleHeaderScroll() {
    const header = document.querySelector('.header');
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
}

// ========== ПАРАЛЛАКС ЭФФЕКТ ДЛЯ HERO ==========
function handleParallax() {
    const hero = document.querySelector('.hero');
    if (hero && window.scrollY < window.innerHeight) {
        const scrolled = window.scrollY;
        hero.style.backgroundPositionY = `${scrolled * 0.5}px`;
    }
}

// ========== АНИМАЦИЯ ЦИФР (СЧЁТЧИК) ==========
function animateNumbers() {
    const numberElements = document.querySelectorAll('.stat-number');
    
    numberElements.forEach(el => {
        const targetText = el.innerText;
        const targetNumber = parseInt(targetText);
        
        // Проверяем, что это число и анимация ещё не была применена
        if (!isNaN(targetNumber) && !el.hasAttribute('data-animated')) {
            const isInView = isElementInViewport(el, 200);
            
            if (isInView) {
                el.setAttribute('data-animated', 'true');
                let current = 0;
                const increment = targetNumber / 50; // Анимация за 50 кадров
                const duration = 1000; // 1 секунда
                const stepTime = duration / 50;
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= targetNumber) {
                        el.innerText = targetText;
                        clearInterval(timer);
                    } else {
                        el.innerText = Math.floor(current);
                    }
                }, stepTime);
            }
        }
    });
}

// ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========

// Инициализация анимаций при загрузке
document.addEventListener('DOMContentLoaded', () => {
    addAnimationClasses();
    
    // Небольшая задержка для первого показа
    setTimeout(() => {
        checkVisibility();
        animateNumbers();
    }, 100);
});

// Слушаем событие скролла с оптимизацией (throttle)
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(() => {
            checkVisibility();
            animateNumbers();
            handleHeaderScroll();
            handleParallax();
            ticking = false;
        });
        ticking = true;
    }
});

// Также проверяем при изменении размера окна
window.addEventListener('resize', () => {
    checkVisibility();
});

// Дополнительная проверка для мобильных устройств
window.addEventListener('touchmove', () => {
    checkVisibility();
});
// ========== ЦВЕТНОЙ СЛЕД ЗА КУРСОРОМ ==========

class CursorTrailEffect {
    constructor() {
        this.cursorX = 0;
        this.cursorY = 0;
        this.prevX = 0;
        this.prevY = 0;
        this.trails = [];
        this.particles = [];
        this.linePoints = [];
        this.isMoving = false;
        this.moveTimeout = null;
        this.lastTimestamp = 0;
        this.destroyed = false;
        this.animationFrameId = null;
        
        this.init();
    }
    
    init() {
        // Создаём элементы
        this.customCursor = document.createElement('div');
        this.customCursor.className = 'custom-cursor';
        
        this.gradientBg = document.createElement('div');
        this.gradientBg.className = 'cursor-gradient';
        
        document.body.appendChild(this.customCursor);
        document.body.appendChild(this.gradientBg);
        
        // Слушаем движение мыши
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseenter', this.onMouseEnter.bind(this));
        
        // Эффект при клике
        document.addEventListener('click', this.onClick.bind(this));
        
        // Эффекты при наведении на элементы
        this.addHoverEffects();
        
        // Анимация
        this.animate();
        
        // Скрываем стандартный курсор
        this.hideDefaultCursor();
    }
    
    onMouseMove(e) {
        this.prevX = this.cursorX;
        this.prevY = this.cursorY;
        this.cursorX = e.clientX;
        this.cursorY = e.clientY;
        this.isMoving = true;
        
        // Добавляем след с цветной полосой
        this.addTrail();
        
        // Добавляем частицы
        this.addParticle();
        
        // Обновляем линию
        this.updateLine();
        
        // Обновляем позицию курсора
        if (this.customCursor) {
            this.customCursor.style.left = this.cursorX + 'px';
            this.customCursor.style.top = this.cursorY + 'px';
        }
        
        if (this.gradientBg) {
            this.gradientBg.style.left = this.cursorX + 'px';
            this.gradientBg.style.top = this.cursorY + 'px';
        }
        
        // Таймер для остановки анимации
        clearTimeout(this.moveTimeout);
        this.moveTimeout = setTimeout(() => {
            this.isMoving = false;
        }, 100);
    }
    
    onMouseEnter(e) {
        this.cursorX = e.clientX;
        this.cursorY = e.clientY;
    }
    
    addTrail() {
        // Создаём цветной след
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.left = this.cursorX + 'px';
        trail.style.top = this.cursorY + 'px';
        
        // Случайный цвет следа
        const colors = ['#0d9488', '#14b8a6', '#06b6d4', '#22d3ee', '#5eead4'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        trail.style.background = `radial-gradient(circle, ${randomColor}, transparent)`;
        
        document.body.appendChild(trail);
        
        // Удаляем через анимацию
        setTimeout(() => {
            if (trail && trail.parentNode) {
                trail.remove();
            }
        }, 800);
    }
    
    addParticle() {
        // Создаём частицы (не слишком часто)
        if (Math.random() > 0.7) {
            const particle = document.createElement('div');
            particle.className = 'cursor-particle';
            particle.style.left = this.cursorX + 'px';
            particle.style.top = this.cursorY + 'px';
            
            // Случайное направление
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            
            // Случайный цвет
            const colors = ['#0d9488', '#14b8a6', '#22d3ee', '#06b6d4'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle && particle.parentNode) {
                    particle.remove();
                }
            }, 1000);
        }
    }
    
    updateLine() {
        // Создаём линию между предыдущей и текущей позицией
        if (this.prevX && this.prevY && Math.hypot(this.cursorX - this.prevX, this.cursorY - this.prevY) > 5) {
            const line = document.createElement('div');
            line.className = 'cursor-line';
            
            const dx = this.cursorX - this.prevX;
            const dy = this.cursorY - this.prevY;
            const length = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            line.style.width = length + 'px';
            line.style.left = this.prevX + 'px';
            line.style.top = this.prevY + 'px';
            line.style.transform = `rotate(${angle}deg)`;
            
            document.body.appendChild(line);
            
            setTimeout(() => {
                if (line && line.parentNode) {
                    line.remove();
                }
            }, 150);
        }
    }
    
    onClick(e) {
        const ripple = document.createElement('div');
        ripple.className = 'cursor-click';
        ripple.style.left = e.clientX + 'px';
        ripple.style.top = e.clientY + 'px';
        document.body.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple && ripple.parentNode) {
                ripple.remove();
            }
        }, 400);
    }
    
    addHoverEffects() {
        // Элементы, при наведении на которые курсор увеличивается
        const hoverElements = document.querySelectorAll('a, button, .btn, .service-card, .brand, input, select, textarea, .nav a, .footer-links a, .review-card, .advantage, .team-card, .cert-card, .mission-item');
        
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                if (this.customCursor) {
                    this.customCursor.classList.add('hover');
                }
                if (this.gradientBg) {
                    this.gradientBg.style.transform = 'translate(-50%, -50%) scale(1.5)';
                }
            });
            
            el.addEventListener('mouseleave', () => {
                if (this.customCursor) {
                    this.customCursor.classList.remove('hover');
                }
                if (this.gradientBg) {
                    this.gradientBg.style.transform = 'translate(-50%, -50%) scale(1)';
                }
            });
        });
        
        // Следим за новыми элементами (для динамически добавленных)
        const observer = new MutationObserver(() => {
            const newElements = document.querySelectorAll('a, button, .btn, .service-card, .brand');
            newElements.forEach(el => {
                if (!el.hasAttribute('data-cursor-hover')) {
                    el.setAttribute('data-cursor-hover', 'true');
                    el.addEventListener('mouseenter', () => {
                        if (this.customCursor) this.customCursor.classList.add('hover');
                        if (this.gradientBg) this.gradientBg.style.transform = 'translate(-50%, -50%) scale(1.5)';
                    });
                    el.addEventListener('mouseleave', () => {
                        if (this.customCursor) this.customCursor.classList.remove('hover');
                        if (this.gradientBg) this.gradientBg.style.transform = 'translate(-50%, -50%) scale(1)';
                    });
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    hideDefaultCursor() {
        document.body.classList.add('custom-cursor-active');
    }
    
    animate() {
        if (this.destroyed) return;

        if (this.gradientBg) {
            const time = Date.now() / 1000;
            const hue = (time * 50) % 360;
            this.gradientBg.style.background = `radial-gradient(circle, hsla(${hue}, 100%, 50%, 0.3), hsla(${hue + 40}, 100%, 50%, 0.1), transparent)`;
        }

        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }

    destroy() {
        this.destroyed = true;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.customCursor?.parentNode) this.customCursor.remove();
        if (this.gradientBg?.parentNode) this.gradientBg.remove();
        document.body.classList.remove('custom-cursor-active');
    }
}

// ========== АЛЬТЕРНАТИВНАЯ БОЛЕЕ ПРОСТАЯ ВЕРСИЯ ==========
// Если предыдущая кажется слишком тяжёлой, используйте эту:

class SimpleCursorTrail {
    constructor() {
        this.cursorX = 0;
        this.cursorY = 0;
        this.trailPositions = [];
        this.maxTrailLength = 20;
        
        this.init();
    }
    
    init() {
        // Создаём кастомный курсор
        this.cursor = document.createElement('div');
        this.cursor.style.cssText = `
            position: fixed;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0d9488, #06b6d4);
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            transition: transform 0.1s;
            box-shadow: 0 0 15px rgba(230, 81, 0, 0.5);
        `;
        document.body.appendChild(this.cursor);
        
        // Создаём следы
        for (let i = 0; i < this.maxTrailLength; i++) {
            const trail = document.createElement('div');
            trail.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ff9800, #ffeb3b);
                pointer-events: none;
                z-index: 9998;
                transform: translate(-50%, -50%);
                opacity: ${1 - i / this.maxTrailLength};
                transition: opacity 0.3s;
                filter: blur(1px);
            `;
            document.body.appendChild(trail);
            this.trailPositions.push({ element: trail, x: 0, y: 0 });
        }
        
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('click', this.onClick.bind(this));
        
        // Эффект при наведении
        this.addHoverEffect();
        
        // Скрываем стандартный курсор
        const style = document.createElement('style');
        style.textContent = `@media (min-width: 768px) { body, a, button, .btn { cursor: none !important; } }`;
        document.head.appendChild(style);
        
        this.animate();
    }
    
    onMouseMove(e) {
        this.cursorX = e.clientX;
        this.cursorY = e.clientY;
        
        // Обновляем позицию курсора
        this.cursor.style.left = this.cursorX + 'px';
        this.cursor.style.top = this.cursorY + 'px';
        
        // Добавляем случайные частицы
        if (Math.random() > 0.8) {
            this.addParticle();
        }
    }
    
    onClick(e) {
        this.cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => {
            this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 150);
        
        // Эффект клика
        const clickEffect = document.createElement('div');
        clickEffect.style.cssText = `
            position: fixed;
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: radial-gradient(circle, #0d9488, transparent);
            transform: translate(-50%, -50%) scale(0);
            pointer-events: none;
            z-index: 9997;
            animation: clickRippleSimple 0.4s ease-out forwards;
        `;
        document.body.appendChild(clickEffect);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes clickRippleSimple {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
                100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => clickEffect.remove(), 400);
    }
    
    addParticle() {
        const particle = document.createElement('div');
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 40;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.cssText = `
            position: fixed;
            left: ${this.cursorX}px;
            top: ${this.cursorY}px;
            width: 4px;
            height: 4px;
            background: #14b8a6;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9996;
            animation: particleFloatSimple 0.6s ease-out forwards;
        `;
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        document.body.appendChild(particle);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes particleFloatSimple {
                0% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => particle.remove(), 600);
    }
    
    addHoverEffect() {
        const elements = document.querySelectorAll('a, button, .btn, .service-card, .brand');
        elements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
                this.cursor.style.background = 'linear-gradient(135deg, #ff6d00, #ffeb3b)';
            });
            el.addEventListener('mouseleave', () => {
                this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                this.cursor.style.background = 'linear-gradient(135deg, #0d9488, #06b6d4)';
            });
        });
    }
    
    animate() {
        // Обновляем позиции следов
        this.trailPositions.unshift({ element: this.trailPositions[0].element, x: this.cursorX, y: this.cursorY });
        this.trailPositions.pop();
        
        for (let i = 0; i < this.trailPositions.length; i++) {
            const trail = this.trailPositions[i];
            if (trail.x && trail.y) {
                trail.element.style.left = trail.x + 'px';
                trail.element.style.top = trail.y + 'px';
                trail.element.style.opacity = 1 - (i / this.maxTrailLength) * 0.8;
                trail.element.style.width = `${12 - i * 0.5}px`;
                trail.element.style.height = `${12 - i * 0.5}px`;
            }
        }
        
        requestAnimationFrame(this.animate.bind(this));
    }
}

// Кастомный курсор только на ПК (мышь); на телефоне — обычное касание
let cursorEffect = null;

function isDesktopPointer() {
    return window.matchMedia('(pointer: fine) and (hover: hover)').matches;
}

function initCustomCursor() {
    if (!isDesktopPointer() || cursorEffect) return;
    cursorEffect = new CursorTrailEffect();
}

function destroyCustomCursor() {
    if (!cursorEffect) return;

    cursorEffect.destroy();
    document.querySelectorAll('.cursor-trail, .cursor-line, .cursor-click, .cursor-particle').forEach((el) => el.remove());
    cursorEffect = null;
}

initCustomCursor();

window.matchMedia('(pointer: fine) and (hover: hover)').addEventListener('change', (event) => {
    if (event.matches) {
        initCustomCursor();
    } else {
        destroyCustomCursor();
    }
});
