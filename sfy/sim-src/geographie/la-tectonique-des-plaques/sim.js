// La tectonique des plaques, en coupe.
//
// Trois frontières, et pour chacune une grandeur qu'on peut vraiment mesurer :
//
//   • la DORSALE porte un code-barres magnétique dont la largeur des bandes
//     vaut durée × vitesse. C'est par cette mesure-là qu'on a prouvé que les
//     fonds océaniques s'écartent — et l'élève peut la refaire dans les deux
//     sens : régler la vitesse et voir le code s'étirer, ou mesurer une bande
//     et en déduire la vitesse.
//
//   • la SUBDUCTION range ses séismes le long d'un plan incliné, et ses volcans
//     à l'aplomb du point où ce plan atteint une centaine de kilomètres. La
//     distance entre la fosse et l'arc volcanique se calcule : 100 / tan(pendage).
//
//   • la COLLISION obéit à l'isostasie : une chaîne ne tient pas en l'air, elle
//     flotte. Les cinq kilomètres de l'Himalaya sont portés par trente
//     kilomètres de racine crustale, et le rapport entre les deux n'est rien
//     d'autre que celui des masses volumiques.

import {
  EXEMPLES_DORSALE, CROUTE_NORMALE, ageCroute, bandes, demiVitesse,
  distanceArc, isostasie, raccourcissement,
} from './tectonique.js';

const FRONTIERES = [
  { value: 'dorsale', label: 'Dorsale — deux plaques s’écartent',
    quoi: 'Du manteau remonte, fond, et fabrique du plancher océanique neuf. L’Atlantique s’ouvre ainsi depuis 180 millions d’années.' },
  { value: 'subduction', label: 'Subduction — une plaque plonge sous l’autre',
    quoi: 'La plaque océanique, froide et dense, s’enfonce. Séismes profonds, volcans en arc, fosse : la côte du Pacifique entière.' },
  { value: 'collision', label: 'Collision — deux continents se rencontrent',
    quoi: 'Aucun des deux ne veut plonger : la croûte s’épaissit et la montagne monte. L’Inde contre l’Asie, c’est l’Himalaya.' },
];

export function mount(lab) {
  const { make, fr } = lab;
  const svg = lab.svg();

  const quoi = lab.select({ label: 'La frontière', options: FRONTIERES, value: 'dorsale',
    onChange: () => { majControles(); dessine(); } });

  lab.group('La dorsale');
  const vitesse = lab.slider({ label: 'Vitesse d’écartement', min: 1, max: 18, step: 0.5,
    value: 2.5, unit: 'cm/an', dec: 1, onInput: dessine });
  const distance = lab.slider({ label: 'Point de sondage', min: 0, max: 600, step: 5,
    value: 120, unit: 'km', dec: 0, onInput: dessine });

  lab.group('La subduction');
  const pendage = lab.slider({ label: 'Pendage du plan', min: 15, max: 75, step: 1,
    value: 30, unit: '°', dec: 0, onInput: dessine });

  lab.group('La collision');
  const epaisseur = lab.slider({ label: 'Épaisseur de croûte', min: 35, max: 80, step: 1,
    value: 70, unit: 'km', dec: 0, onInput: dessine });

  lab.buttons(EXEMPLES_DORSALE.map((e) => ({
    label: e.nom.split(' (')[0].replace('Dorsale ', ''),
    onClick: () => { quoi.set('dorsale'); majControles(); vitesse.set(e.v); dessine(); },
  })));

  const txt = (v) => (v == null ? '—' : String(v));
  lab.group('Ce que l’on mesure');
  const rA = lab.readout({ label: '—', format: txt, hi: true });
  const rB = lab.readout({ label: '—', format: txt });
  const rC = lab.readout({ label: '—', format: txt });
  const rD = lab.readout({ label: '—', format: txt });
  const nomme = (r, s) => { r.row.querySelector('.r-label').textContent = s; };

  function majControles() {
    const f = quoi.value;
    vitesse.show(f === 'dorsale');
    distance.show(f === 'dorsale');
    pendage.show(f === 'subduction');
    epaisseur.show(f === 'collision');
  }

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
  const fleche = (g, x1, y1, x2, y2, c) => {
    make('line', { x1, y1, x2, y2, stroke: c, 'stroke-width': 2.2,
      'stroke-linecap': 'round' }, g);
    const a = Math.atan2(y2 - y1, x2 - x1);
    make('path', { d: 'M' + x2 + ' ' + y2
      + 'l' + (-9 * Math.cos(a - 0.4)) + ' ' + (-9 * Math.sin(a - 0.4))
      + 'M' + x2 + ' ' + y2
      + 'l' + (-9 * Math.cos(a + 0.4)) + ' ' + (-9 * Math.sin(a + 0.4)),
    stroke: c, 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }, g);
  };

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    regle = make('text', { x: -9999, y: -9999, fill: 'none' }, svg);
    const { w: W, h: H } = lab.size();
    const f = FRONTIERES.find((x) => x.value === quoi.value);

    const fsT = Math.max(13, Math.min(18, W / 42));
    T(svg, 12, 10 + fsT, f.label, { fs: fsT, bold: true, anchor: 'start' });
    const lignes = coupe(f.quoi, W - 24, 11.5);
    lignes.forEach((l, i) => T(svg, 12, 12 + fsT * 2 + i * 13, l,
      { fs: 11.5, anchor: 'start', fill: 'var(--ink-soft)' }));
    const haut = 12 + fsT * 2 + lignes.length * 13 + 10;
    const box = { x: 8, y: haut, w: W - 16, h: H - haut - 10 };

    if (f.value === 'dorsale') dorsale(box);
    else if (f.value === 'subduction') subduction(box);
    else collision(box);
    if (regle) { regle.remove(); regle = null; }
  }

  /* ── la dorsale et son code-barres ─────────────────────────────────────── */
  function dorsale(box) {
    const g = make('g', {}, svg);
    const v = vitesse.value;
    const cx = box.x + box.w / 2;
    /* La coupe se cale sur ce qu'il y a à voir : les six millions d'années de
       code-barres. À 2,5 cm/an ils tiennent dans 75 km, à 15 cm/an il en faut
       450 — une largeur fixe montrerait tantôt un trait, tantôt un quart du
       dessin. C'est donc l'ÉCHELLE qui change, et elle est graduée pour qu'on
       s'en aperçoive. */
    const demiKm = Math.max(60, 6.0 * demiVitesse(v) * 1.12);
    const ech = (box.w / 2 - 12) / demiKm;                // pixels par km
    const yMer = box.y + 26, yFond = yMer + Math.min(56, box.h * 0.22);
    const yBande = yFond + 6, hBande = Math.min(30, box.h * 0.13);

    make('rect', { x: box.x, y: yMer, width: box.w, height: yFond - yMer,
      fill: 'var(--sub)', 'fill-opacity': 0.13 }, g);
    T(g, box.x + 6, yMer + 12, 'océan', { fs: 9.5, anchor: 'start', fill: 'var(--ink-mute)' });

    // le relief de la dorsale : un bombement centré sur l'axe
    let d = 'M' + box.x + ' ' + yFond;
    for (let px = 0; px <= box.w; px += 6) {
      const km = (px - box.w / 2) / ech;
      const sg = demiKm * 0.28;          // le bombement suit l'échelle de la coupe
      const h = 22 * Math.exp(-(km * km) / (2 * sg * sg));
      d += 'L' + (box.x + px) + ' ' + (yFond - h);
    }
    d += 'L' + (box.x + box.w) + ' ' + (yBande + hBande) + 'H' + box.x + 'Z';
    make('path', { d, fill: 'var(--paper-3)', stroke: 'var(--rule-2)', 'stroke-width': 1 }, g);

    // le code-barres, symétrique de part et d'autre de l'axe
    bandes(v, demiKm).forEach((b) => {
      [1, -1].forEach((s) => {
        const x0 = cx + s * b.x0 * ech, x1 = cx + s * b.x1 * ech;
        make('rect', { x: Math.min(x0, x1), y: yBande, width: Math.abs(x1 - x0), height: hBande,
          fill: b.n ? 'var(--ink)' : 'var(--paper)', 'fill-opacity': b.n ? 0.72 : 1,
          stroke: 'var(--rule-2)', 'stroke-width': 0.5 }, g);
      });
      if (b.nom && (b.x1 - b.x0) * ech > 26) {
        T(g, cx + ((b.x0 + b.x1) / 2) * ech, yBande + hBande + 11, b.nom,
          { fs: 8.5, fill: 'var(--ink-mute)' });
      }
    });
    T(g, box.x + 6, yBande - 3, 'aimantation du basalte : noir = comme aujourd’hui',
      { fs: 9, anchor: 'start', fill: 'var(--ink-mute)' });

    // les deux plaques s'écartent
    fleche(g, cx + 30, yFond - 34, cx + 96, yFond - 34, 'var(--sub)');
    fleche(g, cx - 30, yFond - 34, cx - 96, yFond - 34, 'var(--sub)');
    T(g, cx, yFond - 40, fr(v, 1) + ' cm/an au total', { fs: 10, fill: 'var(--sub)', bold: true });
    // le magma
    make('path', { d: 'M' + (cx - 12) + ' ' + (yBande + hBande) + 'L' + cx + ' ' + (yFond - 20)
      + 'L' + (cx + 12) + ' ' + (yBande + hBande) + 'Z', fill: '#c1440e', opacity: 0.6 }, g);

    // le point de sondage, et l'échelle des distances
    const xs = cx + distance.value * ech;
    const yBas = yBande + hBande + 26;
    make('line', { x1: box.x, y1: yBas, x2: box.x + box.w, y2: yBas,
      stroke: 'var(--rule-2)', 'stroke-width': 1 }, g);
    const pasKm = demiKm > 300 ? 100 : demiKm > 150 ? 50 : demiKm > 70 ? 25 : 10;
    for (let km = -Math.floor(demiKm / pasKm) * pasKm; km <= demiKm; km += pasKm) {
      const x = cx + km * ech;
      make('line', { x1: x, y1: yBas - 4, x2: x, y2: yBas + 4, stroke: 'var(--ink-mute)',
        'stroke-width': 1 }, g);
      T(g, x, yBas + 15, km === 0 ? '0' : String(Math.abs(km)),
        { fs: 8.5, mono: true, fill: 'var(--ink-mute)' });
    }
    // sous les graduations, et centrée : au bout de l'axe elle mordait le dernier chiffre
    T(g, cx, yBas + 27, 'kilomètres de part et d’autre de l’axe',
      { fs: 8.5, fill: 'var(--ink-mute)' });
    if (Math.abs(xs - cx) <= box.w / 2 - 10) {
      make('line', { x1: xs, y1: yBande - 6, x2: xs, y2: yBas + 4, stroke: 'var(--sub)',
        'stroke-width': 1.6, 'stroke-dasharray': '4 3' }, g);
      make('circle', { cx: xs, cy: yBande + hBande / 2, r: 4, fill: 'var(--sub)',
        stroke: 'var(--paper)', 'stroke-width': 1.4 }, g);
    }

    const age = ageCroute(distance.value, v);
    const brunhes = bandes(v, 1e9)[0];
    nomme(rA, 'Âge du plancher, au sondage');
    rA.set(fr(age, 2) + ' millions d’années');
    nomme(rB, 'Largeur de la bande de Brunhes');
    rB.set(fr(brunhes.x1, 1) + ' km de chaque côté   (0,773 Ma)');
    nomme(rC, 'La mesure, faite à l’envers');
    rC.set(fr(brunhes.x1, 1) + ' km ÷ 0,773 Ma × 2 = ' + fr(v, 1) + ' cm/an');
    nomme(rD, 'Depuis la mort de Jules César');
    rD.set(fr((v * 2065) / 100, 1) + ' m de plancher neuf   (2 065 ans)');
  }

  /* ── la subduction ─────────────────────────────────────────────────────── */
  function subduction(box) {
    const g = make('g', {}, svg);
    const a = pendage.value;
    const kmTotal = 900;
    const ech = box.w / kmTotal;
    const yMer = box.y + 24;
    const xFosse = box.x + box.w * 0.34;
    const yBas = box.y + box.h - 22;
    const echV = Math.min(ech, (yBas - yMer) / 700);      // profondeurs jusqu'à 700 km

    make('rect', { x: box.x, y: yMer, width: xFosse - box.x, height: 18,
      fill: 'var(--sub)', 'fill-opacity': 0.13 }, g);
    T(g, box.x + 6, yMer + 13, 'océan', { fs: 9.5, anchor: 'start', fill: 'var(--ink-mute)' });

    // la plaque plongeante
    const long = 700 / Math.sin(a * Math.PI / 180);
    const dx = long * Math.cos(a * Math.PI / 180) * ech;
    const dy = 700 * echV;
    make('path', { d: 'M' + box.x + ' ' + (yMer + 18) + 'H' + xFosse
      + 'L' + (xFosse + dx) + ' ' + (yMer + 18 + dy)
      + 'l' + (-16 * Math.sin(a * Math.PI / 180)) + ' ' + (16 * Math.cos(a * Math.PI / 180))
      + 'L' + box.x + ' ' + (yMer + 34) + 'Z',
    fill: 'var(--ink)', 'fill-opacity': 0.18, stroke: 'var(--ink-soft)', 'stroke-width': 1.2 }, g);

    // le continent
    make('path', { d: 'M' + xFosse + ' ' + (yMer + 18) + 'q' + (box.w * 0.1) + ' -14 '
      + (box.w * 0.2) + ' -10L' + (box.x + box.w) + ' ' + (yMer + 8)
      + 'V' + (yMer + 46) + 'H' + xFosse + 'Z',
    fill: 'var(--paper-3)', stroke: 'var(--rule-2)', 'stroke-width': 1 }, g);
    T(g, box.x + box.w - 8, yMer + 40, 'continent',
      { fs: 9.5, anchor: 'end', fill: 'var(--ink-mute)' });
    T(g, xFosse, yMer + 32, 'fosse', { fs: 9, fill: 'var(--ink-mute)' });

    // les séismes le long du plan de Wadati-Benioff
    for (let p = 20; p <= 700; p += 28) {
      const d = p / Math.tan(a * Math.PI / 180);
      const x = xFosse + d * ech, y = yMer + 18 + p * echV;
      if (x > box.x + box.w - 4 || y > yBas) break;
      make('circle', { cx: x, cy: y, r: p < 100 ? 3.4 : p < 300 ? 2.8 : 2.2,
        fill: '#c1440e', opacity: 0.75 }, g);
    }
    T(g, xFosse + 8, yBas - 4, 'chaque point : un foyer de séisme',
      { fs: 9, anchor: 'start', fill: 'var(--ink-mute)' });

    // l'arc volcanique, à l'aplomb des 100 km
    const dArc = distanceArc(a);
    const xArc = xFosse + dArc * ech;
    if (xArc < box.x + box.w - 10) {
      make('path', { d: 'M' + (xArc - 13) + ' ' + (yMer + 12) + 'l13 -20l13 20z',
        fill: '#c1440e', opacity: 0.8 }, g);
      make('line', { x1: xArc, y1: yMer - 8, x2: xArc, y2: yMer + 18 + 100 * echV,
        stroke: '#c1440e', 'stroke-width': 1.2, 'stroke-dasharray': '4 3', opacity: 0.7 }, g);
      T(g, xArc, yMer - 14, 'arc volcanique', { fs: 9.5, fill: '#c1440e' });
      make('circle', { cx: xArc, cy: yMer + 18 + 100 * echV, r: 4, fill: 'none',
        stroke: '#c1440e', 'stroke-width': 1.6 }, g);
      T(g, xArc + 8, yMer + 22 + 100 * echV, '100 km : la plaque libère son eau',
        { fs: 9, anchor: 'start', fill: 'var(--ink-mute)' });
    }
    // l'échelle des profondeurs
    [100, 300, 500, 700].forEach((p) => {
      const y = yMer + 18 + p * echV;
      if (y > yBas) return;
      make('line', { x1: box.x, y1: y, x2: box.x + box.w, y2: y, stroke: 'var(--rule)',
        'stroke-width': 1, 'stroke-dasharray': '2 5' }, g);
      T(g, box.x + 3, y - 3, p + ' km', { fs: 8.5, mono: true, anchor: 'start',
        fill: 'var(--ink-mute)' });
    });

    nomme(rA, 'Fosse → arc volcanique');
    rA.set(fr(dArc, 0) + ' km');
    nomme(rB, 'Le calcul');
    rB.set('100 km ÷ tan(' + fr(a, 0) + '°) = ' + fr(dArc, 0) + ' km');
    nomme(rC, 'Profondeur sous l’arc');
    rC.set('100 km — c’est là que le manteau fond');
    nomme(rD, 'Séisme le plus profond possible');
    rD.set('700 km, à ' + fr(700 / Math.tan(a * Math.PI / 180), 0) + ' km de la fosse');
  }

  /* ── la collision et l'isostasie ───────────────────────────────────────── */
  function collision(box) {
    const g = make('g', {}, svg);
    const T0 = epaisseur.value;
    const iso = isostasie(T0);
    const kmV = 110;                                    // ce que la coupe montre en profondeur
    const ech = Math.min((box.h - 40) / kmV, box.w / 900);
    const yRef = box.y + 20 + 12 * ech;                  // le niveau de référence
    const cx = box.x + box.w / 2;
    const demiLarge = Math.min(box.w * 0.36, 300 * ech * 1.6);

    // le manteau
    make('rect', { x: box.x, y: yRef + CROUTE_NORMALE * ech, width: box.w,
      height: box.y + box.h - (yRef + CROUTE_NORMALE * ech) - 4,
      fill: 'var(--ink)', 'fill-opacity': 0.10 }, g);
    T(g, box.x + box.w - 8, yRef + CROUTE_NORMALE * ech + 14, 'manteau  ρ = 3 300',
      { fs: 9, anchor: 'end', mono: true, fill: 'var(--ink-mute)' });

    /* La croûte : plate loin de la chaîne, épaissie au milieu — et l'épaississement
       se voit EN HAUT comme EN BAS, dans le rapport des masses volumiques. C'est
       toute l'idée : la montagne est le sommet d'un iceberg de granite. */
    const forme = (x) => Math.exp(-(x * x) / (2 * 0.36 * 0.36));
    let dessus = '', dessous = '';
    for (let i = 0; i <= 120; i++) {
      const u = -1 + (2 * i) / 120;
      const k = forme(u);
      const x = cx + u * demiLarge;
      const yH = yRef - iso.altitude * ech * k;
      const yB = yRef + (CROUTE_NORMALE + iso.racine * k) * ech;
      dessus += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + yH.toFixed(1);
      dessous = 'L' + x.toFixed(1) + ' ' + yB.toFixed(1) + dessous;
    }
    make('path', { d: dessus + dessous + 'Z', fill: 'var(--paper-3)',
      stroke: 'var(--ink-soft)', 'stroke-width': 1.3 }, g);
    T(g, box.x + 8, yRef + 16, 'croûte  ρ = 2 800',
      { fs: 9, anchor: 'start', mono: true, fill: 'var(--ink-mute)' });

    // les deux continents qui se poussent
    fleche(g, box.x + 16, yRef + 12 * ech, box.x + 70, yRef + 12 * ech, 'var(--sub)');
    fleche(g, box.x + box.w - 16, yRef + 12 * ech, box.x + box.w - 70, yRef + 12 * ech, 'var(--sub)');

    // le niveau de référence et les deux cotes
    make('line', { x1: box.x, y1: yRef, x2: box.x + box.w, y2: yRef,
      stroke: 'var(--rule-2)', 'stroke-width': 1, 'stroke-dasharray': '5 4' }, g);
    T(g, box.x + 4, yRef - 4, 'niveau d’une plaine ordinaire',
      { fs: 8.5, anchor: 'start', fill: 'var(--ink-mute)' });
    const cote = (y1, y2, texte, x) => {
      make('line', { x1: x, y1, x2: x, y2, stroke: 'var(--sub)', 'stroke-width': 1.4 }, g);
      make('line', { x1: x - 4, y1, x2: x + 4, y2: y1, stroke: 'var(--sub)', 'stroke-width': 1.4 }, g);
      make('line', { x1: x - 4, y1: y2, x2: x + 4, y2, stroke: 'var(--sub)', 'stroke-width': 1.4 }, g);
      T(g, x + 7, (y1 + y2) / 2 + 3.5, texte, { fs: 9.5, anchor: 'start', fill: 'var(--sub)', mono: true });
    };
    cote(yRef - iso.altitude * ech, yRef, fr(iso.altitude, 2) + ' km', cx + 14);
    cote(yRef + CROUTE_NORMALE * ech, yRef + (CROUTE_NORMALE + iso.racine) * ech,
      fr(iso.racine, 1) + ' km de racine', cx + 14);

    nomme(rA, 'Altitude de la chaîne');
    rA.set(fr(iso.altitude, 2) + ' km   (Everest : 8,85 km)');
    nomme(rB, 'Racine sous la plaine');
    rB.set(fr(iso.racine, 1) + ' km — le Moho descend à ' + fr(iso.mohoSousLeSommet, 0) + ' km');
    nomme(rC, 'Le rapport');
    rC.set('racine ÷ altitude = ' + fr(iso.racine / Math.max(0.001, iso.altitude), 1)
      + '   soit ρ croûte ÷ (ρ manteau − ρ croûte)');
    nomme(rD, 'Raccourcissement nécessaire');
    rD.set(fr(raccourcissement(1000, T0), 0) + ' km, pour 1 000 km de croûte au départ');
  }

  majControles();
  lab.onResize(dessine);
  lab.onReset(() => { quoi.set('dorsale'); majControles(); vitesse.set(2.5); distance.set(120);
    pendage.set(30); epaisseur.set(70); dessine(); });
  dessine();
}
