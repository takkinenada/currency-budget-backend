(() => {
    const MIN_BUDGET_UAH = 15000;

    // 7 SVG-іконок комплектуючих з UI Kit (24x24, stroke 1.75, currentColor)
    const PART_ICONS = {
        CPU: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>`,
        GPU: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="2.5"/><circle cx="15" cy="12" r="2.5"/><path d="M6 18v2M10 18v2"/></svg>`,
        RAM: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="9" rx="1.5"/><path d="M6 16v3M10 16v3M14 16v3M18 16v3M6 10v2M10 10v2M14 10v2M18 10v2"/></svg>`,
        SSD: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h6M7 14h10"/></svg>`,
        MOTHERBOARD: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="5" height="5"/><path d="M15 7h2M15 11h2M7 16h10"/></svg>`,
        PSU: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="10" cy="12" r="3.5"/><path d="M16 9h2M16 12h2M16 15h2"/></svg>`,
        CASE: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><circle cx="12" cy="15" r="2.5"/><path d="M10 6h4"/></svg>`
    };

    const CATEGORY_LABELS = {
        CPU: 'Процесор',
        GPU: 'Відеокарта',
        RAM: "Пам'ять",
        SSD: 'Накопичувач',
        MOTHERBOARD: 'Мат. плата',
        PSU: 'Блок живлення',
        CASE: 'Корпус'
    };

    // Демо-дані 3 збірок за дизайн-макетом (без підключення API)
    const MOCK_BUILDS = [
        {
            id: 'value',
            tag: 'Ціна/якість',
            tagClass: 'tag--value',
            title: 'Збалансований ПК',
            totalPriceUah: 37470,
            parts: [
                { type: 'CPU', name: 'AMD Ryzen 5 7600', shortName: 'Ryzen 5 7600 • 6 ядер', mobileName: '7600', priceUah: 6890, url: 'https://hotline.ua', isPromo: false },
                { type: 'GPU', name: 'Radeon RX 7700 XT 12 ГБ', shortName: 'RX 7700 XT • 12 ГБ', mobileName: 'RX 7700 XT', priceUah: 15400, url: 'https://hotline.ua', isPromo: false },
                { type: 'RAM', name: '32 ГБ DDR5-6000', shortName: '32 ГБ DDR5', mobileName: '32 ГБ', priceUah: 3650, url: 'https://hotline.ua', isPromo: false },
                { type: 'SSD', name: '1 ТБ NVMe Gen4', shortName: '1 ТБ NVMe Gen4', mobileName: '1 ТБ', priceUah: 2480, url: 'https://hotline.ua', isPromo: false },
                { type: 'MOTHERBOARD', name: 'B650M', shortName: 'B650M', mobileName: 'B650M', priceUah: 4200, url: 'https://hotline.ua', isPromo: false },
                { type: 'PSU', name: '650 Вт 80+ Gold', shortName: '650 Вт Gold', mobileName: '650 Вт', priceUah: 2750, url: 'https://hotline.ua', isPromo: false },
                { type: 'CASE', name: 'Mid-Tower, 3 вент.', shortName: 'Mid-Tower', mobileName: 'Mid-Tower', priceUah: 2100, url: 'https://hotline.ua', isPromo: false }
            ],
            techFeatures: 'FSR • DDR5',
            scores: { gaming: 7, work: 7, tech: 6 }
        },
        {
            id: 'power',
            tag: 'Потужність',
            tagClass: 'tag--power',
            title: 'Максимум в іграх',
            totalPriceUah: 39850,
            parts: [
                { type: 'CPU', name: 'AMD Ryzen 5 7500F', shortName: 'Ryzen 5 7500F • 6 ядер', mobileName: '7500F', priceUah: 5200, url: 'https://hotline.ua', isPromo: false },
                { type: 'GPU', name: 'GeForce RTX 5070 12 ГБ', shortName: 'RTX 5070 • 12 ГБ', mobileName: 'RTX 5070', priceUah: 22900, url: 'https://hotline.ua', isPromo: true },
                { type: 'RAM', name: '16 ГБ DDR5-5600', shortName: '16 ГБ DDR5', mobileName: '16 ГБ', priceUah: 1900, url: 'https://hotline.ua', isPromo: false },
                { type: 'SSD', name: '1 ТБ NVMe Gen3', shortName: '1 ТБ NVMe Gen3', mobileName: '1 ТБ', priceUah: 1950, url: 'https://hotline.ua', isPromo: false },
                { type: 'MOTHERBOARD', name: 'A620M', shortName: 'A620M', mobileName: 'A620M', priceUah: 3100, url: 'https://hotline.ua', isPromo: false },
                { type: 'PSU', name: '750 Вт 80+ Bronze', shortName: '750 Вт Bronze', mobileName: '750 Вт', priceUah: 2700, url: 'https://hotline.ua', isPromo: false },
                { type: 'CASE', name: 'Mid-Tower, 3 вент.', shortName: 'Mid-Tower', mobileName: 'Mid-Tower', priceUah: 2100, url: 'https://hotline.ua', isPromo: false }
            ],
            techFeatures: 'DLSS • RT • DDR5',
            scores: { gaming: 9, work: 7, tech: 7 }
        },
        {
            id: 'tech',
            tag: 'Технології',
            tagClass: 'tag--tech',
            title: 'Сучасна платформа',
            totalPriceUah: 39990,
            parts: [
                { type: 'CPU', name: 'AMD Ryzen 5 9600X', shortName: 'Ryzen 5 9600X • 6 ядер', mobileName: '9600X', priceUah: 8900, url: 'https://hotline.ua', isPromo: true },
                { type: 'GPU', name: 'GeForce RTX 5060 Ti 16 ГБ', shortName: 'RTX 5060 Ti • 16 ГБ', mobileName: 'RTX 5060 Ti', priceUah: 17200, url: 'https://hotline.ua', isPromo: false },
                { type: 'RAM', name: '32 ГБ DDR5-6000', shortName: '32 ГБ DDR5', mobileName: '32 ГБ', priceUah: 3650, url: 'https://hotline.ua', isPromo: false },
                { type: 'SSD', name: '1 ТБ NVMe Gen4', shortName: '1 ТБ NVMe Gen4', mobileName: '1 ТБ', priceUah: 2480, url: 'https://hotline.ua', isPromo: false },
                { type: 'MOTHERBOARD', name: 'B650M Wi-Fi', shortName: 'B650M Wi-Fi', mobileName: 'B650M', priceUah: 3800, url: 'https://hotline.ua', isPromo: false },
                { type: 'PSU', name: '650 Вт 80+ Gold', shortName: '650 Вт Gold', mobileName: '650 Вт', priceUah: 2750, url: 'https://hotline.ua', isPromo: false },
                { type: 'CASE', name: 'Mini-Tower', shortName: 'Mini-Tower', mobileName: 'Mini-Tower', priceUah: 1210, url: 'https://hotline.ua', isPromo: false }
            ],
            techFeatures: 'DLSS • RT • PCIe 5.0 • DDR5',
            scores: { gaming: 8, work: 8, tech: 9 }
        }
    ];

    const state = {
        currency: 'UAH',
        symbol: '₴',
        rates: { UAH: 1, USD: 45.34, EUR: 49.10 },
        cpuBrands: new Set(),
        gpuBrands: new Set(),
        currentRenderedBuilds: []
    };

    // DOM Elements
    const heroSection = document.getElementById('heroSection');
    const formCard = document.getElementById('formCard');
    const form = document.getElementById('buildForm');
    const budgetField = document.getElementById('budgetField');
    const budgetInput = document.getElementById('budgetInput');
    const budgetHint = document.getElementById('budgetHint');
    const errorAction = document.getElementById('errorAction');
    const quickFixBtn = document.getElementById('quickFixBtn');
    const submitBtn = document.getElementById('submitBtn');

    const currencyBtns = document.querySelectorAll('.currency-btn');
    const brandChips = document.querySelectorAll('.brand-chip');

    const skeletonSection = document.getElementById('skeletonSection');
    const resultsSection = document.getElementById('resultsSection');
    const resultsTitle = document.getElementById('resultsTitle');
    const buildsGrid = document.getElementById('buildsGrid');
    const comparisonContainer = document.getElementById('comparisonContainer');
    const emptySection = document.getElementById('emptySection');
    const benefitsSection = document.getElementById('benefitsSection');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');

    // Helpers
    function formatNumber(num) {
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function convertFromUah(uahAmount) {
        if (state.currency === 'UAH') return Math.round(uahAmount);
        return Math.round(uahAmount / state.rates[state.currency]);
    }

    function formatMoneyFromUah(uahAmount) {
        return `${formatNumber(convertFromUah(uahAmount))} ${state.symbol}`;
    }

    function parseBudgetValue() {
        const cleaned = budgetInput.value.replace(/\s+/g, '').replace(',', '.');
        if (cleaned === '' || cleaned === '-') return NaN;
        return Number(cleaned);
    }

    function getMinBudget() {
        return state.currency === 'UAH'
            ? MIN_BUDGET_UAH
            : Math.ceil(MIN_BUDGET_UAH / state.rates[state.currency]);
    }

    // Validation
    function setNormalState() {
        const minVal = getMinBudget();
        budgetField.classList.remove('is-invalid');
        budgetHint.classList.remove('is-error');
        budgetHint.textContent = `Мінімум ${formatNumber(minVal)} ${state.symbol} для робочої збірки`;
        errorAction.hidden = true;
    }

    function setErrorState(message) {
        const minVal = getMinBudget();
        budgetField.classList.add('is-invalid');
        budgetHint.classList.add('is-error');
        budgetHint.textContent = message;
        quickFixBtn.textContent = `Показати збірку за ${formatNumber(minVal)} ${state.symbol}`;
        errorAction.hidden = false;
    }

    function validateBudget() {
        const val = parseBudgetValue();
        const minVal = getMinBudget();

        if (Number.isNaN(val) || val < minVal) {
            setErrorState(`Замало для повної збірки — мінімум ${formatNumber(minVal)} ${state.symbol}`);
            return false;
        }

        setNormalState();
        return true;
    }

    budgetInput.addEventListener('input', () => {
        const raw = budgetInput.value.replace(/[^\d-]/g, '');
        if (raw === '' || raw === '-') {
            budgetInput.value = raw;
        } else if (raw.startsWith('-')) {
            budgetInput.value = '-' + raw.slice(1).replace(/-/g, '');
        } else {
            budgetInput.value = formatNumber(Number(raw));
        }

        if (budgetHint.classList.contains('is-error')) {
            validateBudget();
        }
    });

    currencyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const nextCurrency = btn.dataset.currency;
            if (nextCurrency === state.currency) return;

            const current = parseBudgetValue();
            if (!Number.isNaN(current) && current > 0) {
                const uah = current * state.rates[state.currency];
                const converted = nextCurrency === 'UAH'
                    ? Math.round(uah)
                    : Math.round(uah / state.rates[nextCurrency]);
                budgetInput.value = formatNumber(converted);
            }

            state.currency = nextCurrency;
            state.symbol = btn.dataset.symbol;

            currencyBtns.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');

            if (budgetHint.classList.contains('is-error')) {
                validateBudget();
            } else {
                setNormalState();
            }
        });
    });

    quickFixBtn.addEventListener('click', () => {
        budgetInput.value = formatNumber(getMinBudget());
        setNormalState();
        runMockGeneration();
    });

    brandChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const group = chip.dataset.group === 'cpu' ? state.cpuBrands : state.gpuBrands;
            const brand = chip.dataset.brand;

            if (group.has(brand)) {
                group.delete(brand);
                chip.classList.remove('is-selected');
                chip.setAttribute('aria-pressed', 'false');
            } else {
                group.add(brand);
                chip.classList.add('is-selected');
                chip.setAttribute('aria-pressed', 'true');
            }
        });
    });

    resetFiltersBtn.addEventListener('click', () => {
        state.cpuBrands.clear();
        state.gpuBrands.clear();
        brandChips.forEach(chip => {
            chip.classList.remove('is-selected');
            chip.setAttribute('aria-pressed', 'false');
        });
        emptySection.hidden = true;
        budgetInput.focus();
    });

    // Рендер 3 карток збірок (BuildCard)
    function renderBuildCards(builds, userBudget) {
        resultsTitle.textContent = `Твої 3 збірки за ${formatNumber(userBudget)} ${state.symbol}`;

        buildsGrid.innerHTML = builds.map((build, index) => {
            const totalConverted = convertFromUah(build.totalPriceUah);
            const partsHtml = build.parts.map(part => `
                <div class="part-row">
                    <div class="part-row__left">
                        <span class="part-row__icon">${PART_ICONS[part.type] || ''}</span>
                        <div class="part-row__info">
                            <div class="part-row__meta">
                                <span class="part-row__cat">${CATEGORY_LABELS[part.type]}</span>
                                ${part.isPromo ? '<span class="promo-badge">Реклама</span>' : ''}
                            </div>
                            <div class="part-row__name" title="${part.name}">${part.name}</div>
                        </div>
                    </div>
                    <span class="part-row__price">${formatMoneyFromUah(part.priceUah)}</span>
                </div>
            `).join('');

            return `
                <article class="build-card">
                    <div class="build-card__top">
                        <span class="tag ${build.tagClass}">${build.tag}</span>
                        <span class="build-card__count">7 деталей</span>
                    </div>

                    <h3 class="build-card__title">${build.title}</h3>

                    <div class="parts-list">
                        ${partsHtml}
                    </div>

                    <div class="build-card__footer">
                        <div class="build-card__total-row">
                            <span class="build-card__total-label">Разом</span>
                            <span class="build-card__total-value">${formatNumber(totalConverted)} ${state.symbol}</span>
                        </div>
                        <div class="build-card__budget-ok">✓ Вкладається в бюджет ${formatNumber(userBudget)} ${state.symbol}</div>
                        <button type="button" class="btn-primary btn-primary--full" data-open-shop="${index}">
                            До магазину
                        </button>
                    </div>
                </article>
            `;
        }).join('');

        // Прив'язка кнопок «До магазину»
        buildsGrid.querySelectorAll('[data-open-shop]').forEach(btn => {
            btn.addEventListener('click', () => {
                const build = state.currentRenderedBuilds[Number(btn.dataset.openShop)];
                if (build) openShopModal(build);
            });
        });
    }

    // Рендер таблиці порівняння (Десктоп/Планшет + Мобільна адаптація)
    function renderComparisonTable(builds, userBudget) {
        const [valB, powB, techB] = builds;

        const maxGaming = Math.max(...builds.map(b => b.scores.gaming));
        const maxWork = Math.max(...builds.map(b => b.scores.work));
        const maxTech = Math.max(...builds.map(b => b.scores.tech));
        const minPrice = Math.min(...builds.map(b => b.totalPriceUah));

        const remainders = builds.map(b => Math.max(0, userBudget - convertFromUah(b.totalPriceUah)));
        const maxRemainder = Math.max(...remainders);

        const renderScoreDesktop = (score, isBest) => `
            <div class="score-cell">
                <div class="score-bar">
                    <div class="score-bar__fill ${isBest ? 'is-best' : ''}" style="width: ${score * 10}%"></div>
                </div>
                <span class="score-num ${isBest ? 'is-best' : ''}">${score}/10</span>
            </div>
        `;

        const renderScoreMobile = (score, isBest) => `
            <div class="cmp-mobile__score">
                <div class="score-bar">
                    <div class="score-bar__fill ${isBest ? 'is-best' : ''}" style="width: ${score * 10}%"></div>
                </div>
                <span class="score-num ${isBest ? 'is-best' : ''}">${score}/10</span>
            </div>
        `;

        // Десктоп / Планшет версія (4 колонки)
        const desktopTableHtml = `
            <table class="cmp-table">
                <thead>
                    <tr>
                        <th>Характеристика</th>
                        <th><span class="tag tag--value">Ціна/якість</span></th>
                        <th><span class="tag tag--power">Потужність</span></th>
                        <th><span class="tag tag--tech">Технології</span></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Процесор</td>
                        <td class="cmp-val">${valB.parts[0].shortName}</td>
                        <td class="cmp-val">${powB.parts[0].shortName}</td>
                        <td class="cmp-val is-best">${techB.parts[0].shortName}</td>
                    </tr>
                    <tr>
                        <td>Відеокарта</td>
                        <td class="cmp-val">${valB.parts[1].shortName}</td>
                        <td class="cmp-val is-best">${powB.parts[1].shortName}</td>
                        <td class="cmp-val">${techB.parts[1].shortName}</td>
                    </tr>
                    <tr>
                        <td>Пам'ять</td>
                        <td class="cmp-val is-best">${valB.parts[2].shortName}</td>
                        <td class="cmp-val">${powB.parts[2].shortName}</td>
                        <td class="cmp-val is-best">${techB.parts[2].shortName}</td>
                    </tr>
                    <tr>
                        <td>Накопичувач</td>
                        <td class="cmp-val is-best">${valB.parts[3].shortName}</td>
                        <td class="cmp-val">${powB.parts[3].shortName}</td>
                        <td class="cmp-val is-best">${techB.parts[3].shortName}</td>
                    </tr>
                    <tr>
                        <td>Блок живлення</td>
                        <td class="cmp-val is-best">${valB.parts[5].shortName}</td>
                        <td class="cmp-val">${powB.parts[5].shortName}</td>
                        <td class="cmp-val is-best">${techB.parts[5].shortName}</td>
                    </tr>
                    <tr>
                        <td>Технології (DLSS / FSR / DDR5)</td>
                        <td class="cmp-val">${valB.techFeatures}</td>
                        <td class="cmp-val">${powB.techFeatures}</td>
                        <td class="cmp-val is-best">${techB.techFeatures}</td>
                    </tr>
                    <tr>
                        <td>Ігри</td>
                        <td>${renderScoreDesktop(valB.scores.gaming, valB.scores.gaming === maxGaming)}</td>
                        <td>${renderScoreDesktop(powB.scores.gaming, powB.scores.gaming === maxGaming)}</td>
                        <td>${renderScoreDesktop(techB.scores.gaming, techB.scores.gaming === maxGaming)}</td>
                    </tr>
                    <tr>
                        <td>Робота і монтаж</td>
                        <td>${renderScoreDesktop(valB.scores.work, valB.scores.work === maxWork)}</td>
                        <td>${renderScoreDesktop(powB.scores.work, powB.scores.work === maxWork)}</td>
                        <td>${renderScoreDesktop(techB.scores.work, techB.scores.work === maxWork)}</td>
                    </tr>
                    <tr>
                        <td>Нові технології</td>
                        <td>${renderScoreDesktop(valB.scores.tech, valB.scores.tech === maxTech)}</td>
                        <td>${renderScoreDesktop(powB.scores.tech, powB.scores.tech === maxTech)}</td>
                        <td>${renderScoreDesktop(techB.scores.tech, techB.scores.tech === maxTech)}</td>
                    </tr>
                    <tr>
                        <td>Ціна</td>
                        <td class="cmp-val ${valB.totalPriceUah === minPrice ? 'is-best' : ''}">${formatMoneyFromUah(valB.totalPriceUah)}</td>
                        <td class="cmp-val ${powB.totalPriceUah === minPrice ? 'is-best' : ''}">${formatMoneyFromUah(powB.totalPriceUah)}</td>
                        <td class="cmp-val ${techB.totalPriceUah === minPrice ? 'is-best' : ''}">${formatMoneyFromUah(techB.totalPriceUah)}</td>
                    </tr>
                    <tr>
                        <td>Залишок бюджету</td>
                        <td class="cmp-val ${remainders[0] === maxRemainder ? 'is-best' : ''}">${formatNumber(remainders[0])} ${state.symbol}</td>
                        <td class="cmp-val ${remainders[1] === maxRemainder ? 'is-best' : ''}">${formatNumber(remainders[1])} ${state.symbol}</td>
                        <td class="cmp-val ${remainders[2] === maxRemainder ? 'is-best' : ''}">${formatNumber(remainders[2])} ${state.symbol}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td><button type="button" class="btn-secondary btn-secondary--full" data-open-shop="0">До магазину</button></td>
                        <td><button type="button" class="btn-secondary btn-secondary--full" data-open-shop="1">До магазину</button></td>
                        <td><button type="button" class="btn-secondary btn-secondary--full" data-open-shop="2">До магазину</button></td>
                    </tr>
                </tbody>
            </table>
        `;

        // Мобільна версія таблиці (< 768 px, Специфікація п. 2)
        const mobileTableHtml = `
            <div class="cmp-mobile">
                <div class="cmp-mobile__head">
                    <span class="cmp-mobile__dot-label"><span class="dot dot--value"></span>Ціна/як.</span>
                    <span class="cmp-mobile__dot-label"><span class="dot dot--power"></span>Потужн.</span>
                    <span class="cmp-mobile__dot-label"><span class="dot dot--tech"></span>Технол.</span>
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Процесор</div>
                    <div class="cmp-mobile__cols">
                        <span class="cmp-val">${valB.parts[0].mobileName}</span>
                        <span class="cmp-val">${powB.parts[0].mobileName}</span>
                        <span class="cmp-val is-best">${techB.parts[0].mobileName}</span>
                    </div>
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Відеокарта</div>
                    <div class="cmp-mobile__cols">
                        <span class="cmp-val">${valB.parts[1].mobileName}</span>
                        <span class="cmp-val is-best">${powB.parts[1].mobileName}</span>
                        <span class="cmp-val">${techB.parts[1].mobileName}</span>
                    </div>
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Пам'ять</div>
                    <div class="cmp-mobile__cols">
                        <span class="cmp-val is-best">${valB.parts[2].mobileName}</span>
                        <span class="cmp-val">${powB.parts[2].mobileName}</span>
                        <span class="cmp-val is-best">${techB.parts[2].mobileName}</span>
                    </div>
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Технології</div>
                    <div class="cmp-mobile__cols">
                        <span class="cmp-val">FSR/DDR5</span>
                        <span class="cmp-val">DLSS/RT</span>
                        <span class="cmp-val is-best">DLSS/PCIe5</span>
                    </div>
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Ігри</div>
                    <div class="cmp-mobile__cols">
                        ${renderScoreMobile(valB.scores.gaming, valB.scores.gaming === maxGaming)}
                        ${renderScoreMobile(powB.scores.gaming, powB.scores.gaming === maxGaming)}
                        ${renderScoreMobile(techB.scores.gaming, techB.scores.gaming === maxGaming)}
                    </div>
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Робота і монтаж</div>
                    <div class="cmp-mobile__cols">
                        ${renderScoreMobile(valB.scores.work, valB.scores.work === maxWork)}
                        ${renderScoreMobile(powB.scores.work, powB.scores.work === maxWork)}
                        ${renderScoreMobile(techB.scores.work, techB.scores.work === maxWork)}
                    </div>
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Нові технології</div>
                    <div class="cmp-mobile__cols">
                        ${renderScoreMobile(valB.scores.tech, valB.scores.tech === maxTech)}
                        ${renderScoreMobile(powB.scores.tech, powB.scores.tech === maxTech)}
                        ${renderScoreMobile(techB.scores.tech, techB.scores.tech === maxTech)}
                    </div>
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Ціна</div>
                    <div class="cmp-mobile__cols">
                        <span class="cmp-val ${valB.totalPriceUah === minPrice ? 'is-best' : ''}">${formatMoneyFromUah(valB.totalPriceUah)}</span>
                        <span class="cmp-val ${powB.totalPriceUah === minPrice ? 'is-best' : ''}">${formatMoneyFromUah(powB.totalPriceUah)}</span>
                        <span class="cmp-val ${techB.totalPriceUah === minPrice ? 'is-best' : ''}">${formatMoneyFromUah(techB.totalPriceUah)}</span>
                    </div>
                </div>
            </div>
        `;

        comparisonContainer.innerHTML = desktopTableHtml + mobileTableHtml;

        comparisonContainer.querySelectorAll('[data-open-shop]').forEach(btn => {
            btn.addEventListener('click', () => {
                const build = state.currentRenderedBuilds[Number(btn.dataset.openShop)];
                if (build) openShopModal(build);
            });
        });
    }

    // Модальне вікно «До магазину»
    function openShopModal(build) {
        const modal = document.getElementById('shopModal');
        const tagEl = document.getElementById('shopModalTag');
        const titleEl = document.getElementById('shopModalTitle');
        const listEl = document.getElementById('shopModalList');
        const totalEl = document.getElementById('shopModalTotal');

        tagEl.className = `tag ${build.tagClass}`;
        tagEl.textContent = build.tag;
        titleEl.textContent = `${build.title} — купити комплектуючі`;
        totalEl.textContent = formatMoneyFromUah(build.totalPriceUah);

        listEl.innerHTML = build.parts.map(part => `
            <div class="shop-item">
                <div>
                    <div class="shop-item__cat">${CATEGORY_LABELS[part.type]} ${part.isPromo ? '<span class="promo-badge">Реклама</span>' : ''}</div>
                    <div class="shop-item__name">${part.name}</div>
                </div>
                <div class="shop-item__right">
                    <span class="shop-item__price">${formatMoneyFromUah(part.priceUah)}</span>
                    <a href="${part.url}" target="_blank" rel="noopener noreferrer" class="shop-item__link">Купити →</a>
                </div>
            </div>
        `).join('');

        modal.hidden = false;
    }

    // Симуляція генерації збірок на демо-даних (до етапу підключення API)
    function runMockGeneration() {
        const userBudget = parseBudgetValue();
        const userBudgetUah = userBudget * state.rates[state.currency];

        // Перевірка сценарію «Нічого не знайдено» (наприклад, якщо обрано лише Intel для CPU і GPU при малому бюджеті)
        const isImpossibleCombo = state.cpuBrands.size === 1 && state.cpuBrands.has('INTEL')
            && state.gpuBrands.size === 1 && state.gpuBrands.has('INTEL')
            && userBudgetUah < 25000;

        // Стан 3: Завантаження (скелетони + кнопка «Підбираємо...»)
        heroSection.hidden = true;
        benefitsSection.hidden = true;
        resultsSection.hidden = true;
        emptySection.hidden = true;
        skeletonSection.hidden = false;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Підбираємо...';

        setTimeout(() => {
            skeletonSection.hidden = true;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Підібрати знову';
            formCard.classList.add('is-compact');

            if (isImpossibleCombo) {
                emptySection.hidden = false;
                return;
            }

            // Адаптуємо демо-ціни під введений бюджет для реалістичного прев'ю вёрстки
            const scale = userBudgetUah < 39990 ? (userBudgetUah / 40500) : 1;
            const preparedBuilds = MOCK_BUILDS.map(build => {
                const scaledParts = build.parts.map(p => ({
                    ...p,
                    priceUah: Math.round((p.priceUah * scale) / 10) * 10
                }));
                const sumUah = scaledParts.reduce((acc, p) => acc + p.priceUah, 0);
                return {
                    ...build,
                    parts: scaledParts,
                    totalPriceUah: sumUah
                };
            });

            state.currentRenderedBuilds = preparedBuilds;
            renderBuildCards(preparedBuilds, userBudget);
            renderComparisonTable(preparedBuilds, userBudget);
            resultsSection.hidden = false;
        }, 450);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validateBudget()) return;
        runMockGeneration();
    });

    // Бургер-меню та модальні вікна
    const burgerBtn = document.getElementById('burgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    burgerBtn.addEventListener('click', () => {
        const isOpen = !mobileMenu.hidden;
        mobileMenu.hidden = isOpen;
        burgerBtn.setAttribute('aria-expanded', String(!isOpen));
    });

    document.querySelectorAll('[data-modal]').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modal = document.getElementById(trigger.dataset.modal);
            if (modal) modal.hidden = false;
            mobileMenu.hidden = true;
        });
    });

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-backdrop').hidden = true;
        });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) backdrop.hidden = true;
        });
    });

    setNormalState();
})();