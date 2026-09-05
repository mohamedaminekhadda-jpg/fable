// Les sept maladies de la séance, chacune dans un arbre qui montre son allure.
//
// Les figures du cours sont des images, illisibles par une machine. Ces arbres
// ne les recopient donc pas : ils reproduisent le MOTIF caractéristique de
// chaque maladie — celui à partir duquel on raisonne. Tout est modifiable
// ensuite, et c'est bien l'intérêt : un arbre qu'on ne peut pas changer
// n'apprend qu'un cas.

// u(a, b, enfants) — une union et ses enfants
export const EXEMPLES = [
  {
    id: 'muco', nom: 'Mucoviscidose — autosomique récessive',
    mot: 'Deux parents sains ont une fille atteinte : l’allèle est donc récessif. '
      + 'Et comme son père est sain, le récessif lié à X tombe aussi — une fille '
      + 'reçoit un X de son père.',
    indivs: [
      [1, 'H', false], [2, 'F', false],
      [3, 'F', true], [4, 'H', false], [5, 'F', false],
    ],
    unions: [[1, 2, [3, 4, 5]]],
  },
  {
    id: 'thal', nom: 'Thalassémie — autosomique récessive',
    mot: 'Le cours le dit : « le gène doit être reçu du père ET de la mère ». '
      + 'Deux porteurs sains, un enfant sur quatre atteint. Le couple II est le '
      + 'même cas une génération plus bas.',
    indivs: [
      [1, 'H', false], [2, 'F', false],
      [3, 'F', true], [4, 'H', false], [5, 'F', false],
      [6, 'H', false],
      [7, 'H', true], [8, 'F', false],
    ],
    unions: [[1, 2, [3, 4, 5]], [4, 6, []], [5, 6, [7, 8]]],
  },
  {
    id: 'hunt', nom: 'Chorée de Huntington — autosomique dominante',
    mot: 'Un atteint à chaque génération, et surtout : deux parents atteints ont '
      + 'une fille saine. Deux homozygotes récessifs n’auraient que des enfants '
      + 'atteints — l’allèle est donc dominant.',
    indivs: [
      [1, 'H', true], [2, 'F', true],
      [3, 'F', false], [4, 'H', true],
      [5, 'F', false],
      [6, 'H', true], [7, 'F', false],
    ],
    unions: [[1, 2, [3, 4]], [4, 5, [6, 7]]],
  },
  {
    id: 'dalt', nom: 'Daltonisme — récessif lié à X',
    mot: 'Le garçon atteint a des parents sains, et son grand-père maternel est '
      + 'atteint : l’allèle a traversé sa mère sans la rendre malade. C’est le '
      + 'motif « en zigzag » du récessif lié à X.',
    indivs: [
      [1, 'H', true], [2, 'F', false],
      [3, 'F', false], [4, 'H', false],
      [5, 'H', true], [6, 'F', false], [7, 'H', false],
    ],
    unions: [[1, 2, [3]], [4, 3, [5, 6, 7]]],
  },
  {
    id: 'hemo', nom: 'Hémophilie — récessive liée à X',
    mot: 'Même motif : les atteints sont des garçons, et ils tiennent l’allèle de '
      + 'leur mère, conductrice et saine. Les filles du couple sont saines, mais '
      + 'l’une d’elles peut être conductrice — l’arbre ne le dit pas.',
    indivs: [
      [1, 'H', false], [2, 'F', false],
      [3, 'H', true], [4, 'F', false], [5, 'F', false],
      [6, 'H', false],
      [7, 'H', true], [8, 'F', false],
    ],
    unions: [[1, 2, [3, 4, 5]], [6, 5, [7, 8]]],
  },
  {
    id: 'duch', nom: 'Myopathie de Duchenne — récessive liée à X',
    mot: 'Trois garçons atteints dans la même fratrie, aucune fille : « la maladie '
      + 'touche plus les garçons que les filles », dit le cours. Ici la mère est '
      + 'conductrice, et un fils sur deux reçoit l’allèle.',
    indivs: [
      [1, 'H', false], [2, 'F', false],
      [3, 'H', true], [4, 'H', true], [5, 'F', false], [6, 'H', false],
    ],
    unions: [[1, 2, [3, 4, 5, 6]]],
  },
  {
    id: 'rach', nom: 'Rachitisme vitamino-résistant — dominant lié à X',
    mot: 'Le père atteint transmet à TOUTES ses filles et à AUCUN de ses fils : '
      + 'il ne donne son X qu’à ses filles, et son Y à ses fils. Un motif que '
      + 'rien d’autre ne produit — mais qui n’exclut pas l’autosomique dominant.',
    indivs: [
      [1, 'H', true], [2, 'F', false],
      [3, 'F', true], [4, 'F', true], [5, 'H', false], [6, 'H', false],
    ],
    unions: [[1, 2, [3, 4, 5, 6]]],
  },
];

// Un exemple → l'état de travail de la simulation.
export function charger(ex) {
  return {
    indivs: ex.indivs.map(([id, sexe, atteint]) => ({ id, sexe, atteint })),
    unions: ex.unions.map(([a, b, enfants], i) => ({ id: i + 1, a, b, enfants: enfants.slice() })),
    prochain: Math.max(...ex.indivs.map((i) => i[0])) + 1,
    prochaineU: ex.unions.length + 1,
  };
}
