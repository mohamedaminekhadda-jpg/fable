// Les suites récurrentes — l'escalier.
//
// Une suite définie par u(n+1) = f(u(n)) ne se lit pas dans une formule : elle
// se lit dans un tracé. On part de u(0) sur l'axe des abscisses, on monte
// jusqu'à la courbe — voilà u(1) —, on rejoint horizontalement la droite y = x
// pour reporter cette valeur en abscisse, et on remonte. Le chemin obtenu monte
// en escalier, ou s'enroule en spirale, ou tourne en rond, ou part dans tous les
// sens. Ces quatre dessins sont les quatre comportements du chapitre, et un
// élève qui les a vus une fois ne les confond plus.
//
// Ce qu'on peut FAIRE ici, et qui est tout l'intérêt : tirer u(0) à la souris.
// Le même f donne une convergence ou une divergence selon d'où l'on part, et
// c'est en déplaçant le point qu'on comprend ce que « bassin d'attraction »
// veut dire, sans que le mot soit prononcé.

import { SUITES, pointsFixes, termes, fixeProche, rapportEcarts } from './suites.js';

export function mount(lab) {
  const { fr } = lab;
  const svg = lab.svg();

  /* ── réglages ─────────────────────────────────────────────────────────── */
  const choix = lab.select({
    label: 'La suite', options: SUITES.map((s) => ({ value: s.id, label: s.titre })),
    value: 'racine', onChange: () => { majSuite(); dessine(); },
  });
  const u0 = lab.slider({ label: 'u(0)', min: -2, max: 8, step: 0.001, value: 6, dec: 3,
    onInput: dessine });
  const pas = lab.slider({ label: 'Nombre de pas', min: 0, max: 40, step: 1, value: 8, dec: 0,
    onInput: dessine });

  let anim = null;
  lab.buttons([
    { label: '+1 pas', onClick: () => { pas.set(Math.min(40, pas.value + 1)); dessine(); } },
    { label: '▶  Dérouler', onClick: (b) => {
      if (anim) { clearInterval(anim); anim = null; b.textContent = '▶  Dérouler'; return; }
      pas.set(0); dessine();
      b.textContent = '❙❙  Arrêter';
      anim = setInterval(() => {
        pas.set(pas.value + 1); dessine();
        if (pas.value >= 40) { clearInterval(anim); anim = null; b.textContent = '▶  Dérouler'; }
      }, 260);
    } },
  ]);
  lab.onDestroy(() => anim && clearInterval(anim));

  const diagonale = lab.check({ label: 'La droite y = x', value: true, onChange: dessine });
  const tangente = lab.check({ label: 'La tangente au point fixe', value: false, onChange: dessine });
  const etiquettes = lab.check({ label: 'Nommer u(0), u(1), u(2)…', value: true, onChange: dessine });

  /* ── mesures ──────────────────────────────────────────────────────────── */
  const texte = (v) => (v == null ? '—' : String(v));
  lab.group('Le point fixe');
  const rFixe = lab.readout({ label: 'l, solution de f(l) = l', format: texte, hi: true });
  const rDeriv = lab.readout({ label: 'f’(l)', format: texte });
  const rVerdict = lab.readout({ label: 'Verdict', format: texte });
  lab.group('La suite');
  const rUn = lab.readout({ label: 'u(n) atteint', format: texte });
  const rEcart = lab.readout({ label: '|u(n) − l|', format: texte });
  const rRapport = lab.readout({ label: 'Rapport des écarts', format: texte });
  const rAllure = lab.readout({ label: 'Allure du tracé', format: texte });

  /* ── outils de tracé ──────────────────────────────────────────────────── */
  const mk = (t, a, p) => lab.make(t, a, p);
  let regle = null;
  const mesure = (s, fs, bold) => {
    if (!regle) return String(s).length * fs * 0.52;
    regle.setAttribute('font-size', fs);
    regle.setAttribute('font-weight', bold ? 600 : 400);
    regle.textContent = String(s);
    return regle.getComputedTextLength() || String(s).length * fs * 0.52;
  };
  function txt(p, x, y, s, a = {}) {
    const t = mk('text', { x, y, 'font-size': a.fs || 11, fill: a.fill || 'var(--ink)',
      'text-anchor': a.anchor || 'start', 'font-weight': a.bold ? 600 : 400,
      'font-family': a.mono ? 'var(--mono)' : 'inherit', opacity: a.op != null ? a.op : 1,
      'paint-order': a.halo ? 'stroke' : null, stroke: a.halo ? 'var(--paper)' : null,
      'stroke-width': a.halo ? 3 : null, 'stroke-linejoin': a.halo ? 'round' : null }, p);
    t.textContent = s;
    return t;
  }
  function coupe(s, largeur, fs, bold) {
    const mots = String(s).split(/\s+/), out = [];
    let l = '';
    mots.forEach((m) => {
      if (!l) { l = m; return; }
      const e = l + ' ' + m;
      if (mesure(e, fs, bold) <= largeur) l = e; else { out.push(l); l = m; }
    });
    if (l) out.push(l);
    return out;
  }
  // Des graduations qu'un humain choisirait : 1, 2 ou 5 fois une puissance de dix.
  function joliPas(span, cible) {
    const brut = span / Math.max(1, cible);
    const p = Math.pow(10, Math.floor(Math.log10(brut) || 0));
    const n = brut / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }

  const suite = () => SUITES.find((s) => s.id === choix.value);

  // Le curseur u(0) doit couvrir le domaine de la suite choisie, et pas celui de
  // la précédente : une valeur hors domaine ne donne pas un dessin, elle donne
  // un NaN.
  function majSuite() {
    const s = suite();
    const [a, b] = s.dom;
    u0.el.min = a; u0.el.max = b;
    u0.el.step = (b - a) / 2000;
    u0.set(s.u0);
    pas.set(8);
  }

  /* ── dessin ───────────────────────────────────────────────────────────── */
  let repere = null;              // le cadre du plan, pour le tirage de u(0)

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    regle = mk('text', { x: -9999, y: -9999, fill: 'none' }, svg);
    const { w: W, h: H } = lab.size();
    const s = suite();
    const n = Math.round(pas.value);
    const fixes = pointsFixes(s);
    const t = termes(s, u0.value, n);
    const l = fixeProche(fixes, t[t.length - 1]);

    /* ── bandeau ── */
    const fsT = Math.max(12, Math.min(16, W / 46));
    let y = 8 + fsT;
    txt(svg, 10, y, s.titre, { fs: fsT, bold: true, mono: true });
    y += fsT * 1.25;
    coupe('On part de u(0) sur l’axe, on monte à la courbe, on revient sur y = x, '
      + 'et on recommence. Tirez u(0) à la souris.', W - 20, 10.5)
      .forEach((li) => { txt(svg, 10, y, li, { fs: 10.5, fill: 'var(--ink-soft)' }); y += 12.5; });
    const haut = y + 6;

    /* ── deux cadres : l'escalier, puis u(n) en fonction de n ── */
    const large = W >= 660;
    const gap = 14;
    const boxA = large
      ? { x: 8, y: haut, w: (W - 16 - gap) * 0.58, h: H - haut - 10 }
      : { x: 8, y: haut, w: W - 16, h: (H - haut - 10 - gap) * 0.6 };
    const boxB = large
      ? { x: boxA.x + boxA.w + gap, y: haut, w: W - 16 - gap - boxA.w, h: H - haut - 10 }
      : { x: 8, y: boxA.y + boxA.h + gap, w: W - 16, h: H - haut - 10 - gap - boxA.h };

    escalier(boxA, s, t, fixes, l);
    graphe(boxB, t, l);

    /* ── mesures ── */
    rFixe.set(fixes.length
      ? fixes.map((v) => fr(v, 6)).join('   ')
      : 'aucun dans le domaine');
    if (l != null) {
      const d = s.fp(l);
      rDeriv.set(fr(d, 4));
      const a = Math.abs(d);
      rVerdict.set(a < 1
        ? '|f’(l)| = ' + fr(a, 3) + ' < 1  →  attractif'
        : '|f’(l)| = ' + fr(a, 3) + ' ≥ 1  →  répulsif');
    } else { rDeriv.set(null); rVerdict.set(null); }
    const dernier = t[t.length - 1];
    rUn.set('u(' + (t.length - 1) + ') = ' + fr(dernier, 8));
    rEcart.set(l == null ? '—' : fr(Math.abs(dernier - l), 10));
    const rap = rapportEcarts(t, l);
    rRapport.set(rap == null ? '—' : fr(rap, 4)
      + (l != null && Math.abs(s.fp(l)) < 1e-6 ? '   → 0 : convergence quadratique' : ''));
    rAllure.set(allure(s, t, l));

    if (regle) { regle.remove(); regle = null; }
  }

  /* Le mot juste sur ce qu'on voit. Il est DÉDUIT du tracé, pas attaché à la
     suite dans le catalogue : ainsi il reste vrai quand on déplace u(0), ce qui
     est précisément le cas intéressant. */
  function allure(s, t, l) {
    if (t.length < 4) return 'trop peu de pas';
    const fin = t.slice(-6);
    if (!fin.every((v) => isFinite(v))) return 'la suite explose';
    if (l != null && Math.abs(fin[fin.length - 1] - l) < 1e-7) {
      return Math.abs(s.fp(l)) < 1e-6 ? 'convergence quadratique' : 'convergence atteinte';
    }
    // un cycle de période deux : un terme sur deux se répète
    const p2 = Math.abs(t[t.length - 1] - t[t.length - 3]) < 1e-6
      && Math.abs(t[t.length - 2] - t[t.length - 4]) < 1e-6
      && Math.abs(t[t.length - 1] - t[t.length - 2]) > 1e-6;
    if (p2) return 'cycle de période 2';
    const e = l == null ? null : fin.map((v) => v - l);
    if (e && e.every((v, i) => i === 0 || v * e[i - 1] < 0)) return 'spirale — termes alternés';
    if (e && e.every((v, i) => i === 0 || Math.abs(v) < Math.abs(e[i - 1]))) return 'escalier monotone';
    if (l != null && Math.abs(s.fp(l)) >= 1) return 'ni cycle ni convergence — chaotique';
    return 'en cours';
  }

  /* ── le plan de l'escalier ────────────────────────────────────────────── */
  function escalier(box, s, t, fixes, l) {
    const [xa, xb, ya, yb] = s.vue;
    /* Les deux axes sont à la MÊME échelle, et ce n'est pas un détail : la droite
       y = x doit apparaître à 45°. Sur des échelles différentes le report
       horizontal ne se lit plus comme un report, et tout le dessin perd son
       sens. */
    const G = { l: 34, r: 10, t: 10, b: 22 };
    const e = Math.min((box.w - G.l - G.r) / (xb - xa), (box.h - G.t - G.b) / (yb - ya));
    const larg = (xb - xa) * e, haut = (yb - ya) * e;
    const ox = box.x + G.l + (box.w - G.l - G.r - larg) / 2;
    const oy = box.y + G.t + (box.h - G.t - G.b - haut) / 2;
    const X = (v) => ox + (v - xa) * e;
    const Y = (v) => oy + (yb - v) * e;
    repere = { X, Y, xa, xb, e, ox, oy, larg, haut, box };

    const g = mk('g', {}, svg);
    mk('rect', { x: ox, y: oy, width: larg, height: haut, fill: 'var(--paper)',
      stroke: 'var(--rule)', 'stroke-width': 1 }, g);
    const cp = mk('clipPath', { id: 'cadreEscalier' }, mk('defs', {}, g));
    mk('rect', { x: ox, y: oy, width: larg, height: haut }, cp);
    const dedans = mk('g', { 'clip-path': 'url(#cadreEscalier)' }, g);

    // le quadrillage
    const px = joliPas(xb - xa, 6), py = joliPas(yb - ya, 6);
    const dec = (p) => Math.max(0, -Math.floor(Math.log10(p) + 1e-9));
    for (let v = Math.ceil(xa / px) * px; v <= xb + 1e-9; v += px) {
      mk('line', { x1: X(v), y1: oy, x2: X(v), y2: oy + haut, stroke: 'var(--rule)',
        'stroke-width': 1, opacity: Math.abs(v) < 1e-9 ? 0.8 : 0.4 }, g);
      txt(g, X(v), oy + haut + 13, fr(v, dec(px)), { fs: 9, anchor: 'middle', mono: true, fill: 'var(--ink-soft)' });
    }
    for (let v = Math.ceil(ya / py) * py; v <= yb + 1e-9; v += py) {
      mk('line', { x1: ox, y1: Y(v), x2: ox + larg, y2: Y(v), stroke: 'var(--rule)',
        'stroke-width': 1, opacity: Math.abs(v) < 1e-9 ? 0.8 : 0.4 }, g);
      txt(g, ox - 5, Y(v) + 3.5, fr(v, dec(py)), { fs: 9, anchor: 'end', mono: true, fill: 'var(--ink-soft)' });
    }

    // la droite y = x
    if (diagonale.value) {
      const m0 = Math.max(xa, ya), m1 = Math.min(xb, yb);
      mk('line', { x1: X(m0), y1: Y(m0), x2: X(m1), y2: Y(m1), stroke: 'var(--ink-soft)',
        'stroke-width': 1.3, 'stroke-dasharray': '5 4', opacity: 0.85 }, dedans);
      txt(dedans, X(m1) - 4, Y(m1) + 13, 'y = x', { fs: 10, anchor: 'end', fill: 'var(--ink-soft)', halo: true });
    }

    // la courbe de f, échantillonnée au pixel
    const pts = [];
    const N = Math.max(80, Math.round(larg));
    for (let i = 0; i <= N; i++) {
      const x = xa + ((xb - xa) * i) / N;
      const v = s.f(x);
      pts.push(isFinite(v) ? [X(x), Y(v)] : null);
    }
    let d = '', ouvert = false;
    pts.forEach((p) => {
      if (!p) { ouvert = false; return; }
      d += (ouvert ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
      ouvert = true;
    });
    mk('path', { d, fill: 'none', stroke: 'var(--sub)', 'stroke-width': 2, 'stroke-linejoin': 'round' }, dedans);

    // la tangente au point fixe : sa pente EST f'(l), donc sa raideur comparée à
    // celle de y = x se lit à l'œil, et c'est le critère du chapitre
    if (tangente.value && l != null) {
      const m = s.fp(l);
      const dx = (xb - xa);
      mk('line', { x1: X(l - dx), y1: Y(l - m * dx), x2: X(l + dx), y2: Y(l + m * dx),
        stroke: '#c1440e', 'stroke-width': 1.4, 'stroke-dasharray': '4 3', opacity: 0.9 }, dedans);
    }

    // l'escalier lui-même
    if (t.length > 1) {
      let esc = 'M' + X(t[0]) + ' ' + Y(Math.max(ya, Math.min(yb, 0)));
      for (let i = 0; i + 1 < t.length; i++) {
        esc += 'L' + X(t[i]) + ' ' + Y(t[i + 1]);        // montée à la courbe
        esc += 'L' + X(t[i + 1]) + ' ' + Y(t[i + 1]);    // report sur y = x
      }
      mk('path', { d: esc, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.5,
        opacity: 0.85, 'stroke-linejoin': 'round' }, dedans);
      t.forEach((v, i) => {
        if (i + 1 >= t.length) return;
        mk('circle', { cx: X(t[i + 1]), cy: Y(t[i + 1]), r: 2.6, fill: 'var(--ink)', opacity: 0.8 }, dedans);
      });
    }

    // les points fixes
    fixes.forEach((v) => {
      mk('circle', { cx: X(v), cy: Y(v), r: 4.5, fill: 'none',
        stroke: Math.abs(s.fp(v)) < 1 ? '#2a9d8f' : '#c1440e', 'stroke-width': 2.2 }, dedans);
    });

    /* La poignée de u(0), sur l'axe. C'est le seul objet qu'on manipule, donc le
       seul qui a le droit d'être gros. */
    const yAxe = Y(Math.max(ya, Math.min(yb, 0)));
    const xh = X(t[0]);
    const poignee = mk('g', { cursor: 'ew-resize' }, g);
    mk('line', { x1: xh, y1: yAxe - 9, x2: xh, y2: yAxe + 9, stroke: 'var(--sub)', 'stroke-width': 2 }, poignee);
    mk('circle', { cx: xh, cy: yAxe, r: 6.5, fill: 'var(--sub)', stroke: 'var(--paper)', 'stroke-width': 1.6 }, poignee);
    /* Le nom de la poignée va À DROITE d'elle, pas en dessous. Sur les suites
       dont la vue descend à peine sous zéro, l'axe est près du bas du cadre et
       ce libellé tombait sur la graduation des abscisses. */
    txt(poignee, xh + 11, yAxe + 4, 'u(0)', { fs: 10, bold: true, fill: 'var(--sub)', halo: true });

    // les premiers termes nommés sur l'axe, tant qu'ils ne se marchent pas dessus
    if (etiquettes.value) {
      const pris = [];
      t.slice(0, 7).forEach((v, i) => {
        if (i === 0) { pris.push([xh - 14, xh + 14]); return; }
        const x = X(v), lw = mesure('u' + i, 9.5, true);
        if (x < ox || x > ox + larg) return;
        if (pris.some(([a, b]) => x - lw / 2 < b + 2 && x + lw / 2 > a - 2)) return;
        pris.push([x - lw / 2, x + lw / 2]);
        mk('line', { x1: x, y1: yAxe - 4, x2: x, y2: yAxe + 4, stroke: 'var(--ink-soft)', 'stroke-width': 1 }, g);
        txt(g, x, yAxe - 8, 'u' + i, { fs: 9.5, anchor: 'middle', bold: true, fill: 'var(--ink-soft)', halo: true });
      });
    }
  }

  /* ── u(n) en fonction de n ────────────────────────────────────────────── */
  function graphe(box, t, l) {
    const G = { l: 40, r: 10, t: 10, b: 24 };
    const L = box.x + G.l, R = box.x + box.w - G.r;
    const T = box.y + G.t, B = box.y + box.h - G.b;
    const g = mk('g', {}, svg);
    mk('rect', { x: L, y: T, width: R - L, height: B - T, fill: 'var(--paper)',
      stroke: 'var(--rule)', 'stroke-width': 1 }, g);

    const vals = t.filter((v) => isFinite(v));
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (l != null) { lo = Math.min(lo, l); hi = Math.max(hi, l); }
    const marge = (hi - lo) * 0.12 || 1;
    lo -= marge; hi += marge;
    const nMax = Math.max(4, t.length - 1);
    const X = (i) => L + (i / nMax) * (R - L);
    const Y = (v) => B - ((v - lo) / (hi - lo)) * (B - T);

    const py = joliPas(hi - lo, 5);
    const dec = Math.max(0, -Math.floor(Math.log10(py) + 1e-9));
    for (let v = Math.ceil(lo / py) * py; v <= hi + 1e-9; v += py) {
      mk('line', { x1: L, y1: Y(v), x2: R, y2: Y(v), stroke: 'var(--rule)', 'stroke-width': 1, opacity: 0.45 }, g);
      txt(g, L - 5, Y(v) + 3.5, fr(v, dec), { fs: 9, anchor: 'end', mono: true, fill: 'var(--ink-soft)' });
    }
    const px = Math.max(1, Math.round(joliPas(nMax, 6)));
    for (let i = 0; i <= nMax; i += px) {
      txt(g, X(i), B + 14, String(i), { fs: 9, anchor: 'middle', mono: true, fill: 'var(--ink-soft)' });
    }
    txt(g, (L + R) / 2, B + 24, 'n', { fs: 10, anchor: 'middle', fill: 'var(--ink-soft)' });

    // la limite, en pointillé : c'est la ligne dont les points doivent s'approcher
    if (l != null) {
      mk('line', { x1: L, y1: Y(l), x2: R, y2: Y(l), stroke: '#2a9d8f', 'stroke-width': 1.3,
        'stroke-dasharray': '5 4' }, g);
      const et = 'l = ' + fr(l, 4);
      txt(g, R - 4, Y(l) - 5, et, { fs: 9.5, anchor: 'end', mono: true, fill: '#2a9d8f', halo: true });
    }

    // les termes, reliés — la ligne brisée montre l'alternance mieux que les
    // points seuls, et l'alternance est justement ce qu'on cherche à voir
    const dd = t.map((v, i) => (i ? 'L' : 'M') + X(i) + ' ' + Y(v)).join(' ');
    mk('path', { d: dd, fill: 'none', stroke: 'var(--ink-soft)', 'stroke-width': 1,
      opacity: 0.6 }, g);
    t.forEach((v, i) => {
      mk('circle', { cx: X(i), cy: Y(v), r: i === t.length - 1 ? 4 : 2.6,
        fill: i === t.length - 1 ? 'var(--sub)' : 'var(--ink)',
        stroke: 'var(--paper)', 'stroke-width': 1 }, g);
    });
  }

  /* ── tirer u(0) ───────────────────────────────────────────────────────── */
  function versValeur(evt) {
    if (!repere) return null;
    const r = svg.getBoundingClientRect();
    const { w: W } = lab.size();
    const px = ((evt.clientX - r.left) / r.width) * W;
    const v = repere.xa + (px - repere.ox) / repere.e;
    const [a, b] = suite().dom;
    return Math.max(a, Math.min(b, v));
  }
  let tire = false;
  const onDown = (e) => {
    const v = versValeur(e);
    if (v == null) return;
    // on ne saisit que si le clic tombe dans le cadre de l'escalier
    const r = svg.getBoundingClientRect();
    const { w: W, h: H } = lab.size();
    const py = ((e.clientY - r.top) / r.height) * H;
    if (py < repere.box.y || py > repere.box.y + repere.box.h) return;
    if (((e.clientX - r.left) / r.width) * W < repere.ox - 12) return;
    tire = true; u0.set(v); dessine();
    svg.setPointerCapture && e.pointerId != null && svg.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => { if (!tire) return; const v = versValeur(e); if (v != null) { u0.set(v); dessine(); } };
  const onUp = () => { tire = false; };
  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', onUp);
  svg.addEventListener('pointercancel', onUp);
  lab.onDestroy(() => {
    svg.removeEventListener('pointerdown', onDown);
    svg.removeEventListener('pointermove', onMove);
    svg.removeEventListener('pointerup', onUp);
    svg.removeEventListener('pointercancel', onUp);
  });

  majSuite();
  lab.onResize(dessine);
  dessine();
}
