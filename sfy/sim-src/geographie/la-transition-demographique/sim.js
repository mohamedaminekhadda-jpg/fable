// La transition démographique
//
// Une pyramide des âges n'est pas un dessin : c'est la conséquence de deux
// nombres. Une population soumise longtemps à la même fécondité et à la même
// mortalité finit par prendre une structure par âge qui ne dépend plus que
// d'elles — c'est le modèle de la population stable :
//
//   part des personnes d'âge a  ∝  e^(−r·a) · l(a)
//
// l(a) est la probabilité d'atteindre l'âge a, r le taux d'accroissement. Tout
// le reste s'en déduit : natalité, mortalité, âge médian, rapport de dépendance.
// Rien n'est saisi à la main, et c'est pour cela que les deux curseurs suffisent
// à passer du Niger au Japon.
//
// UNE PRÉCISION QUI COMPTE. Ce modèle donne la structure d'ARRIVÉE : celle que
// le pays aurait si les taux d'aujourd'hui duraient indéfiniment. Ce n'est pas
// sa pyramide actuelle. Pour la France ou le Japon, le calcul annonce plus de
// personnes âgées qu'aujourd'hui — et il a raison : leur vieillissement n'est
// pas terminé. Une population met deux ou trois générations à rejoindre sa
// forme d'équilibre, et cette inertie est elle-même un fait de géographie.

const AGE_MAX = 100;

const PROFILS = [
  { id: 'niger', nom: 'Niger — avant la transition', fec: 6.7, e0: 61.9 },
  { id: 'maroc60', nom: 'Maroc, années 1960', fec: 7.2, e0: 48 },
  { id: 'maroc90', nom: 'Maroc, 1990', fec: 4.0, e0: 64.7 },
  { id: 'maroc', nom: 'Maroc aujourd’hui', fec: 2.3, e0: 74.0 },
  { id: 'chine', nom: 'Chine', fec: 1.2, e0: 78.2 },
  { id: 'france', nom: 'France', fec: 1.8, e0: 82.5 },
  { id: 'japon', nom: 'Japon', fec: 1.3, e0: 84.0 },
];

export function mount(lab) {
  const { make, fr } = lab;

  lab.group('Le pays');
  const profil = lab.select({
    label: 'Partir de', value: 'maroc',
    options: PROFILS.map((p) => ({ value: p.id, label: p.nom }))
      .concat([{ value: 'libre', label: 'réglage libre' }]),
    onChange: (v) => {
      const p = PROFILS.find((x) => x.id === v);
      if (p) { fec.set(p.fec); esp.set(p.e0); }
      paint();
    },
  });
  lab.group('Les deux nombres qui décident');
  const fec = lab.slider({
    label: 'Indice de fécondité', min: 1, max: 8, step: 0.1, value: 2.3,
    unit: 'enfants par femme', dec: 1,
    onInput: () => { if (profil.value !== 'libre') profil.set('libre'); paint(); },
  });
  const esp = lab.slider({
    label: 'Espérance de vie', min: 40, max: 88, step: 0.5, value: 74, unit: 'ans', dec: 1,
    onInput: () => { if (profil.value !== 'libre') profil.set('libre'); paint(); },
  });
  lab.group('Affichage');
  const vue = lab.select({
    label: 'Ce qu’on regarde', value: 'pyramide',
    options: [{ value: 'pyramide', label: 'la pyramide des âges' },
      { value: 'transition', label: 'le modèle de la transition' }],
  });
  const fantome = lab.check({ label: 'Garder le Maroc de 1960 en repère', value: true });

  /* ── mesures ───────────────────────────────────────────────────────── */
  const natR = lab.readout({ label: 'taux de natalité', format: (s) => s || '—', hi: true });
  const mortR = lab.readout({ label: 'taux de mortalité', format: (s) => s || '—' });
  const accR = lab.readout({ label: 'accroissement naturel', format: (s) => s || '—', hi: true });
  const doubR = lab.readout({ label: 'temps de doublement', format: (s) => s || '—' });
  const jeuneR = lab.readout({ label: 'moins de 15 ans', format: (s) => s || '—' });
  const actifR = lab.readout({ label: '15 à 64 ans', format: (s) => s || '—' });
  const vieuxR = lab.readout({ label: '65 ans et plus', format: (s) => s || '—' });
  const medR = lab.readout({ label: 'âge médian', format: (s) => s || '—' });
  const depR = lab.readout({ label: 'rapport de dépendance', format: (s) => s || '—' });
  const phaseR = lab.readout({ label: 'phase de la transition', format: (s) => s || '—', hi: true });

  /* ── la démographie ────────────────────────────────────────────────── */
  // Survie : une loi de Weibull, dont on ajuste l'échelle jusqu'à ce que l'aire
  // sous la courbe soit exactement l'espérance de vie demandée. La forme se
  // redresse quand l'espérance monte — c'est la « rectangularisation » des
  // courbes de survie, qui est un fait observé et non un artifice.
  function survie(e0) {
    const beta = 1.6 + (e0 - 40) * 0.075;
    let alpha = e0;
    for (let k = 0; k < 60; k++) {
      let s = 0;
      for (let a = 0; a < AGE_MAX; a++) s += Math.exp(-Math.pow(a / alpha, beta));
      alpha *= e0 / s;
    }
    return (a) => Math.exp(-Math.pow(a / alpha, beta));
  }
  function calcule(f, e0) {
    const l = survie(e0);
    const AGE_MERE = 28;
    const R0 = (f / 2.05) * l(AGE_MERE);       // filles par femme, survie comprise
    const r = Math.log(R0) / AGE_MERE;
    const brut = [];
    let somme = 0;
    for (let a = 0; a < AGE_MAX; a++) { const v = Math.exp(-r * a) * l(a); brut.push(v); somme += v; }
    const c = brut.map((v) => v / somme);
    const b = 1 / somme;
    const part = (a0, a1) => c.slice(a0, a1).reduce((s, v) => s + v, 0);
    let cum = 0, med = 0;
    for (let a = 0; a < AGE_MAX; a++) { cum += c[a]; if (cum >= 0.5) { med = a; break; } }
    return { c, l, r, b, d: b - r, med,
      j: part(0, 15), a: part(15, 65), v: part(65, AGE_MAX) };
  }

  const etat = () => calcule(fec.value, esp.value);
  const repere = () => calcule(7.2, 48);         // le Maroc des années 1960

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  const PAD = { l: 20, r: 18, t: 32, b: 18 };

  function paint() {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    const W = w - PAD.l - PAD.r, H = h - PAD.t - PAD.b;
    fantome.row.hidden = vue.value !== 'pyramide';
    const e = etat();
    if (vue.value === 'pyramide') pyramide(PAD.l, PAD.t, W, H, e);
    else transition(PAD.l, PAD.t, W, H, e);
    releves(e);
  }

  /* ── la pyramide ───────────────────────────────────────────────────── */
  function pyramide(X0, Y0, W, H, e) {
    label(X0, 14, 'La pyramide des âges — hommes à gauche, femmes à droite', 'lab');
    const T = Y0 + 24, B = Y0 + H - 34;
    const CX = X0 + W / 2, demi = Math.min(W * 0.42, 290);
    const ref = fantome.value ? repere() : null;
    const maxi = Math.max(...e.c, ...(ref ? ref.c : [0]));
    const bh = (B - T) / AGE_MAX;
    const X = (v, cote) => CX + cote * (v / maxi) * demi;

    // les repères d'âge
    for (let a = 0; a <= AGE_MAX; a += 10) {
      const y = B - a * bh;
      make('line', { x1: CX - demi, y1: y, x2: CX + demi, y2: y,
        stroke: 'var(--rule)', 'stroke-width': 1, opacity: .45 }, g);
      label(CX, y - 3, String(a), 'ax mid');
    }
    // le fantôme, tracé d'abord pour rester derrière
    if (ref) {
      [-1, 1].forEach((cote) => {
        let d = 'M' + CX + ' ' + B;
        for (let a = 0; a < AGE_MAX; a++) d += ' L' + X(ref.c[a], cote) + ' ' + (B - a * bh);
        d += ' L' + CX + ' ' + T;
        make('path', { d, fill: 'none', stroke: 'var(--ink-mute)', 'stroke-width': 1.4,
          'stroke-dasharray': '5 4', opacity: .75 }, g);
      });
    }
    // la pyramide elle-même, en barres d'un an
    for (let a = 0; a < AGE_MAX; a++) {
      const y = B - (a + 1) * bh, hh = Math.max(0.6, bh - 0.35);
      [[-1, 'var(--ink-soft)'], [1, 'var(--sub)']].forEach(([cote, col]) => {
        const lw = Math.abs(X(e.c[a], cote) - CX);
        if (lw < 0.3) return;
        make('rect', { x: cote < 0 ? CX - lw : CX, y, width: lw, height: hh,
          fill: col, opacity: a < 15 ? .85 : a < 65 ? .6 : .9 }, g);
      });
    }
    // les trois tranches, marquées sur le côté
    [[0, 15, 'moins de 15 ans'], [15, 65, '15 à 64 ans'], [65, AGE_MAX, '65 ans et plus']]
      .forEach(([a0, a1, nom]) => {
        const y = B - ((a0 + a1) / 2) * bh;
        make('line', { x1: CX + demi + 6, y1: B - a0 * bh, x2: CX + demi + 6, y2: B - a1 * bh,
          stroke: 'var(--ink-mute)', 'stroke-width': 2 }, g);
        // Écrites seulement s'il reste vraiment la place : sur une scène étroite
        // elles sortaient du cadre par la droite.
        if (bh * (a1 - a0) > 26 && X0 + W - (CX + demi + 12) > 96) {
          label(CX + demi + 12, y + 4, nom, 'ax start');
        }
      });
    label(CX - demi, B + 18, 'hommes', 'ax start');
    label(CX + demi, B + 18, 'femmes', 'ax end');
    // Centrée, et non calée à gauche : à gauche elle tombait sur « hommes ».
    if (ref) label(CX, B + 18, '· · ·  Maroc des années 1960', 'ax mid');
  }

  /* ── le modèle en cinq phases ──────────────────────────────────────── */
  function transition(X0, Y0, W, H, e) {
    label(X0, 14, 'Le modèle de la transition — l’écart entre les deux courbes est la croissance', 'lab');
    const L = X0 + 46, R = X0 + W - 12, T = Y0 + 26, B = Y0 + H - 46;
    const Y = (t) => B - (t / 50) * (B - T);            // taux pour mille
    // les courbes classiques : la mortalité tombe d'abord, la natalité ensuite
    const nat = (x) => (x < .18 ? 42 : x < .42 ? 42 - (x - .18) * 20 : x < .74 ? 37.2 - (x - .42) * 88 : 9);
    const mor = (x) => (x < .12 ? 38 : x < .46 ? 38 - (x - .12) * 82 : x < .78 ? 10.1 - (x - .46) * 4 : 8.8 + (x - .78) * 12);
    const courbe = (f, col, larg) => {
      let d = '';
      for (let k = 0; k <= 200; k++) {
        const x = k / 200;
        d += (k ? 'L' : 'M') + (L + x * (R - L)) + ' ' + Y(f(x));
      }
      make('path', { d, fill: 'none', stroke: col, 'stroke-width': larg }, g);
    };
    // l'aire entre les deux : l'accroissement naturel
    let aire = '';
    for (let k = 0; k <= 200; k++) { const x = k / 200; aire += (k ? 'L' : 'M') + (L + x * (R - L)) + ' ' + Y(nat(x)); }
    for (let k = 200; k >= 0; k--) { const x = k / 200; aire += 'L' + (L + x * (R - L)) + ' ' + Y(mor(x)); }
    make('path', { d: aire + 'Z', fill: 'var(--sub)', opacity: .16 }, g);
    courbe(nat, 'var(--sub)', 2.2);
    courbe(mor, 'var(--ink-soft)', 2.2);

    // les phases
    const bornes = [0, .18, .46, .74, .9, 1];
    const noms = ['1. ancien régime', '2. transition précoce', '3. transition tardive',
      '4. régime moderne', '5. déclin'];
    const ph = phase(e);
    bornes.slice(0, -1).forEach((x0, i) => {
      const x1 = bornes[i + 1], xm = L + (x0 + x1) / 2 * (R - L);
      if (i) make('line', { x1: L + x0 * (R - L), y1: T, x2: L + x0 * (R - L), y2: B,
        stroke: 'var(--rule)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, g);
      if (i + 1 === ph) {
        make('rect', { x: L + x0 * (R - L), y: T, width: (x1 - x0) * (R - L), height: B - T,
          fill: 'var(--sub)', opacity: .1 }, g);
      }
      // Le nom entier si la bande peut le contenir, sinon le seul numéro : cinq
      // intitulés longs sur une scène étroite se recouvrent tous.
      const place = (x1 - x0) * (R - L);
      const texte = place > noms[i].length * 6.8 ? noms[i]
        : place > 26 ? noms[i].split('.')[0] : '';
      if (texte) label(xm, T - 8, texte, i + 1 === ph ? 'tau mid' : 'ax mid');
    });
    // les taux du réglage en cours, posés sur l'échelle
    // Quand les deux taux se rejoignent — et c'est le cas en fin de transition,
    // qui est justement le moment intéressant — leurs étiquettes se superposent.
    // La seconde passe alors sous sa ligne.
    // L'étiquette du HAUT va au-dessus de sa ligne, celle du BAS en dessous —
    // et c'est bien la position à l'écran qui décide, pas le nom. En fin de
    // transition la mortalité passe au-dessus de la natalité : « natalité en
    // haut » aurait été vrai pendant trois phases sur cinq, ce qui est la pire
    // sorte de règle.
    const yb = Y(Math.min(50, e.b * 1000)), yd = Y(Math.min(50, e.d * 1000));
    [[e.b * 1000, 'var(--sub)', 'natalité', yb, yb <= yd ? -6 : 15],
      [e.d * 1000, 'var(--ink-soft)', 'mortalité', yd, yd < yb ? -6 : 15]]
      .forEach(([t, col, nom, y, dy]) => {
        make('line', { x1: L, y1: y, x2: R, y2: y, stroke: col, 'stroke-width': 1.2,
          'stroke-dasharray': '6 4', opacity: .85 }, g);
        // L'étiquette est retenue dans le cadre : un taux de 48 ‰ colle au bord
        // haut, et son texte allait se poser sur les noms de phases.
        const yt = Math.max(T + 13, Math.min(B - 6, y + dy));
        label(R - 4, yt, nom + ' ' + fr(t, 1) + ' ‰', 'ax end');
      });
    for (let t = 0; t <= 50; t += 10) {
      label(L - 8, Y(t) + 3.5, String(t), 'ax end');
      make('line', { x1: L - 4, y1: Y(t), x2: L, y2: Y(t), stroke: 'var(--ink-soft)', 'stroke-width': 1 }, g);
    }
    label(X0 + 12, (T + B) / 2, 'taux pour mille', 'lab').setAttribute('transform',
      'rotate(-90 ' + (X0 + 12) + ' ' + ((T + B) / 2) + ')');
    label((L + R) / 2, B + 30, 'le temps  →', 'lab mid');
  }

  // La phase se lit sur les taux, pas sur une date : c'est ce qui permet de
  // situer un pays sans savoir son histoire.
  function phase(e) {
    const b = e.b * 1000, d = e.d * 1000;
    if (b > 35 && d > 22) return 1;
    if (b > 30) return 2;
    if (b > 17) return 3;
    if (e.r >= 0) return 4;
    return 5;
  }
  const NOMS_PHASE = ['', 'ancien régime démographique — beaucoup de naissances, beaucoup de morts',
    'transition précoce — la mortalité chute, la natalité tient : c’est l’explosion',
    'transition tardive — la natalité chute à son tour, la croissance ralentit',
    'régime moderne — les deux taux sont bas, la population se stabilise',
    'déclin — il naît moins de monde qu’il n’en meurt'];

  function releves(e) {
    natR.set(fr(e.b * 1000, 1) + ' ‰');
    mortR.set(fr(e.d * 1000, 1) + ' ‰');
    accR.set(fr(e.r * 100, 2) + ' % par an'
      + (e.r > 0 ? '  (la population croît)' : e.r < 0 ? '  (elle diminue)' : ''));
    doubR.set(e.r > 0.0005 ? fr(Math.log(2) / e.r, 0) + ' ans pour doubler'
      : e.r < -0.0005 ? fr(Math.log(0.5) / e.r, 0) + ' ans pour perdre la moitié' : '—');
    jeuneR.set(fr(e.j * 100, 1) + ' %');
    actifR.set(fr(e.a * 100, 1) + ' %');
    vieuxR.set(fr(e.v * 100, 1) + ' %');
    medR.set(fr(e.med, 0) + ' ans');
    // Le rapport de dépendance : combien d'inactifs pour cent actifs. C'est lui
    // qui décide si une population jeune est une chance ou une charge.
    const dep = (e.j + e.v) / e.a * 100;
    depR.set(fr(dep, 0) + ' inactifs pour 100 actifs'
      + (dep < 55 ? '  —  fenêtre démographique favorable' : ''));
    const p = phase(e);
    phaseR.set('phase ' + p + ' — ' + NOMS_PHASE[p]);
  }

  function label(x, y, txt, cls) {
    const t = make('text', { x, y }, g);
    const c = cls || 'ax';
    t.setAttribute('class', c);
    const a = /\bend\b/.test(c) ? 'end' : /\bstart\b/.test(c) ? 'start'
      : /\b(pt|tau|mid)\b/.test(c) ? 'middle' : null;
    if (a) t.setAttribute('text-anchor', a);
    t.textContent = txt;
    return t;
  }

  vue.el.addEventListener('change', paint);
  fantome.el.addEventListener('change', paint);
  lab.onResize(paint);
  paint();
}
