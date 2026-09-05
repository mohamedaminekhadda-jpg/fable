// Les échanges mondiaux — trois cartes de la même planète.
//
// D'abord les flux : cinq pôles, douze flèches, et une case à cocher qui change
// tout. Tant qu'on ne montre que les échanges ENTRE pôles, la mondialisation
// ressemble à un réseau équilibré. Dès qu'on ajoute les échanges INTERNES à
// chaque pôle, la carte se retourne : l'Europe commerce trois fois plus avec
// elle-même qu'avec le reste du monde, et l'Afrique presque pas.
//
// Ensuite les passages : neuf points sur une planète d'océans, par lesquels
// tout doit tenir. Enfin le Maroc, dont le commerce extérieur tient en deux
// colonnes et une seule question — pourquoi importe-t-il tant plus qu'il
// n'exporte ?

import {
  POLES, FLUX, PASSAGES, ROUTE, ROUTE_GOLFE, MAROC, TANGER,
  MONDE_EXPORT, sortants, entrants, repli, exportsTotal, marocBilan,
} from './monde.js';
import { CONTOURS } from './monde-fond.js';

const LON0 = -180, LON1 = 180, LAT0 = -58, LAT1 = 84;
const BORNES = { lon0: LON0, lon1: LON1, lat0: LAT0, lat1: LAT1 };
const VUES = [
  { value: 'flux', label: 'les pôles et les flux' },
  { value: 'passages', label: 'les passages stratégiques' },
  { value: 'maroc', label: 'le Maroc dans les échanges' },
];

export function mount(lab) {
  const { fr } = lab;
  const svg = lab.svg();
  const geo = lab.carte(CONTOURS, { parallele: 0 });
  const texte = (v) => (v == null ? '—' : String(v));

  const vue = lab.select({ label: 'Ce qu’on regarde', options: VUES, value: 'flux',
    onChange: () => { majControles(); dessine(); } });
  const internes = lab.check({ label: 'Montrer les échanges internes aux pôles', onChange: dessine });
  const passage = lab.select({ label: 'Passage',
    options: PASSAGES.map((p) => ({ value: p.id, label: p.nom })), value: 'malacca',
    onChange: dessine });
  const route = lab.check({ label: 'Tracer la grande route maritime', value: true, onChange: dessine });

  const gF = lab.group('Ce qui ne quitte pas son pôle');
  const rMonde = lab.readout({ label: 'Exportations mondiales', unit: ' Md $', dec: 0 });
  const rReplEu = lab.readout({ label: 'Reste en Europe', unit: ' %', dec: 0, hi: true });
  const rReplAs = lab.readout({ label: 'Reste en Asie', unit: ' %', dec: 0 });
  const rReplNa = lab.readout({ label: 'Reste en Amérique du Nord', unit: ' %', dec: 0 });
  const rReplAf = lab.readout({ label: 'Reste en Afrique', unit: ' %', dec: 0 });
  const rPremier = lab.readout({ label: 'Plus gros flux', format: texte });
  const rPremierV = lab.readout({ label: 'soit', unit: ' Md $', dec: 0 });
  const fRows = [rMonde, rReplEu, rReplAs, rReplNa, rReplAf, rPremier, rPremierV];
  // Dans un panneau de deux cents pixels, « Asie → Am. du Nord · 1 250 Md $ »
  // repousse son propre libellé sur trois lignes. Les pôles ont donc un nom
  // encore plus court, réservé aux mesures.
  const BREF = { na: 'Am. Nord', eu: 'Europe', as: 'Asie', mo: 'Moy.-Orient', af: 'Afrique' };

  const gP = lab.group('Le passage choisi');
  const rPnom = lab.readout({ label: 'Nom', format: texte });
  const rPpart = lab.readout({ label: 'Y transite', format: texte, hi: true });
  const rPquoi = lab.readout({ label: 'de', format: texte });
  const rPlarge = lab.readout({ label: 'Largeur', format: texte });
  const pRows = [rPnom, rPpart, rPquoi, rPlarge];

  const gM = lab.group('Le commerce extérieur marocain');
  const rMex = lab.readout({ label: 'Exportations', unit: ' Md $', dec: 0 });
  const rMim = lab.readout({ label: 'Importations', unit: ' Md $', dec: 0 });
  const rMbal = lab.readout({ label: 'Balance commerciale', unit: ' Md $', dec: 0, hi: true });
  const rMcouv = lab.readout({ label: 'Taux de couverture', unit: ' %', dec: 0 });
  const rMue = lab.readout({ label: 'Part de l’Union européenne', unit: ' %', dec: 0 });
  const rMcli = lab.readout({ label: 'Premier client', format: texte });
  const rMfou = lab.readout({ label: 'Premier fournisseur', format: texte });
  const mRows = [rMex, rMim, rMbal, rMcouv, rMue, rMcli, rMfou];

  let polSel = null;

  function majControles() {
    const v = vue.value;
    internes.show(v === 'flux');
    passage.show(v === 'passages');
    route.show(v === 'passages');
    gF.hidden = v !== 'flux'; fRows.forEach((r) => r.show(v === 'flux'));
    gP.hidden = v !== 'passages'; pRows.forEach((r) => r.show(v === 'passages'));
    gM.hidden = v !== 'maroc'; mRows.forEach((r) => r.show(v === 'maroc'));
  }

  /* ── outils ───────────────────────────────────────────────────────────── */
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
      'font-family': a.mono ? 'var(--mono)' : 'inherit',
      opacity: a.op != null ? a.op : 1,
      'paint-order': a.halo ? 'stroke' : null,
      stroke: a.halo ? 'var(--paper)' : null, 'stroke-width': a.halo ? 3 : null,
      'stroke-linejoin': a.halo ? 'round' : null }, p);
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
  function bandeau(titre, sous, W) {
    const fsT = Math.max(12, Math.min(16, W / 46));
    let y = 8 + fsT;
    coupe(titre, W - 20, fsT, true).forEach((l) => { txt(svg, 10, y, l, { fs: fsT, bold: true }); y += fsT * 1.2; });
    y += 2;
    coupe(sous, W - 20, 10.5).forEach((l) => { txt(svg, 10, y, l, { fs: 10.5, fill: 'var(--ink-soft)' }); y += 12.5; });
    return y + 4;
  }

  function fondDeCarte(P) {
    const g = mk('g', {}, svg);
    const a = P(LON0, LAT1), b = P(LON1, LAT0);
    mk('rect', { x: a[0], y: a[1], width: b[0] - a[0], height: b[1] - a[1], rx: 4,
      fill: 'var(--ink)', 'fill-opacity': 0.035, stroke: 'var(--rule)', 'stroke-width': 1 }, g);
    for (let lon = -150; lon <= 150; lon += 30) {
      mk('line', { x1: P(lon, LAT1)[0], y1: a[1], x2: P(lon, LAT0)[0], y2: b[1],
        stroke: 'var(--ink-soft)', 'stroke-width': 0.7, opacity: 0.13 }, g);
    }
    for (let lat = -30; lat <= 60; lat += 30) {
      const y = P(0, lat)[1];
      mk('line', { x1: a[0], y1: y, x2: b[0], y2: y, stroke: 'var(--ink-soft)',
        'stroke-width': lat === 0 ? 1 : 0.7, opacity: lat === 0 ? 0.26 : 0.13 }, g);
    }
    /* Les continents étaient sept polygones tapés à la main. Ils tenaient lieu
       de croquis, et c'en était un : l'Eurasie n'avait ni Italie ni Grèce, et
       l'Inde était un triangle. Ce sont désormais les 176 pays de Natural Earth,
       dessinés d'un seul ton — sur une carte de flux, ce sont les flèches qui
       parlent, pas les frontières. */
    geo.codes().forEach((code) => {
      const d = geo.chemin(code, P);
      if (d) mk('path', { d, fill: 'var(--ink)', 'fill-opacity': 0.11,
        stroke: 'var(--ink-soft)', 'stroke-width': 0.5, 'stroke-opacity': 0.32,
        'stroke-linejoin': 'round' }, g);
    });
    return g;
  }

  // Une quadratique et son point courant : il faut l'un pour tracer, l'autre
  // pour poser la pointe de flèche exactement au bord du disque d'arrivée.
  const quad = (a, c, b, t) => {
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
  };
  function courbe(a, b, cambrure) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [(a[0] + b[0]) / 2 - (dy / l) * cambrure, (a[1] + b[1]) / 2 + (dx / l) * cambrure];
  }
  function tAuRayon(a, c, b, r) {
    let lo = 0, hi = 1;
    for (let i = 0; i < 24; i++) {
      const m = (lo + hi) / 2;
      const p = quad(a, c, b, m);
      if (Math.hypot(p[0] - b[0], p[1] - b[1]) > r) lo = m; else hi = m;
    }
    return lo;
  }

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    regle = mk('text', { x: -9999, y: -9999, fill: 'none' }, svg);
    const { w: W, h: H } = lab.size();
    if (vue.value === 'flux') vueFlux(W, H);
    else if (vue.value === 'passages') vuePassages(W, H);
    else vueMaroc(W, H);
    if (regle) { regle.remove(); regle = null; }
  }

  /* ── vue 1 : les pôles et les flux ────────────────────────────────────── */
  function vueFlux(W, H) {
    const haut = bandeau('Les pôles du commerce mondial',
      internes.value
        ? 'les boucles sont les échanges à l’intérieur de chaque pôle — comparez-les aux flèches'
        : 'largeur des flèches proportionnelle à la racine carrée des montants',
      W);
    /* La légende du pôle cliqué se compose AVANT que la carte soit projetée :
       sa hauteur dépend du nombre de lignes, qui dépend de la largeur de
       l'écran. Une hauteur fixe marchait à 1 500 pixels et faisait sortir deux
       lignes du cadre en dessous de 1 280. */
    const pSel = polSel ? POLES.find((q) => q.id === polSel) : null;
    const lignes = [];
    if (pSel) {
      coupe(pSel.nom + ' — exporte ' + fr(exportsTotal(pSel.id), 0) + ' Md $ en tout, dont '
        + fr(pSel.interne, 0) + ' sans quitter le pôle, soit ' + fr(repli(pSel.id) * 100, 0) + ' %'
        + '  ·  flèches dessinées : ' + fr(sortants(pSel.id), 0) + ' au départ, '
        + fr(entrants(pSel.id), 0) + ' à l’arrivée', W - 20, 10.5, true)
        .forEach((t) => lignes.push({ t, fs: 10.5, bold: true, fill: pSel.couleur }));
      coupe(pSel.detail, W - 20, 10).forEach((t) => lignes.push({ t, fs: 10, fill: 'var(--ink-soft)' }));
    }
    const basRes = pSel ? 14 + lignes.length * 12 : 26;
    const P = geo.cadre({ x: 6, y: haut, w: W - 12, h: H - haut - basRes }, { bornes: BORNES });
    fondDeCarte(P);

    const vmax = Math.max(...FLUX.map((f) => f.v), internes.value ? Math.max(...POLES.map((p) => p.interne)) : 0);
    const ep = (v) => Math.max(1.2, Math.sqrt(v / vmax) * Math.max(6, Math.min(15, P.parDegre * 1.9)));
    const rayon = (p) => Math.max(7, Math.sqrt(p.part / 36) * Math.max(16, Math.min(34, P.parDegre * 4.2)));
    const pos = {};
    POLES.forEach((p) => { pos[p.id] = P(p.lon, p.lat); });

    const gFlux = mk('g', {}, svg);
    FLUX.forEach((f) => {
      const a = pos[f.de], b = pos[f.vers];
      const pa = POLES.find((p) => p.id === f.de), pb = POLES.find((p) => p.id === f.vers);
      // deux sens entre les mêmes pôles : on les cambre en sens opposés, par une
      // règle stable (l'ordre alphabétique) et non par l'ordre de la liste
      const camb = (f.de < f.vers ? 1 : -1) * Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.14;
      const c = courbe(a, b, camb);
      const eteint = polSel && polSel !== f.de && polSel !== f.vers;
      const t = tAuRayon(a, c, b, rayon(pb) + 3);
      const bout = quad(a, c, b, t);
      const av = quad(a, c, b, Math.max(0, t - 0.02));
      mk('path', { d: 'M' + a.join(' ') + ' Q' + c.join(' ') + ' ' + bout.join(' '),
        fill: 'none', stroke: pa.couleur, 'stroke-width': ep(f.v),
        'stroke-linecap': 'round', opacity: eteint ? 0.12 : 0.62 }, gFlux);
      const ang = Math.atan2(bout[1] - av[1], bout[0] - av[0]);
      const tl = Math.max(5, ep(f.v) * 1.5);
      mk('path', { d: 'M' + bout[0] + ' ' + bout[1]
        + ' L' + (bout[0] - tl * Math.cos(ang - 0.42)) + ' ' + (bout[1] - tl * Math.sin(ang - 0.42))
        + ' L' + (bout[0] - tl * Math.cos(ang + 0.42)) + ' ' + (bout[1] - tl * Math.sin(ang + 0.42)) + ' Z',
        fill: pa.couleur, opacity: eteint ? 0.15 : 0.9 }, gFlux);
    });

    if (internes.value) {
      POLES.forEach((p) => {
        const q = pos[p.id], r = rayon(p) + ep(p.interne) / 2 + 5;
        const eteint = polSel && polSel !== p.id;
        mk('circle', { cx: q[0], cy: q[1] - r * 0.15, r, fill: 'none', stroke: p.couleur,
          'stroke-width': ep(p.interne), opacity: eteint ? 0.12 : 0.42 }, svg);
      });
    }

    POLES.forEach((p) => {
      const q = pos[p.id], r = rayon(p);
      const g = mk('g', { cursor: 'pointer' }, svg);
      mk('circle', { cx: q[0], cy: q[1], r, fill: p.couleur,
        stroke: polSel === p.id ? 'var(--ink)' : 'var(--paper)',
        'stroke-width': polSel === p.id ? 2.6 : 1.6,
        opacity: polSel && polSel !== p.id ? 0.4 : 1 }, g);
      txt(g, q[0], q[1] + r + 13, p.court + '  ' + fr(p.part, 0) + ' %',
        { fs: Math.max(10, Math.min(13, P.parDegre * 2.1)), anchor: 'middle', bold: true, halo: true });
      g.addEventListener('click', () => { polSel = polSel === p.id ? null : p.id; dessine(); });
    });

    if (pSel) {
      let y = H - basRes + 12;
      lignes.forEach((l) => { txt(svg, 10, y, l.t, l); y += 12; });
    } else {
      txt(svg, 10, H - 10, 'Cliquez un pôle pour n’en garder que ses flux.',
        { fs: 10, fill: 'var(--ink-soft)', op: 0.8 });
    }

    const gros = FLUX.slice().sort((a, b) => b.v - a.v)[0];
    rMonde.set(MONDE_EXPORT);
    rReplEu.set(repli('eu') * 100); rReplAs.set(repli('as') * 100);
    rReplNa.set(repli('na') * 100); rReplAf.set(repli('af') * 100);
    rPremier.set(BREF[gros.de] + ' → ' + BREF[gros.vers]);
    rPremierV.set(gros.v);
  }

  /* ── vue 2 : les passages stratégiques ────────────────────────────────── */
  function vuePassages(W, H) {
    const sel = PASSAGES.find((p) => p.id === passage.value);
    const haut = bandeau('Les passages stratégiques',
      'la taille du losange suit ce qui transite ; cliquez-en un pour le lire', W);
    const bas = 62;
    const P = geo.cadre({ x: 6, y: haut, w: W - 12, h: H - haut - bas }, { bornes: BORNES });
    fondDeCarte(P);

    if (route.value) {
      const trace = (pts, dash) => mk('path', {
        d: pts.map((q, i) => (i ? 'L' : 'M') + P(q[0], q[1]).join(' ')).join(' '),
        fill: 'none', stroke: 'var(--sub)', 'stroke-width': Math.max(1.6, P.parDegre * 0.55),
        'stroke-dasharray': dash, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        opacity: 0.8 }, svg);
      trace(ROUTE, null);
      trace(ROUTE_GOLFE, '5 4');
    }

    const fs = Math.max(9, Math.min(11.5, P.parDegre * 1.6));
    const boites = [];

    // Tanger Med n'est pas un détroit : c'est le port que le Maroc a posé sur
    // l'un d'eux. Il n'apparaît que quand on regarde Gibraltar, sinon il ferait
    // du bruit sur une carte qui parle de passages.
    if (sel.maroc) {
      const q = P(TANGER.lon, TANGER.lat);
      mk('rect', { x: q[0] - 4, y: q[1] - 4, width: 8, height: 8, rx: 1.5,
        fill: '#c1121f', stroke: 'var(--paper)', 'stroke-width': 1.2 }, svg);
      txt(svg, q[0], q[1] + 15, TANGER.nom,
        { fs: fs * 0.92, anchor: 'middle', bold: true, halo: true, fill: '#c1121f' });
      boites.push({ x0: q[0] - 40, x1: q[0] + 40, y0: q[1] + 15 - fs, y1: q[1] + 15 });
    }
    PASSAGES.forEach((p) => {
      const q = P(p.lon, p.lat);
      const t = Math.max(4.5, Math.sqrt(Math.max(p.part, 2) / 25) * Math.max(9, Math.min(17, P.parDegre * 2.2)));
      const g = mk('g', { cursor: 'pointer' }, svg);
      const actif = p.id === sel.id;
      mk('path', { d: 'M' + q[0] + ' ' + (q[1] - t) + ' L' + (q[0] + t) + ' ' + q[1]
        + ' L' + q[0] + ' ' + (q[1] + t) + ' L' + (q[0] - t) + ' ' + q[1] + ' Z',
        fill: p.part === 0 ? 'var(--paper-2)' : actif ? 'var(--sub)' : '#c9772b',
        stroke: actif ? 'var(--ink)' : 'var(--paper)', 'stroke-width': actif ? 2 : 1.3,
        opacity: actif ? 1 : 0.88 }, g);
      /* Le côté du nom est choisi passage par passage, dans les données, et non
         par une règle générale : autour de la mer Rouge, Suez, Bab el-Mandeb,
         Ormuz et le Bosphore tiennent dans un carré de quinze degrés, et une
         règle du type « à droite sauf près du bord » les empilait tous du même
         côté. Le décalage automatique qui suit ne sert plus que de garde-fou. */
      const gauche = p.cote === 'g';
      // Sur une carte, un détroit s'appelle Ormuz, pas « détroit d'Ormuz » :
      // le nom complet reste dans les mesures et dans la légende du bas. Neuf
      // noms longs ne tiennent pas côte à côte sur un planisphère de six cents
      // pixels, et neuf noms courts, si.
      const nomCarte = p.nom.replace(/^(Détroit (de |du |d’)|Canal de |Cap de )/, '');
      const lw = mesure(nomCarte, fs, actif);
      let lx = gauche ? q[0] - t - 5 : q[0] + t + 5;
      let ly = q[1] + (p.dy < 0 ? -t - 5 : t + fs + 2);
      if (gauche) lx = Math.max(lw + 4, lx); else lx = Math.min(W - 4 - lw, lx);
      ly = Math.max(haut + fs, Math.min(H - bas - 4, ly));
      // et on l'écarte de ceux déjà posés
      // Une marge de cinq pixels, pas de zéro : « elles ne se recouvrent pas »
      // et « on les lit » ne sont pas la même exigence.
      for (let n = 0; n < 12; n++) {
        const x0 = gauche ? lx - lw : lx, x1 = gauche ? lx : lx + lw;
        const heurt = boites.find((b) => x1 > b.x0 - 5 && x0 < b.x1 + 5
          && ly > b.y0 - fs - 4 && ly - fs < b.y1 + 4);
        if (!heurt) break;
        ly = heurt.y1 + fs + 5;
        if (ly > H - bas - 4) { ly = heurt.y0 - 6; break; }
      }
      boites.push({ x0: gauche ? lx - lw : lx, x1: gauche ? lx : lx + lw, y0: ly - fs, y1: ly });
      txt(g, lx, ly, nomCarte, { fs, anchor: gauche ? 'end' : 'start', bold: actif,
        halo: true, fill: actif ? 'var(--sub)' : 'var(--ink)' });
      g.addEventListener('click', () => { passage.set(p.id); dessine(); });
    });

    let y = H - bas + 14;
    txt(svg, 10, y, sel.nom, { fs: 12.5, bold: true, fill: 'var(--sub)' }); y += 15;
    coupe(sel.texte, W - 20, 10.5).forEach((l) => { txt(svg, 10, y, l, { fs: 10.5, fill: 'var(--ink-soft)' }); y += 12; });

    rPnom.set(sel.nom);
    rPpart.set(sel.part ? fr(sel.part, 0) + ' %' : '—');
    rPquoi.set(sel.mesure);
    rPlarge.set(sel.large);
  }

  /* ── vue 3 : le Maroc ─────────────────────────────────────────────────── */
  function vueMaroc(W, H) {
    const b = marocBilan();
    const haut = bandeau('Le commerce extérieur du Maroc',
      'à gauche ce que le Maroc vend, à droite ce qu’il achète ; en couleur pleine, '
      + 'les partenaires de l’Union européenne', W);
    const colW = (W - 30) / 2;
    const cols = [
      { x: 10, titre: 'Clients — ' + fr(MAROC.exports, 0) + ' Md $ exportés', l: MAROC.clients, c: '#2a9d8f' },
      { x: 20 + colW, titre: 'Fournisseurs — ' + fr(MAROC.imports, 0) + ' Md $ importés', l: MAROC.fournisseurs, c: '#c1440e' },
    ];
    const vmax = Math.max(...cols.flatMap((c) => c.l.map((x) => x.v)));

    cols.forEach((col) => {
      const l = col.l.slice().sort((x, y) => y.v - x.v);
      let y = haut + 14;
      const fsT = Math.max(10, Math.min(12.5, W / 68));
      coupe(col.titre, colW, fsT, true).forEach((s) => { txt(svg, col.x, y, s, { fs: fsT, bold: true }); y += fsT * 1.25; });
      y += 6;
      const dispo = H - y - 12;
      const pas = dispo / l.length;
      const hB = Math.min(pas * 0.6, 24);
      const fsN = Math.max(8, Math.min(11, pas * 0.4));
      const gauche = col.x + Math.max(...l.map((x) => mesure(x.nom, fsN))) + 4;
      const etiq = (x) => fr(x.v, 1) + ' Md $';
      const large = Math.max(...l.map((x) => mesure(etiq(x), fsN * 0.92)));
      const long = col.x + colW - large - 6 - gauche - 6;
      l.forEach((x, i) => {
        const yc = y + pas * (i + 0.5);
        txt(svg, gauche, yc + fsN * 0.36, x.nom, { fs: fsN, anchor: 'end', bold: !!x.ue });
        const w = Math.max(2, (x.v / vmax) * long);
        mk('rect', { x: gauche + 6, y: yc - hB / 2, width: w, height: hB, rx: 2.5,
          fill: col.c, 'fill-opacity': x.ue ? 0.95 : 0.34,
          stroke: col.c, 'stroke-width': x.ue ? 0 : 1.2 }, svg);
        txt(svg, gauche + 6 + w + 6, yc + fsN * 0.34, etiq(x),
          { fs: fsN * 0.92, mono: true, fill: 'var(--ink-soft)' });
      });
    });

    rMex.set(MAROC.exports); rMim.set(MAROC.imports);
    rMbal.set(b.balance); rMcouv.set(b.couverture * 100); rMue.set(b.partUE * 100);
    rMcli.set(b.premierClient.nom + ' · ' + fr(b.premierClient.v, 1) + ' Md $');
    rMfou.set(b.premierFournisseur.nom + ' · ' + fr(b.premierFournisseur.v, 1) + ' Md $');
  }

  majControles();
  lab.onResize(dessine);
  dessine();
}
