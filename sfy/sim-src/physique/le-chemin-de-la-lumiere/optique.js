// Le moteur : ce que fait la lumière quand elle rencontre quelque chose.
//
// Aucun trait n'est dessiné à la main. On lance un rayon, on cherche la
// première surface qu'il touche, et ce qui se passe là est la loi — réflexion,
// réfraction de Descartes, réflexion totale quand la formule n'a plus de
// solution. Le tracé qui apparaît à l'écran est le résultat, jamais l'intention.
//
// Rien ici ne connaît le DOM : ce fichier prend une scène et rend des segments.
// C'est ce qui permet de le vérifier tout seul, et c'est pour cela que les
// angles affichés dans le jeu sont ceux du calcul et non des étiquettes posées
// à côté.
//
// ── Les trois raies ────────────────────────────────────────────────────────
// La lumière est ici échantillonnée sur trois longueurs d'onde réelles, les
// raies de Fraunhofer qui servent depuis toujours à mesurer un verre : C (rouge,
// 656,3 nm), e (verte, 546,1 nm) et g (bleue, 435,8 nm). Un vrai spectre est
// continu ; trois raies suffisent à voir la dispersion et donnent au jeu ses
// mélanges — rouge + vert = jaune, les trois = blanc. C'est une simplification,
// elle est dite, et elle ne change rien aux angles : chaque raie est déviée par
// SON indice.

export const RAD = Math.PI / 180, DEG = 180 / Math.PI;

/* Les trois raies. `cle` sert de nom court partout ailleurs. */
export const RAIES = [
  { cle: 'r', lambda: 656.3, nom: 'rouge', css: '#ff3b46' },
  { cle: 'v', lambda: 546.1, nom: 'vert', css: '#3dff7a' },
  { cle: 'b', lambda: 435.8, nom: 'bleu', css: '#4a7bff' },
];
export const RAIE = Object.fromEntries(RAIES.map((r) => [r.cle, r]));
export const BLANC = ['r', 'v', 'b'];

/* La couleur d'un mélange de raies, en additif — c'est ce que font deux
   faisceaux qui tombent au même endroit. Les sept combinaisons ont un nom, et
   c'est ce nom que la cible réclame. */
export const MELANGES = {
  r: { nom: 'rouge', css: '#ff3b46' },
  v: { nom: 'vert', css: '#3dff7a' },
  b: { nom: 'bleu', css: '#4a7bff' },
  rv: { nom: 'jaune', css: '#ffd23b' },
  vb: { nom: 'cyan', css: '#3ce0ff' },
  rb: { nom: 'magenta', css: '#ff54d0' },
  rvb: { nom: 'blanc', css: '#fff6e2' },
};
export const cleMelange = (cles) => BLANC.filter((c) => cles.includes(c)).join('');
export const nomMelange = (cles) => (MELANGES[cleMelange(cles)] || {}).nom || 'rien';

/* ── une bande, deux écritures ──────────────────────────────────────────────
   Le jeu travaille sur trois raies nommées, parce qu'un casse-tête a besoin de
   couleurs qui se nomment et se mélangent. Le bac à sable a un laser, et un
   laser a UNE longueur d'onde, pas une case parmi trois. Une bande est donc
   soit 'r' | 'v' | 'b', soit un nombre : λ en nanomètres. Tout le reste du
   moteur ne connaît que `lambdaDe`. */
export const lambdaDe = (c) => (typeof c === 'number' ? c : RAIE[c].lambda);

/* λ → couleur, approximation de la réponse de l'œil (Bruton). Ce n'est pas la
   couleur « vraie » d'une radiation — un écran ne sait pas produire une
   monochromatique — mais c'est ce que l'œil en ferait, et c'est ce qu'on veut
   montrer. */
export function cssSpectre(lam) {
  let r = 0, v = 0, b = 0;
  if (lam >= 380 && lam < 440) { r = -(lam - 440) / 60; b = 1; }
  else if (lam < 490) { v = (lam - 440) / 50; b = 1; }
  else if (lam < 510) { v = 1; b = -(lam - 510) / 20; }
  else if (lam < 580) { r = (lam - 510) / 70; v = 1; }
  else if (lam < 645) { r = 1; v = -(lam - 645) / 65; }
  else if (lam <= 780) { r = 1; }
  // l'œil s'éteint aux deux bouts du visible
  let g = 1;
  if (lam > 700) g = 0.3 + 0.7 * (780 - lam) / 80;
  else if (lam < 420) g = 0.3 + 0.7 * (lam - 380) / 40;
  const q = (v2) => Math.round(255 * Math.min(1, Math.max(0, v2 * g)) ** 0.8);
  return 'rgb(' + q(r) + ',' + q(v) + ',' + q(b) + ')';
}
export const cssDe = (c) => (typeof c === 'number' ? cssSpectre(c) : RAIE[c].css);

/* La couleur d'un faisceau. Trois raies nommées → le mélange a un nom ; sinon
   on additionne les couleurs, ce que fait la lumière. */
export function cssMelange(cles) {
  if (!cles || !cles.length) return '#555';
  if (cles.every((c) => typeof c === 'string')) {
    return (MELANGES[cleMelange(cles)] || {}).css || '#555';
  }
  let r = 0, v = 0, b = 0;
  for (const c of cles) {
    const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(cssDe(c));
    if (m) { r = Math.max(r, +m[1]); v = Math.max(v, +m[2]); b = Math.max(b, +m[3]); }
  }
  return 'rgb(' + r + ',' + v + ',' + b + ')';
}

/* ── les verres ────────────────────────────────────────────────────────────
   Les mêmes coefficients de Cauchy que la simulation du prisme, calés sur des
   verres réels : n(λ) = A + B/λ², λ en micromètres. Le violet, plus lent dans
   le verre, est plus dévié que le rouge — toute la dispersion tient là.
   L'eau est là pour la colonne d'eau : elle réfracte franchement et disperse
   très peu, ce qui est exactement ce qu'on lui demande. */
export const MILIEUX = {
  crown: { nom: 'crown — verre ordinaire', A: 1.504586, B: 0.004217 },
  flint: { nom: 'flint', A: 1.593880, B: 0.009017 },
  lourd: { nom: 'flint dense', A: 1.708645, B: 0.014279 },
  eau: { nom: 'eau', A: 1.324473, B: 0.003112 },
};

/* n(λ). `disperse = false` gèle l'indice à la raie verte : le prisme dévie
   encore, mais ne décompose plus. C'est l'expérience de pensée du cours, et
   dans le jeu c'est une case à cocher qui casse la moitié des solutions. */
export function indice(milieu, cle, disperse = true) {
  const m = MILIEUX[milieu] || MILIEUX.crown;
  const lam = (disperse ? lambdaDe(cle) : RAIE.v.lambda) / 1000;
  return m.A + m.B / (lam * lam);
}

/* ── vecteurs ─────────────────────────────────────────────────────────────── */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const len = (a) => Math.hypot(a[0], a[1]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const perp = (a) => [-a[1], a[0]];
export const versDeg = (d) => Math.atan2(d[1], d[0]) * DEG;
export const depuisDeg = (a) => [Math.cos(a * RAD), Math.sin(a * RAD)];

/* Un segment tourné autour de son milieu — la forme de presque toutes les
   pièces, du miroir à la lentille. */
export function segmentDe(x, y, angleDeg, longueur) {
  const u = mul(depuisDeg(angleDeg), longueur / 2);
  return { a: [x - u[0], y - u[1]], b: [x + u[0], y + u[1]] };
}

/* Un polygone tourné autour de son centre. */
export function polygoneDe(x, y, angleDeg, points) {
  const c = Math.cos(angleDeg * RAD), s = Math.sin(angleDeg * RAD);
  return points.map(([px, py]) => [x + px * c - py * s, y + px * s + py * c]);
}

/* Le triangle équilatéral d'un prisme, sommet en haut, centré sur son
   centre de gravité — pour qu'il tourne sans se déplacer. */
export function trianglePrisme(cote) {
  const h = cote * Math.sqrt(3) / 2;
  return [[0, -2 * h / 3], [cote / 2, h / 3], [-cote / 2, h / 3]];
}

/* ── intersections ────────────────────────────────────────────────────────── */

/* Rayon (p, d) contre un segment [a,b]. Rend la distance le long du rayon, ou
   null. `eps` écarte le point de départ de la surface qu'on vient de quitter :
   sans lui un rayon se re-touche lui-même à l'infini. */
function toucheSegment(p, d, a, b, eps = 1e-6) {
  const e = sub(b, a);
  const den = d[0] * e[1] - d[1] * e[0];
  if (Math.abs(den) < 1e-12) return null;              // parallèles
  const w = sub(a, p);
  const t = (w[0] * e[1] - w[1] * e[0]) / den;         // le long du rayon
  const u = (w[0] * d[1] - w[1] * d[0]) / den;         // le long du segment
  if (t <= eps || u < 0 || u > 1) return null;
  return t;
}

/* ── le miroir courbe ──────────────────────────────────────────────────────
   Un arc de cercle, pas une parabole, et c'est voulu : un miroir sphérique est
   ce qu'on taille, et son défaut — l'aberration de sphéricité — sort tout seul
   du calcul exact. Les rayons loin de l'axe ne croisent pas au même endroit que
   ceux du centre, et c'est pourquoi un télescope digne du nom est parabolique.
   On ne modélise donc PAS `f = R/2` : on réfléchit sur le cercle, et R/2 est ce
   qu'on retrouve à la limite paraxiale.

   Le sommet S est en (x, y), l'axe pointe vers le centre de courbure C, et R
   porte le signe : R > 0 concave (il fait converger), R < 0 convexe. */
export function arcDe(piece) {
  const u = depuisDeg(piece.angle);
  const R = piece.R;
  const C = [piece.x + u[0] * R, piece.y + u[1] * R];
  const dirS = R > 0 ? [-u[0], -u[1]] : u;      // de C vers le sommet
  const demi = Math.min(0.95, (piece.ouverture || 20) / 2 / Math.abs(R));
  return { C, R: Math.abs(R), dirS, cosMax: Math.cos(Math.asin(demi)) };
}

function toucheArc(p, d, arc, eps = 1e-6) {
  const w = sub(p, arc.C);
  const b = dot(w, d), cc = dot(w, w) - arc.R * arc.R;
  const disc = b * b - cc;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  for (const t of [-b - s, -b + s]) {
    if (t <= eps) continue;
    const P = add(p, mul(d, t));
    // dans l'ouverture, ou pas de miroir à cet endroit
    if (dot(norm(sub(P, arc.C)), arc.dirS) >= arc.cosMax) return t;
  }
  return null;
}

function toucheCercle(p, d, c, r, eps = 1e-6) {
  const w = sub(p, c);
  const b = dot(w, d), cc = dot(w, w) - r * r;
  const disc = b * b - cc;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  const t1 = -b - s, t2 = -b + s;
  if (t1 > eps) return t1;
  if (t2 > eps) return t2;
  return null;
}

/* ── les surfaces d'une pièce ──────────────────────────────────────────────
   Chaque pièce est réduite à des faces, et c'est tout ce que le tracé connaît.
   Une face porte son propriétaire, pour que le rebond sache quoi faire. */
export function facesDe(piece) {
  const t = piece.type;
  if (t === 'miroir' || t === 'lentille' || t === 'filtre' || t === 'separateur' || t === 'ecran') {
    const s = segmentDe(piece.x, piece.y, piece.angle, piece.longueur);
    return [{ a: s.a, b: s.b, piece }];
  }
  /* Le diaphragme n'a pas de trou : il a DEUX volets, et le trou est ce qu'il y
     a entre eux. Rien à programmer pour « laisser passer » — ce qui passe est ce
     que rien n'arrête, et c'est exactement ce qu'est un sténopé. */
  if (t === 'diaphragme') {
    const s = segmentDe(piece.x, piece.y, piece.angle, piece.longueur);
    const dir = depuisDeg(piece.angle), h = (piece.trou || 2) / 2;
    const c = [piece.x, piece.y];
    return [
      { a: s.a, b: [c[0] - dir[0] * h, c[1] - dir[1] * h], piece },
      { a: [c[0] + dir[0] * h, c[1] + dir[1] * h], b: s.b, piece },
    ];
  }
  if (t === 'prisme') {
    const p = polygoneDe(piece.x, piece.y, piece.angle, trianglePrisme(piece.cote));
    return p.map((v, i) => ({ a: v, b: p[(i + 1) % p.length], piece, c: [piece.x, piece.y] }));
  }
  if (t === 'bloc' || t === 'mur') {
    const w = piece.w / 2, h = piece.h / 2;
    const p = polygoneDe(piece.x, piece.y, piece.angle || 0,
      [[-w, -h], [w, -h], [w, h], [-w, h]]);
    return p.map((v, i) => ({ a: v, b: p[(i + 1) % p.length], piece, c: [piece.x, piece.y] }));
  }
  return [];
}

/* La normale d'une face, et de quel côté on la traverse.
   « Entrant » ne peut pas se lire sur l'ordre des sommets : perp() tourne dans
   le sens des mathématiques, l'écran a son y vers le bas, et le rectangle écrit
   dans l'ordre le plus naturel donne alors des normales qui pointent vers
   l'INTÉRIEUR. Le verre était donc traversé à l'envers — η = n au lieu de 1/n —
   et le rayon s'écartait de la normale en entrant dans le verre, ce qu'aucune
   vitre ne fait. On oriente donc la normale par rapport au centre du solide,
   qui ne dépend d'aucune convention ; pour un miroir, qui n'a pas d'intérieur,
   elle se contente de faire face au rayon. */
function normalePour(face, d) {
  let n0 = norm(perp(sub(face.b, face.a)));
  if (face.c) {
    const mid = mul(add(face.a, face.b), 0.5);
    if (dot(n0, sub(mid, face.c)) < 0) n0 = mul(n0, -1);   // dehors
  }
  const entrant = dot(n0, d) < 0;
  return { n: entrant ? n0 : mul(n0, -1), entrant };
}

/* ── ce qui se passe au contact ─────────────────────────────────────────────
   Chaque cas est la loi, pas une recette :
     réflexion      d' = d − 2(d·n)n
     réfraction     t = η d + (η cos i − cos r) n,  η = n₁/n₂
     réflexion totale : il ne reste rien sous la racine, donc pas de rayon
                        réfracté — elle n'est pas un cas particulier ajouté à la
                        main, c'est ce qui reste quand la formule échoue. */
function reflechir(d, n) { return norm(sub(d, mul(n, 2 * dot(d, n)))); }

function refracter(d, n, eta) {
  const cosi = -dot(n, d);
  const k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;                              // réflexion totale
  return norm(add(mul(d, eta), mul(n, eta * cosi - Math.sqrt(k))));
}

/* La lentille mince, règle des angles : un rayon qui arrive à la hauteur h de
   l'axe avec la pente u repart avec u' = u − h/f. C'est la loi du cours, exacte
   pour la lentille mince idéale — et le foyer dépend de λ comme celui d'une
   vraie lentille, puisque 1/f = (n−1)(1/R₁ − 1/R₂) : f(λ) = f_e (n_e − 1)/(n(λ) − 1).
   Le bleu converge donc avant le rouge, ce qui est l'aberration chromatique. */
function traverserLentille(p, d, piece, cle, disperse) {
  const axe = perp(depuisDeg(piece.angle));            // la normale au plan de la lentille
  const nx = dot(d, axe) >= 0 ? axe : mul(axe, -1);    // l'axe, dans le sens de la marche
  const a = perp(nx);
  const dn = dot(d, nx);
  if (Math.abs(dn) < 1e-6) return null;                // rasante : elle ne traverse pas
  const u = dot(d, a) / dn;
  const h = dot(sub(p, [piece.x, piece.y]), a);
  const ne = indice(piece.milieu || 'crown', 'v', true);
  const nl = indice(piece.milieu || 'crown', cle, disperse);
  const f = piece.f * (ne - 1) / (nl - 1);
  const u2 = u - h / f;
  return norm(add(nx, mul(a, u2)));
}

/* ── le tracé ──────────────────────────────────────────────────────────────
   Une file de rayons, chacun avec ses raies et son intensité. Un prisme qui
   reçoit du blanc rend trois rayons parce que trois indices donnent trois
   angles ; une lame semi-réfléchissante en rend deux. La file s'arrête sur un
   budget, jamais sur un compteur de rebonds arbitraire : c'est le nombre total
   de segments dessinés qui doit rester fini. */
export function tracer(scene, opts = {}) {
  const disperse = opts.disperse !== false;
  const bord = scene.bord || { x: 0, y: 0, w: 100, h: 100 };
  const maxSegments = opts.maxSegments || 900;
  const maxRebonds = opts.maxRebonds || 60;
  const seuil = 0.035;                                 // au-dessous, on ne voit plus rien

  const faces = [];
  for (const p of scene.pieces) for (const f of facesDe(p)) faces.push(f);
  const cibles = scene.pieces.filter((p) => p.type === 'cible');
  const oeils = scene.pieces.filter((p) => p.type === 'oeil');
  // les miroirs courbes ne sont ni des segments ni des cercles entiers :
  // leur arc est calcule une fois, pas a chaque rayon
  const courbes = scene.pieces.filter((p) => p.type === 'miroirc')
    .map((p) => ({ piece: p, arc: arcDe(p) }));
  const ronds = cibles.concat(oeils);                  // tout ce qui se touche en rond

  const segments = [];                                 // ce qu'on dessinera
  const contacts = [];                                 // pour les angles affichés
  const recu = new Map();                              // capteur → { cles:Set, intensite }
  ronds.forEach((c) => recu.set(c, { cles: new Set(), i: 0 }));
  // Un écran garde OÙ la lumière tombe sur lui : c'est ce qui fait apparaître
  // l'image du sténopé et celle de la lentille, sans que personne ne la dessine.
  const surEcran = new Map();
  scene.pieces.filter((p) => p.type === 'ecran').forEach((e) => surEcran.set(e, []));

  // Les murs du plateau : un rayon qui sort est perdu, mais son segment doit
  // s'arrêter au bord et pas à l'infini.
  const cadre = [
    { a: [bord.x, bord.y], b: [bord.x + bord.w, bord.y] },
    { a: [bord.x + bord.w, bord.y], b: [bord.x + bord.w, bord.y + bord.h] },
    { a: [bord.x + bord.w, bord.y + bord.h], b: [bord.x, bord.y + bord.h] },
    { a: [bord.x, bord.y + bord.h], b: [bord.x, bord.y] },
  ].map((f) => ({ ...f, piece: { type: 'bord' } }));

  /* ── ce qui émet ──────────────────────────────────────────────────────────
     Quatre façons d'être une source, et la différence entre elles est de la
     physique, pas de la décoration :

       source / laser  un seul rayon. Un laser, c'est cela : une direction et
                       une longueur d'onde.
       ampoule         un point qui rayonne dans TOUTES les directions. C'est
                       ce qui fait les ombres, et ce qui rend un sténopé
                       possible : sans éventail, pas d'image.
       objet           une flèche lumineuse — l'objet AB du cours. Chacun de ses
                       points rayonne dans un cône, et c'est pour cela qu'une
                       lentille en fait une image et pas un point. */
  const file = [];
  const pousse = (p, d, cles, i, src) =>
    file.push({ p, d, cles: cles.slice(), i, dans: null, n: 0, src });

  /* ── viser les ouvertures ─────────────────────────────────────────────────
     Un trou de sténopé large de 1,4 vu depuis 80 unités mesure un degré : dans
     un éventail uniforme de soixante degrés, il faut cent rayons pour qu'UN
     passe. C'est d'ailleurs pourquoi une chambre noire est sombre — mais une
     image faite d'un seul rayon ne s'observe pas.
     Alors, en plus de l'éventail, chaque point de l'objet envoie des rayons
     VERS les ouvertures : le trou, la lentille. Ce n'est pas une ruse, c'est la
     construction du cours — on trace les rayons utiles, ceux qui passent, et on
     ne dessine pas les milliers qui vont se perdre dans le mur. La physique de
     chacun d'eux est inchangée. */
  const ouvertures = [];
  // La case « les rayons de construction » du panneau : décochée, on ne voit
  // plus que l'éventail uniforme — et le sténopé redevient l'objet sombre
  // qu'il est vraiment. C'est une démonstration, pas un réglage de confort.
  for (const p of (opts.viser === false ? [] : scene.pieces)) {
    if (p.type === 'lentille') {
      const s = segmentDe(p.x, p.y, p.angle, p.longueur * .96);
      for (let k = 0; k < 9; k++) {
        const t = k / 8;
        ouvertures.push([s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t]);
      }
    } else if (p.type === 'diaphragme') {
      const dir = depuisDeg(p.angle), h = (p.trou || 2) / 2;
      for (let k = 0; k < 7; k++) {
        const t = (k / 6 - .5) * 1.7 * h;                // un peu plus large que le trou
        ouvertures.push([p.x + dir[0] * t, p.y + dir[1] * t]);
      }
    }
  }
  const viser = (P, cles, i, src) => {
    for (const o of ouvertures) {
      const d = sub(o, P);
      if (Math.hypot(d[0], d[1]) < 1e-6) continue;
      pousse(P, norm(d), cles, i, src);
    }
  };

  for (const s of scene.pieces) {
    const cles = (s.bandes || BLANC);
    if (s.type === 'source' || s.type === 'laser') {
      pousse([s.x, s.y], depuisDeg(s.angle), cles, s.i != null ? s.i : 1, { piece: s, pt: 0, u: 0 });
    } else if (s.type === 'ampoule') {
      const n = s.rayons || 72;
      const src = { piece: s, pt: 0, u: 0 };
      for (let k = 0; k < n; k++) {
        pousse([s.x, s.y], depuisDeg((360 * k) / n + (s.angle || 0)), cles,
          s.i != null ? s.i : .85, src);
      }
      viser([s.x, s.y], cles, s.i != null ? s.i : .85, src);
    } else if (s.type === 'objet') {
      const le = perp(depuisDeg(s.angle));             // le long de la flèche
      const npts = s.points || 3, nray = s.rayons || 15, cone = s.cone || 74;
      for (let j = 0; j < npts; j++) {
        const u = npts === 1 ? 0 : (j / (npts - 1) - .5) * s.h;
        const P = [s.x + le[0] * u, s.y + le[1] * u];
        const src = { piece: s, pt: j, u };
        for (let k = 0; k < nray; k++) {
          const a = s.angle - cone / 2 + (cone * k) / Math.max(1, nray - 1);
          pousse(P, depuisDeg(a), cles, s.i != null ? s.i : .8, src);
        }
        viser(P, cles, s.i != null ? s.i : .8, src);
      }
    }
  }

  while (file.length && segments.length < maxSegments) {
    const ray = file.shift();
    if (ray.n > maxRebonds || ray.i < seuil) continue;

    // la première chose touchée
    let best = null, bt = Infinity, bcible = null, bcourbe = null;
    for (const f of faces.concat(cadre)) {
      const t = toucheSegment(ray.p, ray.d, f.a, f.b);
      if (t != null && t < bt) { bt = t; best = f; bcible = null; }
    }
    for (const c of ronds) {
      const t = toucheCercle(ray.p, ray.d, [c.x, c.y], c.r);
      if (t != null && t < bt) { bt = t; best = null; bcible = c; bcourbe = null; }
    }
    for (const k of courbes) {
      const t = toucheArc(ray.p, ray.d, k.arc);
      if (t != null && t < bt) { bt = t; best = null; bcible = null; bcourbe = k; }
    }
    if (!best && !bcible && !bcourbe) continue;                    // ne devrait pas arriver : le cadre est fermé

    const fin = add(ray.p, mul(ray.d, bt));
    segments.push({ a: ray.p, b: fin, cles: ray.cles, i: ray.i, dans: ray.dans,
      n: ray.n, src: ray.src });

    if (bcourbe) {
      /* La normale d'une sphere est radiale : elle passe par le centre de
         courbure. Rien de plus n'est necessaire — i = r s'applique la comme
         ailleurs, et la focalisation en R/2 en decoule au lieu d'etre posee. */
      let n = norm(sub(fin, bcourbe.arc.C));
      if (dot(n, ray.d) > 0) n = mul(n, -1);
      const ai = Math.acos(Math.min(1, Math.max(-1, -dot(n, ray.d)))) * DEG;
      contacts.push({ p: fin, n, i: ai, r: ai, type: 'miroir', cles: ray.cles });
      file.push({ ...ray, p: fin, d: reflechir(ray.d, n), n: ray.n + 1 });
      continue;
    }

    if (bcible) {
      const r = recu.get(bcible);
      ray.cles.forEach((c) => r.cles.add(c));
      r.i = Math.max(r.i, ray.i);
      continue;                                        // une bille, un œil : cela absorbe
    }

    const piece = best.piece, t = piece.type;
    const { n, entrant } = normalePour(best, ray.d);
    const cosi = Math.min(1, Math.max(-1, -dot(n, ray.d)));
    const angleI = Math.acos(cosi) * DEG;

    if (t === 'bord' || t === 'mur' || t === 'diaphragme') continue;   // absorbé

    if (t === 'ecran') {
      // on garde la position LE LONG de l'écran : c'est l'abscisse de l'image
      const s0 = segmentDe(piece.x, piece.y, piece.angle, piece.longueur);
      const dir = depuisDeg(piece.angle);
      surEcran.get(piece).push({
        u: dot(sub(fin, [piece.x, piece.y]), dir),
        p: fin, cles: ray.cles, i: ray.i, src: ray.src, n: ray.n,
      });
      continue;
    }

    if (t === 'miroir') {
      contacts.push({ p: fin, n, i: angleI, r: angleI, type: 'miroir', cles: ray.cles });
      file.push({ ...ray, p: fin, d: reflechir(ray.d, n), n: ray.n + 1 });
      continue;
    }

    if (t === 'filtre') {
      // Un filtre ne dévie pas : il retient. Ce qui passe est l'intersection
      // des raies du rayon et de celles du filtre.
      const passe = ray.cles.filter((c) => (piece.bandes || []).includes(c));
      if (passe.length) file.push({ ...ray, p: fin, cles: passe, n: ray.n + 1 });
      continue;
    }

    if (t === 'separateur') {
      // Lame semi-réfléchissante : moitié transmise, moitié réfléchie. Sans
      // l'intensité, ce serait un duplicateur de lumière — et le jeu mentirait.
      file.push({ ...ray, p: fin, i: ray.i * 0.5, n: ray.n + 1 });
      file.push({ ...ray, p: fin, d: reflechir(ray.d, n), i: ray.i * 0.5, n: ray.n + 1 });
      contacts.push({ p: fin, n, i: angleI, r: angleI, type: 'separateur', cles: ray.cles });
      continue;
    }

    if (t === 'lentille') {
      // Chaque raie a son foyer : si le rayon en porte plusieurs, il se sépare.
      for (const cle of ray.cles) {
        const d2 = traverserLentille(fin, ray.d, piece, cle, disperse);
        if (d2) file.push({ ...ray, p: fin, d: d2, cles: [cle], n: ray.n + 1 });
      }
      continue;
    }

    if (t === 'prisme' || t === 'bloc') {
      const milieu = piece.milieu || (t === 'bloc' ? 'eau' : 'crown');
      // Chaque raie porte son indice ; un rayon blanc qui entre dans le verre
      // se sépare en trois parce que trois indices donnent trois angles.
      for (const cle of ray.cles) {
        const nm = indice(milieu, cle, disperse);
        const eta = entrant ? 1 / nm : nm;
        const d2 = refracter(ray.d, n, eta);
        if (!d2) {
          // réflexion totale : rien ne sort de ce côté
          file.push({ ...ray, p: fin, d: reflechir(ray.d, n), cles: [cle],
            dans: ray.dans, n: ray.n + 1 });
          if (ray.cles.length === 1) {
            contacts.push({ p: fin, n, i: angleI, r: angleI, type: 'totale', cles: [cle] });
          }
          continue;
        }
        // r se mesure du même côté que i, entre le rayon transmis et la normale
        // qu'il traverse : cos r = −(n·d′), puisque d′ repart de l'autre côté.
        const angleR = Math.acos(Math.min(1, Math.max(-1, -dot(n, d2)))) * DEG;
        if (ray.cles.length === 1) {
          contacts.push({ p: fin, n, i: angleI, r: angleR, type: 'refraction',
            cles: [cle], n1: entrant ? 1 : nm, n2: entrant ? nm : 1 });
        }
        file.push({ ...ray, p: fin, d: d2, cles: [cle],
          dans: entrant ? milieu : null, n: ray.n + 1 });
      }
      continue;
    }
  }

  // Une cible est satisfaite quand elle reçoit EXACTEMENT ce qu'elle demande.
  // « Exactement » et non « au moins » : sinon le blanc résoudrait tout, et le
  // prisme ne servirait plus à rien.
  const etats = cibles.map((c) => {
    const r = recu.get(c);
    const eu = cleMelange([...r.cles]);
    const veut = cleMelange(c.bandes || BLANC);
    return { cible: c, eu, veut, ok: eu === veut && r.i >= seuil, i: r.i };
  });

  const vus = oeils.map((o) => {
    const r = recu.get(o);
    return { oeil: o, cles: [...r.cles], i: r.i };
  });
  const ecrans = [...surEcran].map(([piece, taches]) => ({ piece, taches }));

  return {
    segments, contacts, etats, vus, ecrans,
    gagne: etats.length > 0 && etats.every((e) => e.ok),
  };
}

/* ── mesurer sur le dessin ──────────────────────────────────────────────────
   Le point où un faisceau de rayons se recoupe, au sens des moindres carrés.
   C'est ainsi qu'on trouve l'image d'un point : non pas en appliquant la
   formule de conjugaison, mais en regardant OÙ LES RAYONS SE CROISENT. La
   formule sert ensuite à vérifier la mesure, et jamais à la produire — sinon on
   ne vérifie rien du tout.

   Minimiser Σ ‖(I − Pᵢ) − ((I − Pᵢ)·dᵢ) dᵢ‖² conduit à (Σ Mᵢ) I = Σ Mᵢ Pᵢ,
   avec Mᵢ = 1 − dᵢ dᵢᵗ, un système 2×2. */
export function convergence(lignes) {
  if (!lignes || lignes.length < 2) return null;
  let a11 = 0, a12 = 0, a22 = 0, b1 = 0, b2 = 0;
  for (const L of lignes) {
    const [dx, dy] = norm(L.d);
    const m11 = 1 - dx * dx, m12 = -dx * dy, m22 = 1 - dy * dy;
    a11 += m11; a12 += m12; a22 += m22;
    b1 += m11 * L.p[0] + m12 * L.p[1];
    b2 += m12 * L.p[0] + m22 * L.p[1];
  }
  const det = a11 * a22 - a12 * a12;
  if (Math.abs(det) < 1e-9) return null;               // rayons parallèles : pas d'image
  const x = (b1 * a22 - b2 * a12) / det;
  const y = (b2 * a11 - b1 * a12) / det;
  // l'écart résiduel dit si le point vaut quelque chose
  let ecart = 0;
  for (const L of lignes) {
    const [dx, dy] = norm(L.d);
    const wx = x - L.p[0], wy = y - L.p[1];
    const t = wx * dx + wy * dy;
    ecart += Math.hypot(wx - t * dx, wy - t * dy) ** 2;
  }
  return { p: [x, y], ecart: Math.sqrt(ecart / lignes.length), n: lignes.length };
}

/* Les rayons partis d'un même point de l'objet et déjà passés par `apres`
   éléments. Trois suffisent à définir un croisement ; on en prend tous ceux
   qu'on a, parce que le résidu des moindres carrés est justement ce qui dit si
   l'image est nette. */
export function faisceauDe(segments, piece, pt, apres = 1) {
  return segments
    .filter((s) => s.src && s.src.piece === piece && s.src.pt === pt && s.n >= apres)
    .map((s) => ({ p: s.a, d: [s.b[0] - s.a[0], s.b[1] - s.a[1]] }));
}

/* ── l'image d'un objet par une lentille, mesurée ──────────────────────────
   On prend les rayons partis du SOMMET de l'objet, on regarde où ils se
   recoupent une fois la lentille passée, et on lit dessus OA′ et γ. La relation
   de conjugaison est ensuite comparée à cette mesure ; elle ne la fabrique pas.

   Le cas de l'image virtuelle vient tout seul : si l'objet est plus près que le
   foyer, les rayons ressortent divergents, et le point où les moindres carrés
   les font se croiser est en arrière de la lentille — OA′ négatif, γ positif,
   image droite et plus grande. Rien n'a été ajouté pour cela. */
export function mesurerImage(sortie, objet, lentille) {
  if (!objet || !lentille) return null;
  const O = [lentille.x, lentille.y];
  const A = [objet.x, objet.y];
  // l'axe optique, orienté dans le sens de la marche de la lumière
  let axe = perp(depuisDeg(lentille.angle));
  if (dot(sub(O, A), axe) < 0) axe = mul(axe, -1);
  const lat = perp(axe);

  const le = perp(depuisDeg(objet.angle));
  const B = [objet.x + le[0] * (objet.h / 2), objet.y + le[1] * (objet.h / 2)];
  const OA = dot(sub(A, O), axe);
  const hB = dot(sub(B, O), lat);

  const img = convergence(faisceauDe(sortie.segments, objet, (objet.points || 3) - 1, 1));
  if (!img) return { OA, hB, B, axe, lat, OAp: null };
  const OAp = dot(sub(img.p, O), axe);
  const hBp = dot(sub(img.p, O), lat);
  return {
    OA, OAp, hB, hBp, B, Bp: img.p, axe, lat,
    gamma: Math.abs(hB) > 1e-9 ? hBp / hB : null,
    ecart: img.ecart,
    conjugaison: 1 / OAp - 1 / OA,
    attendu: 1 / lentille.f,
    reelle: OAp > 0,
  };
}

/* Le chemin optique, Σ n·L — ce que Fermat rend minimal. Il se lit sur les
   segments déjà tracés, donc il ne peut pas raconter autre chose qu'eux. */
export function cheminOptique(segments, disperse = true) {
  let s = 0;
  for (const g of segments) {
    const n = g.dans ? indice(g.dans, g.cles[0] || 'v', disperse) : 1;
    s += n * Math.hypot(g.b[0] - g.a[0], g.b[1] - g.a[1]);
  }
  return s;
}
