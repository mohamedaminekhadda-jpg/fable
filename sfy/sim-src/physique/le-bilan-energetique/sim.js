// Le bilan énergétique d'une réaction nucléaire
//
// Le §VI en entier, et le §II qui le fonde. Une réaction nucléaire se lit en
// trois temps, et cette simulation les met côte à côte :
//
//   1. elle se CONSERVE — même A, même Z de part et d'autre (lois de Soddy) ;
//   2. elle PERD de la masse — Δm = m(avant) − m(après), et E = Δm c² ;
//   3. elle DESCEND — le diagramme du §6-2 montre le système passer d'un cran
//      au cran inférieur, et la hauteur de la marche est l'énergie libérée.
//
// Le diagramme prend pour zéro l'état où TOUS les nucléons sont libres et au
// repos, tout en haut. Un noyau est alors à l'altitude −E_ℓ : plus il est lié,
// plus il est bas. La réaction va d'un niveau au niveau du dessous, et ce qu'elle
// libère est la différence — ce qui est exactement E = ΣE_ℓ(après) − ΣE_ℓ(avant).
//
// Les deux chemins de calcul, par les masses et par les énergies de liaison,
// sont affichés ensemble. Qu'ils tombent d'accord au dix-milliardième près n'est
// pas une coïncidence : c'est le §6-1. Et là où ils divergent — la radioactivité
// β — la simulation le dit au lieu de choisir.

import { REACTIONS, bilan, U_MEV, U_KG, MEV_J, NA } from './noyaux.js';

export function mount(lab) {
  const { make, fr } = lab;

  /* ── réglages ──────────────────────────────────────────────────────── */
  lab.group('La réaction');
  const quelle = lab.select({
    label: 'Réaction',
    options: REACTIONS.map((r) => ({ value: r.id, label: r.titre })),
    value: 'fission1',
  });
  lab.group('Affichage');
  const vue = lab.select({
    label: 'Ce qu’on regarde',
    options: [{ value: 'diagramme', label: 'le diagramme énergétique' },
      { value: 'masses', label: 'la pesée des deux côtés' }],
    value: 'diagramme',
  });

  /* ── mesures ───────────────────────────────────────────────────────── */
  const consA = lab.readout({ label: 'conservation de A', format: (s) => s || '—' });
  const consZ = lab.readout({ label: 'conservation de Z', format: (s) => s || '—' });
  const mAvR = lab.readout({ label: 'masse avant', format: (s) => s || '—' });
  const mApR = lab.readout({ label: 'masse après', format: (s) => s || '—' });
  const dmR = lab.readout({ label: 'perte de masse Δm', format: (s) => s || '—', hi: true });
  const eR = lab.readout({ label: 'E = Δm c²', format: (s) => s || '—', hi: true });
  const eJR = lab.readout({ label: 'la même, en joules', format: (s) => s || '—' });
  const liaR = lab.readout({ label: 'par les énergies de liaison', format: (s) => s || '—' });
  const accR = lab.readout({ label: 'les deux voies', format: (s) => s || '—' });
  const molR = lab.readout({ label: 'pour une mole de noyaux', format: (s) => s || '—' });
  const note = lab.readout({ label: '', format: (s) => s || '' });
  note.show(false);

  const reaction = () => REACTIONS.find((r) => r.id === quelle.value);

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  const PAD = { l: 20, r: 18, t: 30, b: 18 };

  function paint() {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    const r = reaction(), b = bilan(r);
    const W = w - PAD.l - PAD.r;

    /* l'équation, toujours en tête : c'est elle qu'on étudie */
    const hEq = equation(PAD.l, PAD.t, W, b, r);
    const Y0 = PAD.t + hEq + 14, H = h - Y0 - PAD.b;
    if (H > 120) {
      if (vue.value === 'diagramme') diagramme(PAD.l, Y0, W, H, b, r);
      else pesee(PAD.l, Y0, W, H, b);
    }

    /* ── les relevés ─────────────────────────────────────────────────── */
    consA.set(b.A[0] + ' avant, ' + b.A[1] + ' après — '
      + (b.A[0] === b.A[1] ? 'conservé' : 'NON conservé'));
    consZ.set(b.Z[0] + ' avant, ' + b.Z[1] + ' après — '
      + (b.Z[0] === b.Z[1] ? 'conservé' : 'NON conservé'));
    mAvR.set(fr(b.mAv, 6) + ' u');
    mApR.set(fr(b.mAp, 6) + ' u');
    dmR.set(fr(b.dm, 6) + ' u   soit ' + sci(b.dm * U_KG, 3) + ' kg');
    eR.set(fr(b.E, 3) + ' MeV');
    eJR.set(sci(b.E * MEV_J, 4) + ' J');
    if (b.parLiaisons == null) {
      liaR.set('ne s’applique pas ici');
      accR.set('—');
      note.set('Dans une désintégration β, un neutron se change en proton : le '
        + 'nombre de protons et celui de neutrons ne sont plus les mêmes des deux '
        + 'côtés. « L’énergie qu’il faudrait pour tout défaire en nucléons libres » '
        + 'ne compare alors plus les mêmes objets, et seule la pesée fait foi.');
      note.show(true);
    } else {
      liaR.set('ΣE(après) − ΣE(avant) = ' + fr(b.parLiaisons, 3) + ' MeV');
      const ecart = Math.abs(b.E - b.parLiaisons);
      accR.set(ecart < 1e-6 ? 'd’accord au millionième de MeV près'
        : 'écart de ' + fr(ecart, 6) + ' MeV');
      note.show(false);
    }
    molR.set(sci(b.E * MEV_J * NA, 3) + ' J par mole de noyaux');
  }

  /* ── l'équation, avec ses sommes ───────────────────────────────────── */
  function equation(X0, Y0, W, b, r) {
    const membres = [];
    b.av.forEach((o, i) => { if (i) membres.push({ op: '+' }); membres.push({ o }); });
    membres.push({ op: '→' });
    b.ap.forEach((o, i) => { if (i) membres.push({ op: '+' }); membres.push({ o }); });

    const wOp = 22, wNoy = 62;
    const total = membres.reduce((s, m) => s + (m.op ? wOp : wNoy), 0);
    const ech = Math.min(1, W / Math.max(1, total));
    let x = X0 + (W - total * ech) / 2;
    const yc = Y0 + 30;
    membres.forEach((m) => {
      if (m.op) {
        label(x + wOp * ech / 2, yc + 5, m.op, 'tau');
        x += wOp * ech;
        return;
      }
      const o = m.o, cx = x + wNoy * ech / 2;
      if (o.n > 1) label(cx - 20 * ech, yc + 5, o.n + ' ', 'tau');
      // la notation du cours : A en haut à gauche, Z en bas à gauche
      label(cx + 4, yc + 5, o.s, 'noy');
      label(cx - 8, yc - 5, String(o.A), 'ax end');
      label(cx - 8, yc + 12, String(o.Z), 'ax end');
      x += wNoy * ech;
    });
    // les sommes, sous chaque côté
    const okA = b.A[0] === b.A[1], okZ = b.Z[0] === b.Z[1];
    label(X0, Y0 + 4, 'La réaction', 'lab');
    label(X0 + W, Y0 + 4,
      'ΣA : ' + b.A[0] + ' = ' + b.A[1] + (okA ? '  ✓' : '  ✗')
      + '     ΣZ : ' + b.Z[0] + ' = ' + b.Z[1] + (okZ ? '  ✓' : '  ✗'), 'ax end');
    // le mot d'explication, sur deux lignes si besoin
    const lignes = couper(r.mot, Math.max(40, Math.floor(W / 7.6)));
    lignes.forEach((l, i) => label(X0, yc + 34 + i * 15, l, 'ax start'));
    return 30 + 34 + lignes.length * 15;
  }

  /* ── le diagramme énergétique du §6-2 ──────────────────────────────── */
  function diagramme(X0, Y0, W, H, b, r) {
    label(X0, Y0, 'Le diagramme énergétique — zéro en haut : tous les nucléons libres', 'lab');
    const T = Y0 + 22, B = Y0 + H - 56;                // 56 : la marche s'écrit dessous
    // Les altitudes : 0 pour les nucléons libres, −E_ℓ pour un système lié.
    const emax = Math.max(b.ElAv, b.ElAp);
    if (!(emax > 0)) return;
    const Y = (e) => T + (e / emax) * (B - T);          // e = énergie de liaison
    // Les paliers sont resserrés vers le centre pour dégager une bande de chaque
    // côté : c'est là que vont les légendes des flèches, qui autrement sortaient
    // du cadre par la gauche.
    const xA = X0 + W * 0.34, xB = X0 + W * 0.72, lw = W * 0.18;

    // le niveau des nucléons libres
    make('line', { x1: X0 + 10, y1: T, x2: X0 + W - 10, y2: T,
      stroke: 'var(--ink-mute)', 'stroke-width': 1.2, 'stroke-dasharray': '5 4' }, g);
    label(X0 + W - 10, T - 6, 'les ' + b.A[0] + ' nucléons, libres et séparés — origine des énergies', 'ax end');

    const palier = (x, e, titre, sous) => {
      const y = Y(e);
      make('line', { x1: x - lw / 2, y1: y, x2: x + lw / 2, y2: y,
        stroke: 'var(--sub)', 'stroke-width': 2.6 }, g);
      label(x, y - 9, titre, 'pt');
      label(x, y + 18, sous, 'ax');
      return y;
    };
    const yAv = palier(xA, b.ElAv, 'avant', fr(-b.ElAv, 1) + ' MeV');
    const yAp = palier(xB, b.ElAp, 'après', fr(-b.ElAp, 1) + ' MeV');

    // les deux flèches du cours : ce qu'il faudrait fournir, ce qui est rendu
    // Deux lignes courtes plutôt qu'une longue : une légende d'un seul tenant ne
    // rentre pas dans la bande latérale dès que la fenêtre se réduit.
    const flecheV = (x, y1, y2, l1, l2, cote) => {
      make('line', { x1: x, y1, x2: x, y2, stroke: 'var(--ink-soft)', 'stroke-width': 1.3 }, g);
      const sgn = y2 > y1 ? 1 : -1;
      make('path', { d: 'M' + x + ' ' + y2 + ' L' + (x - 5) + ' ' + (y2 - sgn * 9)
        + ' L' + (x + 5) + ' ' + (y2 - sgn * 9) + ' Z', fill: 'var(--ink-soft)' }, g);
      const cls = cote < 0 ? 'ax end' : 'ax start';
      cadrer(label(x + cote * 8, (y1 + y2) / 2 - 3, l1, cls), X0 + 2, X0 + W - 2);
      cadrer(label(x + cote * 8, (y1 + y2) / 2 + 12, l2, cls), X0 + 2, X0 + W - 2);
    };
    flecheV(xA - lw / 2 - 14, yAv, T + 2, 'il faudrait fournir', fr(b.ElAv, 1) + ' MeV', -1);
    flecheV(xB + lw / 2 + 14, T + 2, yAp, 'la formation rend', fr(b.ElAp, 1) + ' MeV', 1);

    // la marche entre les deux niveaux : l'énergie libérée
    const xm = (xA + xB) / 2;
    make('line', { x1: xA + lw / 2, y1: yAv, x2: xm + 30, y2: yAv,
      stroke: 'var(--rule)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, g);
    make('line', { x1: xm - 30, y1: yAp, x2: xB - lw / 2, y2: yAp,
      stroke: 'var(--rule)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, g);
    const bas = yAp > yAv;
    make('line', { x1: xm, y1: yAv, x2: xm, y2: yAp, stroke: 'var(--sub)', 'stroke-width': 2 }, g);
    make('path', { d: 'M' + xm + ' ' + yAp + ' L' + (xm - 6) + ' ' + (yAp + (bas ? -11 : 11))
      + ' L' + (xm + 6) + ' ' + (yAp + (bas ? -11 : 11)) + ' Z', fill: 'var(--sub)' }, g);
    // La légende de la marche va SOUS les deux paliers, à une hauteur fixe. Posée
    // au milieu de la marche, elle se superposait aux paliers dès que ceux-ci
    // étaient proches — et pour une désintégration α ils le sont beaucoup.
    const yTxt = Math.max(yAv, yAp) + 34;
    make('line', { x1: xm, y1: Math.max(yAv, yAp) + 4, x2: xm, y2: yTxt - 12,
      stroke: 'var(--rule)', 'stroke-width': 1, 'stroke-dasharray': '2 3' }, g);
    label(xm, yTxt, (bas ? 'le système descend et libère ' : 'le système monte : il faut apporter ')
      + fr(Math.abs(b.E), 1) + ' MeV', 'tau');
  }

  /* ── la pesée, côté à côté ─────────────────────────────────────────── */
  function pesee(X0, Y0, W, H, b) {
    label(X0, Y0, 'La pesée — la barre du bas est plus courte, et ce qui manque est l’énergie', 'lab');
    const bx = X0 + 130, bw = W - 150;
    if (bw < 160) return;
    const bh = 26, y1 = Y0 + 34, y2 = y1 + 52;
    const maxi = Math.max(b.mAv, b.mAp);
    const barre = (y, m, titre, col) => {
      make('rect', { x: bx, y, width: bw * (m / maxi), height: bh, rx: 3, fill: col, opacity: .5 }, g);
      make('rect', { x: bx, y, width: bw, height: bh, rx: 3, fill: 'none', stroke: 'var(--rule)', 'stroke-width': 1 }, g);
      label(bx - 10, y + 18, titre, 'ax end');
      label(bx + bw - 6, y + 18, fr(m, 6) + ' u', 'ax end');
    };
    barre(y1, b.mAv, 'avant', 'var(--ink-soft)');
    barre(y2, b.mAp, 'après', 'var(--sub)');

    // À l'échelle, l'écart ne se voit pas — c'est bien le propos.
    // La phrase est repliée sur la largeur disponible : d'un seul tenant elle
    // sortait du cadre sous 900 px. Le repli est calculé AVANT de placer la
    // barre, car chaque ligne supplémentaire lui prend de la hauteur — la
    // calculer après, c'était retomber sur la barre du dessus.
    const dit = couper('À cette échelle l’écart est invisible : Δm ne vaut que '
      + fr(100 * b.dm / b.mAv, 4) + ' % de la masse. Grossi 500 fois :',
    Math.max(30, Math.floor(W / 6.6)));
    const yl = y2 + 56 + (dit.length - 1) * 14;
    // Sur une scène courte, la loupe ne tient pas. Plutôt que de la dessiner
    // dans le vide sous le cadre, on renonce à elle et on garde le chiffre :
    // c'est lui qui compte, la loupe n'en est que l'illustration.
    if (yl + bh + 26 > Y0 + H) {
      label(X0, Y0 + H - 4, 'Δm = ' + fr(b.dm, 6) + ' u   →   E = Δm c² = '
        + fr(b.E, 3) + ' MeV', 'tau start');
      return;
    }
    dit.forEach((l, i) => label(X0, yl - 12 - (dit.length - 1 - i) * 14, l, 'ax start'));
    const f = 500;
    const lw = Math.min(bw, bw * (b.dm / maxi) * f);
    make('rect', { x: bx, y: yl, width: lw, height: bh, rx: 3, fill: 'var(--sub)' }, g);
    make('rect', { x: bx, y: yl, width: bw, height: bh, rx: 3, fill: 'none', stroke: 'var(--rule)', 'stroke-width': 1 }, g);
    label(bx - 10, yl + 18, 'Δm', 'ax end');
    label(bx, yl + bh + 18, 'Δm = ' + fr(b.dm, 6) + ' u   →   E = Δm c² = ' + fr(b.E, 3) + ' MeV', 'tau start');
  }

  /* ── utilitaires ───────────────────────────────────────────────────── */
  // La puissance de dix est CALCULÉE, jamais écrite d'avance : un exposant fixé
  // à la main tient pour la réaction qu'on avait sous les yeux en l'écrivant, et
  // affiche « 1 729,673 × 10¹⁰ » pour la suivante.
  const exposant = (e) => String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]);
  const sci = (x, d) => {
    if (!isFinite(x) || x === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(x)));
    return fr(x / Math.pow(10, e), d) + ' × 10' + exposant(e);
  };
  function couper(texte, n) {
    const mots = texte.split(' '), out = []; let l = '';
    for (const m of mots) {
      if ((l + ' ' + m).trim().length > n) { out.push(l.trim()); l = m; } else l += ' ' + m;
    }
    if (l.trim()) out.push(l.trim());
    return out;
  }
  function label(x, y, txt, cls) {
    const t = make('text', { x, y }, g);
    const c = cls || 'ax';
    t.setAttribute('class', c === 'noy' ? 'pt' : c);
    if (c === 'noy') t.setAttribute('font-size', '19');
    const a = /\bend\b/.test(c) ? 'end' : /\bstart\b/.test(c) ? 'start'
      : /\b(pt|tau|noy)\b/.test(c) ? 'middle' : null;
    if (a) t.setAttribute('text-anchor', a);
    t.textContent = txt;
    return t;
  }
  // On mesure l'encre plutôt que d'estimer la largeur d'un texte : la légende
  // de droite ne dépassait que sur les scènes étroites, de cinq pixels.
  function cadrer(n, minX, maxX) {
    let b; try { b = n.getBBox(); } catch { return n; }
    if (!b.width) return n;
    const dx = b.x < minX ? minX - b.x : b.x + b.width > maxX ? maxX - (b.x + b.width) : 0;
    if (dx) n.setAttribute('x', +n.getAttribute('x') + dx);
    return n;
  }

  [quelle, vue].forEach((s) => s.el.addEventListener('change', paint));
  lab.onResize(paint);
  paint();
}
