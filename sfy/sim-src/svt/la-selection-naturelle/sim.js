// La sélection naturelle, sur des papillons posés sur une écorce.
//
// C'est l'expérience de Kettlewell, celle du phalène du bouleau : des papillons
// clairs sur des troncs clairs, puis la suie du charbon noircit les troncs, et
// en cinquante ans les papillons noirs deviennent la règle. On la refait ici en
// quelques secondes, et surtout on la refait AVEC LES MAINS : c'est vous qui
// noircissez l'écorce, et vous n'avez aucune prise sur les papillons.
//
// ── CE QUE LA SIMULATION REFUSE DE FAIRE ───────────────────────────────────
// Aucun papillon ne change jamais de couleur. Jamais. Un individu naît d'une
// certaine teinte et meurt de cette teinte-là. Ce qui change, c'est la
// COMPOSITION de la population, parce que les plus visibles sont mangés plus
// souvent. Toute la difficulté de la sélection naturelle est là, et c'est la
// raison pour laquelle on la comprend mal : on croit voir des êtres qui
// s'adaptent, alors qu'on voit une population dont la moyenne se déplace.
//
// ── LE HASARD, MAIS REPRODUCTIBLE ──────────────────────────────────────────
// Le tirage passe par mulberry32 et une graine affichée. Deux raisons : une
// même graine rejoue exactement la même histoire — ce qui permet de changer UN
// paramètre et de comparer honnêtement — et Math.random() ne permettrait ni de
// rejouer ni de vérifier. (Math.imul est là pour rester dans les 32 bits :
// une multiplication naïve dépasse 2⁵³ et le générateur perd son uniformité.)

const NMAX = 140;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// deux tirages uniformes donnent un tirage normal (Box-Muller)
const normal = (rnd) => {
  const u = Math.max(1e-12, rnd()), v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/* Une teinte de 0 (très clair) à 1 (très sombre). C'est la seule chose qui
   distingue deux papillons, et elle est héritée. */
export const teinte = (x) => {
  const k = Math.max(0, Math.min(1, x));
  const c = (a, b) => Math.round(a + (b - a) * k);
  return 'rgb(' + c(233, 38) + ',' + c(225, 34) + ',' + c(210, 30) + ')';
};

export const SIGMA_OEIL = 0.26;               // à quel contraste l'oiseau repère

/* Une génération. Renvoie la population suivante et ce qui s'est passé.
   La survie décroît avec le CONTRASTE sur l'écorce : un papillon dont la teinte
   est celle du tronc est presque invisible, un papillon qui tranche est repéré.
   Rien d'autre n'intervient — ni volonté, ni effort, ni besoin. */
export function generation(pop, fond, pression, mutation, rnd) {
  /* Deux facteurs, et il faut les garder séparés. Le CONTRASTE décide si le
     papillon est repéré ; la PRÉDATION décide combien d'oiseaux passent. Une
     première version mélangeait les deux dans un seul écart-type, et il en
     sortait une absurdité : à prédation nulle, les trois quarts des papillons
     étaient tout de même mangés. Un curseur nommé « prédation » posé sur zéro
     doit vouloir dire zéro. */
  const vivants = pop.filter((x) => {
    const contraste = Math.abs(x - fond);
    const repere = 1 - Math.exp(-(contraste * contraste) / (2 * SIGMA_OEIL * SIGMA_OEIL));
    return rnd() >= pression * repere;
  });
  if (!vivants.length) return { pop: [], manges: pop.length, eteinte: true };
  const suivante = [];
  for (let i = 0; i < pop.length; i++) {
    const parent = vivants[Math.floor(rnd() * vivants.length)];
    suivante.push(Math.max(0, Math.min(1, parent + normal(rnd) * mutation)));
  }
  return { pop: suivante, manges: pop.length - vivants.length, eteinte: false, vivants };
}

export const moyenne = (p) => (p.length ? p.reduce((a, b) => a + b, 0) / p.length : 0);
export const ecartType = (p) => {
  if (p.length < 2) return 0;
  const m = moyenne(p);
  return Math.sqrt(p.reduce((s, x) => s + (x - m) * (x - m), 0) / p.length);
};

export function mount(lab) {
  const { make, fr } = lab;
  const svg = lab.svg();

  let graine = 7;
  let rnd = mulberry32(graine);
  let pop = [];
  let gen = 0;
  let histo = [];                 // [génération, moyenne]
  let dernierManges = 0;
  let eteinte = false;
  let mortsRecents = [];          // pour les faire disparaître à l'écran

  lab.group('L’écorce');
  const fond = lab.slider({ label: 'Teinte du tronc', min: 0, max: 1, step: 0.01,
    value: 0.18, dec: 2, format: (v) => (v < 0.33 ? 'claire' : v < 0.66 ? 'moyenne' : 'sombre'),
    onInput: dessine });

  lab.group('La pression du milieu');
  const pression = lab.slider({ label: 'Prédation', min: 0, max: 1, step: 0.05, value: 0.55,
    dec: 2, format: (v) => (v < 0.3 ? 'faible' : v < 0.7 ? 'moyenne' : 'forte'), onInput: dessine });
  const mutation = lab.slider({ label: 'Mutations', min: 0, max: 0.08, step: 0.005, value: 0.02,
    dec: 3, format: (v) => (v === 0 ? 'aucune' : fr(v, 3)), onInput: dessine });

  lab.group('La population de départ');
  const taille = lab.slider({ label: 'Effectif', min: 20, max: NMAX, step: 10, value: 100,
    dec: 0, onInput: repeupler });
  const varDepart = lab.slider({ label: 'Variété initiale', min: 0, max: 0.3, step: 0.01,
    value: 0.12, dec: 2, format: (v) => (v === 0 ? 'tous identiques' : fr(v, 2)),
    onInput: repeupler });

  lab.buttons([
    { label: 'Une génération', onClick: () => { pas(1); } },
    { label: '10 générations', onClick: () => { pas(10); } },
    { label: 'Nouvelle population', onClick: () => { graine = (graine * 7 + 13) % 9973; repeupler(); } },
    { label: 'Tout recommencer', onClick: repeupler },
  ]);

  const txt = (v) => (v == null ? '—' : String(v));
  lab.group('La population');
  const rGen = lab.readout({ label: 'Génération', format: txt, hi: true });
  const rMoy = lab.readout({ label: 'Teinte moyenne', format: txt });
  const rEcart = lab.readout({ label: 'Variété restante', format: txt });
  const rManges = lab.readout({ label: 'Mangés à la dernière', format: txt });
  lab.group('L’ajustement');
  const rEcartFond = lab.readout({ label: 'Écart à l’écorce', format: txt, hi: true });
  const rEtat = lab.readout({ label: 'Ce qui se passe', format: txt });

  function repeupler() {
    rnd = mulberry32(graine);
    const n = Math.round(taille.value);
    const centre = 0.22;          // la population de départ est claire, comme les troncs d'avant
    pop = [];
    for (let i = 0; i < n; i++) {
      pop.push(Math.max(0, Math.min(1, centre + normal(rnd) * varDepart.value)));
    }
    gen = 0; histo = [[0, moyenne(pop)]]; dernierManges = 0; eteinte = false; mortsRecents = [];
    dessine();
  }

  function pas(n) {
    for (let k = 0; k < n && !eteinte; k++) {
      const r = generation(pop, fond.value, pression.value, mutation.value, rnd);
      dernierManges = r.manges;
      eteinte = r.eteinte;
      if (!eteinte) { pop = r.pop; gen++; histo.push([gen, moyenne(pop)]); }
    }
    if (histo.length > 400) histo = histo.slice(-400);
    dessine();
  }

  /* ── outils ────────────────────────────────────────────────────────────── */
  let regle = null;
  const mesure = (s, fs) => {
    if (!regle) return String(s).length * fs * 0.55;
    regle.setAttribute('font-size', fs);
    regle.textContent = String(s);
    return regle.getComputedTextLength() || String(s).length * fs * 0.55;
  };
  function T(p, x, y, s, a = {}) {
    const t = make('text', { x, y, 'font-size': a.fs || 11, fill: a.fill || 'var(--ink)',
      'text-anchor': a.anchor || 'middle', 'font-weight': a.bold ? 600 : 400,
      'font-family': a.mono ? 'var(--mono)' : 'inherit', opacity: a.op != null ? a.op : 1 }, p);
    t.textContent = s;
    return t;
  }
  function coupe(s, largeur, fs) {
    const mots = String(s).split(/\s+/), out = [];
    let l = '';
    mots.forEach((m) => {
      if (!l) { l = m; return; }
      const e = l + ' ' + m;
      if (mesure(e, fs) <= largeur) l = e; else { out.push(l); l = m; }
    });
    if (l) out.push(l);
    return out;
  }

  const graphe = lab.chart({
    x: { label: 'génération', min: 0 },
    y: { label: 'teinte moyenne', min: 0, max: 1, ticks: 5 },
  });

  // position d'un papillon sur le tronc : fixe pour un rang donné, sinon la
  // population « grouille » à chaque redessin sans que rien ne se passe
  const place = (i) => {
    const a = mulberry32(1000 + i)();
    const b = mulberry32(5000 + i)();
    return [a, b];
  };

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    regle = make('text', { x: -9999, y: -9999, fill: 'none' }, svg);
    const { w: W, h: H } = lab.size();
    const b = fond.value;
    const m = moyenne(pop), sd = ecartType(pop);

    const fsT = Math.max(13, Math.min(18, W / 42));
    T(svg, 12, 10 + fsT, 'Des papillons sur une écorce',
      { fs: fsT, bold: true, anchor: 'start' });
    const lignes = coupe('Noircissez le tronc, puis faites passer les générations. '
      + 'Aucun papillon ne change de couleur — regardez pourtant la population.', W - 24, 11.5);
    lignes.forEach((l, i) => T(svg, 12, 12 + fsT * 2 + i * 13, l,
      { fs: 11.5, anchor: 'start', fill: 'var(--ink-soft)' }));
    const haut = 12 + fsT * 2 + lignes.length * 13 + 10;

    const cote = W >= 720;
    const Lw = cote ? Math.min(W * 0.46, 420) : W;
    tronc(cote ? { x: 10, y: haut, w: Lw - 16, h: H - haut - 10 }
      : { x: 10, y: haut, w: W - 20, h: Math.min(150, (H - haut) * 0.45) }, b);
    const gb = cote ? { x: Lw, y: haut, w: W - Lw - 10, h: H - haut - 8 }
      : { x: 0, y: haut + Math.min(158, (H - haut) * 0.45 + 8), w: W, h: H - haut - Math.min(166, (H - haut) * 0.45 + 16) };
    if (gb.w > 190 && gb.h > 120) courbe(gb, b);

    /* ── les mesures ── */
    rGen.set('n° ' + gen + (eteinte ? '   — population éteinte' : ''));
    rMoy.set(fr(m, 3) + (m < 0.33 ? '   (claire)' : m < 0.66 ? '   (moyenne)' : '   (sombre)'));
    rEcart.set(fr(sd, 3) + (sd < 0.015 ? '   — presque plus aucune' : ''));
    rManges.set(gen === 0 ? '—' : dernierManges + ' sur ' + Math.round(taille.value)
      + '  (' + fr((100 * dernierManges) / Math.max(1, taille.value), 0) + ' %)');
    const d = Math.abs(m - b);
    rEcartFond.set(fr(d, 3) + (d < 0.05 ? '   — la population est ajustée' : ''));
    rEtat.set(eteinte ? 'ÉTEINTE : personne n’était assez proche de la nouvelle écorce'
      : sd < 0.015 && d > 0.15 && mutation.value === 0
        ? 'bloquée : plus de variété, donc plus rien sur quoi trier'
        : d < 0.05 ? 'ajustée à son milieu'
          : gen === 0 ? 'population de départ, pas encore triée'
            : 'en train de se déplacer vers la teinte du tronc');
    if (regle) { regle.remove(); regle = null; }
  }

  /* ── le tronc et ses papillons ─────────────────────────────────────────── */
  function tronc(box, b) {
    const g = make('g', {}, svg);
    make('rect', { x: box.x, y: box.y, width: box.w, height: box.h, rx: 6,
      fill: teinte(b) }, g).style.transition = 'fill .3s linear';
    // quelques stries d'écorce, à peine plus sombres que le fond
    for (let i = 0; i < 9; i++) {
      const x = box.x + ((i + 0.5) * box.w) / 9;
      make('path', { d: 'M' + x + ' ' + box.y + 'q' + (6 - (i % 3) * 5) + ' '
        + box.h / 2 + ' 0 ' + box.h, stroke: teinte(Math.min(1, b + 0.10)),
        'stroke-width': 3 + (i % 3), fill: 'none', opacity: 0.5 }, g);
    }
    const r = Math.max(3.5, Math.min(8, Math.sqrt((box.w * box.h) / Math.max(20, pop.length)) / 3.4));
    pop.forEach((x, i) => {
      const [u, v] = place(i);
      const cx = box.x + 10 + u * (box.w - 20);
      const cy = box.y + 10 + v * (box.h - 20);
      // le papillon : deux ailes, pas un rond — on doit le reconnaître comme
      // un être vivant, pas comme un point de données
      make('path', { d: 'M' + cx + ' ' + cy + 'q' + -r * 1.5 + ' ' + -r * 1.2 + ' ' + -r * 1.7
        + ' ' + r * 0.15 + 'q' + r * 0.2 + ' ' + r * 1.1 + ' ' + r * 1.7 + ' ' + -r * 0.15
        + 'q' + r * 1.5 + ' ' + -r * 1.2 + ' ' + r * 1.7 + ' ' + r * 0.15
        + 'q' + -r * 0.2 + ' ' + r * 1.1 + ' ' + -r * 1.7 + ' ' + -r * 0.15 + 'z',
      fill: teinte(x), stroke: 'rgba(0,0,0,.28)', 'stroke-width': 0.6 }, g);
    });
    /* La légende se pose DANS l'écorce, avec un halo : sous la boîte elle
       débordait de la scène de sept pixels. */
    const leg = T(g, box.x + box.w / 2, box.y + box.h - 8,
      pop.length + ' papillons — aucun ne changera jamais de couleur',
      { fs: 10, fill: 'var(--ink)' });
    leg.setAttribute('paint-order', 'stroke');
    leg.setAttribute('stroke', 'var(--paper)');
    leg.setAttribute('stroke-width', '3.4');
    leg.setAttribute('stroke-linejoin', 'round');
  }

  /* ── la courbe : où va la moyenne de la population ─────────────────────── */
  function courbe(box, b) {
    const g = graphe.draw(svg, box, {
      curves: histo.length > 1 ? [{ pts: histo, color: 'var(--sub)', width: 2.2 }] : [],
      points: histo.length ? [{ x: histo[histo.length - 1][0], y: histo[histo.length - 1][1], r: 4 }] : [],
    });
    const bx = graphe.box;
    if (!bx) return;
    const y = bx.Y(b);
    make('line', { x1: bx.L, y1: y, x2: bx.R, y2: y, stroke: 'var(--ink)',
      'stroke-width': 1.4, 'stroke-dasharray': '5 4', opacity: 0.6 }, g);
    T(g, bx.R - 6, y - 5, 'teinte du tronc', { fs: 9.5, anchor: 'end', fill: 'var(--ink-soft)' });
    if (histo.length < 2) {
      T(g, (bx.L + bx.R) / 2, (bx.T + bx.B) / 2, 'faites passer une génération',
        { fs: 12, fill: 'var(--ink-mute)' });
    }
  }

  repeupler();
  lab.onResize(dessine);
  lab.onReset(repeupler);
}
