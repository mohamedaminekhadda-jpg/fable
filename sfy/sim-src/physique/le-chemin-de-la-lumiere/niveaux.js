// Les niveaux.
//
// Le plateau fait 160 sur 100, origine en haut à gauche, y vers le bas — les
// coordonnées de l'écran, pour qu'un niveau se lise comme il se voit.
//
// Chaque niveau porte SA SOLUTION, et `npm run test:optique` la joue. Un niveau
// impossible ne se voit pas en le regardant : on croit seulement qu'on n'a pas
// trouvé. Chaque niveau déclare aussi ce qu'il doit FAIRE VOIR (`exige`), et le
// test vérifie que sa solution le montre — sans quoi un niveau peut se résoudre
// par un chemin qui n'enseigne rien, et sa leçon devient un mensonge poli.
//
//   fixe     ce qui est posé et qu'on ne peut pas bouger
//   tiroir   ce qu'on a le droit de poser, et combien
//   solution une disposition qui gagne (il y en a d'autres)
//   exige    ce que la solution doit montrer : 'totale', 'refraction', 'miroir'
//   lecon    ce que le niveau apprend — c'est lui qui décide de l'ordre
//
// ── Une leçon apprise en construisant ce jeu ───────────────────────────────
// Le premier jeu de niveaux demandait au prisme d'étaler un spectre assez large
// pour viser trois billes distinctes. La mesure a répondu non : sur un bras de
// cinquante unités, l'éventail d'un prisme de crown fait 0,8 unité. C'est
// pourquoi un spectroscope a un bras long, et c'est pourquoi ces niveaux-là
// étaient infaisables — le vérificateur les a refusés avant qu'ils ne partent.
//
// Ce qui sépare franchement les couleurs à cette échelle, c'est l'angle limite :
// il vaut 35,04° pour le rouge et 34,10° pour le bleu dans le flint dense. Entre
// les deux — une fenêtre de 0,94°, soit un cran du cadran — le bleu est
// totalement réfléchi pendant que le rouge et le vert passent. Le prisme devient
// un trieur de couleurs, net, et c'est de la physique et non un arrangement.

export const PLATEAU = { x: 0, y: 0, w: 160, h: 100 };

/* Le pas de la main : une pièce se pose sur ces positions-là et sur ces
   angles-là, pas ailleurs. Le vérificateur s'en sert AUSSI — sans quoi il
   trouverait des solutions à 37,3°, que personne ne peut poser, et le niveau
   serait déclaré faisable alors qu'il ne l'est pas. */
export const PAS = { xy: 2, angle: 1 };
export const poser = (p) => ({
  ...p,
  x: Math.round(p.x / PAS.xy) * PAS.xy,
  y: Math.round(p.y / PAS.xy) * PAS.xy,
  angle: ((Math.round(p.angle / PAS.angle) * PAS.angle) % 360 + 360) % 360,
});

export const TAILLES = {
  miroir: { longueur: 20 },
  prisme: { cote: 16, milieu: 'crown' },
  lentille: { longueur: 22, f: 34, milieu: 'crown' },
  filtre: { longueur: 16 },
  separateur: { longueur: 18 },
};

const src = (x, y, angle, bandes) => ({ type: 'source', x, y, angle, bandes: bandes || ['r', 'v', 'b'] });
const cible = (x, y, bandes) => ({ type: 'cible', x, y, r: 4, bandes });
const mur = (x, y, w, h) => ({ type: 'mur', x, y, w, h, angle: 0 });
const eau = (x, y, w, h, angle) => ({ type: 'bloc', x, y, w, h, angle: angle || 0, milieu: 'eau' });

export const NIVEAUX = [
  {
    id: 'droit-devant',
    nom: 'Droit devant',
    lecon: 'Dans un milieu homogène, la lumière va tout droit. Un miroir la renvoie de l’autre côté de la normale, sous le même angle.',
    aide: 'Le faisceau part vers la droite. Posez le miroir sur son chemin, puis tournez-le : à 45° il renvoie vers le bas.',
    fixe: [src(12, 22, 0), cible(120, 78, ['r', 'v', 'b'])],
    tiroir: { miroir: 1 },
    exige: ['miroir'],
    solution: [{ type: 'miroir', x: 120, y: 22, angle: 45 }],
  },
  {
    id: 'contourner',
    nom: 'Contourner',
    lecon: 'Deux renvois valent un détour. Le mur ne se traverse pas : il absorbe.',
    aide: 'Descendez sous le mur, puis repartez vers la droite. Deux miroirs à 45° suffisent.',
    fixe: [src(12, 50, 0), mur(80, 48, 8, 64), cible(146, 88, ['r', 'v', 'b'])],
    tiroir: { miroir: 2 },
    exige: ['miroir'],
    solution: [
      { type: 'miroir', x: 60, y: 50, angle: 45 },
      { type: 'miroir', x: 60, y: 88, angle: 45 },
    ],
  },
  {
    id: 'l-angle-juste',
    nom: 'L’angle juste',
    lecon: 'i = r à tous les angles, pas seulement à 45°. Le miroir se règle, il ne se devine pas.',
    aide: 'Le faisceau doit remonter en biais. Tournez le miroir degré par degré avec les flèches du clavier.',
    fixe: [src(12, 70, 0), cible(126, 24, ['r', 'v', 'b'])],
    tiroir: { miroir: 1 },
    exige: ['miroir'],
    solution: [{ type: 'miroir', x: 128, y: 64, angle: 140 }],
  },
  {
    id: 'le-filtre',
    nom: 'Ce qui passe',
    lecon: 'Un filtre ne colore pas la lumière : il en retire. Ce qui sort était déjà dans ce qui entrait.',
    aide: 'La bille veut du rouge, et la source donne du blanc. Le blanc contient le rouge.',
    fixe: [src(12, 50, 0), cible(140, 50, ['r'])],
    tiroir: { filtre: { n: 1, bandes: ['r'] } },
    solution: [{ type: 'filtre', x: 70, y: 50, angle: 90, bandes: ['r'] }],
  },
  {
    id: 'la-lame',
    nom: 'La lame sans tain',
    lecon: 'Une lame semi-réfléchissante partage : la moitié passe, la moitié est renvoyée. Deux faisceaux, mais chacun deux fois moins intense.',
    aide: 'Un seul faisceau doit servir deux billes. Il faut le couper en deux.',
    fixe: [src(12, 50, 0), cible(146, 50, ['r', 'v', 'b']), cible(70, 90, ['r', 'v', 'b'])],
    tiroir: { separateur: 1 },
    solution: [{ type: 'separateur', x: 70, y: 50, angle: 45 }],
  },
  {
    id: 'le-jaune',
    nom: 'Refaire du jaune',
    lecon: 'Deux faisceaux qui tombent au même endroit s’ajoutent : rouge et vert font du jaune. C’est la synthèse additive, et c’est l’inverse du filtre.',
    aide: 'Deux sources, une bille. Amenez les deux couleurs au même point.',
    fixe: [src(12, 24, 0, ['r']), src(12, 76, 0, ['v']), cible(140, 50, ['r', 'v'])],
    tiroir: { miroir: 2 },
    exige: ['miroir'],
    solution: [
      { type: 'miroir', x: 144, y: 74, angle: 136 },
      { type: 'miroir', x: 80, y: 24, angle: 197 },
    ],
  },
  {
    id: 'la-colonne-d-eau',
    nom: 'La colonne d’eau',
    lecon: 'Une lame à faces parallèles ne dévie pas : elle décale. Le rayon ressort parallèle à lui-même, déplacé de côté.',
    aide: 'Le décalage dépend de l’angle d’entrée. Visez à côté de la bille et laissez l’eau corriger.',
    fixe: [src(12, 30, 0), eau(80, 50, 18, 96, 0), cible(146, 62, ['r', 'v', 'b'])],
    tiroir: { miroir: 1 },
    exige: ['refraction'],
    solution: [{ type: 'miroir', x: 110, y: 28, angle: 203 }],
  },
  {
    id: 'la-lentille',
    nom: 'La lentille mince',
    lecon: 'Une lentille dévie d’autant plus qu’on la traverse loin du centre : u′ = u − h/f. Par le centre, elle ne dévie pas du tout.',
    aide: 'Ce n’est pas l’angle de la lentille qui compte ici, c’est la hauteur à laquelle le faisceau la traverse.',
    fixe: [src(12, 40, 0), cible(140, 62, ['r', 'v', 'b'])],
    tiroir: { lentille: 1 },
    solution: [{ type: 'lentille', x: 16, y: 46, angle: 114 }],
  },
  {
    id: 'la-reflexion-totale',
    nom: 'Le miroir sans argent',
    lecon: 'Au-delà de l’angle limite, plus rien ne sort : le verre réfléchit tout. C’est ce qui fait tourner la lumière dans une fibre optique — sans une once de métal.',
    aide: 'Entrez dans le prisme presque perpendiculairement à une face : la lumière frappera la suivante trop obliquement pour en sortir.',
    fixe: [src(12, 40, 0), mur(96, 40, 8, 44), cible(60, 92, ['r', 'v', 'b'])],
    tiroir: { prisme: 1 },
    exige: ['totale'],
    solution: [{ type: 'prisme', x: 18, y: 42, angle: 88 }],
  },
  {
    id: 'le-bleu-piege',
    nom: 'Le bleu piégé',
    lecon: 'L’angle limite dépend de λ : 35,04° pour le rouge, 34,10° pour le bleu dans le flint dense. Entre les deux, le bleu est totalement réfléchi pendant que le rouge et le vert passent — le prisme trie les couleurs.',
    aide: 'Un cran de cadran sépare les deux réglages. Cherchez l’angle où le bleu part d’un côté et le reste de l’autre.',
    fixe: [
      src(10, 50, 0),
      cible(122, 68, ['r', 'v']),
      cible(86, 68, ['b']),
    ],
    tiroir: { prisme: 1 },
    verre: 'lourd',
    exige: ['totale'],
    solution: [{ type: 'prisme', x: 112, y: 58, angle: 19 }],
  },
  {
    id: 'deux-verres',
    nom: 'Le bon verre',
    lecon: 'Le crown, le flint et le flint dense n’ont ni le même indice ni le même angle limite. Le même montage ne trie pas les mêmes couleurs selon le verre qu’on y met.',
    aide: 'Si aucun angle ne marche, ce n’est peut-être pas l’angle qu’il faut changer. Regardez le panneau.',
    /* Les billes sont posées là où la physique met les rayons, et le montage
       a été choisi pour qu'il ne trie qu'avec UN seul des trois verres. Le
       test le vérifie : avec les deux autres, le niveau est insoluble. */
    fixe: [
      src(10, 40, 0),
      cible(120, 70, ['r', 'v']),
      cible(70, 76, ['b']),
    ],
    tiroir: { prisme: 1 },
    exige: ['totale'],
    verreUnique: true,
    solutionVerre: 'flint',
    solution: [{ type: 'prisme', x: 100, y: 48, angle: 248 }],
  },
  {
    id: 'le-detour-colore',
    nom: 'Le détour coloré',
    lecon: 'Tout à la fois : trier, renvoyer, viser. Un chemin par couleur, et chacun le sien.',
    aide: 'Commencez par le prisme, regardez où part chaque couleur, puis placez les miroirs une couleur à la fois.',
    fixe: [
      src(10, 50, 0), mur(100, 50, 8, 40),
      cible(150, 16, ['b']), cible(150, 86, ['r']),
    ],
    tiroir: { prisme: 1, miroir: 2 },
    solution: [
      { type: 'prisme', x: 72, y: 46, angle: 23 },
      { type: 'miroir', x: 110, y: 8, angle: 348 },
      { type: 'miroir', x: 130, y: 8, angle: 194 },
    ],
  },
];

export const parId = (id) => NIVEAUX.find((n) => n.id === id) || NIVEAUX[0];
