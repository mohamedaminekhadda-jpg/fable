// Les changements d'état, et les paliers qu'on ne soupçonne pas.
//
// Tout le monde sait que la glace fond à 0 °C et que l'eau bout à 100 °C.
// Presque personne ne sait que faire bouillir un litre d'eau déjà à 100 °C
// demande CINQ FOIS PLUS d'énergie que de l'amener de 0 à 100. C'est ce que
// montre le palier : pendant qu'il dure, on chauffe sans que la température
// bouge d'un dixième, parce que l'énergie sert à défaire les liaisons et non à
// agiter davantage.
//
// La simulation ne raconte pas ça : elle le fait mesurer. Le curseur apporte de
// l'énergie, la courbe se trace, et les deux paliers se comparent à l'œil comme
// deux longueurs.
//
// ── LE MODÈLE ──────────────────────────────────────────────────────────────
// Une seule fonction, morceau par morceau, avec les valeurs des tables :
//
//   chauffer le solide   Q = m·c_s·ΔT      la pente vaut 1/c_s
//   fondre               Q = m·L_f         palier à T_fusion
//   chauffer le liquide  Q = m·c_l·ΔT
//   vaporiser            Q = m·L_v         palier à T_ébullition
//
// La courbe s'arrête à la vaporisation complète. Chauffer la vapeur demanderait
// des capacités thermiques de gaz que les tables scolaires ne donnent pas pour
// les métaux — et une branche « indicative » n'a rien à faire sur une page qui
// promet que tout est calculé.

/* Quatre corps purs, valeurs des tables (J/kg/K pour les capacités,
   J/kg pour les chaleurs latentes). L'eau et trois métaux : c'est le contraste
   qui apprend quelque chose, pas l'accumulation. */
export const CORPS = [
  { value: 'eau', label: 'Eau', T0: -20, cs: 2090, cl: 4185, Tf: 0, Tb: 100,
    Lf: 334e3, Lv: 2257e3, nomS: 'glace', nomL: 'eau liquide', nomG: 'vapeur d’eau' },
  { value: 'plomb', label: 'Plomb', T0: 20, cs: 128, cl: 140, Tf: 327.5, Tb: 1749,
    Lf: 23e3, Lv: 871e3, nomS: 'plomb solide', nomL: 'plomb fondu', nomG: 'vapeur de plomb' },
  { value: 'aluminium', label: 'Aluminium', T0: 20, cs: 897, cl: 1180, Tf: 660.3, Tb: 2519,
    Lf: 397e3, Lv: 10900e3, nomS: 'aluminium solide', nomL: 'aluminium fondu', nomG: 'vapeur d’aluminium' },
  { value: 'fer', label: 'Fer', T0: 20, cs: 449, cl: 820, Tf: 1538, Tb: 2862,
    Lf: 247e3, Lv: 6090e3, nomS: 'fer solide', nomL: 'fer fondu', nomG: 'vapeur de fer' },
];

/* Les quatre bornes du parcours, en énergie par kilogramme (J/kg). */
export function bornes(c) {
  const q1 = c.cs * (c.Tf - c.T0);       // fin du chauffage du solide
  const q2 = q1 + c.Lf;                  // fin de la fusion
  const q3 = q2 + c.cl * (c.Tb - c.Tf);  // fin du chauffage du liquide
  const q4 = q3 + c.Lv;                  // fin de la vaporisation
  return { q1, q2, q3, q4 };
}

/* L'état du corps quand on lui a apporté q joules par kilogramme. */
export function etat(c, q) {
  const { q1, q2, q3, q4 } = bornes(c);
  if (q <= q1) return { T: c.T0 + q / c.cs, phase: 'solide', part: 0 };
  if (q <= q2) return { T: c.Tf, phase: 'fusion', part: (q - q1) / c.Lf };
  if (q <= q3) return { T: c.Tf + (q - q2) / c.cl, phase: 'liquide', part: 1 };
  if (q <= q4) return { T: c.Tb, phase: 'vaporisation', part: (q - q3) / c.Lv };
  return { T: c.Tb, phase: 'vapeur', part: 1 };
}

const NGRAIN = 54;

export function mount(lab) {
  const { make, fr } = lab;
  const svg = lab.svg();
  let temps = 0;

  const quoi = lab.select({ label: 'Le corps pur', options: CORPS, value: 'eau',
    onChange: dessine });
  const avance = lab.slider({ label: 'Énergie apportée', min: 0, max: 100, step: 0.2,
    value: 0, unit: '%', dec: 1, onInput: dessine });
  const masse = lab.slider({ label: 'Masse chauffée', min: 0.1, max: 2, step: 0.1,
    value: 0.5, unit: 'kg', dec: 1, onInput: dessine });
  const grains = lab.check({ label: 'Montrer les molécules', value: true, onChange: dessine });

  const txt = (v) => (v == null ? '—' : String(v));
  lab.group('Le thermomètre');
  const rT = lab.readout({ label: 'Température', format: txt, hi: true });
  const rPhase = lab.readout({ label: 'État', format: txt });
  const rPart = lab.readout({ label: 'Avancement du changement', format: txt });
  lab.group('L’énergie');
  const rQ = lab.readout({ label: 'Apportée', format: txt });
  const rBouilloire = lab.readout({ label: 'Avec une plaque de 2 000 W', format: txt });
  lab.group('Ce que coûte chaque étape');
  const rChauf = lab.readout({ label: 'Chauffer le liquide', format: txt });
  const rVap = lab.readout({ label: 'Le vaporiser', format: txt, hi: true });

  const corps = () => CORPS.find((c) => c.value === quoi.value);

  /* ── outils ────────────────────────────────────────────────────────────── */
  let regle = null;
  const mesure = (s, fs) => {
    if (!regle) return String(s).length * fs * 0.55;
    regle.setAttribute('font-size', fs);
    regle.textContent = String(s);
    return regle.getComputedTextLength() || String(s).length * fs * 0.55;
  };
  function T(p, x, y, s, a = {}) {
    const t = make('text', { x, y, 'font-size': a.fs || 11, fill: a.fill || 'var(--ink)',
      'text-anchor': a.anchor || 'middle', 'font-weight': a.bold ? 600 : 400,
      'font-family': a.mono ? 'var(--mono)' : 'inherit', opacity: a.op != null ? a.op : 1 }, p);
    t.textContent = s;
    return t;
  }
  function coupe(s, largeur, fs) {
    const mots = String(s).split(/\s+/), out = [];
    let l = '';
    mots.forEach((m) => {
      if (!l) { l = m; return; }
      const e = l + ' ' + m;
      if (mesure(e, fs) <= largeur) l = e; else { out.push(l); l = m; }
    });
    if (l) out.push(l);
    return out;
  }

  const graphe = lab.chart({
    x: { label: 'énergie apportée', unit: 'kJ/kg', min: 0 },
    y: { label: 'température', unit: '°C' },
  });

  /* Un bruit déterministe : la même molécule garde la même trajectoire d'un
     tracé à l'autre, sinon la matière « grouille » sans raison à chaque
     redessin. Pas de Math.random ici — le désordre doit être reproductible. */
  const bruit = (i, k) => {
    const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    regle = make('text', { x: -9999, y: -9999, fill: 'none' }, svg);
    const { w: W, h: H } = lab.size();
    const c = corps();
    const B = bornes(c);
    const q = (avance.value / 100) * B.q4;
    const e = etat(c, q);
    const m = masse.value;

    const fsT = Math.max(13, Math.min(18, W / 42));
    T(svg, 12, 10 + fsT, 'Chauffer ' + c.label.toLowerCase() + ', sans jamais s’arrêter',
      { fs: fsT, bold: true, anchor: 'start' });
    const lignes = coupe('Apportez de l’énergie et regardez le thermomètre : deux fois, '
      + 'il refuse de monter. C’est là que l’état change.', W - 24, 11.5);
    lignes.forEach((l, i) => T(svg, 12, 12 + fsT * 2 + i * 13, l,
      { fs: 11.5, anchor: 'start', fill: 'var(--ink-soft)' }));
    const haut = 12 + fsT * 2 + lignes.length * 13 + 10;

    const cote = W >= 680;
    const Lw = cote ? Math.min(230, W * 0.28) : W;
    if (grains.value) {
      matiere(cote ? { x: 10, y: haut, w: Lw - 16, h: H - haut - 10 }
        : { x: 10, y: haut, w: W - 20, h: 96 }, e, c);
    }
    const gb = grains.value
      ? (cote ? { x: Lw, y: haut, w: W - Lw - 10, h: H - haut - 8 }
        : { x: 0, y: haut + 104, w: W, h: H - haut - 112 })
      : { x: 0, y: haut, w: W, h: H - haut - 8 };
    if (gb.w > 190 && gb.h > 130) courbe(gb, c, B, q, e);

    /* ── les mesures ── */
    rT.set(fr(e.T, 1) + ' °C');
    rPhase.set(e.phase === 'solide' ? c.nomS
      : e.phase === 'liquide' ? c.nomL
        : e.phase === 'vapeur' ? c.nomG
          : e.phase === 'fusion' ? 'EN TRAIN DE FONDRE' : 'EN TRAIN DE BOUILLIR');
    rPart.set(e.phase === 'fusion' || e.phase === 'vaporisation'
      ? fr(e.part * 100, 0) + ' % du corps a changé d’état — température figée'
      : 'aucun changement en cours');
    rQ.set(fr((q * m) / 1000, 1) + ' kJ   pour ' + fr(m, 1) + ' kg');
    const s = (q * m) / 2000;
    rBouilloire.set(s < 90 ? fr(s, 0) + ' s'
      : s < 5400 ? fr(s / 60, 1) + ' min' : fr(s / 3600, 1) + ' h');
    const chauffer = c.cl * (c.Tb - c.Tf);
    rChauf.set(fr(chauffer / 1000, 0) + ' kJ/kg   (de ' + fr(c.Tf, 0) + ' à ' + fr(c.Tb, 0) + ' °C)');
    rVap.set(fr(c.Lv / 1000, 0) + ' kJ/kg   soit ' + fr(c.Lv / chauffer, 1) + ' fois plus');
    if (regle) { regle.remove(); regle = null; }
  }

  /* ── la matière, molécule par molécule ─────────────────────────────────── */
  function matiere(b, e, c) {
    const g = make('g', {}, svg);
    const cx = b.x + b.w / 2;
    const hCuve = Math.min(b.h - 34, 210);
    const wCuve = Math.min(b.w - 10, 128);
    const x0 = cx - wCuve / 2, y0 = b.y + 6;

    make('path', { d: 'M' + x0 + ' ' + y0 + 'v' + hCuve + 'h' + wCuve + 'V' + y0,
      fill: 'none', stroke: 'var(--ink-soft)', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g);

    /* La part déjà changée d'état donne la part des molécules qui ont changé de
       comportement : à mi-palier, la moitié de la glace est de l'eau. C'est
       exactement ce que « fondre » veut dire. */
    const partLiquide = e.phase === 'solide' ? 0
      : e.phase === 'fusion' ? e.part : 1;
    const partGaz = e.phase === 'vaporisation' ? e.part : e.phase === 'vapeur' ? 1 : 0;
    // l'agitation croît avec la température, dans la phase où l'on se trouve
    const chaud = Math.max(0, Math.min(1, (e.T - c.T0) / (c.Tb - c.T0)));

    const cols = 6, rows = Math.ceil(NGRAIN / cols);
    for (let i = 0; i < NGRAIN; i++) {
      const gaz = i / NGRAIN < partGaz;
      const liq = !gaz && i / NGRAIN < partLiquide;
      const col = i % cols, row = Math.floor(i / cols);
      let px, py, r = 4.4;
      if (gaz) {
        // partout dans la cuve, vite
        const ph = temps * 1.6 + bruit(i, 1) * 40;
        px = x0 + 8 + (wCuve - 16) * (0.5 + 0.5 * Math.sin(ph * (0.5 + bruit(i, 2))));
        py = y0 + 8 + (hCuve - 16) * (0.5 + 0.5 * Math.cos(ph * (0.4 + bruit(i, 3)) + bruit(i, 4) * 6));
        r = 3.4;
      } else if (liq) {
        // désordonné, glisse les uns sur les autres, occupe le bas
        /* Le reste de division de JavaScript GARDE LE SIGNE : (0,05 − 0,14) % 1
           vaut −0,09, pas 0,91, et la molécule sortait par le côté du bécher.
           On ramène donc dans [0, 1[ à la main. */
        const ph = temps * 0.9 + bruit(i, 5) * 30;
        const dansUn = (x) => x - Math.floor(x);
        const u = dansUn(bruit(i, 6) + 0.14 * Math.sin(ph));
        const v = dansUn(bruit(i, 7) + 0.10 * Math.cos(ph * 1.3));
        px = x0 + 9 + (wCuve - 18) * u;
        py = y0 + hCuve - 9 - (hCuve * 0.52) * v;
      } else {
        // le réseau du solide : chacun vibre autour de sa place, sans la quitter
        const a = 0.6 + 1.9 * chaud;
        px = x0 + 12 + ((wCuve - 24) * col) / (cols - 1) + a * Math.sin(temps * 5 + i);
        py = y0 + hCuve - 12 - ((hCuve * 0.55) * row) / (rows - 1) + a * Math.cos(temps * 6.2 + i * 2);
      }
      make('circle', { cx: px, cy: py, r,
        fill: gaz ? 'var(--ink-mute)' : liq ? 'var(--sub)' : 'var(--sub)',
        'fill-opacity': gaz ? 0.5 : liq ? 0.72 : 0.95,
        stroke: gaz ? 'none' : 'var(--paper)', 'stroke-width': 1 }, g);
    }
    T(g, cx, y0 + hCuve + 16, fr(masse.value, 1) + ' kg de ' + c.label.toLowerCase(),
      { fs: 10, fill: 'var(--ink-soft)' });
    T(g, cx, y0 + hCuve + 29, fr(e.T, 1) + ' °C',
      { fs: 12, mono: true, bold: true, fill: 'var(--sub)' });
  }

  /* ── la courbe de chauffage ────────────────────────────────────────────── */
  function courbe(b, c, B, q, e) {
    // la courbe complète, en quatre morceaux — c'est la figure du cours, et la
    // cacher n'apprendrait rien : ce qu'on cherche ici, ce sont les LONGUEURS
    const pts = [[0, c.T0], [B.q1 / 1000, c.Tf], [B.q2 / 1000, c.Tf],
      [B.q3 / 1000, c.Tb], [B.q4 / 1000, c.Tb]];
    const faits = pts.filter((p) => p[0] <= q / 1000);
    faits.push([q / 1000, e.T]);
    const g = graphe.draw(svg, b, {
      curves: [
        { pts, color: 'var(--ink-mute)', width: 1.2, dash: '4 4', opacity: 0.55 },
        ...(faits.length > 1 ? [{ pts: faits, color: 'var(--sub)', width: 2.4 }] : []),
      ],
      points: [{ x: q / 1000, y: e.T, r: 4.5 }],
    });
    const box = graphe.box;
    if (!box) return;
    // les deux paliers, mesurés en travers du graphe
    const palier = (qa, qb, nom, cl) => {
      const xa = box.X(qa / 1000), xb = box.X(qb / 1000), yy = box.Y(cl);
      make('line', { x1: xa, y1: yy, x2: xb, y2: yy, stroke: 'var(--sub)',
        'stroke-width': 5, opacity: 0.18, 'stroke-linecap': 'round' }, g);
      if (xb - xa > 40) {
        T(g, (xa + xb) / 2, yy - 9, nom + ' : ' + fr((qb - qa) / 1000, 0) + ' kJ/kg',
          { fs: 9.5, fill: 'var(--ink-soft)' });
      }
    };
    palier(B.q1, B.q2, 'fusion', c.Tf);
    palier(B.q3, B.q4, 'vaporisation', c.Tb);
  }

  lab.loop((dt, t) => { temps = t; dessine(); });
  lab.onResize(dessine);
  lab.onReset(() => { avance.set(0); dessine(); });
  dessine();
}
