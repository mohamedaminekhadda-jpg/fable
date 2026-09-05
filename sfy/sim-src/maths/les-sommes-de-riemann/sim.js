// Les sommes de Riemann — l'aire, et la vitesse à laquelle on l'approche.
//
// Tout le monde a vu le dessin des rectangles qui se resserrent. Ce qu'on ne voit
// jamais, c'est CE QUE COÛTE la précision : combien de rectangles pour deux
// décimales, pour quatre, et pourquoi la méthode du milieu écrase celle de
// gauche alors que les deux ont l'air aussi naïves.
//
// La réponse est dans le second cadre. L'erreur y est portée en fonction de n,
// sur deux échelles logarithmiques, et elle y devient une DROITE dont la pente
// est l'ordre de la méthode : −1 à gauche, −2 au milieu. Cette pente est mesurée
// à chaque image sur les valeurs affichées, jamais recopiée du cours. C'est la
// seule chose de la page qu'aucun exercice écrit ne peut montrer.

import { INTEGRALES, METHODES, somme, exacte, ordreObserve } from './integrales.js';

export function mount(lab) {
  const { fr } = lab;
  const svg = lab.svg();

  const choix = lab.select({ label: 'La fonction',
    options: INTEGRALES.map((I) => ({ value: I.id, label: I.nom })), value: 'carre',
    onChange: () => { majBornes(); dessine(); } });
  const bA = lab.slider({ label: 'a', min: -2, max: 4, step: 0.01, value: 0, dec: 2, onInput: dessine });
  const bB = lab.slider({ label: 'b', min: -2, max: 4, step: 0.01, value: 2, dec: 2, onInput: dessine });
  // n avance par paliers utiles : 1, 2, 3… puis 10, 20… puis 100, 200. Un curseur
  // linéaire jusqu'à 500 passerait tout son temps entre 300 et 500, là où il ne
  // se voit plus rien.
  const PALIERS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200, 300, 500];
  const iN = lab.slider({ label: 'Nombre de tranches', min: 0, max: PALIERS.length - 1, step: 1,
    value: 6, dec: 0, format: (v) => String(PALIERS[Math.round(v)]), onInput: dessine });
  const meth = lab.select({ label: 'La méthode',
    options: METHODES.map((m) => ({ value: m.id, label: m.nom })), value: 'gauche', onChange: dessine });
  const vErreur = lab.check({ label: 'Le graphe de l’erreur', value: true, onChange: dessine });

  const texte = (v) => (v == null ? '—' : String(v));
  lab.group('L’aire');
  const rSomme = lab.readout({ label: 'Somme approchée', format: texte, hi: true });
  const rExact = lab.readout({ label: 'Valeur exacte', format: texte });
  const rErr = lab.readout({ label: 'Erreur', format: texte });
  lab.group('La vitesse');
  const rN = lab.readout({ label: 'Tranches', dec: 0 });
  const rOrdre = lab.readout({ label: 'Ordre mesuré', format: texte, hi: true });
  const rGain = lab.readout({ label: 'Doubler n divise l’erreur par', format: texte });
  const rDec = lab.readout({ label: 'Décimales justes', format: texte });

  const mk = (t, a, p) => lab.make(t, a, p);
  function txt(p, x, y, s, a = {}) {
    const t = mk('text', { x, y, 'font-size': a.fs || 11, fill: a.fill || 'var(--ink)',
      'text-anchor': a.anchor || 'start', 'font-weight': a.bold ? 600 : 400,
      'font-family': a.mono ? 'var(--mono)' : 'inherit', opacity: a.op != null ? a.op : 1,
      'paint-order': a.halo ? 'stroke' : null, stroke: a.halo ? 'var(--paper)' : null,
      'stroke-width': a.halo ? 3 : null, 'stroke-linejoin': a.halo ? 'round' : null }, p);
    t.textContent = s;
    return t;
  }
  function joliPas(span, cible) {
    const brut = span / Math.max(1, cible);
    const p = Math.pow(10, Math.floor(Math.log10(brut) || 0));
    const k = brut / p;
    return (k <= 1 ? 1 : k <= 2 ? 2 : k <= 5 ? 5 : 10) * p;
  }
  const integ = () => INTEGRALES.find((I) => I.id === choix.value);
  const methode = () => METHODES.find((m) => m.id === meth.value);
  const nTranches = () => PALIERS[Math.round(iN.value)];

  function majBornes() {
    const I = integ();
    [bA, bB].forEach((s) => { s.el.min = I.bornes[0]; s.el.max = I.bornes[1]; s.el.step = 0.01; });
    bA.set(I.defaut[0]); bB.set(I.defaut[1]);
  }

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const { w: W, h: H } = lab.size();
    const I = integ(), m = methode(), n = nTranches();
    let a = bA.value, b = bB.value;
    if (b <= a) { b = Math.min(I.bornes[1], a + 0.05); bB.set(b); }

    const fsT = Math.max(12, Math.min(16, W / 46));
    txt(svg, 10, 8 + fsT, '∫ ' + I.nom.replace('f(x) = ', '') + ' dx   de ' + fr(a, 2) + ' à ' + fr(b, 2),
      { fs: fsT, bold: true, mono: true });
    txt(svg, 10, 10 + fsT * 2, 'Poussez le nombre de tranches, puis changez de méthode : '
      + 'regardez la pente du second graphe.', { fs: 10.5, fill: 'var(--ink-soft)' });
    const haut = 18 + fsT * 2;

    const large = W >= 660;
    const gap = 14;
    const boxA = !vErreur.value ? { x: 8, y: haut, w: W - 16, h: H - haut - 10 }
      : large ? { x: 8, y: haut, w: (W - 16 - gap) * 0.56, h: H - haut - 10 }
        : { x: 8, y: haut, w: W - 16, h: (H - haut - 10 - gap) * 0.58 };
    aire(boxA, I, a, b, n, m);
    if (vErreur.value) {
      const boxB = large ? { x: boxA.x + boxA.w + gap, y: haut, w: W - 16 - gap - boxA.w, h: H - haut - 10 }
        : { x: 8, y: boxA.y + boxA.h + gap, w: W - 16, h: H - haut - 10 - gap - boxA.h };
      erreurs(boxB, I, a, b, n, m);
    }

    const S = somme(I, a, b, n, m), E = exacte(I, a, b), err = Math.abs(S - E);
    rSomme.set(fr(S, 8));
    rExact.set(fr(E, 8) + (a === I.defaut[0] && b === I.defaut[1] ? '   = ' + I.exacte : ''));
    rErr.set(err < 1e-14 ? 'moins de 10⁻¹⁴' : err.toExponential(3).replace('.', ','));
    rN.set(n);
    const p = ordreObserve(I, a, b, m);
    rOrdre.set(p == null ? '—' : 'erreur ≈ C / n^' + fr(p, 2));
    rGain.set(p == null ? '—' : fr(2 ** p, 2) + ' environ');
    rDec.set(err > 0 ? String(Math.max(0, Math.floor(-Math.log10(err / Math.max(1e-12, Math.abs(E))))))
      + ' (en valeur relative)' : 'toutes');
  }

  /* ── le cadre de l'aire ───────────────────────────────────────────────── */
  function aire(box, I, a, b, n, m) {
    const G = { l: 44, r: 12, t: 12, b: 26 };
    const L = box.x + G.l, R = box.x + box.w - G.r;
    const T = box.y + G.t, B = box.y + box.h - G.b;
    const g = mk('g', {}, svg);
    mk('rect', { x: L, y: T, width: R - L, height: B - T, fill: 'var(--paper)',
      stroke: 'var(--rule)', 'stroke-width': 1 }, g);

    // on cadre un peu plus large que [a, b] pour montrer que la fonction continue
    const marge = (b - a) * 0.12;
    const xa = Math.max(I.bornes[0], a - marge), xb = Math.min(I.bornes[1], b + marge);
    const N = Math.max(160, Math.round(R - L));
    const vals = [];
    for (let i = 0; i <= N; i++) {
      const x = xa + ((xb - xa) * i) / N;
      const v = I.f(x);
      if (isFinite(v)) vals.push(v);
    }
    let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    const mv = (hi - lo) * 0.12 || 1;
    lo -= mv; hi += mv;
    const X = (v) => L + ((v - xa) / (xb - xa)) * (R - L);
    const Y = (v) => B - ((v - lo) / (hi - lo)) * (B - T);

    const cid = 'cadreAire';
    mk('rect', { x: L, y: T, width: R - L, height: B - T },
      mk('clipPath', { id: cid }, mk('defs', {}, g)));
    const dedans = mk('g', { 'clip-path': 'url(#' + cid + ')' }, g);

    const py = joliPas(hi - lo, 4);
    const dec = Math.max(0, -Math.floor(Math.log10(py) + 1e-9));
    for (let v = Math.ceil(lo / py) * py; v <= hi + 1e-9; v += py) {
      const zero = Math.abs(v) < py * 1e-6;
      mk('line', { x1: L, y1: Y(v), x2: R, y2: Y(v), stroke: zero ? 'var(--ink-soft)' : 'var(--rule)',
        'stroke-width': zero ? 1.4 : 1, opacity: zero ? 0.8 : 0.4 }, dedans);
      txt(g, L - 5, Y(v) + 3.5, fr(v, dec), { fs: 9, anchor: 'end', mono: true, fill: 'var(--ink-soft)' });
    }

    /* Les tranches. Au-delà de deux pixels de large on les dessine une à une ;
       en dessous, le contour à lui seul suffit — trois cents traits de bordure
       collés forment un aplat gris qui cache la courbe au lieu de la montrer. */
    const h = (b - a) / n;
    const larg = ((R - L) * h) / (xb - xa);
    const gTr = mk('g', {}, dedans);
    const bord = larg > 2.5;
    for (let k = 0; k < n; k++) {
      const x0 = a + k * h, x1 = x0 + h;
      let y;
      if (m.t === null) {
        // un trapèze : le quadrilatère des deux ordonnées
        const y0 = I.f(x0), y1 = I.f(x1);
        if (!isFinite(y0) || !isFinite(y1)) continue;
        mk('path', { d: 'M' + X(x0) + ' ' + Y(0) + 'L' + X(x0) + ' ' + Y(y0)
          + 'L' + X(x1) + ' ' + Y(y1) + 'L' + X(x1) + ' ' + Y(0) + 'Z',
          fill: 'var(--sub)', 'fill-opacity': 0.26,
          stroke: bord ? 'var(--sub)' : 'none', 'stroke-width': bord ? 0.8 : 0 }, gTr);
        continue;
      }
      y = I.f(x0 + m.t * h);
      if (!isFinite(y)) continue;
      mk('rect', { x: X(x0), y: Math.min(Y(y), Y(0)), width: X(x1) - X(x0),
        height: Math.abs(Y(y) - Y(0)),
        fill: y >= 0 ? 'var(--sub)' : '#c1440e', 'fill-opacity': 0.26,
        stroke: bord ? (y >= 0 ? 'var(--sub)' : '#c1440e') : 'none', 'stroke-width': bord ? 0.8 : 0 }, gTr);
      // le point où la hauteur est prise : c'est ce qui distingue les trois
      // méthodes, et sans lui elles se ressemblent toutes
      if (larg > 9) {
        mk('circle', { cx: X(x0 + m.t * h), cy: Y(y), r: 2, fill: 'var(--ink)', opacity: 0.65 }, gTr);
      }
    }

    // la courbe par-dessus
    let d = '', ouvert = false;
    for (let i = 0; i <= N; i++) {
      const x = xa + ((xb - xa) * i) / N;
      const v = I.f(x);
      if (!isFinite(v)) { ouvert = false; continue; }
      d += (ouvert ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(v).toFixed(1);
      ouvert = true;
    }
    mk('path', { d, fill: 'none', stroke: 'var(--sub)', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, dedans);

    // a et b, marqués sur l'axe
    [[a, 'a'], [b, 'b']].forEach(([v, nom]) => {
      mk('line', { x1: X(v), y1: T, x2: X(v), y2: B, stroke: 'var(--ink)', 'stroke-width': 1.2,
        'stroke-dasharray': '4 3', opacity: 0.65 }, dedans);
      txt(g, X(v), B + 14, nom + ' = ' + fr(v, 2), { fs: 9.5, anchor: 'middle', mono: true,
        fill: 'var(--ink-soft)', halo: true });
    });
    txt(g, L + 5, T + 13, n + (n === 1 ? ' tranche' : ' tranches') + ' — ' + m.nom,
      { fs: 10, bold: true, fill: 'var(--ink-soft)', halo: true });
  }

  /* ── le cadre de l'erreur, en repère logarithmique ────────────────────── */
  function erreurs(box, I, a, b, nCourant, m) {
    const G = { l: 46, r: 12, t: 12, b: 30 };
    const L = box.x + G.l, R = box.x + box.w - G.r;
    const T = box.y + G.t, B = box.y + box.h - G.b;
    const g = mk('g', {}, svg);
    mk('rect', { x: L, y: T, width: R - L, height: B - T, fill: 'var(--paper)',
      stroke: 'var(--rule)', 'stroke-width': 1 }, g);

    const vraie = exacte(I, a, b);
    // Les quatre méthodes ensemble : la comparaison est le sujet. Deux droites
    // de pente −1, deux de pente −2, et l'écart se creuse sans limite.
    const series = METHODES.map((mm) => {
      const pts = [];
      for (let k = 0; k < 26; k++) {
        const n = Math.round(1 * Math.pow(500, k / 25));
        if (pts.length && pts[pts.length - 1].n === n) continue;
        const e = Math.abs(somme(I, a, b, n, mm) - vraie);
        // le zéro n'a pas de logarithme : une méthode exacte sur ce cas-là
        // (les trapèzes sur une droite) sort du graphe, et c'est correct
        if (e > 0 && isFinite(e)) pts.push({ n, e });
      }
      return { m: mm, pts };
    });
    const tous = series.flatMap((s) => s.pts);
    if (!tous.length) {
      txt(g, (L + R) / 2, (T + B) / 2, 'erreur nulle : la méthode est exacte ici',
        { fs: 11, anchor: 'middle', fill: 'var(--ink-soft)' });
      return;
    }
    const eLo = Math.min(...tous.map((p) => p.e)), eHi = Math.max(...tous.map((p) => p.e));
    const lx = (n) => L + (Math.log10(n) / Math.log10(500)) * (R - L);
    const l0 = Math.floor(Math.log10(eLo)), l1 = Math.ceil(Math.log10(eHi));
    const ly = (e) => B - ((Math.log10(e) - l0) / Math.max(1, l1 - l0)) * (B - T);

    for (let p = l0; p <= l1; p++) {
      mk('line', { x1: L, y1: ly(10 ** p), x2: R, y2: ly(10 ** p), stroke: 'var(--rule)',
        'stroke-width': 1, opacity: 0.4 }, g);
      txt(g, L - 5, ly(10 ** p) + 3.5, '10' + expo(p), { fs: 9, anchor: 'end', mono: true, fill: 'var(--ink-soft)' });
    }
    [1, 10, 100, 500].forEach((n) => {
      mk('line', { x1: lx(n), y1: T, x2: lx(n), y2: B, stroke: 'var(--rule)', 'stroke-width': 1, opacity: 0.4 }, g);
      txt(g, lx(n), B + 13, String(n), { fs: 9, anchor: 'middle', mono: true, fill: 'var(--ink-soft)' });
    });
    txt(g, (L + R) / 2, B + 25, 'nombre de tranches n', { fs: 10, anchor: 'middle', fill: 'var(--ink-soft)' });

    series.forEach((s) => {
      const actif = s.m.id === m.id;
      const col = s.m.ordre === 1 ? '#c9772b' : '#2a9d8f';
      const d = s.pts.map((p, i) => (i ? 'L' : 'M') + lx(p.n).toFixed(1) + ' ' + ly(p.e).toFixed(1)).join(' ');
      mk('path', { d, fill: 'none', stroke: col, 'stroke-width': actif ? 2.4 : 1.1,
        opacity: actif ? 1 : 0.42, 'stroke-dasharray': s.m.t === null ? '6 3' : null }, g);
      if (actif) {
        const p = s.pts[s.pts.length - 1];
        txt(g, lx(p.n) - 4, ly(p.e) - 6, s.m.nom, { fs: 9.5, anchor: 'end', bold: true, fill: col, halo: true });
      }
    });

    // le point où l'on se trouve
    const eC = Math.abs(somme(I, a, b, nCourant, m) - vraie);
    if (eC > 0 && isFinite(eC)) {
      mk('circle', { cx: lx(nCourant), cy: ly(eC), r: 5, fill: 'var(--ink)',
        stroke: 'var(--paper)', 'stroke-width': 1.8 }, g);
    }
    const p = ordreObserve(I, a, b, m);
    txt(g, L + 5, T + 13, p == null ? 'erreur nulle' : 'pente mesurée : −' + fr(p, 2),
      { fs: 10.5, bold: true, fill: 'var(--ink-soft)', halo: true });
  }
  const expo = (p) => String(p).replace('-', '⁻').replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]);

  majBornes();
  lab.onResize(dessine);
  dessine();
}
