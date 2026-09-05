// Le raisonnement génétique, séparé du dessin.
//
// Le cœur de la séance est une déduction : devant un arbre, quels modes de
// transmission restent possibles ? Elle est menée ici de DEUX façons, et les
// deux doivent s'accorder.
//
//   1. Les règles du cours — « deux parents sains ont un enfant atteint, donc
//      l'allèle est récessif » — qui donnent une RAISON lisible.
//   2. Une recherche exhaustive de génotypes compatibles, qui donne la réponse
//      sans rien supposer.
//
// La première explique, la seconde vérifie. Si l'une exclut un mode que l'autre
// accepte, c'est une erreur de raisonnement, pas une nuance — et le contrôle
// est fait à chaque fois.

export const MODES = [
  { id: 'AD', nom: 'autosomique dominant', court: 'A dominant' },
  { id: 'AR', nom: 'autosomique récessif', court: 'A récessif' },
  { id: 'XD', nom: 'lié à X, dominant', court: 'X dominant' },
  { id: 'XR', nom: 'lié à X, récessif', court: 'X récessif' },
  { id: 'Y', nom: 'lié à Y', court: 'Y' },
];

/* ── les génotypes que le phénotype autorise ───────────────────────────── */
export function possibles(mode, ind) {
  const H = ind.sexe === 'H', a = ind.atteint;
  if (mode === 'AD') return a ? ['Nm', 'mm'] : ['NN'];
  if (mode === 'AR') return a ? ['mm'] : ['NN', 'Nm'];
  if (mode === 'XD') {
    if (H) return a ? ['Xm'] : ['XN'];
    return a ? ['XNXm', 'XmXm'] : ['XNXN'];
  }
  if (mode === 'XR') {
    if (H) return a ? ['Xm'] : ['XN'];
    return a ? ['XmXm'] : ['XNXN', 'XNXm'];
  }
  // lié à Y : une femme n'a pas de chromosome Y, elle ne peut pas être atteinte
  if (!H) return a ? [] : ['-'];
  return a ? ['Ym'] : ['YN'];
}

// Probabilité qu'un parent transmette l'allèle muté.
const pm = (g) => (g === 'mm' || g === 'XmXm' || g === 'Xm' || g === 'Ym' ? 1
  : g === 'Nm' || g === 'XNXm' ? 0.5 : 0);

/* ── la probabilité qu'un enfant reçoive tel génotype ──────────────────── */
export function transmission(mode, gPere, gMere, sexe, g) {
  if (mode === 'AD' || mode === 'AR') {
    const p = pm(gPere), q = pm(gMere);
    if (g === 'mm') return p * q;
    if (g === 'NN') return (1 - p) * (1 - q);
    return p * (1 - q) + (1 - p) * q;
  }
  if (mode === 'XD' || mode === 'XR') {
    const q = pm(gMere);                       // la mère donne un de ses deux X
    if (sexe === 'H') {                        // le fils reçoit le X de sa mère
      return g === 'Xm' ? q : 1 - q;
    }
    const p = gPere === 'Xm' ? 1 : 0;          // le père n'a qu'un X, il le donne
    if (g === 'XmXm') return p * q;
    if (g === 'XNXN') return (1 - p) * (1 - q);
    return p * (1 - q) + (1 - p) * q;
  }
  // Y : le fils reçoit le Y de son père, la fille n'en reçoit pas
  if (sexe === 'F') return g === '-' ? 1 : 0;
  return g === gPere ? 1 : 0;
}

/* ── la loi des fondateurs ─────────────────────────────────────────────── */
// Hardy-Weinberg avec une fréquence q de l'allèle muté. Pour une maladie rare
// cela ne change presque rien quand l'arbre suffit à trancher ; cela compte
// quand il ne suffit pas, et c'est justement là qu'il faut être honnête.
export function prior(mode, ind, g, q) {
  const p = 1 - q;
  if (mode === 'AD' || mode === 'AR') {
    return g === 'NN' ? p * p : g === 'Nm' ? 2 * p * q : q * q;
  }
  if (mode === 'XD' || mode === 'XR') {
    if (ind.sexe === 'H') return g === 'Xm' ? q : p;
    return g === 'XNXN' ? p * p : g === 'XNXm' ? 2 * p * q : q * q;
  }
  if (ind.sexe === 'F') return 1;
  return g === 'Ym' ? q : p;
}

/* ── l'ordre des générations : les parents avant leurs enfants ─────────── */
export function ordonner(indivs) {
  const parId = {}; indivs.forEach((i) => { parId[i.id] = i; });
  const vus = new Set(), out = [];
  const visite = (i) => {
    if (vus.has(i.id)) return;
    vus.add(i.id);
    if (i.pere != null && parId[i.pere]) visite(parId[i.pere]);
    if (i.mere != null && parId[i.mere]) visite(parId[i.mere]);
    out.push(i);
  };
  indivs.forEach(visite);
  return out;
}

/* ── toutes les attributions de génotypes compatibles ──────────────────── */
// Renvoie { ok, assignations }. Les assignations portent leur probabilité, ce
// qui permet ensuite un vrai calcul de risque plutôt qu'un comptage naïf.
export function attributions(mode, indivs, q = 0.01, plafond = 60000) {
  const ordre = ordonner(indivs);
  const geno = {}, out = [];
  let deborde = false;
  const rec = (k, w) => {
    if (out.length >= plafond) { deborde = true; return; }
    if (k === ordre.length) { out.push({ geno: { ...geno }, w }); return; }
    const ind = ordre[k];
    const deuxParents = ind.pere != null && ind.mere != null;
    for (const g of possibles(mode, ind)) {
      const p = deuxParents
        ? transmission(mode, geno[ind.pere], geno[ind.mere], ind.sexe, g)
        : prior(mode, ind, g, q);
      if (p > 0) { geno[ind.id] = g; rec(k + 1, w * p); delete geno[ind.id]; }
    }
  };
  rec(0, 1);
  return { ok: out.length > 0, assignations: out, deborde };
}

/* ── les règles du cours, celles qui donnent une RAISON ────────────────── */
export function raisons(indivs) {
  const parId = {}; indivs.forEach((i) => { parId[i.id] = i; });
  const enfantsDe = {};
  indivs.forEach((i) => {
    if (i.pere != null && i.mere != null) {
      const cle = i.pere + '×' + i.mere;
      (enfantsDe[cle] = enfantsDe[cle] || []).push(i);
    }
  });
  const out = [];                               // { mode, texte }
  const nom = (i) => (i.sexe === 'H' ? 'l’homme ' : 'la femme ') + i.nom;

  for (const cle in enfantsDe) {
    const [pid, mid] = cle.split('×');
    const pere = parId[pid], mere = parId[mid];
    if (!pere || !mere) continue;
    for (const enf of enfantsDe[cle]) {
      // Deux parents sains, un enfant atteint : l'allèle est récessif.
      if (!pere.atteint && !mere.atteint && enf.atteint) {
        out.push({ mode: 'AD', texte: nom(enf) + ' est atteint(e) alors que ses deux parents '
          + 'sont sains : un allèle dominant ne peut pas apparaître de nulle part.' });
        out.push({ mode: 'XD', texte: nom(enf) + ' est atteint(e) alors que ses deux parents '
          + 'sont sains : un allèle dominant ne peut pas apparaître de nulle part.' });
      }
      // Deux parents atteints, un enfant sain : l'allèle est dominant.
      if (pere.atteint && mere.atteint && !enf.atteint) {
        out.push({ mode: 'AR', texte: nom(enf) + ' est sain(e) alors que ses deux parents '
          + 'sont atteints : deux homozygotes récessifs ne peuvent donner que des enfants atteints.' });
        if (enf.sexe === 'F' || mere.atteint) {
          out.push({ mode: 'XR', texte: nom(enf) + ' est sain(e) alors que ses deux parents '
            + 'sont atteints : en récessif lié à X, tous leurs enfants le seraient aussi.' });
        }
      }
      // Fille atteinte, père sain : impossible en récessif lié à X.
      if (enf.sexe === 'F' && enf.atteint && !pere.atteint) {
        out.push({ mode: 'XR', texte: nom(enf) + ' est atteinte alors que son père ne l’est pas : '
          + 'une fille reçoit un X de son père, il devrait donc être atteint lui aussi.' });
      }
      // Père atteint, fille saine : impossible en dominant lié à X.
      if (pere.atteint && enf.sexe === 'F' && !enf.atteint) {
        out.push({ mode: 'XD', texte: 'le père de ' + enf.nom + ' est atteint mais elle ne l’est pas : '
          + 'un père transmet son unique X à TOUTES ses filles, qui seraient toutes atteintes.' });
      }
      // Y : le fils suit son père, toujours.
      if (enf.sexe === 'H' && pere.atteint !== enf.atteint) {
        out.push({ mode: 'Y', texte: nom(enf) + ' et son père n’ont pas le même phénotype : '
          + 'le chromosome Y passe intact du père au fils.' });
      }
    }
  }
  indivs.filter((i) => i.sexe === 'F' && i.atteint).forEach((i) => {
    out.push({ mode: 'Y', texte: nom(i) + ' est atteinte : une femme n’a pas de chromosome Y.' });
  });
  // une raison par mode suffit à l'écran
  const vus = new Set();
  return out.filter((r) => (vus.has(r.mode) ? false : vus.add(r.mode)));
}

/* ── le verdict, les deux méthodes confrontées ─────────────────────────── */
export function analyse(indivs, q = 0.01) {
  const rs = raisons(indivs);
  const parMode = {}; rs.forEach((r) => { parMode[r.mode] = r.texte; });
  return MODES.map((m) => {
    const { ok, assignations, deborde } = attributions(m.id, indivs, q);
    return {
      ...m, possible: ok, assignations, deborde,
      raison: ok ? null : parMode[m.id]
        || 'aucune répartition des génotypes ne rend cet arbre possible dans ce mode.',
      // Un désaccord entre les deux méthodes serait une faute de raisonnement.
      desaccord: ok && !!parMode[m.id],
    };
  });
}

/* ── le risque pour un enfant à naître ─────────────────────────────────── */
// On repart des attributions compatibles, chacune avec son poids, et on somme.
// C'est un vrai calcul bayésien : quand l'arbre fixe les génotypes, il redonne
// le 1/4 du cours ; quand il ne les fixe pas, il ne fait pas semblant.
export function risque(mode, indivs, pereId, mereId, sexe, q = 0.01) {
  const { assignations } = attributions(mode, indivs, q);
  if (!assignations.length) return null;
  let tot = 0, atteint = 0;
  const paires = {};
  for (const a of assignations) {
    const gp = a.geno[pereId], gm = a.geno[mereId];
    if (gp === undefined || gm === undefined) return null;
    tot += a.w;
    const cle = gp + ' × ' + gm;
    paires[cle] = (paires[cle] || 0) + a.w;
    for (const g of possiblesTous(mode, sexe)) {
      const p = transmission(mode, gp, gm, sexe, g);
      if (p > 0 && estAtteint(mode, sexe, g)) atteint += a.w * p;
    }
  }
  const listePaires = Object.entries(paires)
    .map(([cle, w]) => ({ cle, p: w / tot })).sort((a, b) => b.p - a.p);
  return { p: atteint / tot, paires: listePaires, certain: listePaires.length === 1 };
}
const possiblesTous = (mode, sexe) => {
  if (mode === 'AD' || mode === 'AR') return ['NN', 'Nm', 'mm'];
  if (mode === 'XD' || mode === 'XR') return sexe === 'H' ? ['XN', 'Xm'] : ['XNXN', 'XNXm', 'XmXm'];
  return sexe === 'H' ? ['YN', 'Ym'] : ['-'];
};
export const estAtteint = (mode, sexe, g) => {
  if (mode === 'AD') return g === 'Nm' || g === 'mm';
  if (mode === 'AR') return g === 'mm';
  if (mode === 'XD') return g === 'Xm' || g === 'XNXm' || g === 'XmXm';
  if (mode === 'XR') return g === 'Xm' || g === 'XmXm';
  return g === 'Ym';
};

/* ── comment un génotype s'écrit au tableau ────────────────────────────── */
export function ecrire(mode, g) {
  if (g === undefined || g === '-') return '—';
  if (mode === 'AD' || mode === 'AR') {
    return { NN: '(N//N)', Nm: '(N//m)', mm: '(m//m)' }[g] || g;
  }
  if (mode === 'XD' || mode === 'XR') {
    return { XN: 'X^N Y', Xm: 'X^m Y', XNXN: 'X^N X^N', XNXm: 'X^N X^m', XmXm: 'X^m X^m' }[g] || g;
  }
  return { YN: 'X Y^N', Ym: 'X Y^m' }[g] || g;
}
