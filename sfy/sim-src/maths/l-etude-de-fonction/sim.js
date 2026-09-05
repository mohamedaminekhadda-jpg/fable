// L'étude de fonction — f, f′ et f″ sur la même verticale.
//
// Un élève apprend que « f′ > 0 donc f croît » et que « f″ > 0 donc f est
// convexe ». Ce sont deux phrases, et elles restent deux phrases tant qu'on ne
// voit pas les trois courbes bouger ensemble. Ici elles sont empilées, alignées
// sur le même axe des abscisses, et un curseur les traverse toutes les trois.
//
// On tire le curseur, et l'on voit d'un coup : la tangente s'incline sur f
// pendant que le point descend sur f′, elle devient horizontale exactement quand
// f′ coupe l'axe, et la courbure se retourne exactement quand f″ le coupe. Le
// tableau de variations se dessine tout seul en dessous, parce qu'il n'est rien
// d'autre que le signe de f′ — ce qui est beaucoup plus convaincant à voir
// qu'à lire.

import { FONCTIONS, racines, variations, nature } from './fonctions.js';

export function mount(lab) {
  const { fr } = lab;
  const svg = lab.svg();

  const choix = lab.select({
    label: 'La fonction', options: FONCTIONS.map((F) => ({ value: F.id, label: F.nom })),
    value: 'cubique', onChange: () => { majDom(); dessine(); },
  });
  const cur = lab.slider({ label: 'x', min: -2.6, max: 2.6, step: 0.001, value: 0.6, dec: 3,
    onInput: dessine });
  const vTangente = lab.check({ label: 'La tangente en x', value: true, onChange: dessine });
  const vDeriv = lab.check({ label: 'La courbe de f′', value: true, onChange: dessine });
  const vSeconde = lab.check({ label: 'La courbe de f″', value: true, onChange: dessine });
  const vTableau = lab.check({ label: 'Le tableau de variations', value: true, onChange: dessine });
  const vPoints = lab.check({ label: 'Extremums et inflexions', value: true, onChange: dessine });

  const texte = (v) => (v == null ? '—' : String(v));
  lab.group('Au point x');
  const rF = lab.readout({ label: 'f(x)', format: texte, hi: true });
  const rD1 = lab.readout({ label: 'f′(x)', format: texte });
  const rSens = lab.readout({ label: 'donc f est', format: texte });
  const rD2 = lab.readout({ label: 'f″(x)', format: texte });
  const rConv = lab.readout({ label: 'donc la courbe est', format: texte });
  const rTan = lab.readout({ label: 'Tangente', format: texte });
  lab.group('Les points remarquables');
  const rExt = lab.readout({ label: 'f′ s’annule en', format: texte });
  const rInf = lab.readout({ label: 'f″ s’annule en', format: texte });

  /* ── outils ───────────────────────────────────────────────────────────── */
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
  function joliPas(span, cible) {
    const brut = span / Math.max(1, cible);
    const p = Math.pow(10, Math.floor(Math.log10(brut) || 0));
    const n = brut / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }
  const fonc = () => FONCTIONS.find((F) => F.id === choix.value);

  function majDom() {
    const F = fonc();
    cur.el.min = F.dom[0]; cur.el.max = F.dom[1];
    cur.el.step = (F.dom[1] - F.dom[0]) / 2000;
    // on se place là où il se passe quelque chose : au premier zéro de f′ décalé,
    // faute de quoi le curseur ouvre sur une portion sans intérêt
    const r = racines(F.d1, F.dom, F.trous);
    cur.set(r.length ? r[0] + (F.dom[1] - F.dom[0]) * 0.12 : (F.dom[0] + F.dom[1]) / 2);
  }

  /* Une échelle robuste. Sur x + 1/x les valeurs partent à l'infini près de
     zéro : prendre le minimum et le maximum écraserait toute la courbe sur deux
     traits. On coupe donc aux centiles, et l'on garde toujours l'axe des
     abscisses, dont le franchissement est justement ce qu'on regarde. */
  function plage(vals, avecZero) {
    const f = vals.filter((v) => isFinite(v)).sort((a, b) => a - b);
    if (!f.length) return [-1, 1];
    const q = (p) => f[Math.min(f.length - 1, Math.max(0, Math.round(p * (f.length - 1))))];
    let lo = q(0.03), hi = q(0.97);
    if (avecZero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    const m = (hi - lo) * 0.14;
    return [lo - m, hi + m];
  }

  let cadres = null;

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    regle = mk('text', { x: -9999, y: -9999, fill: 'none' }, svg);
    const { w: W, h: H } = lab.size();
    const F = fonc();
    const x = cur.value;
    const [a, b] = F.dom;

    const fsT = Math.max(12, Math.min(16, W / 46));
    txt(svg, 10, 8 + fsT, F.nom, { fs: fsT, bold: true, mono: true });
    txt(svg, 10, 10 + fsT * 2, 'Tirez le curseur : la tangente, le signe de f′ et la courbure '
      + 'changent ensemble.', { fs: 10.5, fill: 'var(--ink-soft)' });
    const haut = 18 + fsT * 2;

    // combien de panneaux, et leur part de la hauteur
    const panneaux = [{ q: 'f', k: 1 }];
    if (vDeriv.value) panneaux.push({ q: 'd1', k: 0.62 });
    if (vSeconde.value) panneaux.push({ q: 'd2', k: 0.62 });
    const SH = 17;                                       // hauteur d'une bande de signes
    const bandes = (vTableau.value ? 1 : 0) + (vSeconde.value && vTableau.value ? 1 : 0);
    const gap = 8;
    // 18 px réservés en bas pour les graduations de l'axe des abscisses. Elles
    // étaient dessinées sous le dernier panneau, donc SOUS la bande de convexité
    // tracée ensuite, qui les recouvrait : invisibles, et pourtant présentes.
    const AXE = 18;
    const dispo = H - haut - 8 - AXE - bandes * SH - (panneaux.length - 1) * gap;
    const somme = panneaux.reduce((s, p) => s + p.k, 0);
    const G = { l: 46, r: 12 };
    const L = G.l, R = W - G.r;
    const X = (v) => L + ((v - a) / (b - a)) * (R - L);
    cadres = { X, a, b, L, R };

    const r1 = racines(F.d1, F.dom, F.trous);
    const r2 = racines(F.d2, F.dom, F.trous);
    const N = Math.max(200, Math.round(R - L));
    const ech = [];
    for (let i = 0; i <= N; i++) {
      const xx = a + ((b - a) * i) / N;
      const trou = F.trous.some((t) => Math.abs(xx - t) < (b - a) / N);
      ech.push({ x: xx, trou, f: trou ? NaN : F.f(xx), d1: trou ? NaN : F.d1(xx), d2: trou ? NaN : F.d2(xx) });
    }

    let y = haut;
    panneaux.forEach((p, idx) => {
      const h = (dispo * p.k) / somme;
      const box = { x: L, y, w: R - L, h };
      const vals = ech.map((e) => e[p.q]);
      const [lo, hi] = plage(vals, p.q !== 'f');
      const Y = (v) => box.y + box.h - ((v - lo) / (hi - lo)) * box.h;
      panneau(box, X, Y, lo, hi, ech, p.q, F, x, r1, r2);
      y += h;
      // la bande de signes qui accompagne ce panneau
      if (vTableau.value && p.q === 'f') { bandeVariations(L, y, R - L, SH, X, F, r1); y += SH; }
      if (vTableau.value && p.q === 'd2') { bandeConvexite(L, y, R - L, SH, X, F, r2); y += SH; }
      y += idx < panneaux.length - 1 ? gap : 0;
    });

    // les graduations de l'abscisse, une seule fois, sous tout l'empilement
    const px0 = joliPas(b - a, 6);
    const decx0 = Math.max(0, -Math.floor(Math.log10(px0) + 1e-9));
    for (let v = Math.ceil(a / px0) * px0; v <= b + 1e-9; v += px0) {
      txt(svg, X(v), y + 13, fr(v, decx0),
        { fs: 9.5, anchor: 'middle', mono: true, fill: 'var(--ink-soft)' });
    }
    // pas de « x » en bout d'axe : il tombait sur la dernière graduation, et les
    // valeurs alignées sous les trois panneaux ne laissent aucun doute sur ce
    // qu'elles graduent

    /* ── mesures ── */
    const vf = F.f(x), v1 = F.d1(x), v2 = F.d2(x);
    const dansTrou = F.trous.some((t) => Math.abs(x - t) < (b - a) * 0.004);
    rF.set(dansTrou ? 'non définie' : fr(vf, 4));
    rD1.set(dansTrou ? '—' : fr(v1, 4));
    rSens.set(dansTrou ? '—' : Math.abs(v1) < 1e-7 ? 'stationnaire : f′(x) = 0'
      : v1 > 0 ? 'croissante' : 'décroissante');
    rD2.set(dansTrou ? '—' : fr(v2, 4));
    rConv.set(dansTrou ? '—' : Math.abs(v2) < 1e-7 ? 'inflexion possible : f″(x) = 0'
      : v2 > 0 ? 'convexe (tourne vers le haut)' : 'concave (tourne vers le bas)');
    // l'équation de la tangente, écrite comme on l'écrit sur une copie
    if (dansTrou || !isFinite(vf) || !isFinite(v1)) rTan.set('—');
    else {
      const p0 = vf - v1 * x;
      rTan.set('y = ' + fr(v1, 3) + ' x ' + (p0 < 0 ? '− ' : '+ ') + fr(Math.abs(p0), 3));
    }
    rExt.set(r1.length
      ? r1.map((v) => fr(v, 4) + ' (' + (nature(F, v, 'd1') || '?') + ')').join('   ')
      : 'jamais : pas d’extremum');
    rInf.set(r2.length
      ? r2.map((v) => fr(v, 4)).join('   ')
      : 'jamais : courbure de signe constant');

    if (regle) { regle.remove(); regle = null; }
  }

  /* ── un panneau : la courbe, l'axe, le curseur ────────────────────────── */
  function panneau(box, X, Y, lo, hi, ech, q, F, xc, r1, r2) {
    const g = mk('g', {}, svg);
    mk('rect', { x: box.x, y: box.y, width: box.w, height: box.h, fill: 'var(--paper)',
      stroke: 'var(--rule)', 'stroke-width': 1 }, g);
    const cid = 'cadre-' + q;
    mk('rect', { x: box.x, y: box.y, width: box.w, height: box.h },
      mk('clipPath', { id: cid }, mk('defs', {}, g)));
    const dedans = mk('g', { 'clip-path': 'url(#' + cid + ')' }, g);

    // graduations en y, et l'axe des abscisses en gras : c'est la ligne dont le
    // franchissement fait tout le sens de f′ et de f″
    const py = joliPas(hi - lo, 3);
    const dec = Math.max(0, -Math.floor(Math.log10(py) + 1e-9));
    for (let v = Math.ceil(lo / py) * py; v <= hi + 1e-9; v += py) {
      const zero = Math.abs(v) < py * 1e-6;
      mk('line', { x1: box.x, y1: Y(v), x2: box.x + box.w, y2: Y(v),
        stroke: zero ? 'var(--ink-soft)' : 'var(--rule)',
        'stroke-width': zero ? 1.4 : 1, opacity: zero ? 0.8 : 0.4 }, dedans);
      txt(g, box.x - 5, Y(v) + 3.5, fr(v, dec), { fs: 9, anchor: 'end', mono: true, fill: 'var(--ink-soft)' });
    }
    // ici le quadrillage seulement : les valeurs de x sont écrites une seule
    // fois, sous tout l'empilement
    const px = joliPas(cadres.b - cadres.a, 6);
    for (let v = Math.ceil(cadres.a / px) * px; v <= cadres.b + 1e-9; v += px) {
      mk('line', { x1: X(v), y1: box.y, x2: X(v), y2: box.y + box.h, stroke: 'var(--rule)',
        'stroke-width': 1, opacity: 0.3 }, dedans);
    }

    /* La courbe. On coupe le tracé partout où il y a un trou ou un saut : une
       hyperbole dont les deux branches sont reliées par un trait vertical est un
       mensonge graphique, et c'est celui que font la plupart des calculatrices. */
    const seuil = (hi - lo) * 1.6;
    let d = '', ouvert = false, yPrec = null;
    ech.forEach((e) => {
      const v = e[q];
      if (e.trou || !isFinite(v)) { ouvert = false; yPrec = null; return; }
      if (yPrec != null && Math.abs(v - yPrec) > seuil) ouvert = false;
      d += (ouvert ? 'L' : 'M') + X(e.x).toFixed(1) + ' ' + Y(v).toFixed(1);
      ouvert = true; yPrec = v;
    });
    const couleur = q === 'f' ? 'var(--sub)' : q === 'd1' ? '#c9772b' : '#7b5ea7';
    mk('path', { d, fill: 'none', stroke: couleur, 'stroke-width': q === 'f' ? 2.2 : 1.7,
      'stroke-linejoin': 'round' }, dedans);
    txt(g, box.x + 6, box.y + 13, q === 'f' ? 'f' : q === 'd1' ? 'f′' : 'f″',
      { fs: 12, bold: true, mono: true, fill: couleur, halo: true });

    // les asymptotes verticales, en pointillé : elles font partie de l'étude
    F.trous.forEach((t) => {
      mk('line', { x1: X(t), y1: box.y, x2: X(t), y2: box.y + box.h, stroke: '#c1440e',
        'stroke-width': 1.2, 'stroke-dasharray': '4 3', opacity: 0.75 }, dedans);
    });

    // les points remarquables, reportés sur les trois panneaux
    if (vPoints.value) {
      r1.forEach((v) => {
        const yy = q === 'f' ? F.f(v) : q === 'd1' ? 0 : F.d2(v);
        if (!isFinite(yy)) return;
        mk('circle', { cx: X(v), cy: Y(yy), r: 4, fill: 'none', stroke: '#c9772b', 'stroke-width': 2 }, dedans);
      });
      r2.forEach((v) => {
        const yy = q === 'f' ? F.f(v) : q === 'd1' ? F.d1(v) : 0;
        if (!isFinite(yy)) return;
        mk('rect', { x: X(v) - 3.4, y: Y(yy) - 3.4, width: 6.8, height: 6.8,
          fill: 'none', stroke: '#7b5ea7', 'stroke-width': 2, transform: 'rotate(45 ' + X(v) + ' ' + Y(yy) + ')' }, dedans);
      });
    }

    // la tangente, seulement sur f : c'est là qu'elle veut dire quelque chose
    if (q === 'f' && vTangente.value) {
      const y0 = F.f(xc), m = F.d1(xc);
      if (isFinite(y0) && isFinite(m)) {
        const dx = cadres.b - cadres.a;
        mk('line', { x1: X(xc - dx), y1: Y(y0 - m * dx), x2: X(xc + dx), y2: Y(y0 + m * dx),
          stroke: '#c9772b', 'stroke-width': 1.6, opacity: 0.95 }, dedans);
      }
    }

    // le curseur, sur les trois panneaux à la même abscisse
    mk('line', { x1: X(xc), y1: box.y, x2: X(xc), y2: box.y + box.h, stroke: 'var(--ink)',
      'stroke-width': 1.3, opacity: 0.7 }, dedans);
    const vv = F[q === 'f' ? 'f' : q](xc);
    if (isFinite(vv) && vv >= lo && vv <= hi) {
      mk('circle', { cx: X(xc), cy: Y(vv), r: 5, fill: couleur, stroke: 'var(--paper)', 'stroke-width': 1.8 }, dedans);
    }
  }

  /* ── le tableau de variations, engendré ───────────────────────────────── */
  function bandeVariations(x0, y0, w, h, X, F, r1) {
    const g = mk('g', {}, svg);
    mk('rect', { x: x0, y: y0, width: w, height: h, fill: 'var(--paper-2)',
      stroke: 'var(--rule)', 'stroke-width': 1 }, g);
    const { morceaux } = variations(F);
    morceaux.forEach((m) => {
      const xa = X(m.x0), xb = X(m.x1);
      mk('rect', { x: xa, y: y0, width: xb - xa, height: h,
        fill: m.croissante ? '#2a9d8f' : '#c1440e', 'fill-opacity': 0.16 }, g);
      // La flèche évite les soixante-dix premiers pixels : le libellé « signe de
      // f′ » y est posé, et sur un intervalle qui commence au bord gauche les
      // deux se superposaient.
      if (xb - xa > 22 && (xa + xb) / 2 > x0 + 70) {
        txt(g, (xa + xb) / 2, y0 + h * 0.72, m.croissante ? '↗' : '↘',
          { fs: 13, anchor: 'middle', bold: true, fill: m.croissante ? '#2a9d8f' : '#c1440e' });
      }
    });
    // les bornes intérieures, tracées : ce sont les colonnes du tableau
    variations(F).coupures.slice(1, -1).forEach((v) => {
      mk('line', { x1: X(v), y1: y0, x2: X(v), y2: y0 + h, stroke: 'var(--ink-soft)', 'stroke-width': 1 }, g);
    });
    /* Le libellé tient dans la bande, pas dans la gouttière de gauche : « signe
       de f′ » y fait cinquante-cinq pixels pour quarante-six disponibles, et
       sortait donc du cadre par la gauche. Un halo le garde lisible par-dessus
       la couleur. */
    txt(g, x0 + 5, y0 + h * 0.72, 'signe de f′', { fs: 9, bold: true, fill: 'var(--ink-soft)', halo: true });
    r1.forEach((v) => {
      const n = nature(F, v, 'd1');
      if (!n || n === 'sans changement de signe') return;
      txt(g, X(v), y0 - 2, n === 'maximum' ? 'max' : 'min',
        { fs: 8.5, anchor: 'middle', bold: true, fill: '#c9772b', halo: true });
    });
  }

  function bandeConvexite(x0, y0, w, h, X, F, r2) {
    const g = mk('g', {}, svg);
    mk('rect', { x: x0, y: y0, width: w, height: h, fill: 'var(--paper-2)',
      stroke: 'var(--rule)', 'stroke-width': 1 }, g);
    const [a, b] = F.dom;
    const bornes = [a, ...r2, ...F.trous, b].filter((v) => v >= a && v <= b).sort((p, q) => p - q);
    for (let i = 0; i + 1 < bornes.length; i++) {
      const m = (bornes[i] + bornes[i + 1]) / 2;
      const s = F.d2(m);
      if (!isFinite(s)) continue;
      const xa = X(bornes[i]), xb = X(bornes[i + 1]);
      mk('rect', { x: xa, y: y0, width: xb - xa, height: h,
        fill: s > 0 ? '#7b5ea7' : '#e09f3e', 'fill-opacity': 0.18 }, g);
      if (xb - xa > 40 && (xa + xb) / 2 > x0 + 78) {
        txt(g, (xa + xb) / 2, y0 + h * 0.74, s > 0 ? 'convexe  ∪' : 'concave  ∩',
          { fs: 9, anchor: 'middle', bold: true, fill: s > 0 ? '#7b5ea7' : '#b8791f' });
      }
    }
    txt(g, x0 + 5, y0 + h * 0.72, 'signe de f″', { fs: 9, bold: true, fill: 'var(--ink-soft)', halo: true });
  }

  /* ── tirer le curseur ─────────────────────────────────────────────────── */
  function versX(evt) {
    if (!cadres) return null;
    const r = svg.getBoundingClientRect();
    const { w: W } = lab.size();
    const px = ((evt.clientX - r.left) / r.width) * W;
    const v = cadres.a + ((px - cadres.L) / (cadres.R - cadres.L)) * (cadres.b - cadres.a);
    return Math.max(cadres.a, Math.min(cadres.b, v));
  }
  let tire = false;
  const onDown = (e) => { const v = versX(e); if (v == null) return; tire = true; cur.set(v); dessine(); };
  const onMove = (e) => { if (!tire) return; const v = versX(e); if (v != null) { cur.set(v); dessine(); } };
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

  majDom();
  lab.onResize(dessine);
  dessine();
}
