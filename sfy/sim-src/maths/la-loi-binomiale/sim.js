// La loi binomiale — la loi, et l'expérience qui la retrouve.
//
// Un histogramme de probabilités théoriques est un objet muet : il a toujours
// raison, et rien ne le met à l'épreuve. Ici on peut LANCER l'expérience. Les
// bâtons pleins sont la loi ; les traits qui s'y superposent sont les fréquences
// observées sur les tirages qu'on vient de faire. On lance mille fois, puis
// encore mille, et l'on voit les seconds se coucher sur les premiers.
//
// Le tirage est pseudo-aléatoire à graine explicite. Ce n'est pas un détail
// technique : cela rend une série REPRODUCTIBLE, donc vérifiable — et cela
// permet de montrer que deux graines différentes donnent deux histogrammes
// différents qui convergent tous deux vers la même loi. C'est exactement ce que
// dit la loi des grands nombres, et c'est ce qu'un tirage non reproductible ne
// permet pas de faire voir.

export function mount(lab) {
  const { fr } = lab;
  const svg = lab.svg();

  const sN = lab.slider({ label: 'n, nombre de répétitions', min: 1, max: 100, step: 1, value: 20,
    dec: 0, onInput: () => { vide(); dessine(); } });
  const sP = lab.slider({ label: 'p, probabilité de succès', min: 0, max: 1, step: 0.005, value: 0.35,
    dec: 3, onInput: () => { vide(); dessine(); } });
  const sK = lab.slider({ label: 'k', min: 0, max: 20, step: 1, value: 7, dec: 0, onInput: dessine });
  const cumul = lab.check({ label: 'Montrer P(X ≤ k) en escalier', value: false, onChange: dessine });
  const sGraine = lab.slider({ label: 'Graine du tirage', min: 1, max: 999, step: 1, value: 42, dec: 0,
    onInput: () => { vide(); dessine(); } });

  lab.buttons([
    { label: '+ 1 000 tirages', onClick: () => { tire(1000); dessine(); } },
    { label: '+ 10 000', onClick: () => { tire(10000); dessine(); } },
    { label: 'Effacer', onClick: () => { vide(); dessine(); } },
  ]);

  const texte = (v) => (v == null ? '—' : String(v));
  lab.group('La loi');
  const rPk = lab.readout({ label: 'P(X = k)', format: texte, hi: true });
  const rPle = lab.readout({ label: 'P(X ≤ k)', format: texte });
  const rE = lab.readout({ label: 'E(X) = n p', format: texte });
  const rV = lab.readout({ label: 'V(X) = n p (1 − p)', format: texte });
  const rS = lab.readout({ label: 'écart-type σ', format: texte });
  const rMode = lab.readout({ label: 'valeur la plus probable', format: texte });
  lab.group('L’expérience');
  const rNb = lab.readout({ label: 'tirages effectués', dec: 0, hi: true });
  const rMoy = lab.readout({ label: 'moyenne observée', format: texte });
  const rEcart = lab.readout({ label: 'écart-type observé', format: texte });
  const rFk = lab.readout({ label: 'fréquence de k', format: texte });

  /* ── la loi ────────────────────────────────────────────────────────────
     ln C(n,k) est accumulé terme à terme : pour n = 100, C(100,50) vaut 10²⁹ et
     dépasse ce qu'un entier de JavaScript représente exactement. En passant par
     les logarithmes, la probabilité reste juste jusqu'à la dernière décimale
     affichée. */
  function loi(n, p) {
    const P = new Array(n + 1).fill(0);
    if (p <= 0) { P[0] = 1; return P; }
    if (p >= 1) { P[n] = 1; return P; }
    const lp = Math.log(p), lq = Math.log(1 - p);
    let lnC = 0;
    for (let k = 0; k <= n; k++) {
      if (k > 0) lnC += Math.log((n - k + 1) / k);
      P[k] = Math.exp(lnC + k * lp + (n - k) * lq);
    }
    return P;
  }

  /* ── le tirage, à graine explicite ────────────────────────────────────
     Un générateur congruentiel : la même graine redonne exactement la même
     série. Math.random() ne le permettrait pas, et une expérience qu'on ne peut
     pas refaire à l'identique ne se vérifie pas. */
  /* Le générateur doit rester dans les entiers EXACTS de JavaScript. Ma première
     version était le congruentiel classique, `etat * 1103515245 + 12345` modulo
     2³¹ — et elle était fausse : ce produit atteint 2⁶¹, très au-delà de 2⁵³ où
     les entiers cessent d'être exacts. Les bits perdus sont justement les bits de
     poids faible, c'est-à-dire ceux dont le modulo dépend. Résultat : un tirage
     biaisé, et une moyenne observée à onze écarts-types de n p après vingt mille
     tirages — la page démontrait le contraire de la loi des grands nombres.

     Celui-ci (mulberry32) n'emploie que des opérations 32 bits — `Math.imul`,
     décalages, ou exclusif — qui sont exactes par construction. Même graine,
     même série, et une moyenne qui converge pour de bon. */
  let etat = 42;
  const alea = () => {
    etat = (etat + 0x6d2b79f5) | 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let effectifs = [], total = 0, sommeX = 0, sommeX2 = 0, moyennes = [];

  function vide() {
    const n = Math.round(sN.value);
    sK.el.max = n;
    if (sK.value > n) sK.set(n);
    effectifs = new Array(n + 1).fill(0);
    total = 0; sommeX = 0; sommeX2 = 0; moyennes = [];
    etat = Math.round(sGraine.value);
  }

  function tire(combien) {
    const n = Math.round(sN.value), p = sP.value;
    if (!effectifs.length) vide();
    for (let i = 0; i < combien; i++) {
      let s = 0;
      for (let j = 0; j < n; j++) if (alea() < p) s++;
      effectifs[s]++; total++; sommeX += s; sommeX2 += s * s;
      // on ne garde qu'un point tous les dix pour la courbe : mille points
      // suffisent à montrer une convergence, dix mille alourdissent sans rien
      // ajouter
      if (total % Math.max(1, Math.floor(total / 400) + 1) === 0 || total < 40) {
        moyennes.push([total, sommeX / total]);
      }
    }
  }

  const mk = (t, a, p) => lab.make(t, a, p);
  function txt(p, x, y, s, a = {}) {
    const t = mk('text', { x, y, 'font-size': a.fs || 11, fill: a.fill || 'var(--ink)',
      'text-anchor': a.anchor || 'start', 'font-weight': a.bold ? 600 : 400,
      'font-family': a.mono ? 'var(--mono)' : 'inherit', opacity: a.op != null ? a.op : 1,
      'paint-order': a.halo ? 'stroke' : null, stroke: a.halo ? 'var(--paper)' : null,
      'stroke-width': a.halo ? 3 : null, 'stroke-linejoin': a.halo ? 'round' : null }, p);
    t.textContent = s;
    return t;
  }
  function joliPas(span, cible) {
    const brut = span / Math.max(1, cible);
    const q = Math.pow(10, Math.floor(Math.log10(brut) || 0));
    const k = brut / q;
    return (k <= 1 ? 1 : k <= 2 ? 2 : k <= 5 ? 5 : 10) * q;
  }

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const { w: W, h: H } = lab.size();
    const n = Math.round(sN.value), p = sP.value, k = Math.round(sK.value);
    if (sK.el.max !== String(n)) sK.el.max = n;
    const P = loi(n, p);

    const fsT = Math.max(12, Math.min(16, W / 46));
    txt(svg, 10, 8 + fsT, 'X suit la loi binomiale B(' + n + ' ; ' + fr(p, 3) + ')',
      { fs: fsT, bold: true, mono: true });
    txt(svg, 10, 10 + fsT * 2, total
      ? fr(total, 0) + ' tirages effectués — les traits clairs sont les fréquences observées'
      : 'Appuyez sur « + 1 000 tirages » : les fréquences observées viendront se poser sur la loi.',
      { fs: 10.5, fill: 'var(--ink-soft)' });
    const haut = 18 + fsT * 2;

    const gap = 12;
    const hBas = total ? Math.min(150, (H - haut) * 0.32) : 0;
    const boxA = { x: 8, y: haut, w: W - 16, h: H - haut - 8 - (total ? hBas + gap : 0) };
    batons(boxA, n, p, P, k);
    if (total) convergence({ x: 8, y: boxA.y + boxA.h + gap, w: W - 16, h: hBas }, n, p);

    /* ── mesures ── */
    const E = n * p, V = n * p * (1 - p);
    rPk.set(fr(P[k], 6));
    rPle.set(fr(P.slice(0, k + 1).reduce((s, v) => s + v, 0), 6));
    rE.set(fr(E, 4));
    rV.set(fr(V, 4));
    rS.set(fr(Math.sqrt(V), 4));
    // le mode est CHERCHÉ dans la loi, jamais donné par une formule approchée
    let best = 0;
    P.forEach((v, i) => { if (v > P[best]) best = i; });
    rMode.set('k = ' + best + '   avec P = ' + fr(P[best], 5));
    rNb.set(total);
    if (total) {
      const m = sommeX / total;
      const v = sommeX2 / total - m * m;
      rMoy.set(fr(m, 4) + '   (écart à n p : ' + fr(m - E, 4) + ')');
      rEcart.set(fr(Math.sqrt(Math.max(0, v)), 4));
      rFk.set(fr(effectifs[k] / total, 5) + '   contre ' + fr(P[k], 5) + ' en théorie');
    } else { rMoy.set(null); rEcart.set(null); rFk.set(null); }
  }

  /* ── les bâtons ───────────────────────────────────────────────────────── */
  function batons(box, n, p, P, k) {
    const G = { l: 46, r: 12, t: 12, b: 26 };
    const L = box.x + G.l, R = box.x + box.w - G.r;
    const T = box.y + G.t, B = box.y + box.h - G.b;
    const g = mk('g', {}, svg);
    mk('rect', { x: L, y: T, width: R - L, height: B - T, fill: 'var(--paper)',
      stroke: 'var(--rule)', 'stroke-width': 1 }, g);

    const freq = total ? effectifs.map((e) => e / total) : [];
    const hi = Math.max(...P, ...(freq.length ? freq : [0])) * 1.12 || 1;
    const X = (i) => L + ((i + 0.5) / (n + 1)) * (R - L);
    const larg = Math.max(1.5, ((R - L) / (n + 1)) * 0.66);
    const Y = (v) => B - (v / hi) * (B - T);

    const py = joliPas(hi, 4);
    const dec = Math.max(0, -Math.floor(Math.log10(py) + 1e-9));
    for (let v = 0; v <= hi + 1e-9; v += py) {
      mk('line', { x1: L, y1: Y(v), x2: R, y2: Y(v), stroke: 'var(--rule)', 'stroke-width': 1, opacity: 0.4 }, g);
      txt(g, L - 5, Y(v) + 3.5, fr(v, dec), { fs: 9, anchor: 'end', mono: true, fill: 'var(--ink-soft)' });
    }

    P.forEach((v, i) => {
      const sel = i === k;
      mk('rect', { x: X(i) - larg / 2, y: Y(v), width: larg, height: B - Y(v),
        fill: sel ? 'var(--sub)' : 'var(--sub)', 'fill-opacity': sel ? 1 : 0.42,
        stroke: sel ? 'var(--ink)' : 'none', 'stroke-width': sel ? 1.4 : 0 }, g);
    });
    // les fréquences observées, en trait horizontal au sommet de chaque bâton :
    // superposées, elles se comparent sans se cacher
    freq.forEach((v, i) => {
      if (!v) return;
      mk('line', { x1: X(i) - larg * 0.62, y1: Y(v), x2: X(i) + larg * 0.62, y2: Y(v),
        stroke: '#c9772b', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g);
    });

    if (cumul.value) {
      // L'escalier de la fonction de répartition, sur sa propre échelle : de 0
      // en bas du cadre à 1 en haut. Il ne partage pas l'axe des bâtons, dont le
      // maximum n'est pas 1 — les mêmes pixels servent donc deux graduations,
      // et c'est dit dans l'étiquette.
      let cc = 0;
      let d = '';
      P.forEach((v, i) => {
        cc += v;
        const yy = B - cc * (B - T);
        d += (i ? 'L' + (X(i) - larg / 2) + ' ' + yy : 'M' + (X(i) - larg / 2) + ' ' + B)
          + 'L' + (X(i) + larg / 2) + ' ' + yy;
      });
      mk('path', { d, fill: 'none', stroke: '#7b5ea7', 'stroke-width': 1.8, opacity: 0.9 }, g);
      // en bas du cadre, et non en haut : l'étiquette de E(X) occupe déjà cette
      // ligne, et les deux se croisaient dès que l'espérance passait à droite
      txt(g, R - 5, B - 7, 'P(X ≤ k) — de 0 en bas à 1 en haut',
        { fs: 9.5, anchor: 'end', fill: '#7b5ea7', halo: true });
    }

    /* L'espérance, en pointillé : le centre de gravité de l'histogramme. Quand
       p vaut 1 elle tombe sur le dernier bâton, donc au bord droit du cadre, et
       l'étiquette y débordait — elle passe alors de l'autre côté du trait. */
    const xe = X(n * p - 0.5);
    mk('line', { x1: xe, y1: T, x2: xe, y2: B, stroke: '#2a9d8f',
      'stroke-width': 1.6, 'stroke-dasharray': '5 4' }, g);
    const aDroite = xe < R - 92;
    txt(g, xe + (aDroite ? 4 : -4), T + 13, 'E(X) = ' + fr(n * p, 2),
      { fs: 9.5, bold: true, fill: '#2a9d8f', halo: true, anchor: aDroite ? 'start' : 'end' });

    // les graduations en k, espacées pour ne pas se toucher
    const pasK = Math.max(1, Math.round(joliPas(n, Math.min(12, Math.floor((R - L) / 34)))));
    for (let i = 0; i <= n; i += pasK) {
      txt(g, X(i), B + 14, String(i), { fs: 9.5, anchor: 'middle', mono: true, fill: 'var(--ink-soft)' });
    }
    txt(g, X(k), B + 25, 'k = ' + k, { fs: 10, anchor: 'middle', bold: true, fill: 'var(--sub)' });
  }

  /* ── la loi des grands nombres ────────────────────────────────────────── */
  function convergence(box, n, p) {
    const G = { l: 46, r: 12, t: 10, b: 20 };
    const L = box.x + G.l, R = box.x + box.w - G.r;
    const T = box.y + G.t, B = box.y + box.h - G.b;
    const g = mk('g', {}, svg);
    mk('rect', { x: L, y: T, width: R - L, height: B - T, fill: 'var(--paper)',
      stroke: 'var(--rule)', 'stroke-width': 1 }, g);
    const E = n * p;
    const sig = Math.sqrt(n * p * (1 - p));
    // la fenêtre suit ±3σ autour de n p : c'est l'échelle naturelle du problème,
    // et elle rend la convergence lisible quel que soit n
    const lo = E - 3 * sig - 0.001, hi = E + 3 * sig + 0.001;
    const X = (t) => L + (Math.log10(Math.max(1, t)) / Math.log10(Math.max(10, total))) * (R - L);
    const Y = (v) => B - ((v - lo) / (hi - lo)) * (B - T);

    mk('line', { x1: L, y1: Y(E), x2: R, y2: Y(E), stroke: '#2a9d8f', 'stroke-width': 1.6,
      'stroke-dasharray': '5 4' }, g);
    txt(g, L + 5, Y(E) - 5, 'n p = ' + fr(E, 3), { fs: 9.5, bold: true, fill: '#2a9d8f', halo: true });
    [-2, 2].forEach((s) => {
      mk('line', { x1: L, y1: Y(E + s * sig), x2: R, y2: Y(E + s * sig), stroke: 'var(--rule)',
        'stroke-width': 1, opacity: 0.5 }, g);
    });
    const d = moyennes.map((m, i) => (i ? 'L' : 'M') + X(m[0]).toFixed(1) + ' ' + Y(m[1]).toFixed(1)).join(' ');
    mk('path', { d, fill: 'none', stroke: '#c9772b', 'stroke-width': 1.6 }, g);
    [1, 10, 100, 1000, 10000].filter((t) => t <= Math.max(10, total)).forEach((t) => {
      txt(g, X(t), B + 13, String(t), { fs: 9, anchor: 'middle', mono: true, fill: 'var(--ink-soft)' });
    });
    txt(g, R - 5, T + 12, 'moyenne des tirages, en fonction de leur nombre',
      { fs: 9.5, anchor: 'end', fill: 'var(--ink-soft)', halo: true });
  }

  vide();
  lab.onResize(dessine);
  dessine();
}
