// Les noyaux, et rien d'autre.
//
// Masses ATOMIQUES en u, mesurées (table AME). On en déduit la masse du noyau
// en retranchant les Z électrons — l'énergie de liaison des électrons, quelques
// eV, est négligée, comme le fait le cours.
//
// Ce fichier ne contient aucune énergie de liaison : elles sont toutes
// calculées. Un tableau qui porterait à la fois les masses ET les énergies
// pourrait se contredire lui-même.

export const U_MEV = 931.49410242;        // 1 u en MeV/c²
export const U_KG = 1.66053906660e-27;    // 1 u en kg
export const MEV_J = 1.602176634e-13;     // 1 MeV en joules
export const C = 2.99792458e8;            // m/s
export const NA = 6.02214076e23;          // mol⁻¹
export const M_P = 1.007276466;           // proton, u
export const M_N = 1.008664916;           // neutron, u
export const M_E = 0.000548579909;        // électron, u

export const NOMS = {
  H: 'hydrogène', He: 'hélium', Li: 'lithium', Be: 'béryllium', B: 'bore',
  C: 'carbone', N: 'azote', O: 'oxygène', F: 'fluor', Ne: 'néon', Na: 'sodium',
  Mg: 'magnésium', Al: 'aluminium', Si: 'silicium', P: 'phosphore', S: 'soufre',
  Cl: 'chlore', Ar: 'argon', K: 'potassium', Ca: 'calcium', Sc: 'scandium',
  Ti: 'titane', V: 'vanadium', Cr: 'chrome', Mn: 'manganèse', Fe: 'fer',
  Co: 'cobalt', Ni: 'nickel', Cu: 'cuivre', Zn: 'zinc', Ge: 'germanium',
  As: 'arsenic', Se: 'sélénium', Kr: 'krypton', Sr: 'strontium', Zr: 'zirconium',
  Nb: 'niobium', Mo: 'molybdène', Ag: 'argent', Cd: 'cadmium', Sn: 'étain',
  I: 'iode', Xe: 'xénon', Ba: 'baryum', Ce: 'cérium', Nd: 'néodyme',
  Gd: 'gadolinium', Ho: 'holmium', Yb: 'ytterbium', Hf: 'hafnium',
  W: 'tungstène', Au: 'or', Pb: 'plomb', Bi: 'bismuth', Rn: 'radon',
  Ra: 'radium', Th: 'thorium', U: 'uranium', Pu: 'plutonium', La: 'lanthane',
  Br: 'brome', Kr2: 'krypton',
};

// [A, Z, symbole, masse atomique en u]
const TABLE = [
  [1, 1, 'H', 1.00782503], [2, 1, 'H', 2.01410178], [3, 1, 'H', 3.01604928],
  [3, 2, 'He', 3.01602932], [4, 2, 'He', 4.00260325],
  [6, 3, 'Li', 6.01512289], [7, 3, 'Li', 7.01600344], [9, 4, 'Be', 9.01218307],
  [10, 5, 'B', 10.01293695], [11, 5, 'B', 11.00930536],
  [12, 6, 'C', 12.0], [13, 6, 'C', 13.00335484], [14, 7, 'N', 14.00307401],
  [16, 8, 'O', 15.99491462], [19, 9, 'F', 18.99840322], [20, 10, 'Ne', 19.99244018],
  [23, 11, 'Na', 22.98976928], [24, 12, 'Mg', 23.98504170], [27, 13, 'Al', 26.98153853],
  [28, 14, 'Si', 27.97692653], [31, 15, 'P', 30.97376200], [32, 16, 'S', 31.97207100],
  [35, 17, 'Cl', 34.96885268], [40, 18, 'Ar', 39.96238312], [39, 19, 'K', 38.96370668],
  [40, 20, 'Ca', 39.96259098], [45, 21, 'Sc', 44.95591190], [48, 22, 'Ti', 47.94794630],
  [51, 23, 'V', 50.94395950], [52, 24, 'Cr', 51.94050750], [55, 25, 'Mn', 54.93804510],
  [56, 26, 'Fe', 55.93493750], [59, 27, 'Co', 58.93319500], [58, 28, 'Ni', 57.93534290],
  [62, 28, 'Ni', 61.92834510], [63, 29, 'Cu', 62.92959750], [64, 30, 'Zn', 63.92914220],
  [70, 32, 'Ge', 69.92424740], [75, 33, 'As', 74.92159650], [80, 34, 'Se', 79.91652130],
  [84, 36, 'Kr', 83.91150700], [88, 38, 'Sr', 87.90561210], [94, 38, 'Sr', 93.91536100],
  [90, 40, 'Zr', 89.90470440], [93, 41, 'Nb', 92.90637810], [94, 42, 'Mo', 93.90508830],
  [95, 35, 'Br', 94.94010000], [107, 47, 'Ag', 106.90509700], [112, 48, 'Cd', 111.90275780],
  [118, 50, 'Sn', 117.90160300], [127, 53, 'I', 126.90447300], [132, 54, 'Xe', 131.90415350],
  [139, 54, 'Xe', 138.91878700], [137, 56, 'Ba', 136.90582740], [139, 57, 'La', 138.90636300],
  [140, 58, 'Ce', 139.90543870], [150, 60, 'Nd', 149.92089100], [157, 64, 'Gd', 156.92396010],
  [165, 67, 'Ho', 164.93032210], [174, 70, 'Yb', 173.93886210], [180, 72, 'Hf', 179.94655000],
  [184, 74, 'W', 183.95093120], [197, 79, 'Au', 196.96656870], [206, 82, 'Pb', 205.97446530],
  [208, 82, 'Pb', 207.97665210], [209, 83, 'Bi', 208.98039870], [222, 86, 'Rn', 222.01757770],
  [226, 88, 'Ra', 226.02540980], [232, 90, 'Th', 232.03805530], [235, 92, 'U', 235.04392990],
  [238, 92, 'U', 238.05078820], [239, 94, 'Pu', 239.05216340],
];

// Tout se déduit des masses. Δm = Z·m_p + N·m_n − m_noyau, puis E = Δm·c².
export const NOYAUX = TABLE.map(([A, Z, s, atomique]) => {
  const noyau = atomique - Z * M_E;
  const nucleons = Z * M_P + (A - Z) * M_N;
  const dm = nucleons - noyau;
  const El = dm * U_MEV;
  return {
    A, Z, N: A - Z, s, atomique, noyau, nucleons, dm, El,
    EA: A > 1 ? El / A : 0,
    cle: s + '-' + A,
    nom: (NOMS[s] || s) + ' ' + A,
  };
});

export const trouve = (s, A) => NOYAUX.find((n) => n.s === s && n.A === A);
// Le plus lié de la table : c'est lui le fond de la vallée, pas une valeur qu'on
// écrit à la main.
export const LE_PLUS_LIE = NOYAUX.reduce((a, b) => (b.EA > a.EA ? b : a));
