// La diffraction par une fente
//
// Le §III de la séance, et les exercices 1 à 3 avec lui. On ne récite pas
// θ = λ/a : on mesure la tache au curseur, fente après fente, on porte L en
// fonction de 1/a, et la pente de la droite obtenue rend λ. C'est l'exercice 3
// mot pour mot, mais fait plutôt que lu.
//
// Trois choix qui font la différence avec un dessin animé :
//
//   • La figure n'est pas dessinée, elle est CALCULÉE. L'éclairement suit
//     I/I₀ = (sin u / u)² avec u = π a sin θ / λ. Les franges secondaires
//     tombent donc à 4,7 % et 1,7 % parce que la fonction le dit, et les
//     extinctions se placent où sin θ = k λ/a sans qu'on les y mette.
//
//   • On mesure avec des curseurs, pas avec une étiquette. L reste ce que
//     l'élève a relevé — mal posés, les points sortent de la droite, et le
//     graphe le montre tout seul.
//
//   • L'écart angulaire vaut asin(λ/a), pas λ/a. L'approximation du cours est
//     affichée à côté, avec l'écart entre les deux : elle est excellente ici,
//     et savoir POURQUOI elle l'est vaut mieux que de l'appliquer.
//
// La largeur de l'écran est fixe : c'est ce qui permet de VOIR la tache changer.
// Un cadrage qui s'ajuste tout seul rendrait toutes les fentes identiques.

const ECRAN = 30;                 // largeur de l'écran, en cm
const NCOL = 520;                 // colonnes de calcul de la figure

export function mount(lab) {
  const { make, fr } = lab;

  /* ── réglages ──────────────────────────────────────────────────────── */
  lab.group('Le laser');
  // Les raies qu'on rencontre vraiment, l'exercice 3 en tête : il fait mesurer
  // un cheveu avec un laser de lecteur DVD, puis demande ce que donnerait un
  // laser vert. Autant que ce soit un choix plutôt qu'un nombre à retrouver.
  const source = lab.select({
    label: 'Source',
    options: [
      { value: '633', label: 'laser hélium-néon — 633 nm' },
      { value: '650', label: 'diode de lecteur DVD — 650 nm' },
      { value: '532', label: 'laser vert — 532 nm' },
      { value: '450', label: 'laser bleu — 450 nm' },
      { value: '405', label: 'laser violet — 405 nm' },
      { value: 'libre', label: 'réglage libre' },
    ],
    value: '633',
    onChange: (v) => { if (v !== 'libre') lam.set(+v); paint(); },
  });
  // Le pas est de 1 nm, pas de 5 : à 5 nm près, 633 n'existe pas — et 633 est
  // précisément la raie de l'hélium-néon de tous les énoncés.
  const lam = lab.slider({
    label: 'Longueur d’onde λ', min: 400, max: 750, step: 1, value: 633, unit: 'nm', dec: 0,
    onInput: () => { if (source.value !== 'libre') source.set('libre'); paint(); },
  });
  lab.group('L’obstacle');
  // Une fente de largeur a et un fil de diamètre a donnent la MÊME figure hors
  // du centre — c'est le théorème de Babinet. Les exercices passent de l'une à
  // l'autre sans prévenir (fil de pêche, fils calibrés, cheveu) ; autant que ce
  // soit un réglage plutôt qu'une surprise.
  const objet = lab.select({
    label: 'Obstacle',
    options: [{ value: 'fente', label: 'une fente de largeur a' },
      { value: 'fil', label: 'un fil de diamètre a' }],
    value: 'fente',
  });
  const aa = lab.slider({
    label: 'Largeur a', min: 30, max: 300, step: 5, value: 100, unit: 'µm', dec: 0,
  });
  lab.group('L’écran');
  const dd = lab.slider({
    label: 'Distance D', min: 0.5, max: 3, step: 0.1, value: 2, unit: 'm', dec: 1,
  });
  const zoom = lab.select({
    label: 'Loupe sur l’écran',
    options: [{ value: '1', label: 'sans loupe — 30 cm' }, { value: '2', label: '×2 — 15 cm' },
      { value: '5', label: '×5 — 6 cm' }, { value: '10', label: '×10 — 3 cm' }],
    value: '1',
  });
  lab.group('Affichage');
  const vue = lab.select({
    label: 'Ce qu’on regarde',
    options: [{ value: 'ecran', label: 'la tache sur l’écran' },
      { value: 'graphe', label: 'le graphe L = f(1/a)' }],
    value: 'ecran',
  });
  // L'œil et l'appareil photo ne sont pas linéaires : une frange à 4,7 % de
  // l'éclairement central se voit sur une photo, alors qu'un tracé fidèle la
  // laisse presque noire. On propose donc la « photo », et la courbe au-dessus
  // reste, elle, rigoureusement proportionnelle à l'éclairement.
  const pose = lab.check({ label: 'Photo surexposée (voir les franges faibles)', value: true });

  /* ── les relevés, que l'élève construit ────────────────────────────── */
  let releves = [];
  lab.buttons([
    {
      label: '＋ Relever (1/a , L)',
      onClick: () => {
        const inv = 1 / (aa.value / 1000);                  // a en mm → 1/a en mm⁻¹
        const L = Math.abs(cur[1] - cur[0]);                // ce que l'élève a mesuré
        if (L < 0.02) { note.set('Écartez d’abord les deux curseurs sur l’écran.'); note.show(true); return; }
        const jum = releves.find((r) => Math.abs(r.x - inv) < 1e-6);
        if (jum) {
          note.set('a = ' + fr(aa.value, 0) + ' µm est déjà relevé. Changez de fente.');
          note.show(true); return;
        }
        releves.push({ x: inv, y: L, a: aa.value, D: dd.value, lam: lam.value });
        releves.sort((p, q) => p.x - q.x);
        vue.set('graphe');
        paint();
      },
    },
    { label: 'Effacer', onClick: () => { releves = []; paint(); } },
  ]);

  /* ── mesures ───────────────────────────────────────────────────────── */
  const curRead = lab.readout({ label: 'Curseurs (cm)', format: (s) => s || '—' });
  const lRead = lab.readout({ label: 'L mesurée', unit: 'cm', dec: 2, hi: true });
  const lVrai = lab.readout({ label: 'L vraie = 2D·tan θ', unit: 'cm', dec: 2 });
  const thRead = lab.readout({ label: 'θ = asin(λ/a)', unit: 'rad', dec: 5 });
  const apRead = lab.readout({ label: 'approximation λ/a', format: (s) => s || '—' });
  const penRead = lab.readout({ label: 'pente de L = f(1/a)', unit: 'cm·mm', dec: 4 });
  const lamRead = lab.readout({ label: 'λ lue sur la pente', unit: 'nm', dec: 0, hi: true });
  const lamVrai = lab.readout({ label: 'λ du laser', unit: 'nm', dec: 0 });
  const note = lab.readout({ label: '', format: (s) => s || '' });
  note.show(false);

  /* ── la physique ───────────────────────────────────────────────────── */
  const lamM = () => lam.value * 1e-9;                      // λ en m
  const aM = () => aa.value * 1e-6;                         // a en m
  // Diffraction de Fraunhofer par une fente : I/I₀ = (sin u / u)², u = π a sinθ/λ.
  // Toute la figure sort de cette seule ligne — extinctions comprises.
  const inten = (sinT) => {
    const u = Math.PI * aM() * sinT / lamM();
    if (Math.abs(u) < 1e-9) return 1;
    const s = Math.sin(u) / u;
    return s * s;
  };
  // Première extinction : sin θ = λ/a. Elle n'existe que si λ ≤ a — au-delà, la
  // fente est plus étroite que la longueur d'onde et il n'y a plus de tache.
  const sinTheta1 = () => lamM() / aM();
  const theta1 = () => (sinTheta1() <= 1 ? Math.asin(sinTheta1()) : NaN);
  // Demi-largeur sur l'écran : x = D tan θ. Le cours écrit L = 2λD/a, ce qui
  // suppose deux fois la même approximation (sin θ ≈ θ ≈ tan θ).
  const lVraieCm = () => 2 * dd.value * Math.tan(theta1()) * 100;
  const lApproxCm = () => 2 * lamM() * dd.value / aM() * 100;

  /* ── les curseurs de mesure ────────────────────────────────────────── */
  let cur = [-1.4, 1.4];                                    // en cm, comptés du centre
  let drag = -1;

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  const graphe = lab.chart({
    x: { label: '1 / a', unit: 'mm⁻¹' },
    y: { label: 'L', unit: 'cm' },
  });

  // Le titre du banc et l'étiquette de la fente tombaient sur la même ligne, et
  // aucun décalage horizontal ne les sépare : l'étiquette suit la fente, à 26 %
  // de la largeur, pile sous le titre. Chacune a donc sa bande, et la hauteur
  // est prise sur le banc plutôt que sur la figure du dessous.
  const PAD = { l: 20, r: 18, t: 46, b: 16 };
  let strip = null;                     // géométrie de l'écran, pour les curseurs

  function paint() {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    strip = null;

    const W = w - PAD.l - PAD.r;
    const benchH = Math.max(64, Math.min(150, h * 0.34) - 16);
    const col = wlRGB(lam.value);
    const demi = ECRAN / 2 / +zoom.value;                   // demi-largeur vue, en cm
    const CX = PAD.l + W / 2;
    const cmPx = (W * 0.86) / (2 * demi);                   // pixels par cm sur l'écran
    const Xc = (cm) => CX + cm * cmPx;                      // cm sur l'écran → pixel

    drawBench(PAD.t, benchH, W, CX, cmPx, demi, col);

    const bas = PAD.t + benchH + 26;
    const basH = h - bas - PAD.b;
    if (vue.value === 'graphe') drawGraphe(bas, basH, W);
    else drawEcran(bas, basH, W, CX, cmPx, demi, col, Xc);

    /* ── les mesures ─────────────────────────────────────────────────── */
    const th = theta1();
    curRead.set(fr(cur[0], 2) + '  et  ' + fr(cur[1], 2));
    lRead.set(Math.abs(cur[1] - cur[0]));
    lVrai.set(isFinite(th) ? lVraieCm() : null);
    thRead.set(isFinite(th) ? th : null);
    if (isFinite(th)) {
      const ap = lamM() / aM();
      apRead.set(fr(ap, 5) + ' rad — écart ' + fr(100 * (ap - th) / th, 3) + ' %');
    } else apRead.set('a < λ : plus de tache centrale');
    lamVrai.set(lam.value);

    const fit = lab.fitLine(releves, { throughOrigin: true });
    penRead.set(fit ? fit.a : null);
    // L(cm) = 2λD × 10⁵ × (1/a en mm⁻¹) — donc λ(nm) = pente / (2D) × 10⁴.
    lamRead.set(fit ? fit.a / (2 * dd.value) * 1e4 : null);
    const melange = releves.length > 1
      && releves.some((r) => r.D !== releves[0].D || r.lam !== releves[0].lam);
    if (melange) {
      note.set('Attention : ces relevés n’ont pas tous le même λ ou le même D. '
        + 'La droite n’a alors plus de sens — la pente vaut 2λD.');
      note.show(true);
    } else if (releves.length && !/déjà|Écartez/.test(noteTxt())) note.show(false);
  }
  const noteTxt = () => (note.el.querySelector('.r-val') || {}).textContent || '';

  /* ── le banc, vu de dessus ─────────────────────────────────────────── */
  function drawBench(top, H, W, CX, cmPx, demi, col) {
    const yc = top + H / 2;
    const xLaser = PAD.l + 6, xFente = PAD.l + W * 0.26, xEcran = PAD.l + W - 8;
    label(PAD.l, 12, 'Le banc, vu de dessus — D est raccourci, les angles sont donc exagérés', 'lab');

    // le laser
    make('rect', { x: xLaser, y: yc - 9, width: 34, height: 18, rx: 3, fill: 'var(--ink)' }, g);
    label(xLaser + 17, yc + 25, 'LASER', 'pt');
    make('line', { x1: xLaser + 34, y1: yc, x2: xFente, y2: yc, stroke: col, 'stroke-width': 2.2 }, g);

    // Le faisceau diffracté. On le trace à la MÊME échelle verticale que la
    // figure du dessous : l'ouverture du cône et la tache qu'il produit sont
    // alors la même longueur à l'écran, et le dessin ne ment que sur D.
    const th = theta1();
    if (isFinite(th)) {
      const dep = Math.tan(th) * dd.value * 100 * cmPx;     // demi-tache, en pixels
      make('path', {
        d: 'M' + xFente + ' ' + yc + ' L' + xEcran + ' ' + (yc - dep)
          + ' L' + xEcran + ' ' + (yc + dep) + ' Z',
        fill: col, opacity: .16,
      }, g);
      [-1, 1].forEach((s) => make('line', { x1: xFente, y1: yc, x2: xEcran, y2: yc + s * dep,
        stroke: col, 'stroke-width': 1.2, opacity: .75 }, g));
      // les ordres suivants, plus pâles : la lumière ne s'arrête pas à la tache
      for (let k = 2; k <= 4; k++) {
        const s = k * lamM() / aM();
        if (s > 1) break;
        const y = Math.tan(Math.asin(s)) * dd.value * 100 * cmPx;
        [-1, 1].forEach((sg) => make('line', { x1: xFente, y1: yc, x2: xEcran, y2: yc + sg * y,
          stroke: col, 'stroke-width': .8, opacity: .3, 'stroke-dasharray': '3 3' }, g));
      }
    }
    make('line', { x1: xFente, y1: yc, x2: xEcran, y2: yc, stroke: 'var(--ink-mute)',
      'stroke-width': .8, 'stroke-dasharray': '4 4' }, g);

    // la fente (ou le fil)
    const ouv = 7;
    if (objet.value === 'fente') {
      make('rect', { x: xFente - 3, y: top + 2, width: 6, height: H / 2 - ouv - 2, fill: 'var(--ink)' }, g);
      make('rect', { x: xFente - 3, y: yc + ouv, width: 6, height: H / 2 - ouv - 2, fill: 'var(--ink)' }, g);
    } else {
      make('rect', { x: xFente - 3, y: yc - ouv, width: 6, height: 2 * ouv, fill: 'var(--ink)' }, g);
    }
    label(xFente, top - 4, (objet.value === 'fente' ? 'fente a = ' : 'fil a = ') + fr(aa.value, 0) + ' µm', 'tau');

    // l'écran, et la cote D
    make('line', { x1: xEcran, y1: top, x2: xEcran, y2: top + H, stroke: 'var(--ink-soft)', 'stroke-width': 2.5 }, g);
    const yd = top + H + 12;
    make('line', { x1: xFente, y1: yd, x2: xEcran, y2: yd, stroke: 'var(--ink-mute)', 'stroke-width': 1 }, g);
    [xFente, xEcran].forEach((x) => make('line', { x1: x, y1: yd - 3, x2: x, y2: yd + 3,
      stroke: 'var(--ink-mute)', 'stroke-width': 1 }, g));
    label((xFente + xEcran) / 2, yd - 4, 'D = ' + fr(dd.value, 1) + ' m', 'tau');
  }

  /* ── l'écran, vu de face ───────────────────────────────────────────── */
  function drawEcran(top, H, W, CX, cmPx, demi, col, Xc) {
    // 0,44 et non 0,5 : la cote L a besoin d'une ligne à elle sous les chiffres
    // de la règle, et sur une fenêtre courte elle sortait du cadre.
    const curveH = Math.max(60, H * 0.44), stripH = Math.min(46, H * 0.24);
    const yCurve = top + curveH;
    const xL = Xc(-demi), xR = Xc(demi);

    label(PAD.l, top - 10, 'L’écran, vu de face', 'lab');

    // la courbe d'éclairement : fidèle, jamais retouchée
    make('line', { x1: xL, y1: yCurve, x2: xR, y2: yCurve, stroke: 'var(--rule)', 'stroke-width': 1 }, g);
    let d = '';
    for (let i = 0; i <= NCOL; i++) {
      const cm = -demi + (2 * demi) * i / NCOL;
      const x = cm / 100, sinT = x / Math.sqrt(x * x + dd.value * dd.value);
      const y = yCurve - inten(sinT) * (curveH - 14);
      d += (i ? 'L' : 'M') + Xc(cm) + ' ' + y;
    }
    make('path', { d, fill: 'none', stroke: col, 'stroke-width': 1.6 }, g);
    // Elle a sa place sur la ligne du titre, à l'autre bout : dans le cadre elle
    // butait contre le titre à gauche, et contre un curseur à droite dès que la
    // loupe rapproche les bords. Le titre a maigri d'autant.
    label(xR - 2, top - 10, 'I / I₀ = (sin u / u)²', 'ax end');

    // La tache, peinte avec un dégradé à NS arrêts plutôt qu'avec NS colonnes :
    // des rectangles voisins posés à des abscisses fractionnaires laissent des
    // coutures — claires si on les joint bord à bord, sombres si on les fait se
    // chevaucher, puisque les opacités se composent. Un dégradé n'a pas de bord.
    const yStrip = yCurve + 10;
    const gam = pose.value ? 0.45 : 1;
    const grad = make('linearGradient', { id: 'diffstrip', x1: '0', y1: '0', x2: '1', y2: '0' }, g);
    for (let i = 0; i <= NCOL; i++) {
      const cm = -demi + (2 * demi) * i / NCOL;
      const x = cm / 100, sinT = x / Math.sqrt(x * x + dd.value * dd.value);
      make('stop', { offset: (100 * i / NCOL).toFixed(3) + '%', 'stop-color': col,
        'stop-opacity': Math.pow(inten(sinT), gam).toFixed(4) }, grad);
    }
    make('rect', { x: xL, y: yStrip, width: xR - xL, height: stripH, fill: '#000' }, g);
    make('rect', { x: xL, y: yStrip, width: xR - xL, height: stripH, fill: 'url(#diffstrip)' }, g);

    // la règle, graduée en vrais centimètres
    const yRule = yStrip + stripH + 1;
    make('line', { x1: xL, y1: yRule, x2: xR, y2: yRule, stroke: 'var(--ink-soft)', 'stroke-width': 1 }, g);
    // Les deux pas vont par paire : un pas fin tout seul ne donne pas de
    // graduation chiffrée, et un pas chiffré tout seul ne se lit pas au dixième.
    // Ils sont choisis pour que l'écran porte six à huit nombres, quelle que
    // soit la loupe — une règle qui change de graduation reste une règle.
    const PAS = [[0.1, 0.02], [0.2, 0.05], [0.5, 0.1], [1, 0.2], [2, 0.5], [5, 1], [10, 2]];
    const [maj, min] = PAS.find((p) => (2 * demi) / p[0] <= 8) || [10, 2];
    const dec = maj < 1 ? 1 : 0;
    for (let k = Math.ceil(-demi / min); k * min <= demi + 1e-9; k++) {
      const cm = k * min;
      const gros = Math.abs(cm / maj - Math.round(cm / maj)) < 1e-9;
      make('line', { x1: Xc(cm), y1: yRule, x2: Xc(cm), y2: yRule + (gros ? 7 : 4),
        stroke: 'var(--ink-soft)', 'stroke-width': gros ? 1.2 : .8 }, g);
      if (gros) label(Xc(cm), yRule + 18, fr(cm, dec), 'ax');
    }

    // les deux curseurs, que l'on fait glisser
    strip = { xL, xR, yTop: yStrip, yBot: yRule + 20, Xc, demi, cmPx };
    // Sur une tache étroite les deux curseurs se touchent, et leurs étiquettes
    // avec eux : on les écarte alors de part et d'autre, comme les micros de la
    // séance 2.
    const xs = cur.map((cm) => Xc(Math.max(-demi, Math.min(demi, cm))));
    const serres = Math.abs(xs[1] - xs[0]) < 22;
    cur.forEach((cm, i) => {
      const x = xs[i], cote = i ? 1 : -1;
      make('line', { x1: x, y1: yCurve - curveH + 12, x2: x, y2: yRule + 8,
        stroke: 'var(--sub)', 'stroke-width': 1.4 }, g);
      make('path', { d: 'M' + (x - 5) + ' ' + (yStrip - 8) + ' L' + (x + 5) + ' ' + (yStrip - 8)
        + ' L' + x + ' ' + (yStrip - 1) + ' Z', fill: 'var(--sub)' }, g);
      label(x + (serres ? cote * 4 : 0), yCurve - curveH + 9, i ? 'C₂' : 'C₁',
        serres ? 'pt ' + (cote < 0 ? 'end' : 'start') : 'pt');
    });
    // la cote entre les curseurs : ce que l'élève est en train de mesurer
    const x1 = Xc(Math.max(-demi, Math.min(demi, cur[0])));
    const x2 = Xc(Math.max(-demi, Math.min(demi, cur[1])));
    // Sur une scène très basse — fenêtre courte, ou notes longues qui la
    // compriment — la cote ne tient plus sous la règle. On y renonce plutôt que
    // de la tracer hors du cadre : « L mesurée » reste dans les relevés.
    const ym = yRule + 42;
    if (ym + 4 > top + H) return;
    make('line', { x1, y1: ym, x2, y2: ym, stroke: 'var(--sub)', 'stroke-width': 1 }, g);
    label((x1 + x2) / 2, ym - 5, 'L = ' + fr(Math.abs(cur[1] - cur[0]), 2) + ' cm', 'tau');
  }

  /* ── le graphe L = f(1/a) ──────────────────────────────────────────── */
  function drawGraphe(top, H, W) {
    label(PAD.l, top - 10, 'L = f(1/a) — une fente par point', 'lab');
    const fit = lab.fitLine(releves, { throughOrigin: true });
    graphe.draw(g, { x: PAD.l, y: top, w: W, h: H }, {
      points: releves.map((r) => ({ x: r.x, y: r.y, label: fr(r.a, 0) + ' µm' })),
      fits: fit ? [{ a: fit.a, b: 0 }] : [],
    });
    if (!releves.length) {
      label(PAD.l + W / 2, top + H / 2, 'Mesurez une tache, puis « Relever ». '
        + 'Changez de fente, recommencez.', 'ax');
    }
  }

  /* ── faire glisser les curseurs ────────────────────────────────────── */
  const cmAt = (ev) => {
    const r = svg.getBoundingClientRect();
    const px = (ev.clientX - r.left) * (lab.size().w / r.width);
    return (px - (strip.xL + strip.xR) / 2) / strip.cmPx;
  };
  const down = (ev) => {
    if (!strip) return;
    const r = svg.getBoundingClientRect();
    const py = (ev.clientY - r.top) * (lab.size().h / r.height);
    if (py < strip.yTop - 22 || py > strip.yBot + 14) return;
    const cm = Math.max(-strip.demi, Math.min(strip.demi, cmAt(ev)));
    // on saisit le curseur le plus proche — ou on l'appelle là où l'on clique
    drag = Math.abs(cm - cur[0]) <= Math.abs(cm - cur[1]) ? 0 : 1;
    cur[drag] = cm; paint();
    // La capture n'est qu'un confort : elle garde le curseur sous la souris si
    // elle sort du cadre. Sans pointeur réel elle lève, et perdre le glissement
    // pour un agrément serait un mauvais échange.
    try { svg.setPointerCapture(ev.pointerId); } catch { /* tant pis */ }
    ev.preventDefault();
  };
  const move = (ev) => {
    if (drag < 0 || !strip) return;
    cur[drag] = Math.max(-strip.demi, Math.min(strip.demi, cmAt(ev)));
    paint();
  };
  const up = () => { drag = -1; };
  svg.addEventListener('pointerdown', down);
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', up);
  svg.style.touchAction = 'none';
  lab.onDestroy(() => {
    svg.removeEventListener('pointerdown', down);
    svg.removeEventListener('pointermove', move);
    svg.removeEventListener('pointerup', up);
    svg.removeEventListener('pointercancel', up);
  });

  /* ── utilitaires ───────────────────────────────────────────────────── */
  function label(x, y, txt, cls) {
    const n = make('text', { x, y }, g);
    const c = cls || 'ax';
    n.setAttribute('class', c);
    const anchor = /\bend\b/.test(c) ? 'end'
      : /\bstart\b/.test(c) ? 'start'
        : /\b(pt|tau)\b/.test(c) ? 'middle' : null;
    if (anchor) n.setAttribute('text-anchor', anchor);
    n.textContent = txt;
  }
  // λ → couleur écran. Approximation classique de Bruton : elle n'entre dans
  // aucun calcul, elle sert seulement à ce qu'un laser à 633 nm soit rouge.
  function wlRGB(nm) {
    let r = 0, v = 0, b = 0;
    if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { v = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { v = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; v = 1; }
    else if (nm < 645) { r = 1; v = -(nm - 645) / 65; }
    else { r = 1; }
    let f = 1;
    if (nm < 420) f = 0.3 + 0.7 * (nm - 380) / 40;
    else if (nm > 700) f = 0.3 + 0.7 * (780 - nm) / 80;
    const c = (u) => Math.round(255 * Math.pow(Math.max(0, u) * f, 0.8));
    return 'rgb(' + c(r) + ',' + c(v) + ',' + c(b) + ')';
  }

  // λ repeint par son propre onInput, qui a aussi à débrayer la liste des raies.
  [aa, dd].forEach((s) => s.el.addEventListener('input', paint));
  [objet, zoom, vue].forEach((s) => s.el.addEventListener('change', paint));
  pose.el.addEventListener('change', paint);
  lab.onResize(paint);
  paint();
}
