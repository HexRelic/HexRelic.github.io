(() => {
  const L = document.documentElement.lang === "it" ? "it" : "en";
  const T = {
    en: {
      sealed: "sealed", signed: "chain signed in secure hardware", certified: "certified time",
      recorded: "recorded", stopped: "stopped and sealed",
      markTs: "certified time", markSig: "signed",
      ok: "All 30 seconds match their seals. The recording is intact.",
      fails: (t) => `Verification fails at ${t}. That second no longer matches its seal.`,
      more: (n) => n === 1 ? " One more second doesn't match either." : ` ${n} more seconds don't match either.`,
      stamp: (t) => "Fails at " + t,
      secLabel: (t) => `Second ${t}: change it`,
      copy: "Copy", copied: "Copied", selected: "Selected",
      toDark: "Switch to dark theme", toLight: "Switch to light theme",
      term: [["c", "# get the verifier"], ["p", "git clone https://github.com/HexRelic/WitnessClip"], ["p", "cd WitnessClip"], ["", ""], ["c", "# check a recording"], ["p", './gradlew :core:run --args="recording.flac"']],
      micro: "witnessclip by hexrelic, sealed every second ",
    },
    it: {
      sealed: "sigillato", signed: "catena firmata nell'hardware sicuro", certified: "ora certificata",
      recorded: "registrati", stopped: "fermata e sigillata",
      markTs: "ora certificata", markSig: "firmata",
      ok: "Tutti i 30 secondi corrispondono ai loro sigilli. La registrazione è integra.",
      fails: (t) => `La verifica fallisce a ${t}. Quel secondo non corrisponde più al suo sigillo.`,
      more: (n) => n === 1 ? " Anche un altro secondo non corrisponde." : ` Anche altri ${n} secondi non corrispondono.`,
      stamp: (t) => "Alterata a " + t,
      secLabel: (t) => `Secondo ${t}: modificalo`,
      copy: "Copia", copied: "Copiata", selected: "Selezionata",
      toDark: "Passa al tema scuro", toLight: "Passa al tema chiaro",
      term: [["c", "# scarica il verificatore"], ["p", "git clone https://github.com/HexRelic/WitnessClip"], ["p", "cd WitnessClip"], ["", ""], ["c", "# verifica una registrazione"], ["p", './gradlew :core:run --args="registrazione.flac"']],
      micro: "witnessclip di hexrelic, sigillata ogni secondo ",
    },
  }[L];

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  const mss = (t) => Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
  // fixed seed, so the drawings are the same on every visit
  const rand = ((a) => () => { a |= 0; a = a + 0x6d2b79f5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(20261118);
  const level = (i, s) => .25 + .75 * Math.abs(Math.sin(i * .71 + s) * Math.cos(i * .23 + s * 2));
  const hex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");

  /* ===== theme: follows the system until the visitor picks one ===== */
  const root = document.documentElement, themeBtn = $("theme");
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const labelTheme = () => { const l = isDark() ? T.toLight : T.toDark; themeBtn.setAttribute("aria-label", l); themeBtn.title = l; };
  themeBtn.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
    labelTheme();
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", labelTheme);
  labelTheme();

  /* ===== language: remember an explicit choice ===== */
  document.querySelectorAll("[data-lang]").forEach((a) => a.addEventListener("click", () => {
    try { localStorage.setItem("lang", a.dataset.lang); } catch {}
  }));

  /* one ring of a guilloche rosette, in polar form */
  const ring = (R, A, k, ph, A2, k2, ph2, N = 240) => {
    let d = "";
    for (let j = 0; j < N; j++) {
      const t = (j / N) * Math.PI * 2;
      const r = R + A * Math.sin(k * t + ph) + A2 * Math.sin(k2 * t + ph2);
      d += (j ? "L" : "M") + (r * Math.cos(t)).toFixed(1) + " " + (r * Math.sin(t)).toFixed(1);
    }
    return d + "Z";
  };
  const addPath = (g, d, cls) => {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d); p.setAttribute("pathLength", "1");
    if (cls) p.setAttribute("class", cls);
    g.appendChild(p); return p;
  };
  /* a seal made of n seconds: each ring's swing comes from the audio level, its phase from the hash */
  const rosette = (g, n, rIn, rOut, k, seed) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const R = rIn + (rOut - rIn) * (i / (n - 1));
      const A = 4 + 8 * level(i, seed), ph = i * .17 + rand() * .4;
      const base = ring(R, A, k, ph, 2.2, 6, i * .05);
      const broken = ring(R + 3, A * 1.9, k, ph + 2.6, 5, 9, i * .9);
      out.push({ el: addPath(g, base, (i + 1) % 10 === 0 ? "sig" : ""), base, broken });
    }
    return out;
  };

  /* nav background once the page scrolls */
  const bar = $("top-bar");
  const onScroll = () => bar.classList.toggle("scrolled", scrollY > 20);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ===== hero: the app, with a live recording card ===== */
  {
    const wm = $("watermark");
    for (let i = 0; i < 26; i++) addPath(wm, ring(150 + i * 5.4, 7, 30, i * .3, 0, 1, 0));
    const wave = $("live-wave");
    for (let i = 0; i < 30; i++) {
      const s = document.createElement("span");
      s.style.setProperty("--s", (.3 + .7 * level(i, .6)).toFixed(2));
      s.style.setProperty("--d", (.7 + (i % 7) * .09).toFixed(2) + "s");
      s.style.setProperty("--o", (-i * .13).toFixed(2) + "s");
      wave.appendChild(s);
    }
    const log = $("live-log"), clock = $("live-clock");
    const row = (t, text, cls, ok) => {
      const li = document.createElement("li");
      if (cls) li.className = cls;
      li.innerHTML = `<span class="t">${mss(t)}</span><span>${text}</span>` + (ok ? `<span class="ok">${ok}</span>` : "");
      log.appendChild(li);
      while (log.children.length > 3) log.firstChild.remove();
    };
    let t = 0;
    const step = () => {
      if (t === 0) { log.innerHTML = ""; row(0, T.certified, "sig", "✓"); }
      else if (t % 10 === 0) row(t, T.signed, "sig");
      else row(t, `<span class="alg">sha-256 </span>${hex(3)}…${hex(2)}`, "", T.sealed);
      clock.textContent = mss(t);
      t = t >= 59 ? 0 : t + 1;
    };
    for (let i = 0; i < 4; i++) step();
    if (!still) {
      let timer = null;
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !timer) timer = setInterval(step, 1000);
        if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
      }).observe($("hero-visual"));
      // a little depth when the pointer moves: the card floats above the phone
      if (matchMedia("(pointer: fine)").matches) {
        const hero = document.querySelector(".hero"), phone = document.querySelector(".phone"), card = document.querySelector(".live"), chip = document.querySelector(".chip");
        hero.addEventListener("pointermove", (e) => {
          const r = hero.getBoundingClientRect();
          const dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
          phone.style.transform = `translate(${dx * 8}px, ${dy * 8}px) rotate(${dx * 1.2}deg)`;
          card.style.transform = `translate(${dx * 22}px, ${dy * 18}px)`;
          chip.style.transform = `translate(${dx * 16}px, ${dy * 14}px)`;
        });
        hero.addEventListener("pointerleave", () => { phone.style.transform = card.style.transform = chip.style.transform = ""; });
      }
    }
  }

  /* ===== how it works: chart recorder ===== */
  {
    let d = "M0 70";
    for (let x = 2; x <= 1200; x += 2.5) {
      const s = Math.floor(x / 20);
      const amp = 8 + 52 * level(s, 2.2) * (.55 + .45 * Math.sin(x * .09));
      d += `L${x.toFixed(1)} ${(70 + (x % 5 < 2.5 ? -1 : 1) * amp * (.4 + .6 * rand())).toFixed(1)}`;
    }
    $("trace-path").setAttribute("d", d);
    const paper = $("paper"), rect = $("trace-rect"), pen = $("pen"), state = $("chart-state");
    const marks = [];
    const mark = (s, text, cls) => {
      const m = document.createElement("div");
      m.className = "mark " + cls; m.style.left = (s / 60 * 100) + "%";
      m.innerHTML = `<i></i><span>${text}</span>`;
      paper.appendChild(m); marks.push([s, m]);
    };
    mark(0, T.markTs, "ts first");
    for (let s = 10; s < 60; s += 10) mark(s, T.markSig, "sig");
    mark(60, T.markTs, "ts last");
    const paint = (p) => { // p: seconds recorded, 0..60
      rect.setAttribute("width", (p / 60) * 1200);
      pen.style.left = `calc(${(p / 60) * 100}% - ${p >= 60 ? 1.5 : 0}px)`;
      marks.forEach(([s, m]) => m.classList.toggle("on", p > 0 && p >= s));
      state.innerHTML = p >= 60 ? `<b>1:00</b> ${T.stopped}` : `<b>${mss(Math.floor(p))}</b> ${T.recorded}`;
    };
    if (still) paint(60);
    else {
      const DUR = 12000, HOLD = 3500;
      let raf = null, t0 = 0;
      const frame = (now) => {
        if (!t0) t0 = now;
        const e = now - t0;
        paint(Math.min(60, (e / DUR) * 60));
        if (e > DUR + HOLD) t0 = now;
        raf = requestAnimationFrame(frame);
      };
      paint(0);
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !raf) { t0 = 0; raf = requestAnimationFrame(frame); }
        if (!e.isIntersecting && raf) { cancelAnimationFrame(raf); raf = null; }
      }, { threshold: .35 }).observe($("chart"));
    }
  }

  /* ===== try it: edit a second, watch its ring break ===== */
  {
    const rings = rosette($("mini-rings"), 30, 58, 158, 18, 4.1);
    rings.forEach((r) => r.el.classList.add("on"));
    const waveEl = $("wave"), verdict = $("verdict"), msg = $("v-msg"), icon = $("v-icon"), reset = $("v-reset"), stamp = $("stamp"), n = $("mini-n");
    const secs = [];
    const okIcon = icon.innerHTML;
    const badIcon = '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/><path d="M12 8v5M12 16.2v.1"/>';
    const judge = () => {
      const bad = secs.map((b, i) => b.classList.contains("cut") ? i : -1).filter((i) => i >= 0);
      const ok = bad.length === 0;
      verdict.classList.toggle("bad", !ok);
      reset.hidden = ok;
      icon.innerHTML = ok ? okIcon : badIcon;
      n.textContent = 30 - bad.length;
      msg.textContent = ok ? T.ok : T.fails(mss(bad[0])) + (bad.length > 1 ? T.more(bad.length - 1) : "");
      stamp.classList.remove("show");
      if (!ok) { stamp.textContent = T.stamp(mss(bad[0])); void stamp.offsetWidth; stamp.classList.add("show"); }
    };
    const setCut = (i, on) => {
      secs[i].classList.toggle("cut", on);
      secs[i].setAttribute("aria-pressed", on);
      const r = rings[i];
      r.el.classList.toggle("cut", on);
      if ("d" in r.el.style) r.el.style.d = `path("${on ? r.broken : r.base}")`;
      else r.el.setAttribute("d", on ? r.broken : r.base);
    };
    for (let i = 0; i < 30; i++) {
      const b = document.createElement("button");
      const h = 22 + 74 * level(i, 4.1);
      b.type = "button";
      b.setAttribute("aria-label", T.secLabel(mss(i)));
      b.setAttribute("aria-pressed", "false");
      b.style.setProperty("--h", h + "%");
      b.style.setProperty("--h2", Math.max(12, 100 - h) + "%");
      b.innerHTML = "<i></i>";
      b.addEventListener("click", () => { setCut(i, !b.classList.contains("cut")); judge(); });
      waveEl.appendChild(b); secs.push(b);
    }
    reset.addEventListener("click", () => { secs.forEach((_, i) => setCut(i, false)); judge(); });
  }

  /* ===== tabs (screens and install), with a sliding marker ===== */
  const tabs = (list, onShow) => {
    const btns = [...list.querySelectorAll('[role="tab"]')], ind = list.querySelector(".ind");
    const place = (b) => { ind.style.top = b.offsetTop + "px"; ind.style.height = b.offsetHeight + "px"; };
    const select = (b, focus) => {
      btns.forEach((x) => { const on = x === b; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; });
      place(b); onShow(b.getAttribute("aria-controls")); if (focus) b.focus();
    };
    btns.forEach((b, i) => {
      b.addEventListener("click", () => select(b));
      b.addEventListener("keydown", (e) => {
        const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (k) { e.preventDefault(); select(btns[(i + k + btns.length) % btns.length], true); }
      });
    });
    const sync = () => place(btns.find((b) => b.getAttribute("aria-selected") === "true"));
    addEventListener("resize", sync); document.fonts.ready.then(sync); sync();
  };
  tabs($("shot-tabs"), (id) => document.querySelectorAll(".viewer figure").forEach((f) => f.classList.toggle("active", f.id === id)));
  tabs($("way-tabs"), (id) => document.querySelectorAll(".panel").forEach((p) => {
    const on = p.id === id;
    if (on && p.hidden) { p.hidden = false; p.classList.remove("enter"); void p.offsetWidth; p.classList.add("enter"); }
    if (!on) p.hidden = true;
  }));

  /* ===== fingerprint copy ===== */
  const fpBtn = $("fp-copy");
  fpBtn.textContent = T.copy;
  fpBtn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("fp").textContent.trim()); fpBtn.textContent = T.copied; fpBtn.classList.add("done"); }
    catch { getSelection().selectAllChildren($("fp")); fpBtn.textContent = T.selected; }
    setTimeout(() => { fpBtn.textContent = T.copy; fpBtn.classList.remove("done"); }, 2200);
  });

  /* ===== terminal types itself when it scrolls into view ===== */
  if (!still) {
    const term = $("term"), lines = T.term;
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const render = (li, ci) => {
      let h = "";
      lines.forEach(([k, s], i) => {
        if (i > li) return;
        const txt = esc(i < li ? s : s.slice(0, ci));
        h += k === "c" ? `<span class="c">${txt}</span>` : k === "p" ? `<span class="p">$ </span>${txt}` : "";
        h += i < li ? "\n" : "";
      });
      term.innerHTML = h + '<span class="cursor"></span>';
    };
    render(0, 0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      let li = 0, ci = 0;
      const type = () => {
        if (li >= lines.length) { term.innerHTML = term.innerHTML.replace('<span class="cursor"></span>', '\n<span class="p">$ </span><span class="cursor"></span>'); return; }
        const s = lines[li][1];
        if (ci <= s.length) { render(li, ci); ci++; setTimeout(type, lines[li][0] === "c" ? 18 : 34); }
        else { li++; ci = 0; render(li - 1, s.length); setTimeout(type, 380); }
      };
      setTimeout(type, 300);
    }, { threshold: .5 });
    io.observe(term);
  }

  /* ===== outro: a seal ring; microprint in the footer ===== */
  const og = $("outro-rings");
  for (let i = 0; i < 14; i++) addPath(og, ring(72 + i * 2.4, 4, 20, i * .32, 1.2, 5, i * .2));
  $("micro").textContent = T.micro.repeat(60);
})();
