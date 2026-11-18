(() => {
    const MIN_BUDGET_UAH = 15000;

    // Состояние приложения
    const state = {
        currency: 'UAH',
        symbol: '₴',
        rates: {
            UAH: 1,
            USD: 45.34,
            EUR: 49.10
        },
        selectedBrands: new Set()
    };

    // DOM-элементы
    const form = document.getElementById('buildForm');
    const budgetInput = document.getElementById('budgetInput');
    const budgetControl = document.getElementById('budgetControl');
    const currencySymbol = document.getElementById('currencySymbol');
    const minBudgetHint = document.getElementById('minBudgetHint');
    const currencyBtns = document.querySelectorAll('.currency-btn');
    const presetBtns = document.querySelectorAll('.preset-chip');
    const brandChips = document.querySelectorAll('.brand-chip');
    const resetBrandsBtn = document.getElementById('resetBrandsBtn');
    const selectedSummary = document.getElementById('selectedSummary');

    const validationError = document.getElementById('validationError');
    const validationText = document.getElementById('validationText');
    const quickFixBtn = document.getElementById('quickFixBtn');

    const ratesText = document.getElementById('ratesText');
    const resultsArea = document.getElementById('resultsArea');
    const statusBanner = document.getElementById('statusBanner');

    // Получение актуальных курсов валют с бэкенда
    async function loadRates() {
        try {
            const response = await fetch('/api/rates');
            if (!response.ok) throw new Error('Rates unavailable');
            const data = await response.json();

            if (Array.isArray(data)) {
                data.forEach(item => {
                    const code = (item.currency || item.code || '').toUpperCase();
                    const rate = Number(item.rate || item.rateToUah);
                    if (code && rate > 0) state.rates[code] = rate;
                });
            } else if (data && typeof data === 'object') {
                if (data.USD) state.rates.USD = Number(data.USD);
                if (data.EUR) state.rates.EUR = Number(data.EUR);
            }
        } catch (_) {
            // Используем резервные курсы, если API временно недоступно
        } finally {
            ratesText.textContent = `НБУ: 1$ = ${state.rates.USD.toFixed(2)} ₴ • 1€ = ${state.rates.EUR.toFixed(2)} ₴`;
            updateCurrencyUI();
        }
    }

    // Расчет минимального порога в текущей валюте
    function getMinBudgetInCurrentCurrency() {
        if (state.currency === 'UAH') return MIN_BUDGET_UAH;
        return Math.ceil(MIN_BUDGET_UAH / state.rates[state.currency]);
    }

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // Обновление подсказок и пресетов при смене валюты
    function updateCurrencyUI() {
        const minVal = getMinBudgetInCurrentCurrency();
        currencySymbol.textContent = state.symbol;
        minBudgetHint.textContent = `Мінімум: ${formatNumber(minVal)} ${state.symbol}`;
        quickFixBtn.textContent = `Підібрати за ${formatNumber(minVal)} ${state.symbol}`;

        presetBtns.forEach(btn => {
            const uahVal = Number(btn.dataset.uah);
            const converted = state.currency === 'UAH'
                ? uahVal
                : Math.round(uahVal / state.rates[state.currency]);
            btn.textContent = `${formatNumber(converted)} ${state.symbol}`;
            btn.dataset.currentVal = converted;
        });
    }

    // Валидация введенного бюджета
    function validateBudget() {
        const raw = budgetInput.value.trim();
        const value = Number(raw);
        const minVal = getMinBudgetInCurrentCurrency();

        if (raw === '' || Number.isNaN(value) || value <= 0) {
            showError('Введіть коректну суму бюджету більшу за 0.');
            return false;
        }

        if (value < minVal) {
            showError(`Мінімальний бюджет для сумісної збірки — ${formatNumber(minVal)} ${state.symbol}.`);
            return false;
        }

        hideError();
        return true;
    }

    function showError(message) {
        budgetControl.classList.add('is-invalid');
        validationText.textContent = message;
        validationError.hidden = false;
    }

    function hideError() {
        budgetControl.classList.remove('is-invalid');
        validationError.hidden = true;
    }

    // Переключатель валют
    currencyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const newCurrency = btn.dataset.currency;
            if (newCurrency === state.currency) return;

            const currentAmount = Number(budgetInput.value);
            if (currentAmount > 0) {
                const amountInUah = currentAmount * state.rates[state.currency];
                const converted = newCurrency === 'UAH'
                    ? Math.round(amountInUah)
                    : Math.round(amountInUah / state.rates[newCurrency]);
                budgetInput.value = converted;
            }

            state.currency = newCurrency;
            state.symbol = btn.dataset.symbol;

            currencyBtns.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');

            updateCurrencyUI();
            if (!validationError.hidden) validateBudget();
        });
    });

    // Клик по пресету суммы
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            budgetInput.value = btn.dataset.currentVal;
            hideError();
        });
    });

    // Быстрая подстановка минимального бюджета при ошибке
    quickFixBtn.addEventListener('click', () => {
        budgetInput.value = getMinBudgetInCurrentCurrency();
        hideError();
        budgetInput.focus();
    });

    // Живая проверка при вводе
    budgetInput.addEventListener('input', () => {
        if (!validationError.hidden) validateBudget();
    });

    // Интерактивные кнопки выбора брендов
    brandChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const brand = chip.dataset.brand;
            if (state.selectedBrands.has(brand)) {
                state.selectedBrands.delete(brand);
                chip.classList.remove('is-selected');
                chip.setAttribute('aria-pressed', 'false');
            } else {
                state.selectedBrands.add(brand);
                chip.classList.add('is-selected');
                chip.setAttribute('aria-pressed', 'true');
            }
            updateBrandsSummary();
        });
    });

    resetBrandsBtn.addEventListener('click', () => {
        state.selectedBrands.clear();
        brandChips.forEach(chip => {
            chip.classList.remove('is-selected');
            chip.setAttribute('aria-pressed', 'false');
        });
        updateBrandsSummary();
    });

    function updateBrandsSummary() {
        const count = state.selectedBrands.size;
        resetBrandsBtn.hidden = count === 0;
        selectedSummary.textContent = count === 0
            ? 'Усі бренди дозволені'
            : `Обрано брендів: ${Array.from(state.selectedBrands).join(', ')}`;
    }

    // Отправка формы (проверка параметров перед подключением карточек сборок)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validateBudget()) return;

        const payload = {
            budget: Number(budgetInput.value),
            currency: state.currency,
            brands: Array.from(state.selectedBrands)
        };

        resultsArea.hidden = false;
        statusBanner.innerHTML = `
            <strong>Параметри форми перевірено:</strong> бюджет <strong>${formatNumber(payload.budget)} ${state.symbol} (${payload.currency})</strong>,
            фільтр брендів: <strong>${payload.brands.length ? payload.brands.join(', ') : 'будь-які'}</strong>.
            Контейнер готовий до виведення 3 карток збірок!
        `;
    });

    // Старт
    loadRates();
})();