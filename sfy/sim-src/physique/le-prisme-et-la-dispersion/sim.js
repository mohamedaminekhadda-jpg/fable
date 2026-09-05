// Le prisme et la dispersion
//
// Le §IV de la séance et l'exercice 4. Rien n'est dessiné à la main : chaque
// rayon est réfracté deux fois par la loi de Descartes, et s'il ne sort pas,
// c'est que sin r₂ a dépassé 1 — la réflexion totale arrive toute seule.
//
//   sin i₁ = n sin r₁      r₁ + r₂ = A      n sin r₂ = sin i₂      D = i₁ + i₂ − A
//
// Ce qui fait la dispersion tient en une ligne : l'indice dépend de la longueur
// d'onde, n(λ) = A_c + B_c/λ² (Cauchy). Le violet, moins « rapide » dans le
// verre, est plus dévié que le rouge. Mettez B_c à zéro et le spectre se
// referme : le prisme dévie encore, mais ne décompose plus. C'est là toute
// l'interprétation du §4-3, en une case à cocher.
//
// Et l'indice se MESURE, comme au goniomètre : on tourne le prisme jusqu'au
// minimum de déviation, où r₁ = r₂ = A/2, et alors
//
//   n = sin((A + D_m)/2) / sin(A/2)
//
// Deux couleurs suffisent ensuite pour A_c et B_c, puisque n est affine en 1/λ².
// C'est la question 2 de l'exercice 4, faite plutôt que posée.

const RAD = Math.PI / 180, DEG = 180 / Math.PI;

// Coefficients de Cauchy, calés sur des verres réels (indice à 587,6 nm et
// nombre d'Abbe). Ils ne sont pas inventés : le crown est du BK7.
const VERRES = {
  crown: { nom: 'crown — verre ordinaire', A: 1.504586, B: 0.004217 },
  flint: { nom: 'flint', A: 1.593880, B: 0.009017 },
  lourd: { nom: 'flint dense', A: 1.708645, B: 0.014279 },
};

export function mount(lab) {
  const { make, fr } = lab;

  /* ── réglages ──────────────────────────────────────────────────────── */
  lab.group('Le prisme');
  const verre = lab.select({
    label: 'Verre',
    options: Object.keys(VERRES).map((k) => ({ value: k, label: VERRES[k].nom })),
    value: 'crown',
  });
  const angA = lab.slider({ label: 'Angle au sommet A', min: 20, max: 80, step: 1, value: 60, unit: '°', dec: 0 });
  // Couper la dispersion n'est pas un truc d'affichage : c'est l'expérience de
  // pensée du §4-3. Un verre dont l'indice ne dépendrait pas de λ dévierait la
  // lumière blanche sans la décomposer.
  const disp = lab.check({ label: 'Le verre disperse (B ≠ 0)', value: true });

  lab.group('La lumière');
  const type = lab.select({
    label: 'Source',
    options: [{ value: 'blanche', label: 'lumière blanche' },
      { value: 'mono', label: 'une seule radiation' }],
    value: 'blanche',
  });
  const lam = lab.slider({ label: 'Longueur d’onde λ', min: 400, max: 750, step: 1, value: 589, unit: 'nm', dec: 0 });

  lab.group('Le rayon incident');
  const inc = lab.slider({ label: 'Incidence i₁', min: 5, max: 85, step: 0.1, value: 50, unit: '°', dec: 1 });

  lab.group('Affichage');
  const vue = lab.select({
    label: 'Ce qu’on regarde',
    options: [{ value: 'prisme', label: 'la marche des rayons' },
      { value: 'devi', label: 'le graphe D = f(i₁)' },
      { value: 'indice', label: 'le graphe n = f(1/λ²)' }],
    value: 'prisme',
  });
  const norm = lab.check({ label: 'Montrer les normales', value: true });
  const theo = lab.check({ label: 'Montrer la courbe théorique', value: false });

  /* ── les relevés ───────────────────────────────────────────────────── */
  let dPts = [];                    // {lam, i, D} — la courbe D = f(i₁)
  let nPts = [];                    // {lam, x: 1/λ², n, Dm} — l'indice mesuré
  lab.buttons([
    {
      label: '＋ Relever (i₁ , D)',
      onClick: () => {
        if (type.value !== 'mono') { dire('Passez d’abord sur une seule radiation : D dépend de la couleur.'); return; }
        const m = marche(inc.value, nOf(lam.value));
        if (!m.sortie) { dire('Ce rayon ne sort pas par la face de sortie — pas de déviation à relever.'); return; }
        if (dPts.some((p) => p.lam === lam.value && Math.abs(p.i - inc.value) < 0.05)) {
          dire('Cette incidence est déjà relevée pour ' + fr(lam.value, 0) + ' nm.'); return;
        }
        dPts.push({ lam: lam.value, i: inc.value, D: m.D });
        dPts.sort((a, b) => a.i - b.i);
        vue.set('devi'); dire(''); paint();
      },
    },
    {
      label: '＋ Relever n',
      onClick: () => {
        const mine = dPts.filter((p) => p.lam === lam.value);
        if (mine.length < 3) {
          dire('Relevez d’abord au moins trois incidences à ' + fr(lam.value, 0)
            + ' nm : sans elles, rien ne dit que vous êtes au minimum.');
          return;
        }
        const bas = mine.reduce((a, b) => (b.D < a.D ? b : a));
        if (bas === mine[0] || bas === mine[mine.length - 1]) {
          dire('Le plus petit D relevé est à un bout de vos mesures : le minimum '
            + 'est sans doute au-delà. Encadrez-le.');
          return;
        }
        // n = sin((A + D_m)/2) / sin(A/2) — la formule du goniomètre, qui ne
        // vaut QU'au minimum de déviation, là où r₁ = r₂ = A/2.
        const A = angA.value * RAD;
        const n = Math.sin((A + bas.D * RAD) / 2) / Math.sin(A / 2);
        const um = lam.value / 1000;
        nPts = nPts.filter((p) => p.lam !== lam.value);
        // y, et non n : lab.fitLine lit p.x et p.y. Sous un autre nom le point
        // est filtré comme non fini, et la droite ne se trace jamais.
        nPts.push({ lam: lam.value, x: 1 / (um * um), y: n, Dm: bas.D, i: bas.i });
        nPts.sort((a, b) => a.x - b.x);
        vue.set('indice'); dire(''); paint();
      },
    },
    { label: 'Effacer', onClick: () => { dPts = []; nPts = []; dire(''); paint(); } },
  ]);

  /* ── mesures ───────────────────────────────────────────────────────── */
  const nRead = lab.readout({ label: 'indice n(λ)', dec: 4 });
  const r1Read = lab.readout({ label: 'r₁', unit: '°', dec: 2 });
  const r2Read = lab.readout({ label: 'r₂  (A − r₁)', unit: '°', dec: 2 });
  const i2Read = lab.readout({ label: 'i₂', format: (s) => s || '—' });
  const dRead = lab.readout({ label: 'déviation D', format: (s) => s || '—', hi: true });
  const dmRead = lab.readout({ label: 'minimum théorique', format: (s) => s || '—' });
  const mesRead = lab.readout({ label: 'D minimum relevé', format: (s) => s || '—' });
  const ngRead = lab.readout({ label: 'n au goniomètre', format: (s) => s || '—', hi: true });
  const acRead = lab.readout({ label: 'A lu sur la droite', format: (s) => s || '—' });
  const bcRead = lab.readout({ label: 'B lu sur la droite', format: (s) => s || '—' });
  const note = lab.readout({ label: '', format: (s) => s || '' });
  note.show(false);
  let msg = '';
  const dire = (t) => { msg = t; note.set(t); note.show(!!t); };

  /* ── la physique ───────────────────────────────────────────────────── */
  const nOf = (nm) => {
    const v = VERRES[verre.value], um = nm / 1000;
    return v.A + (disp.value ? v.B / (um * um) : 0);
  };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const rot = (v, t) => [v[0] * Math.cos(t) - v[1] * Math.sin(t), v[0] * Math.sin(t) + v[1] * Math.cos(t)];
  const refl = (d, N) => { const k = 2 * dot(d, N); return [d[0] - k * N[0], d[1] - k * N[1]]; };
  // Descartes sous forme vectorielle. Renvoie null quand sin r dépasserait 1 :
  // c'est la réflexion totale, et elle n'est pas un cas particulier ajouté à la
  // main — elle est ce qui reste quand la formule n'a plus de solution.
  function refracte(d, n, eta) {
    let N = n, c = -dot(N, d);
    if (c < 0) { N = [-N[0], -N[1]]; c = -c; }
    const k = 1 - eta * eta * (1 - c * c);
    if (k < 0) return null;
    const s = Math.sqrt(k);
    return [eta * d[0] + (eta * c - s) * N[0], eta * d[1] + (eta * c - s) * N[1]];
  }
  const N1 = () => [-Math.cos(angA.value * RAD / 2), -Math.sin(angA.value * RAD / 2)];
  const N2 = () => [Math.cos(angA.value * RAD / 2), -Math.sin(angA.value * RAD / 2)];
  const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, Math.abs(dot(a, b))))) * DEG;

  // La marche du rayon, en angles seulement — le tracé s'en sert, et les
  // relevés aussi, si bien qu'ils ne peuvent pas diverger.
  function marche(i1, n) {
    const nn1 = N1(), nn2 = N2();
    const d0 = rot([-nn1[0], -nn1[1]], -i1 * RAD);
    const d1 = refracte(d0, nn1, 1 / n);
    if (!d1) return { d0, sortie: false, cause: 'entrée' };
    const r1 = ang(nn1, d1), r2 = ang(nn2, d1);
    const d2 = refracte(d1, nn2, n);
    if (!d2) return { d0, d1, r1, r2, sortie: false, cause: 'totale' };
    return { d0, d1, d2, r1, r2, i2: ang(nn2, d2),
      D: Math.acos(Math.max(-1, Math.min(1, dot(d0, d2)))) * DEG, sortie: true };
  }
  // Minimum de déviation : r₁ = r₂ = A/2, donc sin i = n sin(A/2).
  const dMin = (n) => {
    // Le résultat est en degrés : c'est angA.value qu'on retranche, pas A, qui
    // est en radians. Une soustraction d'unités mêlées ne lève rien et donne un
    // nombre parfaitement plausible — ici 97,59° au lieu de 38,65°.
    const s = n * Math.sin(angA.value * RAD / 2);
    return s > 1 ? null : { D: 2 * Math.asin(s) * DEG - angA.value, i: Math.asin(s) * DEG };
  };

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  // D(i) : ni l'un ni l'autre axe n'a affaire à zéro — la courbe vit entre 38°
  // et 60°, et la descendre jusqu'à l'origine aplatirait le minimum qu'on vient
  // justement chercher.
  const grDev = lab.chart({
    x: { label: 'i₁', unit: '°', zero: false },
    y: { label: 'D', unit: '°', zero: false },
  });
  // n(1/λ²) : en x il FAUT l'origine, puisque l'ordonnée à l'origine est A et
  // que c'est elle qu'on lit ; en y surtout pas, sans quoi 1,50 et 1,53 se
  // confondent.
  const grInd = lab.chart({
    x: { label: '1 / λ²', unit: 'µm⁻²' },
    y: { label: 'n', zero: false },
  });
  const PAD = { l: 20, r: 18, t: 34, b: 20 };

  function paint() {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    lam.show(type.value === 'mono');
    theo.row.hidden = vue.value !== 'devi';

    const W = w - PAD.l - PAD.r, H = h - PAD.t - PAD.b;
    if (vue.value === 'prisme') dessinPrisme(PAD.l, PAD.t, W, H);
    else if (vue.value === 'devi') dessinDevi(PAD.l, PAD.t, W, H);
    else dessinIndice(PAD.l, PAD.t, W, H);

    /* ── les relevés du bandeau ──────────────────────────────────────── */
    const n = nOf(lam.value), m = marche(inc.value, n);
    nRead.set(n);
    r1Read.set(m.r1);
    r2Read.set(m.r2);
    i2Read.set(m.sortie ? fr(m.i2, 2) + ' °' : '—');
    dRead.set(m.sortie ? fr(m.D, 2) + ' °'
      : m.cause === 'totale' ? 'réflexion totale sur la face de sortie' : 'le rayon n’entre pas');
    const dm = dMin(n);
    dmRead.set(dm ? fr(dm.D, 2) + ' °  à i₁ = ' + fr(dm.i, 2) + ' °'
      : 'aucun : A est trop grand pour ce verre');
    const mine = dPts.filter((p) => p.lam === lam.value);
    const bas = mine.length ? mine.reduce((a, b) => (b.D < a.D ? b : a)) : null;
    mesRead.set(bas ? fr(bas.D, 2) + ' °  à i₁ = ' + fr(bas.i, 1) + ' °  (' + mine.length + ' points)' : '—');
    const mesure = nPts.find((p) => p.lam === lam.value);
    ngRead.set(mesure ? fr(mesure.y, 4) + '   (vrai ' + fr(n, 4) + ')' : '—');

    const fit = nPts.length >= 2 ? lab.fitLine(nPts) : null;
    const v = VERRES[verre.value];
    acRead.set(fit ? fr(fit.b, 4) + '   (vrai ' + fr(v.A, 4) + ')' : '—');
    bcRead.set(fit ? fr(fit.a, 5) + ' µm²   (vrai ' + fr(disp.value ? v.B : 0, 5) + ')' : '—');
  }

  /* ── la marche des rayons ──────────────────────────────────────────── */
  function dessinPrisme(X0, Y0, W, H) {
    label(X0, 14, 'Le prisme, et ce que devient le rayon qui le traverse', 'lab');
    const A = angA.value * RAD;
    // Le prisme est posé au tiers gauche, l'écran au bord droit.
    const hgt = Math.min(H * 0.62, W * 0.3);
    const cx = X0 + W * 0.36, sy = Y0 + H * 0.16;
    const dx = hgt * Math.tan(A / 2);
    const S = [cx, sy], Lc = [cx - dx, sy + hgt], Rc = [cx + dx, sy + hgt];
    const xEcran = X0 + W - 6;

    make('path', { d: 'M' + S + ' L' + Lc + ' L' + Rc + ' Z',
      fill: 'var(--sub)', opacity: .1, stroke: 'var(--sub)', 'stroke-width': 1.4 }, g);
    label(cx, sy - 8, 'A = ' + fr(angA.value, 0) + ' °', 'tau');

    // le point d'entrée, à mi-hauteur de la face
    const t = 0.55;
    const P = [S[0] + t * (Lc[0] - S[0]), S[1] + t * (Lc[1] - S[1])];

    if (norm.value) {
      const nn1 = N1(), nn2 = N2();
      const Q = [S[0] + t * (Rc[0] - S[0]), S[1] + t * (Rc[1] - S[1])];
      [[P, nn1], [Q, nn2]].forEach(([pt, nv]) => make('line', {
        x1: pt[0] - nv[0] * 34, y1: pt[1] - nv[1] * 34, x2: pt[0] + nv[0] * 34, y2: pt[1] + nv[1] * 34,
        stroke: 'var(--ink-mute)', 'stroke-width': .8, 'stroke-dasharray': '4 3' }, g));
    }

    // l'écran
    make('line', { x1: xEcran, y1: Y0, x2: xEcran, y2: Y0 + H, stroke: 'var(--ink-soft)', 'stroke-width': 2.5 }, g);
    label(xEcran - 4, Y0 + H - 2, 'écran', 'ax end');

    // Un rayon par couleur. En lumière blanche on en trace 56 : le spectre
    // n'est pas peint, c'est la superposition des rayons qui le fait.
    const raies = type.value === 'blanche'
      ? Array.from({ length: 56 }, (_, k) => 400 + k * (700 - 400) / 55)
      : [lam.value];
    const larg = type.value === 'blanche' ? 1.6 : 2.2;
    let dehors = 0;
    raies.forEach((nm) => {
      const n = nOf(nm), col = wlRGB(nm);
      const m = marche(inc.value, n);
      // le rayon incident, tracé à reculons depuis le point d'entrée
      if (nm === raies[0]) {
        make('line', { x1: P[0] - m.d0[0] * 900, y1: P[1] - m.d0[1] * 900, x2: P[0], y2: P[1],
          stroke: type.value === 'blanche' ? 'var(--ink-soft)' : col, 'stroke-width': 2.2 }, g);
      }
      if (!m.d1) return;
      // dans le verre, avec au plus trois réflexions totales
      let pt = P, d = m.d1, sorti = null;
      for (let k = 0; k < 4 && !sorti; k++) {
        const h = frappe(pt, d, S, Lc, Rc);
        if (!h) break;
        make('line', { x1: pt[0], y1: pt[1], x2: h.p[0], y2: h.p[1],
          stroke: col, 'stroke-width': larg, opacity: .95 }, g);
        const out = refracte(d, h.N, n);
        if (out) { sorti = { p: h.p, d: out }; break; }
        d = refl(d, h.N); pt = h.p;
      }
      if (!sorti) { dehors++; return; }
      // dehors, jusqu'à l'écran (ou jusqu'au bord)
      const s = sorti.d[0] > 1e-6 ? (xEcran - sorti.p[0]) / sorti.d[0] : 1200;
      const q = [sorti.p[0] + sorti.d[0] * s, sorti.p[1] + sorti.d[1] * s];
      make('line', { x1: sorti.p[0], y1: sorti.p[1], x2: q[0], y2: q[1],
        stroke: col, 'stroke-width': larg, opacity: .95 }, g);
      if (Math.abs(q[0] - xEcran) < 1 && q[1] > Y0 && q[1] < Y0 + H) {
        make('rect', { x: xEcran, y: q[1] - 2.4, width: 13, height: 4.8, fill: col }, g);
      }
    });
    if (dehors === raies.length) {
      label(X0 + W / 2, Y0 + H - 16,
        'Aucun rayon ne ressort : réflexion totale sur la face de sortie.', 'tau');
    }
  }
  // Où le rayon interne rencontre-t-il la paroi ? On rend le point ET la
  // normale sortante de la face touchée, pour n'avoir jamais à les réassocier.
  function frappe(P, d, S, Lc, Rc) {
    const faces = [[S, Rc, N2()], [Lc, Rc, [0, 1]], [S, Lc, N1()]];
    let best = null;
    for (const [Q0, Q1, N] of faces) {
      const ex = Q1[0] - Q0[0], ey = Q1[1] - Q0[1];
      const den = d[0] * ey - d[1] * ex;
      if (Math.abs(den) < 1e-9) continue;
      const s = ((Q0[0] - P[0]) * ey - (Q0[1] - P[1]) * ex) / den;
      const u = (d[0] * (Q0[1] - P[1]) - d[1] * (Q0[0] - P[0])) / -den;
      if (s > 1e-6 && u >= -1e-9 && u <= 1 + 1e-9 && (!best || s < best.s)) {
        best = { s, p: [P[0] + d[0] * s, P[1] + d[1] * s], N };
      }
    }
    return best;
  }

  /* ── D = f(i₁) ─────────────────────────────────────────────────────── */
  function dessinDevi(X0, Y0, W, H) {
    label(X0, 14, 'D = f(i₁) — le minimum est plat, c’est ce qui le rend mesurable', 'lab');
    const nm = type.value === 'mono' ? lam.value : 589;
    const n = nOf(nm), col = wlRGB(nm);
    const mine = dPts.filter((p) => p.lam === nm);
    const autres = dPts.filter((p) => p.lam !== nm);
    const curves = [];
    if (theo.value) {
      const pts = [];
      for (let i = 5; i <= 85; i += 0.5) {
        const m = marche(i, n);
        if (m.sortie) pts.push([i, m.D]);
      }
      if (pts.length > 1) curves.push({ pts, color: col, dash: '4 4', width: 1.3, opacity: .8 });
    }
    grDev.draw(g, { x: X0, y: Y0, w: W, h: H }, {
      curves,
      points: autres.map((p) => ({ x: p.i, y: p.D, color: wlRGB(p.lam), r: 2.4, opacity: .4 }))
        .concat(mine.map((p) => ({ x: p.i, y: p.D, color: col }))),
    });
    if (!dPts.length) {
      label(X0 + W / 2, Y0 + H / 2, 'Choisissez une seule radiation, puis relevez D '
        + 'pour une série d’incidences.', 'ax');
    }
  }

  /* ── n = f(1/λ²) ───────────────────────────────────────────────────── */
  function dessinIndice(X0, Y0, W, H) {
    label(X0, 14, 'n = f(1/λ²) — une droite : l’ordonnée à l’origine est A, la pente est B', 'lab');
    const fit = nPts.length >= 2 ? lab.fitLine(nPts) : null;
    grInd.draw(g, { x: X0, y: Y0, w: W, h: H }, {
      points: nPts.map((p) => ({ x: p.x, y: p.y, color: wlRGB(p.lam), label: fr(p.lam, 0) + ' nm' })),
      fits: fit ? [{ a: fit.a, b: fit.b }] : [],
    });
    if (nPts.length < 2) {
      label(X0 + W / 2, Y0 + H / 2, 'Mesurez n au minimum de déviation pour deux couleurs '
        + 'au moins.', 'ax');
    }
  }

  /* ── utilitaires ───────────────────────────────────────────────────── */
  function label(x, y, txt, cls) {
    const n = make('text', { x, y }, g);
    const c = cls || 'ax';
    n.setAttribute('class', c);
    const a = /\bend\b/.test(c) ? 'end' : /\bstart\b/.test(c) ? 'start'
      : /\b(pt|tau)\b/.test(c) ? 'middle' : null;
    if (a) n.setAttribute('text-anchor', a);
    n.textContent = txt;
  }
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

  [angA, lam, inc].forEach((s) => s.el.addEventListener('input', paint));
  [verre, type, vue].forEach((s) => s.el.addEventListener('change', paint));
  [disp, norm, theo].forEach((c) => c.el.addEventListener('change', paint));
  lab.onResize(paint);
  paint();
}
