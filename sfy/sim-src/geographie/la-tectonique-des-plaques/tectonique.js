// De quoi calculer une frontière de plaques.
//
// Trois frontières, trois calculs, et aucune valeur inventée.
//
// ── LES INVERSIONS DU CHAMP MAGNÉTIQUE ─────────────────────────────────────
// Ce sont de vraies dates (échelle de Cande & Kent, en millions d'années). Le
// basalte qui refroidit à l'axe d'une dorsale enregistre le sens du champ
// terrestre du moment ; en s'écartant, il emporte cet enregistrement avec lui.
// Il en résulte, de part et d'autre de l'axe, un code-barres SYMÉTRIQUE — et
// c'est la découverte de Vine et Matthews en 1963, celle qui a fait accepter la
// dérive des continents après un demi-siècle de refus.
//
// La largeur d'une bande n'est donc pas dessinée : elle vaut durée × vitesse.
// C'est ainsi qu'on mesure la vitesse d'une dorsale, et l'élève peut refaire la
// mesure dans l'autre sens.

export const INVERSIONS = [
  { t0: 0, t1: 0.773, n: true, nom: 'Brunhes' },
  { t0: 0.773, t1: 0.990, n: false },
  { t0: 0.990, t1: 1.070, n: true, nom: 'Jaramillo' },
  { t0: 1.070, t1: 1.775, n: false },
  { t0: 1.775, t1: 1.934, n: true, nom: 'Olduvai' },
  { t0: 1.934, t1: 2.595, n: false, nom: 'Matuyama' },
  { t0: 2.595, t1: 3.032, n: true, nom: 'Gauss' },
  { t0: 3.032, t1: 3.116, n: false, nom: 'Kaena' },
  { t0: 3.116, t1: 3.207, n: true },
  { t0: 3.207, t1: 3.330, n: false, nom: 'Mammoth' },
  { t0: 3.330, t1: 3.596, n: true },
  { t0: 3.596, t1: 6.000, n: false, nom: 'Gilbert' },
];

/* Quelques frontières réelles, pour comparer ce qu'on règle avec ce qui existe.
   Les vitesses sont des vitesses d'ÉCARTEMENT TOTAL (les deux plaques
   ensemble), en cm/an. */
export const EXEMPLES_DORSALE = [
  { nom: 'Dorsale médio-atlantique (Islande)', v: 2.5 },
  { nom: 'Mer Rouge', v: 1.6 },
  { nom: 'Dorsale est-pacifique (Pâques)', v: 15 },
];

export const MASSE = { croute: 2800, manteau: 3300 };   // kg/m³
export const CROUTE_NORMALE = 35;                       // km, épaisseur d'un continent ordinaire

/* La conversion qu'il ne faut pas rater : un centimètre par an, c'est DIX
   kilomètres par million d'années (1 cm × 10⁶ = 10 km). Une première version
   prenait un pour un, et l'Atlantique se retrouvait dix fois trop vieux — le
   plancher à 1 250 km de l'axe avait un milliard d'années, soit plus que
   l'océan lui-même. */
export const KM_PAR_MA = 10;             // pour 1 cm/an

// La demi-vitesse d'une dorsale, en km par million d'années.
export const demiVitesse = (v) => (v / 2) * KM_PAR_MA;

// L'âge du plancher océanique à une distance x de l'axe (km), pour une vitesse
// d'écartement total v en cm/an.
export const ageCroute = (x, v) => (v > 0 ? Math.abs(x) / demiVitesse(v) : Infinity);

/* Les bandes magnétiques d'un côté de l'axe : chaque inversion devient une
   bande dont la largeur est (durée × demi-vitesse). */
export function bandes(v, xMax) {
  const demi = demiVitesse(v);           // km par million d'années, pour un côté
  const out = [];
  for (const c of INVERSIONS) {
    const x0 = c.t0 * demi, x1 = c.t1 * demi;
    if (x0 > xMax) break;
    out.push({ x0, x1: Math.min(x1, xMax), n: c.n, nom: c.nom, t0: c.t0, t1: c.t1 });
  }
  return out;
}

/* Subduction. Le plan de Wadati-Benioff descend d'un angle donné ; les volcans
   se rangent en arc juste au-dessus de l'endroit où la plaque plongeante
   atteint une centaine de kilomètres, là où elle libère son eau et fait fondre
   le manteau au-dessus d'elle. */
export const PROFONDEUR_FUSION = 100;   // km
export const distanceArc = (angle) => PROFONDEUR_FUSION / Math.tan(angle * Math.PI / 180);
export const profondeurSlab = (d, angle) => d * Math.tan(angle * Math.PI / 180);

/* Collision. L'équilibre isostatique d'Airy : une croûte épaissie flotte plus
   haut ET s'enfonce davantage, dans le rapport de sa densité à celle du
   manteau. Les cinq kilomètres de l'Himalaya ne tiennent pas en l'air — ils
   sont portés par soixante-dix kilomètres de croûte. */
export function isostasie(epaisseur) {
  const f = 1 - MASSE.croute / MASSE.manteau;
  const alt = (epaisseur - CROUTE_NORMALE) * f;
  const racine = (epaisseur - CROUTE_NORMALE) * (MASSE.croute / MASSE.manteau);
  /* Deux profondeurs de Moho, et il faut les nommer : sous le SOMMET de la
     chaîne il vaut toute l'épaisseur de croûte ; sous le niveau de RÉFÉRENCE
     (celui d'une plaine ordinaire) il vaut moins, de la hauteur de la montagne.
     Un seul champ « moho » et l'on se trompe une fois sur deux. */
  return {
    altitude: alt,
    racine,
    mohoSousLeSommet: epaisseur,
    mohoSousLaReference: CROUTE_NORMALE + racine,
  };
}

// Le raccourcissement nécessaire pour épaissir une croûte, à volume conservé.
export const raccourcissement = (largeur0, epaisseur) =>
  largeur0 * (1 - CROUTE_NORMALE / epaisseur);
