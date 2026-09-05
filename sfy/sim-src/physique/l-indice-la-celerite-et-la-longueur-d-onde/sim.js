// L'indice, la célérité et la longueur d'onde
//
// Le §II de la séance, et la partie 2 de l'exercice 2. Toute la difficulté du
// chapitre tient dans une seule question : quand la lumière entre dans le
// verre, qu'est-ce qui change ?
//
//   la célérité      v = c/n          change
//   la longueur d'onde  λ = λ₀/n      change
//   la fréquence     ν = c/λ₀         NE CHANGE PAS
//
// Elle ne change pas parce qu'elle est imposée par la SOURCE : les électrons du
// laser vibrent à leur rythme, et le verre ne peut pas leur en donner un autre.
// Sur l'écran, les ondulations se resserrent dans le verre pendant que les deux
// détecteurs continuent de battre exactement ensemble. C'est la même chose vue
// dans l'espace et vue dans le temps — la double périodicité du cours.
//
// Le temps est ralenti d'un facteur 10¹⁵, sans quoi il n'y aurait rien à voir :
// une période vaut deux femtosecondes. Le facteur est écrit à l'écran, et les
// nombres affichés restent les vrais.

const C = 2.99792458e8;              // célérité dans le vide, en m/s
const RALENTI = 1e-15;               // une seconde de montre = une femtoseconde
// La fenêtre spatiale et la finesse du tracé vont ensemble. Sur 24 µm, une
// onde de 262 nm (le rouge dans le diamant) n'avait que cinq points par
// ondulation : le tracé se repliait, les crêtes changeaient de hauteur, et la
// longueur d'onde lue dessus était fausse de 3 %. À 9 µm et 700 points il en
// reste une vingtaine, même dans le diamant.
const SPAN = 9e-6;                   // largeur de la fenêtre, en m
const NPT = 700;                     // points du tracé spatial

const MILIEUX = {
  air: { nom: 'l’air', n: 1.0003 },
  eau: { nom: 'l’eau', n: 1.333 },
  plexi: { nom: 'le plexiglas', n: 1.491 },
  crown: { nom: 'le verre crown', n: 1.517 },
  flint: { nom: 'le verre flint', n: 1.620 },
  diamant: { nom: 'le diamant', n: 2.417 },
};

export function mount(lab) {
  const { make, fr } = lab;

  /* ── réglages ──────────────────────────────────────────────────────── */
  lab.group('La source');
  const lam = lab.slider({
    label: 'Longueur d’onde dans le vide λ₀', min: 380, max: 780, step: 1, value: 633,
    unit: 'nm', dec: 0,
  });
  lab.group('Le milieu traversé');
  const mil = lab.select({
    label: 'Milieu',
    options: Object.keys(MILIEUX).map((k) => ({ value: k, label: MILIEUX[k].nom + '  (n = ' + MILIEUX[k].n + ')' }))
      .concat([{ value: 'libre', label: 'indice au choix' }]),
    value: 'crown',
    onChange: (v) => { if (v !== 'libre') idx.set(MILIEUX[v].n); paint(); },
  });
  const idx = lab.slider({
    label: 'Indice n', min: 1, max: 2.6, step: 0.001, value: 1.517, dec: 3,
    onInput: () => { if (mil.value !== 'libre') mil.set('libre'); paint(); },
  });
  const ep = lab.slider({ label: 'Épaisseur traversée e', min: 0.5, max: 8, step: 0.1, value: 3, unit: 'mm', dec: 1 });
  lab.group('Affichage');
  const vue = lab.select({
    label: 'Ce qu’on regarde',
    options: [{ value: 'onde', label: 'l’onde qui entre dans le milieu' },
      { value: 'domaines', label: 'où tombe λ₀ dans le spectre' }],
    value: 'onde',
  });

  /* ── mesures ───────────────────────────────────────────────────────── */
  lab.readout({ label: '— ce qui ne change pas —', format: () => '' }).show(true);
  const nuRead = lab.readout({ label: 'fréquence ν', format: (s) => s || '—', hi: true });
  const tRead = lab.readout({ label: 'période T = 1/ν', format: (s) => s || '—' });
  const chg = lab.readout({ label: '— ce qui change —', format: () => '' });
  const vRead = lab.readout({ label: 'célérité v = c/n', format: (s) => s || '—', hi: true });
  const lmRead = lab.readout({ label: 'longueur d’onde λ = λ₀/n', format: (s) => s || '—', hi: true });
  const nRead = lab.readout({ label: 'indice n = c/v', dec: 3 });
  const domRead = lab.readout({ label: 'domaine de λ₀', format: (s) => s || '—' });
  const trRead = lab.readout({ label: 'traversée de e', format: (s) => s || '—' });
  const cntRead = lab.readout({ label: 'ondulations dans e', format: (s) => s || '—' });

  /* ── la physique ───────────────────────────────────────────────────── */
  const n = () => idx.value;
  const lam0 = () => lam.value * 1e-9;                  // λ₀ en m
  const nu = () => C / lam0();                          // ν, imposée par la source
  const v = () => C / n();                              // v = c/n
  const lamM = () => lam0() / n();                      // λ dans le milieu
  const omega = () => 2 * Math.PI * nu();

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  const grT = lab.chart({
    x: { label: 'temps', unit: 'fs', zero: false },
    y: { label: 'élongation', min: -1.25, max: 1.25, ticks: 3 },
  });
  const PAD = { l: 20, r: 18, t: 34, b: 18 };

  function paint(t) {
    const tt = t == null ? lab.clock.t : t;
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    ep.show(vue.value === 'onde');

    const W = w - PAD.l - PAD.r, H = h - PAD.t - PAD.b;
    if (vue.value === 'onde') dessinOnde(PAD.l, PAD.t, W, H, tt);
    else dessinDomaines(PAD.l, PAD.t, W, H);

    const nn = nu();
    // toExponential rend « 4.736e+14 », qui n'est pas du français : la puissance
    // s'écrit en exposants, comme au tableau.
    nuRead.set(fr(nn / 1e12, 1) + ' THz   soit ' + sci(nn, 3) + ' Hz');
    tRead.set(fr(1e15 / nn, 3) + ' fs');
    vRead.set(fr(v() / 1e8, 4) + ' × 10⁸ m/s   soit ' + fr(100 * v() / C, 1) + ' % de c');
    lmRead.set(fr(lamM() * 1e9, 1) + ' nm   (dans le vide : ' + fr(lam.value, 0) + ' nm)');
    nRead.set(n());
    domRead.set(domaine(lam.value));
    const dt = ep.value * 1e-3 / v();
    trRead.set(fr(dt * 1e12, 3) + ' ps   (dans le vide : ' + fr(ep.value * 1e-3 / C * 1e12, 3) + ' ps)');
    cntRead.set(fr(ep.value * 1e-3 / lamM(), 0) + '   (dans le vide : '
      + fr(ep.value * 1e-3 / lam0(), 0) + ')');
  }

  /* ── l'onde qui entre dans le milieu ───────────────────────────────── */
  function dessinOnde(X0, Y0, W, H, t) {
    // Le temps PHYSIQUE : une seconde de montre vaut une femtoseconde. On
    // multiplie par RALENTI, on ne divise pas — diviser donnait ω·t ≈ 10³¹ rad,
    // où deux doubles voisins sont déjà distants de 10¹⁵, si bien que le terme
    // spatial (200 rad à peine) disparaissait dans l'arrondi et l'onde sortait
    // parfaitement plate. Une constante inversée ne se voit pas toujours à la
    // vitesse : ici elle effaçait la figure.
    const tp = t * RALENTI;
    const col = wlRGB(lam.value);
    const hOnde = Math.min(190, H * 0.5);
    const yc = Y0 + hOnde / 2;
    // L'axe des x porte une VRAIE longueur : quelques micromètres. Sans échelle
    // affichée, « les ondulations se resserrent » n'est qu'une impression.
    const X = (x) => X0 + (x / SPAN) * W;
    const xEnt = SPAN * 0.36;
    // Le milieu occupe tout ce qui suit la face d'entrée. Y dessiner une face de
    // sortie serait un mensonge : e vaut des millimètres, la fenêtre quelques
    // micromètres, et la sortie est à mille largeurs d'écran d'ici. L'épaisseur
    // se lit dans les relevés — durée de traversée, nombre d'ondulations — pas
    // sur la figure.
    // Le titre est raccourci quand la scène l'est : à pleine longueur il rejoint
    // l'horloge, calée à droite, dès que la fenêtre descend sous 640 px.
    label(X0, 14, W < 640 ? 'Autour de la face d’entrée'
      : 'Quelques micromètres autour de la face d’entrée — temps ralenti ×10¹⁵', 'lab');
    label(X0 + W, 14, 't = ' + fr(tp * 1e15, 2) + ' fs', 'ax end');

    make('rect', { x: X(xEnt), y: Y0, width: X0 + W - X(xEnt), height: hOnde,
      fill: 'var(--sub)', opacity: .1 }, g);
    make('line', { x1: X(xEnt), y1: Y0, x2: X(xEnt), y2: Y0 + hOnde,
      stroke: 'var(--sub)', 'stroke-width': 1.4 }, g);
    label((X(xEnt) + X0 + W) / 2, Y0 + hOnde + 14,
      (MILIEUX[mil.value] ? MILIEUX[mil.value].nom : 'le milieu') + ' — n = ' + fr(n(), 3), 'tau');
    label(X(xEnt / 2), Y0 + hOnde + 14, 'le vide — n = 1', 'tau');

    // La phase accumulée depuis l'origine : k₀x dans le vide, n k₀x dans le
    // milieu. C'est la SEULE différence entre les deux côtés, et c'est elle qui
    // resserre les ondulations sans toucher au rythme.
    const k0 = 2 * Math.PI / lam0();
    const phase = (x) => (x <= xEnt ? k0 * x : k0 * xEnt + n() * k0 * (x - xEnt));
    const A = hOnde * 0.36;
    let d = '';
    for (let i = 0; i <= NPT; i++) {
      const x = SPAN * i / NPT;
      d += (i ? 'L' : 'M') + X(x) + ' ' + (yc - A * Math.cos(omega() * tp - phase(x)));
    }
    make('line', { x1: X0, y1: yc, x2: X0 + W, y2: yc, stroke: 'var(--rule)', 'stroke-width': 1 }, g);
    make('path', { d, fill: 'none', stroke: col, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);

    // une règle en micromètres, pour que λ soit une longueur et pas un dessin
    const yR = Y0 + hOnde + 26;
    make('line', { x1: X0, y1: yR, x2: X0 + W, y2: yR, stroke: 'var(--ink-soft)', 'stroke-width': 1 }, g);
    // L'unité est portée par la dernière graduation, pas posée à côté : au bout
    // de la règle, les deux se disputaient la même place.
    const kMax = Math.floor((SPAN * 1e6 + 1e-9) / 0.2);
    for (let k = 0; k <= kMax; k++) {
      const um = k * 0.2, gros = k % 5 === 0, bout = k + 5 > kMax;
      make('line', { x1: X(um * 1e-6), y1: yR, x2: X(um * 1e-6), y2: yR + (gros ? 7 : 4),
        stroke: 'var(--ink-soft)', 'stroke-width': gros ? 1.1 : .7 }, g);
      if (gros) {
        label(X(um * 1e-6), yR + 18, fr(um, 0) + (bout ? ' µm' : ''), bout ? 'ax end' : 'ax');
      }
    }

    // les deux détecteurs
    const xM1 = xEnt * 0.5, xM2 = xEnt + (SPAN - xEnt) * 0.45;
    [[xM1, 'M₁', 'var(--ink-soft)'], [xM2, 'M₂', 'var(--sub)']].forEach(([x, nom, c]) => {
      const y = yc - A * Math.cos(omega() * tp - phase(x));
      make('line', { x1: X(x), y1: Y0, x2: X(x), y2: Y0 + hOnde, stroke: c,
        'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: .6 }, g);
      make('circle', { cx: X(x), cy: y, r: 5, fill: c }, g);
      label(X(x), Y0 - 4, nom, 'pt');
    });

    /* le même mouvement, vu dans le temps : deux périodes, et les deux
       détecteurs y battent ensemble quoi qu'on fasse au milieu */
    // 72 et non 46 : les chiffres de la règle occupent la ligne du dessous, et
    // le titre de la section leur tombait dessus. 62 suffisait sur une grande
    // scène et plus du tout sur une scène de 555 px — la marge doit tenir au
    // pire, pas au cas qu'on avait sous les yeux.
    const yT = Y0 + hOnde + 72;
    const hT = Y0 + H - yT;
    if (hT < 90) return;
    label(X0, yT - 6, 'Ce que chaque détecteur ressent, au cours du temps', 'lab');
    const T = 1 / nu(), fen = 2 * T;                     // deux périodes
    const courbe = (x) => {
      const pts = [];
      for (let i = 0; i <= 180; i++) {
        const tau = fen * i / 180;
        pts.push([tau * 1e15, Math.cos(omega() * tau - phase(x))]);
      }
      return pts;
    };
    const tau = ((tp) % fen) * 1e15;
    grT.draw(g, { x: X0, y: yT + 4, w: W, h: hT - 4 }, {
      curves: [{ pts: courbe(xM1), color: 'var(--ink-soft)', width: 1.6 },
        { pts: courbe(xM2), color: 'var(--sub)', width: 1.6 }],
      points: [{ x: tau, y: Math.cos(omega() * (tau * 1e-15) - phase(xM1)), color: 'var(--ink-soft)', r: 4 },
        { x: tau, y: Math.cos(omega() * (tau * 1e-15) - phase(xM2)), color: 'var(--sub)', r: 4 }],
    });
  }

  /* ── le spectre, en échelle logarithmique ──────────────────────────── */
  const BANDES = [
    { a: 1e-11, b: 1e-8, nom: 'rayons X', col: '#7b6ea8' },
    { a: 1e-8, b: 400e-9, nom: 'ultraviolet', col: '#8f6fb5' },
    { a: 400e-9, b: 800e-9, nom: 'visible', col: null },
    { a: 800e-9, b: 1e-3, nom: 'infrarouge', col: '#b5713f' },
    { a: 1e-3, b: 1e-1, nom: 'micro-ondes', col: '#5e7f8f' },
  ];
  function dessinDomaines(X0, Y0, W, H) {
    label(X0, 14, 'Où tombe λ₀ — l’œil ne voit qu’une fenêtre étroite', 'lab');
    const lo = Math.log10(1e-11), hi = Math.log10(1e-1);
    const X = (m) => X0 + (Math.log10(m) - lo) / (hi - lo) * W;
    const yb = Y0 + Math.min(74, H * 0.3), hb = Math.min(44, H * 0.18);

    const grad = make('linearGradient', { id: 'visspec', x1: '0', y1: '0', x2: '1', y2: '0' }, g);
    for (let i = 0; i <= 40; i++) {
      make('stop', { offset: (100 * i / 40).toFixed(1) + '%',
        'stop-color': wlRGB(400 + i * 10) }, grad);
    }
    BANDES.forEach((b) => {
      make('rect', { x: X(b.a), y: yb, width: X(b.b) - X(b.a), height: hb,
        fill: b.col || 'url(#visspec)', opacity: b.col ? .55 : 1,
        stroke: 'var(--paper)', 'stroke-width': 1 }, g);
      const larg = X(b.b) - X(b.a);
      if (larg > 46) label((X(b.a) + X(b.b)) / 2, yb + hb + 15, b.nom, 'pt');
      else label((X(b.a) + X(b.b)) / 2, yb - 8, b.nom, 'ax');
    });

    // Les décades, en mètres. Les deux du bout sont posées contre le bord plutôt
    // que centrées dessus : une étiquette centrée sur la dernière graduation
    // déborde du cadre de la moitié de sa largeur.
    for (let e = -11; e <= -1; e++) {
      const x = X(Math.pow(10, e));
      make('line', { x1: x, y1: yb + hb, x2: x, y2: yb + hb + 5, stroke: 'var(--ink-soft)', 'stroke-width': .9 }, g);
      label(x, yb + hb + 32, '10' + exposant(e) + ' m',
        e === -11 ? 'ax start' : e === -1 ? 'ax end' : 'ax');
    }

    // où l'on se trouve
    const x = X(lam0());
    make('line', { x1: x, y1: yb - 26, x2: x, y2: yb + hb + 4, stroke: 'var(--ink)', 'stroke-width': 1.6 }, g);
    make('path', { d: 'M' + (x - 6) + ' ' + (yb - 26) + ' L' + (x + 6) + ' ' + (yb - 26)
      + ' L' + x + ' ' + (yb - 17) + ' Z', fill: 'var(--ink)' }, g);
    label(x, yb - 32, 'λ₀ = ' + fr(lam.value, 0) + ' nm', 'tau');

    // et un zoom sur le visible, où se joue toute la séance
    const yv = yb + hb + 62, hv = Math.min(40, Math.max(20, Y0 + H - yv - 40));
    if (hv < 20) return;
    label(X0, yv - 8, 'Le visible, étalé', 'lab');
    const gv = make('linearGradient', { id: 'viszoom', x1: '0', y1: '0', x2: '1', y2: '0' }, g);
    for (let i = 0; i <= 40; i++) {
      make('stop', { offset: (100 * i / 40).toFixed(1) + '%', 'stop-color': wlRGB(380 + i * 10) }, gv);
    }
    make('rect', { x: X0, y: yv, width: W, height: hv, fill: 'url(#viszoom)' }, g);
    const Xv = (nm) => X0 + (nm - 380) / 400 * W;
    for (let nm = 400; nm <= 780; nm += 50) {
      make('line', { x1: Xv(nm), y1: yv + hv, x2: Xv(nm), y2: yv + hv + 5,
        stroke: 'var(--ink-soft)', 'stroke-width': .9 }, g);
      label(Xv(nm), yv + hv + 17, fr(nm, 0), 'ax');
    }
    label(X0 + W, yv + hv + 17, 'nm', 'ax end');
    const xv = Xv(lam.value);
    make('line', { x1: xv, y1: yv - 8, x2: xv, y2: yv + hv, stroke: 'var(--ink)', 'stroke-width': 1.6 }, g);
  }

  /* ── utilitaires ───────────────────────────────────────────────────── */
  function domaine(nm) {
    if (nm < 400) return 'ultraviolet — invisible à l’œil';
    if (nm > 780) return 'infrarouge — invisible à l’œil';
    const noms = [[450, 'violet'], [485, 'bleu'], [500, 'cyan'], [565, 'vert'],
      [590, 'jaune'], [625, 'orange'], [780, 'rouge']];
    return 'visible — ' + (noms.find((o) => nm <= o[0]) || noms[6])[1];
  }
  const exposant = (e) => String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]);
  const sci = (x, d) => {
    const e = Math.floor(Math.log10(Math.abs(x)));
    return fr(x / Math.pow(10, e), d) + ' × 10' + exposant(e);
  };
  function label(x, y, txt, cls) {
    const t = make('text', { x, y }, g);
    const c = cls || 'ax';
    t.setAttribute('class', c);
    const a = /\bend\b/.test(c) ? 'end' : /\bstart\b/.test(c) ? 'start'
      : /\b(pt|tau)\b/.test(c) ? 'middle' : null;
    if (a) t.setAttribute('text-anchor', a);
    t.textContent = txt;
  }
  function wlRGB(nm) {
    let r = 0, v2 = 0, b = 0;
    if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { v2 = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { v2 = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; v2 = 1; }
    else if (nm < 645) { r = 1; v2 = -(nm - 645) / 65; }
    else { r = 1; }
    let f = 1;
    if (nm < 420) f = 0.3 + 0.7 * (nm - 380) / 40;
    else if (nm > 700) f = 0.3 + 0.7 * (780 - nm) / 80;
    const c = (u) => Math.round(255 * Math.pow(Math.max(0, u) * f, 0.8));
    return 'rgb(' + c(r) + ',' + c(v2) + ',' + c(b) + ')';
  }

  [lam, ep].forEach((s) => s.el.addEventListener('input', () => paint()));
  vue.el.addEventListener('change', () => paint());
  lab.onResize(() => paint());
  lab.loop((dt, t) => paint(t));
}
