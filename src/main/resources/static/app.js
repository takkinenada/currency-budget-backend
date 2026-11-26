/* === 0. Конфігурація API (відносні шляхи за замовчуванням або production URL) === */
const API_BASE_URL = ((window.PCPICKER_CONFIG && window.PCPICKER_CONFIG.apiBaseUrl) || '').replace(/\/+$/, '');

function apiUrl(path) {
    if (!path) return API_BASE_URL || '/';
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
}

/* === 1. Управління світлою та темною темою (localStorage + prefers-color-scheme) === */
(function initThemeSwitcher() {
    const STORAGE_KEY = 'pcpicker-theme';
    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

    function getCurrentTheme() {
        const attr = document.documentElement.getAttribute('data-theme');
        if (attr === 'light' || attr === 'dark') return attr;
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'light' || saved === 'dark') return saved;
        } catch (e) {}
        return mediaQuery && mediaQuery.matches ? 'light' : 'dark';
    }

    function applyTheme(theme, persist) {
        const normalized = theme === 'light' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', normalized);

        if (persist) {
            try {
                localStorage.setItem(STORAGE_KEY, normalized);
            } catch (e) {}
        }

        const metaTheme = document.getElementById('metaThemeColor');
        if (metaTheme) {
            metaTheme.setAttribute('content', normalized === 'light' ? '#F4F6F8' : '#0E1116');
        }

        document.querySelectorAll('[data-theme-set]').forEach((btn) => {
            const active = btn.getAttribute('data-theme-set') === normalized;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-pressed', String(active));
        });

        const mobileGlyph = document.getElementById('mobileThemeGlyph');
        if (mobileGlyph) {
            mobileGlyph.textContent = normalized === 'light' ? '☾' : '☀️';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        applyTheme(getCurrentTheme(), false);

        document.querySelectorAll('[data-theme-set]').forEach((btn) => {
            btn.addEventListener('click', () => {
                applyTheme(btn.getAttribute('data-theme-set'), true);
            });
        });

        const mobileThemeIconBtn = document.getElementById('mobileThemeIconBtn');
        if (mobileThemeIconBtn) {
            mobileThemeIconBtn.addEventListener('click', () => {
                const next = getCurrentTheme() === 'light' ? 'dark' : 'light';
                applyTheme(next, true);
            });
        }

        if (mediaQuery && mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', (e) => {
                try {
                    if (!localStorage.getItem(STORAGE_KEY)) {
                        applyTheme(e.matches ? 'light' : 'dark', false);
                    }
                } catch (err) {}
            });
        }
    });
})();

/* === 2. Основна логіка PCPicker (бюджет, валюти, фільтри, збірки, магазини, редиректи) === */
document.addEventListener('DOMContentLoaded', () => {
    const MIN_BUDGET_UAH = 15000;
    const MAX_BUDGET_UAH = 500000;

    const CURRENCY_SYMBOLS = {
        UAH: '₴',
        USD: '$',
        EUR: '€'
    };

    const state = {
        currency: 'UAH',
        baseBudgetUah: 40000,
        rates: {
            UAH: 1,
            USD: 41.5,
            EUR: 45.0
        },
        promoByComponentId: {},
        cpuBrands: new Set(),
        gpuBrands: new Set(),
        lastBuilds: [],
        lastBudgetAmount: 40000,
        lastCurrency: 'UAH',
        hasGenerated: false
    };

    // DOM-елементи
    const burgerBtn = document.getElementById('burgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const formCard = document.getElementById('formCard');
    const buildForm = document.getElementById('buildForm');
    const budgetField = document.getElementById('budgetField');
    const budgetInput = document.getElementById('budgetInput');
    const budgetHint = document.getElementById('budgetHint');
    const errorAction = document.getElementById('errorAction');
    const quickFixBtn = document.getElementById('quickFixBtn');
    const brandsNote = document.getElementById('brandsNote');
    const submitBtn = document.getElementById('submitBtn');

    const skeletonSection = document.getElementById('skeletonSection');
    const resultsSection = document.getElementById('resultsSection');
    const resultsTitle = document.getElementById('resultsTitle');
    const buildsGrid = document.getElementById('buildsGrid');
    const comparisonContainer = document.getElementById('comparisonContainer');
    const emptySection = document.getElementById('emptySection');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const benefitsSection = document.getElementById('benefitsSection');

    const shopModal = document.getElementById('shopModal');
    const shopModalTag = document.getElementById('shopModalTag');
    const shopModalTitle = document.getElementById('shopModalTitle');
    const shopModalList = document.getElementById('shopModalList');
    const shopModalStoresSummary = document.getElementById('shopModalStoresSummary');
    const shopModalTotal = document.getElementById('shopModalTotal');

    // Завантаження курсів валют та промо-міток із API
    fetchRates();
    fetchPromoLabels();

    async function fetchRates() {
        try {
            const response = await fetch(apiUrl('/api/rates'));
            if (!response.ok) return;
            const data = await response.json();

            if (Array.isArray(data)) {
                data.forEach((item) => {
                    const code = (item.currency || item.code || '').toUpperCase();
                    const rate = Number(item.rateToUah || item.rate || item.uahRate);
                    if (code && rate > 0) state.rates[code] = rate;
                });
            } else if (data && typeof data === 'object') {
                if (Number(data.USD) > 0) state.rates.USD = Number(data.USD);
                if (Number(data.EUR) > 0) state.rates.EUR = Number(data.EUR);
                if (data.rates && typeof data.rates === 'object') {
                    if (Number(data.rates.USD) > 0) state.rates.USD = Number(data.rates.USD);
                    if (Number(data.rates.EUR) > 0) state.rates.EUR = Number(data.rates.EUR);
                }
            }
            updateBudgetHint();
        } catch (e) {
            // Використовуємо резервні курси, якщо запит тимчасово недоступний
        }
    }

    async function fetchPromoLabels() {
        try {
            const response = await fetch(apiUrl('/api/promo/components'));
            if (!response.ok) return;
            const list = await response.json();
            if (!Array.isArray(list)) return;

            list.forEach((item) => {
                const id = item.componentId ?? item.id;
                const label = item.promoLabel || item.promo_label;
                if (id != null && label) {
                    state.promoByComponentId[String(id)] = String(label);
                }
            });
        } catch (e) {
            // Промо-мітки також зчитуються напряму з BuildResponse.Part
        }
    }

    // Форматування чисел
    function formatNumber(num) {
        return Math.round(Number(num) || 0)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function formatMoney(amount, currency = state.currency) {
        const symbol = CURRENCY_SYMBOLS[currency] || '₴';
        return `${formatNumber(amount)} ${symbol}`;
    }

    function parseBudgetValue() {
        if (!budgetInput) return 0;
        const digits = budgetInput.value.replace(/\D/g, '');
        return digits ? parseInt(digits, 10) : 0;
    }

    function getMinBudgetInCurrency(currency = state.currency) {
        if (currency === 'UAH') return MIN_BUDGET_UAH;
        const rate = state.rates[currency] || 41.5;
        return Math.ceil(MIN_BUDGET_UAH / rate);
    }

    function toUah(amount, currency = state.currency) {
        if (currency === 'UAH') return amount;
        return Math.round(amount * (state.rates[currency] || 41.5));
    }

    function fromUah(amountUah, currency = state.currency) {
        if (currency === 'UAH') return Math.round(amountUah);
        return Math.round(amountUah / (state.rates[currency] || 41.5));
    }

    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Мобільне бургер-меню
    if (burgerBtn && mobileMenu) {
        burgerBtn.addEventListener('click', () => {
            const isHidden = mobileMenu.hidden;
            mobileMenu.hidden = !isHidden;
            burgerBtn.setAttribute('aria-expanded', String(isHidden));
        });
    }

    // Модальні вікна
    document.querySelectorAll('[data-modal]').forEach((trigger) => {
        trigger.addEventListener('click', () => {
            const targetId = trigger.getAttribute('data-modal');
            const modal = document.getElementById(targetId);
            if (modal) {
                modal.hidden = false;
                document.body.style.overflow = 'hidden';
            }
            if (mobileMenu && !mobileMenu.hidden) {
                mobileMenu.hidden = true;
                if (burgerBtn) burgerBtn.setAttribute('aria-expanded', 'false');
            }
        });
    });

    function closeAllModals() {
        document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
            backdrop.hidden = true;
        });
        document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
        btn.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeAllModals();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            if (mobileMenu && !mobileMenu.hidden) {
                mobileMenu.hidden = true;
                if (burgerBtn) burgerBtn.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // Перемикач валют (₴ / $ / €) без накопичення похибки округлення
    document.querySelectorAll('.currency-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const nextCurrency = btn.getAttribute('data-currency');
            if (!nextCurrency || nextCurrency === state.currency) return;

            state.currency = nextCurrency;

            document.querySelectorAll('.currency-btn').forEach((b) => {
                b.classList.toggle('is-active', b === btn);
            });

            if (state.baseBudgetUah > 0 && budgetInput) {
                const converted = fromUah(state.baseBudgetUah, nextCurrency);
                budgetInput.value = formatNumber(converted);
            }

            clearBudgetError();
            updateBudgetHint();
        });
    });

    // Ввід та валідація бюджету
    if (budgetInput) {
        budgetInput.addEventListener('input', () => {
            const digits = budgetInput.value.replace(/\D/g, '').slice(0, 8);
            const numericVal = digits ? parseInt(digits, 10) : 0;
            budgetInput.value = numericVal ? formatNumber(numericVal) : '';
            state.baseBudgetUah = toUah(numericVal, state.currency);
            clearBudgetError();
        });
    }

    function updateBudgetHint() {
        const minVal = getMinBudgetInCurrency();
        const formattedMin = formatMoney(minVal, state.currency);
        if (budgetHint && !budgetHint.classList.contains('is-error')) {
            budgetHint.textContent = `Мінімум ${formattedMin} для робочої збірки`;
        }
        if (quickFixBtn) {
            quickFixBtn.textContent = `Показати збірку за ${formattedMin}`;
        }
    }

    function showBudgetError(message) {
        const minVal = getMinBudgetInCurrency();
        const formattedMin = formatMoney(minVal, state.currency);
        if (budgetField) budgetField.classList.add('is-invalid');
        if (budgetHint) {
            budgetHint.classList.add('is-error');
            budgetHint.textContent = message || `Мінімальний бюджет для робочої збірки — ${formattedMin}`;
        }
        if (quickFixBtn) {
            quickFixBtn.textContent = `Показати збірку за ${formattedMin}`;
        }
        if (errorAction) errorAction.hidden = false;
    }

    function clearBudgetError() {
        if (budgetField) budgetField.classList.remove('is-invalid');
        if (budgetHint) budgetHint.classList.remove('is-error');
        if (errorAction) errorAction.hidden = true;
        updateBudgetHint();
    }

    if (quickFixBtn) {
        quickFixBtn.addEventListener('click', () => {
            state.baseBudgetUah = MIN_BUDGET_UAH;
            const minVal = getMinBudgetInCurrency();
            if (budgetInput) budgetInput.value = formatNumber(minVal);
            clearBudgetError();
            generateBuilds();
        });
    }

    // Чіпи вибору брендів CPU та GPU
    document.querySelectorAll('.brand-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            const group = chip.getAttribute('data-group');
            const brand = chip.getAttribute('data-brand');
            const targetSet = group === 'cpu' ? state.cpuBrands : state.gpuBrands;

            if (targetSet.has(brand)) {
                targetSet.delete(brand);
                chip.classList.remove('is-selected');
                chip.setAttribute('aria-pressed', 'false');
            } else {
                targetSet.add(brand);
                chip.classList.add('is-selected');
                chip.setAttribute('aria-pressed', 'true');
            }

            updateBrandsNote();
        });
    });

    function updateBrandsNote() {
        if (!brandsNote) return;
        const parts = [];
        if (state.cpuBrands.size > 0) {
            parts.push(`Процесор: ${Array.from(state.cpuBrands).join(', ')}`);
        }
        if (state.gpuBrands.size > 0) {
            parts.push(`Відеокарта: ${Array.from(state.gpuBrands).join(', ')}`);
        }
        brandsNote.textContent = parts.length > 0
            ? `Вибрано — ${parts.join(' • ')}`
            : 'Нічого не вибрано = будь-який бренд';
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            state.cpuBrands.clear();
            state.gpuBrands.clear();
            document.querySelectorAll('.brand-chip').forEach((chip) => {
                chip.classList.remove('is-selected');
                chip.setAttribute('aria-pressed', 'false');
            });
            updateBrandsNote();
            generateBuilds();
        });
    }

    // Відправка форми генерації
    if (buildForm) {
        buildForm.addEventListener('submit', (e) => {
            e.preventDefault();
            generateBuilds();
        });
    }

    function detectPartBrand(part, category) {
        const explicit = String(part.brand || part.manufacturer || '').trim().toUpperCase();
        if (explicit === 'INTEL' || explicit === 'AMD' || explicit === 'NVIDIA') {
            return explicit;
        }
        const name = String(part.name || '');
        if (category === 'CPU') {
            if (/\b(intel|core\s*i[3579]|core\s*ultra|pentium|celeron)\b/i.test(name)) return 'INTEL';
            if (/\b(amd|ryzen|athlon|threadripper)\b/i.test(name)) return 'AMD';
        }
        if (category === 'GPU') {
            if (/\b(nvidia|geforce|rtx|gtx)\b/i.test(name)) return 'NVIDIA';
            if (/\b(amd|radeon|rx\s*\d)\b/i.test(name)) return 'AMD';
            if (/\b(intel|arc)\b/i.test(name)) return 'INTEL';
        }
        return explicit;
    }

    function enforceBrandFilters(rawBuilds) {
        if (state.cpuBrands.size === 0 && state.gpuBrands.size === 0) {
            return rawBuilds;
        }

        const validCpus = [];
        const validGpus = [];

        rawBuilds.forEach((build) => {
            const list = build.parts || build.components || [];
            list.forEach((p) => {
                const cat = resolveCanonicalCategory(p);
                const brand = detectPartBrand(p, cat);
                if (cat === 'CPU' && state.cpuBrands.has(brand)) {
                    validCpus.push({ ...p });
                }
                if (cat === 'GPU' && state.gpuBrands.has(brand)) {
                    validGpus.push({ ...p });
                }
            });
        });

        if (state.cpuBrands.size > 0 && validCpus.length === 0) return [];
        if (state.gpuBrands.size > 0 && validGpus.length === 0) return [];

        return rawBuilds.map((build) => {
            const key = Array.isArray(build.parts) ? 'parts' : 'components';
            const sourceList = build[key] || [];
            let modified = false;

            const updatedList = sourceList.map((p) => {
                const cat = resolveCanonicalCategory(p);
                const brand = detectPartBrand(p, cat);

                if (cat === 'CPU' && state.cpuBrands.size > 0 && !state.cpuBrands.has(brand)) {
                    modified = true;
                    return { ...validCpus[0] };
                }
                if (cat === 'GPU' && state.gpuBrands.size > 0 && !state.gpuBrands.has(brand)) {
                    modified = true;
                    return { ...validGpus[0] };
                }
                return { ...p };
            });

            if (!modified) return build;

            const newTotalUah = updatedList.reduce((sum, item) => sum + Number(item.priceUah ?? item.price ?? 0), 0);
            return {
                ...build,
                [key]: updatedList,
                totalPriceUah: newTotalUah,
                totalPrice: newTotalUah
            };
        });
    }

    async function generateBuilds() {
        const enteredAmount = parseBudgetValue();
        const budgetUah = state.currency === 'UAH'
            ? enteredAmount
            : (state.baseBudgetUah || toUah(enteredAmount, state.currency));

        if (!enteredAmount || budgetUah < MIN_BUDGET_UAH) {
            showBudgetError();
            if (budgetInput) budgetInput.focus();
            return;
        }

        if (budgetUah > MAX_BUDGET_UAH) {
            showBudgetError(`Максимальний бюджет для автопідбору — ${formatMoney(fromUah(MAX_BUDGET_UAH))}`);
            if (budgetInput) budgetInput.focus();
            return;
        }

        clearBudgetError();

        if (benefitsSection) benefitsSection.hidden = true;
        if (resultsSection) resultsSection.hidden = true;
        if (emptySection) emptySection.hidden = true;
        if (skeletonSection) skeletonSection.hidden = false;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Підбираємо...';
        }

        const selectedBrands = Array.from(new Set([
            ...state.cpuBrands,
            ...state.gpuBrands
        ]));

        const payload = {
            budget: enteredAmount,
            currency: state.currency,
            brands: selectedBrands
        };

        try {
            const response = await fetch(apiUrl('/api/builds/generate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const rawBuilds = Array.isArray(data) ? data : (data.builds || data.configurations || []);
            const filteredBuilds = enforceBrandFilters(rawBuilds || []);

            if (!filteredBuilds || filteredBuilds.length === 0) {
                showEmptyState();
                return;
            }

            state.lastBuilds = filteredBuilds.slice(0, 3);
            state.lastBudgetAmount = enteredAmount;
            state.lastCurrency = state.currency;
            state.hasGenerated = true;

            if (formCard) formCard.classList.add('is-compact');
            renderResults(state.lastBuilds, enteredAmount, state.currency);
        } catch (error) {
            console.error('Помилка генерації збірок:', error);
            showEmptyState();
        } finally {
            if (skeletonSection) skeletonSection.hidden = true;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = state.hasGenerated ? 'Підібрати знову' : 'Підібрати збірки';
            }
        }
    }

    function showEmptyState() {
        if (skeletonSection) skeletonSection.hidden = true;
        if (resultsSection) resultsSection.hidden = true;
        if (benefitsSection) benefitsSection.hidden = true;
        if (emptySection) emptySection.hidden = false;
    }

    // Метадані 3 типів збірок
    const BUILD_META = [
        {
            key: 'VALUE',
            tagText: 'Ціна/якість',
            shortTag: 'Ціна/як.',
            tagClass: 'tag--value',
            dotClass: 'dot--value',
            defaultTitle: 'Збалансований ПК'
        },
        {
            key: 'POWER',
            tagText: 'Потужність',
            shortTag: 'Потужн.',
            tagClass: 'tag--power',
            dotClass: 'dot--power',
            defaultTitle: 'Максимум в іграх'
        },
        {
            key: 'TECH',
            tagText: 'Технології',
            shortTag: 'Технол.',
            tagClass: 'tag--tech',
            dotClass: 'dot--tech',
            defaultTitle: 'Сучасна платформа'
        }
    ];

    const CATEGORY_LABELS = {
        CPU: 'Процесор',
        GPU: 'Відеокарта',
        RAM: "Пам'ять",
        STORAGE: 'Накопичувач',
        MOTHERBOARD: 'Мат. плата',
        PSU: 'Блок живлення',
        CASE: 'Корпус'
    };

    const CATEGORY_ALIASES = {
        CPU: 'CPU',
        PROCESSOR: 'CPU',
        'ПРОЦЕСОР': 'CPU',
        GPU: 'GPU',
        VIDEOCARD: 'GPU',
        VIDEO_CARD: 'GPU',
        GRAPHICS: 'GPU',
        'ВІДЕОКАРТА': 'GPU',
        RAM: 'RAM',
        MEMORY: 'RAM',
        "ПАМ'ЯТЬ": 'RAM',
        "ОПЕРАТИВНА ПАМ'ЯТЬ": 'RAM',
        STORAGE: 'STORAGE',
        SSD: 'STORAGE',
        HDD: 'STORAGE',
        DRIVE: 'STORAGE',
        NVME: 'STORAGE',
        'НАКОПИЧУВАЧ': 'STORAGE',
        MOTHERBOARD: 'MOTHERBOARD',
        MOBO: 'MOTHERBOARD',
        MAINBOARD: 'MOTHERBOARD',
        'МАТ. ПЛАТА': 'MOTHERBOARD',
        'МАТЕРИНСЬКА ПЛАТА': 'MOTHERBOARD',
        PSU: 'PSU',
        POWERSUPPLY: 'PSU',
        POWER_SUPPLY: 'PSU',
        'БЛОК ЖИВЛЕННЯ': 'PSU',
        CASE: 'CASE',
        CHASSIS: 'CASE',
        TOWER: 'CASE',
        'КОРПУС': 'CASE'
    };

    function resolveCanonicalCategory(part) {
        const rawField = part.category ?? part.type ?? part.componentType ?? part.partType ?? part.categoryName ?? part.componentCategory ?? part.slot ?? '';
        const rawStr = typeof rawField === 'object' && rawField !== null
            ? (rawField.code || rawField.key || rawField.name || '')
            : String(rawField || '');
        const upper = rawStr.trim().toUpperCase();

        if (CATEGORY_ALIASES[upper]) {
            return CATEGORY_ALIASES[upper];
        }

        const name = String(part.name || '');
        if (/\b(ryzen|core\s*i[3579]|core\s*ultra|athlon|pentium|celeron)\b/i.test(name)) return 'CPU';
        if (/\b(geforce|rtx|gtx|radeon|rx\s*\d|intel\s*arc)\b/i.test(name)) return 'GPU';
        if (/\b(h610|b650|b760|a620|b550|z790|x670|a520|h510|b450|z690|h410)\b/i.test(name)) return 'MOTHERBOARD';
        if (/\b(ddr[345]|sodimm)\b/i.test(name)) return 'RAM';
        if (/\b(nvme|ssd|hdd|sata|gen[345])\b/i.test(name)) return 'STORAGE';
        if (/(\d+\s*вт|\d+\s*w\b|80\+|bronze|gold|platinum)/i.test(name)) return 'PSU';
        if (/\b(tower|case|корпус|atx|mesh|tg)\b/i.test(name)) return 'CASE';

        return 'CASE';
    }

    function getCategoryIconSvg(category) {
        const cat = String(category || '').toUpperCase();
        if (cat === 'CPU') {
            return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>';
        }
        if (cat === 'GPU') {
            return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="2.5"/><circle cx="15" cy="12" r="2.5"/></svg>';
        }
        if (cat === 'RAM') {
            return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="10" rx="1.5"/><path d="M7 7v4M11 7v4M15 7v4M17 17v2M7 17v2"/></svg>';
        }
        if (cat === 'STORAGE') {
            return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="4" y1="14" x2="20" y2="14"/><circle cx="8" cy="17" r="1"/></svg>';
        }
        if (cat === 'MOTHERBOARD') {
            return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="5" height="5"/><path d="M15 7h2M15 11h2M7 16h10"/></svg>';
        }
        if (cat === 'PSU') {
            return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M13 9l-3 4h4l-2 4"/></svg>';
        }
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="7" r="1.5"/><line x1="9" y1="17" x2="15" y2="17"/></svg>';
    }

    function normalizeStoreDisplayName(rawStore) {
        const s = String(rawStore || '').trim();
        if (!s) return 'Rozetka';
        if (s.toUpperCase() === 'ROZETKA') return 'Rozetka';
        if (s.toUpperCase() === 'COMFY') return 'Comfy';
        return s;
    }

    function normalizeParts(build) {
        const rawParts = build.parts || build.components || [];
        return rawParts.map((p) => {
            const componentId = p.componentId ?? p.id ?? null;
            const rawCat = resolveCanonicalCategory(p);
            const priceUah = Number(p.priceUah ?? p.price ?? 0);
            const displayPrice = state.lastCurrency === 'UAH'
                ? priceUah
                : (p.price && p.currency === state.lastCurrency ? Number(p.price) : fromUah(priceUah, state.lastCurrency));

            const storeName = normalizeStoreDisplayName(p.storeName ?? p.store_name);
            const inStock = p.inStock !== undefined ? Boolean(p.inStock) : (p.in_stock !== undefined ? Boolean(p.in_stock) : true);

            const rawAffiliateUrl = p.affiliateUrl
                || (componentId !== null ? `/api/affiliate/go/${encodeURIComponent(componentId)}` : (p.shopUrl || '#'));
            const affiliateUrl = rawAffiliateUrl === '#' ? '#' : apiUrl(rawAffiliateUrl);

            const apiPromoLabel = p.promoLabel ?? p.promo_label ?? (componentId !== null ? state.promoByComponentId[String(componentId)] : null);
            const isSponsored = Boolean(p.sponsored || apiPromoLabel);
            const promoLabel = apiPromoLabel || (isSponsored ? 'Реклама' : '');

            return {
                componentId,
                rawCategory: rawCat,
                categoryLabel: CATEGORY_LABELS[rawCat] || 'Комплектуюча',
                name: p.name || 'Комплектуюча',
                priceUah,
                displayPrice,
                storeName,
                inStock,
                affiliateUrl,
                sponsored: isSponsored,
                promoLabel
            };
        });
    }

    function renderResults(builds, budgetAmount, currency) {
        if (resultsTitle) {
            resultsTitle.textContent = `Твої ${builds.length} збірки за ${formatMoney(budgetAmount, currency)}`;
        }

        if (buildsGrid) {
            buildsGrid.innerHTML = builds.map((build, idx) => {
                const meta = BUILD_META[idx] || BUILD_META[0];
                const parts = normalizeParts(build);
                const title = build.title || build.name || meta.defaultTitle;
                const totalUah = Number(build.totalPriceUah ?? build.totalPrice ?? parts.reduce((acc, p) => acc + p.priceUah, 0));
                const totalDisplay = currency === 'UAH' ? totalUah : fromUah(totalUah, currency);

                const partsHtml = parts.map((part) => `
                    <div class="part-row">
                        <div class="part-row__left">
                            <span class="part-row__icon" aria-hidden="true">${getCategoryIconSvg(part.rawCategory)}</span>
                            <div class="part-row__info">
                                <div class="part-row__meta">
                                    <span class="part-row__cat">${escapeHtml(part.categoryLabel)}</span>
                                    ${part.sponsored ? `<span class="promo-badge">${escapeHtml(part.promoLabel)}</span>` : ''}
                                </div>
                                <div class="part-row__name" title="${escapeHtml(part.name)}">${escapeHtml(part.name)}</div>
                            </div>
                        </div>
                        <span class="part-row__price">${formatMoney(part.displayPrice, currency)}</span>
                    </div>
                `).join('');

                return `
                    <article class="build-card">
                        <div class="build-card__top">
                            <span class="tag ${meta.tagClass}">${meta.tagText}</span>
                            <span class="build-card__count">${parts.length} деталей</span>
                        </div>
                        <h3 class="build-card__title">${escapeHtml(title)}</h3>
                        <div class="parts-list">${partsHtml}</div>
                        <div class="build-card__footer">
                            <div class="build-card__total-row">
                                <span class="build-card__total-label">Разом</span>
                                <span class="build-card__total-value">${formatMoney(totalDisplay, currency)}</span>
                            </div>
                            <div class="build-card__budget-ok">✓ Вкладається в бюджет ${formatMoney(budgetAmount, currency)}</div>
                            <div class="build-card__actions">
                                <button type="button" class="btn-primary build-card__shop-btn" data-open-shop="${idx}">До магазину</button>
                                <button type="button" class="btn-save-build" data-save-build="${idx}">🔖 Зберегти</button>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');

            buildsGrid.querySelectorAll('[data-open-shop]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const idx = Number(btn.getAttribute('data-open-shop'));
                    openShopModal(idx);
                });
            });

            buildsGrid.querySelectorAll('[data-save-build]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const idx = Number(btn.getAttribute('data-save-build'));
                    const build = state.lastBuilds[idx];
                    if (!build || !window.PCPickerProfile) return;

                    const meta = BUILD_META[idx] || BUILD_META[0];
                    const parts = normalizeParts(build);
                    const title = build.title || build.name || meta.defaultTitle;
                    const componentIds = parts
                        .map((p) => p.componentId)
                        .filter((id) => id !== null && id !== undefined);

                    window.PCPickerProfile.saveBuild({
                        title,
                        scenario: build.scenario || 'UNIVERSAL',
                        componentIds
                    }, btn);
                });
            });
        }

        renderComparison(builds, budgetAmount, currency);

        if (resultsSection) resultsSection.hidden = false;
    }

    function openShopModal(buildIndex) {
        const build = state.lastBuilds[buildIndex];
        if (!build || !shopModal) return;

        const meta = BUILD_META[buildIndex] || BUILD_META[0];
        const parts = normalizeParts(build);
        const title = build.title || build.name || meta.defaultTitle;
        const totalUah = Number(build.totalPriceUah ?? build.totalPrice ?? parts.reduce((acc, p) => acc + p.priceUah, 0));
        const totalDisplay = state.lastCurrency === 'UAH' ? totalUah : fromUah(totalUah, state.lastCurrency);

        if (shopModalTag) {
            shopModalTag.className = `tag ${meta.tagClass}`;
            shopModalTag.textContent = meta.tagText;
        }
        if (shopModalTitle) {
            shopModalTitle.textContent = `${title} — купити комплектуючі`;
        }

        const storeCounts = {};
        parts.forEach((part) => {
            storeCounts[part.storeName] = (storeCounts[part.storeName] || 0) + 1;
        });
        const storesSummary = Object.entries(storeCounts)
            .map(([store, count]) => `${store} ×${count}`)
            .join(', ');

        if (shopModalStoresSummary) {
            shopModalStoresSummary.textContent = `Магазини: ${storesSummary}`;
        }

        if (shopModalList) {
            shopModalList.innerHTML = parts.map((part) => {
                const stockBadge = part.inStock
                    ? '<span class="stock-pill stock-pill--in"><span class="stock-pill__dot" aria-hidden="true"></span>В наявності</span>'
                    : '<span class="stock-pill stock-pill--out"><span class="stock-pill__dot" aria-hidden="true"></span>Немає в наявності</span>';

                const actionControl = part.inStock
                    ? `<a href="${escapeHtml(part.affiliateUrl)}" target="_blank" rel="noopener noreferrer" class="shop-buy-btn">Купити в ${escapeHtml(part.storeName)} →</a>`
                    : '<button type="button" class="shop-buy-btn shop-buy-btn--disabled" disabled>Недоступно</button>';

                return `
                    <div class="shop-item">
                        <div class="shop-item__left">
                            <div class="shop-item__meta">
                                <span class="shop-item__cat">${escapeHtml(part.categoryLabel)}</span>
                                ${part.sponsored ? `<span class="promo-badge">${escapeHtml(part.promoLabel)}</span>` : ''}
                            </div>
                            <div class="shop-item__name">${escapeHtml(part.name)}</div>
                            <div class="shop-item__badges">
                                <span class="store-pill">${escapeHtml(part.storeName)}</span>
                                ${stockBadge}
                            </div>
                        </div>
                        <div class="shop-item__right">
                            <span class="shop-item__price">${formatMoney(part.displayPrice, state.lastCurrency)}</span>
                            ${actionControl}
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (shopModalTotal) {
            shopModalTotal.textContent = formatMoney(totalDisplay, state.lastCurrency);
        }

        shopModal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function renderComparison(builds, budgetAmount, currency) {
        if (!comparisonContainer) return;

        const normalized = builds.map((b, idx) => {
            const parts = normalizeParts(b);
            const findPart = (cats) => parts.find((p) => cats.includes(p.rawCategory));
            const totalUah = Number(b.totalPriceUah ?? b.totalPrice ?? parts.reduce((s, p) => s + p.priceUah, 0));
            const totalDisplay = currency === 'UAH' ? totalUah : fromUah(totalUah, currency);
            const remainingDisplay = Math.max(0, budgetAmount - totalDisplay);

            const scores = b.scores || {};
            const gaming = Number(scores.gaming ?? b.gamingScore ?? (idx === 1 ? 9 : idx === 2 ? 8 : 7));
            const work = Number(scores.work ?? b.workScore ?? (idx === 2 ? 8 : 7));
            const tech = Number(scores.futureProof ?? scores.tech ?? b.techScore ?? (idx === 2 ? 9 : idx === 1 ? 7 : 6));

            return {
                meta: BUILD_META[idx] || BUILD_META[0],
                cpu: findPart(['CPU'])?.name || '—',
                gpu: findPart(['GPU'])?.name || '—',
                ram: findPart(['RAM'])?.name || '—',
                storage: findPart(['STORAGE'])?.name || '—',
                psu: findPart(['PSU'])?.name || '—',
                gaming,
                work,
                tech,
                totalDisplay,
                remainingDisplay
            };
        });

        const maxGaming = Math.max(...normalized.map((n) => n.gaming));
        const maxWork = Math.max(...normalized.map((n) => n.work));
        const maxTech = Math.max(...normalized.map((n) => n.tech));
        const minPrice = Math.min(...normalized.map((n) => n.totalDisplay));
        const maxRemain = Math.max(...normalized.map((n) => n.remainingDisplay));

        const desktopRows = [
            { label: 'Процесор', values: normalized.map((n, i) => ({ text: n.cpu, best: i === 2 })) },
            { label: 'Відеокарта', values: normalized.map((n, i) => ({ text: n.gpu, best: i === 1 })) },
            { label: "Оперативна пам'ять", values: normalized.map((n) => ({ text: n.ram, best: n.ram.includes('32') })) },
            { label: 'Накопичувач', values: normalized.map((n) => ({ text: n.storage, best: n.storage.includes('Gen4') })) },
            { label: 'Блок живлення', values: normalized.map((n) => ({ text: n.psu, best: n.psu.includes('Gold') })) },
            { label: 'Ігри', isScore: true, values: normalized.map((n) => ({ score: n.gaming, best: n.gaming === maxGaming })) },
            { label: 'Робота і монтаж', isScore: true, values: normalized.map((n) => ({ score: n.work, best: n.work === maxWork })) },
            { label: 'Нові технології', isScore: true, values: normalized.map((n) => ({ score: n.tech, best: n.tech === maxTech })) },
            { label: 'Ціна', values: normalized.map((n) => ({ text: formatMoney(n.totalDisplay, currency), best: n.totalDisplay === minPrice })) },
            { label: 'Залишок бюджету', values: normalized.map((n) => ({ text: formatMoney(n.remainingDisplay, currency), best: n.remainingDisplay === maxRemain })) }
        ];

        const desktopHtml = `
            <table class="cmp-table">
                <thead>
                    <tr>
                        <th>Характеристика</th>
                        ${normalized.map((n) => `<th><span class="tag ${n.meta.tagClass}">${n.meta.tagText}</span></th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${desktopRows.map((row) => `
                        <tr>
                            <td>${row.label}</td>
                            ${row.values.map((v) => {
            if (row.isScore) {
                return `
                                        <td>
                                            <div class="score-cell">
                                                <div class="score-bar"><div class="score-bar__fill ${v.best ? 'is-best' : ''}" style="width: ${v.score * 10}%"></div></div>
                                                <span class="score-num ${v.best ? 'is-best' : ''}">${v.score}/10</span>
                                            </div>
                                        </td>
                                    `;
            }
            return `<td class="cmp-val ${v.best ? 'is-best' : ''}">${escapeHtml(v.text)}</td>`;
        }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        const mobileHtml = `
            <div class="cmp-mobile">
                <div class="cmp-mobile__head">
                    ${normalized.map((n) => `
                        <div class="cmp-mobile__dot-label">
                            <span class="dot ${n.meta.dotClass}"></span>
                            <span>${n.meta.shortTag}</span>
                        </div>
                    `).join('')}
                </div>
                ${desktopRows.filter((r) => r.label !== 'Накопичувач' && r.label !== 'Блок живлення' && r.label !== 'Залишок бюджету').map((row) => `
                    <div class="cmp-mobile__row">
                        <div class="cmp-mobile__row-title">${row.label}</div>
                        <div class="cmp-mobile__cols">
                            ${row.values.map((v) => {
            if (row.isScore) {
                return `
                                        <div class="cmp-mobile__score">
                                            <div class="score-bar"><div class="score-bar__fill ${v.best ? 'is-best' : ''}" style="width: ${v.score * 10}%"></div></div>
                                            <span class="score-num ${v.best ? 'is-best' : ''}">${v.score}/10</span>
                                        </div>
                                    `;
            }
            return `<div class="cmp-val ${v.best ? 'is-best' : ''}">${escapeHtml(v.text)}</div>`;
        }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        comparisonContainer.innerHTML = desktopHtml + mobileHtml;
    }

    // Відкриття збереженої збірки з особистого кабінету
    window.onOpenSavedBuild = function (savedBuild) {
        if (!savedBuild) return;
        const mappedBuild = {
            title: savedBuild.title,
            scenario: savedBuild.scenario,
            totalPriceUah: savedBuild.currentTotalPriceUah ?? savedBuild.savedTotalPriceUah,
            parts: (savedBuild.items || []).map((item) => ({
                componentId: item.componentId ?? item.id,
                category: item.category,
                name: item.componentName || item.name,
                priceUah: item.currentPriceUah ?? item.savedPriceUah,
                storeName: item.storeName,
                inStock: item.inStock
            }))
        };
        state.lastBuilds = [mappedBuild];
        state.lastCurrency = 'UAH';
        if (benefitsSection) benefitsSection.hidden = true;
        if (emptySection) emptySection.hidden = true;
        renderResults(state.lastBuilds, Number(mappedBuild.totalPriceUah) || state.baseBudgetUah, 'UAH');
        if (resultsTitle) {
            resultsTitle.textContent = `Збережена збірка: ${savedBuild.title}`;
        }
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
    };
});