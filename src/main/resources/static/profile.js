(() => {
    const TOKEN_KEY = 'pcpicker_jwt';
    const USER_KEY = 'pcpicker_user';
    const BASE_URL = ((window.PCPICKER_CONFIG && window.PCPICKER_CONFIG.apiBaseUrl) || '').replace(/\/+$/, '');

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const STRONG_PASSWORD_REGEX = /^(?=.*[A-Za-zА-Яа-яІіЇїЄєҐґ])(?=.*\d).{8,}$/;

    const EYE_OPEN_SVG = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    `;

    const EYE_OFF_SVG = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    `;

    function buildApiUrl(path) {
        if (/^https?:\/\//i.test(path)) return path;
        const normalized = path.startsWith('/') ? path : `/${path}`;
        return `${BASE_URL}${normalized}`;
    }

    function injectEditModalStyles() {
        if (document.getElementById('pcpEditModalDynamicStyles')) return;
        const style = document.createElement('style');
        style.id = 'pcpEditModalDynamicStyles';
        style.textContent = `
            .pcp-password-wrap {
                position: relative;
                display: flex;
                align-items: center;
                width: 100%;
            }
            .pcp-password-wrap input {
                width: 100% !important;
                padding-right: 44px !important;
            }
            .pcp-password-toggle {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                padding: 0;
                border: none;
                border-radius: 8px;
                background: transparent;
                color: var(--pcp-text-muted, #939AA8);
                cursor: pointer;
                transition: color 0.2s, background-color 0.2s;
            }
            .pcp-password-toggle:hover {
                color: var(--pcp-accent, #B6F02B);
                background: rgba(255, 255, 255, 0.05);
            }
            [data-theme="light"] .pcp-password-toggle:hover {
                color: #3D5E06;
                background: rgba(15, 23, 42, 0.06);
            }
            .saved-card-actions.saved-card-actions--three {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 8px !important;
                margin-top: auto;
            }
            .saved-card-actions.saved-card-actions--three .btn-open-saved-build {
                grid-column: 1 / -1 !important;
                width: 100% !important;
            }
            .saved-card-actions.saved-card-actions--three .btn-edit-saved-build,
            .saved-card-actions.saved-card-actions--three .btn-delete-saved-build {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 100% !important;
                height: 38px !important;
                padding: 0 12px !important;
                border-radius: 10px !important;
                border: 1px solid var(--pcp-border, #282E3A) !important;
                background: var(--pcp-surface-2, #1D222B) !important;
                color: var(--pcp-text, #F2F4F8) !important;
                font-family: inherit !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                transition: border-color 0.2s, color 0.2s, background-color 0.2s !important;
            }
            .saved-card-actions.saved-card-actions--three .btn-edit-saved-build:hover {
                border-color: var(--pcp-accent, #B6F02B) !important;
            }
            .saved-card-actions.saved-card-actions--three .btn-delete-saved-build:hover {
                border-color: var(--pcp-red, #EF4444) !important;
                color: var(--pcp-red, #EF4444) !important;
            }
            .pcp-edit-modal {
                max-width: 520px !important;
                max-height: 90vh !important;
                overflow-y: auto !important;
            }
            .pcp-edit-parts {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .pcp-edit-select {
                appearance: none !important;
                -webkit-appearance: none !important;
                width: 100% !important;
                height: 42px !important;
                padding: 0 36px 0 14px !important;
                border-radius: 10px !important;
                border: 1px solid var(--pcp-border, #282E3A) !important;
                background-color: var(--pcp-surface-2, #1D222B) !important;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23939AA8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") !important;
                background-repeat: no-repeat !important;
                background-position: right 12px center !important;
                color: var(--pcp-text, #F2F4F8) !important;
                color-scheme: dark !important;
                font-family: inherit !important;
                font-size: 13px !important;
                outline: none !important;
                cursor: pointer !important;
            }
            [data-theme="light"] .pcp-edit-select {
                color-scheme: light !important;
            }
            .pcp-edit-select option {
                background-color: var(--pcp-surface-2, #1D222B);
                color: var(--pcp-text, #F2F4F8);
            }
            .pcp-edit-select:focus {
                border-color: var(--pcp-accent, #B6F02B) !important;
            }
            .pcp-edit-total-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 14px;
                border-radius: 10px;
                background: var(--pcp-surface-2, #1D222B);
                border: 1px solid var(--pcp-border, #282E3A);
                font-size: 13px;
            }
            .pcp-edit-total-row strong {
                font-family: 'JetBrains Mono', monospace;
                font-size: 16px;
                color: var(--pcp-accent, #B6F02B);
            }
        `;
        document.head.appendChild(style);
    }

    const state = {
        token: localStorage.getItem(TOKEN_KEY) || null,
        user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
        authMode: 'login',
        savedBuilds: [],
        availableComponents: null,
        activeFilter: 'ALL',
        pendingSavePayload: null,
        pendingSaveButton: null,
        editingBuildId: null
    };

    const SCENARIO_LABELS = {
        GAMING: 'Ігри',
        WORK: 'Монтаж і 3D',
        OFFICE: 'Офіс і навчання',
        UNIVERSAL: 'Універсальний'
    };

    const CATEGORY_LABELS = {
        CPU: 'Процесор',
        GPU: 'Відеокарта',
        RAM: "Пам'ять",
        STORAGE: 'Накопичувач',
        MOTHERBOARD: 'Мат. плата',
        PSU: 'Блок живлення',
        CASE: 'Корпус'
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

    function getBuildId(build) {
        return build?.buildId ?? build?.id ?? '';
    }

    function getItemName(item) {
        return item?.componentName || item?.name || 'Комплектуюча';
    }

    function getOrCreateEmailErrorEl() {
        let el = document.getElementById('authEmailError');
        if (!el) {
            const emailInput = document.getElementById('authEmailInput');
            if (emailInput && emailInput.parentElement) {
                el = document.createElement('span');
                el.id = 'authEmailError';
                el.className = 'auth-field-error';
                el.hidden = true;
                el.textContent = 'Введіть коректний email (наприклад, name@gmail.com)';
                emailInput.parentElement.appendChild(el);
            }
        }
        return el;
    }

    function setupPasswordVisibilityToggle() {
        const passwordInput = document.getElementById('authPasswordInput');
        if (!passwordInput || document.getElementById('togglePasswordVisibilityBtn')) return;

        const parent = passwordInput.parentElement;
        if (!parent) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'pcp-password-wrap';
        parent.insertBefore(wrapper, passwordInput);
        wrapper.appendChild(passwordInput);

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.id = 'togglePasswordVisibilityBtn';
        toggleBtn.className = 'pcp-password-toggle';
        toggleBtn.setAttribute('aria-label', 'Показати пароль');
        toggleBtn.setAttribute('aria-pressed', 'false');
        toggleBtn.title = 'Показати пароль';
        toggleBtn.innerHTML = EYE_OPEN_SVG;

        toggleBtn.addEventListener('click', () => {
            const isCurrentlyHidden = passwordInput.type === 'password';
            passwordInput.type = isCurrentlyHidden ? 'text' : 'password';
            toggleBtn.innerHTML = isCurrentlyHidden ? EYE_OFF_SVG : EYE_OPEN_SVG;
            const label = isCurrentlyHidden ? 'Сховати пароль' : 'Показати пароль';
            toggleBtn.setAttribute('aria-label', label);
            toggleBtn.setAttribute('aria-pressed', String(isCurrentlyHidden));
            toggleBtn.title = label;
            passwordInput.focus();
        });

        wrapper.appendChild(toggleBtn);
    }

    function resetPasswordVisibility() {
        const passwordInput = document.getElementById('authPasswordInput');
        const toggleBtn = document.getElementById('togglePasswordVisibilityBtn');
        if (passwordInput) {
            passwordInput.type = 'password';
        }
        if (toggleBtn) {
            toggleBtn.innerHTML = EYE_OPEN_SVG;
            toggleBtn.setAttribute('aria-label', 'Показати пароль');
            toggleBtn.setAttribute('aria-pressed', 'false');
            toggleBtn.title = 'Показати пароль';
        }
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
            const validationMsg = Array.isArray(data?.errors)
                ? data.errors.map((err) => err.defaultMessage || err.message || err).join(', ')
                : (data?.errors && typeof data.errors === 'object' ? Object.values(data.errors).join(', ') : null);

            const errorMessage = validationMsg
                || data?.detail
                || data?.message
                || data?.error
                || (text && text.trim().length > 0 && text.trim().length < 240 ? text.trim() : null)
                || `Помилка сервера (${response.status})`;

            throw new Error(errorMessage);
        }

        return data !== null ? data : { rawText: text ? text.trim() : '' };
    }

    function saveSession(token, userObj, fallbackName) {
        const cleanToken = String(token || '').replace(/^Bearer\s+/i, '').trim();
        state.token = cleanToken;
        const displayName = userObj?.name || fallbackName || userObj?.email?.split('@')[0] || 'User';
        state.user = {
            id: userObj?.id || null,
            email: userObj?.email || '',
            name: displayName
        };
        localStorage.setItem(TOKEN_KEY, cleanToken);
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
        const emailInput = document.getElementById('authEmailInput');
        const emailErr = getOrCreateEmailErrorEl();
        const passwordInput = document.getElementById('authPasswordInput');
        const passwordErr = document.getElementById('authPasswordError');
        const serverErr = document.getElementById('authServerError');

        if (!modal) return;

        setupPasswordVisibilityToggle();
        resetPasswordVisibility();

        document.querySelectorAll('.auth-tab').forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.authTab === mode);
        });

        const isRegister = mode === 'register';
        title.textContent = isRegister ? 'Створи акаунт' : 'Вхід у PCPicker';
        nameGroup.hidden = !isRegister;
        submitBtn.textContent = isRegister ? 'Створити акаунт' : 'Увійти';
        switchBtn.textContent = isRegister ? 'Вже є акаунт? Увійти' : 'Немає акаунта? Зареєструватися';

        if (emailInput) emailInput.classList.remove('input-invalid');
        if (emailErr) emailErr.hidden = true;

        passwordInput.setAttribute('autocomplete', isRegister ? 'new-password' : 'current-password');
        passwordInput.classList.remove('input-invalid');
        passwordErr.textContent = isRegister
            ? 'Мінімум 8 символів, хоча б 1 літера та 1 цифра'
            : 'Мінімум 8 символів';
        passwordErr.hidden = true;
        serverErr.hidden = true;

        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) modal.hidden = true;
        resetPasswordVisibility();
        document.body.style.overflow = '';
    }

    function validateAuthForm(email, password, isRegister) {
        const emailInput = document.getElementById('authEmailInput');
        const emailErr = getOrCreateEmailErrorEl();
        const passwordInput = document.getElementById('authPasswordInput');
        const passwordErr = document.getElementById('authPasswordError');

        let firstInvalidEl = null;

        if (!EMAIL_REGEX.test(email)) {
            emailInput?.classList.add('input-invalid');
            if (emailErr) {
                emailErr.textContent = 'Введіть коректний email (наприклад, name@gmail.com)';
                emailErr.hidden = false;
            }
            firstInvalidEl = emailInput;
        } else {
            emailInput?.classList.remove('input-invalid');
            if (emailErr) emailErr.hidden = true;
        }

        const isPasswordValid = isRegister
            ? STRONG_PASSWORD_REGEX.test(password)
            : password.length >= 8;

        if (!isPasswordValid) {
            passwordInput?.classList.add('input-invalid');
            if (passwordErr) {
                passwordErr.textContent = isRegister
                    ? 'Мінімум 8 символів, хоча б 1 літера та 1 цифра'
                    : 'Мінімум 8 символів';
                passwordErr.hidden = false;
            }
            if (!firstInvalidEl) firstInvalidEl = passwordInput;
        } else {
            passwordInput?.classList.remove('input-invalid');
            if (passwordErr) passwordErr.hidden = true;
        }

        if (firstInvalidEl) {
            firstInvalidEl.focus();
            return false;
        }

        return true;
    }

    async function handleAuthSubmit(event) {
        event.preventDefault();
        const nameInput = document.getElementById('authNameInput');
        const emailInput = document.getElementById('authEmailInput');
        const passwordInput = document.getElementById('authPasswordInput');
        const serverErr = document.getElementById('authServerError');
        const submitBtn = document.getElementById('authSubmitBtn');

        if (!submitBtn || submitBtn.disabled) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const name = nameInput.value.trim();
        const isRegister = state.authMode === 'register';

        serverErr.hidden = true;

        if (!validateAuthForm(email, password, isRegister)) {
            return;
        }

        submitBtn.disabled = true;
        const defaultBtnLabel = isRegister ? 'Створити акаунт' : 'Увійти';
        const wakeTimer = setTimeout(() => {
            if (submitBtn && submitBtn.disabled) {
                submitBtn.textContent = 'Сервер прокидається (до 30 с)...';
            }
        }, 3500);

        try {
            const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
            const body = isRegister ? { name, email, password } : { email, password };

            let data = await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(body)
            });

            let token = data?.token || data?.accessToken || data?.jwt
                || (data?.rawText && data.rawText.startsWith('eyJ') ? data.rawText : null);

            if (isRegister && !token) {
                data = await apiFetch('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                token = data?.token || data?.accessToken || data?.jwt
                    || (data?.rawText && data.rawText.startsWith('eyJ') ? data.rawText : null);
            }

            if (!token) {
                throw new Error('Сервер не повернув токен авторизації');
            }

            saveSession(token, data?.user || { email, name }, name);
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
            clearTimeout(wakeTimer);
            submitBtn.disabled = false;
            submitBtn.textContent = defaultBtnLabel;
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
        if (!buildId) return;
        try {
            await apiFetch(`/api/profile/builds/${encodeURIComponent(buildId)}`, {
                method: 'DELETE'
            });
            state.savedBuilds = state.savedBuilds.filter(
                (b) => String(getBuildId(b)) !== String(buildId)
            );
            renderHeaderProfile();
            renderMyBuildsGrid();
            showToast('Збірку видалено з профілю.');
        } catch (err) {
            showToast(err.message || 'Не вдалося видалити збірку');
        }
    }

    function ensureEditModalExists() {
        injectEditModalStyles();
        let backdrop = document.getElementById('editBuildModal');
        if (backdrop) return backdrop;

        backdrop = document.createElement('div');
        backdrop.id = 'editBuildModal';
        backdrop.className = 'pcp-modal-backdrop';
        backdrop.hidden = true;
        backdrop.innerHTML = `
            <div class="pcp-auth-modal pcp-edit-modal" role="dialog" aria-modal="true" aria-labelledby="editBuildModalTitle">
                <button type="button" class="pcp-modal-close" id="closeEditBuildModalBtn" aria-label="Закрити">✕</button>
                <h2 id="editBuildModalTitle" class="auth-modal-title">Редагувати збірку</h2>
                <p class="auth-modal-subtitle">Зміни назву, сценарій або заміни комплектуючі.</p>

                <form id="editBuildForm" class="auth-form" novalidate>
                    <div class="auth-field">
                        <label for="editBuildTitleInput">НАЗВА ЗБІРКИ</label>
                        <input type="text" id="editBuildTitleInput" required>
                    </div>

                    <div class="auth-field">
                        <label for="editBuildScenarioSelect">СЦЕНАРІЙ</label>
                        <select id="editBuildScenarioSelect" class="pcp-edit-select">
                            <option value="UNIVERSAL">Універсальний</option>
                            <option value="GAMING">Ігри</option>
                            <option value="WORK">Монтаж і 3D</option>
                            <option value="OFFICE">Офіс і навчання</option>
                        </select>
                    </div>

                    <div id="editBuildPartsContainer" class="pcp-edit-parts"></div>

                    <div class="pcp-edit-total-row">
                        <span>Нова вартість збірки:</span>
                        <strong id="editBuildTotalPrice">0 ₴</strong>
                    </div>

                    <div id="editBuildError" class="auth-server-error" hidden></div>

                    <button type="submit" id="saveEditedBuildBtn" class="auth-submit-btn">Зберегти зміни</button>
                </form>
            </div>
        `;
        document.body.appendChild(backdrop);

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeEditBuildModal();
        });
        document.getElementById('closeEditBuildModalBtn')?.addEventListener('click', closeEditBuildModal);
        document.getElementById('editBuildForm')?.addEventListener('submit', handleEditBuildSubmit);

        return backdrop;
    }

    function closeEditBuildModal() {
        const modal = document.getElementById('editBuildModal');
        if (modal) modal.hidden = true;
        state.editingBuildId = null;
        document.body.style.overflow = '';
    }

    function recalculateEditModalTotal() {
        const container = document.getElementById('editBuildPartsContainer');
        const totalEl = document.getElementById('editBuildTotalPrice');
        if (!container || !totalEl) return;

        let sum = 0;
        container.querySelectorAll('select[data-edit-part-select]').forEach((sel) => {
            const opt = sel.options[sel.selectedIndex];
            sum += Number(opt?.dataset?.price || 0);
        });
        totalEl.textContent = formatUah(sum);
    }

    async function openEditBuildModal(buildId) {
        const build = state.savedBuilds.find((b) => String(getBuildId(b)) === String(buildId));
        if (!build) return;

        const modal = ensureEditModalExists();
        state.editingBuildId = getBuildId(build);

        const titleInput = document.getElementById('editBuildTitleInput');
        const scenarioSelect = document.getElementById('editBuildScenarioSelect');
        const partsContainer = document.getElementById('editBuildPartsContainer');
        const errorBox = document.getElementById('editBuildError');

        titleInput.value = build.title || '';
        scenarioSelect.value = SCENARIO_LABELS[build.scenario] ? build.scenario : 'UNIVERSAL';
        errorBox.hidden = true;
        partsContainer.innerHTML = `<div class="saved-unchanged-note">Завантаження комплектуючих...</div>`;

        modal.hidden = false;
        document.body.style.overflow = 'hidden';

        if (!state.availableComponents) {
            try {
                const comps = await apiFetch('/api/profile/components');
                state.availableComponents = Array.isArray(comps) ? comps : [];
            } catch (err) {
                state.availableComponents = [];
            }
        }

        const items = build.items || [];
        partsContainer.innerHTML = items.map((item) => {
            const cat = String(item.category || '').toUpperCase();
            const catLabel = CATEGORY_LABELS[cat] || cat;
            const currentId = String(item.componentId ?? '');

            let optionsList = state.availableComponents.filter(
                (c) => String(c.category || '').toUpperCase() === cat
            );

            if (optionsList.length === 0 && currentId) {
                optionsList = [{
                    id: item.componentId,
                    name: getItemName(item),
                    category: cat,
                    priceUah: item.currentPriceUah ?? item.savedPriceUah ?? 0
                }];
            }

            const optionsHtml = optionsList.map((opt) => {
                const selected = String(opt.id) === currentId ? 'selected' : '';
                return `<option value="${escapeHtml(opt.id)}" data-price="${Number(opt.priceUah || 0)}" ${selected}>
                    ${escapeHtml(opt.name)} — ${formatUah(opt.priceUah)}
                </option>`;
            }).join('');

            return `
                <div class="auth-field">
                    <label>${escapeHtml(catLabel)}</label>
                    <select class="pcp-edit-select" data-edit-part-select>${optionsHtml}</select>
                </div>
            `;
        }).join('');

        partsContainer.querySelectorAll('select[data-edit-part-select]').forEach((sel) => {
            sel.addEventListener('change', recalculateEditModalTotal);
        });

        recalculateEditModalTotal();
    }

    async function handleEditBuildSubmit(event) {
        event.preventDefault();
        if (!state.editingBuildId) return;

        const titleInput = document.getElementById('editBuildTitleInput');
        const scenarioSelect = document.getElementById('editBuildScenarioSelect');
        const partsContainer = document.getElementById('editBuildPartsContainer');
        const errorBox = document.getElementById('editBuildError');
        const submitBtn = document.getElementById('saveEditedBuildBtn');

        const componentIds = Array.from(
            partsContainer.querySelectorAll('select[data-edit-part-select]')
        )
            .map((sel) => Number(sel.value))
            .filter((id) => !Number.isNaN(id) && id > 0);

        errorBox.hidden = true;
        submitBtn.disabled = true;

        try {
            await apiFetch(`/api/profile/builds/${encodeURIComponent(state.editingBuildId)}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title: titleInput.value.trim(),
                    scenario: scenarioSelect.value,
                    componentIds
                })
            });

            closeEditBuildModal();
            showToast('Збірку оновлено.');
            await loadSavedBuilds();
        } catch (err) {
            errorBox.textContent = err.message || 'Помилка оновлення збірки';
            errorBox.hidden = false;
        } finally {
            submitBtn.disabled = false;
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
        injectEditModalStyles();
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
            const bId = getBuildId(build);
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
                    const catTitle = CATEGORY_LABELS[item.category] || item.category;
                    return `
                                <div class="saved-change-item">
                                    <span>${escapeHtml(catTitle)} · ${escapeHtml(getItemName(item))}</span>
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

                    <div class="saved-card-actions saved-card-actions--three">
                        <button type="button" class="btn-open-saved-build" data-open-build-id="${escapeHtml(bId)}">Відкрити</button>
                        <button type="button" class="btn-edit-saved-build" data-edit-build-id="${escapeHtml(bId)}">Редагувати</button>
                        <button type="button" class="btn-delete-saved-build" data-delete-build-id="${escapeHtml(bId)}">Видалити</button>
                    </div>
                </article>
            `;
        }).join('');

        grid.querySelectorAll('[data-delete-build-id]').forEach((btn) => {
            btn.addEventListener('click', () => deleteSavedBuild(btn.dataset.deleteBuildId));
        });

        grid.querySelectorAll('[data-edit-build-id]').forEach((btn) => {
            btn.addEventListener('click', () => openEditBuildModal(btn.dataset.editBuildId));
        });

        grid.querySelectorAll('[data-open-build-id]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const targetId = String(btn.dataset.openBuildId);
                const build = state.savedBuilds.find((b) => String(getBuildId(b)) === targetId);
                if (build && typeof window.onOpenSavedBuild === 'function') {
                    closeMyBuildsView();
                    window.onOpenSavedBuild(build);
                }
            });
        });
    }

    async function init() {
        injectEditModalStyles();
        setupPasswordVisibilityToggle();
        renderHeaderProfile();

        document.getElementById('closeAuthModalBtn')?.addEventListener('click', closeAuthModal);
        document.getElementById('authModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'authModal') closeAuthModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAuthModal();
                closeEditBuildModal();
            }
        });

        document.querySelectorAll('.auth-tab').forEach((tab) => {
            tab.addEventListener('click', () => openAuthModal(tab.dataset.authTab));
        });

        document.getElementById('authSwitchModeBtn')?.addEventListener('click', () => {
            openAuthModal(state.authMode === 'login' ? 'register' : 'login');
        });

        const emailInput = document.getElementById('authEmailInput');
        const passwordInput = document.getElementById('authPasswordInput');

        emailInput?.addEventListener('input', () => {
            emailInput.classList.remove('input-invalid');
            const emailErr = getOrCreateEmailErrorEl();
            if (emailErr) emailErr.hidden = true;
            const serverErr = document.getElementById('authServerError');
            if (serverErr) serverErr.hidden = true;
        });

        passwordInput?.addEventListener('input', () => {
            passwordInput.classList.remove('input-invalid');
            const passwordErr = document.getElementById('authPasswordError');
            if (passwordErr) passwordErr.hidden = true;
            const serverErr = document.getElementById('authServerError');
            if (serverErr) serverErr.hidden = true;
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
                if (me && !me.rawText) {
                    saveSession(state.token, me, state.user?.name);
                }
            } catch (err) {
                if (!state.token) return;
            }
            await loadSavedBuilds();
        }
    }

    window.PCPickerProfile = {
        saveBuild: saveBuildToProfile,
        openMyBuilds: openMyBuildsView
    };

    document.addEventListener('DOMContentLoaded', init);
})();