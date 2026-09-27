/* ==========================================================================
   ribbons.js — "story threads"
   Braided, twisting silk ribbons drawn on canvas. They grow with scroll,
   weave under the content column and over the gutters, light up a node
   per chapter, and tie a knot at the contact section.
   Emits on document: story:chapter {index,id} · story:complete · story:reset
   ========================================================================== */
window.App = window.App || {};

App.ribbons = (function () {
    "use strict";

    const TAU = Math.PI * 2;
    const STEP = 4;          // px between spine samples
    const HEAD_AT = 0.62;    // ribbon head rides at 62% of the viewport height

    // Three braided ribbons + two loose hairline threads
    const STRANDS = [
        { rgb: [245, 176, 72], width: 26, amp: 40, freq: 0.0055, phase: 0, twist: 0.009, speed: 0.9, threads: 9, alpha: 0.55 },
        { rgb: [255, 122, 69], width: 18, amp: 40, freq: 0.0055, phase: TAU / 3, twist: 0.012, speed: 0.9, threads: 7, alpha: 0.5 },
        { rgb: [94, 234, 212], width: 14, amp: 40, freq: 0.0055, phase: TAU * 2 / 3, twist: 0.015, speed: 0.9, threads: 6, alpha: 0.45 },
        { rgb: [255, 213, 138], width: 0, amp: 72, freq: 0.0031, phase: 1.2, twist: 0, speed: 0.5, threads: 1, alpha: 0.32, hair: true },
        { rgb: [94, 234, 212], width: 0, amp: 86, freq: 0.0024, phase: 3.9, twist: 0, speed: 0.4, threads: 1, alpha: 0.22, hair: true },
    ];
    const SPARK_COLORS = ["255,220,160", "245,176,72", "255,122,69", "94,234,212"];

    let back, front, bctx, fctx;
    let vw = 0, vh = 0, dpr = 1;
    let mobile = false, reduced = false, frontOK = false, gL = 0, gR = 0;
    let active = [], sc = { amp: 1, width: 1, line: 1 };
    let S = null, chapters = [], heroS = 1;
    let OFF, HW, LAYER;
    let head = 0, target = 0, time = 0, last = 0, lastScroll = 0, speed = 0;
    let emitAcc = 0, knotK = 0, current = -1, completed = false;
    let particles = [];
    let rebuildTimer = 0, staticQueued = false;
    let frameCount = 0, lastFrameTime = 0, isVisible = true;

    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const smooth = (v) => { v = clamp01(v); return v * v * (3 - 2 * v); };
    const smoothstep = (a, b, v) => smooth((v - a) / (b - a));
    const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

    /* ---------------- Layout → spine ---------------- */
    function sectionRects() {
        const sy = window.scrollY;
        return [...document.querySelectorAll("main > section[id]")].map((el) => {
            const r = el.getBoundingClientRect();
            return { el, id: el.id, top: r.top + sy, h: r.height };
        });
    }

    function gutterX(side) {
        if (mobile) return side === "L" ? vw * 0.1 : vw * 0.9;
        const margin = (vw - Math.min(1180, vw - 40)) / 2;
        const x = Math.max(20, Math.min(margin * 0.5, 110));
        return side === "L" ? x : vw - x;
    }

    function buildAnchors(secs) {
        const pts = [];
        if (!secs.length) return pts;
        const hero = secs[0];
        const flip = (s) => (s === "L" ? "R" : "L");

        // Prologue: threads enter from off-screen and sweep behind the name
        pts.push({ x: -140, y: hero.top + hero.h * 0.18 });
        pts.push({ x: vw * 0.28, y: hero.top + hero.h * 0.34 });
        pts.push({ x: vw * (mobile ? 0.75 : 0.8), y: hero.top + hero.h * 0.56, ch: 0 });
        pts.push({ x: gutterX("R"), y: hero.top + hero.h * 0.9 });

        let side = "R";
        const stride = Math.max(560, vh * 0.95);

        for (let i = 1; i < secs.length; i++) {
            const sec = secs[i];

            if (i === secs.length - 1) {
                // Epilogue: every thread converges behind the contact title
                const h2 = sec.el.querySelector("h2");
                let ex = vw * 0.5, ey = sec.top + sec.h * 0.42;
                if (h2) {
                    const r = h2.getBoundingClientRect();
                    ex = r.left + r.width / 2;
                    ey = r.top + window.scrollY + r.height / 2;
                }
                side = flip(side);
                pts.push({ x: gutterX(side), y: sec.top + Math.min(90, sec.h * 0.1), ch: i });
                pts.push({ x: ex, y: Math.max(ey, sec.top + 140), end: true });
                break;
            }

            side = flip(side);
            const y0 = sec.top + Math.min(150, sec.h * 0.15);
            pts.push({ x: gutterX(side), y: y0, ch: i });
            // Tall sections zig-zag so the braid wraps around the content
            for (let y = y0 + stride; y < sec.top + sec.h - stride * 0.45; y += stride) {
                side = flip(side);
                pts.push({ x: gutterX(side), y });
            }
            pts.push({ x: gutterX(side), y: sec.top + sec.h - 40 });
        }
        return pts;
    }

    function cleanAnchors(pts) {
        const out = [];
        for (const p of pts) {
            const prev = out[out.length - 1];
            if (prev && p.y < prev.y + 24) {
                if (p.ch === undefined && !p.end) continue;
                p.y = prev.y + 24;
            }
            out.push(p);
        }
        return out;
    }

    function sampleSpine(pts, secs) {
        // 1. Catmull-Rom through anchors → dense polyline
        const raw = [pts[0].x, pts[0].y];
        const marks = [];
        let len = 0, lx = pts[0].x, ly = pts[0].y;

        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
            if (p1.ch !== undefined) marks.push({ ch: p1.ch, len });
            const n = Math.max(12, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 3));
            for (let k = 1; k <= n; k++) {
                const t = k / n, t2 = t * t, t3 = t2 * t;
                const x = 0.5 * (2 * p1.x + (p2.x - p0.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (3 * p1.x - p0.x - 3 * p2.x + p3.x) * t3);
                const y = 0.5 * (2 * p1.y + (p2.y - p0.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (3 * p1.y - p0.y - 3 * p2.y + p3.y) * t3);
                len += Math.hypot(x - lx, y - ly);
                lx = x; ly = y;
                raw.push(x, y);
            }
        }

        // 2. Resample at constant arc length
        const count = Math.max(2, Math.floor(len / STEP) + 1);
        const X = new Float32Array(count), Y = new Float32Array(count);
        const NX = new Float32Array(count), NY = new Float32Array(count), MY = new Float32Array(count);
        X[0] = raw[0]; Y[0] = raw[1];
        let acc = 0, j = 1;
        for (let i = 2; i < raw.length && j < count; i += 2) {
            const ax = raw[i - 2], ay = raw[i - 1], bx = raw[i], by = raw[i + 1];
            const d = Math.hypot(bx - ax, by - ay);
            while (j < count && j * STEP <= acc + d) {
                const t = d ? (j * STEP - acc) / d : 0;
                X[j] = ax + (bx - ax) * t;
                Y[j] = ay + (by - ay) * t;
                j++;
            }
            acc += d;
        }
        for (; j < count; j++) { X[j] = raw[raw.length - 2]; Y[j] = raw[raw.length - 1]; }

        // 3. Normals + monotonic max-Y (for fast scroll lookups)
        let m = -Infinity;
        for (let i = 0; i < count; i++) {
            const a = Math.max(0, i - 2), b = Math.min(count - 1, i + 2);
            const tx = X[b] - X[a], ty = Y[b] - Y[a];
            const l = Math.hypot(tx, ty) || 1;
            NX[i] = -ty / l; NY[i] = tx / l;
            m = Math.max(m, Y[i]); MY[i] = m;
        }

        S = { n: count, total: (count - 1) * STEP, x: X, y: Y, nx: NX, ny: NY, my: MY };
        OFF = new Float32Array(count);
        HW = new Float32Array(count);
        LAYER = new Uint8Array(count);

        const prev = chapters;
        chapters = marks.map((mk) => {
            const i = Math.min(count - 1, Math.round(mk.len / STEP));
            const old = prev.find((c) => c.index === mk.ch);
            return {
                index: mk.ch,
                id: secs[mk.ch] ? secs[mk.ch].id : "",
                s: i * STEP, x: X[i], y: Y[i],
                num: String(mk.ch).padStart(2, "0"),
                lit: old ? old.lit : false,
                litAt: old ? old.litAt : 0,
            };
        });
        const second = chapters.find((c) => c.index === 1);
        heroS = second ? second.s : S.total * 0.15;
    }

    function searchY(Yv) {
        let lo = 0, hi = S.n - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (S.my[mid] < Yv) lo = mid + 1; else hi = mid;
        }
        return lo;
    }

    function computeTarget(sy) {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
        const s = searchY(sy + vh * HEAD_AT) * STEP;
        // Ease into the finale so the knot is tied exactly at the bottom
        const fin = smoothstep(maxScroll - vh * 0.5, maxScroll - 2, sy);
        return Math.min(S.total, s + (S.total - s) * fin);
    }

    /* ---------------- Strand geometry ---------------- */
    function computeStrand(st, i0, i1) {
        const amp = st.amp * sc.amp, W = st.width * sc.width, total = S.total;
        const heroBoost = mobile ? 0.5 : 1.1;

        for (let i = i0; i <= i1; i++) {
            const s = i * STEP;
            const grow = smooth((head - s) / 280) * smooth(s / 240);
            const fin = 1 - 0.92 * smoothstep(total - 1000, total, s);
            const boost = 1 + heroBoost * (1 - smoothstep(heroS * 0.4, heroS, s));
            const env = grow * fin;
            const ph = s * st.freq + st.phase + time * st.speed;
            const off = Math.sin(ph) * amp * boost * env;
            const x = S.x[i] + S.nx[i] * off;

            OFF[i] = off;
            HW[i] = W ? 0.5 * W * env * Math.cos(s * st.twist + st.phase * 1.7 + time * 0.7) : 0;
            const near = Math.cos(ph) > 0;
            LAYER[i] = !near ? 0 : frontOK && (x < gL || x > gR) ? 2 : 1;
        }
    }

    function glowStrand(st, i0, i1, sy) {
        const p = new Path2D();
        for (let i = i0; i <= i1; i++) {
            const x = S.x[i] + S.nx[i] * OFF[i], y = S.y[i] + S.ny[i] * OFF[i] - sy;
            i === i0 ? p.moveTo(x, y) : p.lineTo(x, y);
        }
        bctx.lineWidth = st.width * sc.width * 0.9 + 6;
        bctx.strokeStyle = `rgba(${st.rgb},0.045)`;
        bctx.stroke(p);
    }

    function strokeStrand(st, i0, i1, sy) {
        const n = st.threads;
        const lw = (st.hair ? 1 : 1.1) * sc.line;
        for (let j = 0; j < n; j++) {
            const u = n === 1 ? 0 : (j / (n - 1)) * 2 - 1;
            const paths = [new Path2D(), new Path2D(), new Path2D()]; // far · near · front
            let prev = -1, px = 0, py = 0;

            for (let i = i0; i <= i1; i++) {
                const o = OFF[i] + u * HW[i];
                const x = S.x[i] + S.nx[i] * o;
                const y = S.y[i] + S.ny[i] * o - sy;
                const L = LAYER[i];
                if (L !== prev) {
                    if (prev === -1) paths[L].moveTo(x, y);
                    else { paths[prev].lineTo(x, y); paths[L].moveTo(px, py); paths[L].lineTo(x, y); }
                    prev = L;
                } else paths[L].lineTo(x, y);
                px = x; py = y;
            }

            // Ribbon edges catch more light than the middle
            const a = st.alpha * (n === 1 ? 1 : 0.4 + 0.6 * u * u);
            const full = `rgba(${st.rgb},${a.toFixed(3)})`;
            bctx.lineWidth = fctx.lineWidth = lw;
            bctx.strokeStyle = `rgba(${st.rgb},${(a * 0.38).toFixed(3)})`;
            bctx.stroke(paths[0]);
            bctx.strokeStyle = full;
            bctx.stroke(paths[1]);
            if (frontOK) { fctx.strokeStyle = full; fctx.stroke(paths[2]); }
        }
    }

    /* ---------------- Decorations ---------------- */
    const ctxFor = (x) => (frontOK && (x < gL || x > gR) ? fctx : bctx);

    function drawHead(sy, hi) {
        const x = S.x[hi], y = S.y[hi] - sy;
        if (y < -100 || y > vh + 100) return;
        const ctx = ctxFor(x);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 70);
        g.addColorStop(0, "rgba(255,220,160,0.55)");
        g.addColorStop(0.25, "rgba(245,176,72,0.2)");
        g.addColorStop(1, "rgba(245,176,72,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, 70, 0, TAU); ctx.fill();
        ctx.fillStyle = "rgba(255,245,230,0.95)";
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
    }

    function drawNodes(sy, now) {
        const showNums = !mobile && vw > 1100;
        for (const c of chapters) {
            const x = c.x, y = c.y - sy;
            if (y < -60 || y > vh + 60) continue;
            const ctx = ctxFor(x);
            if (c.lit) {
                const age = c.litAt ? Math.min(1, (now - c.litAt) / 900) : 1;
                if (age < 1 && !reduced) {
                    ctx.strokeStyle = `rgba(245,176,72,${(1 - age) * 0.6})`;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath(); ctx.arc(x, y, 6 + age * 40, 0, TAU); ctx.stroke();
                }
                const g = ctx.createRadialGradient(x, y, 0, x, y, 20);
                g.addColorStop(0, "rgba(245,176,72,0.45)");
                g.addColorStop(1, "rgba(245,176,72,0)");
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(x, y, 20, 0, TAU); ctx.fill();
                ctx.fillStyle = "rgba(255,214,150,0.95)";
                ctx.beginPath(); ctx.arc(x, y, 3.5, 0, TAU); ctx.fill();
            } else {
                ctx.strokeStyle = "rgba(255,255,255,0.22)";
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(x, y, 4.5, 0, TAU); ctx.stroke();
            }
            if (showNums) {
                ctx.font = '500 10px "JetBrains Mono", ui-monospace, monospace';
                ctx.textAlign = "center";
                ctx.fillStyle = c.lit ? "rgba(245,176,72,0.9)" : "rgba(255,255,255,0.3)";
                ctx.fillText(c.num, x, y - 16);
            }
        }
    }

    function drawKnot(sy) {
        if (knotK < 0.01) return;
        const i = S.n - 1, x = S.x[i], y = S.y[i] - sy;
        if (y < -300 || y > vh + 300) return;
        const a = Math.min(170, vw * (mobile ? 0.32 : 0.16));
        for (let k = 0; k < 3; k++) {
            const rot = time * 0.25 + (k * TAU) / 6;
            const cr = Math.cos(rot), sr = Math.sin(rot);
            bctx.beginPath();
            for (let t = 0, first = true; t <= TAU + 0.001; t += TAU / 140, first = false) {
                const sn = Math.sin(t), cs = Math.cos(t), d = 1 + sn * sn;
                const lx = (a * cs) / d, ly = ((a * sn * cs) / d) * 0.9;
                const px = x + lx * cr - ly * sr, py = y + lx * sr + ly * cr;
                first ? bctx.moveTo(px, py) : bctx.lineTo(px, py);
            }
            bctx.strokeStyle = `rgba(${STRANDS[k].rgb},${(0.3 * knotK).toFixed(3)})`;
            bctx.lineWidth = 1.2;
            bctx.stroke();
        }
        const g = bctx.createRadialGradient(x, y, 0, x, y, a * 0.9);
        g.addColorStop(0, `rgba(245,176,72,${0.16 * knotK})`);
        g.addColorStop(1, "rgba(245,176,72,0)");
        bctx.fillStyle = g;
        bctx.beginPath(); bctx.arc(x, y, a * 0.9, 0, TAU); bctx.fill();
    }

    /* ---------------- Particles ---------------- */
    function spawn(x, y, vx, vy) {
        const maxParticles = mobile ? 80 : 200;
        if (particles.length > maxParticles) return;
        particles.push({
            x, y, vx, vy, life: 1,
            decay: 0.6 + Math.random() * 0.9,
            r: 0.6 + Math.random() * 1.6,
            c: SPARK_COLORS[(Math.random() * SPARK_COLORS.length) | 0],
        });
    }

    function burst(x, y, n, force) {
        for (let k = 0; k < n; k++) {
            const ang = Math.random() * TAU, v = force * (0.3 + Math.random() * 0.7);
            spawn(x, y, Math.cos(ang) * v, Math.sin(ang) * v);
        }
    }

    function updateParticles(dt, moved) {
        if (!completed && S) {
            emitAcc += moved * 0.08 + dt * 1.2;
            const i = Math.min(S.n - 1, Math.round(head / STEP));
            const tx = S.ny[i], ty = -S.nx[i]; // tangent
            while (emitAcc >= 1) {
                emitAcc -= 1;
                spawn(S.x[i], S.y[i], -tx * 24 + (Math.random() - 0.5) * 40, -ty * 24 + (Math.random() - 0.5) * 40);
            }
        }
        const drag = Math.exp(-dt * 2.2);
        for (let k = particles.length - 1; k >= 0; k--) {
            const p = particles[k];
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.vx *= drag; p.vy *= drag;
            p.life -= dt * p.decay;
            if (p.life <= 0) particles.splice(k, 1);
        }
    }

    function drawParticles(sy) {
        for (const p of particles) {
            const y = p.y - sy;
            if (y < -20 || y > vh + 20) continue;
            bctx.fillStyle = `rgba(${p.c},${(p.life * 0.85).toFixed(3)})`;
            bctx.beginPath(); bctx.arc(p.x, y, p.r, 0, TAU); bctx.fill();
        }
    }

    /* ---------------- Story state ---------------- */
    function checkChapters(now) {
        let idx = 0;
        for (const c of chapters) {
            const lit = head >= c.s - 1;
            if (lit && !c.lit) {
                c.lit = true; c.litAt = now;
                if (!reduced) burst(c.x, c.y, 16, 90);
            } else if (!lit && c.lit) c.lit = false;
            if (lit) idx = Math.max(idx, c.index);
        }
        if (idx !== current) {
            current = idx;
            const c = chapters.find((ch) => ch.index === idx);
            emit("story:chapter", { index: idx, id: c ? c.id : "" });
        }
        const done = head >= S.total - 2;
        if (done && !completed) {
            completed = true;
            if (!reduced) burst(S.x[S.n - 1], S.y[S.n - 1], 60, 160);
            emit("story:complete");
        } else if (!done && completed && head < S.total - 60) {
            completed = false;
            emit("story:reset");
        }
    }

    /* ---------------- Render ---------------- */
    function draw(sy, now) {
        for (const ctx of [bctx, fctx]) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.globalCompositeOperation = "source-over";
            ctx.clearRect(0, 0, vw, vh);
            ctx.globalCompositeOperation = "lighter";
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
        }
        if (!S || S.n < 2) return;

        const hi = Math.min(S.n - 1, Math.floor(head / STEP));
        const i0 = Math.max(0, searchY(sy - 160) - 30);
        const i1 = Math.min(hi, searchY(sy + vh + 160) + 30);

        if (i1 > i0 + 1) {
            for (const st of active) {
                computeStrand(st, i0, i1);
                if (st.width) glowStrand(st, i0, i1, sy);
                strokeStrand(st, i0, i1, sy);
            }
        }
        drawNodes(sy, now);
        drawParticles(sy);
        if (!completed && head > 2) drawHead(sy, hi);
        drawKnot(sy);
    }

    function frame(now) {
        requestAnimationFrame(frame);
        if (!S || !isVisible) return;

        // Skip frames on low-end devices or when tab is backgrounded
        frameCount++;
        if (frameCount % 2 === 0 && mobile) return;

        const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
        last = now;

        const sy = window.scrollY;
        const v = Math.abs(sy - lastScroll) / dt;
        lastScroll = sy;
        speed += (v - speed) * Math.min(1, dt * 3);
        time += dt * (0.55 + Math.min(2.2, speed * 0.002)); // scrolling makes the braid flow faster

        target = computeTarget(sy);
        const prevHead = head;
        head += (target - head) * (1 - Math.exp(-dt * 4.5));
        if (Math.abs(target - head) < 0.3) head = target;

        knotK += ((completed ? 1 : 0) - knotK) * (1 - Math.exp(-dt * 2.5));

        updateParticles(dt, Math.abs(head - prevHead));
        checkChapters(now);
        draw(sy, now);
    }

    function renderStatic() {
        staticQueued = false;
        if (!S) return;
        const sy = window.scrollY;
        head = target = computeTarget(sy);
        checkChapters(0);
        knotK = completed ? 1 : 0;
        draw(sy, 0);
    }
    function queueStatic() {
        if (staticQueued) return;
        staticQueued = true;
        requestAnimationFrame(renderStatic);
    }

    /* ---------------- Setup ---------------- */
    function sizeCanvases() {
        const w = Math.round(vw * dpr), h = Math.round(vh * dpr);
        for (const c of [back, front]) {
            if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
            c.style.width = vw + "px";
            c.style.height = vh + "px";
        }
    }

    function rebuild() {
        if (!back) return;
        vw = document.documentElement.clientWidth || window.innerWidth;
        vh = window.innerHeight;
        mobile = vw < 760;
        dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
        sizeCanvases();

        const margin = (vw - Math.min(1180, vw - 40)) / 2;
        gL = margin + 4;
        gR = vw - margin - 4;
        frontOK = !mobile && margin > 28;

        if (mobile) sc = { amp: 0.5, width: 0.62, line: 0.85 };
        else {
            const k = Math.max(0.75, Math.min(1.35, margin / 110));
            sc = { amp: k, width: Math.max(0.85, k), line: 1 };
        }
        active = STRANDS
            .filter((s, i) => !mobile || i < 4)
            .map((s) => (mobile ? { ...s, threads: s.threads > 1 ? Math.max(3, Math.round(s.threads * 0.6)) : 1 } : s));

        const secs = sectionRects();
        const pts = cleanAnchors(buildAnchors(secs));
        if (pts.length < 2) { S = null; return; }
        sampleSpine(pts, secs);
        head = Math.min(head, S.total);
        if (reduced) queueStatic();
    }

    function scheduleRebuild() {
        clearTimeout(rebuildTimer);
        rebuildTimer = setTimeout(rebuild, 150);
    }

    function init() {
        back = document.getElementById("ribbonsBack");
        front = document.getElementById("ribbonsFront");
        if (!back || !front || !back.getContext) return;
        bctx = back.getContext("2d");
        fctx = front.getContext("2d");
        reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

        // Visibility API to pause animations when tab is hidden
        document.addEventListener("visibilitychange", () => {
            isVisible = document.visibilityState === "visible";
            if (isVisible && !reduced) {
                last = performance.now();
                lastScroll = window.scrollY;
            }
        });

        rebuild();
        requestAnimationFrame(rebuild);
        setTimeout(rebuild, 500);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleRebuild);
        addEventListener("load", scheduleRebuild);
        addEventListener("resize", scheduleRebuild);
        if (window.ResizeObserver) {
            new ResizeObserver(scheduleRebuild).observe(document.getElementById("main") || document.body);
        }

        if (reduced) {
            addEventListener("scroll", queueStatic, { passive: true });
            return;
        }

        last = performance.now();
        lastScroll = window.scrollY;
        requestAnimationFrame(frame);
    }

    return { init, rebuild: scheduleRebuild };
})();
