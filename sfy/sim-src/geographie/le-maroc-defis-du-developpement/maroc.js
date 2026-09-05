// Le Maroc : son contour, ses régions, et ce qu'on y trouve.
//
// Les coordonnées sont en degrés (longitude, latitude), simplifiées mais
// justes de position : le tracé est un CROQUIS, comme celui qu'on demande à
// l'épreuve, pas un fond de carte au 1/500 000. Les frontières orientale et
// saharienne suivent leurs alignements réels, y compris les décrochements de
// la seconde.
//
// Population : recensement général de 2014 (HCP). Superficies officielles.
// La densité n'est jamais saisie — elle se calcule, et c'est ce qui permet de
// la comparer d'une région à l'autre sans se tromper d'unité.

/* Le contour du pays a quitté ce fichier. Il y tenait en quarante-quatre
   points tapés à la main ; il vient maintenant de Natural Earth, dans
   `maroc-fond.js`. Ne restent ici que les données du sujet — les régions,
   les reliefs, les lieux — c'est-à-dire ce qu'aucun fond de carte ne sait.
   Les régions ne sont encore que des points : le découpage en douze régions
   de 2015 ne figure dans aucune source libre à ce jour, et Natural Earth
   comme le SVG fourni portent les seize régions d'avant la réforme. */

export const REGIONS = [
  ['Tanger-Tétouan-Al Hoceïma', 'Tanger', [-5.80, 35.35], 3.557, 17262],
  ['L’Oriental', 'Oujda', [-2.50, 33.80], 2.315, 88680],
  ['Fès-Meknès', 'Fès', [-4.90, 33.90], 4.237, 40075],
  ['Rabat-Salé-Kénitra', 'Rabat', [-6.40, 34.20], 4.581, 18194],
  ['Béni Mellal-Khénifra', 'Béni Mellal', [-5.90, 32.60], 2.520, 28374],
  ['Casablanca-Settat', 'Casablanca', [-7.60, 33.20], 6.862, 19448],
  ['Marrakech-Safi', 'Marrakech', [-8.30, 31.80], 4.521, 39167],
  ['Drâa-Tafilalet', 'Errachidia', [-5.20, 31.10], 1.636, 88836],
  ['Souss-Massa', 'Agadir', [-8.80, 30.20], 2.677, 51642],
  ['Guelmim-Oued Noun', 'Guelmim', [-10.10, 28.60], 0.434, 46108],
  ['Laâyoune-Sakia El Hamra', 'Laâyoune', [-12.20, 26.60], 0.367, 140018],
  ['Dakhla-Oued Ed-Dahab', 'Dakhla', [-14.20, 23.00], 0.143, 130898],
].map(([nom, chef, xy, pop, surf]) => ({
  nom, chef, xy, pop, surf, densite: (pop * 1e6) / surf,
}));

// Les reliefs, en lignes : sans eux, rien de ce qui suit ne s'explique.
export const RELIEFS = [
  { nom: 'Rif', pts: [[-5.90, 35.30], [-5.10, 35.05], [-4.50, 34.95], [-3.60, 34.90]] },
  { nom: 'Moyen Atlas', pts: [[-5.90, 34.10], [-5.30, 33.60], [-4.90, 33.30], [-4.30, 32.70]] },
  { nom: 'Haut Atlas', pts: [[-9.20, 31.00], [-8.00, 31.20], [-6.50, 31.60], [-5.00, 32.10], [-3.90, 32.30]] },
  { nom: 'Anti-Atlas', pts: [[-9.80, 30.00], [-8.50, 29.90], [-7.00, 30.00], [-5.50, 30.50]] },
];

// couche, nom, [lon, lat], poids (pour la taille du symbole), précision
export const LIEUX = [
  // ports
  ['ports', 'Tanger Med', [-5.50, 35.88], 10, '1ᵉʳ port d’Afrique pour les conteneurs'],
  ['ports', 'Casablanca', [-7.62, 33.60], 8, 'le premier port de commerce du pays'],
  ['ports', 'Jorf Lasfar', [-8.62, 33.12], 6, 'phosphates et engrais'],
  ['ports', 'Mohammedia', [-7.38, 33.70], 4, 'hydrocarbures'],
  ['ports', 'Safi', [-9.24, 32.30], 3, 'phosphates, pêche'],
  ['ports', 'Agadir', [-9.60, 30.42], 5, 'pêche et agrumes'],
  ['ports', 'Nador', [-2.93, 35.28], 4, 'sur la Méditerranée orientale'],
  ['ports', 'Laâyoune', [-13.40, 27.10], 3, 'phosphates de Boucraâ, pêche'],
  ['ports', 'Dakhla', [-15.93, 23.70], 3, 'pêche hauturière'],
  // phosphates
  ['phosphates', 'Khouribga', [-6.90, 32.88], 10, 'le plus grand gisement du monde'],
  ['phosphates', 'Benguerir', [-7.95, 32.24], 6, 'exploitation à ciel ouvert'],
  ['phosphates', 'Youssoufia', [-8.53, 32.25], 5, 'relié à Safi par voie ferrée'],
  ['phosphates', 'Boucraâ', [-12.85, 26.35], 5, 'relié à Laâyoune par un convoyeur de 100 km'],
  // agriculture irriguée
  ['agriculture', 'Gharb', [-6.20, 34.50], 9, 'agrumes, canne à sucre, riz'],
  ['agriculture', 'Doukkala', [-8.40, 32.75], 7, 'betterave, céréales, maraîchage'],
  ['agriculture', 'Tadla', [-6.60, 32.40], 7, 'agrumes et betterave, irrigué par l’Oum Er-Rbia'],
  ['agriculture', 'Haouz', [-8.10, 31.75], 6, 'oliviers, maraîchage'],
  ['agriculture', 'Souss', [-9.20, 30.35], 9, 'primeurs et agrumes pour l’exportation'],
  ['agriculture', 'Basse Moulouya', [-2.60, 34.85], 5, 'agrumes et maraîchage'],
  ['agriculture', 'Loukkos', [-6.05, 35.05], 4, 'canne à sucre, maraîchage'],
  // industrie
  ['industrie', 'Casablanca', [-7.60, 33.55], 10, 'la première région industrielle du pays'],
  ['industrie', 'Tanger', [-5.85, 35.60], 9, 'automobile et zones franches'],
  ['industrie', 'Kénitra', [-6.58, 34.26], 6, 'automobile'],
  ['industrie', 'Jorf Lasfar', [-8.62, 33.06], 7, 'chimie des phosphates'],
  ['industrie', 'Mohammedia', [-7.40, 33.66], 5, 'raffinage'],
  // tourisme
  ['tourisme', 'Marrakech', [-8.00, 31.63], 10, 'la première destination du pays'],
  ['tourisme', 'Agadir', [-9.58, 30.44], 8, 'tourisme balnéaire'],
  ['tourisme', 'Fès', [-5.00, 34.03], 6, 'la médina, patrimoine mondial'],
  ['tourisme', 'Tanger', [-5.80, 35.78], 5, 'détroit et croisières'],
  ['tourisme', 'Ouarzazate', [-6.90, 30.92], 4, 'portes du désert, studios de cinéma'],
  ['tourisme', 'Essaouira', [-9.77, 31.51], 4, 'médina et vent'],
  ['tourisme', 'Chefchaouen', [-5.27, 35.17], 3, 'montagne du Rif'],
  // barrages
  ['eau', 'Al Wahda', [-5.60, 34.60], 8, 'le deuxième barrage d’Afrique'],
  ['eau', 'Bin El Ouidane', [-6.45, 32.10], 6, 'irrigue le Tadla'],
  ['eau', 'Al Massira', [-7.90, 32.55], 7, 'irrigue les Doukkala'],
  ['eau', 'Mohammed V', [-2.55, 34.70], 5, 'irrigue la basse Moulouya'],
].map(([couche, nom, xy, poids, mot]) => ({ couche, nom, xy, poids, mot }));

export const COUCHES = [
  { id: 'population', nom: 'la population et sa densité', sym: null },
  { id: 'agriculture', nom: 'l’agriculture irriguée', sym: '#4f8a6a' },
  { id: 'phosphates', nom: 'les phosphates', sym: '#a8763a' },
  { id: 'industrie', nom: 'l’industrie', sym: '#5b6b8a' },
  { id: 'tourisme', nom: 'le tourisme', sym: '#b0562f' },
  { id: 'ports', nom: 'les ports', sym: '#2f7d8c' },
  { id: 'eau', nom: 'les grands barrages', sym: '#3f79a8' },
];
