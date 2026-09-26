/* ==========================================================================
   scroll-fx.js — split text, reveals, counters, progress bar, timeline fill,
   horizontal project cards, stacking cards, scroll-reactive marquee
   ========================================================================== */
window.App = window.App || {};

App.scrollFx = (function () {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mqDesk = matchMedia("(min-width: 1025px)");
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    let proj, track, cards, bar, stackCards, tlWrap, tlFill, tlItems, progress, horizontal = false;

    function splitText() {
        document.querySelectorAll("[data-split]").forEach((el) => {
            const text = el.textContent.trim();
            let i = 0;
            const words = text.split(" ").map((w) =>
                `<span class="word" aria-hidden="true">${[...w].map((ch) => `<span class="char" style="--i:${i++}">${ch}</span>`).join("")}</span>`
            ).join(" ");
            el.innerHTML = `<span class="sr-only">${text}</span>${words}`;
        });
    }

    function reveals() {
        const els = document.querySelectorAll(".reveal");
        if (reduced || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-visible")); return; }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
        els.forEach((e) => io.observe(e));
    }

    function animateCount(el) {
        const end = parseFloat(el.dataset.count), dec = +el.dataset.decimals || 0, suf = el.dataset.suffix || "";
        const fmt = (v) => v.toFixed(dec) + suf;
        if (reduced) { el.textContent = fmt(end); return; }
        const dur = 1600, t0 = performance.now();
        const step = (now) => {
            const p = clamp((now - t0) / dur);
            el.textContent = fmt(end * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    function counters() {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (!en.isIntersecting) return;
                io.unobserve(en.target);
                animateCount(en.target);
            });
        }, { threshold: 0.6 });
        document.querySelectorAll("[data-count]").forEach((e) => io.observe(e));
    }

    function marquee() {
        const rows = [...document.querySelectorAll(".marquee__row")];
        if (!rows.length || reduced) return;
        const pos = rows.map(() => 0);
        let lastY = scrollY, vel = 0;
        const loop = () => {
            const dy = scrollY - lastY;
            lastY = scrollY;
            vel += (dy - vel) * 0.1;
            rows.forEach((row, i) => {
                const dir = i % 2 ? 1 : -1;
                const half = row.scrollWidth / 2;
                pos[i] += dir * (0.5 + vel * 0.3); // scrolling speeds it up; scrolling up reverses it
                if (pos[i] <= -half) pos[i] += half;
                if (pos[i] > 0) pos[i] -= half;
                row.style.transform = `translate3d(${pos[i].toFixed(1)}px,0,0)`;
            });
            requestAnimationFrame(loop);
        };
        loop();
    }

    function setupProjects() {
        horizontal = mqDesk.matches && !reduced;
        proj.classList.toggle("is-horizontal", horizontal);
        if (!horizontal) {
            proj.style.height = "";
            track.style.transform = "";
            cards.forEach((c) => { c.style.removeProperty("--off"); c.style.removeProperty("--focus"); });
            return;
        }
        const dist = Math.max(0, track.scrollWidth - innerWidth);
        proj.style.height = dist + innerHeight + "px";
    }

    function update() {
        const vh = innerHeight;
        const max = document.documentElement.scrollHeight - vh;
        progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;

        // Timeline fill + active dots
        if (tlWrap) {
            const r = tlWrap.getBoundingClientRect();
            tlFill.style.transform = `scaleY(${clamp((vh * 0.6 - r.top) / r.height)})`;
            tlItems.forEach((it) => it.classList.toggle("is-active", it.getBoundingClientRect().top < vh * 0.6));
        }

        // Horizontal project cards
        if (horizontal) {
            const r = proj.getBoundingClientRect();
            const dist = Math.max(0, track.scrollWidth - innerWidth);
            const p = clamp(-r.top / Math.max(1, proj.offsetHeight - vh));
            track.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`;
            bar.style.transform = `scaleX(${p})`;
            const cx = innerWidth / 2;
            cards.forEach((c) => {
                const cr = c.getBoundingClientRect();
                const off = clamp(((cr.left + cr.width / 2 - cx) / innerWidth) * 1.6, -1, 1);
                c.style.setProperty("--off", off.toFixed(3));
                c.style.setProperty("--focus", (1 - Math.abs(off)).toFixed(3));
            });
        }

        // Stacking cards: shrink + dim as the next card slides over
        if (!reduced) {
            stackCards.forEach((c, i) => {
                const next = stackCards[i + 1];
                if (!next) return;
                const r = c.getBoundingClientRect(), nr = next.getBoundingClientRect();
                const p = clamp(1 - (nr.top - r.top) / r.height);
                c.style.transform = `scale(${(1 - p * 0.06).toFixed(4)})`;
                c.style.filter = `brightness(${(1 - p * 0.4).toFixed(3)})`;
            });
        }
    }

    function init() {
        splitText();
        reveals();
        counters();
        marquee();

        proj = document.getElementById("projects");
        track = document.getElementById("projectsTrack");
        cards = [...track.children];
        bar = document.getElementById("projectsBar");
        stackCards = [...document.querySelectorAll(".stack__card")];
        tlWrap = document.querySelector(".timeline");
        tlFill = document.querySelector(".timeline__line span");
        tlItems = [...document.querySelectorAll(".tl-item")];
        progress = document.querySelector(".scroll-progress span");

        setupProjects();

        let ticking = false;
        addEventListener("scroll", () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => { update(); ticking = false; });
        }, { passive: true });

        let rt;
        const refresh = () => { setupProjects(); update(); };
        addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(refresh, 150); });
        if (mqDesk.addEventListener) mqDesk.addEventListener("change", refresh);
        addEventListener("load", refresh);
        update();
    }

    return { init };
})();