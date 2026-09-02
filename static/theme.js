// Applies the saved public theme before first paint (F17).
// Loaded synchronously from _app.tsx <head> so there is no light/dark
// flash. The admin area manages its own theme server-side and is
// skipped here. CSP: same-origin static file, allowed by script-src 'self'.
(function () {
  if (location.pathname.startsWith("/admin")) return;
  try {
    if (localStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch (_) {
    /* localStorage unavailable (private mode etc.) - stay light */
  }
})();
