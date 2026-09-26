/* ==========================================================================
   cards.js — cursor-following border glow ([data-glow]) + 3D tilt ([data-tilt])
   ========================================================================== */
window.App = window.App || {};

App.cards = {
    init() {
        if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

        document.querySelectorAll("[data-glow]").forEach((el) => {
            el.addEventListener("pointermove", (e) => {
                const r = el.getBoundingClientRect();
                el.style.setProperty("--mx", e.clientX - r.left + "px");
                el.style.setProperty("--my", e.clientY - r.top + "px");
            });
        });

        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        document.querySelectorAll("[data-tilt]").forEach((el) => {
            el.addEventListener("pointermove", (e) => {
                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                el.style.transform = `rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg)`;
            });
            el.addEventListener("pointerleave", () => { el.style.transform = ""; });
        });
    },
};