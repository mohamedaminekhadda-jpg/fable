// Les noyaux qui interviennent dans les réactions de la séance.
//
// Masses ATOMIQUES en u (table AME). La masse du noyau s'obtient en retranchant
// les Z électrons ; l'énergie de liaison des électrons, quelques eV contre des
// MeV, est négligée comme le fait le cours.
//
// Aucune énergie n'est écrite ici : Δm et E se calculent. Une table qui
// porterait les deux pourrait se contredire elle-même.

export const U_MEV = 931.49410242;        // 1 u en MeV/c²
export const U_KG = 1.66053906660e-27;
export const MEV_J = 1.602176634e-13;
export const NA = 6.02214076e23;
export const M_P = 1.007276466;
export const M_N = 1.008664916;
export const M_E = 0.000548579909;

// symbole : [A, Z, masse atomique u, nom]
const T = {
  'n': [1, 0, 1.00866491595, 'neutron'],          // déjà une masse de noyau
  'H-1': [1, 1, 1.00782503, 'proton'],
  'H-2': [2, 1, 2.01410178, 'deutérium'],
  'H-3': [3, 1, 3.01604928, 'tritium'],
  'He-3': [3, 2, 3.01602932, 'hélium 3'],
  'He-4': [4, 2, 4.00260325, 'hélium 4'],
  'Li-6': [6, 3, 6.01512289, 'lithium 6'],
  'C-12': [12, 6, 12.0, 'carbone 12'],
  'C-14': [14, 6, 14.00324199, 'carbone 14'],
  'N-14': [14, 7, 14.00307401, 'azote 14'],
  'Ne-22': [22, 10, 21.99138511, 'néon 22'],
  'Na-22': [22, 11, 21.99443741, 'sodium 22'],
  'Br-95': [95, 35, 94.94010000, 'brome 95'],
  'Sr-94': [94, 38, 93.91536100, 'strontium 94'],
  'Xe-139': [139, 54, 138.91878700, 'xénon 139'],
  'La-139': [139, 57, 138.90636300, 'lanthane 139'],
  'Rn-222': [222, 86, 222.01757770, 'radon 222'],
  'Ra-226': [226, 88, 226.02540980, 'radium 226'],
  'Th-234': [234, 90, 234.04360120, 'thorium 234'],
  'U-235': [235, 92, 235.04392990, 'uranium 235'],
  'U-238': [238, 92, 238.05078820, 'uranium 238'],
};

// L'électron : A = 0, Z = ±1. Sa masse EST sa masse, il n'y a pas de cortège à
// retrancher — d'où le traitement à part.
const LEPTONS = {
  'e-': { cle: 'e-', A: 0, Z: -1, s: 'e', noyau: M_E, nom: 'électron', lepton: true },
  'e+': { cle: 'e+', A: 0, Z: 1, s: 'e', noyau: M_E, nom: 'positon', lepton: true },
};

export const NOYAUX = {};
for (const cle in T) {
  const [A, Z, atomique, nom] = T[cle];
  const noyau = atomique - Z * M_E;
  NOYAUX[cle] = {
    cle, A, Z, nom, atomique, noyau,
    s: cle === 'n' ? 'n' : cle.split('-')[0],
    // Un nucléon isolé n'est lié à rien : son énergie de liaison est nulle, et
    // la formule le donne d'elle-même.
    El: (Z * M_P + (A - Z) * M_N - noyau) * U_MEV,
  };
}
for (const cle in LEPTONS) NOYAUX[cle] = { ...LEPTONS[cle], El: 0 };

// Une réaction : des membres { cle, n } de chaque côté.
export const REACTIONS = [
  {
    id: 'fission1', titre: 'Fission de l’uranium 235 — strontium et xénon',
    famille: 'fission',
    avant: [['U-235', 1], ['n', 1]], apres: [['Sr-94', 1], ['Xe-139', 1], ['n', 3]],
    mot: 'Un neutron lent frappe le noyau, qui se casse en deux morceaux très '
      + 'inégaux et relâche trois neutrons. C’est la réaction du §6-3.',
  },
  {
    id: 'fission2', titre: 'Fission de l’uranium 235 — lanthane et brome',
    famille: 'fission',
    avant: [['U-235', 1], ['n', 1]], apres: [['La-139', 1], ['Br-95', 1], ['n', 2]],
    mot: 'Le même noyau, une autre façon de se casser : la fission n’a pas un '
      + 'produit unique, mais toute une distribution. C’est l’exercice 4.',
  },
  {
    id: 'fusionDT', titre: 'Fusion deutérium + tritium',
    famille: 'fusion',
    avant: [['H-2', 1], ['H-3', 1]], apres: [['He-4', 1], ['n', 1]],
    mot: 'La fusion la plus accessible, celle que visent les réacteurs à l’étude. '
      + 'Cinq nucléons seulement, et pourtant 17,6 MeV.',
  },
  {
    id: 'fusionDD', titre: 'Fusion deutérium + deutérium',
    famille: 'fusion',
    avant: [['H-2', 2]], apres: [['He-3', 1], ['n', 1]],
    mot: 'Deux deutériums suffisent — et le deutérium, lui, se trouve dans l’eau '
      + 'de mer.',
  },
  {
    id: 'tritium', titre: 'Fabrication du tritium à partir du lithium 6',
    famille: 'fusion',
    avant: [['Li-6', 1], ['n', 1]], apres: [['He-4', 1], ['H-3', 1]],
    mot: 'Le tritium n’existe pas à l’état naturel : on le fabrique sur place, '
      + 'dans le réacteur. C’est la réaction de l’exercice 2.',
  },
  {
    id: 'alpha', titre: 'Radioactivité α — le radium 226',
    famille: 'spontanee',
    avant: [['Ra-226', 1]], apres: [['Rn-222', 1], ['He-4', 1]],
    mot: 'La désintégration du §2-1. Le noyau éjecte une particule α, qui est un '
      + 'noyau d’hélium 4 — le plus solide des petits assemblages.',
  },
  {
    id: 'alphaU', titre: 'Radioactivité α — l’uranium 238',
    famille: 'spontanee',
    avant: [['U-238', 1]], apres: [['Th-234', 1], ['He-4', 1]],
    mot: 'Le premier pas de la longue chaîne qui mène de l’uranium au plomb.',
  },
  {
    id: 'beta-', titre: 'Radioactivité β⁻ — le carbone 14',
    famille: 'spontanee',
    avant: [['C-14', 1]], apres: [['N-14', 1], ['e-', 1]],
    mot: 'Un neutron du noyau se change en proton : Z augmente d’une unité, A ne '
      + 'bouge pas. C’est la datation au carbone 14.',
  },
  {
    id: 'beta+', titre: 'Radioactivité β⁺ — le sodium 22',
    famille: 'spontanee',
    avant: [['Na-22', 1]], apres: [['Ne-22', 1], ['e+', 1]],
    mot: 'L’inverse : un proton devient neutron, et il sort un positon. '
      + 'Attention, il faut compter DEUX masses d’électron.',
  },
];

// Le bilan, calculé une seule fois et de deux façons — par les masses et par les
// énergies de liaison. Qu'elles coïncident n'est pas un hasard : c'est le §6-1.
export function bilan(r) {
  const cote = (l) => l.map(([cle, n]) => ({ ...NOYAUX[cle], n }));
  const av = cote(r.avant), ap = cote(r.apres);
  const somme = (l, f) => l.reduce((s, o) => s + o.n * f(o), 0);
  const mAv = somme(av, (o) => o.noyau), mAp = somme(ap, (o) => o.noyau);
  const dm = mAv - mAp;
  // La voie des énergies de liaison ne vaut QUE si la réaction se contente de
  // redistribuer des nucléons déjà là. Dans une désintégration β un neutron se
  // CHANGE en proton : le compte de protons et de neutrons n'est plus le même de
  // part et d'autre, et « l'énergie qu'il faudrait pour tout défaire en nucléons
  // libres » ne compare plus les mêmes objets. Les deux voies divergent alors
  // pour de bonnes raisons, et il vaut mieux le dire que masquer l'une des deux.
  const nucl = (l, f) => l.filter((o) => !o.lepton).reduce((s, o) => s + o.n * f(o), 0);
  const memesNucleons = nucl(av, (o) => o.Z) === nucl(ap, (o) => o.Z)
    && nucl(av, (o) => o.A - o.Z) === nucl(ap, (o) => o.A - o.Z);
  return {
    av, ap, memesNucleons,
    A: [somme(av, (o) => o.A), somme(ap, (o) => o.A)],
    Z: [somme(av, (o) => o.Z), somme(ap, (o) => o.Z)],
    mAv, mAp, dm,
    E: dm * U_MEV,                                   // par les masses
    ElAv: somme(av, (o) => o.El), ElAp: somme(ap, (o) => o.El),
    parLiaisons: memesNucleons ? somme(ap, (o) => o.El) - somme(av, (o) => o.El) : null,
  };
}
