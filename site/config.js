// config.js - Wallboard Dashboard Configuration
// Edit these settings to customize your monitor behavior without modifying HTML.

window.WALLBOARD_CONFIG = {
  // In-browser background refresh interval in minutes.
  // Default is 180 (3 hours).
  refreshIntervalMinutes: 180,

  // Duration in seconds between page cycles in the Auto-Cycle view (auto-scroll.html).
  cycleDurationSeconds: 12,

  // Theme for this display. Options:
  //   'auto'  - (default) interactive: shows the sun/moon toggle button and
  //             remembers the last choice per-browser via localStorage.
  //             Good for laptops/desktops where someone can click.
  //   'dark'  - always dark, regardless of localStorage. Toggle button is hidden.
  //   'light' - always light, regardless of localStorage. Toggle button is hidden.
  // Use 'dark' or 'light' for non-interactive displays (e.g. a shared office/
  // wallboard TV with no mouse or touch input). This can also be set for you
  // automatically during GitHub Actions deployment via the WALLBOARD_THEME
  // repository variable/secret (see README.md).
  theme: 'auto'
};
