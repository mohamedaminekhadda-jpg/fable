// Les deux microphones
//
// L'expérience du §3-2, avec son oscilloscope. On ne lit pas la longueur d'onde :
// on la MESURE. On fait glisser M₂ jusqu'à ce que les deux courbes se
// superposent, on relève d, on recommence — et l'écart entre deux relevés
// successifs est λ. C'est exactement le tableau du cours : 34, 68, 102, 136 cm.
//
// Deux choix qui font toute la différence avec une animation :
//
//   • L'oscilloscope est DÉCLENCHÉ, comme un vrai. Sa trace ne défile pas : le
//     décalage entre les deux courbes est une longueur qu'on peut lire, pas un
//     mouvement qu'on regarde passer. Ce qui bouge, c'est l'air, en haut.
//
//   • La célérité n'est jamais saisie. Elle sort de la température :
//     v = 331,3 + 0,606 θ  (m/s) — d'où la phrase du cours « pour les gaz, la
//     célérité augmente avec la température ». L'élève mesure λ, calcule λf, et
//     peut comparer sa mesure à la valeur vraie.
//
// Le son est LONGITUDINAL : l'air est dessiné en grains qui se déplacent le long
// de l'axe, jamais en travers. Les zones serrées sont les compressions.

const BENCH = 1.6;               // longueur du banc, en m
const NGRAIN = 620;

export function mount(lab) {
  const { make, fr } = lab;

  /* ── réglages ──────────────────────────────────────────────────────── */
  lab.group('Le haut-parleur');
  const freq = lab.slider({
    label: 'Fréquence f', min: 400, max: 4000, step: 50, value: 1000, unit: 'Hz', dec: 0,
  });
  lab.group('L’air');
  const temp = lab.slider({
    label: 'Température θ', min: -10, max: 40, step: 1, value: 20, unit: '°C', dec: 0,
  });
  lab.group('Le microphone M₂');
  const dist = lab.slider({
    label: 'Distance d = M₁M₂', min: 0, max: 150, step: 0.5, value: 0, unit: 'cm', dec: 1,
  });
  lab.group('L’oscilloscope');
  const sens = lab.select({
    label: 'Sensibilité horizontale',
    options: [
      { value: '0.05', label: '0,05 ms / div' }, { value: '0.1', label: '0,1 ms / div' },
      { value: '0.2', label: '0,2 ms / div' }, { value: '0.5', label: '0,5 ms / div' },
      { value: '1', label: '1 ms / div' },
    ],
    value: '0.2',
  });
  const voirGrains = lab.check({ label: 'Montrer les grains d’air', value: true });

  /* ── le relevé, que l'élève construit lui-même ─────────────────────── */
  // Chaque relevé retient AUSSI si les courbes se superposaient vraiment au
  // moment du clic. L'élève reste juge — c'est son œil qui décide, pas la
  // machine — mais une mesure prise à côté est signalée au lieu de se fondre
  // dans la moyenne.
  let releves = [];
  lab.buttons([
    {
      label: '＋ Relever d',
      onClick: () => {
        const d = dist.value;
        // Deux clics sur la MÊME superposition ne sont jamais voulus. La bande où
        // les courbes paraissent confondues est large de 2·TOL, et le curseur
        // avance par pas de 0,5 cm : deux pas voisins peuvent donc tous deux
        // passer pour « en phase ». Comptés séparément, ils glissent un écart de
        // 0,5 cm dans la moyenne et divisent λ par deux.
        const proche = releves.find((r) => Math.abs(r.d - d) < lamCm() / 4);
        if (proche) {
          noteRead.set('d = ' + fr(proche.d, 1) + ' cm est déjà relevé : c’est la '
            + 'même superposition. Avancez jusqu’à la suivante.');
          noteRead.show(true);
          return;
        }
        releves.push({ d, ok: enPhaseAt(d) });
        releves.sort((a, b) => a.d - b.d);
        paintReleves();
      },
    },
    { label: 'Effacer', onClick: () => { releves = []; paintReleves(); } },
  ]);

  /* ── mesures ───────────────────────────────────────────────────────── */
  const etatRead = lab.readout({ label: 'Les deux signaux', format: (s) => s || '—' });
  const ratioRead = lab.readout({ label: 'd / λ', dec: 2 });
  const relRead = lab.readout({ label: 'Relevés (cm)', format: (s) => s || 'aucun' });
  const noteRead = lab.readout({ label: '', format: (s) => s || '' });
  noteRead.show(false);
  const lamMes = lab.readout({ label: 'λ mesurée (écarts)', unit: 'cm', dec: 1, hi: true });
  const vMes = lab.readout({ label: 'v = λ·f  mesurée', unit: 'm/s', dec: 0, hi: true });
  const vVrai = lab.readout({ label: 'v réelle (θ)', unit: 'm/s', dec: 1 });
  const lamVrai = lab.readout({ label: 'λ réelle = v/f', unit: 'cm', dec: 1 });

  /* ── la physique ───────────────────────────────────────────────────── */
  // Célérité du son dans l'air sec, en fonction de la température.
  const celerite = () => 331.3 + 0.606 * temp.value;
  const lambda = () => celerite() / freq.value;                 // en m
  // Ce que capte un micro placé à la distance x du premier : la même vibration,
  // retardée de x/v. Même loi qu'à la séance 1, mais entretenue.
  const signal = (x, t) => Math.cos(2 * Math.PI * freq.value * (t - x / celerite()));

  // La tolérance est une DISTANCE, pas une fraction de λ. Exprimée en fraction
  // elle valait 0,5 cm quand λ = 34 cm — soit un pas de curseur — et d = 0,5 cm
  // passait pour « en phase ». En centimètres elle reste juste, que λ fasse 9 cm
  // ou 86 cm. Le pas du curseur étant 0,5 cm, l'erreur d'arrondi ne dépasse
  // jamais 0,25 cm : toute superposition reste atteignable.
  const TOL = 0.4;                                    // cm
  const lamCm = () => lambda() * 100;
  // d = k λ  ⟺  les deux micros reçoivent la même vibration décalée d'un nombre
  // entier de périodes : les courbes se confondent.
  const ordrePhase = (dCm) => Math.round(dCm / lamCm());
  const enPhaseAt = (dCm) => Math.abs(dCm - ordrePhase(dCm) * lamCm()) < TOL;
  // d = (2k+1) λ/2 : une courbe est en haut quand l'autre est en bas.
  const ordreOpp = (dCm) => Math.round(dCm / lamCm() - 0.5);
  const enOppAt = (dCm) => Math.abs(dCm - (ordreOpp(dCm) + 0.5) * lamCm()) < TOL;

  function paintReleves() {
    // Un relevé pris hors superposition porte une étoile : il compte quand même
    // dans la moyenne, mais on voit lequel accuser si λ tombe faux.
    relRead.set(releves.length
      ? releves.map((r) => fr(r.d, 1) + (r.ok ? '' : ' *')).join(' · ')
      : '');
    const douteux = releves.filter((r) => !r.ok).length;
    noteRead.set(douteux
      ? douteux + (douteux > 1 ? ' relevés ont été pris' : ' relevé a été pris')
        + ' hors superposition (*) : l’écart moyen s’en ressent.'
      : '');
    noteRead.show(!!douteux);
    if (releves.length < 2) { lamMes.set(null); vMes.set(null); return; }
    // λ est l'écart MOYEN entre deux relevés consécutifs — c'est la méthode du
    // cours, et elle est plus juste qu'un seul écart.
    let som = 0;
    for (let i = 1; i < releves.length; i++) som += releves[i].d - releves[i - 1].d;
    const lam = som / (releves.length - 1);                     // cm
    lamMes.set(lam);
    vMes.set(lam / 100 * freq.value);
  }
  paintReleves();

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);

  // positions verticales des grains, tirées une fois pour toutes : si elles
  // changeaient d'une image à l'autre, l'air scintillerait
  let seed = 20240803;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  // Les grains partent d’un pas RÉGULIER, avec un tout petit désordre. Répartis
  // au hasard, un déplacement de quelques pixels ne se voit pas : c’est la
  // régularité de départ qui rend les compressions lisibles.
  const grains = Array.from({ length: NGRAIN }, (_, i) => ({
    x0: (i + 0.5) / NGRAIN + (rnd() - 0.5) * 0.35 / NGRAIN,
    yr: rnd(),
  }));

  // Le haut du banc portait deux textes sur la même ligne : son titre, à gauche,
  // et la cote d, centrée sur M₁M₂. À petit d la cote tombe pile sur le titre, et
  // aucun décalage horizontal ne les sépare — le tronçon coté est tout entier
  // sous le titre, la cote n'a nulle part où aller. Chacun a donc sa bande. La
  // hauteur vient du banc, pas de l'oscilloscope : les grains la perdent sans
  // qu'on la voie, une courbe rétrécie se voit tout de suite.
  const PAD = { l: 20, r: 18, t: 40, b: 18 };
  const COTE = 24;                 // bande réservée à la cote, au-dessus du banc
  const TITRE_Y = 11;              // ligne du titre, au-dessus de cette bande

  function draw(t) {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);

    const v = celerite(), lam = lambda();
    const W = w - PAD.l - PAD.r;
    const benchH = Math.max(70, Math.min(150, h * 0.36) - COTE);
    const benchY = PAD.t + benchH / 2;
    const X = (m) => PAD.l + (m / BENCH) * W;                   // mètres → pixels
    const dm = dist.value / 100;                                // d en mètres

    /* ── le banc ───────────────────────────────────────────────────── */
    label(PAD.l, TITRE_Y, 'Le banc, vu de dessus', 'lab');

    // les grains d'air : déplacement LONGITUDINAL s(x,t)
    if (voirGrains.value) {
      const amp = Math.min(9, W / BENCH * lam * 0.16);          // amplitude visible
      const clip = make('clipPath', { id: 'benchclip' }, g);
      make('rect', { x: PAD.l, y: benchY - benchH / 2 + 6, width: W, height: benchH - 12 }, clip);
      const gg = make('g', { 'clip-path': 'url(#benchclip)' }, g);
      for (const gr of grains) {
        const xm = gr.x0 * BENCH;
        const s = Math.cos(2 * Math.PI * freq.value * (t - xm / v));
        make('circle', {
          cx: X(xm) + s * amp, cy: benchY - benchH / 2 + 8 + gr.yr * (benchH - 16),
          r: 1.5, fill: 'var(--ink)', opacity: .42,
        }, gg);
      }
    }

    // le haut-parleur, à gauche
    make('rect', { x: PAD.l - 12, y: benchY - 20, width: 12, height: 40, rx: 3, fill: 'var(--ink)' }, g);
    make('path', {
      d: 'M' + (PAD.l) + ' ' + (benchY - 20) + ' L' + (PAD.l + 13) + ' ' + (benchY - 30)
        + ' L' + (PAD.l + 13) + ' ' + (benchY + 30) + ' L' + (PAD.l) + ' ' + (benchY + 20) + ' Z',
      fill: 'var(--ink)', opacity: .85,
    }, g);

    // les deux microphones. Quand M₂ revient contre M₁ leurs étiquettes, toutes
    // deux centrées sur leur micro, se recouvrent. On les écarte alors de part et
    // d'autre : « M₁M₂ » côte à côte dit précisément ce qui se passe — les micros
    // sont collés — au lieu de donner un texte illisible.
    const serres = X(0.12 + dm) - X(0.12) < 20;
    const mic = (xm, name, col, cote) => {
      make('line', { x1: X(xm), y1: benchY - benchH / 2 + 4, x2: X(xm), y2: benchY + benchH / 2 - 4,
        stroke: col, 'stroke-width': 1, opacity: .35 }, g);
      make('circle', { cx: X(xm), cy: benchY, r: 7, fill: col }, g);
      make('circle', { cx: X(xm), cy: benchY, r: 3, fill: 'var(--paper)' }, g);
      label(X(xm) + (serres ? cote * 4 : 0), benchY + benchH / 2 + 2, name,
        serres ? 'pt ' + (cote < 0 ? 'end' : 'start') : 'pt');
    };
    mic(0.12, 'M₁', 'var(--ink-soft)', -1);
    mic(0.12 + dm, 'M₂', 'var(--sub)', +1);

    // la cote d, et une échelle en longueurs d'onde
    const yc = benchY - benchH / 2 - 4;
    if (dm > 0.005) {
      make('line', { x1: X(0.12), y1: yc, x2: X(0.12 + dm), y2: yc, stroke: 'var(--sub)', 'stroke-width': 1 }, g);
      [0.12, 0.12 + dm].forEach((xm) => make('line', {
        x1: X(xm), y1: yc - 3, x2: X(xm), y2: yc + 3, stroke: 'var(--sub)', 'stroke-width': 1 }, g));
      label((X(0.12) + X(0.12 + dm)) / 2, yc - 5, 'd = ' + fr(dist.value, 1) + ' cm', 'tau');
    }

    /* ── l'oscilloscope ────────────────────────────────────────────── */
    const oscTop = PAD.t + benchH + 26;
    const oscH = h - oscTop - PAD.b - 12;
    const oscY = oscTop + oscH / 2;
    label(PAD.l, oscTop - 8, 'Oscilloscope — les deux entrées', 'lab');

    const div = W / 10;                          // 10 divisions horizontales
    const vdiv = oscH / 8;                       // 8 divisions verticales
    make('rect', { x: PAD.l, y: oscTop, width: W, height: oscH, fill: 'var(--paper)',
      stroke: 'var(--rule-2)', 'stroke-width': 1, rx: 3 }, g);
    for (let i = 1; i < 10; i++) {
      make('line', { x1: PAD.l + i * div, y1: oscTop, x2: PAD.l + i * div, y2: oscTop + oscH,
        stroke: 'var(--rule)', 'stroke-width': i === 5 ? 1 : .6, opacity: i === 5 ? 1 : .7 }, g);
    }
    for (let j = 1; j < 8; j++) {
      make('line', { x1: PAD.l, y1: oscTop + j * vdiv, x2: PAD.l + W, y2: oscTop + j * vdiv,
        stroke: 'var(--rule)', 'stroke-width': j === 4 ? 1 : .6, opacity: j === 4 ? 1 : .7 }, g);
    }

    // Trace déclenchée : la fenêtre part d'un maximum de M₁, comme un vrai
    // oscilloscope synchronisé. Rien ne défile — le décalage se LIT.
    const span = 10 * parseFloat(sens.value) / 1000;            // fenêtre, en s
    const amp = vdiv * 1.4;
    const trace = (x0, col, width) => {
      let p = '';
      const N = 700;
      for (let i = 0; i <= N; i++) {
        const tt = (i / N) * span;
        p += (i ? 'L' : 'M') + (PAD.l + (i / N) * W).toFixed(2) + ' '
          + (oscY - signal(x0, tt) * amp).toFixed(2);
      }
      make('path', { d: p, fill: 'none', stroke: col, 'stroke-width': width }, g);
    };
    trace(0, 'var(--ink-soft)', 1.4);            // M₁ : la référence
    trace(dm, 'var(--sub)', 2);                  // M₂ : décalé de d/v

    label(PAD.l + W - 4, oscTop + 14, sens.value.replace('.', ',') + ' ms / div', 'ax end');
    key(PAD.l + W - 4, oscTop + oscH - 6, [['var(--ink-soft)', 'M₁'], ['var(--sub)', 'M₂']]);

    /* ── les mesures ───────────────────────────────────────────────── */
    const ratio = dm / lam;
    ratioRead.set(ratio);
    vVrai.set(v);
    lamVrai.set(lam * 100);
    const dCm = dist.value;
    etatRead.set(
      dCm < TOL ? 'côte à côte — en phase'
        : enPhaseAt(dCm) ? 'en phase  (d = ' + ordrePhase(dCm) + ' λ)'
          : enOppAt(dCm) ? 'en opposition de phase  (d = '
            + (2 * ordreOpp(dCm) + 1) + ' λ/2)'
            : 'ni en phase, ni en opposition');
  }

  /* ── utilitaires ───────────────────────────────────────────────────── */
  function label(x, y, txt, cls) {
    const n = make('text', { x, y }, g);
    const c = cls || 'ax';
    n.setAttribute('class', c);
    // « pt » et « tau » sont centrés par nature, mais un ancrage écrit
    // explicitement dans la classe l'emporte : sans cela deux étiquettes posées
    // sur le même point ne peuvent pas être écartées.
    const anchor = /\bend\b/.test(c) ? 'end'
      : /\bstart\b/.test(c) ? 'start'
        : /\b(pt|tau)\b/.test(c) ? 'middle' : null;
    if (anchor) n.setAttribute('text-anchor', anchor);
    n.textContent = txt;
  }
  function key(x, y, items) {
    let off = 0;
    for (let i = items.length - 1; i >= 0; i--) {
      const [col, txt] = items[i];
      const n = make('text', { x: x - off, y, 'text-anchor': 'end' }, g);
      n.setAttribute('class', 'ax'); n.setAttribute('fill', col); n.textContent = txt;
      off += txt.length * 7 + 20;
      make('line', { x1: x - off + 12, y1: y - 4, x2: x - off + 3, y2: y - 4, stroke: col, 'stroke-width': 2 }, g);
    }
  }

  /* ── attraper M₂ à la souris, sur le banc ──────────────────────────── */
  lab.stage.style.cursor = 'ew-resize';
  let drag = false;
  const toD = (ev) => {
    const r = svg.getBoundingClientRect();
    const { w } = lab.size();
    const px = ((ev.clientX - r.left) / r.width) * w;
    const m = ((px - PAD.l) / (w - PAD.l - PAD.r)) * BENCH - 0.12;
    return Math.min(150, Math.max(0, Math.round(m * 1000) / 10));
  };
  const dn = (e) => { drag = true; dist.set(toD(e)); svg.setPointerCapture?.(e.pointerId); };
  const mv = (e) => { if (drag) dist.set(toD(e)); };
  const up = () => { drag = false; };
  svg.addEventListener('pointerdown', dn);
  svg.addEventListener('pointermove', mv);
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', up);
  lab.onDestroy(() => {
    svg.removeEventListener('pointerdown', dn); svg.removeEventListener('pointermove', mv);
    svg.removeEventListener('pointerup', up); svg.removeEventListener('pointercancel', up);
  });

  lab.loop((dt, t) => draw(t), { slow: 0.002 });
  lab.onResize(() => draw(lab.clock.t));
  draw(0);
}
