// De quoi calculer une saison.
//
// Rien n'est tabulé ici : tout se calcule à partir de deux nombres, l'inclinaison
// de l'axe (23,44°) et l'excentricité de l'orbite (0,0167). C'est la seule façon
// honnête de trancher la question que tout le monde se pose de travers — est-ce
// la distance au Soleil qui fait l'été ? — puisque les deux effets sont calculés
// côte à côte et qu'on peut les comparer.

export const OBLIQUITE = 23.44;          // degrés, inclinaison de l'axe terrestre
export const EXCENTRICITE = 0.0167;
export const DEMI_GRAND_AXE = 149.598;   // millions de km
export const CONSTANTE_SOLAIRE = 1361;   // W/m² au sommet de l'atmosphère

const RAD = Math.PI / 180;

/* La déclinaison du Soleil : la latitude du point où il est exactement au
   zénith à midi. C'est la formule de Spencer (1971), une série de Fourier
   ajustée sur les éphémérides — juste à environ 0,03°, là où l'approximation
   scolaire en sinus se trompe parfois d'un degré entier. */
export function declinaison(n) {
  const g = (2 * Math.PI * (n - 1)) / 365;
  const d = 0.006918
    - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
    - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
    - 0.002697 * Math.cos(3 * g) + 0.001480 * Math.sin(3 * g);
  return d / RAD;
}

/* L'angle horaire du lever de soleil : cos ω₀ = −tan φ · tan δ.
   Hors de [−1, 1] il n'y a ni lever ni coucher — c'est le jour polaire ou la
   nuit polaire, et il faut le dire au lieu de renvoyer NaN. */
export function angleHoraire(phi, delta) {
  const c = -Math.tan(phi * RAD) * Math.tan(delta * RAD);
  if (c <= -1) return { deg: 180, polaire: 'jour' };
  if (c >= 1) return { deg: 0, polaire: 'nuit' };
  return { deg: Math.acos(c) / RAD, polaire: null };
}

// La durée du jour, en heures : deux fois l'angle horaire, à 15° par heure.
export function dureeDuJour(phi, n) {
  const w = angleHoraire(phi, declinaison(n));
  return { heures: (2 * w.deg) / 15, polaire: w.polaire };
}

// La hauteur du Soleil au-dessus de l'horizon à midi vrai.
export const hauteurMidi = (phi, n) => 90 - Math.abs(phi - declinaison(n));

/* La distance Terre-Soleil. L'anomalie vraie est comptée depuis le périhélie,
   que la Terre passe autour du 3 janvier (jour 3). */
export function distanceSoleil(n) {
  const theta = (2 * Math.PI * (n - 3)) / 365.256;
  const e = EXCENTRICITE;
  return (DEMI_GRAND_AXE * (1 - e * e)) / (1 + e * Math.cos(theta));
}

/* L'énergie reçue en un jour par un mètre carré horizontal, au sommet de
   l'atmosphère. C'est LA grandeur qui fait les saisons : elle réunit la durée
   du jour et la hauteur du Soleil, qui varient ensemble et dans le même sens.
   Résultat en MJ/m² par jour. */
export function insolationJournaliere(phi, n) {
  const d = declinaison(n);
  const w = angleHoraire(phi, d);
  const w0 = w.deg * RAD;
  const dist = distanceSoleil(n);
  const facteur = (DEMI_GRAND_AXE / dist) ** 2;      // l'inverse du carré de la distance
  const s = (86400 / Math.PI) * CONSTANTE_SOLAIRE * facteur
    * (Math.cos(phi * RAD) * Math.cos(d * RAD) * Math.sin(w0)
      + w0 * Math.sin(phi * RAD) * Math.sin(d * RAD));
  return Math.max(0, s) / 1e6;
}

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const JOURS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function dateDuJour(n) {
  let r = Math.max(1, Math.min(365, Math.round(n)));
  for (let m = 0; m < 12; m++) {
    if (r <= JOURS[m]) return { j: r, mois: MOIS[m], texte: r + ' ' + MOIS[m] };
    r -= JOURS[m];
  }
  return { j: 31, mois: 'décembre', texte: '31 décembre' };
}

// Les quatre dates qui découpent l'année, au jour près pour une année ordinaire.
export const REPERES = [
  { n: 80, nom: 'équinoxe de printemps' },
  { n: 172, nom: 'solstice de juin' },
  { n: 266, nom: 'équinoxe d’automne' },
  { n: 355, nom: 'solstice de décembre' },
];
