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

    const PART_ORDER = ['CPU', 'GPU', 'RAM', 'SSD', 'MOTHERBOARD', 'PSU', 'CASE'];

    const CATEGORY_LABELS = {
        CPU: 'Процесор',
        GPU: 'Відеокарта',
        RAM: "Пам'ять",
        SSD: 'Накопичувач',
        MOTHERBOARD: 'Мат. плата',
        PSU: 'Блок живлення',
        CASE: 'Корпус'
    };

    const PROFILE_META = {
        VALUE: { tag: 'Ціна/якість', tagClass: 'tag--value', title: 'Збалансований ПК' },
        PERFORMANCE: { tag: 'Потужність', tagClass: 'tag--power', title: 'Максимум в іграх' },
        TECHNOLOGY: { tag: 'Технології', tagClass: 'tag--tech', title: 'Сучасна платформа' }
    };

    const state = {
        currency: 'UAH',
        symbol: '₴',
        rates: { UAH: 1, USD: 45.34, EUR: 49.10 },
        exactSource: { amount: 40000, currency: 'UAH' },
        cpuBrands: new Set(),
        gpuBrands: new Set(),
        promoNames: new Set(),
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

    function formatPrice(amount, currency = state.currency, symbol = state.symbol) {
        const val = Number(amount) || 0;
        if (currency === 'UAH') {
            return `${formatNumber(Math.round(val))} ${symbol}`;
        }
        const formatted = Number.isInteger(val)
            ? formatNumber(val)
            : val.toFixed(2).replace('.', ',');
        return `${formatted} ${symbol}`;
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

    // Формування партнерського посилання для переходу в магазин
    function buildPartnerUrl(part) {
        const rawUrl = part.shopUrl || part.partnerUrl || part.url || 'https://hotline.ua';
        try {
            const urlObj = new URL(rawUrl);
            if (!urlObj.searchParams.has('utm_source')) {
                urlObj.searchParams.set('utm_source', 'pcpicker');
                urlObj.searchParams.set('utm_medium', 'partner');
            }
            if (part.name && !urlObj.searchParams.has('q') && urlObj.pathname === '/') {
                urlObj.searchParams.set('q', part.name);
            }
            return urlObj.toString();
        } catch (_) {
            return rawUrl;
        }
    }

    // Завантаження актуального курсу валют та промо-товарів з бекенду
    async function initBackendData() {
        try {
            const ratesRes = await fetch('/api/rates');
            if (ratesRes.ok) {
                const data = await ratesRes.json();
                const list = Array.isArray(data) ? data : (Array.isArray(data?.rates) ? data.rates : null);
                if (list) {
                    list.forEach(item => {
                        const code = (item.currency || item.code || '').toUpperCase();
                        const rate = Number(item.rate || item.rateToUah || item.uahRate);
                        if (code && rate > 0) state.rates[code] = rate;
                    });
                } else if (data && typeof data === 'object') {
                    if (data.USD) state.rates.USD = Number(data.USD);
                    if (data.EUR) state.rates.EUR = Number(data.EUR);
                }
                if (!budgetHint.classList.contains('is-error')) {
                    setNormalState();
                }
            }
        } catch (_) {
            // Використовуємо резервні курси, якщо ендпоінт тимчасово недоступний
        }

        try {
            const promoRes = await fetch('/api/promo/components');
            if (promoRes.ok) {
                const promos = await promoRes.json();
                if (Array.isArray(promos)) {
                    promos.forEach(item => {
                        if (item?.sponsored && item?.name) {
                            state.promoNames.add(item.name);
                        }
                    });
                }
            }
        } catch (_) {
            // Ігноруємо, якщо промо-список порожній
        }
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

        state.exactSource = {
            amount: parseBudgetValue(),
            currency: state.currency
        };

        if (budgetHint.classList.contains('is-error')) {
            validateBudget();
        }
    });

    currencyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const nextCurrency = btn.dataset.currency;
            if (nextCurrency === state.currency) return;

            const src = state.exactSource;
            if (!Number.isNaN(src.amount) && src.amount > 0) {
                if (src.currency === nextCurrency) {
                    budgetInput.value = formatNumber(src.amount);
                } else {
                    const exactUah = src.amount * state.rates[src.currency];
                    const converted = nextCurrency === 'UAH'
                        ? Math.round(exactUah)
                        : Math.round(exactUah / state.rates[nextCurrency]);
                    budgetInput.value = formatNumber(converted);
                }
            }

            state.currency = nextCurrency;
            state.symbol = btn.dataset.symbol;

            currencyBtns.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');

            if (budgetInput.value.trim() !== '') {
                validateBudget();
            } else {
                setNormalState();
            }
        });
    });

    quickFixBtn.addEventListener('click', () => {
        const minVal = getMinBudget();
        budgetInput.value = formatNumber(minVal);
        state.exactSource = { amount: minVal, currency: state.currency };
        setNormalState();
        generateBuildsFromApi();
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

    // Нормалізація даних з API під структуру карток і таблиці
    function getMobilePartName(part) {
        if (part.type === 'CPU') {
            return part.name
                .replace(/^AMD Ryzen [3579]\s+/i, '')
                .replace(/^Intel Core Ultra [579]\s+/i, '')
                .replace(/^Intel Core\s+/i, '');
        }
        if (part.type === 'GPU') {
            return part.name
                .replace(/^(GeForce|Radeon|Intel)\s+/i, '')
                .replace(/\s+\d+\s*ГБ$/i, '');
        }
        if (part.type === 'RAM') {
            const match = part.name.match(/\d+\s*ГБ/i);
            return match ? match[0] : part.name;
        }
        return part.shortSpec || part.name;
    }

    function detectTechFeatures(sortedParts) {
        const gpu = sortedParts.find(p => p.type === 'GPU')?.name || '';
        const ram = sortedParts.find(p => p.type === 'RAM')?.name || '';
        const ssd = sortedParts.find(p => p.type === 'SSD')?.name || '';
        const features = [];

        if (/RTX/i.test(gpu)) features.push('DLSS', 'RT');
        else if (/RX/i.test(gpu)) features.push('FSR');
        else if (/Arc/i.test(gpu)) features.push('XeSS', 'RT');

        if (/Gen5/i.test(ssd)) features.push('PCIe 5.0');
        if (/DDR5/i.test(ram)) features.push('DDR5');
        else if (/DDR4/i.test(ram)) features.push('DDR4');

        return features.length ? features.join(' • ') : 'DDR5';
    }

    function normalizeApiBuild(apiBuild) {
        const profileKey = (apiBuild.profile || 'VALUE').toUpperCase();
        const meta = PROFILE_META[profileKey] || {
            tag: apiBuild.title || 'Збірка',
            tagClass: 'tag--value',
            title: apiBuild.description || 'Оптимальний ПК'
        };

        const sortedParts = [...(apiBuild.parts || [])]
            .sort((a, b) => PART_ORDER.indexOf(a.type) - PART_ORDER.indexOf(b.type))
            .map(part => ({
                ...part,
                shortName: part.shortSpec || part.name,
                mobileName: getMobilePartName(part),
                url: buildPartnerUrl(part),
                isPromo: Boolean(part.sponsored || state.promoNames.has(part.name))
            }));

        const perf100 = Number(apiBuild.performanceScore) || 75;
        const tech100 = Number(apiBuild.techScore) || 70;

        const gaming = Math.max(1, Math.min(10, Math.round(perf100 / 10)));
        const tech = Math.max(1, Math.min(10, Math.round(tech100 / 10)));
        const work = Math.max(1, Math.min(10, Math.round((perf100 * 0.6 + tech100 * 0.4) / 10)));

        return {
            profile: profileKey,
            tag: meta.tag,
            tagClass: meta.tagClass,
            title: meta.title,
            totalPrice: Number(apiBuild.totalPrice ?? apiBuild.totalPriceUah ?? 0),
            parts: sortedParts,
            techFeatures: detectTechFeatures(sortedParts),
            scores: { gaming, work, tech }
        };
    }

    // Рендер 3 карток збірок (BuildCard)
    function renderBuildCards(builds, userBudget) {
        resultsTitle.textContent = `Твої 3 збірки за ${formatNumber(userBudget)} ${state.symbol}`;

        buildsGrid.innerHTML = builds.map((build, index) => {
            const partsHtml = build.parts.map(part => `
                <div class="part-row">
                    <div class="part-row__left">
                        <span class="part-row__icon">${PART_ICONS[part.type] || ''}</span>
                        <div class="part-row__info">
                            <div class="part-row__meta">
                                <span class="part-row__cat">${CATEGORY_LABELS[part.type] || part.type}</span>
                                ${part.isPromo ? '<span class="promo-badge">Реклама</span>' : ''}
                            </div>
                            <div class="part-row__name" title="${part.name}">${part.name}</div>
                        </div>
                    </div>
                    <span class="part-row__price">${formatPrice(part.price)}</span>
                </div>
            `).join('');

            return `
                <article class="build-card">
                    <div class="build-card__top">
                        <span class="tag ${build.tagClass}">${build.tag}</span>
                        <span class="build-card__count">${build.parts.length} деталей</span>
                    </div>

                    <h3 class="build-card__title">${build.title}</h3>

                    <div class="parts-list">
                        ${partsHtml}
                    </div>

                    <div class="build-card__footer">
                        <div class="build-card__total-row">
                            <span class="build-card__total-label">Разом</span>
                            <span class="build-card__total-value">${formatPrice(build.totalPrice)}</span>
                        </div>
                        <div class="build-card__budget-ok">✓ Вкладається в бюджет ${formatNumber(userBudget)} ${state.symbol}</div>
                        <button type="button" class="btn-primary btn-primary--full" data-open-shop="${index}">
                            До магазину
                        </button>
                    </div>
                </article>
            `;
        }).join('');

        buildsGrid.querySelectorAll('[data-open-shop]').forEach(btn => {
            btn.addEventListener('click', () => {
                const build = state.currentRenderedBuilds[Number(btn.dataset.openShop)];
                if (build) openShopModal(build);
            });
        });
    }

    // Рендер таблиці порівняння
    function renderComparisonTable(builds, userBudget) {
        const getPart = (b, type) => b.parts.find(p => p.type === type) || { shortName: '—', mobileName: '—' };

        const maxGaming = Math.max(...builds.map(b => b.scores.gaming));
        const maxWork = Math.max(...builds.map(b => b.scores.work));
        const maxTech = Math.max(...builds.map(b => b.scores.tech));
        const minPrice = Math.min(...builds.map(b => b.totalPrice));

        const remainders = builds.map(b => Math.max(0, userBudget - b.totalPrice));
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

        const headerColsDesktop = builds.map(b => `<th><span class="tag ${b.tagClass}">${b.tag}</span></th>`).join('');
        const rowCells = (getter, isBestFn = () => false) => builds.map((b, i) => {
            const val = getter(b, i);
            return `<td class="cmp-val ${isBestFn(b, i) ? 'is-best' : ''}">${val}</td>`;
        }).join('');

        const desktopTableHtml = `
            <table class="cmp-table">
                <thead>
                    <tr>
                        <th>Характеристика</th>
                        ${headerColsDesktop}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Процесор</td>
                        ${rowCells(b => getPart(b, 'CPU').shortName, b => b.profile === 'TECHNOLOGY')}
                    </tr>
                    <tr>
                        <td>Відеокарта</td>
                        ${rowCells(b => getPart(b, 'GPU').shortName, b => b.profile === 'PERFORMANCE')}
                    </tr>
                    <tr>
                        <td>Пам'ять</td>
                        ${rowCells(b => getPart(b, 'RAM').shortName, b => /32|64/.test(getPart(b, 'RAM').shortName))}
                    </tr>
                    <tr>
                        <td>Накопичувач</td>
                        ${rowCells(b => getPart(b, 'SSD').shortName, b => /2 ТБ|Gen5/i.test(getPart(b, 'SSD').shortName))}
                    </tr>
                    <tr>
                        <td>Блок живлення</td>
                        ${rowCells(b => getPart(b, 'PSU').shortName, b => /Gold|Platinum/i.test(getPart(b, 'PSU').shortName))}
                    </tr>
                    <tr>
                        <td>Технології (DLSS / FSR / DDR5)</td>
                        ${rowCells(b => b.techFeatures, b => b.profile === 'TECHNOLOGY')}
                    </tr>
                    <tr>
                        <td>Ігри</td>
                        ${builds.map(b => `<td>${renderScoreDesktop(b.scores.gaming, b.scores.gaming === maxGaming)}</td>`).join('')}
                    </tr>
                    <tr>
                        <td>Робота і монтаж</td>
                        ${builds.map(b => `<td>${renderScoreDesktop(b.scores.work, b.scores.work === maxWork)}</td>`).join('')}
                    </tr>
                    <tr>
                        <td>Нові технології</td>
                        ${builds.map(b => `<td>${renderScoreDesktop(b.scores.tech, b.scores.tech === maxTech)}</td>`).join('')}
                    </tr>
                    <tr>
                        <td>Ціна</td>
                        ${rowCells(b => formatPrice(b.totalPrice), b => b.totalPrice === minPrice)}
                    </tr>
                    <tr>
                        <td>Залишок бюджету</td>
                        ${rowCells((_, i) => formatPrice(remainders[i]), (_, i) => remainders[i] === maxRemainder)}
                    </tr>
                    <tr>
                        <td></td>
                        ${builds.map((_, i) => `<td><button type="button" class="btn-secondary btn-secondary--full" data-open-shop="${i}">До магазину</button></td>`).join('')}
                    </tr>
                </tbody>
            </table>
        `;

        const mobileDotLabels = {
            VALUE: '<span class="cmp-mobile__dot-label"><span class="dot dot--value"></span>Ціна/як.</span>',
            PERFORMANCE: '<span class="cmp-mobile__dot-label"><span class="dot dot--power"></span>Потужн.</span>',
            TECHNOLOGY: '<span class="cmp-mobile__dot-label"><span class="dot dot--tech"></span>Технол.</span>'
        };

        const mobileTableHtml = `
            <div class="cmp-mobile">
                <div class="cmp-mobile__head">
                    ${builds.map(b => mobileDotLabels[b.profile] || b.tag).join('')}
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Процесор</div>
                    <div class="cmp-mobile__cols">
                        ${builds.map(b => `<span class="cmp-val ${b.profile === 'TECHNOLOGY' ? 'is-best' : ''}">${getPart(b, 'CPU').mobileName}</span>`).join('')}
                    </div>
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Відеокарта</div>
                    <div class="cmp-mobile__cols">
                        ${builds.map(b => `<span class="cmp-val ${b.profile === 'PERFORMANCE' ? 'is-best' : ''}">${getPart(b, 'GPU').mobileName}</span>`).join('')}
                    </div>
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Пам'ять</div>
                    <div class="cmp-mobile__cols">
                        ${builds.map(b => `<span class="cmp-val ${/32|64/.test(getPart(b, 'RAM').mobileName) ? 'is-best' : ''}">${getPart(b, 'RAM').mobileName}</span>`).join('')}
                    </div>
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Ігри</div>
                    <div class="cmp-mobile__cols">
                        ${builds.map(b => renderScoreMobile(b.scores.gaming, b.scores.gaming === maxGaming)).join('')}
                    </div>
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Робота і монтаж</div>
                    <div class="cmp-mobile__cols">
                        ${builds.map(b => renderScoreMobile(b.scores.work, b.scores.work === maxWork)).join('')}
                    </div>
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Нові технології</div>
                    <div class="cmp-mobile__cols">
                        ${builds.map(b => renderScoreMobile(b.scores.tech, b.scores.tech === maxTech)).join('')}
                    </div>
                </div>

                <div class="cmp-mobile__row">
                    <div class="cmp-mobile__row-title">Ціна</div>
                    <div class="cmp-mobile__cols">
                        ${builds.map(b => `<span class="cmp-val ${b.totalPrice === minPrice ? 'is-best' : ''}">${formatPrice(b.totalPrice)}</span>`).join('')}
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

    // Модальне вікно «До магазину» з партнерськими посиланнями
    function openShopModal(build) {
        const modal = document.getElementById('shopModal');
        const tagEl = document.getElementById('shopModalTag');
        const titleEl = document.getElementById('shopModalTitle');
        const listEl = document.getElementById('shopModalList');
        const totalEl = document.getElementById('shopModalTotal');

        tagEl.className = `tag ${build.tagClass}`;
        tagEl.textContent = build.tag;
        titleEl.textContent = `${build.title} — купити комплектуючі`;
        totalEl.textContent = formatPrice(build.totalPrice);

        listEl.innerHTML = build.parts.map(part => `
            <div class="shop-item">
                <div>
                    <div class="shop-item__cat">${CATEGORY_LABELS[part.type] || part.type} ${part.isPromo ? '<span class="promo-badge">Реклама</span>' : ''}</div>
                    <div class="shop-item__name">${part.name}</div>
                </div>
                <div class="shop-item__right">
                    <span class="shop-item__price">${formatPrice(part.price)}</span>
                    <a href="${part.url}" target="_blank" rel="noopener noreferrer" class="shop-item__link">Купити →</a>
                </div>
            </div>
        `).join('');

        modal.hidden = false;
    }

    // Запит на бекенд POST /api/builds/generate з анімацією скелетонів
    async function generateBuildsFromApi() {
        const userBudget = parseBudgetValue();
        const combinedBrands = Array.from(new Set([...state.cpuBrands, ...state.gpuBrands]));

        heroSection.hidden = true;
        benefitsSection.hidden = true;
        resultsSection.hidden = true;
        emptySection.hidden = true;
        skeletonSection.hidden = false;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Підбираємо...';

        const minSkeletonDelay = new Promise(resolve => setTimeout(resolve, 250));

        try {
            const [response] = await Promise.all([
                fetch('/api/builds/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        budget: userBudget,
                        currency: state.currency,
                        brands: combinedBrands
                    })
                }),
                minSkeletonDelay
            ]);

            if (response.status === 422) {
                emptySection.hidden = false;
                return;
            }

            if (response.status === 400) {
                const err = await response.json().catch(() => ({}));
                setErrorState(err.detail || `Замало для повної збірки — мінімум ${formatNumber(getMinBudget())} ${state.symbol}`);
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const rawBuilds = Array.isArray(data.builds) ? data.builds : [];

            const normalizedBuilds = rawBuilds.map(normalizeApiBuild).filter(build => {
                const cpu = build.parts.find(p => p.type === 'CPU');
                const gpu = build.parts.find(p => p.type === 'GPU');
                const cpuOk = state.cpuBrands.size === 0 || (cpu && state.cpuBrands.has((cpu.brand || '').toUpperCase()));
                const gpuOk = state.gpuBrands.size === 0 || (gpu && state.gpuBrands.has((gpu.brand || '').toUpperCase()));
                return cpuOk && gpuOk;
            });

            if (normalizedBuilds.length === 0) {
                emptySection.hidden = false;
                return;
            }

            state.currentRenderedBuilds = normalizedBuilds;
            renderBuildCards(normalizedBuilds, userBudget);
            renderComparisonTable(normalizedBuilds, userBudget);
            resultsSection.hidden = false;
        } catch (error) {
            console.error('Помилка підбору збірок:', error);
            emptySection.hidden = false;
        } finally {
            skeletonSection.hidden = true;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Підібрати знову';
            formCard.classList.add('is-compact');
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validateBudget()) return;
        generateBuildsFromApi();
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
    initBackendData();
})();