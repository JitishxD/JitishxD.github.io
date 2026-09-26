/* ==========================================================================
   render.js — builds all dynamic sections from App.data
   ========================================================================== */
window.App = window.App || {};

App.fallback = function (img) {
    img.parentElement.classList.add("is-fallback");
    img.remove();
};

App.render = (function () {
    const $ = (s) => document.querySelector(s);
    const I = (n, s) => App.icon(n, s);
    const has = (u) => u && u !== "#";
    const pad = (n) => String(n).padStart(2, "0");

    function heroSocial() {
        $("#heroSocial").innerHTML = App.data.socials.map((s) => `
      <li><a class="icon-btn" data-glow href="${s.url}" ${s.url.startsWith("http") ? 'target="_blank" rel="me noopener noreferrer"' : ""} aria-label="${s.label}" title="${s.label}">${I(s.icon, 18)}</a></li>`).join("");
    }

    function about() {
        const { about: a, profile: p, stats } = App.data;
        $("#aboutMount").innerHTML = `
      <div class="about__text reveal">
        ${a.paragraphs.map((t) => `<p>${t}</p>`).join("")}
        <div class="about__meta">${a.meta.map((m) => `<span>${I(m.icon, 16)}${m.text}</span>`).join("")}</div>
      </div>
      <div class="about__photo reveal" style="--d:150ms">
        <img src="${p.photo}" alt="Portrait of ${p.name}" loading="lazy" onerror="App.fallback(this)">
        <span class="media-fallback">JG</span>
      </div>
      <div class="stats">
        ${stats.map((s, i) => `
          <div class="stat reveal" style="--d:${i * 100}ms">
            <span class="stat__value" data-count="${s.value}" data-decimals="${s.decimals || 0}" data-suffix="${s.suffix || ""}">0</span>
            <span class="stat__label">${s.label}</span>
          </div>`).join("")}
      </div>`;
    }

    function skills() {
        $("#skillsMount").innerHTML = App.data.skills.map((g, i) => `
      <div class="card skill-group reveal" data-glow style="--d:${i * 80}ms">
        <div class="skill-group__head">
          <span class="skill-group__icon">${I(g.icon, 18)}</span><h3>${g.title}</h3>
        </div>
        <div class="chips">${g.items.map((x) => `<span class="chip">${x}</span>`).join("")}</div>
      </div>`).join("");

        $("#marqueeMount").innerHTML = App.data.marquee.map((row) => {
            const items = row.map((w, j) => `<span class="marquee__item ${j % 2 ? "is-outline" : ""}">${w}</span><span class="marquee__sep">✦</span>`).join("");
            return `<div class="marquee__row" aria-hidden="true">${items}${items}</div>`;
        }).join("");
    }

    function timeline() {
        $("#timelineItems").innerHTML = App.data.timeline.map((t) => `
      <div class="tl-item reveal">
        <div class="card tl-card" data-glow>
          <div class="tl-card__top">
            <span class="tl-badge">${I(t.icon, 13)}${t.type}</span>
            <span class="tl-period mono">${t.period}</span>
          </div>
          <h3 class="tl-title">${t.title}</h3>
          <p class="tl-org">${t.org} <span>· ${t.location}</span></p>
          ${t.points ? `<ul class="tl-points">${t.points.map((p) => `<li>${p}</li>`).join("")}</ul>` : ""}
          ${t.chips ? `<div class="chips chips--sm">${t.chips.map((c) => `<span class="chip">${c}</span>`).join("")}</div>` : ""}
        </div>
      </div>`).join("");
    }

    function projects() {
        $("#projectsTrack").innerHTML = App.data.projects.map((p, i) => {
            const links = p.links.filter((l) => has(l.url))
                .map((l) => `<a class="link-arrow" href="${l.url}" target="_blank" rel="noopener">${I(l.icon, 15)}${l.label}</a>`).join("");
            return `
      <article class="project">
        <div class="card project__inner" data-glow data-tilt>
          <div class="project__media">
            <span class="project__index mono">${pad(i + 1)} / ${pad(App.data.projects.length)}</span>
            <img src="${p.image}" alt="${p.title} screenshot" loading="lazy" onerror="App.fallback(this)">
            <span class="media-fallback">${p.short}</span>
          </div>
          <div class="project__body">
            <div class="project__meta mono"><span class="project__type">${p.type}</span><span>${p.period}</span></div>
            <h3 class="project__title">${p.title}</h3>
            <p class="project__tagline">${p.tagline}</p>
            <ul class="project__points">${p.points.map((x) => `<li>${x}</li>`).join("")}</ul>
            <div class="chips chips--sm">${p.stack.map((s) => `<span class="chip">${s}</span>`).join("")}</div>
            ${links ? `<div class="project__links">${links}</div>` : ""}
          </div>
        </div>
      </article>`;
        }).join("");
    }

    function stack() {
        $("#stackMount").innerHTML = App.data.achievements.map((a, i) => `
      <article class="card stack__card" data-glow style="--i:${i}">
        <div class="stack__icon">${I(a.icon, 26)}</div>
        <div>
          <div class="stack__meta mono"><span>${a.type}</span><span>${a.period}</span></div>
          <h3 class="stack__title">${a.title}</h3>
          <p class="stack__org">${a.org}</p>
          <p class="stack__desc">${a.desc}</p>
          ${a.link && has(a.link.url) ? `<a class="link-arrow" href="${a.link.url}" target="_blank" rel="noopener">${a.link.label} →</a>` : ""}
        </div>
        <span class="stack__num">${pad(i + 1)}</span>
      </article>`).join("");
    }

    function resume() {
        const r = App.data.profile.resume;
        const file = r.split("/").pop();
        $("#resumeMount").innerHTML = `
      <div class="card resume__viewer reveal">
        <div class="resume__bar">
          <span class="resume__dots"><i></i><i></i><i></i></span>
          <span class="resume__file mono">${file}</span>
          <a class="resume__open" href="${r}" target="_blank" rel="noopener">Open ${I("external", 14)}</a>
        </div>
        <object class="resume__object" data="${r}#view=FitH" type="application/pdf" aria-label="Resume PDF">
          <div class="resume__fallback">
            ${I("file", 40)}<p>Your browser can't display PDFs inline.</p>
            <a class="btn btn--primary" href="${r}" download>Download PDF</a>
          </div>
        </object>
        <div class="resume__mobile">
          ${I("file", 44)}<p>Tap below to view the full resume.</p>
          <a class="btn btn--primary" href="${r}" target="_blank" rel="noopener">Open resume</a>
        </div>
      </div>
      <aside class="resume__aside reveal" style="--d:150ms">
        <a class="btn btn--primary btn--block" href="${r}" download>${I("download", 18)} Download PDF</a>
        <a class="btn btn--ghost btn--block" href="${r}" target="_blank" rel="noopener">${I("external", 18)} Open in new tab</a>
        <div class="card resume__facts" data-glow>
          <h3>At a glance</h3>
          <dl>${App.data.resumeFacts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
        </div>
      </aside>`;
    }

    function contact() {
        const p = App.data.profile;
        const socials = App.data.socials.filter((s) => s.icon !== "mail")
            .map((s) => `<a class="btn btn--ghost" href="${s.url}" target="_blank" rel="me noopener noreferrer">${I(s.icon, 16)} ${s.label}</a>`).join("");
        $("#contactMount").innerHTML = `
      <a class="btn btn--primary btn--lg" href="mailto:${p.email}">${I("mail", 18)} ${p.email}</a>
      <div class="contact__row">
        <button class="btn btn--ghost" type="button" data-copy="${p.email}">${I("copy", 16)} Copy email</button>
        ${socials}
        ${p.showPhone ? `<a class="btn btn--ghost" href="tel:${p.phone.replace(/[^+\d]/g, "")}">${I("phone", 16)} ${p.phone}</a>` : ""}
      </div>`;
    }

    return {
        all() { heroSocial(); about(); skills(); timeline(); projects(); stack(); resume(); contact(); },
    };
})();