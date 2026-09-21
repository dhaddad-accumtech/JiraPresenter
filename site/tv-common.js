// tv-common.js - Shared utilities for Big Monitor Wallboards

// State
let tvIntervalMinutes = 180; // Default 3 hours as requested
let tvCountdownSeconds = tvIntervalMinutes * 60;
let tvCountdownTimer = null;
let tvClockTimer = null;

// Initialize refresh settings from config.js file (with optional URL param override)
function initRefreshSettings(onRefreshCallback) {
  // Read from file configuration (config.js)
  if (window.WALLBOARD_CONFIG && window.WALLBOARD_CONFIG.refreshIntervalMinutes) {
    tvIntervalMinutes = window.WALLBOARD_CONFIG.refreshIntervalMinutes;
  }

  // Optional URL parameter override (e.g., ?refresh=60)
  const urlParams = new URLSearchParams(window.location.search);
  const paramRefresh = parseInt(urlParams.get('refresh'), 10);
  if (!isNaN(paramRefresh) && paramRefresh > 0) {
    tvIntervalMinutes = paramRefresh;
  }

  startDigitalClock();
  startCountdown(onRefreshCallback);
  initTheme();
}

// ---------------------------------------------------------------------------
// Light / Dark theme toggle
// Wallboards default to dark mode. The choice is remembered per-browser via
// localStorage so a TV/kiosk browser keeps showing the preferred theme after
// a refresh. For non-interactive displays (no mouse/touch, e.g. a shared
// office TV), the theme can instead be forced via config.js's `theme` field
// ('dark' or 'light'), which ignores localStorage/clicks and hides the
// toggle button since it would otherwise be unusable there.
// ---------------------------------------------------------------------------
const TV_THEME_STORAGE_KEY = 'wallboard-theme';

// Returns 'dark'/'light' if the theme is forced (config.js or a ?theme= URL
// override), or null when the display is interactive ('auto').
function getForcedTheme() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramTheme = urlParams.get('theme');
  if (paramTheme === 'dark' || paramTheme === 'light') {
    return paramTheme;
  }
  const cfgTheme = window.WALLBOARD_CONFIG && window.WALLBOARD_CONFIG.theme;
  if (cfgTheme === 'dark' || cfgTheme === 'light') {
    return cfgTheme;
  }
  return null;
}

function getStoredTheme() {
  const forced = getForcedTheme();
  if (forced) return forced;
  try {
    return localStorage.getItem(TV_THEME_STORAGE_KEY) || 'dark';
  } catch (e) {
    return 'dark';
  }
}

function applyTheme(theme) {
  const isDark = theme !== 'light';
  document.documentElement.classList.toggle('dark', isDark);

  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.setAttribute('data-lucide', isDark ? 'moon' : 'sun');
    if (window.lucide) lucide.createIcons();
  }

  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
}

function toggleTheme() {
  if (getForcedTheme()) return; // theme is locked for non-interactive/kiosk displays
  const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  try {
    localStorage.setItem(TV_THEME_STORAGE_KEY, next);
  } catch (e) {
    // localStorage unavailable (e.g. private browsing) - theme just won't persist
  }
  applyTheme(next);
}

function initTheme() {
  applyTheme(getStoredTheme());
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  if (getForcedTheme()) {
    btn.style.display = 'none'; // hide the dead control when the theme is locked
    return;
  }
  if (!btn.dataset.themeBound) {
    btn.addEventListener('click', toggleTheme);
    btn.dataset.themeBound = 'true';
  }
}

// Live Digital Clock
function startDigitalClock() {
  const clockEl = document.getElementById('digital-clock');
  const dateEl = document.getElementById('digital-date');

  function updateClock() {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    }
  }

  updateClock();
  if (tvClockTimer) clearInterval(tvClockTimer);
  tvClockTimer = setInterval(updateClock, 1000);
}

// In-browser silent background polling
function startCountdown(onRefreshCallback) {
  tvCountdownSeconds = tvIntervalMinutes * 60;
  const countdownEl = document.getElementById('refresh-countdown');

  function updateDisplay() {
    if (!countdownEl) return;
    const hours = Math.floor(tvCountdownSeconds / 3600);
    const minutes = Math.floor((tvCountdownSeconds % 3600) / 60);
    const seconds = tvCountdownSeconds % 60;

    if (hours > 0) {
      countdownEl.textContent = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      countdownEl.textContent = `${minutes}m ${seconds}s`;
    } else {
      countdownEl.textContent = `${seconds}s`;
    }
  }

  updateDisplay();

  if (tvCountdownTimer) clearInterval(tvCountdownTimer);
  tvCountdownTimer = setInterval(async () => {
    tvCountdownSeconds--;
    if (tvCountdownSeconds <= 0) {
      tvCountdownSeconds = tvIntervalMinutes * 60;
      updateDisplay();
      if (typeof onRefreshCallback === 'function') {
        const refreshBadge = document.getElementById('refresh-indicator');
        if (refreshBadge) refreshBadge.classList.add('animate-spin');
        try {
          await onRefreshCallback();
        } finally {
          setTimeout(() => {
            if (refreshBadge) refreshBadge.classList.remove('animate-spin');
          }, 800);
        }
      }
    } else {
      updateDisplay();
    }
  }, 1000);
}

function resetCountdown(onRefreshCallback) {
  startCountdown(onRefreshCallback);
}

// Priority & Type helpers for wallboards
function getPriorityBadgeClass(priority) {
  const p = (priority || '').toLowerCase();
  if (p.includes('highest') || p.includes('blocker')) return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  if (p.includes('high') || p.includes('critical')) return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
  if (p.includes('medium')) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  if (p.includes('low')) return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
}

function getTypeIcon(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('bug')) return 'bug';
  if (t.includes('story')) return 'bookmark';
  if (t.includes('release')) return 'milestone';
  if (t.includes('spike') || t.includes('research')) return 'lightbulb';
  return 'check-square';
}

function formatRelativeTime(isoString) {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (e) {
    return isoString;
  }
}
