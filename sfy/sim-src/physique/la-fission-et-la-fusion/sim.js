// La fission et la fusion
//
// Le §V, et ce que les exercices en disent. Trois choses à voir, et chacune est
// un mouvement plutôt qu'un schéma :
//
//   • UNE FISSION. Le neutron arrive, le noyau s'allonge, se pince, se casse.
//     Le cours explique pourquoi c'est un NEUTRON qu'on envoie : il est neutre,
//     donc il n'est pas repoussé et atteint le noyau sans effort. Ici on peut
//     essayer avec un proton — il rebrousse chemin, et l'on voit pourquoi.
//
//   • LA CHAÎNE. Chaque fission relâche deux ou trois neutrons. Selon combien
//     provoquent à leur tour une fission — le facteur k — la chaîne s'éteint,
//     se maintient, ou s'emballe. Une seule manette sépare le réacteur de
//     l'accident, et c'est celle-là.
//
//   • LA FUSION. L'inverse, et bien plus difficile : deux noyaux positifs se
//     repoussent. La courbe d'énergie potentielle montre la barrière, et
//     l'énergie cinétique dit si on la franchit. C'est le texte de l'exercice 3
//     — « une certaine énergie est indispensable pour franchir cette barrière ».
//
// Les hauteurs de barrière ne sont pas inventées : V = Z₁Z₂ e²/(4πε₀ r), avec
// la constante 1,44 MeV·fm, et un rayon de contact r = 1,2 (A₁^⅓ + A₂^⅓) fm.

const KE2 = 1.43996454;              // e²/(4πε₀) en MeV·fm
const R0 = 1.2;                      // fm — le rayon d'un nucléon, en gros
const KB = 8.617333262e-11;          // constante de Boltzmann, en MeV/K

export function mount(lab) {
  const { make, fr } = lab;

  /* ── réglages ──────────────────────────────────────────────────────── */
  lab.group('Ce qu’on regarde');
  const vue = lab.select({
    label: 'Vue',
    options: [{ value: 'fission', label: 'une fission, au ralenti' },
      { value: 'chaine', label: 'la réaction en chaîne' },
      { value: 'fusion', label: 'la fusion et sa barrière' }],
    value: 'fission',
  });

  // Les titres de groupe sont retenus pour être masqués avec leurs réglages :
  // un intitulé seul, sans rien dessous, laisse croire qu'il manque quelque chose.
  const gProj = lab.group('Le projectile');
  // Le cours dit « on utilise le neutron car c'est une particule neutre qui
  // arrive facilement au noyau sans entrer en répulsion avec lui ». On peut donc
  // tenter le contraire, et constater.
  const proj = lab.select({
    label: 'On bombarde avec',
    options: [{ value: 'n', label: 'un neutron  (charge nulle)' },
      { value: 'p', label: 'un proton  (charge +e)' }],
    value: 'n',
  });

  const gChaine = lab.group('La chaîne');
  const kk = lab.slider({
    label: 'Facteur de multiplication k', min: 0.4, max: 2.6, step: 0.05, value: 1, dec: 2,
  });
  const gen = lab.slider({ label: 'Générations suivies', min: 3, max: 12, step: 1, value: 8, dec: 0 });

  const gFusion = lab.group('La fusion');
  const couple = lab.select({
    label: 'Noyaux à fusionner',
    options: [
      { value: 'DT', label: 'deutérium + tritium' },
      { value: 'DD', label: 'deutérium + deutérium' },
      { value: 'pp', label: 'proton + proton  (le Soleil)' },
      { value: 'CC', label: 'carbone + carbone  (les étoiles massives)' },
    ],
    value: 'DT',
  });
  const ec = lab.slider({
    label: 'Énergie cinétique apportée', min: 0.02, max: 4, step: 0.01, value: 0.2,
    unit: 'MeV', dec: 2,
  });

  /* ── mesures ───────────────────────────────────────────────────────── */
  const rBar = lab.readout({ label: 'rayon de contact', format: (s) => s || '—' });
  const hBar = lab.readout({ label: 'hauteur de la barrière', format: (s) => s || '—', hi: true });
  const passe = lab.readout({ label: 'l’énergie suffit-elle ?', format: (s) => s || '—', hi: true });
  const tBar = lab.readout({ label: 'température équivalente', format: (s) => s || '—' });
  const kRead = lab.readout({ label: 'régime de la chaîne', format: (s) => s || '—', hi: true });
  const nRead = lab.readout({ label: 'fissions à la dernière génération', format: (s) => s || '—' });
  const totRead = lab.readout({ label: 'fissions en tout', format: (s) => s || '—' });
  const eRead = lab.readout({ label: 'énergie dégagée', format: (s) => s || '—' });
  const note = lab.readout({ label: '', format: (s) => s || '' });
  note.show(false);

  /* ── la physique de la barrière ────────────────────────────────────── */
  const COUPLES = {
    DT: { a: { A: 2, Z: 1, s: 'D' }, b: { A: 3, Z: 1, s: 'T' }, q: 17.59 },
    DD: { a: { A: 2, Z: 1, s: 'D' }, b: { A: 2, Z: 1, s: 'D' }, q: 3.27 },
    pp: { a: { A: 1, Z: 1, s: 'p' }, b: { A: 1, Z: 1, s: 'p' }, q: 0.42 },
    CC: { a: { A: 12, Z: 6, s: 'C' }, b: { A: 12, Z: 6, s: 'C' }, q: 13.93 },
  };
  const paire = () => COUPLES[couple.value];
  const rContact = () => { const p = paire(); return R0 * (Math.cbrt(p.a.A) + Math.cbrt(p.b.A)); };
  const barriere = () => { const p = paire(); return KE2 * p.a.Z * p.b.Z / rContact(); };
  // V(r) : la répulsion de Coulomb tant qu'ils ne se touchent pas, puis le puits
  // nucléaire, qui n'agit qu'au contact. C'est ce brusque changement qui fait la
  // barrière : une bosse, puis un trou.
  const V = (r) => {
    const p = paire(), rc = rContact();
    if (r >= rc) return KE2 * p.a.Z * p.b.Z / r;
    return barriere() - (barriere() + p.q) * (1 - r / rc);
  };

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  const grV = lab.chart({
    x: { label: 'distance entre les deux noyaux', unit: 'fm', zero: false },
    y: { label: 'énergie potentielle', unit: 'MeV', zero: false },
  });
  const PAD = { l: 20, r: 18, t: 32, b: 18 };

  function paint(t) {
    const tt = t == null ? lab.clock.t : t;
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    const v = vue.value;
    gProj.hidden = proj.row.hidden = v !== 'fission';
    gChaine.hidden = kk.row.hidden = gen.row.hidden = v !== 'chaine';
    gFusion.hidden = couple.row.hidden = ec.row.hidden = v !== 'fusion';
    [rBar, hBar, passe, tBar].forEach((r) => r.show(v === 'fusion'));
    [kRead, nRead, totRead].forEach((r) => r.show(v === 'chaine'));
    eRead.show(v !== 'fission');

    const W = w - PAD.l - PAD.r, H = h - PAD.t - PAD.b;
    if (v === 'fission') uneFission(PAD.l, PAD.t, W, H, tt);
    else if (v === 'chaine') laChaine(PAD.l, PAD.t, W, H);
    else laFusion(PAD.l, PAD.t, W, H, tt);
    releves();
  }

  function releves() {
    const p = paire(), rc = rContact(), B = barriere();
    rBar.set(fr(rc, 2) + ' fm   —  r = 1,2 (A₁^⅓ + A₂^⅓)');
    hBar.set(fr(B, 3) + ' MeV');
    // Trois décimales des deux côtés : arrondies au centième, 0,44 et 0,4444
    // s'affichent pareil et la phrase « 0,44 < 0,44 » paraît absurde.
    const ok = ec.value >= B;
    passe.set(ok ? 'oui : ' + fr(ec.value, 3) + ' ≥ ' + fr(B, 3) + ' MeV — les noyaux se touchent'
      : 'non : ' + fr(ec.value, 3) + ' < ' + fr(B, 3) + ' MeV — ils rebroussent chemin avant de se toucher');
    // E = (3/2) k T : la température qu'il faudrait pour que l'agitation thermique
    // fournisse à elle seule cette énergie.
    tBar.set(sci(2 * B / (3 * KB), 2) + ' K');

    const k = kk.value, n = Math.round(gen.value);
    const dern = Math.pow(k, n);
    const tot = k === 1 ? n + 1 : (Math.pow(k, n + 1) - 1) / (k - 1);
    kRead.set(k < 0.98 ? 'sous-critique — la chaîne s’éteint'
      : k <= 1.02 ? 'critique — la chaîne se maintient : c’est le réglage d’un réacteur'
        : 'sur-critique — la chaîne s’emballe');
    // k^n est une MOYENNE, pas un décompte : arrondie à l'entier, 0,43 devient
    // « 0 » et 1,48 devient « 1 » — soit exactement les deux régimes qu'on
    // cherchait à distinguer, réduits au même chiffre.
    nRead.set(compte(dern));
    totRead.set(compte(tot));
    if (vue.value === 'chaine') {
      const E = tot * 200;                             // ~200 MeV par fission
      eRead.set(sci(E * 1.602176634e-13, 3) + ' J   (' + sci(E, 3) + ' MeV)');
    } else {
      eRead.set(fr(p.q, 2) + ' MeV libérés si la fusion se produit');
    }
  }

  /* ── une fission, au ralenti ───────────────────────────────────────── */
  function uneFission(X0, Y0, W, H, t) {
    const neutre = proj.value === 'n';
    label(X0, 14, neutre ? 'Un neutron lent frappe l’uranium 235'
      : 'Un proton, lui, est repoussé bien avant d’arriver', 'lab');
    const cy = Y0 + H * 0.42, cx = X0 + W * 0.5;
    const T = 6;                                       // durée d'un cycle, en s
    const ph = (t % T) / T;                            // 0 → 1

    if (!neutre) {
      // Le proton approche, ralentit, et repart : il ne touche jamais le noyau.
      const s = Math.sin(Math.PI * ph);
      const x = X0 + 40 + (cx - 90 - X0 - 40) * s;
      noyau(cx, cy, 46, 92, 143, 'U-235');
      part(x, cy, 7, 'var(--sub)', 'p');
      make('path', { d: arc(cx - 78, cy, 40), fill: 'none', stroke: 'var(--sub)',
        'stroke-width': 1.2, 'stroke-dasharray': '4 4', opacity: .7 }, g);
      label(cx - 78, cy - 52, 'répulsion électrique', 'ax');
      label(X0 + W / 2, Y0 + H - 16,
        'Deux charges positives se repoussent : le proton fait demi-tour. '
        + 'C’est pour cela qu’on bombarde au neutron.', 'tau');
      return;
    }

    // le neutron arrive, le noyau s'allonge, se pince, se casse
    if (ph < 0.28) {
      const s = ph / 0.28;
      noyau(cx, cy, 46, 92, 143, 'U-235');
      part(X0 + 40 + (cx - 60 - X0 - 40) * s, cy, 6, 'var(--ink-soft)', 'n');
      etape('le neutron arrive — il est neutre, rien ne le repousse', X0, Y0, W, H);
    } else if (ph < 0.52) {
      const s = (ph - 0.28) / 0.24;
      noyau(cx, cy, 46 + 4 * s, 92, 144, 'U-236', 1 + 0.55 * s);
      etape('capture : le noyau devient U-236, instable, et se déforme', X0, Y0, W, H);
    } else {
      const s = Math.min(1, (ph - 0.52) / 0.48);
      const d = s * W * 0.3;
      noyau(cx - 34 - d, cy, 30, 38, 56, 'Sr-94');
      noyau(cx + 34 + d, cy, 34, 54, 85, 'Xe-139');
      // les trois neutrons, éjectés dans trois directions
      [-0.9, 0, 0.9].forEach((a, i) => {
        const r = 30 + s * W * 0.34;
        part(cx + r * Math.cos(a - Math.PI / 2 + i * 0.2), cy + r * Math.sin(a - Math.PI / 2 + i * 0.2) * 0.6,
          5, 'var(--ink-soft)', 'n');
      });
      etape('scission : deux fragments très inégaux, trois neutrons, et 180 MeV',
        X0, Y0, W, H);
      if (s > 0.15) {
        label(cx, cy + 96, '≈ 180 MeV, presque tout en énergie cinétique des fragments', 'tau');
      }
    }
  }
  const arc = (x, y, r) => 'M' + (x - r * 0.7) + ' ' + (y - r * 0.7)
    + ' A' + r + ' ' + r + ' 0 0 1 ' + (x - r * 0.7) + ' ' + (y + r * 0.7);
  function etape(txt, X0, Y0, W, H) { label(X0 + W / 2, Y0 + 22, txt, 'tau'); }

  function noyau(cx, cy, R, Z, N, nom, allonge) {
    const a = allonge || 1;
    const gg = make('g', { transform: 'translate(' + cx + ' ' + cy + ') scale(' + a + ' ' + (1 / a) + ')' }, g);
    const A = Z + N;
    let s = A * 7919 + Z * 104729;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const genre = Array.from({ length: A }, (_, i) => (i < Z ? 'p' : 'n'));
    for (let i = genre.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1)); const tmp = genre[i]; genre[i] = genre[j]; genre[j] = tmp;
    }
    const OR = Math.PI * (3 - Math.sqrt(5));
    const r = Math.max(1.6, R / Math.pow(A, 1 / 3) * 0.85);
    for (let i = 0; i < A; i++) {
      const rad = R * Math.sqrt((i + 0.5) / A), th = i * OR;
      make('circle', { cx: rad * Math.cos(th), cy: rad * Math.sin(th), r,
        fill: genre[i] === 'p' ? 'var(--sub)' : 'var(--ink-mute)', opacity: .9 }, gg);
    }
    label(cx, cy + R / a + 20, nom, 'pt');
  }
  function part(x, y, r, col, nom) {
    make('circle', { cx: x, cy: y, r, fill: col }, g);
    label(x, y - r - 6, nom, 'ax');
  }

  /* ── la réaction en chaîne ─────────────────────────────────────────── */
  function laChaine(X0, Y0, W, H) {
    const k = kk.value, n = Math.round(gen.value);
    label(X0, 14, 'La réaction en chaîne — chaque fission en déclenche k autres', 'lab');
    const lh = Math.min(30, (H - 40) / (n + 1));
    const rmax = W * 0.9;
    for (let i = 0; i <= n; i++) {
      const nb = Math.pow(k, i);
      const y = Y0 + 26 + i * lh;
      const montre = Math.min(48, Math.max(1, Math.round(nb)));
      const r = Math.max(1.8, Math.min(5, lh / 3.4));
      const pas = Math.min(16, rmax / Math.max(1, montre));
      for (let j = 0; j < montre; j++) {
        make('circle', { cx: X0 + W / 2 + (j - (montre - 1) / 2) * pas, cy: y, r,
          fill: k > 1.02 ? 'var(--sub)' : k < 0.98 ? 'var(--ink-mute)' : 'var(--ink-soft)' }, g);
      }
      const txt = compte(nb);
      label(X0 + 2, y + 4, 'génération ' + i, 'ax start');
      label(X0 + W - 2, y + 4, txt + (Math.round(nb) > 48 ? '  (48 dessinés)' : ''), 'ax end');
    }
    const bas = Y0 + 26 + (n + 1) * lh + 14;
    if (bas < Y0 + H) {
      label(X0 + W / 2, bas,
        k < 0.98 ? 'k < 1 : chaque génération est plus maigre — la chaîne s’éteint toute seule.'
          : k <= 1.02 ? 'k = 1 : chaque fission en fait exactement une autre. C’est un réacteur.'
            : 'k > 1 : chaque génération est plus nombreuse — la chaîne s’emballe.', 'tau');
    }
  }

  /* ── la fusion et sa barrière ──────────────────────────────────────── */
  function laFusion(X0, Y0, W, H, t) {
    const p = paire(), rc = rContact(), B = barriere(), E = ec.value;
    label(X0, 14, 'Deux noyaux positifs se repoussent : il faut de l’élan pour se toucher', 'lab');

    /* en haut, les deux noyaux qui s'approchent */
    const hTop = Math.min(120, H * 0.34);
    const cy = Y0 + hTop / 2 + 6;
    const cx = X0 + W / 2;
    const T = 5, ph = (t % T) / T;
    // Le point de rebroussement : là où toute l'énergie cinétique est devenue
    // potentielle. Si E dépasse la barrière, il n'y en a pas.
    const rStop = E >= B ? rc : KE2 * p.a.Z * p.b.Z / E;
    // La fenêtre est plafonnée à dix rayons de contact. À très basse énergie le
    // point de rebroussement part à des milliers de fermis : sans plafond, tout
    // ce qui compte — la bosse, le contact — se tasse contre l'axe et disparaît.
    // Le rebroussement sort alors du cadre, ce qui est honnête : il est loin.
    const rMax = Math.min(rc * 10, Math.max(rc * 3.5, rStop * 1.2));
    const rVu = Math.min(rStop, rMax * 0.94);          // ce qu'on peut montrer
    const s = Math.sin(Math.PI * ph);
    const rNow = E >= B && ph > 0.5 ? 0 : rMax - (rMax - rVu) * s;
    const ech = (W * 0.34) / rMax;
    const fusionne = E >= B && ph > 0.5;

    if (fusionne) {
      noyauSimple(cx, cy, 26, 'var(--sub)', p.a.A + p.b.A - 1 + '');
      label(cx, cy + 46, 'fusion : ' + fr(p.q, 2) + ' MeV libérés', 'tau');
    } else {
      noyauSimple(cx - rNow * ech / 2, cy, 15, 'var(--sub)', p.a.s);
      noyauSimple(cx + rNow * ech / 2, cy, 15, 'var(--ink-soft)', p.b.s);
      label(cx, cy + 46, E >= B ? 'ils vont se toucher' : 'ils vont rebrousser chemin', 'tau');
    }

    /* en bas, l'énergie potentielle */
    const yG = Y0 + hTop + 26, hG = Y0 + H - yG;
    if (hG < 110) return;
    label(X0, yG - 8, 'Énergie potentielle du couple, en fonction de leur distance', 'lab');
    const pts = [];
    for (let i = 0; i <= 260; i++) {
      const r = rc * 0.18 + (rMax - rc * 0.18) * i / 260;
      pts.push([r, V(r)]);
    }
    grV.draw(g, { x: X0, y: yG, w: W, h: hG }, {
      curves: [{ pts, color: 'var(--ink-soft)', width: 1.8 }],
      fits: [{ a: 0, b: E, color: 'var(--sub)', dash: '6 4' }],
      points: [{ x: rc, y: B, color: 'var(--sub)', r: 4 }],
    });
    const pB = grV.at(rc, B), pE = grV.at(rMax * 0.98, E);
    if (pB) label(pB.x, pB.y - 10, 'barrière ' + fr(B, 2) + ' MeV', 'tau');
    if (pE) label(pE.x, pE.y - 8, 'énergie apportée ' + fr(E, 2) + ' MeV', 'ax end');
    const pr = grV.at(Math.max(rNow, rc * 0.2), V(Math.max(rNow, rc * 0.2)));
    if (pr && !fusionne) make('circle', { cx: pr.x, cy: pr.y, r: 4.5, fill: 'var(--sub)' }, g);
  }
  function noyauSimple(x, y, r, col, nom) {
    make('circle', { cx: x, cy: y, r, fill: col, opacity: .85 }, g);
    label(x, y + 5, nom, 'pt');
  }

  /* ── utilitaires ───────────────────────────────────────────────────── */
  const compte = (x) => (x < 10 ? fr(x, 2) : x < 1e5 ? fr(Math.round(x), 0) : sci(x, 3));
  const exposant = (e) => String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]);
  const sci = (x, d) => {
    if (!isFinite(x) || x === 0) return '0';
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

  [vue, proj, couple].forEach((s) => s.el.addEventListener('change', () => paint()));
  [kk, gen, ec].forEach((s) => s.el.addEventListener('input', () => paint()));
  lab.onResize(() => paint());
  lab.loop((dt, t) => paint(t));
}
