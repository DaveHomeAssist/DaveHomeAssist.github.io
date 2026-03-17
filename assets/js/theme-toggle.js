/* Flash-prevention snippet for <head>:
   (function(){var t=localStorage.getItem('dha-theme');
   if(t&&t!=='auto')document.documentElement.setAttribute('data-theme',t)})(); */
(() => {
  if (typeof window.__dhaThemeCleanup === "function") {
    window.__dhaThemeCleanup();
  }

  const root = document.documentElement;
  const button = document.querySelector("[data-theme-toggle]");
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const storageKey = "dha-theme";
  const themeOrder = ["auto", "dark", "light"];

  const readStoredTheme = () => {
    try {
      const storedTheme = window.localStorage.getItem(storageKey);
      return themeOrder.includes(storedTheme) ? storedTheme : "auto";
    } catch {
      return "auto";
    }
  };

  const writeStoredTheme = (theme) => {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // Ignore storage failures and still keep in-memory state applied.
    }
  };

  const resolveTheme = (theme) => {
    if (theme === "light" || theme === "dark") {
      return theme;
    }

    return mediaQuery.matches ? "dark" : "light";
  };

  const updateButtonState = (theme) => {
    if (!button) return;

    const labelMap = {
      auto: "Using system theme",
      dark: "Switch to light mode",
      light: "Switch to dark mode",
    };

    button.setAttribute("aria-label", labelMap[theme]);
    button.setAttribute("data-current-theme", theme);
  };

  const applyTheme = (theme) => {
    if (theme === "auto") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }

    const resolved = resolveTheme(theme);
    root.setAttribute("data-resolved-theme", resolved);
    updateButtonState(theme);

    document.dispatchEvent(
      new CustomEvent("themechange", {
        detail: { theme, resolved },
      })
    );
  };

  let currentTheme = readStoredTheme();
  applyTheme(currentTheme);

  const cycleTheme = () => {
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    currentTheme = nextTheme;
    writeStoredTheme(currentTheme);
    applyTheme(currentTheme);
  };

  const onToggleClick = () => {
    cycleTheme();
  };

  const onSystemThemeChange = () => {
    if (currentTheme === "auto") {
      applyTheme(currentTheme);
    }
  };

  if (button) {
    button.addEventListener("click", onToggleClick);
  }

  mediaQuery.addEventListener("change", onSystemThemeChange);

  window.__dhaThemeCleanup = () => {
    if (button) {
      button.removeEventListener("click", onToggleClick);
    }

    mediaQuery.removeEventListener("change", onSystemThemeChange);
  };
})();
