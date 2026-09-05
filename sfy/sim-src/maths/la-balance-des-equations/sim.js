// La balance des équations.
//
// Une équation n'est pas un exercice de calcul : c'est un ÉQUILIBRE. Tant qu'on
// fait la même chose des deux côtés, il tient ; dès qu'on ne le fait que d'un
// côté, il se casse. Tout le chapitre est là, et un fléau qui penche le dit
// mieux qu'une règle apprise par cœur.
//
// Le choix qui compte, dans cette page : les opérations INTERDITES sont
// proposées comme les autres. On peut retirer un poids d'un seul côté, et voir
// la balance basculer. Une simulation qui empêche l'erreur n'apprend rien ; une
// simulation qui la laisse faire et la rend visible apprend la règle en une
// fois. Il faut alors annuler pour repartir — comme sur une copie.

const EQUATIONS = [
  { id: 'e1', gx: 1, gu: 3, dx: 0, du: 7, titre: 'x + 3 = 7' },
  { id: 'e2', gx: 2, gu: 0, dx: 0, du: 8, titre: '2x = 8' },
  { id: 'e3', gx: 2, gu: 1, dx: 0, du: 9, titre: '2x + 1 = 9' },
  { id: 'e4', gx: 3, gu: 4, dx: 2, du: 9, titre: '3x + 4 = 2x + 9' },
  { id: 'e5', gx: 4, gu: 2, dx: 2, du: 10, titre: '4x + 2 = 2x + 10' },
  { id: 'e6', gx: 5, gu: 3, dx: 2, du: 18, titre: '5x + 3 = 2x + 18' },
];

export function mount(lab) {
  const { fr } = lab;
  const svg = lab.svg();

  const choix = lab.select({ label: 'L’équation',
    options: EQUATIONS.map((e) => ({ value: e.id, label: e.titre })), value: 'e4',
    onChange: () => { remet(); dessine(); } });

  let etat = null, casse = 0, etapes = [], histo = [];

  const eq = () => EQUATIONS.find((e) => e.id === choix.value);
  function remet() {
    const e = eq();
    etat = { gx: e.gx, gu: e.gu, dx: e.dx, du: e.du };
    casse = 0; etapes = []; histo = [];
  }
  const copie = (s) => ({ gx: s.gx, gu: s.gu, dx: s.dx, du: s.du });
  const resolu = () => etat.gx === 1 && etat.gu === 0 && etat.dx === 0 && !casse;

  // Une opération légale : on note l'état d'avant pour pouvoir revenir.
  function agis(nom, f, brise = 0) {
    histo.push({ s: copie(etat), c: casse, e: etapes.slice() });
    f(etat);
    if (brise) casse = brise;
    etapes.push(nom);
    dessine();
  }
  const peut = {
    unite: () => !casse && etat.gu >= 1 && etat.du >= 1,
    boite: () => !casse && etat.gx >= 1 && etat.dx >= 1,
    div: (k) => !casse && etat.gx % k === 0 && etat.gu % k === 0 && etat.dx % k === 0
      && etat.du % k === 0 && (etat.gx / k >= 1 || etat.dx / k >= 1),
  };

  const btns = lab.buttons([
    { label: '− 1 des deux côtés', onClick: () => {
      if (!peut.unite()) return;
      agis('− 1 des deux côtés', (s) => { s.gu -= 1; s.du -= 1; });
    } },
    { label: '− une boîte des deux côtés', onClick: () => {
      if (!peut.boite()) return;
      agis('− une boîte des deux côtés', (s) => { s.gx -= 1; s.dx -= 1; });
    } },
    { label: '÷ 2', onClick: () => {
      if (!peut.div(2)) return;
      agis('÷ 2 des deux côtés', (s) => { s.gx /= 2; s.gu /= 2; s.dx /= 2; s.du /= 2; });
    } },
    { label: '÷ 3', onClick: () => {
      if (!peut.div(3)) return;
      agis('÷ 3 des deux côtés', (s) => { s.gx /= 3; s.gu /= 3; s.dx /= 3; s.du /= 3; });
    } },
  ]);
  lab.group('Ce qu’il ne faut pas faire');
  const btnsMal = lab.buttons([
    { label: '− 1 à gauche seulement', onClick: () => {
      if (casse || etat.gu < 1) return;
      agis('− 1 à gauche SEULEMENT', (s) => { s.gu -= 1; }, -1);
    } },
    { label: '− 1 à droite seulement', onClick: () => {
      if (casse || etat.du < 1) return;
      agis('− 1 à droite SEULEMENT', (s) => { s.du -= 1; }, 1);
    } },
  ]);
  lab.buttons([
    { label: '↶  Annuler', onClick: () => {
      const h = histo.pop();
      if (!h) return;
      etat = h.s; casse = h.c; etapes = h.e; dessine();
    } },
    { label: 'Recommencer', onClick: () => { remet(); dessine(); } },
  ]);

  const texte = (v) => (v == null ? '—' : String(v));
  const rEq = lab.readout({ label: 'L’équation maintenant', format: texte, hi: true });
  const rEtat = lab.readout({ label: 'La balance', format: texte });
  const rNb = lab.readout({ label: 'Étapes utilisées', dec: 0 });
  const rSol = lab.readout({ label: 'Solution', format: texte, hi: true });

  const mk = (t, a, p) => lab.make(t, a, p);
  function txt(p, x, y, s, a = {}) {
    const t = mk('text', { x, y, 'font-size': a.fs || 13, fill: a.fill || 'var(--ink)',
      'text-anchor': a.anchor || 'middle', 'font-weight': a.bold ? 600 : 400,
      'font-family': a.mono ? 'var(--mono)' : 'inherit', opacity: a.op != null ? a.op : 1,
      'paint-order': a.halo ? 'stroke' : null, stroke: a.halo ? 'var(--paper)' : null,
      'stroke-width': a.halo ? 3.4 : null, 'stroke-linejoin': a.halo ? 'round' : null }, p);
    t.textContent = s;
    return t;
  }
  // « 3x + 4 » écrit comme on l'écrit à la main : pas de « 1x », pas de « + 0 »
  function cote(nx, nu) {
    if (!nx && !nu) return '0';
    const a = nx ? (nx === 1 ? 'x' : nx + 'x') : '';
    const b = nu ? String(nu) : '';
    return a && b ? a + ' + ' + b : a || b;
  }

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const { w: W, h: H } = lab.size();
    const g = mk('g', {}, svg);

    const fsT = Math.max(15, Math.min(24, W / 30));
    const eqTxt = cote(etat.gx, etat.gu) + '  =  ' + cote(etat.dx, etat.du);
    txt(g, W / 2, 12 + fsT, eqTxt, { fs: fsT, bold: true, mono: true,
      fill: casse ? '#c1121f' : resolu() ? '#2a9d8f' : 'var(--ink)' });
    txt(g, W / 2, 16 + fsT * 1.9, casse
      ? 'La balance est cassée : l’égalité n’est plus vraie. Annulez.'
      : resolu() ? 'Une boîte d’un côté, des poids de l’autre : c’est fini.'
        : 'Faites la même chose des deux côtés pour garder l’équilibre.',
      { fs: 12, fill: casse ? '#c1121f' : resolu() ? '#2a9d8f' : 'var(--ink-soft)' });

    const haut = 26 + fsT * 1.9;
    const bas = H - 8;
    const cx = W / 2;
    const pivot = haut + 26;
    /* Les plateaux sont larges, et ils pendent au BOUT du fléau : leur bord
       extérieur se trouve donc à `demi + largeur/2` du centre. Dimensionner les
       deux séparément les faisait sortir de la scène dès que le panneau latéral
       rétrécissait l'espace. On fixe donc la largeur d'abord, puis on recule le
       fléau juste assez pour que le tout tienne. */
    const largeur = Math.min(W * 0.32, 210);
    const demi = Math.min(W * 0.3, 250, W / 2 - largeur / 2 - 10);
    const pente = casse * Math.min(22, demi * 0.09);

    // le pied et le fléau
    mk('path', { d: 'M' + (cx - 26) + ' ' + bas + 'L' + cx + ' ' + (pivot + 6) + 'L' + (cx + 26) + ' ' + bas + 'Z',
      fill: 'var(--ink)', 'fill-opacity': 0.13, stroke: 'var(--ink-soft)', 'stroke-width': 1.4 }, g);
    const yG = pivot + pente, yD = pivot - pente;
    mk('line', { x1: cx - demi, y1: yG, x2: cx + demi, y2: yD,
      stroke: 'var(--ink)', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    mk('circle', { cx, cy: pivot, r: 7, fill: 'var(--ink)' }, g);

    // deux plateaux suspendus, et leur contenu
    plateau(g, cx - demi, yG, largeur, bas, etat.gx, etat.gu, 'gauche');
    plateau(g, cx + demi, yD, largeur, bas, etat.dx, etat.du, 'droite');

    /* ── mesures ── */
    rEq.set(eqTxt);
    rEtat.set(casse ? 'cassée — annulez' : 'en équilibre');
    rNb.set(etapes.length);
    const e = eq();
    const vraie = (e.du - e.gu) / (e.gx - e.dx);
    rSol.set(resolu() ? 'x = ' + fr(etat.du, 0) + (Math.abs(etat.du - vraie) < 1e-9 ? '  ✓' : '')
      : 'pas encore trouvée');

    // ce qui reste possible : un bouton qui ne peut rien faire s'éteint, ce qui
    // vaut mieux qu'un bouton qui ne répond pas
    btns[0].disabled = !peut.unite();
    btns[1].disabled = !peut.boite();
    btns[2].disabled = !peut.div(2);
    btns[3].disabled = !peut.div(3);
    btnsMal[0].disabled = !!casse || etat.gu < 1;
    btnsMal[1].disabled = !!casse || etat.du < 1;
    [...btns, ...btnsMal].forEach((b) => { b.style.opacity = b.disabled ? 0.35 : 1; });
  }

  /* Un plateau et ce qu'il porte. Les boîtes « x » sont grandes et toutes
     pareilles — c'est une quantité inconnue mais UNE SEULE, la même partout —,
     les unités sont de petits cubes qu'on peut compter d'un coup d'œil. */
  function plateau(g, x, yBras, largeur, bas, nx, nu, quel) {
    const yPlateau = Math.min(bas - 74, yBras + 96);
    mk('line', { x1: x, y1: yBras, x2: x, y2: yPlateau, stroke: 'var(--ink-soft)', 'stroke-width': 1.4 }, g);
    mk('path', { d: 'M' + (x - largeur / 2) + ' ' + yPlateau + 'L' + (x + largeur / 2) + ' ' + yPlateau
      + 'L' + (x + largeur / 2 - 12) + ' ' + (yPlateau + 9) + 'L' + (x - largeur / 2 + 12) + ' ' + (yPlateau + 9) + 'Z',
      fill: 'var(--ink)', 'fill-opacity': 0.16, stroke: 'var(--ink-soft)', 'stroke-width': 1.6 }, g);

    const b = Math.min(38, (largeur - 16) / Math.max(3, nx + 0.55 * nu));
    const u = b * 0.52;
    const total = nx * (b + 4) + nu * (u + 3);
    let cur = x - total / 2;
    for (let i = 0; i < nx; i++) {
      mk('rect', { x: cur, y: yPlateau - b - 2, width: b, height: b, rx: 5,
        fill: 'var(--sub)', 'fill-opacity': 0.85, stroke: 'var(--sub)', 'stroke-width': 1.4 }, g);
      txt(g, cur + b / 2, yPlateau - 2 - b / 2 + b * 0.2, 'x',
        { fs: b * 0.56, bold: true, mono: true, fill: 'var(--paper)' });
      cur += b + 4;
    }
    for (let i = 0; i < nu; i++) {
      mk('rect', { x: cur, y: yPlateau - u - 2, width: u, height: u, rx: 2.5,
        fill: '#c9772b', 'fill-opacity': 0.85, stroke: '#c9772b', 'stroke-width': 1 }, g);
      cur += u + 3;
    }
    if (!nx && !nu) txt(g, x, yPlateau - 12, 'vide', { fs: 12, fill: 'var(--ink-mute)' });
    txt(g, x, yPlateau + 26, quel === 'gauche' ? 'côté gauche' : 'côté droit',
      { fs: 11.5, fill: 'var(--ink-soft)' });
  }

  remet();
  lab.onResize(dessine);
  dessine();
}
