// Du noyau à la centrale
//
// Les exercices du §VII, qui posent tous la même question sous des habits
// différents : entre une réaction et une facture d'électricité, il y a une
// chaîne de conversions, et elle est toujours la même.
//
//   une réaction  →  ×N_A/M  →  un gramme  →  ÷P  →  une durée  →  ÷rendement
//
// Chaque maillon est écrit, avec ses chiffres, parce que c'est là que les
// exercices se perdent — pas dans la physique, dans le passage du MeV au joule
// et du noyau à la mole.
//
// Et pour que les nombres veuillent dire quelque chose, ils sont posés sur une
// échelle logarithmique commune : une fission, une combustion, un gramme, une
// centrale, une année de consommation mondiale. Six ordres de grandeur séparent
// le noyau de la molécule, et cela se voit d'un coup d'œil au lieu de se déduire.

const NA = 6.02214076e23;
const MEV_J = 1.602176634e-13;
const AN = 365.25 * 24 * 3600;                     // une année, en secondes

// Les combustibles. L'énergie par réaction vient du cours ; la masse molaire est
// celle du combustible consommé.
const FEU = {
  u235: {
    nom: 'uranium 235', court: 'uranium 235', unite: 'noyaux', M: 235,
    E: 179.3, quoi: 'par fission',
    mot: 'La fission d’un noyau d’uranium 235 libère environ 180 MeV.',
  },
  dt: {
    nom: 'mélange deutérium + tritium', court: 'D + T', unite: 'paires D+T', M: 5.03,
    E: 17.59, quoi: 'par fusion',
    mot: 'Cinq nucléons seulement, mais 17,6 MeV : par gramme, la fusion bat '
      + 'largement la fission.',
  },
  butane: {
    nom: 'butane C₄H₁₀', court: 'butane', unite: 'molécules', M: 58.12,
    E: 2877e3 / NA / MEV_J, quoi: 'par molécule brûlée',
    mot: 'La combustion d’une mole de butane dégage 2 877 kJ. Ramenée à une '
      + 'molécule, c’est trois millionièmes de MeV.',
  },
};

// Des repères, pour que les ordres de grandeur aient un sens. En joules.
const REPERES = [
  { nom: 'une fission d’uranium 235', E: 179.3 * MEV_J },
  { nom: 'une fusion deutérium + tritium', E: 17.59 * MEV_J },
  { nom: 'une molécule de butane qui brûle', E: 2877e3 / NA },
  { nom: 'un gramme de butane', E: 2877e3 / 58.12 },
  { nom: 'un gramme d’uranium 235', E: NA / 235 * 179.3 * MEV_J },
  { nom: 'un logement français, un an', E: 1.5e4 * 3.6e6 },
  { nom: 'une centrale de 1 GW, un an', E: 1e9 * AN },
  { nom: 'la consommation mondiale, un an', E: 6.0e20 },
];

export function mount(lab) {
  const { make, fr } = lab;

  /* ── réglages ──────────────────────────────────────────────────────── */
  lab.group('Le combustible');
  const feu = lab.select({
    label: 'On brûle', value: 'u235',
    options: Object.keys(FEU).map((k) => ({ value: k, label: FEU[k].nom })),
  });
  const masse = lab.slider({ label: 'Masse', min: 1, max: 1000, step: 1, value: 1, unit: 'g', dec: 0 });
  lab.group('Ce qu’on en fait');
  const puis = lab.slider({ label: 'Puissance demandée', min: 1, max: 1500, step: 1, value: 1, unit: 'MW', dec: 0 });
  const rend = lab.slider({ label: 'Rendement de la centrale', min: 10, max: 100, step: 1, value: 100, unit: '%', dec: 0 });
  lab.group('Affichage');
  const vue = lab.select({
    label: 'Ce qu’on regarde',
    options: [{ value: 'chaine', label: 'la chaîne de calcul' },
      { value: 'echelle', label: 'l’échelle des énergies' }],
    value: 'chaine',
  });

  /* ── mesures ───────────────────────────────────────────────────────── */
  const nRead = lab.readout({ label: 'nombre de réactions', format: (s) => s || '—' });
  const e1Read = lab.readout({ label: 'énergie d’une réaction', format: (s) => s || '—' });
  const eRead = lab.readout({ label: 'énergie totale', format: (s) => s || '—', hi: true });
  const durRead = lab.readout({ label: 'durée à cette puissance', format: (s) => s || '—', hi: true });
  const nucRead = lab.readout({ label: 'puissance à fournir', format: (s) => s || '—' });
  const anRead = lab.readout({ label: 'consommation en un an', format: (s) => s || '—' });
  const butRead = lab.readout({ label: 'même énergie en butane', format: (s) => s || '—' });

  /* ── la physique, qui n'est que de l'arithmétique bien tenue ───────── */
  const bilan = () => {
    const f = FEU[feu.value];
    const n = masse.value / f.M * NA;                 // nombre de réactions
    const E = n * f.E * MEV_J;                        // joules
    const Pnuc = puis.value * 1e6 / (rend.value / 100);
    return { f, n, E, Pnuc, duree: E / Pnuc, anEnergie: Pnuc * AN };
  };

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  const PAD = { l: 20, r: 18, t: 30, b: 18 };

  function paint() {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    const W = w - PAD.l - PAD.r, H = h - PAD.t - PAD.b;
    const b = bilan();
    if (vue.value === 'chaine') laChaine(PAD.l, PAD.t, W, H, b);
    else lEchelle(PAD.l, PAD.t, W, H, b);

    nRead.set(sci(b.n, 3) + ' ' + b.f.unite);
    e1Read.set(b.f.E < 0.001 ? sci(b.f.E, 3) + ' MeV' : fr(b.f.E, 2) + ' MeV')
      ;
    eRead.set(sci(b.E, 3) + ' J');
    durRead.set(duree(b.duree));
    nucRead.set(sci(b.Pnuc, 3) + ' W   (' + fr(b.Pnuc / 1e6, 1) + ' MW thermiques pour '
      + fr(puis.value, 0) + ' MW utiles)');
    anRead.set(sci(b.anEnergie, 3) + ' J,  soit ' + masseVoulue(b.anEnergie) + ' ' + de(b.f.nom));
    const mBut = b.E / (2877e3 / 58.12);
    butRead.set(feu.value === 'butane' ? 'c’est déjà du butane'
      : mBut > 1e6 ? fr(mBut / 1e6, 2) + ' tonnes' : fr(mBut / 1000, 2) + ' kg');
  }
  const masseVoulue = (E) => {
    const f = FEU[feu.value];
    const m = E / (NA / f.M * f.E * MEV_J);            // en grammes
    return m > 1e6 ? fr(m / 1e6, 2) + ' t' : m > 1000 ? fr(m / 1000, 2) + ' kg' : fr(m, 1) + ' g';
  };
  function duree(s) {
    if (!isFinite(s)) return '—';
    if (s < 60) return fr(s, 1) + ' s';
    if (s < 3600) return fr(s / 60, 1) + ' min';
    if (s < 86400) return fr(s / 3600, 1) + ' h';
    if (s < AN) return fr(s / 86400, 1) + ' jours';
    return fr(s / AN, 2) + ' ans';
  }

  /* ── la chaîne de calcul, maillon par maillon ──────────────────────── */
  function laChaine(X0, Y0, W, H, b) {
    label(X0, 14, 'De la réaction à la facture — chaque flèche est une conversion', 'lab');
    const etapes = [
      { t: 'une ' + (feu.value === 'butane' ? 'molécule' : 'réaction'),
        v: fr(b.f.E, feu.value === 'butane' ? 6 : 2) + ' MeV', s: b.f.quoi },
      { t: 'en joules', v: sci(b.f.E * MEV_J, 3) + ' J', s: '× 1,602 × 10⁻¹³' },
      { t: fr(masse.value, 0) + ' g de combustible', v: sci(b.n, 3) + ' réactions',
        s: '× N_A / M,  M = ' + fr(b.f.M, 2) + ' g/mol' },
      { t: 'énergie disponible', v: sci(b.E, 3) + ' J', s: 'les deux précédents, multipliés' },
      { t: 'à ' + fr(puis.value, 0) + ' MW utiles', v: duree(b.duree),
        s: rend.value < 100 ? 'rendement ' + fr(rend.value, 0) + ' % → il faut '
          + fr(b.Pnuc / 1e6, 1) + ' MW thermiques' : 'rendement 100 % — cas idéal' },
    ];
    const n = etapes.length;
    const bh = Math.min(54, (H - 30) / n);
    etapes.forEach((e, i) => {
      const y = Y0 + 22 + i * bh;
      make('rect', { x: X0, y, width: W, height: bh - 10, rx: 6,
        fill: i === n - 1 || i === 3 ? 'var(--sub)' : 'var(--ink-mute)',
        opacity: i === n - 1 || i === 3 ? .18 : .08 }, g);
      label(X0 + 14, y + bh / 2 - 2, e.t, 'ax start');
      label(X0 + W - 14, y + bh / 2 - 2, e.v, 'tau end');
      label(X0 + 14, y + bh / 2 + 13, e.s, 'ax start');
      if (i < n - 1) {
        const ym = y + bh - 9;
        make('path', { d: 'M' + (X0 + 30) + ' ' + ym + ' L' + (X0 + 24) + ' ' + (ym - 5)
          + ' L' + (X0 + 36) + ' ' + (ym - 5) + ' Z', fill: 'var(--ink-mute)',
          transform: 'rotate(180 ' + (X0 + 30) + ' ' + (ym - 2.5) + ')' }, g);
      }
    });
  }

  /* ── l'échelle des énergies ────────────────────────────────────────── */
  function lEchelle(X0, Y0, W, H, b) {
    label(X0, 14, 'L’échelle des énergies — chaque graduation vaut mille fois la précédente', 'lab');
    // Le nom court, pas le nom complet : la colonne des intitulés est étroite,
    // et « 1 000 g de mélange deutérium + tritium » en sortait par la gauche.
    const tous = REPERES.concat([{ nom: fr(masse.value, 0) + ' g ' + de(b.f.court), E: b.E, moi: true }]);
    const lo = Math.log10(Math.min(...tous.map((r) => r.E))) - 0.6;
    const hi = Math.log10(Math.max(...tous.map((r) => r.E))) + 0.4;
    const X = (E) => X0 + 210 + (Math.log10(E) - lo) / (hi - lo) * (W - 230);
    const bh = Math.min(30, (H - 40) / tous.length);
    // les décades, tous les trois crans pour ne pas noircir le fond
    for (let e = Math.ceil(lo); e <= hi; e += 3) {
      const x = X(Math.pow(10, e));
      make('line', { x1: x, y1: Y0 + 20, x2: x, y2: Y0 + 20 + tous.length * bh,
        stroke: 'var(--rule)', 'stroke-width': 1, opacity: .6 }, g);
      label(x, Y0 + 34 + tous.length * bh, '10' + exposant(e) + ' J', 'ax');
    }
    tous.sort((a, c) => a.E - c.E).forEach((r, i) => {
      const y = Y0 + 26 + i * bh;
      make('line', { x1: X0 + 210, y1: y, x2: X(r.E), y2: y,
        stroke: r.moi ? 'var(--sub)' : 'var(--ink-mute)', 'stroke-width': r.moi ? 4 : 2.4,
        opacity: r.moi ? 1 : .65, 'stroke-linecap': 'round' }, g);
      make('circle', { cx: X(r.E), cy: y, r: r.moi ? 5 : 3.4,
        fill: r.moi ? 'var(--sub)' : 'var(--ink-mute)' }, g);
      label(X0 + 202, y + 4, r.nom, 'ax end');
      if (r.moi) label(X(r.E) + 10, y + 4, sci(r.E, 2) + ' J', 'tau start');
    });
  }

  /* ── utilitaires ───────────────────────────────────────────────────── */
  // « 1,54 t de uranium » : l'élision se fait devant une voyelle. Un détail,
  // mais un texte qui écorche le français perd la confiance qu'il demande sur
  // le reste.
  const de = (nom) => (/^[aeiouyâêîôûéèh]/i.test(nom) ? 'd’' : 'de ') + nom;
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

  [feu, vue].forEach((s) => s.el.addEventListener('change', paint));
  [masse, puis, rend].forEach((s) => s.el.addEventListener('input', paint));
  lab.onResize(paint);
  paint();
}
