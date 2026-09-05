// Dix puissances, dix indicateurs, un seul jeu de chiffres bruts.
//
// Chaque puissance ne porte que des grandeurs mesurées : une superficie, une
// population, un PIB, des exportations, un effort de recherche en pourcentage
// du PIB, un budget militaire, des émissions, un IDH, une espérance de vie.
// Tout le reste — le PIB par habitant, la densité, la dépense de recherche en
// dollars, les parts du monde, les rangs, les rapports du premier au dernier —
// se calcule. C'est ce qui garantit qu'aucun tableau de cette simulation ne
// peut contredire un autre.
//
// Ordres de grandeur 2023. Sources usuelles : Banque mondiale et FMI pour le
// PIB et la population, OMC pour les marchandises, SIPRI pour le militaire,
// PNUD pour l'IDH.

export const PUISSANCES = [
  { id: 'usa', nom: 'États-Unis', court: 'USA', couleur: '#3d5a80',
    superficie: 9834000, pop: 335, pib: 27361, expo: 2020, rd: 3.46, mil: 916, co2: 4800, idh: 0.927, vie: 79.1 },
  { id: 'chine', nom: 'Chine', court: 'Chine', couleur: '#c1440e',
    superficie: 9597000, pop: 1411, pib: 17795, expo: 3380, rd: 2.43, mil: 296, co2: 11900, idh: 0.788, vie: 78.2 },
  { id: 'ue', nom: 'Union européenne', court: 'UE', couleur: '#2a9d8f',
    superficie: 4233000, pop: 449, pib: 18384, expo: 2700, rd: 2.24, mil: 279, co2: 2600, idh: 0.900, vie: 81.0 },
  { id: 'inde', nom: 'Inde', court: 'Inde', couleur: '#e09f3e',
    superficie: 3287000, pop: 1429, pib: 3550, expo: 432, rd: 0.65, mil: 84, co2: 2830, idh: 0.644, vie: 70.2 },
  { id: 'japon', nom: 'Japon', court: 'Japon', couleur: '#7b5ea7',
    superficie: 378000, pop: 124, pib: 4213, expo: 717, rd: 3.30, mil: 50, co2: 1010, idh: 0.920, vie: 84.0 },
  { id: 'russie', nom: 'Russie', court: 'Russie', couleur: '#5c6b73',
    superficie: 17098000, pop: 144, pib: 2021, expo: 425, rd: 0.94, mil: 109, co2: 1800, idh: 0.821, vie: 72.8 },
  { id: 'bresil', nom: 'Brésil', court: 'Brésil', couleur: '#4a9d3f',
    superficie: 8516000, pop: 216, pib: 2174, expo: 340, rd: 1.15, mil: 22.9, co2: 480, idh: 0.760, vie: 75.9 },
  { id: 'turquie', nom: 'Turquie', court: 'Turquie', couleur: '#8d6a4f',
    superficie: 784000, pop: 85, pib: 1108, expo: 255, rd: 1.40, mil: 15.8, co2: 420, idh: 0.855, vie: 77.9 },
  { id: 'afsud', nom: 'Afrique du Sud', court: 'Afr. du Sud', couleur: '#b5838d',
    superficie: 1221000, pop: 60, pib: 378, expo: 108, rd: 0.60, mil: 3.2, co2: 440, idh: 0.717, vie: 65.3 },
  { id: 'maroc', nom: 'Maroc', court: 'Maroc', couleur: '#c1121f',
    superficie: 710850, pop: 37, pib: 141, expo: 41, rd: 0.75, mil: 5.4, co2: 70, idh: 0.698, vie: 74.8 },
];

/* Les totaux mondiaux, pour que « part du monde » veuille dire quelque chose.
   Une réserve à connaître, et elle est dans la note : le total mondial des
   exportations compte le commerce entre pays de l'Union, alors que la ligne
   « Union européenne » ne compte que ses exportations vers l'extérieur. La part
   affichée pour l'UE sous-estime donc son poids réel dans le commerce. */
export const MONDE = {
  superficie: 134000000,      // terres émergées hors Antarctique, km²
  pop: 8045,                  // millions d'habitants
  pib: 105000,                // milliards de dollars
  expo: 23800,                // exportations mondiales de marchandises, milliards
  rd: 2500,                   // dépense mondiale de recherche, ordre de grandeur
  mil: 2443,                  // dépenses militaires mondiales
  co2: 37400,                 // mégatonnes de CO₂
  idh: 0.739,                 // moyenne mondiale
  vie: 73.2,                  // années
};

/* Un indicateur sait trois choses : comment se lire sur une puissance, comment
   se ramener à un habitant quand cela a un sens, et à quel total mondial se
   comparer. Le reste du programme n'a plus qu'à les parcourir. */
export const INDICATEURS = [
  { id: 'pib', nom: 'PIB', unite: 'Md $', dec: 0, lire: (p) => p.pib, monde: MONDE.pib,
    parHab: { unite: '$/hab.', dec: 0, lire: (p) => (p.pib * 1000) / p.pop } },
  { id: 'pop', nom: 'Population', unite: 'M hab.', dec: 0, lire: (p) => p.pop, monde: MONDE.pop },
  { id: 'superficie', nom: 'Superficie', unite: 'km²', dec: 0, lire: (p) => p.superficie, monde: MONDE.superficie },
  { id: 'densite', nom: 'Densité', unite: 'hab./km²', dec: 1,
    lire: (p) => (p.pop * 1e6) / p.superficie, moyenne: (MONDE.pop * 1e6) / MONDE.superficie },
  { id: 'expo', nom: 'Exportations de marchandises', unite: 'Md $', dec: 0, lire: (p) => p.expo, monde: MONDE.expo,
    parHab: { unite: '$/hab.', dec: 0, lire: (p) => (p.expo * 1000) / p.pop } },
  { id: 'rd', nom: 'Recherche et développement', unite: 'Md $', dec: 1,
    lire: (p) => (p.pib * p.rd) / 100, monde: MONDE.rd,
    parHab: { unite: '$/hab.', dec: 0, lire: (p) => (p.pib * p.rd * 10) / p.pop } },
  { id: 'rdpart', nom: 'Effort de recherche', unite: '% du PIB', dec: 2, lire: (p) => p.rd,
    moyenne: (MONDE.rd / MONDE.pib) * 100 },
  { id: 'mil', nom: 'Dépenses militaires', unite: 'Md $', dec: 1, lire: (p) => p.mil, monde: MONDE.mil,
    parHab: { unite: '$/hab.', dec: 0, lire: (p) => (p.mil * 1000) / p.pop } },
  { id: 'co2', nom: 'Émissions de CO₂', unite: 'Mt', dec: 0, lire: (p) => p.co2, monde: MONDE.co2,
    parHab: { unite: 't/hab.', dec: 2, lire: (p) => p.co2 / p.pop } },
  { id: 'idh', nom: 'Indice de développement humain', unite: '', dec: 3, lire: (p) => p.idh, moyenne: MONDE.idh },
  { id: 'vie', nom: 'Espérance de vie', unite: 'ans', dec: 1, lire: (p) => p.vie, moyenne: MONDE.vie },
];

// Les six axes du radar : les six façons d'être puissant, chacune en part du
// monde, donc toutes comparables entre elles.
export const AXES = ['pop', 'superficie', 'pib', 'expo', 'rd', 'mil'];

export const part = (p, ind) => (ind.monde ? ind.lire(p) / ind.monde : null);

/* Classement d'une puissance sur un indicateur, et le rapport du premier au
   dernier — les deux chiffres qu'on cherche toujours dans un tableau. */
export function classement(ind, parHab = false) {
  const lire = parHab && ind.parHab ? ind.parHab.lire : ind.lire;
  const l = PUISSANCES.map((p) => ({ p, v: lire(p) })).sort((a, b) => b.v - a.v);
  l.forEach((e, i) => { e.rang = i + 1; });
  return l;
}

/* ── la part du PIB mondial, 1980 → 2024 ────────────────────────────────────
   Six relevés, et le reste du monde par différence : la somme des bandes fait
   donc cent pour cent par construction, ce qu'aucune saisie à la main ne
   garantirait. */
export const ANNEES = [1980, 1990, 2000, 2010, 2020, 2024];
const RELEVES = [
  { id: 'usa', vals: [25.2, 26.4, 30.3, 22.7, 24.7, 26.5] },
  { id: 'ue', vals: [26.5, 26.7, 21.0, 21.4, 17.9, 17.3] },
  { id: 'japon', vals: [9.8, 13.4, 14.4, 8.6, 5.9, 3.7] },
  { id: 'chine', vals: [1.7, 1.7, 3.6, 9.2, 17.3, 16.9] },
  { id: 'inde', vals: [1.6, 1.4, 1.4, 2.6, 3.1, 3.6] },
];
export const BANDES = RELEVES.map((r) => {
  const p = PUISSANCES.find((q) => q.id === r.id);
  return { id: r.id, nom: p.nom, couleur: p.couleur, vals: r.vals };
}).concat([{
  id: 'reste', nom: 'reste du monde', couleur: '#8a8f98',
  vals: ANNEES.map((_, i) => +(100 - RELEVES.reduce((s, r) => s + r.vals[i], 0)).toFixed(1)),
}]);

// Entre deux relevés on interpole : la courbe se lit alors à l'année près, et
// les six points relevés restent marqués pour qu'on ne confonde pas les deux.
export function partAnnee(bande, an) {
  const a = Math.max(ANNEES[0], Math.min(ANNEES[ANNEES.length - 1], an));
  for (let i = 0; i < ANNEES.length - 1; i++) {
    if (a <= ANNEES[i + 1]) {
      const f = (a - ANNEES[i]) / (ANNEES[i + 1] - ANNEES[i]);
      return bande.vals[i] + (bande.vals[i + 1] - bande.vals[i]) * f;
    }
  }
  return bande.vals[bande.vals.length - 1];
}
