/* ==========================================================================
   nav.js — scrolled/hidden states, burger menu, active section link
   ========================================================================== */
window.App = window.App || {};

App.nav = {
    init() {
        const nav = document.getElementById("nav");
        const burger = document.getElementById("navBurger");
        const links = [...document.querySelectorAll(".nav__links a")];
        let lastY = scrollY;

        const onScroll = () => {
            const y = scrollY;
            nav.classList.toggle("is-scrolled", y > 20);
            if (!nav.classList.contains("is-open")) nav.classList.toggle("is-hidden", y > lastY && y > 400);
            lastY = y;
        };
        addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        const setOpen = (open) => {
            nav.classList.toggle("is-open", open);
            burger.setAttribute("aria-expanded", String(open));
            burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
            if (open) nav.classList.remove("is-hidden");
        };
        burger.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
        links.forEach((a) => a.addEventListener("click", () => setOpen(false)));
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });

        const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (!en.isIntersecting) return;
                links.forEach((l) => l.classList.remove("is-active"));
                const link = map.get(en.target.id);
                if (link) link.classList.add("is-active");
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        document.querySelectorAll("main section[id]").forEach((s) => io.observe(s));
    },
};