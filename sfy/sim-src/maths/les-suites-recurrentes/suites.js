// Neuf suites définies par u(n+1) = f(u(n)).
//
// Chaque entrée ne porte que la fonction et sa dérivée — toutes deux exactes,
// écrites à la main parce que ce sont les seules choses qu'on ne peut pas
// déduire. Les points fixes, eux, sont CHERCHÉS : on résout f(x) = x par
// balayage puis dichotomie. C'est la règle de la maison — ce qui se calcule ne
// s'écrit pas — et elle a ici une vertu supplémentaire : la limite affichée est
// obtenue comme l'élève l'obtiendrait, en résolvant l'équation, et non recopiée
// d'un corrigé.
//
// Le choix des neuf n'est pas décoratif. Il couvre les cinq comportements que
// le baccalauréat demande de reconnaître : convergence en escalier, convergence
// en spirale, convergence quadratique, cycle de période deux, et chaos.

export const SUITES = [
  { id: 'racine', titre: 'u(n+1) = √(u(n) + 2)',
    f: (x) => Math.sqrt(x + 2), fp: (x) => 1 / (2 * Math.sqrt(x + 2)),
    dom: [-2, 8], vue: [-2.4, 8, -0.6, 8], u0: 6,
    note: 'L’exercice le plus classique du programme. La limite vérifie l = √(l+2), '
      + 'donc l² − l − 2 = 0 : elle vaut 2. Comme f’(2) = 0,25, chaque pas divise '
      + 'l’écart par quatre — la convergence est rapide et monotone.' },

  { id: 'affine', titre: 'u(n+1) = 0,5 u(n) + 3',
    f: (x) => 0.5 * x + 3, fp: () => 0.5,
    dom: [-6, 16], vue: [-6, 16, -6, 16], u0: 14,
    note: 'Une suite arithmético-géométrique : v(n) = u(n) − 6 est géométrique de '
      + 'raison 0,5. La dérivée est constante, donc le rapport des écarts vaut '
      + 'exactement 0,5 dès le premier pas, et non seulement à la limite.' },

  { id: 'newton', titre: 'u(n+1) = u(n)/2 + 1/u(n)',
    f: (x) => x / 2 + 1 / x, fp: (x) => 0.5 - 1 / (x * x),
    dom: [0.15, 6], vue: [0, 6, 0, 6], u0: 5,
    note: 'La méthode de Newton appliquée à x² = 2 : la limite est √2. Ici '
      + 'f’(√2) = 0, ce qui est le cas remarquable — le rapport des écarts tend '
      + 'vers zéro et le nombre de décimales exactes DOUBLE à chaque pas. Quatre '
      + 'pas suffisent pour dépasser la précision de l’affichage.' },

  { id: 'homographique', titre: 'u(n+1) = (u(n) + 3) / (u(n) + 1)',
    f: (x) => (x + 3) / (x + 1), fp: (x) => -2 / ((x + 1) * (x + 1)),
    dom: [0, 6], vue: [0, 6, 0, 6], u0: 5,
    note: 'La limite vérifie l(l+1) = l+3, donc l² = 3 : c’est √3. Cette fois '
      + 'f’(√3) est NÉGATIF (environ −0,27) : le tracé ne monte plus en escalier, '
      + 'il s’enroule en spirale autour du point fixe, et les termes encadrent la '
      + 'limite en alternant au-dessus et au-dessous.' },

  { id: 'inverse', titre: 'u(n+1) = 1 / (1 + u(n))',
    f: (x) => 1 / (1 + x), fp: (x) => -1 / ((1 + x) * (1 + x)),
    dom: [0, 4], vue: [0, 3, 0, 3], u0: 2.5,
    note: 'La limite vérifie l(1+l) = 1 : c’est (√5 − 1)/2, l’inverse du nombre '
      + 'd’or. Développer la récurrence donne la fraction continue 1/(1+1/(1+…)), '
      + 'et la spirale du tracé est exactement cette fraction qui se construit.' },

  { id: 'cosinus', titre: 'u(n+1) = cos(u(n))',
    f: (x) => Math.cos(x), fp: (x) => -Math.sin(x),
    dom: [-1.6, 1.6], vue: [-1.6, 1.6, -1.1, 1.6], u0: 1.5,
    note: 'Le point fixe ne s’exprime avec aucune fonction usuelle : c’est le seul '
      + 'du lot qu’il FAUT chercher numériquement. Il vaut environ 0,739. '
      + 'Comme f’(l) ≈ −0,67, la spirale converge, mais lentement : il faut une '
      + 'trentaine de pas pour trois décimales.' },

  { id: 'logistique-cycle', titre: 'u(n+1) = 3,2 u(n) (1 − u(n))',
    f: (x) => 3.2 * x * (1 - x), fp: (x) => 3.2 * (1 - 2 * x),
    dom: [0, 1], vue: [0, 1, 0, 1], u0: 0.2,
    note: 'Le point fixe existe — 0,6875 — mais |f’| y vaut 1,2, donc PLUS DE UN : '
      + 'il repousse au lieu d’attirer. La suite ne converge pas ; elle finit par '
      + 'osciller entre deux valeurs. Un point fixe n’est pas une limite : c’est '
      + 'un candidat, et le critère |f’(l)| < 1 dit s’il est retenu.' },

  { id: 'logistique-chaos', titre: 'u(n+1) = 3,9 u(n) (1 − u(n))',
    f: (x) => 3.9 * x * (1 - x), fp: (x) => 3.9 * (1 - 2 * x),
    dom: [0, 1], vue: [0, 1, 0, 1], u0: 0.2,
    note: 'Même formule, un coefficient à peine plus grand, et le tracé ne se '
      + 'referme jamais. Changez u(0) de un millième et la suite prend un tout '
      + 'autre chemin : c’est le chaos, hors programme mais à deux clics de '
      + 'l’exercice ordinaire, et cela vaut d’être vu une fois.' },

  { id: 'carre', titre: 'u(n+1) = u(n)² − 1',
    f: (x) => x * x - 1, fp: (x) => 2 * x,
    dom: [-1.8, 1.8], vue: [-1.8, 1.8, -1.4, 1.8], u0: 0.5,
    note: 'Les deux points fixes sont les racines de x² − x − 1 = 0, soit le nombre '
      + 'd’or et son conjugué. Aux deux, |f’| > 1 : aucun n’attire. La suite tombe '
      + 'sur le cycle 0 → −1 → 0, qu’elle parcourt indéfiniment. Un tracé fermé '
      + 'sur la carte, c’est un cycle.' },
];

/* ── les points fixes, cherchés et non recopiés ────────────────────────────
   On balaye le domaine en pas fins, on repère les changements de signe de
   g(x) = f(x) − x, puis on affine par dichotomie. Quarante itérations donnent
   la précision de la machine, et la méthode marche aussi bien pour cos que pour
   un polynôme — y compris quand la solution n'a pas de forme exacte. */
export function pointsFixes(s, pas = 2000) {
  const [a, b] = s.dom;
  const g = (x) => s.f(x) - x;
  const out = [];
  let xPrec = null, gPrec = null;
  for (let i = 0; i <= pas; i++) {
    const x = a + ((b - a) * i) / pas;
    const gx = g(x);
    if (!isFinite(gx)) { xPrec = x; gPrec = gx; continue; }
    /* Une racine peut tomber EXACTEMENT sur un échantillon, et il faut la
       traiter à part. Ce n'est pas un cas d'école : c'est le cas courant. Les
       points fixes intéressants sont des nombres ronds — 2 pour √(u+2), 0,6875
       pour la logistique — et un domaine rond découpé en 2 000 pas ronds tombe
       dessus pile. Or g y vaut zéro, donc le produit g(x)·g(x+h) vaut zéro et
       non « négatif » : le test de changement de signe laissait filer
       précisément les deux limites que le chapitre veut montrer. */
    if (Math.abs(gx) < 1e-12) out.push(x);
    else if (gPrec != null && isFinite(gPrec) && gPrec * gx < 0) {
      let lo = xPrec, hi = x, glo = gPrec;
      for (let k = 0; k < 60; k++) {
        const m = (lo + hi) / 2, gm = g(m);
        if (glo * gm <= 0) hi = m; else { lo = m; glo = gm; }
      }
      out.push((lo + hi) / 2);
    }
    xPrec = x; gPrec = gx;
  }
  // deux racines à moins d'un millionième l'une de l'autre sont la même
  return out.filter((v, i) => i === 0 || Math.abs(v - out[i - 1]) > 1e-6);
}

// Les termes, et rien de plus : on s'arrête dès que la suite sort du domaine ou
// cesse d'être un nombre, parce qu'une suite qui explose doit se voir exploser
// et non produire des NaN silencieux.
export function termes(s, u0, n) {
  const t = [u0];
  for (let i = 0; i < n; i++) {
    const v = s.f(t[t.length - 1]);
    if (!isFinite(v) || Math.abs(v) > 1e6) break;
    t.push(v);
  }
  return t;
}

// Le point fixe le plus proche d'une valeur : c'est celui vers lequel la suite
// est susceptible d'aller, et donc celui dont on veut lire |f'(l)|.
export function fixeProche(fixes, v) {
  if (!fixes.length) return null;
  return fixes.reduce((m, l) => (Math.abs(l - v) < Math.abs(m - v) ? l : m), fixes[0]);
}

/* Le rapport des écarts successifs. C'est le cœur du chapitre : il tend vers
   |f'(l)|, ce qui explique d'un coup pourquoi certaines suites convergent vite,
   d'autres lentement, et d'autres pas du tout. On le mesure sur les derniers
   termes disponibles plutôt que sur les premiers, où le régime n'est pas encore
   établi. */
export function rapportEcarts(t, l) {
  if (l == null || t.length < 3) return null;
  for (let i = t.length - 2; i >= 1; i--) {
    const e0 = Math.abs(t[i] - l), e1 = Math.abs(t[i + 1] - l);
    if (e0 > 1e-13) return e1 / e0;
  }
  return null;
}
