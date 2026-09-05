// Les espèces, les réactions, et de quoi compter les atomes.
//
// Neuf réactions que tout élève finit par rencontrer : brûler du méthane, faire
// de l'eau, la défaire, respirer, photosynthétiser, rouiller, attaquer du
// calcaire, fabriquer de l'ammoniac. Aucune n'est inventée pour l'exercice.
//
// Les masses molaires sont celles du tableau périodique (IUPAC, valeurs
// usuelles). Elles servent à montrer ce que l'équilibrage veut dire vraiment :
// tant que l'équation n'est pas équilibrée, les deux côtés n'ont pas la même
// masse — et une réaction qui perdrait de la matière n'existe pas.

export const MASSES = {
  H: 1.008, C: 12.011, N: 14.007, O: 15.999, Na: 22.990,
  S: 32.06, Cl: 35.45, Ca: 40.078, Fe: 55.845,
};

/* La couleur d'un atome, pour qu'on suive le même oxygène d'un bout à l'autre
   de l'équation. C'est le code des chimistes (CPK), ramené au papier de la
   maison : le carbone est de l'encre, l'hydrogène du papier. */
export const COULEUR = {
  H: '#cfd6dd', C: '#3b4653', N: '#3d6fa0', O: '#c1440e',
  Na: '#7b5ea7', S: '#c9a227', Cl: '#4d8a52', Ca: '#a8622a', Fe: '#8a6a4a',
};

/* Une espèce : sa formule, ses atomes, et la façon de la dessiner.
   `mode` vaut 'seul', 'paire', 'lineaire', 'etoile' ou 'bloc'. Une molécule de
   six carbones ne se dessine pas atome par atome sur une carte de cinquante
   pixels : au-delà, le pavé portant la formule est plus lisible et tout aussi
   honnête. */
export const ESPECES = {
  CH4: { f: 'CH₄', a: { C: 1, H: 4 }, mode: 'etoile', centre: 'C', autour: 'H' },
  O2: { f: 'O₂', a: { O: 2 }, mode: 'paire', paire: ['O', 'O'] },
  CO2: { f: 'CO₂', a: { C: 1, O: 2 }, mode: 'lineaire', centre: 'C', autour: 'O' },
  H2O: { f: 'H₂O', a: { H: 2, O: 1 }, mode: 'etoile', centre: 'O', autour: 'H' },
  H2: { f: 'H₂', a: { H: 2 }, mode: 'paire', paire: ['H', 'H'] },
  N2: { f: 'N₂', a: { N: 2 }, mode: 'paire', paire: ['N', 'N'] },
  NH3: { f: 'NH₃', a: { N: 1, H: 3 }, mode: 'etoile', centre: 'N', autour: 'H' },
  Fe: { f: 'Fe', a: { Fe: 1 }, mode: 'seul' },
  HCl: { f: 'HCl', a: { H: 1, Cl: 1 }, mode: 'paire', paire: ['H', 'Cl'] },
  C4H10: { f: 'C₄H₁₀', a: { C: 4, H: 10 }, mode: 'bloc' },
  C6H12O6: { f: 'C₆H₁₂O₆', a: { C: 6, H: 12, O: 6 }, mode: 'bloc' },
  Fe2O3: { f: 'Fe₂O₃', a: { Fe: 2, O: 3 }, mode: 'bloc' },
  CaCO3: { f: 'CaCO₃', a: { Ca: 1, C: 1, O: 3 }, mode: 'bloc' },
  CaCl2: { f: 'CaCl₂', a: { Ca: 1, Cl: 2 }, mode: 'bloc' },
};

export const REACTIONS = [
  { value: 'methane', label: 'La combustion du méthane',
    quoi: 'Le gaz de ville qui brûle. La réaction qui chauffe la moitié des maisons.',
    g: ['CH4', 'O2'], d: ['CO2', 'H2O'], sol: [1, 2, 1, 2] },
  { value: 'eau', label: 'La synthèse de l’eau',
    quoi: 'Le dihydrogène brûle dans le dioxygène. Rien d’autre n’en sort que de l’eau.',
    g: ['H2', 'O2'], d: ['H2O'], sol: [2, 1, 2] },
  { value: 'electrolyse', label: 'L’électrolyse de l’eau',
    quoi: 'La précédente à l’envers, avec du courant. Deux fois plus d’hydrogène que d’oxygène : c’est ce qu’on lit sur les tubes.',
    g: ['H2O'], d: ['H2', 'O2'], sol: [2, 2, 1] },
  { value: 'butane', label: 'La combustion du butane',
    quoi: 'Le gaz du camping. Celle-là résiste : essayez d’abord au jugé.',
    g: ['C4H10', 'O2'], d: ['CO2', 'H2O'], sol: [2, 13, 8, 10] },
  { value: 'photosynthese', label: 'La photosynthèse',
    quoi: 'Une plante fabrique du sucre avec de l’air, de l’eau et de la lumière.',
    g: ['CO2', 'H2O'], d: ['C6H12O6', 'O2'], sol: [6, 6, 1, 6] },
  { value: 'respiration', label: 'La respiration cellulaire',
    quoi: 'La photosynthèse à l’envers, dans chacune de vos cellules en ce moment.',
    g: ['C6H12O6', 'O2'], d: ['CO2', 'H2O'], sol: [1, 6, 6, 6] },
  { value: 'rouille', label: 'La rouille du fer',
    quoi: 'Le fer et l’air. Lente, mais elle finit par avoir tous les portails.',
    g: ['Fe', 'O2'], d: ['Fe2O3'], sol: [4, 3, 2] },
  { value: 'calcaire', label: 'Le calcaire attaqué par l’acide',
    quoi: 'Le détartrant sur le calcaire : l’effervescence, c’est le CO₂ qui part.',
    g: ['CaCO3', 'HCl'], d: ['CaCl2', 'H2O', 'CO2'], sol: [1, 2, 1, 1, 1] },
  { value: 'ammoniac', label: 'La synthèse de l’ammoniac',
    quoi: 'Le procédé Haber-Bosch : l’azote de l’air devient l’engrais qui nourrit la moitié de l’humanité.',
    g: ['N2', 'H2'], d: ['NH3'], sol: [1, 3, 2] },
];

export const especes = (r) => [...r.g, ...r.d].map((k) => ESPECES[k]);

// Tous les éléments d'une réaction, dans l'ordre où on les rencontre.
export function elements(r) {
  const out = [];
  especes(r).forEach((e) => Object.keys(e.a).forEach((z) => { if (!out.includes(z)) out.push(z); }));
  return out;
}

/* Le compte des atomes de chaque côté, pour les coefficients donnés. C'est la
   seule chose que la simulation « sait » : elle ne connaît pas la solution, elle
   compte — comme l'élève. */
export function bilan(r, coefs) {
  const n = r.g.length;
  const cote = (cles, dec) => {
    const c = {};
    cles.forEach((k, i) => {
      const e = ESPECES[k], q = coefs[dec + i] || 0;
      Object.entries(e.a).forEach(([z, m]) => { c[z] = (c[z] || 0) + q * m; });
    });
    return c;
  };
  const G = cote(r.g, 0), D = cote(r.d, n);
  const out = {};
  elements(r).forEach((z) => { out[z] = { g: G[z] || 0, d: D[z] || 0 }; });
  return out;
}

export const equilibree = (r, coefs) => coefs.every((c) => c > 0)
  && Object.values(bilan(r, coefs)).every((b) => b.g === b.d);

const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
export const simplifiee = (coefs) => coefs.reduce((a, b) => pgcd(a, b)) === 1;

// La masse molaire d'une espèce, et celle de chaque côté de la flèche.
export const masseMolaire = (e) =>
  Object.entries(e.a).reduce((s, [z, n]) => s + n * MASSES[z], 0);

export function masses(r, coefs) {
  const n = r.g.length;
  const som = (cles, dec) => cles.reduce((s, k, i) =>
    s + (coefs[dec + i] || 0) * masseMolaire(ESPECES[k]), 0);
  return { g: som(r.g, 0), d: som(r.d, n) };
}
