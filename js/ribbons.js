/* ==========================================================================
   ribbons.js — canvas ribbons that tangle / untangle per section.
   Each <section data-tangle="0..1"> sets the target tangle amount.
   ========================================================================== */
window.App = window.App || {};

App.ribbons = (function () {
    const COLORS = [[245, 176, 72], [255, 122, 69], [94, 234, 212], [232, 234, 239], [167, 139, 250]];
    let c, ctx, w, h, t = 0, tangle = 0.15, target = 0.15;
    let mx = -9999, my = -9999, emx = -9999, emy = -9999;
    let sections = [], reduced = false, raf = null;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = innerWidth; h = innerHeight;
        c.width = w * dpr; c.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (reduced) draw();
    }

    function updateTarget() {
        const mid = innerHeight / 2;
        for (const s of sections) {
            const r = s.getBoundingClientRect();
            if (r.top <= mid && r.bottom >= mid) { target = parseFloat(s.dataset.tangle) || 0; return; }
        }
    }

    function yAt(i, x, sp) {
        const k = tangle, n = COLORS.length, center = h * 0.55;
        const spread = (i - (n - 1) / 2) * h * 0.05 * (1 - k * 0.85);   // parallel when calm
        const f1 = 0.0018 + k * 0.0012 * (i % 3);                        // diverging freq when tangled
        const amp = h * (0.05 + 0.13 * k);
        let y = center + spread
            + Math.sin(x * f1 + t * (0.5 + 0.1 * i) + i * 1.7 * k + sp) * amp
            + Math.sin(x * 0.004 * (1 + k * i * 0.35) - t * 0.7 + i) * h * 0.03 * k;

        // Soft repel from cursor
        const dx = x - emx, dy = y - emy, R = 160, d2 = dx * dx + dy * dy;
        if (d2 < R * R) { const d = Math.sqrt(d2) || 1; y += (dy / d) * (R - d) * 0.5; }
        return y;
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        const step = w < 700 ? 18 : 14;
        const sp = window.scrollY * 0.0018; // scrolling moves the ribbons along

        COLORS.forEach((col, i) => {
            const top = [], bot = [];
            for (let x = -20; x <= w + 20; x += step) {
                const y = yAt(i, x, sp);
                const hw = 1 + 8 * Math.abs(Math.sin(x * 0.006 + t * 0.8 + i * 2)); // twist
                top.push(x, y - hw); bot.push(x, y + hw);
            }
            const a = i === 3 ? 0.16 : 0.3;
            const g = ctx.createLinearGradient(0, 0, w, 0);
            g.addColorStop(0, `rgba(${col},0)`);
            g.addColorStop(0.25, `rgba(${col},${a})`);
            g.addColorStop(0.75, `rgba(${col},${a})`);
            g.addColorStop(1, `rgba(${col},0)`);

            ctx.beginPath();
            ctx.moveTo(top[0], top[1]);
            for (let j = 2; j < top.length; j += 2) ctx.lineTo(top[j], top[j + 1]);
            for (let j = bot.length - 2; j >= 0; j -= 2) ctx.lineTo(bot[j], bot[j + 1]);
            ctx.closePath();
            ctx.fillStyle = g;
            ctx.fill();
        });
    }

    function loop() {
        t += 0.008;
        tangle += (target - tangle) * 0.03;
        emx += (mx - emx) * 0.12;
        emy += (my - emy) * 0.12;
        draw();
        raf = requestAnimationFrame(loop);
    }

    function init() {
        c = document.getElementById("ribbons");
        if (!c || !c.getContext) return;
        ctx = c.getContext("2d");
        reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        sections = [...document.querySelectorAll("[data-tangle]")];

        resize();
        updateTarget();
        tangle = target;
        addEventListener("resize", resize);
        addEventListener("scroll", updateTarget, { passive: true });

        if (reduced) { draw(); return; }

        addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
        document.addEventListener("pointerleave", () => { mx = my = -9999; });
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
            else if (!raf) loop();
        });
        loop();
    }

    return { init };
})();