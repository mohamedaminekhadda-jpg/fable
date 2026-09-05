// La non-disjonction
//
// « L'origine de cette trisomie est une fécondation entre un gamète possédant un
// chromosome 21 et un gamète possédant deux chromosomes 21 », dit le cours. Reste
// à savoir d'où sort un gamète à deux chromosomes 21. C'est ici.
//
// Une paire est suivie à travers les deux divisions de la méiose. On peut faire
// rater la séparation à la première division ou à la seconde, et la différence
// n'est pas de détail :
//
//   • ratée en division I, les deux HOMOLOGUES partent ensemble : les quatre
//     gamètes sont anormaux — deux à n+1, deux à n−1.
//   • ratée en division II, ce sont deux CHROMATIDES sœurs qui partent
//     ensemble : la moitié seulement des gamètes est touchée — deux normaux,
//     un à n+1, un à n−1.
//
// Rien n'est écrit d'avance : les gamètes sont comptés à partir de ce que la
// division a fait, et le zygote est nommé à partir de ce qu'il a reçu.

const PAIRES = {
  a21: { nom: 'la paire 21, chez la mère', parent: 'mère', etiq: ['21', '21'], type: 'auto' },
  mXX: { nom: 'les chromosomes X, chez la mère', parent: 'mère', etiq: ['X', 'X'], type: 'XX' },
  pXY: { nom: 'X et Y, chez le père', parent: 'père', etiq: ['X', 'Y'], type: 'XY' },
};

export function mount(lab) {
  const { make, fr } = lab;

  lab.group('L’accident');
  const quelle = lab.select({
    label: 'On suit', value: 'a21',
    options: Object.keys(PAIRES).map((k) => ({ value: k, label: PAIRES[k].nom })),
  });
  const quand = lab.select({
    label: 'La séparation rate', value: 'I',
    options: [
      { value: 'non', label: 'nulle part — méiose normale' },
      { value: 'I', label: 'à la première division (les homologues)' },
      { value: 'II', label: 'à la seconde division (les chromatides)' },
    ],
  });
  // En division II, une seule des deux cellules filles se trompe — et quand les
  // deux ne portent pas le même chromosome (X d'un côté, Y de l'autre), le
  // syndrome obtenu n'est pas le même. C'est par là qu'arrive la disomie Y.
  const cellule2 = lab.select({
    label: 'La cellule qui se trompe', value: 'A',
    options: [{ value: 'A', label: 'celle qui porte le premier' },
      { value: 'B', label: 'celle qui porte le second' }],
  });
  lab.group('L’autre parent');
  // Le gamète fécondant n'est pas toujours le même : un ovule XX donne un triplo
  // X avec un spermatozoïde X, mais un Klinefelter avec un spermatozoïde Y.
  const apport = lab.select({
    label: 'Son gamète apporte', value: 'X',
    options: [{ value: 'X', label: 'un X' }, { value: 'Y', label: 'un Y' }],
  });
  lab.group('Où l’on en est');
  const etape = lab.slider({ label: 'Étape', min: 0, max: 4, step: 1, value: 4, dec: 0 });

  /* ── mesures ───────────────────────────────────────────────────────── */
  const etapeR = lab.readout({ label: 'étape', format: (s) => s || '—' });
  const gamR = lab.readout({ label: 'les quatre gamètes', format: (s) => s || '—', hi: true });
  const propR = lab.readout({ label: 'proportion anormale', format: (s) => s || '—' });
  const zygR = lab.readout({ label: 'après fécondation', format: (s) => s || '—', hi: true });
  const nomR = lab.readout({ label: 'ce que cela donne', format: (s) => s || '—' });
  const clefR = lab.readout({ label: 'la différence entre I et II', format: (s) => s || '—' });

  /* ── ce que produit la méiose ──────────────────────────────────────── */
  // Chaque gamète est décrit par la liste des chromosomes qu'il emporte.
  function gametes() {
    const p = PAIRES[quelle.value], [A, B] = p.etiq;
    if (quand.value === 'non') return [[A], [A], [B], [B]];
    // En I, les deux homologues vont du même côté : deux cellules filles ont
    // tout, deux n'ont rien. Chaque chromatide donne ensuite un gamète.
    if (quand.value === 'I') return [[A, B], [A, B], [], []];
    // En II, l'accident ne touche qu'UNE des deux cellules filles ; l'autre
    // divise normalement. Laquelle se trompe change tout quand les deux ne
    // portent pas le même chromosome.
    return cellule2.value === 'A' ? [[A, A], [], [B], [B]] : [[A], [A], [B, B], []];
  }

  const NOMS = {
    // troisième élément : le nom court, pour le schéma. Les noms complets
    // débordaient de leur colonne dès que la scène rétrécissait.
    auto: { 3: ['Trisomie 21 — syndrome de Down', '47, XX ou XY, +21', 'trisomie 21'],
      1: ['Monosomie 21', '45, −21 — non viable', 'monosomie 21'] },
  };

  function zygotes() {
    const p = PAIRES[quelle.value];
    const g = gametes();
    // Le gamète de l'autre parent est normal, mais pas toujours le même : un
    // père donne un X ou un Y, et cela décide du syndrome.
    const autre = p.type === 'auto' ? ['21']
      : p.parent === 'mère' ? [apport.value]        // le spermatozoïde
        : ['X'];                                    // l'ovule apporte toujours un X
    return g.map((gam) => {
      const z = gam.concat(autre).slice().sort();
      return { gam, z, nom: nommer(p, z) };
    });
  }

  function nommer(p, z) {
    if (p.type === 'auto') {
      const n = z.length;
      if (n === 2) return ['normal', '46, XX ou XY', 'normal'];
      if (n === 3) return NOMS.auto[3];
      if (n === 1) return NOMS.auto[1];
      return ['déséquilibre majeur', 'non viable', 'non viable'];
    }
    const x = z.filter((c) => c === 'X').length, y = z.filter((c) => c === 'Y').length;
    const f = (x ? 'X'.repeat(x) : '') + (y ? 'Y'.repeat(y) : '');
    if (f === 'XX') return ['fille normale', '46, XX', 'fille'];
    if (f === 'XY') return ['garçon normal', '46, XY', 'garçon'];
    if (f === 'X') return ['Syndrome de Turner', '45, X — stérilité, petite taille', 'Turner'];
    if (f === 'XXY') return ['Syndrome de Klinefelter', '47, XXY — masculin, infertile', 'Klinefelter'];
    if (f === 'XXX') return ['Triplo X', '47, XXX — souvent inaperçu', 'triplo X'];
    if (f === 'XYY') return ['Disomie Y', '47, XYY', 'disomie Y'];
    if (f === 'Y' || f === '') return ['aucun X', 'non viable — le X porte des gènes vitaux', 'sans X'];
    return ['caryotype ' + f, '—', f];
  }

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  const PAD = { l: 20, r: 18, t: 30, b: 18 };
  const COL = { A: 'var(--sub)', B: 'var(--ink-soft)' };

  const ETAPES = [
    'La cellule mère : la paire, chaque chromosome déjà dupliqué en deux chromatides',
    'Première division : les deux homologues se séparent… ou non',
    'Deux cellules filles',
    'Seconde division : les chromatides sœurs se séparent… ou non',
    'Les quatre gamètes, puis la fécondation',
  ];

  function paint() {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    const W = w - PAD.l - PAD.r, H = h - PAD.t - PAD.b;
    const e = Math.round(etape.value);
    const p = PAIRES[quelle.value], [A, B] = p.etiq;
    // Le choix de la cellule ne se pose qu'en division II, et il ne change
    // quelque chose que si les deux filles ne portent pas le même chromosome.
    cellule2.row.hidden = quand.value !== 'II' || p.etiq[0] === p.etiq[1];
    // Et le gamète de l'autre parent n'a le choix que si c'est un spermatozoïde
    // sur une paire sexuelle : un ovule apporte toujours un X.
    apport.row.hidden = p.type === 'auto' || p.parent === 'père';
    label(PAD.l, 14, ETAPES[e], 'lab');

    const cy = PAD.t + H * 0.34, R = Math.min(60, H * 0.15, W * 0.09);
    const CX = PAD.l + W / 2;

    if (e === 0) {
      cellule(CX, cy, R * 1.5, [{ e: A, c: 'A', d: true }, { e: B, c: 'B', d: true }]);
    } else if (e === 1) {
      // anaphase I : où vont les homologues ?
      const ens = quand.value === 'I';
      cellule(CX, cy, R * 1.9,
        ens ? [] : [{ e: A, c: 'A', d: true, dx: -R }, { e: B, c: 'B', d: true, dx: R }],
        ens ? [{ e: A, c: 'A', d: true, dx: -R * 0.35 }, { e: B, c: 'B', d: true, dx: R * 0.35 }] : [],
        ens ? -R * 0.9 : 0);
      if (ens) fleche(CX, cy + R * 1.9 + 16, 'les deux partent du même côté');
    } else if (e === 2) {
      const ens = quand.value === 'I';
      const g1 = ens ? [{ e: A, c: 'A', d: true }, { e: B, c: 'B', d: true }] : [{ e: A, c: 'A', d: true }];
      const g2 = ens ? [] : [{ e: B, c: 'B', d: true }];
      cellule(CX - W * 0.18, cy, R * 1.4, g1);
      cellule(CX + W * 0.18, cy, R * 1.4, g2);
      if (ens) label(CX + W * 0.18, cy + R * 1.4 + 20, 'aucun chromosome', 'ax');
    } else {
      // étapes 3 et 4 : les quatre gamètes alignés
      const gs = gametes();
      const pas = W / 4.6;
      gs.forEach((gam, i) => {
        const x = PAD.l + W * 0.1 + i * pas;
        cellule(x, cy, R * 0.95, gam.map((et) => ({ e: et, c: et === A ? 'A' : 'B', d: false })));
        label(x, cy + R * 0.95 + 18, gam.length ? 'n' + (gam.length > 1 ? '+' + (gam.length - 1) : '')
          : 'n−1', 'pt');
      });
      if (e === 4) {
        const zs = zygotes(), yz = cy + R * 0.95 + 62;
        if (yz + R * 1.2 < PAD.t + H) {
          label(PAD.l, yz - 22, 'Fécondation par un gamète normal de l’autre parent', 'lab');
          zs.forEach((z, i) => {
            const x = PAD.l + W * 0.1 + i * pas;
            cellule(x, yz + R * 0.5, R * 0.95,
              z.z.map((et) => ({ e: et, c: et === A ? 'A' : 'B', d: false })), [], 0, true);
            label(x, yz + R * 0.5 + R * 0.95 + 16, z.nom[2] || z.nom[0], 'tau');
          });
        }
      }
    }
    releves();
  }

  // Une cellule et ce qu'elle contient. `d` : chromosome encore dupliqué.
  function cellule(cx, cy, r, dedans, aussi = [], decal = 0, zyg = false) {
    make('circle', { cx, cy, r, fill: 'var(--paper-2)', stroke: 'var(--ink-mute)',
      'stroke-width': zyg ? 2 : 1.3, 'stroke-dasharray': zyg ? null : '4 3' }, g);
    const tous = dedans.concat(aussi);
    tous.forEach((o, i) => {
      const n = tous.length;
      const x = cx + (o.dx != null ? o.dx : (n === 1 ? 0 : (i - (n - 1) / 2) * r * 0.62)) + decal;
      chromosome(x, cy, r * 0.62, o.e, COL[o.c], o.d);
    });
    if (!tous.length) label(cx, cy + 4, '∅', 'tau');
  }

  function chromosome(x, y, L, etiq, col, duplique) {
    const lg = Math.max(3, L * 0.13);
    const dessine = (dx) => {
      make('rect', { x: x + dx - lg, y: y - L / 2, width: 2 * lg, height: L * 0.44, rx: lg * 0.8,
        fill: col, opacity: .85 }, g);
      make('rect', { x: x + dx - lg, y: y + L * 0.04, width: 2 * lg, height: L * 0.46, rx: lg * 0.8,
        fill: col, opacity: .85 }, g);
    };
    if (duplique) { dessine(-lg * 1.1); dessine(lg * 1.1); } else dessine(0);
    label(x, y + L / 2 + 12, etiq, 'ax');
  }

  function fleche(x, y, txt) { label(x, y, txt, 'tau'); }

  function releves() {
    const e = Math.round(etape.value);
    etapeR.set((e + 1) + ' sur 5 — ' + ETAPES[e]);
    const gs = gametes();
    const p = PAIRES[quelle.value];
    const normalN = 1;
    const anormaux = gs.filter((x) => x.length !== normalN).length;
    gamR.set(gs.map((x) => (x.length ? x.join(' + ') : '∅')).join('   |   '));
    propR.set(anormaux + ' sur 4'
      + (quand.value === 'non' ? '  — tout s’est bien passé'
        : quand.value === 'I' ? '  — en division I, aucun gamète n’échappe à l’accident'
          : '  — en division II, une seule des deux cellules filles est touchée'));
    const zs = zygotes();
    zygR.set(zs.map((z) => z.nom[0]).join('   |   '));
    nomR.set([...new Set(zs.filter((z) => !/normal/.test(z.nom[0]))
      .map((z) => z.nom[0] + ' (' + z.nom[1] + ')'))].join('   ·   ') || 'que des zygotes normaux');
    clefR.set(quand.value === 'non' ? '—'
      : quand.value === 'I' ? 'Les deux HOMOLOGUES partent ensemble : les 4 gamètes sont touchés.'
        : 'Deux CHROMATIDES sœurs partent ensemble : seule la moitié des gamètes l’est.');
  }

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

  [quelle, quand, cellule2, apport].forEach((s) => s.el.addEventListener('change', paint));
  etape.el.addEventListener('input', paint);
  lab.onResize(paint);
  paint();
}
