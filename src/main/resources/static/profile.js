(() => {
    const TOKEN_KEY = 'pcpicker_jwt';
    const USER_KEY = 'pcpicker_user';
    const BASE_URL = ((window.PCPICKER_CONFIG && window.PCPICKER_CONFIG.apiBaseUrl) || '').replace(/\/+$/, '');

    function buildApiUrl(path) {
        if (/^https?:\/\//i.test(path)) return path;
        const normalized = path.startsWith('/') ? path : `/${path}`;
        return `${BASE_URL}${normalized}`;
    }

    const state = {
        token: localStorage.getItem(TOKEN_KEY) || null,
        user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
        authMode: 'login',
        savedBuilds: [],
        activeFilter: 'ALL',
        pendingSavePayload: null,
        pendingSaveButton: null
    };

    const SCENARIO_LABELS = {
        GAMING: 'Ігри',
        WORK: 'Монтаж і 3D',
        OFFICE: 'Офіс і навчання',
        UNIVERSAL: 'Універсальний'
    };

    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatUah(amount) {
        const num = Math.round(Number(amount) || 0);
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₴';
    }

    function formatSavedDate(isoDate) {
        if (!isoDate) return '';
        const d = new Date(isoDate);
        if (Number.isNaN(d.getTime())) return '';
        return 'Збережено ' + d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
    }

    function showToast(message) {
        const container = document.getElementById('pcpToastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'pcp-toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4200);
    }

    async function apiFetch(path, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        if (state.token) {
            headers.Authorization = `Bearer ${state.token}`;
        }

        const response = await fetch(buildApiUrl(path), {
            ...options,
            headers
        });

        if (response.status === 401) {
            clearSession();
            throw new Error('Потрібно увійти в акаунт');
        }

        const text = await response.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (e) {
            data = null;
        }

        if (!response.ok) {
            throw new Error(data?.message || data?.error || `Помилка сервера (${response.status})`);
        }

        return data;
    }

    function saveSession(token, userObj, fallbackName) {
        state.token = token;
        const displayName = userObj?.name || fallbackName || userObj?.email?.split('@')[0] || 'User';
        state.user = {
            id: userObj?.id || null,
            email: userObj?.email || '',
            name: displayName
        };
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(state.user));
        renderHeaderProfile();
    }

    function clearSession() {
        state.token = null;
        state.user = null;
        state.savedBuilds = [];
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        renderHeaderProfile();
        closeMyBuildsView();
    }

    function renderHeaderProfile() {
        const slot = document.getElementById('headerProfileSlot');
        if (!slot) return;

        if (!state.token || !state.user) {
            slot.innerHTML = `<button type="button" class="btn-header-login" id="openAuthModalBtn">Увійти</button>`;
            document.getElementById('openAuthModalBtn')?.addEventListener('click', () => openAuthModal('login'));
            return;
        }

        const initial = (state.user.name || state.user.email || 'U').trim().charAt(0).toUpperCase();
        const buildsCount = state.savedBuilds.length;

        slot.innerHTML = `
            <button type="button" class="btn-header-profile" id="openMyBuildsBtn" title="Мої збірки">
                <span class="profile-avatar-circle">${escapeHtml(initial)}</span>
                <span class="header-profile-label">Мої збірки · ${buildsCount}</span>
            </button>
            <button type="button" class="btn-header-logout" id="logoutBtn" title="Вийти">Вийти</button>
        `;

        document.getElementById('openMyBuildsBtn')?.addEventListener('click', openMyBuildsView);
        document.getElementById('logoutBtn')?.addEventListener('click', clearSession);
    }

    function openAuthModal(mode = 'login') {
        state.authMode = mode;
        const modal = document.getElementById('authModal');
        const title = document.getElementById('authModalTitle');
        const nameGroup = document.getElementById('authNameGroup');
        const submitBtn = document.getElementById('authSubmitBtn');
        const switchBtn = document.getElementById('authSwitchModeBtn');
        const passwordInput = document.getElementById('authPasswordInput');
        const passwordErr = document.getElementById('authPasswordError');
        const serverErr = document.getElementById('authServerError');

        if (!modal) return;

        document.querySelectorAll('.auth-tab').forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.authTab === mode);
        });

        const isRegister = mode === 'register';
        title.textContent = isRegister ? 'Створи акаунт' : 'Вхід у PCPicker';
        nameGroup.hidden = !isRegister;
        submitBtn.textContent = isRegister ? 'Створити акаунт' : 'Увійти';
        switchBtn.textContent = isRegister ? 'Вже є акаунт? Увійти' : 'Немає акаунта? Зареєструватися';
        passwordInput.setAttribute('autocomplete', isRegister ? 'new-password' : 'current-password');
        passwordInput.classList.remove('input-invalid');
        passwordErr.hidden = true;
        serverErr.hidden = true;

        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) modal.hidden = true;
        document.body.style.overflow = '';
    }

    async function handleAuthSubmit(event) {
        event.preventDefault();
        const nameInput = document.getElementById('authNameInput');
        const emailInput = document.getElementById('authEmailInput');
        const passwordInput = document.getElementById('authPasswordInput');
        const passwordErr = document.getElementById('authPasswordError');
        const serverErr = document.getElementById('authServerError');
        const submitBtn = document.getElementById('authSubmitBtn');

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const name = nameInput.value.trim();

        passwordInput.classList.remove('input-invalid');
        passwordErr.hidden = true;
        serverErr.hidden = true;

        if (password.length < 8) {
            passwordInput.classList.add('input-invalid');
            passwordErr.hidden = false;
            return;
        }

        submitBtn.disabled = true;
        try {
            const isRegister = state.authMode === 'register';
            const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
            const body = isRegister ? { name, email, password } : { email, password };

            const data = await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(body)
            });

            saveSession(data.token, data.user || { email, name }, name);
            closeAuthModal();
            await loadSavedBuilds();

            if (state.pendingSavePayload) {
                const payload = state.pendingSavePayload;
                const btn = state.pendingSaveButton;
                state.pendingSavePayload = null;
                state.pendingSaveButton = null;
                await saveBuildToProfile(payload, btn);
            }
        } catch (err) {
            serverErr.textContent = err.message;
            serverErr.hidden = false;
        } finally {
            submitBtn.disabled = false;
        }
    }

    async function saveBuildToProfile(buildPayload, buttonEl) {
        if (!state.token) {
            state.pendingSavePayload = buildPayload;
            state.pendingSaveButton = buttonEl;
            openAuthModal('login');
            return;
        }

        if (buttonEl) buttonEl.disabled = true;
        try {
            await apiFetch('/api/profile/builds', {
                method: 'POST',
                body: JSON.stringify(buildPayload)
            });

            if (buttonEl) {
                buttonEl.classList.add('is-saved');
                buttonEl.innerHTML = '✓ Збережено';
            }

            showToast('Збірку збережено. Ми покажемо, коли ціна зміниться.');
            await loadSavedBuilds();
        } catch (err) {
            showToast(err.message);
        } finally {
            if (buttonEl) buttonEl.disabled = false;
        }
    }

    async function loadSavedBuilds() {
        if (!state.token) return;
        try {
            const list = await apiFetch('/api/profile/builds');
            state.savedBuilds = Array.isArray(list) ? list : [];
            renderHeaderProfile();
            renderMyBuildsGrid();
        } catch (err) {
            console.error('Failed to load saved builds:', err);
        }
    }

    async function deleteSavedBuild(buildId) {
        try {
            await apiFetch(`/api/profile/builds/${buildId}`, { method: 'DELETE' });
            state.savedBuilds = state.savedBuilds.filter((b) => b.id !== buildId);
            renderHeaderProfile();
            renderMyBuildsGrid();
            showToast('Збірку видалено з профілю.');
        } catch (err) {
            showToast(err.message);
        }
    }

    function openMyBuildsView() {
        const section = document.getElementById('myBuildsSection');
        if (!section) return;
        section.hidden = false;
        section.scrollIntoView({ behavior: 'smooth' });
        loadSavedBuilds();
    }

    function closeMyBuildsView() {
        const section = document.getElementById('myBuildsSection');
        if (section) section.hidden = true;
    }

    function renderMyBuildsGrid() {
        const grid = document.getElementById('myBuildsGrid');
        const cheaperSummary = document.getElementById('cheaperSummaryBadge');
        if (!grid) return;

        const cheaperList = state.savedBuilds.filter((b) => Number(b.priceDiffUah) < 0);
        const expensiveList = state.savedBuilds.filter((b) => Number(b.priceDiffUah) > 0);

        document.getElementById('countAll').textContent = state.savedBuilds.length;
        document.getElementById('countCheaper').textContent = cheaperList.length;
        document.getElementById('countExpensive').textContent = expensiveList.length;

        if (cheaperList.length > 0) {
            cheaperSummary.hidden = false;
            cheaperSummary.textContent = `🔔 ${cheaperList.length} ${cheaperList.length === 1 ? 'збірка подешевшала' : 'збірки подешевшали'}`;
        } else {
            cheaperSummary.hidden = true;
        }

        const filtered = state.savedBuilds.filter((b) => {
            const diff = Number(b.priceDiffUah) || 0;
            if (state.activeFilter === 'CHEAPER') return diff < 0;
            if (state.activeFilter === 'EXPENSIVE') return diff > 0;
            return true;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="my-builds-empty">У цій категорії поки немає збережених збірок.</div>`;
            return;
        }

        grid.innerHTML = filtered.map((build) => {
            const diff = Number(build.priceDiffUah) || 0;
            const isCheaper = diff < 0;
            const isExpensive = diff > 0;
            const scenarioLabel = SCENARIO_LABELS[build.scenario] || build.scenario || 'Збірка ПК';

            let deltaBadgeHtml = `<span class="price-delta-badge unchanged">= Без змін</span>`;
            if (isCheaper) {
                deltaBadgeHtml = `<span class="price-delta-badge cheaper">▼ -${formatUah(Math.abs(diff))} дешевше</span>`;
            } else if (isExpensive) {
                deltaBadgeHtml = `<span class="price-delta-badge expensive">▲ +${formatUah(diff)} дорожче</span>`;
            }

            const changedItems = (build.items || []).filter((item) => Number(item.priceDiffUah) !== 0);
            const changesBlockHtml = changedItems.length > 0
                ? `
                    <div class="saved-changes-box">
                        <div class="saved-changes-heading">Що змінилось з моменту збереження</div>
                        ${changedItems.map((item) => {
                    const itemDiff = Number(item.priceDiffUah);
                    const sign = itemDiff > 0 ? '+' : '-';
                    const cls = itemDiff < 0 ? 'cheaper' : 'expensive';
                    return `
                                <div class="saved-change-item">
                                    <span>${escapeHtml(item.categoryLabel || item.category)} · ${escapeHtml(item.name)}</span>
                                    <span class="saved-change-diff ${cls}">${sign}${formatUah(Math.abs(itemDiff))}</span>
                                </div>
                            `;
                }).join('')}
                    </div>
                `
                : `<p class="saved-unchanged-note">Ціни всіх деталей не змінились. Перевіряємо щодня.</p>`;

            return `
                <article class="saved-build-card ${isCheaper ? 'is-cheaper' : ''}">
                    <div class="saved-card-top">
                        <span class="scenario-tag">${escapeHtml(scenarioLabel)}</span>
                        <span class="saved-date">${escapeHtml(formatSavedDate(build.createdAt))}</span>
                    </div>

                    <h3 class="saved-card-title">${escapeHtml(build.title)}</h3>

                    <div>
                        <div class="saved-price-label">Зараз</div>
                        <div class="saved-price-row">
                            <span class="saved-current-price">${formatUah(build.currentTotalPriceUah)}</span>
                            ${diff !== 0 ? `<span class="saved-old-price">${formatUah(build.savedTotalPriceUah)}</span>` : ''}
                            ${deltaBadgeHtml}
                        </div>
                    </div>

                    ${changesBlockHtml}

                    <div class="saved-card-actions">
                        <button type="button" class="btn-open-saved-build" data-open-build-id="${build.id}">Відкрити збірку</button>
                        <button type="button" class="btn-delete-saved-build" data-delete-build-id="${build.id}">Видалити</button>
                    </div>
                </article>
            `;
        }).join('');

        grid.querySelectorAll('[data-delete-build-id]').forEach((btn) => {
            btn.addEventListener('click', () => deleteSavedBuild(Number(btn.dataset.deleteBuildId)));
        });

        grid.querySelectorAll('[data-open-build-id]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const build = state.savedBuilds.find((b) => b.id === Number(btn.dataset.openBuildId));
                if (build && typeof window.onOpenSavedBuild === 'function') {
                    closeMyBuildsView();
                    window.onOpenSavedBuild(build);
                }
            });
        });
    }

    async function init() {
        renderHeaderProfile();

        document.getElementById('closeAuthModalBtn')?.addEventListener('click', closeAuthModal);
        document.getElementById('authModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'authModal') closeAuthModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAuthModal();
        });

        document.querySelectorAll('.auth-tab').forEach((tab) => {
            tab.addEventListener('click', () => openAuthModal(tab.dataset.authTab));
        });

        document.getElementById('authSwitchModeBtn')?.addEventListener('click', () => {
            openAuthModal(state.authMode === 'login' ? 'register' : 'login');
        });

        document.getElementById('authForm')?.addEventListener('submit', handleAuthSubmit);
        document.getElementById('closeMyBuildsBtn')?.addEventListener('click', closeMyBuildsView);

        document.querySelectorAll('#myBuildsFilters .filter-pill').forEach((pill) => {
            pill.addEventListener('click', () => {
                state.activeFilter = pill.dataset.filter;
                document.querySelectorAll('#myBuildsFilters .filter-pill').forEach((p) => p.classList.remove('active'));
                pill.classList.add('active');
                renderMyBuildsGrid();
            });
        });

        if (state.token) {
            try {
                const me = await apiFetch('/api/auth/me');
                saveSession(state.token, me, state.user?.name);
                await loadSavedBuilds();
            } catch {
                clearSession();
            }
        }
    }

    window.PCPickerProfile = {
        saveBuild: saveBuildToProfile,
        openMyBuilds: openMyBuildsView
    };

    document.addEventListener('DOMContentLoaded', init);
})();