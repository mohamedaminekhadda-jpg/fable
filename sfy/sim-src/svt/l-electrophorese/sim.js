// L'électrophorèse et le profil d'ADN
//
// Le §2-2 : « on fragmente l'ADN sous l'action d'une enzyme de restriction ;
// ces fragments peuvent être séparés suivant leur taille sur un gel ; les
// molécules migrent car elles sont chargées négativement ; les plus grandes
// sont retardées par rapport aux petites. »
//
// Tout est là, et deux choses en découlent, que la simulation sépare :
//
//   • LIRE UN GÉNOTYPE. C'est le cas de la mucoviscidose dans le cours : le
//     couple II-6/II-7 consulte, on analyse l'ADN de la famille au Southern
//     blot. L'allèle muté a perdu un site de coupure — il donne donc UN grand
//     fragment là où l'allèle sain en donne deux petits. Un hétérozygote porte
//     les deux : trois bandes. Le génotype se lit sur le gel.
//
//   • CONFONDRE UN SUSPECT. C'est la figure 4 : le profil d'une tache de sang
//     comparé à celui de sept suspects. Un profil n'est pas un gène, c'est un
//     jeu de longueurs — et il n'appartient qu'à une personne.
//
// La migration n'est pas dessinée à la main : la distance suit
// d = a − b·log₁₀(taille), qui est la loi réelle d'un gel. C'est pour cela que
// l'échelle des tailles n'est pas régulière.

// La séquence que l'enzyme reconnaît. EcoRI lit GAATTC et coupe entre le G et
// le A ; la séquence est palindromique, ce qui est vrai de presque toutes les
// enzymes de restriction. Une seule base changée, et l'enzyme ne reconnaît plus
// rien : c'est très exactement ce que fait la mutation.
const SITE_N = 'GAATTC';
const SITE_M = 'GAATTT';              // le C final muté en T
const COMPL = { A: 'T', T: 'A', G: 'C', C: 'G' };

const LONG = 6000;                    // le fragment étudié, en paires de bases
const SITE1 = 0, SITE2 = 2200, SITE3 = 6000;   // les sites de coupure de l'enzyme
// L'allèle muté a perdu le site du milieu : la mutation l'a détruit.
const FRAG = {
  N: [SITE2 - SITE1, SITE3 - SITE2],  // 2200 et 3800
  m: [SITE3 - SITE1],                 // 6000, d'un seul tenant
};
const MARQUEUR = [500, 1000, 1500, 2000, 3000, 4000, 6000, 8000];

const GENOS = [
  { v: 'NN', l: 'sain, non porteur  (N//N)' },
  { v: 'Nm', l: 'porteur sain  (N//m)' },
  { v: 'mm', l: 'atteint  (m//m)' },
];

// Les sept suspects de la figure 4, et la tache de sang. Chaque profil est un
// jeu de longueurs — deux allèles par locus, comme dans la réalité.
const PROFILS = {
  tache: [[3100, 4200], [1400, 2600], [5200, 5200]],
  S1: [[3100, 3900], [1400, 2600], [5200, 6100]],
  S2: [[2800, 4200], [1900, 2600], [4400, 5200]],
  S3: [[3100, 4200], [1400, 2600], [5200, 5200]],     // celui-ci correspond
  S4: [[3100, 4200], [1400, 3300], [4400, 5200]],
  S5: [[2800, 3900], [1900, 3300], [4400, 6100]],
  S6: [[3100, 4200], [1400, 2600], [4400, 6100]],
  S7: [[2800, 3900], [1900, 2600], [5200, 5200]],
};

export function mount(lab) {
  const { make, fr } = lab;

  lab.group('Ce qu’on regarde');
  const vue = lab.select({
    label: 'Vue', value: 'famille',
    options: [
      { value: 'coupure', label: 'l’enzyme coupe l’ADN' },
      { value: 'famille', label: 'le gel d’une famille' },
      { value: 'profil', label: 'le profil d’ADN d’un crime' },
    ],
  });
  // Un gel se photographie de deux façons, et le cours cite les deux : sous
  // ultraviolet, où l'ADN marqué brille sur fond noir ; ou sur film
  // radiographique, où il apparaît « sous forme de bande » sombre. Ce sont deux
  // images du même gel — autant pouvoir regarder les deux.
  const revel = lab.select({
    label: 'Révélation', value: 'uv',
    options: [{ value: 'uv', label: 'gel sous ultraviolet' },
      { value: 'film', label: 'film radiographique' }],
  });
  lab.group('La famille');
  const gPere = lab.select({ label: 'Le père', options: GENOS.map((g) => ({ value: g.v, label: g.l })), value: 'Nm' });
  const gMere = lab.select({ label: 'La mère', options: GENOS.map((g) => ({ value: g.v, label: g.l })), value: 'Nm' });
  const gEnf = lab.select({ label: 'L’enfant déjà né', options: GENOS.map((g) => ({ value: g.v, label: g.l })), value: 'mm' });
  const gFoe = lab.select({ label: 'Le fœtus', options: GENOS.map((g) => ({ value: g.v, label: g.l })), value: 'Nm' });
  const sonde = lab.check({ label: 'Révéler à la sonde (Southern blot)', value: true });

  /* ── mesures ───────────────────────────────────────────────────────── */
  const loiR = lab.readout({ label: 'la loi de migration', format: (s) => s || '—' });
  const fragR = lab.readout({ label: 'fragments attendus', format: (s) => s || '—' });
  const lectR = lab.readout({ label: 'ce que le gel dit', format: (s) => s || '—', hi: true });
  const coherR = lab.readout({ label: 'cohérence avec les parents', format: (s) => s || '—' });
  const susR = lab.readout({ label: 'le suspect qui correspond', format: (s) => s || '—', hi: true });
  const detR = lab.readout({ label: 'les autres', format: (s) => s || '—' });

  /* ── la migration ──────────────────────────────────────────────────── */
  // d = a − b log₁₀(taille) : les grands fragments restent en haut, les petits
  // filent vers le bas. Le gel sépare des LONGUEURS, pas des gènes.
  const A = 0.06, B = 0.78;
  const dist = (t) => A + B * (Math.log10(9000) - Math.log10(t)) / (Math.log10(9000) - Math.log10(400));

  const fragmentsDe = (g) => (g === 'NN' ? FRAG.N.slice()
    : g === 'mm' ? FRAG.m.slice()
      : FRAG.N.concat(FRAG.m)).sort((a, b) => b - a);

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  const PAD = { l: 20, r: 18, t: 30, b: 18 };

  // Un gel est une PHOTOGRAPHIE : ses couleurs sont celles de la pellicule, pas
  // celles du thème. On les fixe donc, contrairement à tout le reste de la
  // simulation — un fond de gel qui s'éclaircirait avec le thème ne serait plus
  // un gel.
  const PALETTE = {
    uv: { fond: '#0a0e12', fond2: '#141b21', bande: '#8ef0c0', chaud: '#d8ffe9',
      puits: '#05080a', trait: '#2b3942', texte: '#7d939e' },
    film: { fond: '#ded8cc', fond2: '#efeae0', bande: '#241f1a', chaud: '#0d0b09',
      puits: '#b9b1a2', trait: '#b6ae9f', texte: '#6b6357' },
  };
  const pal = () => PALETTE[revel.value];

  // Les filtres : une bande d'électrophorèse n'a pas de bord net. Elle diffuse
  // dans le sens de la migration bien plus que dans l'autre — d'où deux écarts-
  // types différents.
  function defs() {
    const d = make('defs', {}, g);
    const f1 = make('filter', { id: 'bandeFlou', x: '-40%', y: '-160%', width: '180%', height: '420%' }, d);
    make('feGaussianBlur', { stdDeviation: '0.7 1.9' }, f1);
    const f2 = make('filter', { id: 'bandeHalo', x: '-60%', y: '-260%', width: '220%', height: '620%' }, d);
    make('feGaussianBlur', { stdDeviation: '2.4 5' }, f2);
    const f3 = make('filter', { id: 'grain', x: '0%', y: '0%', width: '100%', height: '100%' }, d);
    make('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: '2' }, f3);
    return d;
  }

  // Le cadre du gel : un fond très légèrement dégradé, plus sombre sur les
  // bords, comme toute photographie prise sous une lampe.
  function cuve(x, y, w, h, d) {
    const grad = make('linearGradient', { id: 'fondGel', x1: '0', y1: '0', x2: '0', y2: '1' }, d);
    make('stop', { offset: '0%', 'stop-color': pal().fond2 }, grad);
    make('stop', { offset: '45%', 'stop-color': pal().fond }, grad);
    make('stop', { offset: '100%', 'stop-color': pal().fond2 }, grad);
    make('rect', { x, y, width: w, height: h, rx: 5, fill: 'url(#fondGel)' }, g);
    // le grain de la pellicule, à peine perceptible
    make('rect', { x, y, width: w, height: h, rx: 5, filter: 'url(#grain)',
      opacity: revel.value === 'uv' ? .1 : .16 }, g);
    make('rect', { x, y, width: w, height: h, rx: 5, fill: 'none',
      stroke: pal().trait, 'stroke-width': 1 }, g);
  }

  // Une bande : un halo large et faible, puis un cœur plus net. L'intensité suit
  // la MASSE d'ADN — un fragment deux fois plus long fixe deux fois plus de
  // colorant, et brille donc davantage. C'est vrai sur un vrai gel, et c'est un
  // piège classique : la bande la plus brillante n'est pas la plus abondante,
  // c'est la plus longue.
  function bande(cx, y, larg, taille, tMax, force) {
    const p = pal();
    const inten = (0.42 + 0.58 * Math.sqrt(taille / tMax)) * (force == null ? 1 : force);
    make('rect', { x: cx - larg * 0.54, y: y - 4.5, width: larg * 1.08, height: 9, rx: 4,
      fill: p.bande, opacity: 0.3 * inten, filter: 'url(#bandeHalo)' }, g);
    make('rect', { x: cx - larg * 0.46, y: y - 2.6, width: larg * 0.92, height: 5.2, rx: 2.6,
      fill: p.bande, opacity: 0.9 * inten, filter: 'url(#bandeFlou)' }, g);
    make('rect', { x: cx - larg * 0.42, y: y - 1.1, width: larg * 0.84, height: 2.2, rx: 1.1,
      fill: p.chaud, opacity: 0.75 * inten, filter: 'url(#bandeFlou)' }, g);
  }

  // Le puits, et la traînée que le dépôt laisse derrière lui.
  function puits(cx, y, larg, h, d, k) {
    const p = pal();
    make('rect', { x: cx - larg * 0.34, y, width: larg * 0.68, height: 7, rx: 1.5,
      fill: p.puits, stroke: p.trait, 'stroke-width': .8 }, g);
    const tr = make('linearGradient', { id: 'trainee' + k, x1: '0', y1: '0', x2: '0', y2: '1' }, d);
    make('stop', { offset: '0%', 'stop-color': p.bande, 'stop-opacity': revel.value === 'uv' ? .13 : .1 }, tr);
    make('stop', { offset: '100%', 'stop-color': p.bande, 'stop-opacity': '0' }, tr);
    make('rect', { x: cx - larg * 0.3, y: y + 7, width: larg * 0.6, height: h,
      fill: 'url(#trainee' + k + ')' }, g);
  }

  function paint() {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    const W = w - PAD.l - PAD.r, H = h - PAD.t - PAD.b;
    const v = vue.value;
    [gPere, gMere, gEnf, gFoe].forEach((s) => { s.row.hidden = v === 'profil'; });
    sonde.row.hidden = v !== 'famille';
    revel.row.hidden = v === 'coupure';
    [loiR, fragR].forEach((r) => r.show(v !== 'profil'));
    [lectR, coherR].forEach((r) => r.show(v === 'famille'));
    [susR, detR].forEach((r) => r.show(v === 'profil'));

    if (v === 'coupure') coupure(PAD.l, PAD.t, W, H);
    else if (v === 'famille') famille(PAD.l, PAD.t, W, H);
    else profil(PAD.l, PAD.t, W, H);
    releves();
  }

  /* ── l'enzyme coupe ────────────────────────────────────────────────── */
  function coupure(X0, Y0, W, H) {
    label(X0, 14, W < 760 ? 'L’enzyme coupe, la mutation supprime un site'
      : 'L’enzyme de restriction coupe à des endroits précis — et la mutation en supprime un', 'lab');
    const bw = W * 0.78, bx = X0 + (W - bw) / 2;
    const X = (pb) => bx + (pb / LONG) * bw;
    [['allèle sain  N', FRAG.N, [SITE2], Y0 + H * 0.28],
      ['allèle muté  m', FRAG.m, [], Y0 + H * 0.62]].forEach(([nom, frs, sites, y]) => {
      label(bx, y - 22, nom, 'pt start');
      make('rect', { x: bx, y: y - 11, width: bw, height: 22, rx: 4,
        fill: 'var(--ink-mute)', opacity: .2, stroke: 'var(--ink-soft)', 'stroke-width': 1 }, g);
      let x0 = 0;
      frs.forEach((f, i) => {
        make('rect', { x: X(x0) + 2, y: y - 9, width: (f / LONG) * bw - 4, height: 18, rx: 3,
          fill: i % 2 ? 'var(--ink-soft)' : 'var(--sub)', opacity: .7 }, g);
        // Posée SUR le fragment, l'étiquette se noie dans sa couleur. Un liseré
        // de la couleur du fond, tracé avant le remplissage, la détache de tout
        // ce qu'elle recouvre — quelle que soit la teinte dessous.
        const t = label(X(x0 + f / 2), y + 5, fr(f, 0) + ' pb', 'ax');
        t.setAttribute('stroke', 'var(--paper)');
        t.setAttribute('stroke-width', '3.2');
        t.setAttribute('paint-order', 'stroke');
        t.setAttribute('fill', 'var(--ink)');
        x0 += f;
      });
      sites.forEach((s) => {
        make('line', { x1: X(s), y1: y - 20, x2: X(s), y2: y + 20, stroke: 'var(--ink)', 'stroke-width': 2 }, g);
        label(X(s), y - 26, '✂', 'tau');
      });
      // La séquence elle-même, en gros plan : c'est là que tout se joue, et une
      // barre de couleur ne le montre pas. Une base change, l'enzyme ne
      // reconnaît plus, le fragment reste entier.
      //
      // Sur une scène basse elle ne tient pas ; on revient alors à la phrase, qui
      // dit la même chose en moins bien. Les deux ensemble se chevauchaient — et
      // se répétaient, ce qui était la vraie faute.
      if (H > 300) sequence(X(SITE2), y + 34, nom.includes('sain'));
      else if (!sites.length) label(X(LONG / 2), y - 26, 'plus de site : la mutation l’a détruit', 'ax');
    });
    // On replie sur la largeur qui reste À PARTIR DE bx, pas sur toute la scène :
    // la phrase est alignée sur la barre, en retrait, et ce retrait lui manque.
    const dit = couper('Un allèle sain donne deux fragments courts, l’allèle muté un seul, long. '
      + 'C’est cette différence de LONGUEUR que le gel révèle.', cols(X0 + W - bx));
    dit.forEach((l, i) => label(bx, Y0 + H - 10 - (dit.length - 1 - i) * 14, l, 'ax start'));
  }

  // Les six bases du site, sur les deux brins, avec la coupure entre G et A.
  // La séquence est palindromique — lue dans le même sens sur les deux brins —
  // et c'est le cas de presque toutes les enzymes de restriction.
  function sequence(cx, y, sain) {
    const seq = sain ? SITE_N : SITE_M;
    const pas = 15, x0 = cx - (seq.length * pas) / 2;
    make('rect', { x: x0 - 10, y: y - 13, width: seq.length * pas + 20, height: 34, rx: 5,
      fill: 'var(--paper-2)', stroke: sain ? 'var(--sub)' : 'var(--ink-mute)', 'stroke-width': 1 }, g);
    for (let i = 0; i < seq.length; i++) {
      const b = seq[i], mute = !sain && b !== SITE_N[i];
      const x = x0 + (i + 0.5) * pas;
      [[b, y - 1], [COMPL[b], y + 13]].forEach(([lettre, yy]) => {
        const t = label(x, yy, lettre, 'ax');
        t.setAttribute('font-family', 'var(--mono)');
        if (mute) { t.setAttribute('fill', 'var(--sub)'); t.setAttribute('font-weight', '700'); }
      });
    }
    if (sain) {
      // le trait de coupure : entre le G et le A, en quinconce sur les deux brins
      make('path', { d: 'M' + (x0 + pas) + ' ' + (y - 12) + ' L' + (x0 + pas) + ' ' + (y + 3)
        + ' L' + (x0 + 5 * pas) + ' ' + (y + 3) + ' L' + (x0 + 5 * pas) + ' ' + (y + 18),
      fill: 'none', stroke: 'var(--sub)', 'stroke-width': 1.6 }, g);
      label(x0 + seq.length * pas + 18, y + 6, 'l’enzyme reconnaît, et coupe', 'ax start');
    } else {
      label(x0 + seq.length * pas + 18, y + 6, 'une base a changé : plus rien à reconnaître', 'ax start');
    }
  }

  /* ── le gel d'une famille ──────────────────────────────────────────── */
  function famille(X0, Y0, W, H) {
    label(X0, 14, W < 820 ? 'Le gel — les petits fragments vont le plus loin'
      : 'Le gel — dépôt en haut, migration vers le bas ; les petits fragments vont le plus loin', 'lab');
    const pistes = [
      { nom: 'marqueur', frs: MARQUEUR, marq: true },
      { nom: 'père', frs: fragmentsDe(gPere.value) },
      { nom: 'mère', frs: fragmentsDe(gMere.value) },
      { nom: 'enfant', frs: fragmentsDe(gEnf.value) },
      { nom: 'fœtus', frs: fragmentsDe(gFoe.value) },
    ];
    const gy = Y0 + 30, gh = H - 74;
    // 54 px réservés à gauche pour l'échelle des tailles, qui vit hors du gel.
    const pw = Math.min(120, (W - 74) / pistes.length);
    const gx = X0 + 54 + (W - 54 - pw * pistes.length) / 2;
    const d = defs();
    cuve(gx, gy, pw * pistes.length, gh, d);
    const tMax = Math.max(...MARQUEUR);
    pistes.forEach((p, i) => {
      const cx = gx + (i + 0.5) * pw;
      if (i) {
        make('line', { x1: gx + i * pw, y1: gy + 3, x2: gx + i * pw, y2: gy + gh - 3,
          stroke: pal().trait, 'stroke-width': .7, opacity: .5 }, g);
      }
      puits(cx, gy + 4, pw, gh * 0.3, d, i);
      label(cx, gy - 10, p.nom, 'pt');
      let dernier = null;
      p.frs.forEach((t) => {
        const y = gy + 16 + dist(t) * (gh - 32);
        // La sonde ne reconnaît que le fragment cherché : le marqueur, lui, n'est
        // hybridé par rien et s'efface du film.
        const revele = !sonde.value || !p.marq;
        bande(cx, y, pw, t, tMax, p.marq ? (revele ? .55 : .07) : 1);
        // Les tailles du marqueur sont écrites À CÔTÉ de la photographie, pas
        // dessus : ce sont des annotations, et sur le film la sonde a justement
        // effacé les bandes qu'elles désignent. Une graduation n’est portée que
        // si la précédente est assez loin — sur un gel court, les grandes
        // tailles se tassent et les nombres se recouvriraient.
        // En valeur absolue : le marqueur est parcouru du plus petit fragment au
        // plus grand, donc du bas du gel vers le haut, et l'écart est négatif.
        // Sans le abs, une seule graduation était écrite.
        if (p.marq && (dernier == null || Math.abs(y - dernier) > 12)) {
          label(gx - 8, y + 3.5, fr(t, 0), 'ax end');
          make('line', { x1: gx - 5, y1: y, x2: gx + 2, y2: y,
            stroke: 'var(--ink-mute)', 'stroke-width': .8 }, g);
          dernier = y;
        }
      });
    });
    const bas = label(gx + 6, gy + gh - 8, '−  dépôt', 'ax start');
    bas.setAttribute('fill', pal().texte);
    const hau = label(gx + pw * pistes.length - 6, gy + gh - 8, 'migration  +', 'ax end');
    hau.setAttribute('fill', pal().texte);
  }

  /* ── le profil d'ADN ───────────────────────────────────────────────── */
  function profil(X0, Y0, W, H) {
    label(X0, 14, 'Profil génétique — la tache de sang, puis les sept suspects', 'lab');
    const cles = Object.keys(PROFILS);
    const gy = Y0 + 30, gh = H - 68;
    const pw = Math.min(96, (W - 20) / cles.length);
    const gx = X0 + (W - pw * cles.length) / 2;
    const d = defs();
    cuve(gx, gy, pw * cles.length, gh, d);
    const tache = aplati(PROFILS.tache);
    const tMax = 6500;
    cles.forEach((k, i) => {
      const cx = gx + (i + 0.5) * pw;
      const est = k === 'tache';
      const mien = aplati(PROFILS[k]);
      const pareil = !est && memeProfil(mien, tache);
      // La piste qui correspond est éclairée, pas colorée : sur une photographie
      // on ne repeint pas une bande, on la met en lumière.
      if (est || pareil) {
        make('rect', { x: gx + i * pw + 1, y: gy + 1, width: pw - 2, height: gh - 2, rx: 4,
          fill: pal().bande, opacity: revel.value === 'uv' ? .07 : .05 }, g);
      }
      if (i) {
        make('line', { x1: gx + i * pw, y1: gy + 3, x2: gx + i * pw, y2: gy + gh - 3,
          stroke: pal().trait, 'stroke-width': .7, opacity: .5 }, g);
      }
      puits(cx, gy + 4, pw, gh * 0.26, d, 'p' + i);
      label(cx, gy - 10, est ? 'tache' : k, est || pareil ? 'tau' : 'pt');
      mien.forEach((t) => {
        const y = gy + 16 + dist(t) * (gh - 34);
        bande(cx, y, pw, t, tMax, est || pareil ? 1 : .72);
      });
      if (pareil) {
        const n = label(cx, gy + gh - 8, 'identique', 'tau');
        n.setAttribute('fill', pal().chaud);
      }
    });
  }
  const aplati = (p) => p.flat().filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => b - a);
  const memeProfil = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

  /* ── les relevés ───────────────────────────────────────────────────── */
  function releves() {
    loiR.set('d = a − b·log₁₀(taille) — l’échelle des tailles n’est donc pas régulière');
    fragR.set('allèle N : ' + FRAG.N.map((f) => fr(f, 0)).join(' + ') + ' pb   ·   '
      + 'allèle m : ' + FRAG.m.map((f) => fr(f, 0)).join(' + ') + ' pb');

    const lire = (g) => (g === 'NN' ? '2 bandes (2 200 et 3 800) → N//N'
      : g === 'mm' ? '1 bande (6 000) → m//m' : '3 bandes → N//m, porteur sain');
    lectR.set('fœtus : ' + lire(gFoe.value));
    // Un enfant reçoit un allèle de chaque parent : tout n'est pas possible.
    const alleles = (g) => (g === 'NN' ? ['N', 'N'] : g === 'mm' ? ['m', 'm'] : ['N', 'm']);
    const possible = (enf) => {
      const [p1, p2] = alleles(gPere.value), [m1, m2] = alleles(gMere.value);
      const combos = new Set();
      [p1, p2].forEach((a) => [m1, m2].forEach((b) => combos.add([a, b].sort().join(''))));
      return combos.has(alleles(enf).sort().join(''));
    };
    const mauvais = [['l’enfant', gEnf.value], ['le fœtus', gFoe.value]]
      .filter(([, g]) => !possible(g)).map(([n]) => n);
    coherR.set(mauvais.length
      ? mauvais.join(' et ') + ' : ce génotype ne peut pas venir de ces deux parents'
      : 'tout est compatible avec les génotypes des parents');

    const tache = aplati(PROFILS.tache);
    const corresp = Object.keys(PROFILS).filter((k) => k !== 'tache' && memeProfil(aplati(PROFILS[k]), tache));
    susR.set(corresp.length ? corresp.join(', ') + ' — profil identique en tout point'
      : 'aucun des sept');
    detR.set('Les autres partagent des bandes avec la tache, parfois beaucoup — mais il suffit '
      + 'd’UNE bande différente pour écarter quelqu’un.');
  }

  // Les titres et les phrases sont repliés sur la largeur réellement offerte :
  // écrits d’un trait ils sortaient du cadre sous 1 100 px.
  function couper(texte, n) {
    const mots = texte.split(' '), out = []; let l = '';
    for (const m of mots) {
      if ((l + ' ' + m).trim().length > n) { out.push(l.trim()); l = m; } else l += ' ' + m;
    }
    if (l.trim()) out.push(l.trim());
    return out;
  }
  const cols = (W) => Math.max(26, Math.floor(W / 6.6));
  function label(x, y, txt, cls) {
    const t = make('text', { x, y }, g);
    const c = cls || 'ax';
    t.setAttribute('class', c);
    const a = /\bend\b/.test(c) ? 'end' : /\bstart\b/.test(c) ? 'start'
      : /\b(pt|tau)\b/.test(c) ? 'middle' : null;
    if (a) t.setAttribute('text-anchor', a);
    t.textContent = txt;
    return t;
  }

  [vue, revel, gPere, gMere, gEnf, gFoe].forEach((s) => s.el.addEventListener('change', paint));
  sonde.el.addEventListener('change', paint);
  lab.onResize(paint);
  paint();
}
