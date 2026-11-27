/* WitnessClip page: the live recording card, the chart recorder, "try to edit one" and the typing terminal. */
(() => {
  const { L, still, $, mss, seeded, level, hex, ring, addPath, tabs, panelTabs } = window.HR;
  const rand = seeded(20261118);
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
      term: [["c", "# get the verifier"], ["p", "git clone https://github.com/HexRelic/WitnessClip"], ["p", "cd WitnessClip"], ["", ""], ["c", "# check a recording"], ["p", './gradlew :core:run --args="recording.flac"']],
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
      term: [["c", "# scarica il verificatore"], ["p", "git clone https://github.com/HexRelic/WitnessClip"], ["p", "cd WitnessClip"], ["", ""], ["c", "# verifica una registrazione"], ["p", './gradlew :core:run --args="registrazione.flac"']],
    },
  }[L];


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

  tabs($("shot-tabs"), (id) => document.querySelectorAll(".viewer figure").forEach((f) => f.classList.toggle("active", f.id === id)));
  panelTabs($("way-tabs"));

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

})();
