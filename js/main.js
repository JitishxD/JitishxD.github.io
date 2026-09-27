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
    App.render.all();                 // 1. build the DOM from data
    App.cards.init();                 // 2. interactions (needs the rendered cards)
    App.nav.init();
    App.scrollFx.init();              // 3. scroll-driven effects (may change section heights)
    if (App.story) App.story.init();  // 4. chapter rail (listens for ribbon events)
    App.ribbons.init();               // 5. story threads (needs final layout heights)

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