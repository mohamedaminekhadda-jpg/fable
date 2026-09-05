// Les puissances comparées — trois façons de poser la même question.
//
// « Qui est puissant ? » n'a pas une réponse mais six, et elles ne désignent
// pas le même pays. Le classement le montre indicateur par indicateur ; le
// radar met deux puissances face à face sur les six à la fois ; la troisième
// vue déroule quarante-quatre ans de part du PIB mondial, où l'on voit une
// courbe monter de 1,7 % à 17 % pendant qu'une autre descend.
//
// La case « par habitant » est le bouton le plus important de la page : elle
// retourne presque tous les classements, et c'est exactement ce qu'un sujet de
// baccalauréat attend qu'on sache dire.

import {
  PUISSANCES, INDICATEURS, AXES, MONDE, ANNEES, BANDES,
  classement, part, partAnnee,
} from './puissances.js';

const VUES = [
  { value: 'classement', label: 'un indicateur, dix puissances' },
  { value: 'radar', label: 'deux puissances, six indicateurs' },
  { value: 'histoire', label: 'la part du PIB mondial depuis 1980' },
];
const R_MAX = 0.40;              // le rayon du radar vaut 40 % du monde

export function mount(lab) {
  const { fr } = lab;
  const svg = lab.svg();
  const texte = (v) => (v == null ? '—' : String(v));

  /* ── réglages ─────────────────────────────────────────────────────────── */
  const vue = lab.select({ label: 'Ce qu’on regarde', options: VUES, value: 'classement',
    onChange: () => { majControles(); dessine(); } });

  const ind = lab.select({ label: 'Indicateur',
    options: INDICATEURS.map((i) => ({ value: i.id, label: i.nom })), value: 'pib',
    onChange: () => { majControles(); dessine(); } });
  const parHab = lab.check({ label: 'Par habitant', onChange: dessine });
  const log = lab.check({ label: 'Échelle logarithmique', onChange: dessine });

  const opts = PUISSANCES.map((p) => ({ value: p.id, label: p.nom }));
  const A = lab.select({ label: 'Puissance', options: opts, value: 'usa', onChange: dessine });
  const B = lab.select({ label: 'Comparer à',
    options: [{ value: '', label: '— aucune —' }].concat(opts), value: 'maroc', onChange: dessine });

  const an = lab.slider({ label: 'Année', min: ANNEES[0], max: ANNEES[ANNEES.length - 1], step: 1,
    value: ANNEES[ANNEES.length - 1], dec: 0, format: (v) => String(Math.round(v)), onInput: dessine });

  /* ── mesures, un jeu par vue ──────────────────────────────────────────── */
  const gCl = lab.group('Ce que dit le classement');
  const rPremier = lab.readout({ label: '1ᵉʳ', format: texte });
  const rDeuxieme = lab.readout({ label: '2ᵉ', format: texte });
  const rMaroc = lab.readout({ label: 'Maroc', format: texte, hi: true });
  const rRapport = lab.readout({ label: 'Du 1ᵉʳ au dernier', format: texte });
  const rMonde = lab.readout({ label: 'Référence mondiale', format: texte });
  const clRows = [rPremier, rDeuxieme, rMaroc, rRapport, rMonde];

  const gRa = lab.group('Part du monde, axe par axe');
  const raRows = AXES.map((id) => {
    const i = INDICATEURS.find((x) => x.id === id);
    return { id, row: lab.readout({ label: i.nom.length > 18 ? i.nom.slice(0, 16) + '…' : i.nom, format: texte }) };
  });

  const gHi = lab.group('Part du PIB mondial');
  const hiRows = BANDES.map((b) => ({ b, row: lab.readout({ label: b.nom, unit: ' %', dec: 1 }) }));

  function majControles() {
    const v = vue.value;
    const I = INDICATEURS.find((i) => i.id === ind.value);
    ind.show(v === 'classement');
    parHab.show(v === 'classement' && !!I.parHab);
    log.show(v === 'classement');
    A.show(v === 'radar'); B.show(v === 'radar');
    an.show(v === 'histoire');
    gCl.hidden = v !== 'classement';
    clRows.forEach((r) => r.show(v === 'classement'));
    gRa.hidden = v !== 'radar';
    raRows.forEach((r) => r.row.show(v === 'radar'));
    gHi.hidden = v !== 'histoire';
    hiRows.forEach((r) => r.row.show(v === 'histoire'));
  }

  /* ── outils de tracé ──────────────────────────────────────────────────── */
  const mk = (t, a, p) => lab.make(t, a, p);
  let regle = null;
  function mesure(s, fs, bold) {
    if (!regle) return String(s).length * fs * 0.52;
    regle.setAttribute('font-size', fs);
    regle.setAttribute('font-weight', bold ? 600 : 400);
    regle.textContent = String(s);
    return regle.getComputedTextLength() || String(s).length * fs * 0.52;
  }
  function txt(p, x, y, s, a = {}) {
    const t = mk('text', { x, y, 'font-size': a.fs || 12, fill: a.fill || 'var(--ink)',
      'text-anchor': a.anchor || 'start', 'font-weight': a.bold ? 600 : 400,
      'font-family': a.mono ? 'var(--mono)' : 'inherit', opacity: a.op != null ? a.op : 1 }, p);
    t.textContent = s;
    return t;
  }
  const val = (v, d) => fr(v, d);
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
  /* Le bandeau de titre rend la hauteur qu'il a réellement prise. Les
     sous-titres tiennent sur une ligne à 1 400 pixels et sur deux à 900 : une
     hauteur écrite en dur marchait donc sur l'écran où je l'avais réglée, et
     sur celui-là seulement. */
  function bandeau(titre, sous, W) {
    const fsT = Math.max(12, Math.min(16, W / 46));
    let y = 8 + fsT;
    coupe(titre, W - 20, fsT, true).forEach((l) => { txt(svg, 10, y, l, { fs: fsT, bold: true }); y += fsT * 1.2; });
    y += 2;
    coupe(sous, W - 20, 10.5).forEach((l) => { txt(svg, 10, y, l, { fs: 10.5, fill: 'var(--ink-soft)' }); y += 12.5; });
    return y + 4;
  }

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    regle = mk('text', { x: -9999, y: -9999, fill: 'none' }, svg);
    const { w: W, h: H } = lab.size();
    if (vue.value === 'classement') barres(W, H);
    else if (vue.value === 'radar') radar(W, H);
    else histoire(W, H);
    if (regle) { regle.remove(); regle = null; }
  }

  /* ── vue 1 : le classement ────────────────────────────────────────────── */
  function barres(W, H) {
    const I = INDICATEURS.find((i) => i.id === ind.value);
    const ph = parHab.value && !!I.parHab;
    const spec = ph ? I.parHab : I;
    const l = classement(I, ph);
    const dec = spec.dec != null ? spec.dec : I.dec;

    const y0 = bandeau(
      I.nom + (ph ? ', par habitant' : ''),
      ph ? 'chaque valeur divisée par la population'
        : I.monde ? 'entre parenthèses, la part du total mondial'
        : 'du plus grand au plus petit',
      W) + 4;
    const y1 = H - 10;
    const pas = (y1 - y0) / l.length;
    const hB = Math.min(pas * 0.62, 30);
    const fsN = Math.max(8, Math.min(12.5, pas * 0.42));
    const gauche = 10 + Math.max(...PUISSANCES.map((p) => mesure(p.nom, fsN, true)));

    // Une valeur écrite au bout d'une barre courte sortirait du cadre : on
    // réserve la place du plus long libellé avant de fixer la longueur maximale.
    const etiq = (e) => val(spec.lire(e.p), dec) + (spec.unite ? ' ' + spec.unite : '')
      + (I.monde && !ph ? '  (' + fr(part(e.p, I) * 100, 1) + ' %)' : '');
    const fsV = Math.max(8, Math.min(11.5, pas * 0.38));
    const large = Math.max(...l.map((e) => mesure(etiq(e), fsV)));
    const droite = W - 10 - large - 8;
    const dispo = droite - gauche - 8;

    const vmax = Math.max(...l.map((e) => spec.lire(e.p)));
    const vmin = Math.min(...l.map((e) => spec.lire(e.p)));
    // En logarithmique on part d'une décade sous la plus petite valeur, sinon
    // la plus petite barre est de longueur nulle et « le Maroc n'a rien » est
    // un artefact d'échelle, pas une lecture.
    const base = log.value ? Math.log10(Math.max(vmin, vmax / 1e6)) - 0.35 : 0;
    const haut = log.value ? Math.log10(vmax) : vmax;
    const L = (v) => (log.value
      ? Math.max(1.5, ((Math.log10(Math.max(v, 1e-9)) - base) / (haut - base)) * dispo)
      : Math.max(1.5, (v / vmax) * dispo));

    // repère : la moyenne mondiale, quand l'indicateur en a une
    const ref = ph ? (I.monde ? (I.monde * (I.id === 'co2' ? 1 : 1000)) / MONDE.pop : null) : I.moyenne;
    if (ref != null && ref > 0 && ref <= vmax) {
      const xr = gauche + 8 + L(ref);
      mk('line', { x1: xr, y1: y0, x2: xr, y2: y1 - pas * 0.15, stroke: 'var(--ink-soft)',
        'stroke-width': 1, 'stroke-dasharray': '4 3', opacity: 0.7 }, svg);
      const et = 'monde : ' + val(ref, dec);
      const lw = mesure(et, 9.5);
      txt(svg, Math.min(xr + 4, W - 10 - lw), y0 - 3, et, { fs: 9.5, fill: 'var(--ink-soft)' });
    }

    l.forEach((e, i) => {
      const yc = y0 + pas * (i + 0.5);
      const est = e.p.id === 'maroc';
      txt(svg, gauche, yc + fsN * 0.36, e.p.nom,
        { fs: fsN, anchor: 'end', bold: est, fill: est ? 'var(--sub)' : 'var(--ink)' });
      const w = L(spec.lire(e.p));
      mk('rect', { x: gauche + 8, y: yc - hB / 2, width: w, height: hB, rx: 2.5,
        fill: e.p.couleur, opacity: est ? 1 : 0.86,
        stroke: est ? 'var(--ink)' : 'none', 'stroke-width': est ? 1.4 : 0 }, svg);
      txt(svg, gauche + 8 + w + 7, yc + fsV * 0.36, etiq(e),
        { fs: fsV, mono: true, fill: est ? 'var(--sub)' : 'var(--ink-soft)', bold: est });
    });

    const mar = l.find((e) => e.p.id === 'maroc');
    const nom = (e) => e.p.nom + ' · ' + val(spec.lire(e.p), dec) + (spec.unite ? ' ' + spec.unite : '');
    rPremier.set(nom(l[0]));
    rDeuxieme.set(nom(l[1]));
    rMaroc.set(mar.rang + 'ᵉ sur ' + l.length + ' · ' + val(spec.lire(mar.p), dec) + (spec.unite ? ' ' + spec.unite : ''));
    const der = l[l.length - 1];
    rRapport.set(fr(spec.lire(l[0].p) / spec.lire(der.p), 1) + ' ×  (' + l[0].p.court + ' / ' + der.p.court + ')');
    rMonde.set(ph ? (ref != null ? val(ref, dec) + ' ' + spec.unite : '—')
      : I.monde ? val(I.monde, 0) + ' ' + I.unite
      : I.moyenne != null ? 'moyenne ' + val(I.moyenne, dec) + ' ' + I.unite : '—');
  }

  /* ── vue 2 : le radar ─────────────────────────────────────────────────── */
  function radar(W, H) {
    const pa = PUISSANCES.find((p) => p.id === A.value);
    const pb = B.value ? PUISSANCES.find((p) => p.id === B.value) : null;
    const haut = bandeau(pa.nom + (pb ? '  contre  ' + pb.nom : ''),
      'chaque axe est une part du total mondial ; le rayon suit la racine carrée, '
      + 'pour que les petites parts restent visibles', W);

    /* Sous la pointe du bas viennent le nom de l'axe puis sa valeur : deux
       lignes, soit une trentaine de pixels qu'il faut retirer du rayon AVANT de
       le calculer. Sans cela le rayon remplissait la hauteur disponible et les
       deux lignes tombaient hors du cadre — à toutes les tailles d'écran. */
    const SOUS = 34, SUR = 12;
    const cx = W / 2;
    const marge = Math.max(58, Math.min(96, W * 0.11));
    const R = Math.max(36, Math.min((H - haut - SOUS - SUR) / 2, W / 2 - marge));
    const cy = haut + SUR + R;
    const rayon = (s) => R * Math.sqrt(Math.max(0, s) / R_MAX);
    const ang = (i) => (-Math.PI / 2) + (i * 2 * Math.PI) / AXES.length;
    const P = (i, s) => [cx + rayon(s) * Math.cos(ang(i)), cy + rayon(s) * Math.sin(ang(i))];

    /* Les graduations des anneaux se lisaient d'abord le long de l'axe du haut —
       exactement là où se trouvent le nom de cet axe et sa valeur. « 40 % »
       recouvrait « 4,2 % » dans tous les états du radar et à toutes les tailles.
       On les pose donc sur la bissectrice entre deux axes, où il n'y a jamais
       rien d'autre. */
    const angGrad = ang(0) - Math.PI / AXES.length;
    [0.05, 0.10, 0.20, 0.40].forEach((s) => {
      const d = AXES.map((_, i) => P(i, s)).map((q, i) => (i ? 'L' : 'M') + q[0] + ' ' + q[1]).join(' ') + ' Z';
      mk('path', { d, fill: 'none', stroke: 'var(--rule)', 'stroke-width': 1, opacity: 0.75 }, svg);
      // sous 80 pixels de rayon, les quatre étiquettes se marcheraient dessus :
      // on ne garde alors que celle de l'anneau extérieur
      if (R < 80 && s !== 0.40) return;
      const r = rayon(s) * 0.97;
      txt(svg, cx + r * Math.cos(angGrad), cy + r * Math.sin(angGrad) + 3,
        fr(s * 100, 0) + ' %', { fs: 9, anchor: 'middle', fill: 'var(--ink-soft)', op: 0.8 });
    });
    AXES.forEach((_, i) => {
      const q = P(i, R_MAX);
      mk('line', { x1: cx, y1: cy, x2: q[0], y2: q[1], stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
    });

    const trace = (p, plein) => {
      const pts = AXES.map((id, i) => P(i, part(p, INDICATEURS.find((x) => x.id === id))));
      mk('path', { d: pts.map((q, i) => (i ? 'L' : 'M') + q[0] + ' ' + q[1]).join(' ') + ' Z',
        fill: plein ? p.couleur : 'none', 'fill-opacity': plein ? 0.3 : 0,
        stroke: p.couleur, 'stroke-width': 2.4, 'stroke-dasharray': plein ? null : '6 4',
        'stroke-linejoin': 'round' }, svg);
      pts.forEach((q) => mk('circle', { cx: q[0], cy: q[1], r: 3.2, fill: p.couleur,
        stroke: 'var(--paper)', 'stroke-width': 1.2 }, svg));
    };
    if (pb) trace(pb, false);
    trace(pa, true);

    // Les étiquettes d'axes sont ancrées selon le côté où elles tombent, puis
    // ramenées dans le cadre : à droite de l'écran, « Exportations de
    // marchandises » sortait sinon d'une quinzaine de pixels.
    AXES.forEach((id, i) => {
      const I = INDICATEURS.find((x) => x.id === id);
      const q = P(i, R_MAX);
      const dx = Math.cos(ang(i)), dy = Math.sin(ang(i));
      const anchor = Math.abs(dx) < 0.2 ? 'middle' : dx > 0 ? 'start' : 'end';
      const nom = I.nom.replace(' de marchandises', '').replace(' et développement', ' et dév.');
      const fs = 10.5;
      let x = q[0] + dx * 9, y = q[1] + dy * 9 + (Math.abs(dx) < 0.2 ? (dy > 0 ? 9 : -3) : 3.5);
      const lw = mesure(nom, fs, true);
      if (anchor === 'start') x = Math.min(x, W - 4 - lw);
      if (anchor === 'end') x = Math.max(x, 4 + lw);
      if (anchor === 'middle') x = Math.max(4 + lw / 2, Math.min(W - 4 - lw / 2, x));
      txt(svg, x, y, nom, { fs, anchor, bold: true, fill: 'var(--ink-soft)' });
      const va = fr(part(pa, I) * 100, 1) + ' %' + (pb ? '   ' + fr(part(pb, I) * 100, 1) + ' %' : '');
      const vw = mesure(va, 9.5);
      let vx = x;
      if (anchor === 'start') vx = Math.min(x, W - 4 - vw);
      if (anchor === 'end') vx = Math.max(x, 4 + vw);
      if (anchor === 'middle') vx = Math.max(4 + vw / 2, Math.min(W - 4 - vw / 2, x));
      txt(svg, vx, y + 12, va, { fs: 9.5, anchor, mono: true, fill: 'var(--ink-soft)', op: 0.85 });
    });

    // légende
    let ly = H - 12;
    [pb, pa].filter(Boolean).forEach((p, i) => {
      const y = ly - i * 15;
      mk('rect', { x: 10, y: y - 8, width: 14, height: 10, rx: 2, fill: p.couleur,
        'fill-opacity': p === pa ? 0.85 : 0.15, stroke: p.couleur, 'stroke-width': 1.6,
        'stroke-dasharray': p === pa ? null : '4 3' }, svg);
      txt(svg, 30, y, p.nom, { fs: 10.5, fill: 'var(--ink-soft)' });
    });

    raRows.forEach((r) => {
      const I = INDICATEURS.find((x) => x.id === r.id);
      r.row.set(fr(part(pa, I) * 100, 1) + ' %' + (pb ? '   /   ' + fr(part(pb, I) * 100, 1) + ' %' : ''));
    });
  }

  /* ── vue 3 : quarante-quatre ans de part du PIB mondial ───────────────── */
  function histoire(W, H) {
    const annee = Math.round(an.value);
    const T = bandeau('Part du PIB mondial, 1980 → 2024',
      'six relevés marqués d’un point ; entre eux, la courbe est interpolée', W) + 24;

    const droite = Math.max(74, Math.min(130, W * 0.17));
    const L = 40, Rx = W - droite, Bo = H - 26;
    const X = (a) => L + ((a - ANNEES[0]) / (ANNEES[ANNEES.length - 1] - ANNEES[0])) * (Rx - L);
    const Y = (p) => Bo - (p / 100) * (Bo - T);

    for (let p = 0; p <= 100; p += 20) {
      mk('line', { x1: L, y1: Y(p), x2: Rx, y2: Y(p), stroke: 'var(--rule)', 'stroke-width': 1, opacity: 0.55 }, svg);
      txt(svg, L - 6, Y(p) + 3.5, p + ' %', { fs: 9.5, anchor: 'end', fill: 'var(--ink-soft)', mono: true });
    }

    // les bandes empilées, une année sur deux suffit pour une ligne brisée
    const pas = 1;
    const cum = {};
    let bas = new Array(Math.floor((ANNEES[ANNEES.length - 1] - ANNEES[0]) / pas) + 1).fill(0);
    BANDES.forEach((b) => {
      const hautPts = [], basPts = [];
      for (let i = 0; i < bas.length; i++) {
        const a = ANNEES[0] + i * pas;
        const v = bas[i] + partAnnee(b, a);
        hautPts.push([X(a), Y(v)]); basPts.push([X(a), Y(bas[i])]);
        bas[i] = v;
      }
      cum[b.id] = hautPts;
      mk('path', { d: 'M' + hautPts.map((q) => q[0] + ' ' + q[1]).join(' L')
        + ' L' + basPts.slice().reverse().map((q) => q[0] + ' ' + q[1]).join(' L') + ' Z',
        fill: b.couleur, opacity: 0.82 }, svg);
      mk('path', { d: 'M' + hautPts.map((q) => q[0] + ' ' + q[1]).join(' L'), fill: 'none',
        stroke: 'var(--paper)', 'stroke-width': 1 }, svg);
      // les six années réellement relevées, marquées sur le haut de la bande
      ANNEES.forEach((a) => {
        mk('circle', { cx: X(a), cy: hautPts[Math.round((a - ANNEES[0]) / pas)][1], r: 2.2,
          fill: 'var(--paper)', stroke: b.couleur, 'stroke-width': 1.3 }, svg);
      });
    });

    mk('line', { x1: L, y1: Bo, x2: Rx, y2: Bo, stroke: 'var(--rule)' }, svg);
    ANNEES.forEach((a) => {
      const t = txt(svg, X(a), Bo + 14, String(a), { fs: 9.5, anchor: 'middle', mono: true, fill: 'var(--ink-soft)' });
      const half = mesure(String(a), 9.5) / 2;
      if (X(a) - half < 2) { t.setAttribute('text-anchor', 'start'); t.setAttribute('x', 2); }
      if (X(a) + half > Rx) { t.setAttribute('text-anchor', 'end'); t.setAttribute('x', Rx); }
    });

    /* Les noms à droite : posés au milieu de leur bande, puis écartés du haut
       vers le bas pour qu'aucun n'en recouvre un autre — le Japon et l'Inde se
       touchent en fin de période. */
    const places = BANDES.map((b) => {
      const dernier = ANNEES[ANNEES.length - 1];
      const i = Math.round((dernier - ANNEES[0]) / pas);
      const hautY = cum[b.id][i][1];
      const v = partAnnee(b, dernier);
      return { b, v, y: hautY + ((Y(0) - Y(v)) / 2) };
    }).sort((x, y) => x.y - y.y);
    let precedent = -1e9;
    places.forEach((p) => {
      p.y = Math.max(p.y, precedent + 13);
      precedent = p.y;
    });
    const debord = places[places.length - 1].y - (Bo - 2);
    if (debord > 0) places.forEach((p) => { p.y -= debord; });
    places.forEach((p) => {
      mk('line', { x1: Rx, y1: p.y - 3, x2: Rx + 7, y2: p.y - 3, stroke: p.b.couleur, 'stroke-width': 2 }, svg);
      const s = p.b.nom;
      const fs = mesure(s, 10) > W - Rx - 14 ? 8.5 : 10;
      txt(svg, Rx + 10, p.y, s, { fs, fill: 'var(--ink-soft)' });
    });

    // le curseur
    const cx = X(annee);
    mk('line', { x1: cx, y1: T - 6, x2: cx, y2: Bo, stroke: 'var(--ink)', 'stroke-width': 1.6 }, svg);
    const bw = 36;
    const bx = Math.max(2, Math.min(W - bw - 2, cx - bw / 2));
    mk('rect', { x: bx, y: T - 20, width: bw, height: 14, rx: 3.5, fill: 'var(--ink)' }, svg);
    txt(svg, bx + bw / 2, T - 9.5, String(annee),
      { fs: 9.5, anchor: 'middle', mono: true, bold: true, fill: 'var(--paper)' });

    const zone = mk('rect', { x: L, y: T - 20, width: Rx - L, height: Bo - T + 22,
      fill: 'transparent', cursor: 'crosshair' }, svg);
    zone.addEventListener('click', (e) => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      const a = ANNEES[0] + ((px - L) / (Rx - L)) * (ANNEES[ANNEES.length - 1] - ANNEES[0]);
      an.set(Math.max(ANNEES[0], Math.min(ANNEES[ANNEES.length - 1], Math.round(a))));
      dessine();
    });

    hiRows.forEach((r) => r.row.set(partAnnee(r.b, annee)));
  }

  majControles();
  lab.onResize(dessine);
  dessine();
}
