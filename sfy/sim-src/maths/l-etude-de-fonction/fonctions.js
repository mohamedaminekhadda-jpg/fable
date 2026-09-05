// Huit fonctions, avec leurs deux dérivées exactes.
//
// f, f′ et f″ sont écrites à la main parce qu'une dérivée numérique n'est pas
// une dérivée : elle bruite, elle explose près d'un pôle, et elle ne permet pas
// de dire « f′ s'annule ICI ». Tout le reste — les racines de f′, celles de f″,
// les extremums, les points d'inflexion, le tableau de variations — est CHERCHÉ
// à partir de ces trois fonctions, jamais recopié.
//
// Le catalogue suit le programme : un polynôme, deux fonctions avec exponentielle,
// deux avec logarithme, une homographique, une avec asymptote oblique, une paire.
// `trous` liste les valeurs interdites, pour que la courbe se coupe au bon
// endroit au lieu de traverser l'écran d'un trait.

export const FONCTIONS = [
  { id: 'cubique', nom: 'f(x) = x³ − 3x + 1',
    f: (x) => x ** 3 - 3 * x + 1,
    d1: (x) => 3 * x * x - 3,
    d2: (x) => 6 * x,
    dom: [-2.6, 2.6], trous: [],
    note: 'Le cas d’école : deux extremums, un point d’inflexion entre eux. f″ '
      + 'change de signe en 0, et c’est exactement là que la courbe cesse de '
      + 'tourner d’un côté pour tourner de l’autre.' },

  { id: 'xexp', nom: 'f(x) = x e^(−x)',
    f: (x) => x * Math.exp(-x),
    d1: (x) => (1 - x) * Math.exp(-x),
    d2: (x) => (x - 2) * Math.exp(-x),
    dom: [-0.8, 7], trous: [],
    note: 'Maximum en 1, inflexion en 2 : les deux ne sont pas au même endroit, '
      + 'et c’est le piège le plus fréquent. L’axe des abscisses est asymptote en '
      + '+∞ — la courbe s’en approche sans jamais l’atteindre.' },

  { id: 'lnsurx', nom: 'f(x) = ln(x) / x',
    f: (x) => Math.log(x) / x,
    d1: (x) => (1 - Math.log(x)) / (x * x),
    d2: (x) => (2 * Math.log(x) - 3) / (x ** 3),
    dom: [0.12, 9], trous: [],
    note: 'Maximum en e, inflexion en e^(3/2) ≈ 4,48. Le maximum vaut 1/e : c’est '
      + 'ce qui prouve que x^(1/x) est maximal en x = e, un classique de fin de '
      + 'chapitre. En 0 la limite est −∞, l’axe des ordonnées est asymptote.' },

  { id: 'homographique', nom: 'f(x) = (2x + 1) / (x − 1)',
    f: (x) => (2 * x + 1) / (x - 1),
    d1: (x) => -3 / ((x - 1) ** 2),
    d2: (x) => 6 / ((x - 1) ** 3),
    dom: [-5, 7], trous: [1],
    note: 'f′ ne s’annule JAMAIS : elle est strictement négative partout. Pas '
      + 'd’extremum, donc, et deux asymptotes — x = 1 et y = 2. Une fonction peut '
      + 'être décroissante sur chacun de ses deux intervalles sans être '
      + 'décroissante sur leur réunion : regardez les deux branches.' },

  { id: 'xinv', nom: 'f(x) = x + 1/x',
    f: (x) => x + 1 / x,
    d1: (x) => 1 - 1 / (x * x),
    d2: (x) => 2 / (x ** 3),
    dom: [-5, 5], trous: [0],
    note: 'Deux extremums — un maximum en −1, un minimum en 1 — et pourtant '
      + 'f(−1) = −2 est PLUS PETIT que f(1) = 2. « Maximum local » ne veut pas '
      + 'dire « plus grande valeur ». La droite y = x est asymptote oblique.' },

  { id: 'expmoins', nom: 'f(x) = e^x − x − 1',
    f: (x) => Math.exp(x) - x - 1,
    d1: (x) => Math.exp(x) - 1,
    d2: (x) => Math.exp(x),
    dom: [-3, 2.4], trous: [],
    note: 'f″ = e^x ne s’annule jamais : la fonction est convexe PARTOUT, donc '
      + 'aucun point d’inflexion. Son minimum vaut 0, ce qui démontre l’inégalité '
      + 'e^x ≥ x + 1 — la plus utile du chapitre.' },

  { id: 'paire', nom: 'f(x) = (x² − 1) / (x² + 1)',
    f: (x) => (x * x - 1) / (x * x + 1),
    d1: (x) => (4 * x) / ((x * x + 1) ** 2),
    d2: (x) => (4 - 12 * x * x) / ((x * x + 1) ** 3),
    dom: [-5, 5], trous: [],
    note: 'Une fonction paire : sa courbe est sa propre image dans le miroir de '
      + 'l’axe des ordonnées, donc f′ est impaire et s’annule en 0. Deux points '
      + 'd’inflexion symétriques, et y = 1 en asymptote des deux côtés.' },

  { id: 'xmoinsln', nom: 'f(x) = x − ln(x)',
    f: (x) => x - Math.log(x),
    d1: (x) => 1 - 1 / x,
    d2: (x) => 1 / (x * x),
    dom: [0.08, 6], trous: [],
    note: 'Minimum en 1, où f vaut 1 : cela démontre ln(x) ≤ x − 1. f″ = 1/x² est '
      + 'toujours positive, donc la fonction est convexe et n’a pas d’inflexion, '
      + 'malgré une courbe qui semble « tourner » beaucoup près de zéro.' },
];

/* ── les racines d'une fonction sur un domaine ─────────────────────────────
   Balayage puis dichotomie, avec le cas de la racine tombant pile sur un
   échantillon traité à part — sans quoi le produit de deux valeurs vaut zéro,
   n'est pas négatif, et la racine passe inaperçue. Les zéros de f′ sont
   justement des nombres ronds la plupart du temps (0, 1, −1, e), donc ce cas
   n'est pas une curiosité : c'est le cas ordinaire. */
export function racines(g, dom, trous = [], pas = 3000) {
  const [a, b] = dom;
  const loin = (x) => trous.every((t) => Math.abs(x - t) > (b - a) / pas * 2);
  const out = [];
  let xP = null, gP = null;
  for (let i = 0; i <= pas; i++) {
    const x = a + ((b - a) * i) / pas;
    const gx = loin(x) ? g(x) : NaN;
    if (!isFinite(gx)) { xP = x; gP = gx; continue; }
    if (Math.abs(gx) < 1e-13) out.push(x);
    else if (gP != null && isFinite(gP) && gP * gx < 0) {
      let lo = xP, hi = x, glo = gP;
      for (let k = 0; k < 60; k++) {
        const m = (lo + hi) / 2, gm = g(m);
        if (glo * gm <= 0) hi = m; else { lo = m; glo = gm; }
      }
      out.push((lo + hi) / 2);
    }
    xP = x; gP = gx;
  }
  return out.filter((v, i) => i === 0 || Math.abs(v - out[i - 1]) > (b - a) * 1e-5);
}

/* Le tableau de variations, engendré. On découpe le domaine aux zéros de f′ et
   aux valeurs interdites, on regarde le signe de f′ au milieu de chaque
   intervalle, et on en déduit la flèche. C'est mot pour mot la méthode
   enseignée, appliquée par la machine — et c'est pour cela qu'elle reste juste
   quand on change de fonction. */
export function variations(F) {
  const [a, b] = F.dom;
  const coupures = [a, ...racines(F.d1, F.dom, F.trous), ...F.trous, b]
    .filter((v) => v >= a - 1e-12 && v <= b + 1e-12)
    .sort((x, y) => x - y)
    .filter((v, i, t) => i === 0 || Math.abs(v - t[i - 1]) > (b - a) * 1e-6);
  const out = [];
  for (let i = 0; i + 1 < coupures.length; i++) {
    const x0 = coupures[i], x1 = coupures[i + 1];
    const m = (x0 + x1) / 2;
    const s = F.d1(m);
    if (!isFinite(s)) continue;
    out.push({ x0, x1, croissante: s > 0 });
  }
  return { coupures, morceaux: out };
}

// Extremum ou pas : une racine de f′ n'en est un que si le signe CHANGE. Un
// point où f′ s'annule sans changer de signe existe (x³ en 0) et n'est pas un
// extremum ; le dire est au programme.
export function nature(F, x, quoi = 'd1') {
  const g = F[quoi];
  const h = (F.dom[1] - F.dom[0]) * 1e-4;
  const g0 = g(x - h), g1 = g(x + h);
  if (!isFinite(g0) || !isFinite(g1)) return null;
  if (g0 * g1 >= 0) return 'sans changement de signe';
  if (quoi === 'd1') return g0 > 0 ? 'maximum' : 'minimum';
  return g0 > 0 ? 'inflexion (convexe → concave)' : 'inflexion (concave → convexe)';
}
