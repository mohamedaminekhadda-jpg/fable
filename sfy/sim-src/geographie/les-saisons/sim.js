// Les saisons — et la question que presque tout le monde tranche de travers.
//
// « Il fait chaud en été parce que la Terre est plus près du Soleil. » C'est
// faux, et c'est faux d'une manière vérifiable : la Terre est au plus PRÈS du
// Soleil le 3 janvier, en plein hiver de l'hémisphère nord. Cette simulation ne
// se contente pas de le dire — elle affiche la distance en même temps que
// l'énergie reçue, et l'on voit les deux varier en sens contraire.
//
// Deux choix de dessin portent toute la démonstration :
//
//   • L'ORBITE EST À L'ÉCHELLE. Son excentricité vaut 0,0167 : dessinée
//     honnêtement, elle est indiscernable d'un cercle. Les schémas de manuel
//     l'étirent pour « qu'on voie mieux », et c'est précisément ce dessin
//     exagéré qui fabrique l'erreur dans la tête des élèves. Ici la Terre reste
//     bien visiblement à la même distance toute l'année.
//
//   • LE PARALLÈLE EST TRACÉ EN ENTIER sur le globe, sa part éclairée d'un
//     côté du terminateur et sa part nocturne de l'autre. La durée du jour
//     n'est pas un nombre qu'on lit : c'est la fraction du cercle qui est au
//     soleil pendant que la Terre tourne.

import {
  OBLIQUITE, EXCENTRICITE, DEMI_GRAND_AXE, declinaison, dureeDuJour, hauteurMidi,
  distanceSoleil, insolationJournaliere, dateDuJour, REPERES,
} from './astro.js';

const RAD = Math.PI / 180;
const PSI = 22 * RAD;                    // on regarde le globe un peu par-dessus

const LIEUX = [
  { value: '33.97', label: 'Rabat (34° N)' },
  { value: '0', label: 'Équateur (0°)' },
  { value: '48.85', label: 'Paris (49° N)' },
  { value: '66.56', label: 'Cercle polaire (66,5° N)' },
  { value: '90', label: 'Pôle Nord (90° N)' },
  { value: '-33.9', label: 'Le Cap (34° S)' },
];

export function mount(lab) {
  const { make, fr } = lab;
  const svg = lab.svg();

  const jour = lab.slider({ label: 'Jour de l’année', min: 1, max: 365, step: 1, value: 172,
    dec: 0, format: (v) => dateDuJour(v).texte, onInput: dessine });
  const lieu = lab.select({ label: 'Le lieu', options: LIEUX, value: '33.97',
    onChange: (v) => { lat.set(+v); dessine(); } });
  const lat = lab.slider({ label: 'ou une latitude', min: -90, max: 90, step: 0.5, value: 33.97,
    unit: '°', dec: 1, onInput: dessine });

  lab.buttons(REPERES.map((r) => ({
    label: r.nom.replace('équinoxe de ', 'éq. ').replace('solstice de ', 'sol. '),
    onClick: () => { jour.set(r.n); dessine(); },
  })));

  const txt = (v) => (v == null ? '—' : String(v));
  lab.group('Ce jour-là, à cette latitude');
  const rJour = lab.readout({ label: 'Durée du jour', format: txt, hi: true });
  const rHaut = lab.readout({ label: 'Soleil à midi', format: txt });
  const rDecl = lab.readout({ label: 'Soleil au zénith sur', format: txt });
  lab.group('L’énergie reçue');
  const rEner = lab.readout({ label: 'Par m² et par jour', format: txt, hi: true });
  const rComp = lab.readout({ label: 'Par rapport au 21 juin', format: txt });
  lab.group('La distance au Soleil');
  const rDist = lab.readout({ label: 'Terre – Soleil', format: txt });
  const rEcartD = lab.readout({ label: 'Écart à la moyenne', format: txt });
  const rVerdict = lab.readout({ label: 'Alors, la distance ?', format: txt, hi: true });

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
    x: { label: 'jour de l’année', min: 1, max: 365 },
    y: { label: 'énergie reçue', unit: 'MJ/m² par jour', min: 0 },
  });

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    regle = make('text', { x: -9999, y: -9999, fill: 'none' }, svg);
    const { w: W, h: H } = lab.size();
    const n = Math.round(jour.value), phi = lat.value;
    const d = declinaison(n);
    const dj = dureeDuJour(phi, n);
    const ins = insolationJournaliere(phi, n);
    const dist = distanceSoleil(n);

    const fsT = Math.max(13, Math.min(18, W / 42));
    T(svg, 12, 10 + fsT, 'Pourquoi il y a des saisons', { fs: fsT, bold: true, anchor: 'start' });
    const lignes = coupe('Faites défiler l’année. Regardez ensemble l’énergie reçue et la '
      + 'distance au Soleil — elles ne varient pas dans le même sens.', W - 24, 11.5);
    lignes.forEach((l, i) => T(svg, 12, 12 + fsT * 2 + i * 13, l,
      { fs: 11.5, anchor: 'start', fill: 'var(--ink-soft)' }));
    const haut = 12 + fsT * 2 + lignes.length * 13 + 10;

    const cote = W >= 720;
    const Lw = cote ? Math.min(W * 0.44, 400) : W;
    const gh = cote ? H - haut - 8 : Math.min(190, (H - haut) * 0.52);
    globe({ x: 6, y: haut, w: Lw - 12, h: gh }, d, phi, n, dist);
    const gb = cote ? { x: Lw, y: haut, w: W - Lw - 10, h: H - haut - 8 }
      : { x: 0, y: haut + gh + 8, w: W, h: H - haut - gh - 16 };
    if (gb.w > 190 && gb.h > 120) courbe(gb, phi, n, ins);

    /* ── les mesures ── */
    rJour.set(dj.polaire === 'jour' ? '24 h — le Soleil ne se couche pas'
      : dj.polaire === 'nuit' ? '0 h — le Soleil ne se lève pas'
        // les minutes sur deux chiffres : « 12 h 0 min » ne se lit pas comme une heure
        : Math.floor(dj.heures) + ' h '
          + String(Math.round((dj.heures % 1) * 60)).padStart(2, '0') + ' min');
    const hm = hauteurMidi(phi, n);
    rHaut.set(hm <= 0 ? 'sous l’horizon' : fr(hm, 1) + '° au-dessus de l’horizon');
    rDecl.set('la latitude ' + fr(Math.abs(d), 1) + '° ' + (d >= 0 ? 'nord' : 'sud'));
    rEner.set(fr(ins, 1) + ' MJ/m²');
    const iRef = insolationJournaliere(phi, 172);
    rComp.set(iRef > 0.05 ? fr((100 * ins) / iRef, 0) + ' % de ce qu’il reçoit au solstice de juin'
      : 'le 21 juin, ce lieu ne reçoit rien');
    rDist.set(fr(dist, 2) + ' millions de km');
    const e = (100 * (dist - DEMI_GRAND_AXE)) / DEMI_GRAND_AXE;
    rEcartD.set((e >= 0 ? '+' : '') + fr(e, 2) + ' %');
    rVerdict.set(dist < DEMI_GRAND_AXE
      ? 'plus PRÈS que la moyenne' + (Math.abs(phi) > 5 && phi > 0 && ins < iRef * 0.6 ? ' — et pourtant c’est l’hiver ici' : '')
      : 'plus LOIN que la moyenne' + (phi > 5 && ins > iRef * 0.8 ? ' — et pourtant c’est l’été ici' : ''));
    if (regle) { regle.remove(); regle = null; }
  }

  /* ── le globe éclairé, et l'orbite à l'échelle ─────────────────────────── */
  function globe(box, d, phi, n, dist) {
    const g = make('g', {}, svg);
    const hOrbite = Math.min(96, box.h * 0.34);
    const R = Math.min((box.h - hOrbite - 26) / 2.2, box.w / 2.9);
    const cx = box.x + box.w * 0.56, cy = box.y + R + 12;

    // le Soleil, à gauche, et ses rayons parallèles
    for (let k = -2; k <= 2; k++) {
      const y = cy + k * R * 0.44;
      make('path', { d: 'M' + (box.x + 6) + ' ' + y + 'H' + (cx - R - 6),
        stroke: 'var(--sub)', 'stroke-width': 1.3, opacity: 0.5 }, g);
      make('path', { d: 'M' + (cx - R - 6) + ' ' + y + 'l-6 -3.5v7z', fill: 'var(--sub)', opacity: 0.5 }, g);
    }
    T(g, box.x + 10, cy - R - 2, 'la lumière du Soleil',
      { fs: 9.5, anchor: 'start', fill: 'var(--ink-mute)' });

    /* La projection. L'axe du monde et la direction du Soleil sont tous deux
       dans le plan z = 0 ; on bascule la vue de PSI autour de x pour que les
       parallèles se voient comme des ellipses et non comme des segments. Le
       terminateur, lui, reste vu par la tranche : c'est la droite verticale. */
    const proj = (p) => {
      const y2 = p[1] * Math.cos(PSI) - p[2] * Math.sin(PSI);
      const z2 = p[1] * Math.sin(PSI) + p[2] * Math.cos(PSI);
      return { X: cx + p[0] * R, Y: cy - y2 * R, devant: z2 >= 0, jour: p[0] < 0 };
    };
    // l'axe des pôles, incliné de la déclinaison du jour
    const nx = -Math.sin(d * RAD), ny = Math.cos(d * RAD);

    make('circle', { cx, cy, r: R, fill: 'var(--paper-3)', stroke: 'var(--rule-2)',
      'stroke-width': 1.2 }, g);
    // la moitié éclairée
    make('path', { d: 'M' + cx + ' ' + (cy - R) + 'A' + R + ' ' + R + ' 0 0 0 ' + cx + ' ' + (cy + R) + 'Z',
      fill: 'var(--sub)', opacity: 0.16 }, g);
    make('line', { x1: cx, y1: cy - R, x2: cx, y2: cy + R, stroke: 'var(--ink-soft)',
      'stroke-width': 1.2, 'stroke-dasharray': '4 3', opacity: 0.8 }, g);


    // l'axe des pôles
    const pn = proj([nx * 1.16, ny * 1.16, 0]), ps = proj([-nx * 1.16, -ny * 1.16, 0]);
    make('line', { x1: pn.X, y1: pn.Y, x2: ps.X, y2: ps.Y, stroke: 'var(--ink)',
      'stroke-width': 1.6, opacity: 0.8 }, g);
    T(g, pn.X, pn.Y - 5, 'N', { fs: 9.5, mono: true, fill: 'var(--ink-soft)' });

    // l'équateur, puis le parallèle du lieu
    const cercle = (latitude, epais, couleur) => {
      const u = [Math.cos(d * RAD), Math.sin(d * RAD), 0];   // ⊥ à l'axe, dans le plan z=0
      const v = [0, 0, 1];
      const s = Math.sin(latitude * RAD), c = Math.cos(latitude * RAD);
      let dJour = '', dNuit = '', prevJour = null;
      for (let t = 0; t <= 360; t += 3) {
        const a = t * RAD;
        const p = [s * nx + c * (u[0] * Math.cos(a) + v[0] * Math.sin(a)),
          s * ny + c * (u[1] * Math.cos(a) + v[1] * Math.sin(a)),
          c * (u[2] * Math.cos(a) + v[2] * Math.sin(a))];
        const q = proj(p);
        const seg = (q.X.toFixed(1) + ' ' + q.Y.toFixed(1));
        if (q.jour) { dJour += (prevJour === true ? 'L' : 'M') + seg; prevJour = true; }
        else { dNuit += (prevJour === false ? 'L' : 'M') + seg; prevJour = false; }
      }
      if (dNuit) {
        make('path', { d: dNuit, fill: 'none', stroke: 'var(--ink)', 'stroke-width': epais,
          opacity: 0.30, 'stroke-linecap': 'round' }, g);
      }
      if (dJour) {
        make('path', { d: dJour, fill: 'none', stroke: couleur, 'stroke-width': epais,
          opacity: 0.95, 'stroke-linecap': 'round' }, g);
      }
    };
    cercle(0, 1, 'var(--ink-soft)');
    cercle(phi, 2.8, 'var(--sub)');

    // le lieu lui-même, à midi vrai (au plus près du Soleil sur son parallèle)
    const u = [Math.cos(d * RAD), Math.sin(d * RAD), 0];
    const s = Math.sin(phi * RAD), c = Math.cos(phi * RAD);
    const midi = proj([s * nx - c * u[0], s * ny - c * u[1], 0]);
    make('circle', { cx: midi.X, cy: midi.Y, r: 3.6, fill: 'var(--sub)',
      stroke: 'var(--paper)', 'stroke-width': 1.4 }, g);


    /* ── l'orbite, à l'échelle vraie ── */
    const oy = box.y + box.h - hOrbite / 2 - 4;
    const ox = box.x + box.w / 2;
    const a = Math.min(box.w * 0.40, hOrbite * 0.44);
    const b = a * Math.sqrt(1 - EXCENTRICITE * EXCENTRICITE);
    const cFoyer = a * EXCENTRICITE;
    make('ellipse', { cx: ox, cy: oy, rx: a, ry: b, fill: 'none',
      stroke: 'var(--rule-2)', 'stroke-width': 1.2 }, g);
    make('circle', { cx: ox - cFoyer, cy: oy, r: 5, fill: 'var(--sub)', opacity: 0.85 }, g);
    const theta = (2 * Math.PI * (n - 3)) / 365.256;
    make('circle', { cx: ox - cFoyer + (dist / DEMI_GRAND_AXE) * a * Math.cos(theta),
      cy: oy + (dist / DEMI_GRAND_AXE) * b * Math.sin(theta), r: 3.4, fill: 'var(--ink)' }, g);
    T(g, ox, oy - b - 7, 'l’orbite, à l’échelle : e = 0,0167',
      { fs: 9, fill: 'var(--ink-mute)' });
    T(g, ox, oy + b + 13, 'un cercle, ou presque — la distance n’explique rien',
      { fs: 9, fill: 'var(--ink-mute)' });

    /* Une seule légende sous le globe — les deux d'avant se chevauchaient — et
       centrée sur la BOÎTE, pas sur le globe : centrée sur le globe, qui est
       décalé à droite, elle allait mordre l'axe du graphe voisin. Sa hauteur
       est bornée pour rester au-dessus du titre de l'orbite. */
    const yLeg = Math.min(box.y + 2 * R + 26, oy - b - 20);
    T(g, box.x + box.w / 2, yLeg, 'le parallèle coloré est la part éclairée',
      { fs: 9.5, fill: 'var(--ink-soft)' });
  }

  /* ── l'énergie reçue au fil de l'année ─────────────────────────────────── */
  function courbe(box, phi, n, ins) {
    const pts = [];
    for (let k = 1; k <= 365; k += 2) pts.push([k, insolationJournaliere(phi, k)]);
    const opposee = [];
    for (let k = 1; k <= 365; k += 2) opposee.push([k, insolationJournaliere(-phi, k)]);
    const g = graphe.draw(svg, box, {
      curves: [
        { pts: opposee, color: 'var(--ink-mute)', width: 1.3, dash: '4 4', opacity: 0.7 },
        { pts, color: 'var(--sub)', width: 2.2 },
      ],
      points: [{ x: n, y: ins, r: 4.5 }],
    });
    const bx = graphe.box;
    if (!bx) return;
    REPERES.forEach((r) => {
      const x = bx.X(r.n);
      make('line', { x1: x, y1: bx.T, x2: x, y2: bx.B, stroke: 'var(--rule-2)',
        'stroke-width': 1, 'stroke-dasharray': '2 4' }, g);
    });
    T(g, bx.R - 6, bx.T + 12, 'l’hémisphère opposé, en pointillé',
      { fs: 9, anchor: 'end', fill: 'var(--ink-mute)' });
  }

  lab.onResize(dessine);
  lab.onReset(() => { jour.set(172); lat.set(33.97); lieu.set('33.97'); dessine(); });
  dessine();
}
