/* === Управління світлою та темною темою (localStorage + prefers-color-scheme) === */
(function initThemeSwitcher() {
    const STORAGE_KEY = 'pcpicker-theme';
    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

    function getCurrentTheme() {
        const attr = document.documentElement.getAttribute('data-theme');
        if (attr === 'light' || attr === 'dark') return attr;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') return saved;
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
                if (!localStorage.getItem(STORAGE_KEY)) {
                    applyTheme(e.matches ? 'light' : 'dark', false);
                }
            });
        }
    });
})();