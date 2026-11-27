/* HexRelic site: what every page shares. Page scripts find the helpers on window.HR. */
(() => {
  const L = document.documentElement.lang === "it" ? "it" : "en";
  const T = {
    en: { copy: "Copy", copied: "Copied", selected: "Selected", toDark: "Switch to dark theme", toLight: "Switch to light theme" },
    it: { copy: "Copia", copied: "Copiato", selected: "Selezionato", toDark: "Passa al tema scuro", toLight: "Passa al tema chiaro" },
  }[L];

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  const mss = (t) => Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
  // seeded generator, so the drawings are the same on every visit
  const seeded = (a) => () => { a |= 0; a = a + 0x6d2b79f5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
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

  /* nav background once the page scrolls */
  const bar = $("top-bar");
  const onScroll = () => bar.classList.toggle("scrolled", scrollY > 20);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

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

  /* ===== vertical tabs with a sliding marker (screens, ways to install) ===== */
  const tabs = (list, onShow) => {
    if (!list) return;
    const btns = [...list.querySelectorAll('[role="tab"]')], ind = list.querySelector(".ind");
    const place = (b) => { if (ind) { ind.style.top = b.offsetTop + "px"; ind.style.height = b.offsetHeight + "px"; } };
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
  /* tabs that swap whole panels: the hidden ones keep their space so nothing below jumps */
  const panelTabs = (list) => tabs(list, (id) => {
    const p = $(id);
    p.parentElement.querySelectorAll(":scope > .panel").forEach((x) => {
      const on = x === p;
      if (on && x.hidden) { x.hidden = false; x.classList.remove("enter"); void x.offsetWidth; x.classList.add("enter"); }
      if (!on) x.hidden = true;
    });
  });

  /* ===== copy buttons: <button data-copy="id-of-the-text"> ===== */
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    const src = $(btn.dataset.copy);
    btn.textContent = T.copy;
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(src.textContent.replace(/\s+/g, "")); btn.textContent = T.copied; btn.classList.add("done"); }
      catch { getSelection().selectAllChildren(src); btn.textContent = T.selected; }
      setTimeout(() => { btn.textContent = T.copy; btn.classList.remove("done"); }, 2200);
    });
  });

  /* ===== outro seal ring and footer microprint, where the page has them ===== */
  const og = $("outro-rings");
  if (og) for (let i = 0; i < 14; i++) addPath(og, ring(72 + i * 2.4, 4, 20, i * .32, 1.2, 5, i * .2));
  const micro = $("micro");
  if (micro && micro.dataset.text) micro.textContent = micro.dataset.text.repeat(60);

  window.HR = { L, still, $, NS, mss, seeded, level, hex, ring, addPath, tabs, panelTabs };
})();
