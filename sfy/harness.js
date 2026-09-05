// The bench a simulation is handed.
//
// A simulation gets one argument — `lab` — and never touches the page around
// it. That is not tidiness for its own sake: it means every experiment on the
// platform has the same sliders, the same measurement rows and the same
// play/pause, so a pupil who has used one has used all of them, and an author
// writes physics instead of widgets.
//
//   export function mount(lab) {
//     const L = lab.slider({ label: 'Longueur', min: .1, max: 2, step: .01, value: 1, unit: 'm' });
//     const T = lab.readout({ label: 'Période', unit: 's', hi: true });
//     lab.loop((dt, t) => { ...draw into lab.stage...; T.set(2 * Math.PI * Math.sqrt(L.value / 9.81)); });
//     return () => { /* optional cleanup */ };
//   }
//
// Charts were deliberately left out until three experiments had asked for one.
// See `chart` below for the shape that produced.

const SVG_NS = 'http://www.w3.org/2000/svg';

/* French numbers, in one place. A platform that writes 1.5 in one panel and
   1,5 in the next looks broken to the only people who matter here. */
export function fr(n, dec) {
  if (n == null || !isFinite(n)) return '—';
  const s = (dec == null ? String(Math.round(n * 1e9) / 1e9) : (+n).toFixed(dec)).replace('.', ',');
  const [i, f] = s.split(',');
  const neg = i.startsWith('-');
  const digits = neg ? i.slice(1) : i;
  // a narrow no-break space every three digits, as French typography wants
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (neg ? '-' : '') + grouped + (f ? ',' + f : '');
}

export function createLab({ stage, fields, rows, readoutPanel, side, subject }) {
  const destroyers = [];
  const resizers = [];
  let loopStep = null, raf = 0, last = 0, elapsed = 0, playing = true, slow = 1;
  let transport = null, timeEl = null, playBtn = null;
  const resetters = [];

  const el = (tag, cls, parent) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (parent) parent.appendChild(n);
    return n;
  };

  /* ── controls ───────────────────────────────────────────────────────── */

  function group(title) { const g = el('div', 'f-group', fields); g.textContent = title; return g; }

  function slider({ label, min = 0, max = 1, step = 0.01, value = 0, unit = '', dec, format, onInput }) {
    const wrap = el('div', 'f', fields);
    const top = el('div', 'f-top', wrap);
    const lab = el('label', null, top); lab.textContent = label;
    const out = el('span', 'f-val', top);
    const input = el('input', null, wrap);
    input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = value;
    const decimals = dec != null ? dec : String(step).includes('.') ? String(step).split('.')[1].length : 0;
    const handle = { value: +value, el: input, row: wrap, show: (on) => { wrap.hidden = !on; } };
    const paint = () => {
      out.innerHTML = (format ? format(handle.value) : fr(handle.value, decimals))
        + (unit ? '<em>' + unit + '</em>' : '');
    };
    input.addEventListener('input', () => {
      handle.value = +input.value; paint();
      if (onInput) onInput(handle.value);
    });
    handle.set = (v) => { handle.value = +v; input.value = String(v); paint(); };
    paint();
    return handle;
  }

  function select({ label, options = [], value, onChange }) {
    const wrap = el('div', 'f', fields);
    const top = el('div', 'f-top', wrap);
    el('label', null, top).textContent = label;
    const sel = el('select', null, wrap);
    options.forEach((o) => {
      const opt = document.createElement('option');
      opt.value = typeof o === 'string' ? o : o.value;
      opt.textContent = typeof o === 'string' ? o : o.label;
      sel.appendChild(opt);
    });
    if (value != null) sel.value = String(value);
    const handle = { value: sel.value, el: sel, row: wrap, show: (on) => { wrap.hidden = !on; } };
    sel.addEventListener('change', () => { handle.value = sel.value; if (onChange) onChange(sel.value); });
    handle.set = (v) => { sel.value = String(v); handle.value = sel.value; };
    return handle;
  }

  function check({ label, value = false, onChange }) {
    const wrap = el('label', 'f-check', fields);
    const box = el('input', null, wrap); box.type = 'checkbox'; box.checked = !!value;
    const span = el('span', null, wrap); span.textContent = label;
    const handle = { value: !!value, el: box, row: wrap, show: (on) => { wrap.hidden = !on; } };
    box.addEventListener('change', () => { handle.value = box.checked; if (onChange) onChange(box.checked); });
    handle.set = (v) => { box.checked = !!v; handle.value = !!v; };
    return handle;
  }

  function buttons(list = []) {
    const row = el('div', 'f-btns', fields);
    return list.map((b) => {
      const btn = el('button', 'f-btn' + (b.on ? ' on' : ''), row);
      btn.type = 'button'; btn.textContent = b.label;
      btn.addEventListener('click', () => b.onClick && b.onClick(btn));
      return btn;
    });
  }

  /* ── measurements ───────────────────────────────────────────────────── */

  function readout({ label, unit = '', dec = 2, hi = false, format }) {
    readoutPanel.hidden = false;
    const row = el('div', 'r' + (hi ? ' hi' : ''), rows);
    el('span', 'r-label', row).textContent = label;
    const val = el('span', 'r-val', row);
    const handle = {
      set(v) {
        val.innerHTML = (format ? format(v) : fr(v, dec)) + (unit ? '<em>' + unit + '</em>' : '');
      },
      el: row, row, show: (on) => { row.hidden = !on; },
    };
    handle.set(null);
    return handle;
  }

  /* ── the clock ──────────────────────────────────────────────────────────
     Every animated experiment gets the same transport, and two lessons are
     baked in so no author has to rediscover them: requestAnimationFrame does
     not fire in a hidden tab, and when it resumes the elapsed wall time must
     NOT be handed to the simulation, or a pendulum teleports. dt is measured
     per frame and capped. */
  /* opts.slow adds a slow-motion selector. Real physics is usually too fast to
     watch — a pulse crosses a 10 m rope in a fifth of a second — and the honest
     answer is to slow the CLOCK, not to lie about the numbers. The t handed to
     the simulation is physical time, and the transport shows physical time; the
     selector only says how fast it runs compared to yours. */
  function loop(step, opts = {}) {
    loopStep = step;
    if (!transport) {
      transport = el('div', 'lab-transport');
      side.insertBefore(transport, side.firstChild);
      playBtn = el('button', 'f-btn on', transport);
      playBtn.type = 'button';
      playBtn.addEventListener('click', () => (playing ? clock.pause() : clock.play()));
      const rst = el('button', 'f-btn', transport);
      rst.type = 'button'; rst.textContent = 'Recommencer';
      rst.addEventListener('click', () => clock.reset());
      if (opts.slow) {
        const sel = el("select", null, transport);
        sel.style.cssText = "font:inherit;font-family:var(--mono);font-size:11px;padding:5px 7px;"
          + "border:1px solid var(--rule);border-radius:8px;background:var(--paper-2);color:var(--ink-soft)";
        [['1', 'temps réel'], ['0.2', 'ralenti ×5'], ['0.05', 'ralenti ×20'],
         ['0.01', 'ralenti ×100'], ['0.002', 'ralenti ×500'], ['0.0005', 'ralenti ×2000']]
          .forEach(([v, t]) => { const o = document.createElement("option"); o.value = v; o.textContent = t; sel.appendChild(o); });
        sel.value = String(opts.slow === true ? 0.05 : opts.slow);
        slow = +sel.value;
        sel.addEventListener('change', () => { slow = +sel.value; });
      }
      timeEl = el('span', 'lab-time', transport);
    }
    paintTransport();
    start();
    return clock;
  }
  function paintTransport() {
    if (playBtn) { playBtn.textContent = playing ? '❙❙  Pause' : '▶  Lecture'; playBtn.classList.toggle('on', playing); }
    // In slow motion the interesting quantities are milliseconds — a delay of
    // 0,134 s read on a clock that only shows hundredths is a clock that hides
    // the very thing being measured.
    if (timeEl) timeEl.textContent = fr(elapsed, slow < 1 ? 3 : 2) + ' s';
  }
  function frame(ts) {
    if (!playing) { raf = 0; return; }
    // first frame after a start or a resume contributes no time
    const real = last ? Math.min(0.05, (ts - last) / 1000) : 0;
    last = ts;
    const dt = real * slow;
    elapsed += dt;
    try { if (loopStep) loopStep(dt, elapsed); } catch (e) { fatal(e); return; }
    paintTransport();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (playing && !raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  const clock = {
    get playing() { return playing; },
    get t() { return elapsed; },
    play() { playing = true; paintTransport(); start(); },
    pause() { playing = false; stop(); paintTransport(); },
    reset() {
      elapsed = 0; last = 0;
      resetters.forEach((f) => { try { f(); } catch (e) { fatal(e); } });
      paintTransport();
      // one frame so a paused experiment still redraws at t = 0
      if (!playing && loopStep) { try { loopStep(0, 0); } catch (e) { fatal(e); } }
    },
    step(dt) { elapsed += dt; if (loopStep) loopStep(dt, elapsed); paintTransport(); },
    get slow() { return slow; },
  };
  // A book gets read in background tabs; give the frames back when hidden.
  const vis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', vis);
  destroyers.push(() => document.removeEventListener('visibilitychange', vis));

  /* ── stage helpers ──────────────────────────────────────────────────── */

  const size = () => ({ w: stage.clientWidth || 640, h: stage.clientHeight || 420 });

  // An SVG sized to the stage, kept in step with it. Most experiments want
  // exactly this and nothing more.
  function svg({ viewBox } = {}) {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const fit = () => {
      const { w, h } = size();
      s.setAttribute('viewBox', viewBox || ('0 0 ' + w + ' ' + h));
      s.setAttribute('width', w); s.setAttribute('height', h);
    };
    fit(); onResize(fit);
    stage.appendChild(s);
    return s;
  }
  const make = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  /* ── graphs ─────────────────────────────────────────────────────────────
     Held back until three experiments wanted one, so the shape comes from what
     they ask for rather than from what chart libraries usually offer:

       • a CURVE for a law, drawn from the law itself (n = A + B/λ²) ;
       • POINTS the pupil measures one at a time, a slit at a time ;
       • a LINE FITTED to those points — because reading a slope off a graph IS
         the exercise, not a decoration laid over an answer already known.

     It draws into a rectangle of the simulation's own SVG instead of owning a
     canvas: every experiment here shows apparatus and graph side by side, and
     they have to share one coordinate system to be annotated together. */

  // Ticks a person would choose: 1, 2 or 5 times a power of ten. A graph whose
  // axis reads 0 · 0,37 · 0,74 is unreadable however correct the arithmetic is.
  function niceStep(span, target) {
    const raw = span / Math.max(1, target);
    const pow = Math.pow(10, Math.floor(Math.log10(raw) || 0));
    const n = raw / pow;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
  }

  // Least squares. `throughOrigin` is not a nicety: L = 2λD/a has no constant
  // term, and a free intercept invents one out of measurement noise, so the
  // slope the pupil reads would not be the slope the physics predicts.
  function fitLine(pts, { throughOrigin = false } = {}) {
    const P = pts.filter((p) => p && isFinite(p.x) && isFinite(p.y));
    if (P.length < 2) return null;
    let a, b;
    if (throughOrigin) {
      let sxy = 0, sxx = 0;
      for (const p of P) { sxy += p.x * p.y; sxx += p.x * p.x; }
      if (!sxx) return null;
      a = sxy / sxx; b = 0;
    } else {
      const n = P.length;
      let sx = 0, sy = 0, sxy = 0, sxx = 0;
      for (const p of P) { sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; }
      const den = n * sxx - sx * sx;
      if (!den) return null;
      a = (n * sxy - sx * sy) / den; b = (sy - a * sx) / n;
    }
    let ssTot = 0, ssRes = 0;
    const my = P.reduce((s, p) => s + p.y, 0) / P.length;
    for (const p of P) { ssTot += (p.y - my) ** 2; ssRes += (p.y - (a * p.x + b)) ** 2; }
    return { a, b, r2: ssTot ? 1 - ssRes / ssTot : 1, n: P.length };
  }

  function chart(opts = {}) {
    const ax = opts.x || {}, ay = opts.y || {};
    const PAD = { l: 52, r: 12, t: 14, b: 34 };
    let map = null;                      // rempli au premier tracé

    function draw(parent, box, data = {}) {
      const g = make('g', {}, parent);
      const curves = data.curves || [], points = data.points || [], fits = data.fits || [];
      // Le domaine part des bornes demandées, sinon des données. Chaque axe
      // décide seul s'il contient l'origine : `L = f(1/a)` doit la montrer, car
      // « la droite passe par zéro » est ce qu'on vérifie à l'œil ; mais forcer
      // un axe d'indices à descendre à n = 0 écrase 1,50 et 1,53 sur le même
      // trait. Un seul drapeau pour les deux ne peut pas servir les deux.
      const xs = [], ys = [];
      curves.forEach((c) => (c.pts || []).forEach((p) => { xs.push(p[0]); ys.push(p[1]); }));
      points.forEach((p) => { xs.push(p.x); ys.push(p.y); });
      if (ax.zero !== false) xs.push(0);
      if (ay.zero !== false) ys.push(0);
      const lo = (v, d) => (v.length ? Math.min(...v) : d);
      const hi = (v, d) => (v.length ? Math.max(...v) : d);
      let x0 = ax.min != null ? ax.min : lo(xs, 0);
      let x1 = ax.max != null ? ax.max : hi(xs, 1);
      if (x1 - x0 < 1e-12) x1 = x0 + 1;
      // Une droite tracée doit tenir dans le cadre : sinon on demande de lire
      // une ordonnée à l'origine qui sort par le bas. On connaît maintenant les
      // bornes en x, donc ses deux extrémités.
      fits.forEach((f) => {
        if (!f || !isFinite(f.a)) return;
        ys.push(f.a * x0 + (f.b || 0), f.a * x1 + (f.b || 0));
      });
      let y0 = ay.min != null ? ay.min : lo(ys, 0);
      let y1 = ay.max != null ? ay.max : hi(ys, 1);
      if (y1 - y0 < 1e-12) y1 = y0 + 1;
      if (ay.max == null) y1 += (y1 - y0) * 0.08;              // de l'air au-dessus
      if (ax.max == null) x1 += (x1 - x0) * 0.06;

      const L = box.x + PAD.l, R = box.x + box.w - PAD.r;
      const T = box.y + PAD.t, B = box.y + box.h - PAD.b;
      const X = (v) => L + ((v - x0) / (x1 - x0)) * (R - L);
      const Y = (v) => B - ((v - y0) / (y1 - y0)) * (B - T);
      map = { X, Y, L, R, T, B, x0, x1, y0, y1 };

      make('rect', { x: L, y: T, width: R - L, height: B - T,
        fill: 'var(--paper)', stroke: 'var(--rule)', 'stroke-width': 1 }, g);

      const tick = (v, dec) => fr(v, dec);
      const sx = niceStep(x1 - x0, ax.ticks || 5), sy = niceStep(y1 - y0, ay.ticks || 5);
      const decOf = (s) => Math.max(0, -Math.floor(Math.log10(s) + 1e-9));
      for (let v = Math.ceil(x0 / sx) * sx; v <= x1 + 1e-9; v += sx) {
        make('line', { x1: X(v), y1: T, x2: X(v), y2: B, stroke: 'var(--rule)',
          'stroke-width': 1, opacity: .5 }, g);
        /* B + 16 et non B + 13 : à l'origine, l'étiquette « 0,0 » de l'axe des
           abscisses venait mordre celle de l'axe des ordonnées, qui est posée à
           hauteur de B. Trois pixels suffisent à les séparer partout. */
        const t = make('text', { x: X(v), y: B + 16, 'text-anchor': 'middle' }, g);
        t.setAttribute('class', 'ax'); t.textContent = tick(v, decOf(sx));
      }
      for (let v = Math.ceil(y0 / sy) * sy; v <= y1 + 1e-9; v += sy) {
        make('line', { x1: L, y1: Y(v), x2: R, y2: Y(v), stroke: 'var(--rule)',
          'stroke-width': 1, opacity: .5 }, g);
        const t = make('text', { x: L - 6, y: Y(v) + 3.5, 'text-anchor': 'end' }, g);
        t.setAttribute('class', 'ax'); t.textContent = tick(v, decOf(sy));
      }

      const path = (pts) => pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]) + ' ' + Y(p[1])).join(' ');
      fits.forEach((f) => {
        if (!f || !isFinite(f.a)) return;
        make('path', {
          d: path([[x0, f.a * x0 + (f.b || 0)], [x1, f.a * x1 + (f.b || 0)]]),
          fill: 'none', stroke: f.color || 'var(--sub)', 'stroke-width': f.width || 1.5,
          'stroke-dasharray': f.dash || '5 4', opacity: f.opacity != null ? f.opacity : .9,
        }, g);
      });
      curves.forEach((c) => {
        if (!c.pts || c.pts.length < 2) return;
        make('path', { d: path(c.pts), fill: 'none', stroke: c.color || 'var(--ink-soft)',
          'stroke-width': c.width || 1.6, 'stroke-dasharray': c.dash || null,
          opacity: c.opacity != null ? c.opacity : 1, 'stroke-linejoin': 'round' }, g);
      });
      points.forEach((p) => {
        make('circle', { cx: X(p.x), cy: Y(p.y), r: p.r || 3.4,
          fill: p.color || 'var(--sub)', stroke: 'var(--paper)', 'stroke-width': 1.2 }, g);
        if (p.label) {
          const t = make('text', { x: X(p.x), y: Y(p.y) - 8, 'text-anchor': 'middle' }, g);
          t.setAttribute('class', 'ax'); t.textContent = p.label;
        }
      });

      const unit = (o) => (o.unit ? ' (' + o.unit + ')' : '');
      /* Une étiquette d'axe plus longue que son axe sort du cadre — et celle des
         ordonnées, qui est tournée, sort alors par le BAS de la scène, là où
         personne ne la cherche. On mesure, et on abandonne d'abord l'unité,
         puis l'étiquette entière. Mieux vaut un axe muet qu'un débord. */
      const pose = (t, place) => {
        if (t.getComputedTextLength() <= place) return;
        t.textContent = t.textContent.replace(/ \([^)]*\)$/, '');
        if (t.getComputedTextLength() > place) t.remove();
      };
      if (ax.label) {
        const t = make('text', { x: (L + R) / 2, y: B + 28, 'text-anchor': 'middle' }, g);
        t.setAttribute('class', 'lab'); t.textContent = ax.label + unit(ax);
        pose(t, R - L - 6);
      }
      if (ay.label) {
        const t = make('text', { x: box.x + 12, y: (T + B) / 2,
          'text-anchor': 'middle', transform: 'rotate(-90 ' + (box.x + 12) + ' ' + ((T + B) / 2) + ')' }, g);
        t.setAttribute('class', 'lab'); t.textContent = ay.label + unit(ay);
        pose(t, B - T - 6);
      }
      return g;
    }

    // Pour qu'une simulation puisse poser ses propres annotations sur le graphe.
    return { draw, at: (x, y) => (map ? { x: map.X(x), y: map.Y(y) } : null), get box() { return map; } };
  }

  /* ── cartes ─────────────────────────────────────────────────────────────
     Quatre simulations de géographie dessinent un fond de carte ; c'est le
     troisième consommateur qui justifiait le graphique, c'est le quatrième qui
     justifie celle-ci. Elle ne fait que trois choses, et ce sont les seules
     dont une carte scolaire ait besoin : caler une emprise en longitude et
     latitude dans une boîte, convertir un point du globe en un point de
     l'écran, et rendre le tracé d'un pays.

     Les contours viennent de `scripts/carto.mjs`, qui les extrait de Natural
     Earth (domaine public) : un tableau plat par anneau, deux nombres par
     point, en degrés.

     `parallele` est la latitude à laquelle l'échelle est exacte. À zéro on
     obtient la plate carrée, celle des planisphères. Pour une carte régionale
     il faut la régler sur le milieu de la région, faute de quoi l'Europe du
     Nord s'étire du double de sa largeur — la projection n'est pas un détail
     d'esthétique, c'est ce qui fait qu'on reconnaît un pays. */
  function carte(contours, { parallele = 0 } = {}) {
    const kx = Math.cos((parallele * Math.PI) / 180);
    const u = (lon) => lon * kx;
    const v = (lat) => -lat;
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const c of Object.values(contours)) {
      for (const a of c.a) {
        for (let i = 0; i < a.length; i += 2) {
          const x = u(a[i]), y = v(a[i + 1]);
          if (x < u0) u0 = x; if (x > u1) u1 = x;
          if (y < v0) v0 = y; if (y > v1) v1 = y;
        }
      }
    }
    return {
      // Cale la projection dans une boîte. `bornes` recadre sur une emprise
      // choisie — un planisphère qui descend à −90° passe l'essentiel de sa
      // hauteur sur une Antarctique dont il n'est jamais question.
      cadre(box, { bornes } = {}) {
        const U0 = bornes ? u(bornes.lon0) : u0, U1 = bornes ? u(bornes.lon1) : u1;
        const V0 = bornes ? v(bornes.lat1) : v0, V1 = bornes ? v(bornes.lat0) : v1;
        const e = Math.min(box.w / (U1 - U0), box.h / (V1 - V0));
        const ox = box.x + (box.w - (U1 - U0) * e) / 2;
        const oy = box.y + (box.h - (V1 - V0) * e) / 2;
        const P = (lon, lat) => [ox + (u(lon) - U0) * e, oy + (v(lat) - V0) * e];
        P.parDegre = e * kx;            // pixels par degré de longitude
        P.boite = { x: ox, y: oy, w: (U1 - U0) * e, h: (V1 - V0) * e };
        return P;
      },
      // Le `d` d'un pays : tous ses anneaux dans un seul chemin, ce qui creuse
      // les trous tout seul (le Lesotho dans l'Afrique du Sud) puisque Natural
      // Earth oriente correctement contours et enclaves.
      chemin(code, P) {
        const c = contours[code];
        if (!c) return null;
        let d = '';
        for (const a of c.a) {
          for (let i = 0; i < a.length; i += 2) {
            const p = P(a[i], a[i + 1]);
            d += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
          }
          d += 'Z';
        }
        return d;
      },
      /* Le point où poser une étiquette, ou une cible de clic : le centre de
         gravité du plus GRAND anneau, jamais celui de l'ensemble. Le centre de
         la Norvège et de ses mille îlots tombe en pleine mer ; celui de son
         anneau principal tombe en Norvège. */
      ancre(code, P) {
        const c = contours[code];
        if (!c) return null;
        let centre = null, aireMax = -1;
        for (const a of c.a) {
          let s = 0, cx = 0, cy = 0;
          for (let i = 0; i + 3 < a.length; i += 2) {
            const f = a[i] * a[i + 3] - a[i + 2] * a[i + 1];
            s += f; cx += (a[i] + a[i + 2]) * f; cy += (a[i + 1] + a[i + 3]) * f;
          }
          const A = Math.abs(s) / 2;
          if (A > aireMax) {
            aireMax = A;
            centre = s ? [cx / (3 * s), cy / (3 * s)] : [a[0], a[1]];
          }
        }
        return centre ? P(centre[0], centre[1]) : null;
      },
      nom: (code) => (contours[code] || {}).nom || null,
      codes: () => Object.keys(contours),
    };
  }

  function onResize(fn) { resizers.push(fn); }
  function onDestroy(fn) { destroyers.push(fn); }
  function onReset(fn) { resetters.push(fn); }

  let ro = null;
  if (window.ResizeObserver) {
    ro = new ResizeObserver(() => resizers.forEach((f) => { try { f(); } catch (e) { fatal(e); } }));
    ro.observe(stage);
    destroyers.push(() => ro.disconnect());
  }

  function fatal(e) {
    stop();
    const box = document.getElementById('err');
    if (!box) throw e;
    box.hidden = false;
    box.innerHTML = '<h4>La simulation s’est arrêtée</h4><pre></pre>';
    box.querySelector('pre').textContent = (e && (e.stack || e.message)) || String(e);
    // eslint-disable-next-line no-console
    console.error(e);
  }

  function destroy() { stop(); destroyers.forEach((f) => { try { f(); } catch { /* going away anyway */ } }); }

  return {
    stage, subject, size, svg, make, fr,
    group, slider, select, check, buttons, readout,
    chart, fitLine, carte,
    loop, clock, onResize, onDestroy, onReset, destroy, fatal,
  };
}
