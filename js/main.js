/* ==========================================================================
   main.js — starts everything (scripts are deferred, so the DOM is ready)
   ========================================================================== */
window.App = window.App || {};

App.toast = function (msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(App._toastTimer);
    App._toastTimer = setTimeout(() => t.classList.remove("is-show"), 2200);
};

(function start() {
    App.render.all();      // 1. build the DOM from data
    App.ribbons.init();    // 2. ambient effects
    App.cards.init();      // 3. interactions (needs the rendered cards)
    App.nav.init();
    App.scrollFx.init();   // 4. scroll-driven effects

    document.getElementById("year").textContent = new Date().getFullYear();

    // Copy-to-clipboard buttons
    document.addEventListener("click", async (e) => {
        const btn = e.target.closest("[data-copy]");
        if (!btn) return;
        try {
            await navigator.clipboard.writeText(btn.dataset.copy);
            App.toast("Email copied to clipboard");
        } catch {
            App.toast(btn.dataset.copy);
        }
    });
})();