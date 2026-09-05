// Huit intégrales dont on connaît la valeur exacte.
//
// Chaque entrée porte f et SA PRIMITIVE. C'est ce qui permet de comparer la somme
// approchée à la vraie valeur — sans primitive on ne pourrait afficher qu'une
// somme, jamais une erreur, et c'est l'erreur qui est le sujet de la page.
//
// `bornes` est l'intervalle où l'on autorise a et b à se promener ; `defaut` est
// l'intervalle de l'exercice classique. Sur 1/x et ln, la borne basse ne descend
// pas à zéro : la fonction n'y est pas définie, et une simulation qui laisse
// choisir un intervalle interdit apprend quelque chose de faux.

export const INTEGRALES = [
  { id: 'carre', nom: 'f(x) = x²', f: (x) => x * x, F: (x) => x ** 3 / 3,
    bornes: [-2, 4], defaut: [0, 2], exacte: '8/3',
    note: 'L’intégrale vaut 8/3. C’est le calcul d’aire que Riemann lui-même '
      + 'prenait en exemple, et le seul qu’Archimède savait déjà faire.' },
  { id: 'inverse', nom: 'f(x) = 1/x', f: (x) => 1 / x, F: (x) => Math.log(x),
    bornes: [0.25, 6], defaut: [1, 3], exacte: 'ln 3',
    note: 'L’aire sous 1/x entre 1 et b vaut ln b : c’est la DÉFINITION du '
      + 'logarithme népérien. Mettez a = 1 et b = e ≈ 2,718 : l’aire vaut 1.' },
  { id: 'exp', nom: 'f(x) = e^x', f: (x) => Math.exp(x), F: (x) => Math.exp(x),
    bornes: [-2, 3], defaut: [0, 2], exacte: 'e² − 1',
    note: 'La seule fonction qui est sa propre primitive. L’aire entre 0 et 2 vaut '
      + 'donc e² − 1 ≈ 6,389.' },
  { id: 'sin', nom: 'f(x) = sin x', f: (x) => Math.sin(x), F: (x) => -Math.cos(x),
    bornes: [0, Math.PI * 2], defaut: [0, Math.PI], exacte: '2',
    note: 'L’aire d’une arche de sinus vaut exactement 2 — un nombre entier, ce qui '
      + 'surprend toujours. Poussez b jusqu’à 2π : l’aire retombe à zéro, car la '
      + 'seconde arche est comptée négativement.' },
  { id: 'racine', nom: 'f(x) = √x', f: (x) => Math.sqrt(x), F: (x) => (2 / 3) * x ** 1.5,
    bornes: [0, 6], defaut: [0, 4], exacte: '16/3',
    note: 'La tangente est verticale en 0, et pourtant l’aire est finie : 16/3. Une '
      + 'pente infinie n’empêche pas une aire d’exister.' },
  { id: 'arctan', nom: 'f(x) = 1 / (1 + x²)', f: (x) => 1 / (1 + x * x), F: (x) => Math.atan(x),
    bornes: [-2, 4], defaut: [0, 1], exacte: 'π/4',
    note: 'L’aire entre 0 et 1 vaut π/4. C’est de cette intégrale que sortent la '
      + 'plupart des méthodes de calcul de π, et votre somme en donne déjà deux '
      + 'décimales avec vingt rectangles.' },
  { id: 'ln', nom: 'f(x) = ln x', f: (x) => Math.log(x), F: (x) => x * Math.log(x) - x,
    bornes: [0.3, 6], defaut: [1, Math.E], exacte: '1',
    note: 'Entre 1 et e, l’aire vaut exactement 1. La primitive x ln x − x se '
      + 'trouve par intégration par parties, et c’est l’exemple canonique.' },
  { id: 'cubique', nom: 'f(x) = x³ − 2x', f: (x) => x ** 3 - 2 * x, F: (x) => x ** 4 / 4 - x * x,
    bornes: [-2, 3], defaut: [1, 2], exacte: '3/4',
    note: 'Une fonction qui change de signe. Prenez a = −2 et b = 2 : l’aire vaut '
      + 'zéro, parce que la fonction est impaire et que ce qui est sous l’axe se '
      + 'retranche. Une intégrale n’est pas une aire, c’est une aire ALGÉBRIQUE.' },
];

export const METHODES = [
  { id: 'gauche', nom: 'rectangles à gauche', ordre: 1, t: 0 },
  { id: 'droite', nom: 'rectangles à droite', ordre: 1, t: 1 },
  { id: 'milieu', nom: 'rectangles au milieu', ordre: 2, t: 0.5 },
  { id: 'trapezes', nom: 'trapèzes', ordre: 2, t: null },
];

/* La somme, écrite comme on l'écrit au tableau. Pour les trapèzes, la formule
   des deux demi-bords ; pour les rectangles, la hauteur prise en un point de
   chaque tranche, désigné par `t` : 0 à gauche, 1 à droite, 0,5 au milieu. */
export function somme(I, a, b, n, m) {
  const h = (b - a) / n;
  if (m.t === null) {
    let s = (I.f(a) + I.f(b)) / 2;
    for (let k = 1; k < n; k++) s += I.f(a + k * h);
    return s * h;
  }
  let s = 0;
  for (let k = 0; k < n; k++) s += I.f(a + (k + m.t) * h);
  return s * h;
}

export const exacte = (I, a, b) => I.F(b) - I.F(a);

/* L'ordre observé, MESURÉ et non recopié du cours. On calcule l'erreur pour deux
   nombres de tranches dans un rapport de dix, et l'on regarde de combien de
   décades l'erreur est tombée : c'est la pente de la droite en repère
   logarithmique, donc l'exposant p dans erreur ≈ C/n^p.

   C'est le seul endroit de la page où l'élève découvre quelque chose qu'aucun
   exercice ne lui dira : doubler le nombre de rectangles divise l'erreur par
   deux à gauche, et par QUATRE au milieu. */
export function ordreObserve(I, a, b, m, n1 = 20, n2 = 200) {
  const vraie = exacte(I, a, b);
  const e1 = Math.abs(somme(I, a, b, n1, m) - vraie);
  const e2 = Math.abs(somme(I, a, b, n2, m) - vraie);
  if (!(e1 > 0) || !(e2 > 0)) return null;
  return Math.log10(e1 / e2) / Math.log10(n2 / n1);
}
