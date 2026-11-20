try {
  const theme = localStorage.getItem("rea-theme")
  if (theme === "light" || theme === "dark") {
    document.documentElement.dataset.theme = theme
  }
} catch {
  // Storage may be unavailable; respect the system preference.
}
