// Theme Manager - Handle light/dark mode switching
// localStorage key: 'narrativeGenTheme'

const THEME_KEY = 'narrativeGenTheme';
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

class ThemeManager {
  constructor() {
    this.currentTheme = this.loadTheme();
    this.systemPreference = this.getSystemPreference();
    this.setupMediaQueryListener();
  }

  // Load saved theme from localStorage
  loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    return saved || THEMES.AUTO;
  }

  // Save theme to localStorage
  saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    this.currentTheme = theme;
  }

  // Get system color scheme preference
  getSystemPreference() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? THEMES.DARK
      : THEMES.LIGHT;
  }

  // Listen for system preference changes
  setupMediaQueryListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      this.systemPreference = e.matches ? THEMES.DARK : THEMES.LIGHT;
      if (this.currentTheme === THEMES.AUTO) {
        this.applyTheme();
      }
    });
  }

  // Determine effective theme
  getEffectiveTheme() {
    if (this.currentTheme === THEMES.AUTO) {
      return this.systemPreference;
    }
    return this.currentTheme;
  }

  // Apply theme to document
  applyTheme() {
    const effectiveTheme = this.getEffectiveTheme();
    document.documentElement.setAttribute('data-theme', effectiveTheme);

    // Add smooth transition class
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);
  }

  // Toggle between light and dark (manual override)
  toggle() {
    const currentEffective = this.getEffectiveTheme();
    const newTheme = currentEffective === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    this.saveTheme(newTheme);
    this.applyTheme();
    return newTheme;
  }

  // Initialize theme on page load
  init() {
    this.applyTheme();
  }
}

export const themeManager = new ThemeManager();
