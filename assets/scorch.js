/* Scorch page: the job card in the hero, and "watch a shred". */
(() => {
  const { L, still, $, ring, addPath, tabs, panelTabs } = window.HR;
  const T = {
    en: {
      of: (i, n) => `${i} of ${n}`,
      written: (p) => `${p}, fsync`, readBack: "read back", match: "match",
      renamed: "renamed 3×, truncated", unlinked: "unlinked", done: (n) => `done, ${n} files shredded`,
      file: "letter-to-sam.txt",
      text: "Dear Sam,\nThe spare key is under the blue pot by the back door. The alarm code is 4471.\nPlease burn this note.\n",
      meta: (n) => `${n} bytes, modified 27 Nov 2026, 16:46`,
      meta0: "0 bytes, modified 1 Jan 1980, 00:00",
      label: { "00": "0x00", FF: "0xFF", rnd: "random" },
      words: { "00": "zeros (0x00)", FF: "ones (0xFF)", rnd: "random data" },
      ready: "Ready. Nothing is written until you press Shred.",
      pass: (i, n, w) => `Pass ${i} of ${n}: writing ${w} over every byte, then fsync.`,
      verify: (i) => `Pass ${i} read back: its SHA-256 matches what was written.`,
      rename: (k) => `Renamed to a random name, ${k} of 3.`,
      trunc: "Truncated to 0 bytes and dated 1 January 1980.",
      unlink: "Unlinked. Its contents, name, size and date were replaced before it was removed. What the flash chip keeps underneath is explained below.",
    },
    it: {
      of: (i, n) => `${i} di ${n}`,
      written: (p) => `${p}, fsync`, readBack: "riletto", match: "coincide",
      renamed: "rinominato 3×, troncato", unlinked: "eliminato", done: (n) => `fatto, ${n} file distrutti`,
      file: "lettera-per-sam.txt",
      text: "Caro Sam,\nla chiave di riserva è sotto il vaso blu vicino alla porta sul retro. Il codice dell'allarme è 4471.\nBrucia questo biglietto.\n",
      meta: (n) => `${n} byte, modificato il 27 nov 2026, 16:46`,
      meta0: "0 byte, modificato il 1 gen 1980, 00:00",
      label: { "00": "0x00", FF: "0xFF", rnd: "casuale" },
      words: { "00": "zeri (0x00)", FF: "uni (0xFF)", rnd: "dati casuali" },
      ready: "Pronto. Non viene scritto nulla finché non premi Distruggi.",
      pass: (i, n, w) => `Passata ${i} di ${n}: scrive ${w} su ogni byte, poi fsync.`,
      verify: (i) => `Passata ${i} riletta: il suo SHA-256 coincide con quanto scritto.`,
      rename: (k) => `Rinominato con un nome casuale, ${k} di 3.`,
      trunc: "Troncato a 0 byte e datato 1 gennaio 1980.",
      unlink: "Eliminato. Contenuto, nome, dimensione e data sono stati sostituiti prima di rimuoverlo. Cosa resta sul chip flash è spiegato qui sotto.",
    },
  }[L];

  const SCHEDULES = { zero: ["00"], random: ["rnd"], rrz: ["rnd", "rnd", "00"], dod: ["00", "FF", "rnd"], schneier: ["FF", "00", "rnd", "rnd", "rnd", "rnd", "rnd"] };
  const randomName = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
  const wait = (ms) => new Promise((r) => setTimeout(r, still ? 0 : ms));

  /* ===== the headline's fire: a few sparks drift up once it has caught ===== */
  if (!still) {
    const fire = $("fire");
    for (let i = 0; i < 9; i++) {
      const s = document.createElement("i");
      s.className = "spark"; s.setAttribute("aria-hidden", "true");
      s.style.setProperty("--x", (8 + Math.random() * 84).toFixed(1) + "%");
      s.style.setProperty("--s", (2 + Math.random() * 3).toFixed(1) + "px");
      s.style.setProperty("--d", (1.6 + Math.random() * 1.8).toFixed(2) + "s");
      s.style.setProperty("--o", (1.6 + Math.random() * 3.5).toFixed(2) + "s");
      s.style.setProperty("--dx", ((Math.random() - .5) * 24).toFixed(1) + "px");
      fire.appendChild(s);
    }
  }

  /* ===== hero: a job working through the three files selected in the screenshot ===== */
  {
    const wm = $("watermark");
    for (let i = 0; i < 26; i++) addPath(wm, ring(150 + i * 5.4, 6, 26, i * .34, 1.4, 5, i * .12));
    const files = ["bank-statement-2025-03.pdf", "id-card-scan.jpg", "passwords-old.txt"];
    const passes = SCHEDULES.rrz;
    const log = $("job-log"), fileEl = $("job-file"), count = $("job-count"), bars = $("job-passes");
    bars.innerHTML = passes.map(() => "<span><i></i></span>").join("");
    const fills = [...bars.querySelectorAll("i")];
    const row = (t, text, ok, cls) => {
      const li = document.createElement("li");
      if (cls) li.className = cls;
      li.innerHTML = `<span class="t">${t}</span><span>${text}</span>` + (ok ? `<span class="ok">${ok}</span>` : "");
      log.appendChild(li);
      while (log.children.length > 3) log.firstChild.remove();
    };
    // the whole job as a list of frames, one per tick
    const frames = [];
    files.forEach((f, fi) => {
      frames.push(() => { fileEl.textContent = f; count.textContent = T.of(fi + 1, files.length); fills.forEach((x) => x.style.setProperty("--p", "0%")); });
      passes.forEach((p, pi) => {
        for (let s = 1; s <= 4; s++) frames.push(() => fills[pi].style.setProperty("--p", s * 25 + "%"));
        frames.push(() => row("p" + (pi + 1), T.written(T.label[p]), "✓"));
        frames.push(() => row("p" + (pi + 1), `<span class="alg">sha-256 </span>${T.readBack}`, T.match));
      });
      frames.push(() => row("··", T.renamed, "✓"));
      frames.push(() => row("··", T.unlinked, "✓", "end"));
    });
    frames.push(() => row("··", T.done(files.length), "", "end"), () => {}, () => {});
    let k = 0;
    const step = () => { frames[k](); k = (k + 1) % frames.length; };
    if (still) { while (k < frames.length - 3) step(); }
    else {
      for (let i = 0; i < 6; i++) step();
      let timer = null;
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !timer) timer = setInterval(step, 420);
        if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
      }).observe($("hero-visual"));
      if (matchMedia("(pointer: fine)").matches) {
        const hero = document.querySelector(".hero"), phone = document.querySelector(".phone"), card = document.querySelector(".job"), chip = document.querySelector(".chip");
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

  /* ===== watch a shred: a made-up file, and what Scorch does to it ===== */
  {
    const bench = $("file"), nameEl = $("file-name"), metaEl = $("file-meta"), dump = $("hexdump"), status = $("shred-status");
    const go = $("shred-go"), again = $("shred-again"), passList = $("passes"), steps = [...$("steps").children];
    const radios = [...document.querySelectorAll('input[name="schedule"]')];
    const original = new TextEncoder().encode(T.text);
    let bytes = original.slice(), running = false;
    const narrow = matchMedia("(max-width: 600px)");
    const per = () => (narrow.matches ? 8 : 16);
    const h2 = (b) => b.toString(16).padStart(2, "0");
    const ch = (b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".");
    let rows = [];

    const render = () => {
      const n = per();
      dump.innerHTML = "";
      rows = [];
      for (let o = 0; o < bytes.length; o += n) {
        const r = document.createElement("div");
        const slice = [...bytes.slice(o, o + n)];
        r.innerHTML = `<span class="off">${h2(o >> 8)}${h2(o & 255)}</span><span class="hx">${slice.map((b) => `<b>${h2(b)}</b>`).join(" ")}</span><span class="as"></span>`;
        r.querySelector(".as").textContent = slice.map(ch).join("");
        if (n === 8) r.querySelector(".off").textContent = h2(o);
        dump.appendChild(r);
        rows.push({ el: r, start: o, cells: [...r.querySelectorAll("b")], as: r.querySelector(".as") });
      }
    };
    narrow.addEventListener("change", render);

    const schedule = () => SCHEDULES[radios.find((r) => r.checked).value];
    const showPasses = () => {
      passList.innerHTML = schedule().map((p) => `<li><span>${T.label[p]}</span><i></i></li>`).join("");
    };
    const setStep = (i, state) => { steps[i].classList.remove("now", "done"); if (state) steps[i].classList.add(state); };
    const reset = () => {
      bytes = original.slice();
      bench.classList.remove("truncated", "gone");
      nameEl.textContent = T.file; metaEl.textContent = T.meta(original.length);
      steps.forEach((_, i) => setStep(i));
      status.textContent = T.ready;
      render(); showPasses();
      go.hidden = false; go.disabled = false; again.hidden = true;
      radios.forEach((r) => (r.disabled = false));
    };
    radios.forEach((r) => r.addEventListener("change", () => { if (!running) showPasses(); }));

    const writePass = async (p, bar) => {
      for (const r of rows) {
        const fill = p === "rnd" ? crypto.getRandomValues(new Uint8Array(r.cells.length)) : new Uint8Array(r.cells.length).fill(p === "FF" ? 255 : 0);
        fill.forEach((b, j) => {
          bytes[r.start + j] = b;
          r.cells[j].textContent = h2(b);
          if (!still) r.cells[j].classList.add("w");
        });
        r.as.textContent = [...fill].map(ch).join("");
        bar.style.setProperty("--p", ((r.start + r.cells.length) / bytes.length) * 100 + "%");
        if (!still) requestAnimationFrame(() => requestAnimationFrame(() => r.cells.forEach((c) => c.classList.remove("w"))));
        await wait(per() === 8 ? 45 : 75);
      }
    };

    go.addEventListener("click", async () => {
      if (running) return;
      running = true; go.disabled = true;
      radios.forEach((r) => (r.disabled = true));
      const passes = schedule(), bars = [...passList.querySelectorAll("li")];
      setStep(0, "now");
      for (let i = 0; i < passes.length; i++) {
        status.textContent = T.pass(i + 1, passes.length, T.words[passes[i]]);
        await writePass(passes[i], bars[i].querySelector("i"));
        bars[i].classList.add("done");
        setStep(1, "now");
        status.textContent = T.verify(i + 1);
        await wait(650);
        setStep(1);
      }
      setStep(0, "done"); setStep(1, "done");
      setStep(2, "now");
      for (let k = 1; k <= 3; k++) {
        nameEl.textContent = randomName();
        nameEl.classList.remove("flip"); void nameEl.offsetWidth; nameEl.classList.add("flip");
        status.textContent = T.rename(k);
        await wait(600);
      }
      setStep(2, "done");
      setStep(3, "now");
      bench.classList.add("truncated");
      metaEl.textContent = T.meta0;
      status.textContent = T.trunc;
      await wait(1100);
      setStep(3, "done");
      setStep(4, "now");
      await wait(300);
      bench.classList.add("gone");
      setStep(4, "done");
      status.textContent = T.unlink;
      go.hidden = true; again.hidden = false;
      running = false;
      again.focus({ preventScroll: true });
    });
    again.addEventListener("click", () => { reset(); go.focus({ preventScroll: true }); });
    reset();
  }

  /* ===== the flash chip: other files, the old contents left behind, and where the overwrite went ===== */
  {
    const map = "oo.ooo.sssss..oooo..o.nnnnn.oo...oo..o..ooo...o.";
    $("cells").innerHTML = [...map].map((c) => `<i class="${c === "." ? "" : c}"></i>`).join("");
  }

  /* ===== screens and ways to install ===== */
  tabs($("shot-tabs"), (id) => document.querySelectorAll(".viewer figure").forEach((f) => f.classList.toggle("active", f.id === id)));
  panelTabs($("way-tabs"));
})();
