(function () {
    'use strict';

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
        let lastToggleAt = 0;

        function getCurrentTheme() {
            const attr = document.documentElement.getAttribute('data-theme');
            if (attr === 'light' || attr === 'dark') return attr;
            try {
                const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('theme');
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
                    if (localStorage.getItem('theme') !== null) {
                        localStorage.setItem('theme', normalized);
                    }
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

            document.querySelectorAll('[data-theme-glyph], .mobile-theme-glyph').forEach((el) => {
                el.textContent = normalized === 'light' ? '☾' : '☀️';
            });
        }

        function toggleTheme() {
            const now = Date.now();
            if (now - lastToggleAt < 120) return;
            lastToggleAt = now;
            const next = getCurrentTheme() === 'light' ? 'dark' : 'light';
            applyTheme(next, true);
        }

        // Делегована обробка кліків для десктопних і мобільних перемикачів теми
        document.addEventListener('click', (e) => {
            const setBtn = e.target.closest('[data-theme-set]');
            if (setBtn) {
                e.preventDefault();
                e.stopImmediatePropagation();
                applyTheme(setBtn.getAttribute('data-theme-set'), true);
                return;
            }

            const toggleBtn = e.target.closest(
                '#mobileThemeIconBtn, #mobileThemeBtn, [data-theme-toggle], .mobile-theme-btn, .theme-toggle-btn'
            );
            if (toggleBtn) {
                e.preventDefault();
                e.stopImmediatePropagation();
                toggleTheme();
            }
        }, true);

        function syncInitialTheme() {
            applyTheme(getCurrentTheme(), false);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', syncInitialTheme);
        } else {
            syncInitialTheme();
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
    })();

    /* === 2. Основна логіка PCPicker (бюджет, сценарії, валюти, заміна деталей, магазини) === */
    function initApp() {
        const MIN_BUDGET_UAH = 15000;
        const MAX_BUDGET_UAH = 500000;

        const CURRENCY_SYMBOLS = {
            UAH: '₴',
            USD: '$',
            EUR: '€'
        };

        const SCENARIO_TITLES = {
            GAMING: 'Ігри',
            WORK: 'Робота і монтаж',
            OFFICE: 'Офіс і навчання',
            UNIVERSAL: 'Універсальний'
        };

        function injectInteractiveStyles() {
            if (document.getElementById('pcpInteractiveBuildStyles')) return;
            const style = document.createElement('style');
            style.id = 'pcpInteractiveBuildStyles';
            style.textContent = `
                #mobileThemeIconBtn,
                #mobileThemeBtn,
                [data-theme-toggle],
                #burgerBtn,
                .burger-btn,
                [data-burger-toggle] {
                    position: relative;
                    z-index: 20;
                    touch-action: manipulation;
                    cursor: pointer;
                }
                #burgerBtn *,
                .burger-btn *,
                [data-burger-toggle] * {
                    pointer-events: none;
                }
                #mobileMenu:not([hidden]),
                .mobile-menu:not([hidden]),
                #mobileMenu.is-open,
                .mobile-menu.is-open {
                    display: flex !important;
                }
                #mobileMenu[hidden]:not(.is-open),
                .mobile-menu[hidden]:not(.is-open) {
                    display: none !important;
                }
                .scenario-section {
                    padding-top: 14px;
                    border-top: 1px solid #282E3A;
                }
                [data-theme="light"] .scenario-section {
                    border-top-color: #E2E8F0;
                }
                .form-card.is-compact .scenario-section {
                    padding-top: 0;
                    border-top: none;
                }
                .form-card.is-compact .scenario-section .brand-row {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }
                .scenario-section .brand-row__chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .scenario-chip {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    height: 36px;
                    padding: 0 14px;
                    border-radius: 999px;
                    border: 1px solid #282E3A;
                    background: #161B22;
                    color: #F2F4F8;
                    font-family: inherit;
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 1;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: border-color 0.2s, background-color 0.2s, color 0.2s;
                }
                .scenario-chip:hover {
                    border-color: #B6F24A;
                }
                [data-theme="light"] .scenario-chip {
                    border-color: #CBD5E1;
                    background: #F1F5F9;
                    color: #0F172A;
                }
                [data-theme="light"] .scenario-chip:hover {
                    border-color: #65A30D;
                }
                .scenario-chip.is-selected,
                [data-theme="light"] .scenario-chip.is-selected {
                    background: #B6F24A;
                    border-color: #B6F24A;
                    color: #0E1116;
                }
                .build-card__top-right {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .build-card__menu-wrap {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                }
                .build-card__menu-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    padding: 0;
                    border: 1px solid transparent;
                    border-radius: 8px;
                    background: transparent;
                    color: #939AA8;
                    cursor: pointer;
                    transition: background-color 0.2s, border-color 0.2s, color 0.2s;
                }
                .build-card__menu-btn:hover,
                .build-card__menu-btn[aria-expanded="true"] {
                    background: #1D222B;
                    border-color: #282E3A;
                    color: #F2F4F8;
                }
                [data-theme="light"] .build-card__menu-btn {
                    color: #64748B;
                }
                [data-theme="light"] .build-card__menu-btn:hover,
                [data-theme="light"] .build-card__menu-btn[aria-expanded="true"] {
                    background: #F1F5F9;
                    border-color: #CBD5E1;
                    color: #0F172A;
                }
                .build-card__dropdown {
                    position: absolute;
                    top: calc(100% + 6px);
                    right: 0;
                    z-index: 30;
                    min-width: 196px;
                    padding: 6px;
                    border-radius: 12px;
                    border: 1px solid #282E3A;
                    background: #161B22;
                    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
                }
                [data-theme="light"] .build-card__dropdown {
                    border-color: #CBD5E1;
                    background: #FFFFFF;
                    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
                }
                .build-card__dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                    padding: 9px 10px;
                    border: none;
                    border-radius: 8px;
                    background: transparent;
                    color: #F2F4F8;
                    font-family: inherit;
                    font-size: 13px;
                    font-weight: 500;
                    text-align: left;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: background-color 0.15s, color 0.15s;
                }
                .build-card__dropdown-item:hover {
                    background: #1D222B;
                    color: #B6F24A;
                }
                [data-theme="light"] .build-card__dropdown-item {
                    color: #0F172A;
                }
                [data-theme="light"] .build-card__dropdown-item:hover {
                    background: #F1F5F9;
                    color: #3D5E06;
                }
                .part-row__right {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 4px;
                    flex-shrink: 0;
                }
                .part-row__price,
                .shop-item__price,
                .build-card__total-value,
                #shopModalTotal {
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .part-row__replace-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    height: 24px;
                    padding: 0 8px;
                    border-radius: 6px;
                    border: 1px solid #282E3A;
                    background: transparent;
                    color: #939AA8;
                    font-family: inherit;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: border-color 0.2s, color 0.2s, background-color 0.2s;
                }
                .part-row__replace-btn:hover {
                    border-color: #B6F24A;
                    color: #B6F24A;
                }
                [data-theme="light"] .part-row__replace-btn {
                    border-color: #CBD5E1;
                    color: #475569;
                }
                [data-theme="light"] .part-row__replace-btn:hover {
                    border-color: #4F770A;
                    color: #3D5E06;
                }
                .build-card__budget-over {
                    font-size: 12px;
                    font-weight: 600;
                    color: #F59E0B;
                    margin-bottom: 12px;
                }
                /* Центрування та внутрішній скрол модальних вікон без зміщення вниз на планшеті та телефоні */
                .modal-backdrop:not([hidden]) {
                    position: fixed !important;
                    inset: 0 !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    z-index: 1000 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 16px !important;
                    margin: 0 !important;
                    overflow: hidden !important;
                    overscroll-behavior: contain;
                }
                .modal-backdrop .modal {
                    position: relative !important;
                    top: auto !important;
                    left: auto !important;
                    right: auto !important;
                    bottom: auto !important;
                    transform: none !important;
                    width: 100% !important;
                    max-height: calc(100vh - 32px) !important;
                    max-height: calc(100dvh - 32px) !important;
                    margin: 0 !important;
                    overflow-y: auto !important;
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior: contain;
                }
                #shopModal .modal,
                #replacePartModal .modal {
                    display: flex !important;
                    flex-direction: column !important;
                    max-width: 680px !important;
                    overflow: hidden !important;
                }
                #shopModalList,
                #replaceModalList {
                    flex: 1 1 auto;
                    min-height: 0;
                    max-height: none !important;
                    overflow-y: auto !important;
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior: contain;
                    padding-right: 4px;
                }
                #shopModal .shop-modal-footer {
                    flex-shrink: 0;
                    margin-top: 12px;
                }
                .shop-copy-row {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 10px;
                    width: 100%;
                }
                .shop-copy-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    height: 34px;
                    padding: 0 12px;
                    border-radius: 9px;
                    border: 1px solid #282E3A;
                    background: #1D222B;
                    color: #F2F4F8;
                    font-family: inherit;
                    font-size: 12px;
                    font-weight: 600;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: border-color 0.2s, color 0.2s;
                }
                .shop-copy-btn:hover {
                    border-color: #B6F24A;
                    color: #B6F24A;
                }
                [data-theme="light"] .shop-copy-btn {
                    border-color: #CBD5E1;
                    background: #F8FAFC;
                    color: #0F172A;
                }
                [data-theme="light"] .shop-copy-btn:hover {
                    border-color: #65A30D;
                    color: #3D5E06;
                }
                .replace-toolbar {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    padding: 10px 12px;
                    margin-bottom: 12px;
                    border-radius: 10px;
                    border: 1px solid #282E3A;
                    background: #161B22;
                }
                [data-theme="light"] .replace-toolbar {
                    border-color: #E2E8F0;
                    background: #F8FAFC;
                }
                .replace-stock-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #F2F4F8;
                    cursor: pointer;
                    user-select: none;
                }
                [data-theme="light"] .replace-stock-label {
                    color: #0F172A;
                }
                .replace-stock-label input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                    accent-color: #B6F24A;
                    cursor: pointer;
                }
                .replace-sort-select {
                    height: 32px;
                    padding: 0 10px;
                    border-radius: 8px;
                    border: 1px solid #282E3A;
                    background: #1D222B;
                    color: #F2F4F8;
                    color-scheme: dark;
                    font-family: inherit;
                    font-size: 12px;
                    font-weight: 600;
                    outline: none;
                    cursor: pointer;
                }
                [data-theme="light"] .replace-sort-select {
                    border-color: #CBD5E1;
                    background: #FFFFFF;
                    color: #0F172A;
                    color-scheme: light;
                }
                .alt-diff-pill {
                    display: inline-flex;
                    align-items: center;
                    height: 22px;
                    padding: 0 8px;
                    border-radius: 999px;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 11px;
                    font-weight: 700;
                    white-space: nowrap;
                }
                .alt-diff-pill--cheaper {
                    background: rgba(34, 197, 94, 0.14);
                    color: #22C55E;
                }
                .alt-diff-pill--expensive {
                    background: rgba(239, 68, 68, 0.14);
                    color: #EF4444;
                }
                .alt-diff-pill--same {
                    background: rgba(148, 163, 184, 0.14);
                    color: #939AA8;
                }
                .replace-empty-note {
                    padding: 20px;
                    text-align: center;
                    color: #939AA8;
                    font-size: 14px;
                }
                .score-bar__fill {
                    transition: width 0.35s ease, background-color 0.25s ease;
                }
                @media (max-width: 560px) {
                    .modal-backdrop:not([hidden]) {
                        padding: 10px !important;
                    }
                    .modal-backdrop .modal {
                        max-height: calc(100vh - 20px) !important;
                        max-height: calc(100dvh - 20px) !important;
                        padding: 16px !important;
                        border-radius: 16px !important;
                    }
                    .shop-item {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 10px;
                    }
                    .shop-item__right {
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        justify-content: space-between;
                        width: 100%;
                        padding-top: 8px;
                        border-top: 1px solid rgba(148, 163, 184, 0.14);
                    }
                    .shop-buy-btn {
                        white-space: nowrap;
                        flex-shrink: 0;
                        padding: 0 12px;
                        font-size: 12px;
                    }
                    .shop-modal-footer {
                        flex-wrap: wrap;
                        gap: 8px;
                    }
                }
                @media (max-width: 480px) {
                    .scenario-section .brand-row {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 8px;
                    }
                    .scenario-chip {
                        height: 34px;
                        padding: 0 12px;
                        font-size: 12px;
                    }
                    .part-row {
                        gap: 8px;
                    }
                    .part-row__name {
                        font-size: 13px;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        injectInteractiveStyles();

        const state = {
            currency: 'UAH',
            baseBudgetUah: 40000,
            scenario: 'GAMING',
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
            lastScenario: 'GAMING',
            hasGenerated: false
        };

        // DOM-елементи
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

        const replacePartModal = document.getElementById('replacePartModal');
        const replaceModalCategoryTag = document.getElementById('replaceModalCategoryTag');
        const replaceModalTitle = document.getElementById('replaceModalTitle');
        const replaceModalSubtitle = document.getElementById('replaceModalSubtitle');
        const replaceModalList = document.getElementById('replaceModalList');

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

        function showToastMessage(message) {
            const container = document.getElementById('pcpToastContainer');
            if (!container) return;
            const toast = document.createElement('div');
            toast.className = 'pcp-toast';
            toast.textContent = message;
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 3500);
        }

        async function copyBuildToClipboard(buildIdx) {
            const build = state.lastBuilds[buildIdx];
            if (!build) return;

            const meta = BUILD_META[buildIdx] || BUILD_META[0];
            const parts = normalizeParts(build);
            const title = build.title || build.name || meta.defaultTitle;
            const scenarioLabel = SCENARIO_TITLES[build.scenario || state.lastScenario] || '';
            const totalUah = Number(build.totalPriceUah ?? build.totalPrice ?? parts.reduce((acc, p) => acc + p.priceUah, 0));
            const totalDisplay = state.lastCurrency === 'UAH' ? totalUah : fromUah(totalUah, state.lastCurrency);

            const lines = [
                `PCPicker — ${title}${scenarioLabel ? ` (${scenarioLabel})` : ''}`,
                ...parts.map((p) => `• ${p.categoryLabel}: ${p.name} — ${formatMoney(p.displayPrice, state.lastCurrency)} (${p.storeName})`),
                `Разом: ${formatMoney(totalDisplay, state.lastCurrency)}`
            ];
            const textToCopy = lines.join('\n');

            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(textToCopy);
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = textToCopy;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    ta.remove();
                }
                showToastMessage('Список комплектуючих скопійовано в буфер обміну.');
            } catch (err) {
                showToastMessage('Не вдалося скопіювати список.');
            }
        }

        // Форматування чисел із нерозривним пробілом, щоб символ валюти не переносився окремо
        function formatNumber(num) {
            return Math.round(Number(num) || 0)
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
        }

        function formatMoney(amount, currency = state.currency) {
            const symbol = CURRENCY_SYMBOLS[currency] || '₴';
            return `${formatNumber(amount)}\u00A0${symbol}`;
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

        function lockBodyScroll() {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        }

        function unlockBodyScroll() {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        }

        // Мобільне бургер-меню (із захистом від дублюючого обробника)
        let lastBurgerToggleAt = 0;

        function getMobileMenuElements() {
            const btn = document.getElementById('burgerBtn') || document.querySelector('.burger-btn, [data-burger-toggle]');
            const menu = document.getElementById('mobileMenu') || document.querySelector('.mobile-menu');
            return { btn, menu };
        }

        function setMobileMenuOpen(isOpen) {
            const { btn, menu } = getMobileMenuElements();
            if (!menu) return;
            menu.hidden = !isOpen;
            menu.classList.toggle('is-open', isOpen);
            if (btn) {
                btn.setAttribute('aria-expanded', String(isOpen));
                btn.classList.toggle('is-active', isOpen);
            }
        }

        function closeMobileMenu() {
            setMobileMenuOpen(false);
        }

        function toggleMobileMenu() {
            const now = Date.now();
            if (now - lastBurgerToggleAt < 120) return;
            lastBurgerToggleAt = now;

            const { menu } = getMobileMenuElements();
            if (!menu) return;
            const currentlyHidden = menu.hidden && !menu.classList.contains('is-open');
            setMobileMenuOpen(currentlyHidden);
        }

        document.addEventListener('click', (e) => {
            const burgerTrigger = e.target.closest('#burgerBtn, .burger-btn, [data-burger-toggle]');
            if (burgerTrigger) {
                e.preventDefault();
                e.stopImmediatePropagation();
                toggleMobileMenu();
                return;
            }

            const { menu } = getMobileMenuElements();
            if (menu && (!menu.hidden || menu.classList.contains('is-open'))) {
                if (e.target.closest('#mobileMenu a, #mobileMenu button, .mobile-menu a, .mobile-menu button')) {
                    closeMobileMenu();
                } else if (!e.target.closest('#mobileMenu, .mobile-menu')) {
                    closeMobileMenu();
                }
            }
        }, true);

        // Модальні вікна та випадаючі меню карток
        document.querySelectorAll('[data-modal]').forEach((trigger) => {
            trigger.addEventListener('click', () => {
                const targetId = trigger.getAttribute('data-modal');
                const modal = document.getElementById(targetId);
                if (modal) {
                    modal.hidden = false;
                    lockBodyScroll();
                }
                closeMobileMenu();
            });
        });

        function closeAllModals() {
            document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
                backdrop.hidden = true;
            });
            unlockBodyScroll();
        }

        function closeAllBuildMenus() {
            document.querySelectorAll('.build-card__dropdown').forEach((menu) => {
                menu.hidden = true;
            });
            document.querySelectorAll('[data-toggle-build-menu]').forEach((btn) => {
                btn.setAttribute('aria-expanded', 'false');
            });
        }

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.build-card__menu-wrap')) {
                closeAllBuildMenus();
            }
        });

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
                closeAllBuildMenus();
                closeMobileMenu();
            }
        });

        // Перемикач валют (₴ / $ / €)
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

                if (state.hasGenerated && state.lastBuilds.length > 0) {
                    state.lastCurrency = nextCurrency;
                    state.lastBudgetAmount = fromUah(state.baseBudgetUah, nextCurrency);
                    renderResults(state.lastBuilds, state.lastBudgetAmount, nextCurrency);
                }
            });
        });

        // Перемикач сценаріїв підбору («Ігри», «Робота і монтаж», «Офіс і навчання»)
        document.querySelectorAll('.scenario-chip').forEach((chip) => {
            chip.addEventListener('click', () => {
                const nextScenario = chip.getAttribute('data-scenario');
                if (!nextScenario) return;
                state.scenario = nextScenario;

                document.querySelectorAll('.scenario-chip').forEach((c) => {
                    const active = c === chip;
                    c.classList.toggle('is-selected', active);
                    c.setAttribute('aria-checked', String(active));
                });
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

            let wakeTimer = null;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Підбираємо...';
                wakeTimer = setTimeout(() => {
                    if (submitBtn && submitBtn.disabled) {
                        submitBtn.textContent = 'Сервер прокидається (до 30 с)...';
                    }
                }, 3500);
            }

            const selectedBrands = Array.from(new Set([
                ...state.cpuBrands,
                ...state.gpuBrands
            ]));

            const payload = {
                budget: enteredAmount,
                currency: state.currency,
                brands: selectedBrands,
                scenario: state.scenario
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
                state.lastScenario = state.scenario;
                state.hasGenerated = true;

                if (formCard) formCard.classList.add('is-compact');
                renderResults(state.lastBuilds, enteredAmount, state.currency);
            } catch (error) {
                console.error('Помилка генерації збірок:', error);
                showEmptyState();
            } finally {
                if (wakeTimer) clearTimeout(wakeTimer);
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

        // Вага кожної категорії комплектуючих у розрахунку шкал порівняння (1-10)
        const SCORE_WEIGHTS = {
            GPU:         { gaming: 0.60, work: 0.28, tech: 0.35 },
            CPU:         { gaming: 0.28, work: 0.48, tech: 0.30 },
            RAM:         { gaming: 0.08, work: 0.16, tech: 0.14 },
            MOTHERBOARD: { gaming: 0.02, work: 0.03, tech: 0.14 },
            STORAGE:     { gaming: 0.01, work: 0.04, tech: 0.04 },
            PSU:         { gaming: 0.01, work: 0.01, tech: 0.02 },
            CASE:        { gaming: 0.00, work: 0.00, tech: 0.01 }
        };

        function clampScore(val) {
            return Math.max(1, Math.min(10, val));
        }

        function normalizeRawScore(rawVal, fallback) {
            const num = Number(rawVal);
            if (!Number.isFinite(num) || num <= 0) return fallback;
            const scaled = num > 10 ? num / 10 : num;
            return clampScore(scaled);
        }

        function getExactBuildScores(build, idx) {
            if (build._exactScores) {
                return { ...build._exactScores };
            }
            const scores = build.scores || {};
            const gaming = normalizeRawScore(scores.gaming ?? build.gamingScore, idx === 1 ? 9 : idx === 2 ? 8 : 7);
            const work = normalizeRawScore(scores.work ?? build.workScore, idx === 2 ? 8 : 7);
            const tech = normalizeRawScore(scores.futureProof ?? scores.tech ?? build.techScore, idx === 2 ? 9 : idx === 1 ? 7 : 6);
            return { gaming, work, tech };
        }

        function getInitialBuildScores(build, idx) {
            const exact = getExactBuildScores(build, idx);
            return {
                gaming: Math.round(exact.gaming),
                work: Math.round(exact.work),
                tech: Math.round(exact.tech)
            };
        }

        function detectSpecBonus(category, oldPart, newPart) {
            const oldName = String(oldPart?.name || '');
            const newName = String(newPart?.name || '');
            const bonus = { gaming: 0, work: 0, tech: 0 };

            if (category === 'RAM' || category === 'MOTHERBOARD') {
                const oldDdr5 = /\bddr5\b/i.test(oldName) || String(oldPart?.ramType || '').toUpperCase() === 'DDR5';
                const newDdr5 = /\bddr5\b/i.test(newName) || String(newPart?.ramType || '').toUpperCase() === 'DDR5';
                if (!oldDdr5 && newDdr5) bonus.tech += 0.5;
                if (oldDdr5 && !newDdr5) bonus.tech -= 0.5;
            }

            if (category === 'RAM') {
                const oldGb = Number((oldName.match(/(\d+)\s*(gb|гб)/i) || [])[1] || 16);
                const newGb = Number((newName.match(/(\d+)\s*(gb|гб)/i) || [])[1] || 16);
                if (newGb > oldGb) {
                    bonus.work += 0.45;
                    bonus.gaming += 0.2;
                } else if (newGb < oldGb) {
                    bonus.work -= 0.45;
                    bonus.gaming -= 0.2;
                }
            }

            if (category === 'GPU') {
                const isNextGen = (s) => /\b(rtx\s*[45]\d{3}|rx\s*[79]\d{3}|arc\s*b\d{3})\b/i.test(s);
                if (!isNextGen(oldName) && isNextGen(newName)) bonus.tech += 0.4;
                if (isNextGen(oldName) && !isNextGen(newName)) bonus.tech -= 0.4;
            }

            return bonus;
        }

        function recalculateBuildScores(build, buildIdx, oldPart, newPart) {
            if (!build) return;

            if (!build._exactScores) {
                build._exactScores = getExactBuildScores(build, buildIdx);
            }

            const category = resolveCanonicalCategory(newPart || oldPart);
            const weights = SCORE_WEIGHTS[category] || { gaming: 0.02, work: 0.02, tech: 0.02 };

            const oldPrice = Math.max(500, Number(oldPart?.priceUah ?? oldPart?.price ?? 0));
            const newPrice = Math.max(500, Number(newPart?.priceUah ?? newPart?.price ?? 0));

            const ratio = (newPrice - oldPrice) / oldPrice;
            const tierShift = Math.max(-4.5, Math.min(4.5, Math.sign(ratio) * Math.log1p(Math.abs(ratio)) * 4.2));
            const specBonus = detectSpecBonus(category, oldPart, newPart);

            build._exactScores.gaming = clampScore(build._exactScores.gaming + tierShift * weights.gaming + specBonus.gaming);
            build._exactScores.work = clampScore(build._exactScores.work + tierShift * weights.work + specBonus.work);
            build._exactScores.tech = clampScore(build._exactScores.tech + tierShift * weights.tech + specBonus.tech);

            const roundedGaming = Math.round(build._exactScores.gaming);
            const roundedWork = Math.round(build._exactScores.work);
            const roundedTech = Math.round(build._exactScores.tech);

            build.scores = {
                ...(build.scores || {}),
                gaming: roundedGaming,
                work: roundedWork,
                futureProof: roundedTech,
                tech: roundedTech
            };
            build.gamingScore = roundedGaming;
            build.workScore = roundedWork;
            build.techScore = roundedTech;
        }

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
                    socket: p.socket || null,
                    ramType: p.ramType || p.memoryType || null,
                    brand: p.brand || p.manufacturer || null,
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
                const scenarioSuffix = SCENARIO_TITLES[state.lastScenario] ? ` · ${SCENARIO_TITLES[state.lastScenario]}` : '';
                resultsTitle.textContent = `Твої ${builds.length} збірки за ${formatMoney(budgetAmount, currency)}${scenarioSuffix}`;
            }

            if (buildsGrid) {
                buildsGrid.innerHTML = builds.map((build, idx) => {
                    const meta = BUILD_META[idx] || BUILD_META[0];
                    const parts = normalizeParts(build);
                    const title = build.title || build.name || meta.defaultTitle;
                    const totalUah = Number(build.totalPriceUah ?? build.totalPrice ?? parts.reduce((acc, p) => acc + p.priceUah, 0));
                    const totalDisplay = currency === 'UAH' ? totalUah : fromUah(totalUah, currency);

                    const isWithinBudget = totalDisplay <= budgetAmount;
                    const budgetDiff = Math.abs(totalDisplay - budgetAmount);
                    const budgetStatusHtml = isWithinBudget
                        ? `<div class="build-card__budget-ok">✓ Вкладається в бюджет ${formatMoney(budgetAmount, currency)}</div>`
                        : `<div class="build-card__budget-over">⚠ Перевищує бюджет на ${formatMoney(budgetDiff, currency)}</div>`;

                    const partsHtml = parts.map((part, partIdx) => `
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
                            <div class="part-row__right">
                                <span class="part-row__price">${formatMoney(part.displayPrice, currency)}</span>
                                <button
                                    type="button"
                                    class="part-row__replace-btn"
                                    data-replace-build="${idx}"
                                    data-replace-part="${partIdx}"
                                    title="Замінити комплектуючу"
                                    aria-label="Замінити ${escapeHtml(part.categoryLabel)}"
                                >⇄ Замінити</button>
                            </div>
                        </div>
                    `).join('');

                    return `
                        <article class="build-card">
                            <div class="build-card__top">
                                <span class="tag ${meta.tagClass}">${meta.tagText}</span>
                                <div class="build-card__top-right">
                                    <span class="build-card__count">${parts.length} деталей</span>
                                    <div class="build-card__menu-wrap">
                                        <button
                                            type="button"
                                            class="build-card__menu-btn"
                                            data-toggle-build-menu="${idx}"
                                            aria-label="Додаткові дії"
                                            aria-haspopup="true"
                                            aria-expanded="false"
                                            title="Додаткові дії"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                <circle cx="12" cy="5" r="2"/>
                                                <circle cx="12" cy="12" r="2"/>
                                                <circle cx="12" cy="19" r="2"/>
                                            </svg>
                                        </button>
                                        <div class="build-card__dropdown" data-build-menu="${idx}" role="menu" hidden>
                                            <button type="button" class="build-card__dropdown-item" data-copy-build="${idx}" role="menuitem">
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                                </svg>
                                                <span>Скопіювати склад</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <h3 class="build-card__title">${escapeHtml(title)}</h3>
                            <div class="parts-list">${partsHtml}</div>
                            <div class="build-card__footer">
                                <div class="build-card__total-row">
                                    <span class="build-card__total-label">Разом</span>
                                    <span class="build-card__total-value">${formatMoney(totalDisplay, currency)}</span>
                                </div>
                                ${budgetStatusHtml}
                                <div class="build-card__actions">
                                    <button type="button" class="btn-primary build-card__shop-btn" data-open-shop="${idx}">До магазину</button>
                                    <button type="button" class="btn-save-build" data-save-build="${idx}">🔖 Зберегти</button>
                                </div>
                            </div>
                        </article>
                    `;
                }).join('');

                buildsGrid.querySelectorAll('[data-toggle-build-menu]').forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const idx = btn.getAttribute('data-toggle-build-menu');
                        const menu = buildsGrid.querySelector(`[data-build-menu="${idx}"]`);
                        if (!menu) return;
                        const willOpen = menu.hidden;
                        closeAllBuildMenus();
                        menu.hidden = !willOpen;
                        btn.setAttribute('aria-expanded', String(willOpen));
                    });
                });

                buildsGrid.querySelectorAll('[data-copy-build]').forEach((btn) => {
                    btn.addEventListener('click', () => {
                        const idx = Number(btn.getAttribute('data-copy-build'));
                        closeAllBuildMenus();
                        copyBuildToClipboard(idx);
                    });
                });

                buildsGrid.querySelectorAll('[data-replace-build]').forEach((btn) => {
                    btn.addEventListener('click', () => {
                        const buildIdx = Number(btn.getAttribute('data-replace-build'));
                        const partIdx = Number(btn.getAttribute('data-replace-part'));
                        openReplacePartModal(buildIdx, partIdx);
                    });
                });

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
                            scenario: build.scenario || state.lastScenario || 'GAMING',
                            componentIds
                        }, btn);
                    });
                });
            }

            renderComparison(builds, budgetAmount, currency);

            if (resultsSection) resultsSection.hidden = false;
        }

        async function openReplacePartModal(buildIdx, partIdx) {
            const build = state.lastBuilds[buildIdx];
            if (!build || !replacePartModal) return;

            const meta = BUILD_META[buildIdx] || BUILD_META[0];
            const parts = normalizeParts(build);
            const currentPart = parts[partIdx];
            if (!currentPart) return;

            if (replaceModalCategoryTag) {
                replaceModalCategoryTag.className = `tag ${meta.tagClass}`;
                replaceModalCategoryTag.textContent = currentPart.categoryLabel;
            }
            if (replaceModalTitle) {
                replaceModalTitle.textContent = `Замінити: ${currentPart.name}`;
            }
            if (replaceModalSubtitle) {
                replaceModalSubtitle.textContent = `Поточна ціна: ${formatMoney(currentPart.displayPrice, state.lastCurrency)} • Сумісні варіанти для цієї збірки`;
            }
            if (replaceModalList) {
                replaceModalList.innerHTML = `<div class="replace-empty-note">Пошук сумісних комплектуючих...</div>`;
                replaceModalList.scrollTop = 0;
            }

            replacePartModal.hidden = false;
            lockBodyScroll();

            const params = new URLSearchParams();
            params.set('category', currentPart.rawCategory);
            params.set('type', currentPart.rawCategory);
            if (currentPart.componentId !== null) {
                params.set('componentId', String(currentPart.componentId));
            }

            const cpuPart = parts.find((p) => p.rawCategory === 'CPU');
            const mbPart = parts.find((p) => p.rawCategory === 'MOTHERBOARD');
            const ramPart = parts.find((p) => p.rawCategory === 'RAM');
            const gpuPart = parts.find((p) => p.rawCategory === 'GPU');
            const psuPart = parts.find((p) => p.rawCategory === 'PSU');
            const casePart = parts.find((p) => p.rawCategory === 'CASE');

            if (cpuPart?.componentId != null) params.set('cpuId', String(cpuPart.componentId));
            if (mbPart?.componentId != null) params.set('motherboardId', String(mbPart.componentId));
            if (ramPart?.componentId != null) params.set('ramId', String(ramPart.componentId));
            if (gpuPart?.componentId != null) params.set('gpuId', String(gpuPart.componentId));
            if (psuPart?.componentId != null) params.set('psuId', String(psuPart.componentId));
            if (casePart?.componentId != null) params.set('caseId', String(casePart.componentId));

            const socket = cpuPart?.socket || mbPart?.socket;
            if (socket) params.set('socket', socket);

            const ramType = ramPart?.ramType || mbPart?.ramType;
            if (ramType) params.set('ramType', ramType);

            params.set('budget', String(state.baseBudgetUah));
            params.set('currency', state.lastCurrency);

            try {
                const response = await fetch(apiUrl(`/api/components/compatible?${params.toString()}`));
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                const alternatives = Array.isArray(data)
                    ? data
                    : (data.components || data.items || data.alternatives || data.content || []);

                if (!alternatives || alternatives.length === 0) {
                    if (replaceModalList) {
                        replaceModalList.innerHTML = `<div class="replace-empty-note">Сумісних альтернатив для цієї деталі не знайдено.</div>`;
                    }
                    return;
                }

                let onlyInStock = false;
                let sortOrder = 'DEFAULT';

                function renderAlternativesList() {
                    if (!replaceModalList) return;

                    let visibleList = [...alternatives];
                    if (onlyInStock) {
                        visibleList = visibleList.filter((alt) => (
                            alt.inStock !== undefined ? Boolean(alt.inStock) : (alt.in_stock !== undefined ? Boolean(alt.in_stock) : true)
                        ));
                    }

                    if (sortOrder === 'PRICE_ASC') {
                        visibleList.sort((a, b) => Number(a.priceUah ?? a.price ?? 0) - Number(b.priceUah ?? b.price ?? 0));
                    } else if (sortOrder === 'PRICE_DESC') {
                        visibleList.sort((a, b) => Number(b.priceUah ?? b.price ?? 0) - Number(a.priceUah ?? a.price ?? 0));
                    }

                    const toolbarHtml = `
                        <div class="replace-toolbar">
                            <label class="replace-stock-label">
                                <input type="checkbox" id="replaceOnlyInStockCheck" ${onlyInStock ? 'checked' : ''}>
                                <span>Тільки в наявності</span>
                            </label>
                            <select id="replaceSortSelect" class="replace-sort-select" aria-label="Сортування альтернатив">
                                <option value="DEFAULT" ${sortOrder === 'DEFAULT' ? 'selected' : ''}>За замовчуванням</option>
                                <option value="PRICE_ASC" ${sortOrder === 'PRICE_ASC' ? 'selected' : ''}>Спочатку дешевші</option>
                                <option value="PRICE_DESC" ${sortOrder === 'PRICE_DESC' ? 'selected' : ''}>Спочатку дорожчі</option>
                            </select>
                        </div>
                    `;

                    const itemsHtml = visibleList.length === 0
                        ? `<div class="replace-empty-note">Немає сумісних деталей у наявності. Зніміть фільтр «Тільки в наявності».</div>`
                        : visibleList.map((alt, visibleIdx) => {
                            const altId = alt.componentId ?? alt.id ?? null;
                            const altPriceUah = Number(alt.priceUah ?? alt.price ?? 0);
                            const altDisplayPrice = state.lastCurrency === 'UAH'
                                ? altPriceUah
                                : fromUah(altPriceUah, state.lastCurrency);

                            const diffUah = altPriceUah - currentPart.priceUah;
                            const diffAbsDisplay = fromUah(Math.abs(diffUah), state.lastCurrency);

                            let diffBadgeHtml = `<span class="alt-diff-pill alt-diff-pill--same">Та сама ціна</span>`;
                            if (diffUah < 0) {
                                diffBadgeHtml = `<span class="alt-diff-pill alt-diff-pill--cheaper">-${formatMoney(diffAbsDisplay, state.lastCurrency)}</span>`;
                            } else if (diffUah > 0) {
                                diffBadgeHtml = `<span class="alt-diff-pill alt-diff-pill--expensive">+${formatMoney(diffAbsDisplay, state.lastCurrency)}</span>`;
                            }

                            const storeName = normalizeStoreDisplayName(alt.storeName ?? alt.store_name);
                            const inStock = alt.inStock !== undefined ? Boolean(alt.inStock) : (alt.in_stock !== undefined ? Boolean(alt.in_stock) : true);
                            const isCurrent = altId !== null && currentPart.componentId !== null && String(altId) === String(currentPart.componentId);
                            const specInfo = [alt.socket, alt.ramType || alt.memoryType, alt.specs].filter(Boolean).join(' • ');

                            const stockBadge = inStock
                                ? '<span class="stock-pill stock-pill--in"><span class="stock-pill__dot" aria-hidden="true"></span>В наявності</span>'
                                : '<span class="stock-pill stock-pill--out"><span class="stock-pill__dot" aria-hidden="true"></span>Немає в наявності</span>';

                            const actionBtn = isCurrent
                                ? '<button type="button" class="shop-buy-btn shop-buy-btn--disabled" disabled>Поточна</button>'
                                : `<button type="button" class="shop-buy-btn" data-select-alt="${visibleIdx}">Обрати</button>`;

                            return `
                                <div class="shop-item">
                                    <div class="shop-item__left">
                                        <div class="shop-item__meta">
                                            <span class="shop-item__cat">${escapeHtml(currentPart.categoryLabel)}</span>
                                            ${diffBadgeHtml}
                                        </div>
                                        <div class="shop-item__name">${escapeHtml(alt.name || 'Комплектуюча')}</div>
                                        <div class="shop-item__badges">
                                            <span class="store-pill">${escapeHtml(storeName)}</span>
                                            ${stockBadge}
                                            ${specInfo ? `<span class="store-pill">${escapeHtml(specInfo)}</span>` : ''}
                                        </div>
                                    </div>
                                    <div class="shop-item__right">
                                        <span class="shop-item__price">${formatMoney(altDisplayPrice, state.lastCurrency)}</span>
                                        ${actionBtn}
                                    </div>
                                </div>
                            `;
                        }).join('');

                    replaceModalList.innerHTML = toolbarHtml + itemsHtml;

                    document.getElementById('replaceOnlyInStockCheck')?.addEventListener('change', (e) => {
                        onlyInStock = Boolean(e.target.checked);
                        renderAlternativesList();
                    });

                    document.getElementById('replaceSortSelect')?.addEventListener('change', (e) => {
                        sortOrder = e.target.value;
                        renderAlternativesList();
                    });

                    replaceModalList.querySelectorAll('[data-select-alt]').forEach((btn) => {
                        btn.addEventListener('click', () => {
                            const visibleIdx = Number(btn.getAttribute('data-select-alt'));
                            const selectedAlt = visibleList[visibleIdx];
                            if (selectedAlt) {
                                applyPartReplacement(buildIdx, partIdx, selectedAlt);
                            }
                        });
                    });
                }

                renderAlternativesList();
            } catch (err) {
                console.error('Помилка завантаження альтернатив:', err);
                if (replaceModalList) {
                    replaceModalList.innerHTML = `<div class="replace-empty-note">Не вдалося завантажити сумісні комплектуючі.</div>`;
                }
            }
        }

        function applyPartReplacement(buildIdx, partIdx, selectedAlt) {
            const build = state.lastBuilds[buildIdx];
            if (!build) return;

            const sourceKey = Array.isArray(build.parts) ? 'parts' : 'components';
            const list = Array.isArray(build[sourceKey]) ? [...build[sourceKey]] : [];
            const oldPart = list[partIdx];
            if (!oldPart) return;

            const altId = selectedAlt.componentId ?? selectedAlt.id ?? null;
            const altPriceUah = Number(selectedAlt.priceUah ?? selectedAlt.price ?? 0);

            const newPartObj = {
                ...oldPart,
                componentId: altId,
                id: altId,
                category: selectedAlt.category || selectedAlt.type || oldPart.category || oldPart.type,
                type: selectedAlt.type || selectedAlt.category || oldPart.type || oldPart.category,
                name: selectedAlt.name || oldPart.name,
                priceUah: altPriceUah,
                price: altPriceUah,
                currency: 'UAH',
                socket: selectedAlt.socket ?? oldPart.socket,
                ramType: selectedAlt.ramType ?? selectedAlt.memoryType ?? oldPart.ramType,
                brand: selectedAlt.brand ?? selectedAlt.manufacturer ?? oldPart.brand,
                storeName: selectedAlt.storeName ?? selectedAlt.store_name ?? oldPart.storeName,
                inStock: selectedAlt.inStock !== undefined ? selectedAlt.inStock : (selectedAlt.in_stock !== undefined ? selectedAlt.in_stock : true),
                affiliateUrl: selectedAlt.affiliateUrl || (altId !== null ? `/api/affiliate/go/${encodeURIComponent(altId)}` : oldPart.affiliateUrl),
                promoLabel: selectedAlt.promoLabel ?? selectedAlt.promo_label ?? null,
                sponsored: Boolean(selectedAlt.sponsored || selectedAlt.promoLabel || selectedAlt.promo_label)
            };

            list[partIdx] = newPartObj;

            const newTotalUah = list.reduce((sum, item) => sum + Number(item.priceUah ?? item.price ?? 0), 0);

            build.parts = list;
            if (sourceKey !== 'parts') {
                delete build[sourceKey];
            }
            build.totalPriceUah = newTotalUah;
            build.totalPrice = newTotalUah;

            recalculateBuildScores(build, buildIdx, oldPart, newPartObj);

            closeAllModals();
            renderResults(state.lastBuilds, state.lastBudgetAmount, state.lastCurrency);
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
                shopModalList.scrollTop = 0;
            }

            if (shopModalTotal) {
                shopModalTotal.textContent = formatMoney(totalDisplay, state.lastCurrency);
            }

            const footerEl = shopModal.querySelector('.shop-modal-footer');
            if (footerEl) {
                let copyBtn = document.getElementById('shopModalCopyBtn');
                if (!copyBtn) {
                    const copyRow = document.createElement('div');
                    copyRow.className = 'shop-copy-row';
                    copyRow.innerHTML = `<button type="button" id="shopModalCopyBtn" class="shop-copy-btn">📋 Скопіювати склад збірки</button>`;
                    footerEl.appendChild(copyRow);
                    copyBtn = document.getElementById('shopModalCopyBtn');
                }
                copyBtn.onclick = () => copyBuildToClipboard(buildIndex);
            }

            shopModal.hidden = false;
            lockBodyScroll();
        }

        function renderComparison(builds, budgetAmount, currency) {
            if (!comparisonContainer) return;

            const normalized = builds.map((b, idx) => {
                const parts = normalizeParts(b);
                const findPart = (cats) => parts.find((p) => cats.includes(p.rawCategory));
                const totalUah = Number(b.totalPriceUah ?? b.totalPrice ?? parts.reduce((s, p) => s + p.priceUah, 0));
                const totalDisplay = currency === 'UAH' ? totalUah : fromUah(totalUah, currency);
                const remainingDisplay = Math.max(0, budgetAmount - totalDisplay);

                const initialScores = getInitialBuildScores(b, idx);
                const cpuPart = findPart(['CPU']);
                const gpuPart = findPart(['GPU']);

                return {
                    meta: BUILD_META[idx] || BUILD_META[0],
                    cpu: cpuPart?.name || '—',
                    cpuPriceUah: cpuPart?.priceUah || 0,
                    gpu: gpuPart?.name || '—',
                    gpuPriceUah: gpuPart?.priceUah || 0,
                    ram: findPart(['RAM'])?.name || '—',
                    storage: findPart(['STORAGE'])?.name || '—',
                    psu: findPart(['PSU'])?.name || '—',
                    gaming: initialScores.gaming,
                    work: initialScores.work,
                    tech: initialScores.tech,
                    totalDisplay,
                    remainingDisplay
                };
            });

            const maxCpuPrice = Math.max(...normalized.map((n) => n.cpuPriceUah));
            const maxGpuPrice = Math.max(...normalized.map((n) => n.gpuPriceUah));
            const maxGaming = Math.max(...normalized.map((n) => n.gaming));
            const maxWork = Math.max(...normalized.map((n) => n.work));
            const maxTech = Math.max(...normalized.map((n) => n.tech));
            const minPrice = Math.min(...normalized.map((n) => n.totalDisplay));
            const maxRemain = Math.max(...normalized.map((n) => n.remainingDisplay));

            const desktopRows = [
                { label: 'Процесор', values: normalized.map((n) => ({ text: n.cpu, best: maxCpuPrice > 0 && n.cpuPriceUah === maxCpuPrice })) },
                { label: 'Відеокарта', values: normalized.map((n) => ({ text: n.gpu, best: maxGpuPrice > 0 && n.gpuPriceUah === maxGpuPrice })) },
                { label: "Оперативна пам'ять", values: normalized.map((n) => ({ text: n.ram, best: /\b(32|64|128)\s*(гб|gb)\b/i.test(n.ram) })) },
                { label: 'Накопичувач', values: normalized.map((n) => ({ text: n.storage, best: n.storage.includes('Gen4') || n.storage.includes('Gen5') })) },
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

        // Відкриття збереженої збірки з особистого кабінету у поточній вибраній валюті
        window.onOpenSavedBuild = function (savedBuild) {
            if (!savedBuild) return;
            const totalUah = Number(savedBuild.currentTotalPriceUah ?? savedBuild.savedTotalPriceUah) || 0;
            const activeCurrency = state.currency || 'UAH';

            const mappedBuild = {
                title: savedBuild.title,
                scenario: savedBuild.scenario,
                totalPriceUah: totalUah,
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
            state.lastCurrency = activeCurrency;
            state.lastScenario = savedBuild.scenario || state.scenario;
            state.baseBudgetUah = totalUah || state.baseBudgetUah;
            state.lastBudgetAmount = activeCurrency === 'UAH' ? totalUah : fromUah(totalUah, activeCurrency);
            state.hasGenerated = true;

            if (benefitsSection) benefitsSection.hidden = true;
            if (emptySection) emptySection.hidden = true;
            renderResults(state.lastBuilds, state.lastBudgetAmount, activeCurrency);
            if (resultsTitle) {
                resultsTitle.textContent = `Збережена збірка: ${savedBuild.title}`;
            }
            if (resultsSection) {
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();