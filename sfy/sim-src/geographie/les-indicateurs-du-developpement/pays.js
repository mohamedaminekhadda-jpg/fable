// Cinquante pays, et ce qu'on sait d'eux.
//
// Valeurs arrondies, d'après la Banque mondiale et le PNUD : population et
// indicateurs pour 2022, IDH du rapport 2021-2022, PIB par habitant en parité
// de pouvoir d'achat (dollars internationaux). Les valeurs de 1990 servent à
// mesurer le chemin parcouru — elles sont volontairement arrondies, l'ordre de
// grandeur étant ce qui compte à cette échelle.
//
// Elles sont ARRONDIES, et c'est dit : un chiffre au dixième près donnerait une
// fausse impression de précision sur des grandeurs qui varient d'une source à
// l'autre. Ce qui se lit ici, ce sont des écarts, pas des décimales.
//
// `case` place le pays sur le planisphère en carreaux. Une case par pays, toutes
// de la même taille : c'est faux géographiquement — le Niger y paraît aussi
// grand que la France — et c'est justement ce qu'on veut montrer, puisque le
// développement ne se mesure pas en kilomètres carrés.

export const INDICATEURS = [
  { id: 'pib', nom: 'PIB par habitant', unite: '$ PPA', dec: 0, log: true,
    sens: 1, court: 'PIB/hab' },
  { id: 'idh', nom: 'Indice de développement humain', unite: '', dec: 3, sens: 1, court: 'IDH' },
  { id: 'esp', nom: 'Espérance de vie', unite: 'ans', dec: 1, sens: 1, court: 'espérance de vie' },
  { id: 'fec', nom: 'Indice de fécondité', unite: 'enfants par femme', dec: 1, sens: -1, court: 'fécondité' },
  { id: 'mort', nom: 'Mortalité infantile', unite: '‰', dec: 1, sens: -1, court: 'mortalité infantile' },
  { id: 'alpha', nom: 'Taux d’alphabétisation', unite: '%', dec: 0, sens: 1, court: 'alphabétisation' },
  { id: 'urb', nom: 'Taux d’urbanisation', unite: '%', dec: 0, sens: 1, court: 'urbanisation' },
  { id: 'pop', nom: 'Population', unite: 'millions', dec: 1, log: true, sens: 0, court: 'population' },
];

// nom, continent, groupe, [case x, y], pop, pib, idh, esp, fec, mort, alpha, urb
// puis 1990 : [pib, idh, esp, fec]
const T = [
  ['France', 'Europe', 'nord', [10, 4], 68, 55000, 0.910, 82.5, 1.8, 3.4, 99, 82, [24000, 0.789, 76.6, 1.8]],
  ['Allemagne', 'Europe', 'nord', [11, 3], 84, 63000, 0.950, 80.7, 1.5, 3.1, 99, 78, [25000, 0.814, 75.3, 1.5]],
  ['Royaume-Uni', 'Europe', 'nord', [10, 2], 67, 54000, 0.940, 80.7, 1.6, 3.6, 99, 84, [24000, 0.804, 75.9, 1.8]],
  ['Espagne', 'Europe', 'nord', [10, 5], 48, 46000, 0.911, 83.2, 1.2, 2.6, 98, 81, [20000, 0.759, 76.8, 1.4]],
  ['Italie', 'Europe', 'nord', [11, 5], 59, 51000, 0.906, 83.1, 1.2, 2.4, 99, 72, [23000, 0.778, 77.0, 1.3]],
  ['Portugal', 'Europe', 'nord', [9, 5], 10.4, 41000, 0.874, 81.0, 1.4, 2.6, 96, 67, [15000, 0.721, 74.0, 1.6]],
  ['Grèce', 'Europe', 'nord', [12, 5], 10.4, 36000, 0.893, 80.1, 1.4, 3.3, 98, 80, [17000, 0.759, 77.1, 1.4]],
  ['Pologne', 'Europe', 'nord', [12, 3], 37, 43000, 0.881, 76.5, 1.3, 3.7, 99, 60, [10000, 0.717, 70.9, 2.0]],
  ['Suède', 'Europe', 'nord', [11, 1], 10.5, 63000, 0.952, 83.0, 1.7, 2.0, 99, 88, [24000, 0.819, 77.6, 2.1]],
  ['Ukraine', 'Europe', 'sud', [13, 3], 38, 13000, 0.734, 68.6, 1.2, 6.5, 100, 70, [9000, 0.732, 70.1, 1.9]],
  ['Russie', 'Europe', 'sud', [15, 2], 144, 33000, 0.821, 69.4, 1.5, 4.4, 100, 75, [20000, 0.735, 68.9, 1.9]],

  ['États-Unis', 'Amérique', 'nord', [3, 3], 335, 76000, 0.927, 76.4, 1.7, 5.4, 99, 83, [36000, 0.872, 75.3, 2.1]],
  ['Canada', 'Amérique', 'nord', [3, 1], 39, 55000, 0.935, 82.6, 1.4, 4.4, 99, 82, [26000, 0.861, 77.4, 1.7]],
  ['Mexique', 'Amérique', 'sud', [3, 5], 128, 21000, 0.781, 75.1, 1.8, 12.3, 95, 81, [14000, 0.652, 70.8, 3.4]],
  ['Brésil', 'Amérique', 'sud', [5, 7], 215, 17000, 0.760, 72.8, 1.6, 12.9, 94, 87, [10000, 0.613, 65.3, 2.8]],
  ['Argentine', 'Amérique', 'sud', [5, 9], 46, 26000, 0.849, 75.4, 1.9, 8.5, 99, 92, [13000, 0.707, 71.6, 3.0]],
  ['Chili', 'Amérique', 'sud', [4, 9], 19.6, 29000, 0.860, 78.9, 1.5, 6.0, 97, 88, [9000, 0.704, 73.4, 2.6]],
  ['Colombie', 'Amérique', 'sud', [4, 6], 52, 19000, 0.758, 72.8, 1.7, 11.5, 96, 82, [8000, 0.601, 68.0, 3.1]],
  ['Pérou', 'Amérique', 'sud', [4, 7], 34, 15000, 0.762, 72.4, 2.2, 10.9, 95, 78, [6000, 0.615, 66.4, 3.8]],
  ['Venezuela', 'Amérique', 'sud', [5, 6], 28, 8000, 0.699, 70.6, 2.2, 21.0, 97, 88, [12000, 0.635, 70.5, 3.4]],

  ['Maroc', 'Afrique', 'sud', [9, 6], 37, 9000, 0.698, 74.0, 2.3, 15.0, 76, 65, [3500, 0.463, 64.7, 4.0]],
  ['Algérie', 'Afrique', 'sud', [10, 6], 45, 13000, 0.745, 76.4, 2.9, 19.0, 81, 75, [8000, 0.578, 66.7, 4.7]],
  ['Tunisie', 'Afrique', 'sud', [11, 6], 12.4, 12000, 0.732, 73.8, 2.1, 15.0, 82, 70, [5000, 0.570, 68.7, 3.5]],
  ['Égypte', 'Afrique', 'sud', [12, 6], 111, 15000, 0.728, 70.2, 2.9, 16.0, 74, 43, [5500, 0.549, 64.6, 4.4]],
  ['Nigeria', 'Afrique', 'sud', [11, 8], 218, 5900, 0.548, 52.7, 5.1, 71.0, 62, 53, [3000, 0.379, 45.9, 6.4]],
  ['Afrique du Sud', 'Afrique', 'sud', [11, 10], 60, 15000, 0.717, 62.3, 2.3, 26.0, 95, 68, [11000, 0.627, 62.1, 3.7]],
  ['Éthiopie', 'Afrique', 'sud', [13, 8], 123, 2800, 0.492, 65.0, 4.0, 34.0, 52, 22, [800, 0.284, 47.1, 7.1]],
  ['Kenya', 'Afrique', 'sud', [13, 9], 54, 5800, 0.601, 61.4, 3.3, 30.0, 83, 29, [2500, 0.464, 57.7, 6.0]],
  ['Ghana', 'Afrique', 'sud', [10, 8], 33, 6500, 0.602, 63.8, 3.6, 32.0, 80, 58, [2400, 0.464, 57.3, 5.5]],
  ['Sénégal', 'Afrique', 'sud', [8, 8], 17, 4000, 0.517, 67.5, 4.4, 30.0, 57, 49, [2000, 0.376, 57.4, 6.6]],
  ['Côte d’Ivoire', 'Afrique', 'sud', [9, 9], 28, 6000, 0.550, 58.6, 4.4, 55.0, 50, 52, [3200, 0.389, 52.4, 6.3]],
  ['Mali', 'Afrique', 'sud', [9, 7], 22, 2500, 0.410, 58.9, 5.9, 59.0, 31, 45, [1200, 0.232, 47.0, 7.1]],
  ['Niger', 'Afrique', 'sud', [10, 7], 26, 1300, 0.394, 61.9, 6.7, 46.0, 37, 17, [900, 0.216, 44.5, 7.7]],
  ['RD Congo', 'Afrique', 'sud', [11, 9], 99, 1300, 0.481, 59.2, 6.1, 63.0, 80, 47, [1600, 0.375, 49.9, 7.0]],

  ['Chine', 'Asie', 'sud', [18, 4], 1412, 21000, 0.788, 78.2, 1.2, 5.5, 97, 64, [1500, 0.484, 68.5, 2.5]],
  ['Inde', 'Asie', 'sud', [16, 7], 1417, 8300, 0.644, 67.2, 2.0, 25.0, 76, 36, [1800, 0.434, 58.6, 4.0]],
  ['Japon', 'Asie', 'nord', [21, 4], 125, 46000, 0.920, 84.0, 1.3, 1.8, 99, 92, [30000, 0.850, 78.8, 1.5]],
  ['Corée du Sud', 'Asie', 'nord', [20, 4], 52, 51000, 0.929, 83.5, 0.8, 2.4, 99, 81, [12000, 0.737, 71.7, 1.6]],
  ['Indonésie', 'Asie', 'sud', [19, 9], 276, 14000, 0.713, 68.3, 2.2, 19.0, 96, 58, [4000, 0.526, 63.3, 3.1]],
  ['Turquie', 'Asie', 'sud', [13, 5], 85, 38000, 0.855, 76.0, 1.9, 8.6, 97, 77, [10000, 0.598, 64.3, 3.1]],
  ['Arabie saoudite', 'Asie', 'sud', [13, 7], 36, 55000, 0.875, 76.9, 2.4, 6.0, 98, 85, [40000, 0.699, 68.8, 5.5]],
  ['Émirats arabes unis', 'Asie', 'sud', [14, 7], 9.4, 87000, 0.937, 78.7, 1.5, 6.0, 98, 87, [90000, 0.728, 71.9, 4.4]],
  ['Qatar', 'Asie', 'sud', [15, 7], 2.7, 114000, 0.855, 79.3, 1.8, 5.0, 93, 99, [90000, 0.744, 73.7, 4.3]],
  ['Iran', 'Asie', 'sud', [14, 6], 89, 18000, 0.780, 74.6, 1.7, 11.8, 89, 77, [7000, 0.579, 63.9, 4.8]],
  ['Pakistan', 'Asie', 'sud', [15, 6], 236, 6400, 0.540, 66.1, 3.5, 53.0, 58, 38, [3000, 0.402, 60.1, 6.1]],
  ['Bangladesh', 'Asie', 'sud', [17, 7], 171, 7400, 0.670, 72.4, 1.9, 24.0, 75, 40, [1400, 0.394, 58.4, 4.4]],
  ['Vietnam', 'Asie', 'sud', [18, 7], 98, 13000, 0.726, 73.6, 1.9, 16.0, 96, 39, [1500, 0.483, 70.5, 3.6]],
  ['Thaïlande', 'Asie', 'sud', [17, 8], 72, 20000, 0.803, 78.7, 1.3, 7.0, 94, 53, [5000, 0.577, 70.3, 2.1]],
  ['Philippines', 'Asie', 'sud', [20, 7], 116, 9800, 0.710, 69.3, 2.7, 21.0, 96, 48, [3500, 0.599, 65.3, 4.3]],

  ['Australie', 'Océanie', 'nord', [20, 11], 26, 60000, 0.946, 84.0, 1.6, 3.1, 99, 86, [24000, 0.866, 77.0, 1.9]],
  ['Nouvelle-Zélande', 'Océanie', 'nord', [22, 12], 5.1, 49000, 0.939, 82.5, 1.7, 3.6, 99, 87, [21000, 0.859, 75.4, 2.2]],
];

/* Le code ISO relie chaque pays à son contour dans . Il ne figure pas
   dans le tableau ci-dessus parce que ce n'est pas une donnée du sujet : c'est
   une clé de jointure, et une clé de jointure vit en un seul endroit.

   Le contrôle qui suit n'est pas une politesse. Natural Earth donne ISO_A2 =
   « -99 » à la France et à la Norvège ; une jointure naïve les aurait fait
   disparaître de la carte sans un mot. Un pays sans code doit donc se voir
   tout de suite, et la plateforme affiche les erreurs d'import en clair sur
   le banc. */
const CODES = {
  "France": "FR",
  "Allemagne": "DE",
  "Royaume-Uni": "GB",
  "Espagne": "ES",
  "Italie": "IT",
  "Portugal": "PT",
  "Grèce": "GR",
  "Pologne": "PL",
  "Suède": "SE",
  "Ukraine": "UA",
  "Russie": "RU",
  "États-Unis": "US",
  "Canada": "CA",
  "Mexique": "MX",
  "Brésil": "BR",
  "Argentine": "AR",
  "Chili": "CL",
  "Colombie": "CO",
  "Pérou": "PE",
  "Venezuela": "VE",
  "Maroc": "MA",
  "Algérie": "DZ",
  "Tunisie": "TN",
  "Égypte": "EG",
  "Nigeria": "NG",
  "Afrique du Sud": "ZA",
  "Éthiopie": "ET",
  "Kenya": "KE",
  "Ghana": "GH",
  "Sénégal": "SN",
  "Côte d’Ivoire": "CI",
  "Mali": "ML",
  "Niger": "NE",
  "RD Congo": "CD",
  "Inde": "IN",
  "Japon": "JP",
  "Corée du Sud": "KR",
  "Indonésie": "ID",
  "Turquie": "TR",
  "Arabie saoudite": "SA",
  "Émirats arabes unis": "AE",
  "Qatar": "QA",
  "Iran": "IR",
  "Pakistan": "PK",
  "Bangladesh": "BD",
  "Vietnam": "VN",
  "Thaïlande": "TH",
  "Philippines": "PH",
  "Australie": "AU",
  "Nouvelle-Zélande": "NZ",
  "Chine": "CN",
};

export const PAYS = T.map(([nom, continent, groupe, cas, pop, pib, idh, esp, fec, mort, alpha, urb, n90]) => ({
  nom, code: CODES[nom], continent, groupe, case: cas, pop, pib, idh, esp, fec, mort, alpha, urb,
  // les valeurs de 1990, sous les mêmes noms
  a1990: { pib: n90[0], idh: n90[1], esp: n90[2], fec: n90[3], pop: null, mort: null, alpha: null, urb: null },
}));

const orphelins = PAYS.filter((p) => !p.code).map((p) => p.nom);
if (orphelins.length) throw new Error('pays sans code ISO : ' + orphelins.join(', '));

export const CONTINENTS = ['Afrique', 'Amérique', 'Asie', 'Europe', 'Océanie'];
export const COULEUR = {
  Afrique: '#c2703d', Amérique: '#4b7fa8', Asie: '#b0562f',
  Europe: '#4f8a6a', Océanie: '#7a6aa8',
};

// La valeur d'un indicateur, pour l'année demandée. En 1990, tout n'est pas
// connu — et on le dit plutôt que de recopier la valeur d'aujourd'hui.
export function valeur(p, id, annee) {
  if (annee === 2022) return p[id];
  const v = p.a1990[id];
  return v == null ? null : v;
}
