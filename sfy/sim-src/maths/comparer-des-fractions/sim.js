// Comparer deux fractions.
//
// Une fraction n'est pas deux nombres empilés : c'est une part d'une barre. Tant
// qu'on la voit comme 3 et 4, « 3/4 contre 2/3 » est un problème de calcul ;
// quand on la voit comme une longueur, c'est un problème de regard, et l'enfant
// répond avant l'adulte.
//
// D'où le parti pris de cette page : on ne tape aucun nombre. On clique sur les
// parts pour les colorier, et les deux barres, posées l'une sous l'autre et
// exactement de la même longueur, répondent toutes seules. La ligne graduée en
// dessous fait le lien avec le nombre — chaque fraction est un point, et
// comparer deux fractions, c'est regarder lequel est le plus à droite.

export function mount(lab) {
  const { fr } = lab;
  const svg = lab.svg();

  const nA = lab.slider({ label: 'Parts de la barre bleue', min: 1, max: 12, step: 1, value: 4,
    dec: 0, onInput: () => { kA = Math.min(kA, nA.value); dessine(); } });
  const nB = lab.slider({ label: 'Parts de la barre orange', min: 1, max: 12, step: 1, value: 3,
    dec: 0, onInput: () => { kB = Math.min(kB, nB.value); dessine(); } });
  const vLigne = lab.check({ label: 'Montrer la ligne des nombres', value: true, onChange: dessine });

  let kA = 3, kB = 2;

  const texte = (v) => (v == null ? '—' : String(v));
  const rA = lab.readout({ label: 'Barre bleue', format: texte, hi: true });
  const rB = lab.readout({ label: 'Barre orange', format: texte, hi: true });
  const rCmp = lab.readout({ label: 'Alors ?', format: texte });

  const mk = (t, a, p) => lab.make(t, a, p);
  function txt(p, x, y, s, a = {}) {
    const t = mk('text', { x, y, 'font-size': a.fs || 15, fill: a.fill || 'var(--ink)',
      'text-anchor': a.anchor || 'middle', 'font-weight': a.bold ? 600 : 400,
      'font-family': a.mono ? 'var(--mono)' : 'inherit',
      'paint-order': a.halo ? 'stroke' : null, stroke: a.halo ? 'var(--paper)' : null,
      'stroke-width': a.halo ? 3.6 : null, 'stroke-linejoin': a.halo ? 'round' : null }, p);
    t.textContent = s;
    return t;
  }
  // Une fraction s'écrit avec une barre horizontale, pas avec une barre oblique :
  // c'est ainsi qu'elle est écrite au tableau, et c'est ainsi qu'on la lit.
  function fraction(g, x, y, k, n, col, taille) {
    txt(g, x, y - taille * 0.22, String(k), { fs: taille, bold: true, mono: true, fill: col });
    mk('line', { x1: x - taille * 0.42, y1: y + taille * 0.08, x2: x + taille * 0.42, y2: y + taille * 0.08,
      stroke: col, 'stroke-width': Math.max(2, taille * 0.07), 'stroke-linecap': 'round' }, g);
    txt(g, x, y + taille * 0.92, String(n), { fs: taille, bold: true, mono: true, fill: col });
  }

  let zones = [];

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    zones = [];
    const { w: W, h: H } = lab.size();
    const g = mk('g', {}, svg);
    const BLEU = 'var(--sub)', ORANGE = '#c9772b';

    const fsT = Math.max(16, Math.min(26, W / 30));
    txt(g, W / 2, 14 + fsT, 'Clique sur les parts pour les colorier',
      { fs: fsT, bold: true });
    const haut = 26 + fsT;

    const hLigne = vLigne.value ? 92 : 0;
    const dispo = H - haut - hLigne - 10;
    const hBarre = Math.min(66, dispo * 0.3);
    const gauche = Math.min(96, W * 0.13);
    const L = gauche, R = W - 24;

    // Les deux barres ont EXACTEMENT la même longueur. C'est la condition pour
    // que la comparaison veuille dire quelque chose : deux fractions ne se
    // comparent que si l'unité est la même.
    const y1 = haut + dispo * 0.16;
    const y2 = haut + dispo * 0.62;
    barre(g, L, R, y1, hBarre, kA, Math.round(nA.value), BLEU, 'A');
    barre(g, L, R, y2, hBarre, kB, Math.round(nB.value), ORANGE, 'B');

    const vA = kA / nA.value, vB = kB / nB.value;
    const fsF = Math.min(30, hBarre * 0.52);
    fraction(g, L - 44, y1 + hBarre / 2 - fsF * 0.35, kA, Math.round(nA.value), BLEU, fsF);
    fraction(g, L - 44, y2 + hBarre / 2 - fsF * 0.35, kB, Math.round(nB.value), ORANGE, fsF);

    // le verdict, écrit gros entre les deux barres
    const egal = Math.abs(vA - vB) < 1e-9;
    const mot = egal ? 'les deux sont ÉGALES'
      : vA > vB ? 'la bleue est plus grande' : 'l’orange est plus grande';
    const signe = egal ? '=' : vA > vB ? '>' : '<';
    txt(g, (L + R) / 2, (y1 + hBarre + y2) / 2 + 6, mot,
      { fs: Math.max(14, Math.min(20, W / 42)), bold: true,
        fill: egal ? '#2a9d8f' : 'var(--ink-soft)', halo: true });

    if (vLigne.value) ligne(g, L, R, H - hLigne + 20, vA, vB, egal);

    rA.set(kA + ' sur ' + Math.round(nA.value) + '   =   ' + fr(vA, 3));
    rB.set(kB + ' sur ' + Math.round(nB.value) + '   =   ' + fr(vB, 3));
    rCmp.set(kA + '/' + Math.round(nA.value) + '  ' + signe + '  ' + kB + '/' + Math.round(nB.value)
      + (egal ? '   (fractions égales)' : ''));
  }

  /* Une barre, ses parts, et les zones cliquables. Cliquer la part numéro i
     colorie jusqu'à elle ; recliquer la dernière coloriée l'enlève. On ne peut
     donc jamais fabriquer une figure trouée — une fraction, c'est une part
     d'un seul tenant. */
  function barre(g, L, R, y, h, k, n, col, quel) {
    const w = (R - L) / n;
    for (let i = 0; i < n; i++) {
      const x = L + i * w;
      const plein = i < k;
      const r = mk('rect', { x, y, width: w, height: h,
        fill: plein ? col : 'var(--paper-2)', 'fill-opacity': plein ? 0.88 : 1,
        stroke: col, 'stroke-width': 2, cursor: 'pointer' }, g);
      zones.push({ el: r, quel, i });
    }
    mk('rect', { x: L, y, width: R - L, height: h, fill: 'none',
      stroke: col, 'stroke-width': 3.4, rx: 3 }, g);
  }

  function ligne(g, L, R, y, vA, vB, egal) {
    const X = (v) => L + v * (R - L);
    mk('line', { x1: L, y1: y, x2: R, y2: y, stroke: 'var(--ink-soft)', 'stroke-width': 2.4 }, g);
    [[0, '0'], [0.5, '½'], [1, '1']].forEach(([v, s]) => {
      mk('line', { x1: X(v), y1: y - 9, x2: X(v), y2: y + 9, stroke: 'var(--ink-soft)', 'stroke-width': 2 }, g);
      txt(g, X(v), y + 28, s, { fs: 15, bold: true, fill: 'var(--ink-soft)' });
    });
    const pose = (v, col, dy) => {
      mk('circle', { cx: X(v), cy: y, r: 8, fill: col, stroke: 'var(--paper)', 'stroke-width': 2.4 }, g);
      mk('line', { x1: X(v), y1: y, x2: X(v), y2: y + dy, stroke: col, 'stroke-width': 2 }, g);
    };
    // si les deux points se superposent, un seul cercle suffit et le dire vaut
    // mieux que d'empiler deux pastilles au même endroit
    if (egal) {
      pose(vA, '#2a9d8f', -22);
      // le point peut tomber sur le 1, tout au bord : l'étiquette recule alors
      // au lieu de sortir de la scène
      const demi = 44;
      txt(g, Math.max(L + demi, Math.min(R - demi, X(vA))), y - 28, 'les deux ici',
        { fs: 14, bold: true, fill: '#2a9d8f', halo: true });
    } else {
      pose(vA, 'var(--sub)', -22);
      pose(vB, '#c9772b', -22);
    }
  }

  /* ── colorier au clic ─────────────────────────────────────────────────── */
  const onClick = (e) => {
    const z = zones.find((q) => q.el === e.target);
    if (!z) return;
    if (z.quel === 'A') kA = kA === z.i + 1 ? z.i : z.i + 1;
    else kB = kB === z.i + 1 ? z.i : z.i + 1;
    dessine();
  };
  svg.addEventListener('click', onClick);
  lab.onDestroy(() => svg.removeEventListener('click', onClick));

  lab.onResize(dessine);
  dessine();
}
