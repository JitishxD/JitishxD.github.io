/* ==========================================================================
   story.js — chapter rail + narration captions, driven by ribbons.js events
   ========================================================================== */
window.App = window.App || {};

App.story = (function () {
    const CHAPTERS = {
        home: { title: "Prologue", line: "Every story starts with a single thread." },
        about: { title: "Who I am", line: "Curious about how things are built — and how they break." },
        skills: { title: "The toolkit", line: "The threads I weave with." },
        journey: { title: "The journey", line: "Where the thread has led so far." },
        projects: { title: "The work", line: "Shipped end to end, secured by default." },
        achievements: { title: "Milestones", line: "Knots worth tying." },
        resume: { title: "On paper", line: "The whole story, one page." },
        contact: { title: "Epilogue", line: "All threads meet here. Let's tie ours." },
    };

    let rail, label, numEl, titleEl, lineEl, items = [], current = -1, hideTimer;

    function showLabel(i) {
        const it = items[i];
        if (!it) return;
        numEl.textContent = String(i).padStart(2, "0");
        titleEl.textContent = it.meta.title;
        lineEl.textContent = it.meta.line;
        label.style.setProperty("--ly", `${it.a.offsetTop + it.a.offsetHeight / 2}px`);
    }

    function setChapter(i) {
        if (i === current || !items.length) return;
        current = i;
        items.forEach((it, k) => {
            it.a.classList.toggle("is-active", k === i);
            it.a.classList.toggle("is-past", k < i);
            it.sec.classList.toggle("is-lit", k <= i);
            if (k === i) it.a.setAttribute("aria-current", "step");
            else it.a.removeAttribute("aria-current");
        });
        showLabel(i);
        rail.classList.add("is-talking");
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => rail.classList.remove("is-talking"), 2800);
    }

    function init() {
        const sections = [...document.querySelectorAll("main > section[id]")];
        if (!sections.length) return;

        rail = document.createElement("nav");
        rail.className = "story-rail";
        rail.setAttribute("aria-label", "Story chapters");
        const list = document.createElement("ol");

        sections.forEach((sec, i) => {
            const meta = CHAPTERS[sec.id] || { title: sec.id, line: "" };
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = `#${sec.id}`;
            a.className = "story-rail__tick";
            a.setAttribute("aria-label", `Chapter ${String(i).padStart(2, "0")}: ${meta.title}`);
            a.addEventListener("mouseenter", () => showLabel(i));
            a.addEventListener("focus", () => showLabel(i));
            li.appendChild(a);
            list.appendChild(li);
            items.push({ sec, a, meta });
        });

        label = document.createElement("div");
        label.className = "story-rail__label";
        label.setAttribute("aria-hidden", "true");
        label.innerHTML =
            '<span class="story-rail__num mono"></span>' +
            '<strong class="story-rail__title"></strong>' +
            '<span class="story-rail__line"></span>';
        numEl = label.children[0];
        titleEl = label.children[1];
        lineEl = label.children[2];

        rail.append(list, label);
        rail.addEventListener("mouseleave", () => showLabel(current));
        document.body.appendChild(rail);

        document.addEventListener("story:chapter", (e) => setChapter(e.detail.index));
        document.addEventListener("story:complete", () => document.body.classList.add("story-complete"));
        document.addEventListener("story:reset", () => document.body.classList.remove("story-complete"));
    }

    return { init };
})();
