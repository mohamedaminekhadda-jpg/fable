// Les montages du bac à sable.
//
// Un bac à sable vide est une page blanche, et une page blanche ne s'utilise
// pas. Ces montages sont les expériences du cours, prêtes à poser : on les
// charge, on les regarde marcher, puis on tire les pièces pour voir ce qui
// change. C'est l'ordre dans lequel on apprend.
//
// Chacun est vérifié par `npm run test:optique` — non pas « il ne plante pas »,
// mais « il montre ce qu'il annonce » : la chambre noire renverse, la lentille
// place son image où la relation de conjugaison la met.

export const PLATEAU_SABLE = { x: 0, y: 0, w: 224, h: 136 };

/* Les tailles par défaut d'une pièce qu'on vient de poser. Elles sont plus
   grandes que celles du jeu, parce que le plateau l'est. */
export const TAILLES_SABLE = {
  laser: { angle: 0, bandes: [633] },
  ampoule: { angle: 0, rayons: 84, bandes: ['r', 'v', 'b'] },
  objet: { angle: 0, h: 26, points: 3, rayons: 15, cone: 74, bandes: ['r', 'v', 'b'] },
  miroir: { angle: 90, longueur: 30 },
  miroirc: { angle: 180, R: 90, ouverture: 46 },   // concave : R > 0
  prisme: { angle: 0, cote: 22, milieu: 'crown' },
  lentille: { angle: 90, longueur: 44, f: 34, milieu: 'crown' },
  ecran: { angle: 90, longueur: 70 },
  diaphragme: { angle: 90, longueur: 110, trou: 2 },
  oeil: { r: 5 },
  filtre: { angle: 90, longueur: 24, bandes: ['r'] },
  separateur: { angle: 45, longueur: 26 },
  bloc: { angle: 0, w: 26, h: 100, milieu: 'eau' },
  mur: { angle: 0, w: 10, h: 44 },
};

export const NOMS_SABLE = {
  laser: 'laser', ampoule: 'ampoule', objet: 'objet', miroir: 'miroir',
  miroirc: 'miroir courbe',
  prisme: 'prisme', lentille: 'lentille', ecran: 'écran', diaphragme: 'trou',
  oeil: 'œil', filtre: 'filtre', separateur: 'lame', bloc: 'eau', mur: 'mur',
};

/* L'ordre du tiroir : d'abord ce qui émet, puis ce qui dévie, puis ce qui
   reçoit. C'est l'ordre dans lequel la lumière les rencontre. */
export const TIROIR_SABLE = [
  'laser', 'ampoule', 'objet',
  'miroir', 'miroirc', 'prisme', 'lentille', 'diaphragme', 'filtre', 'separateur', 'bloc', 'mur',
  'ecran', 'oeil',
];

const p = (type, extra) => ({ type, ...TAILLES_SABLE[type], ...extra });

export const MONTAGES = [
  {
    id: 'vide',
    nom: 'Plateau vide',
    quoi: 'À vous. Ajoutez une source, puis quelque chose sur son chemin.',
    pieces: [],
  },
  {
    id: 'chambre-noire',
    nom: 'La chambre noire',
    quoi: 'Un objet, un trou, un écran. L’image est renversée, et elle l’est parce que la lumière va tout droit : le haut de l’objet ne peut atteindre que le bas de l’écran.',
    // le trou est étroit : c'est pour cela que l'image est nette et sombre
    pieces: [
      p('objet', { x: 26, y: 68, h: 34 }),
      p('diaphragme', { x: 104, y: 68, longueur: 130, trou: 1.6 }),
      p('ecran', { x: 190, y: 68, longueur: 96 }),
    ],
    mesure: 'stenope',
  },
  {
    id: 'lentille-image',
    nom: 'L’image d’une lentille',
    quoi: 'Objet, lentille, écran. Tirez l’objet : l’image se déplace, change de taille, et la relation 1/OA′ − 1/OA = 1/f reste vraie — elle est mesurée sur les rayons, pas appliquée.',
    /* L’objet est monochromatique, et c’est un choix : en lumière blanche chaque
       radiation a son foyer, l’image se forme à trois endroits, et OA′ mesure
       alors leur moyenne. C’est vrai — c’est l’aberration chromatique — mais
       cela brouille la leçon de la conjugaison, qui se lit à 0,001 près quand
       la source est d’une seule couleur. Mettez du blanc pour la voir. */
    pieces: [
      p('objet', { x: 34, y: 68, h: 28, cone: 30, bandes: [546] }),
      p('lentille', { x: 108, y: 68, f: 30, longueur: 52 }),
      p('ecran', { x: 158, y: 68, longueur: 90 }),   // OA′ = 50,5 : l’écran y est

    ],
    mesure: 'lentille',
  },
  {
    id: 'fibre-optique',
    nom: 'La fibre optique',
    quoi: 'Cinq réflexions totales à 71,3°, pour un angle limite de 35,0° : le rayon ne peut pas sortir par les parois, et il ne ressort que par le bout. Aucun métal, aucun miroir.',
    /* Le rayon entre par le BOUT du barreau, et pas par le côté : c’est la seule
       façon d’obtenir la réflexion totale. Par le dessus, il arriverait sur les
       parois à 33° — sous l’angle limite du flint dense, 35° — et il ressortirait
       au premier rebond. Par le bout, il les frappe à 71°, et il ne sort plus.
       C’est aussi pourquoi on ne branche pas une fibre en la perçant. */
    pieces: [
      p('laser', { x: 18, y: 64, angle: 34, bandes: [633] }),
      p('bloc', { x: 118, y: 68, w: 190, h: 14, angle: 0, milieu: 'lourd' }),
    ],
  },
  {
    id: 'ombres',
    nom: 'L’ampoule et les ombres',
    quoi: 'Une ampoule rayonne dans toutes les directions. Derrière chaque obstacle, un cône d’ombre — et sa forme ne se dessine pas, elle se déduit du fait que la lumière va tout droit.',
    pieces: [
      p('ampoule', { x: 40, y: 68, rayons: 140 }),
      p('mur', { x: 104, y: 46, w: 8, h: 34 }),
      p('mur', { x: 128, y: 100, w: 34, h: 8 }),
      p('ecran', { x: 208, y: 68, longueur: 124 }),
    ],
  },
  {
    id: 'spectre',
    nom: 'Le prisme et l’écran',
    quoi: 'Le prisme sépare, mais très peu : l’éventail fait un degré ou deux. Sur un bras aussi court, le spectre reste un liseré — voilà pourquoi un spectroscope a un long bras.',
    pieces: [
      p('laser', { x: 14, y: 60, angle: 0, bandes: ['r', 'v', 'b'] }),
      p('prisme', { x: 74, y: 62, angle: 18, cote: 24, milieu: 'lourd' }),
      p('ecran', { x: 206, y: 80, longueur: 120 }),
    ],
  },
  {
    id: 'miroir-concave',
    nom: 'Le miroir concave',
    quoi: 'Cinq rayons parallèles à l’axe reviennent se croiser à R/2 du sommet — le foyer. Élargissez l’ouverture : ils ne se croisent plus au même endroit. C’est l’aberration de sphéricité, et c’est pourquoi un télescope digne du nom est parabolique.',
    /* Rien ici ne pose f = R/2 : on réfléchit sur un arc de cercle, i = r, et
       R/2 est ce qu’on retrouve à la limite paraxiale. Le défaut de la sphère
       vient donc avec, au lieu d’être absent d’un modèle trop propre. */
    pieces: [
      p('laser', { x: 16, y: 44, angle: 0, bandes: [520] }),
      p('laser', { x: 16, y: 56, angle: 0, bandes: [520] }),
      p('laser', { x: 16, y: 68, angle: 0, bandes: [520] }),
      p('laser', { x: 16, y: 80, angle: 0, bandes: [520] }),
      p('laser', { x: 16, y: 92, angle: 0, bandes: [520] }),
      p('miroirc', { x: 200, y: 68, angle: 180, R: 90, ouverture: 60 }),
    ],
  },
  {
    id: 'la-loupe',
    nom: 'La loupe',
    quoi: 'L’objet est plus près de la lentille que son foyer : les rayons ressortent divergents, et l’image se forme EN ARRIÈRE. OA′ devient négatif, γ dépasse 1 — droite et agrandie. C’est une loupe, et rien n’a été ajouté pour cela.',
    pieces: [
      p('objet', { x: 96, y: 68, h: 20, cone: 26, bandes: [546] }),
      p('lentille', { x: 130, y: 68, f: 44, longueur: 56 }),
    ],
    mesure: 'lentille',
  },
  {
    id: 'oeil-miroir',
    nom: 'L’œil et le miroir',
    quoi: 'Ce que l’œil reçoit s’affiche dans sa couleur. Tournez le miroir : il n’y a qu’un angle pour lequel l’œil voit la source, et c’est celui où i = r.',
    pieces: [
      p('laser', { x: 16, y: 34, angle: 20, bandes: [520] }),
      p('miroir', { x: 120, y: 74, angle: 55, longueur: 34 }),
      p('oeil', { x: 40, y: 112, r: 6 }),
    ],
  },
];

export const montageParId = (id) => MONTAGES.find((m) => m.id === id) || MONTAGES[0];
