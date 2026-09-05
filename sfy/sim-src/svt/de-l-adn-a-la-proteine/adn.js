// L'ADN, le code génétique, et de quoi passer de l'un à l'autre.
//
// La séquence n'est pas inventée : ce sont les quinze premiers codons du gène
// de la BÊTA-GLOBINE humaine, celui de l'hémoglobine. Ce choix n'est pas
// décoratif — il met la drépanocytose à un clic. Le septième codon est GAG et
// code l'acide glutamique ; changez son deuxième A en T et vous obtenez GTG, la
// valine, c'est-à-dire exactement la mutation de l'hémoglobine S. Une seule
// lettre sur trois milliards, et une maladie.
//
// Le code génétique ci-dessous est le code universel. Il est vérifié par le
// script de contrôle : soixante-quatre codons, trois codons stop, une seule
// façon d'écrire la méthionine et le tryptophane.

export const BASES = ['A', 'T', 'G', 'C'];

export const COULEUR = { A: '#c9772b', T: '#2a9d8f', G: '#7b5ea7', C: '#c1440e', U: '#3d8fb0' };

// Complémentarité : A avec T (deux liaisons hydrogène), G avec C (trois).
export const COMPLEMENT = { A: 'T', T: 'A', G: 'C', C: 'G' };
export const LIAISONS = { A: 2, T: 2, G: 3, C: 3 };

/* Le code génétique, en codons d'ARN. Écrit ligne à ligne dans l'ordre des
   tables de manuel, pour qu'on puisse le relire et le vérifier à l'œil. */
export const CODE = {
  UUU: 'Phe', UUC: 'Phe', UUA: 'Leu', UUG: 'Leu',
  CUU: 'Leu', CUC: 'Leu', CUA: 'Leu', CUG: 'Leu',
  AUU: 'Ile', AUC: 'Ile', AUA: 'Ile', AUG: 'Met',
  GUU: 'Val', GUC: 'Val', GUA: 'Val', GUG: 'Val',
  UCU: 'Ser', UCC: 'Ser', UCA: 'Ser', UCG: 'Ser',
  CCU: 'Pro', CCC: 'Pro', CCA: 'Pro', CCG: 'Pro',
  ACU: 'Thr', ACC: 'Thr', ACA: 'Thr', ACG: 'Thr',
  GCU: 'Ala', GCC: 'Ala', GCA: 'Ala', GCG: 'Ala',
  UAU: 'Tyr', UAC: 'Tyr', UAA: 'Stop', UAG: 'Stop',
  CAU: 'His', CAC: 'His', CAA: 'Gln', CAG: 'Gln',
  AAU: 'Asn', AAC: 'Asn', AAA: 'Lys', AAG: 'Lys',
  GAU: 'Asp', GAC: 'Asp', GAA: 'Glu', GAG: 'Glu',
  UGU: 'Cys', UGC: 'Cys', UGA: 'Stop', UGG: 'Trp',
  CGU: 'Arg', CGC: 'Arg', CGA: 'Arg', CGG: 'Arg',
  AGU: 'Ser', AGC: 'Ser', AGA: 'Arg', AGG: 'Arg',
  GGU: 'Gly', GGC: 'Gly', GGA: 'Gly', GGG: 'Gly',
};

// Nom français, et famille chimique — c'est la famille qui explique pourquoi
// remplacer un acide aminé par un autre est parfois sans effet et parfois grave.
export const AA = {
  Phe: ['Phénylalanine', 'hydrophobe'], Leu: ['Leucine', 'hydrophobe'],
  Ile: ['Isoleucine', 'hydrophobe'], Met: ['Méthionine', 'hydrophobe'],
  Val: ['Valine', 'hydrophobe'], Pro: ['Proline', 'hydrophobe'],
  Ala: ['Alanine', 'hydrophobe'], Trp: ['Tryptophane', 'hydrophobe'],
  Gly: ['Glycine', 'hydrophobe'],
  Ser: ['Sérine', 'polaire'], Thr: ['Thréonine', 'polaire'],
  Cys: ['Cystéine', 'polaire'], Tyr: ['Tyrosine', 'polaire'],
  Asn: ['Asparagine', 'polaire'], Gln: ['Glutamine', 'polaire'],
  Asp: ['Acide aspartique', 'acide'], Glu: ['Acide glutamique', 'acide'],
  Lys: ['Lysine', 'basique'], Arg: ['Arginine', 'basique'], His: ['Histidine', 'basique'],
  Stop: ['— arrêt —', 'stop'],
};

export const FAMILLE = {
  hydrophobe: '#7b5ea7', polaire: '#2a9d8f', acide: '#c1440e', basique: '#3d6fa0', stop: '#8a8f98',
};

// Les quinze premiers codons du gène de la bêta-globine, brin CODANT.
export const GENE = 'ATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTG';
export const NOM_GENE = 'bêta-globine (début du gène HBB)';

/* Le brin transcrit est le complémentaire du brin codant. L'ARN messager est
   donc la copie du brin codant, à ceci près que la thymine y devient uracile —
   et c'est pour cela qu'on peut lire la protéine directement sur le brin codant,
   ce qui surprend toujours. */
export const complementaire = (s) => [...s].map((b) => COMPLEMENT[b] || b).join('');
export const transcrire = (codant) => [...codant].map((b) => (b === 'T' ? 'U' : b)).join('');

/* La traduction s'arrête au premier codon stop : ce qui suit n'est pas traduit.
   C'est ce qui rend une mutation non-sens si brutale. */
export function traduire(arn) {
  const out = [];
  for (let i = 0; i + 2 < arn.length; i += 3) {
    const c = arn.slice(i, i + 3);
    const aa = CODE[c];
    if (!aa) break;
    out.push({ codon: c, aa, i: i / 3 });
    if (aa === 'Stop') break;
  }
  return out;
}

export const proteine = (arn) => traduire(arn).filter((c) => c.aa !== 'Stop');

/* Ce qu'une mutation a fait, jugé en comparant les deux protéines — jamais
   annoncé d'avance. Trois cas au programme, et le troisième est le plus grave
   parce qu'il tronque tout ce qui suit. */
export function effetMutation(origine, mute) {
  if (origine === mute) return { type: 'aucune', texte: 'séquence d’origine' };
  const p0 = traduire(transcrire(origine));
  const p1 = traduire(transcrire(mute));
  const n = [...origine].reduce((k, b, i) => k + (b === mute[i] ? 0 : 1), 0);
  const ou = [...origine].findIndex((b, i) => b !== mute[i]);
  const base = 'base ' + (ou + 1) + ' (codon ' + (Math.floor(ou / 3) + 1) + ')';
  const aa0 = p0.map((c) => c.aa).join('-'), aa1 = p1.map((c) => c.aa).join('-');
  if (aa0 === aa1) {
    return { type: 'silencieuse', n, ou,
      texte: 'mutation SILENCIEUSE en ' + base + ' : la protéine est inchangée' };
  }
  if (p1.some((c) => c.aa === 'Stop') && !p0.some((c) => c.aa === 'Stop')) {
    return { type: 'non-sens', n, ou,
      texte: 'mutation NON-SENS en ' + base + ' : la protéine est tronquée à '
        + p1.filter((c) => c.aa !== 'Stop').length + ' acides aminés' };
  }
  const k = p0.findIndex((c, i) => p1[i] && p1[i].aa !== c.aa);
  return { type: 'faux-sens', n, ou,
    texte: 'mutation FAUX-SENS en ' + base + ' : ' + (k >= 0
      ? AA[p0[k].aa][0] + ' remplacé par ' + AA[p1[k].aa][0] + ' au rang ' + (k + 1)
      : 'un acide aminé change') };
}

// La drépanocytose : GAG → GTG au septième codon, c'est-à-dire le sixième acide
// aminé de la protéine mature. Un bouton la pose d'un coup.
export const DREPANOCYTOSE = { position: 19, base: 'T' };
