// La corde : l'aspect et le retard
//
// Deux graphiques, et toute la difficulté du chapitre est entre les deux :
//
//   en haut   y(x) à l'instant t      — l'ASPECT de la corde : une photographie
//   en bas    y(t) au point M         — l'ÉLONGATION de M : un film d'un seul point
//
// Sur le papier ces deux courbes se ressemblent, et c'est là que les élèves se
// perdent. Ici elles bougent ensemble : on voit l'ébranlement traverser la
// corde en haut, et on le voit arriver en bas, en retard de τ = d ⁄ v.
//
// Rien n'est mis en scène. Toute la simulation tient dans une seule ligne, qui
// EST la définition du cours (§VII) :
//
//        y(x, t) = y_S(t − x/v)
//
// « tous les points subissent la même perturbation que la source, avec un
// retard τ ». La célérité elle-même n'est pas saisie : elle sort de v = √(F/µ).

const L = 10;                    // longueur de la corde, en m (comme l'exercice 1)

export function mount(lab) {
  const { make, fr } = lab;

  /* ── la source ─────────────────────────────────────────────────────── */
  lab.group('La source, en x = 0');
  const forme = lab.select({
    label: 'Geste de la source',
    options: [
      { value: 'impulsion', label: 'Une seule secousse' },
      { value: 'sinus', label: 'Vibration entretenue' },
    ],
    value: 'impulsion',
    onChange: (v) => { theta.show(v === 'impulsion'); periode.show(v === 'sinus'); repeter.show(v === 'impulsion'); reset(); },
  });
  const ampli = lab.slider({ label: 'Amplitude a', min: 1, max: 8, step: 0.5, value: 5, unit: 'cm' });
  const repeter = lab.check({ label: 'Refaire le geste sans arrêt', value: true, onChange: reset });
  const theta = lab.slider({
    label: 'Durée du geste θ', min: 0.02, max: 0.3, step: 0.01, value: 0.08, unit: 's',
    onInput: reset,
  });
  const periode = lab.slider({
    label: 'Période T', min: 0.04, max: 0.4, step: 0.01, value: 0.12, unit: 's', onInput: reset,
  });
  periode.show(false);

  /* ── la corde ──────────────────────────────────────────────────────── */
  lab.group('La corde');
  const tension = lab.slider({
    label: 'Tension F', min: 2, max: 80, step: 1, value: 20, unit: 'N', onInput: reset,
  });
  const mu = lab.slider({
    label: 'Masse linéique µ', min: 2, max: 40, step: 1, value: 10, unit: 'g/m', onInput: reset,
  });

  /* ── le point M ────────────────────────────────────────────────────── */
  lab.group('Le point M');
  const dM = lab.slider({
    label: 'Distance d = SM', min: 0.5, max: L, step: 0.1, value: 6, unit: 'm', onInput: reset,
  });
  const voirSource = lab.check({ label: 'Superposer la courbe de la source', value: true });
  const voirGrain = lab.check({ label: 'Marquer un grain de la corde', value: true });

  /* ── mesures ───────────────────────────────────────────────────────── */
  const vRead = lab.readout({ label: 'Célérité  v = √(F/µ)', unit: 'm/s', dec: 1, hi: true });
  const tauRead = lab.readout({ label: 'Retard  τ = d/v', unit: 's', dec: 3, hi: true });
  const frontRead = lab.readout({ label: 'Front de l’onde', unit: 'm', dec: 2 });
  const ySRead = lab.readout({ label: 'Élongation de S', unit: 'cm', dec: 2 });
  const yMRead = lab.readout({ label: 'Élongation de M', unit: 'cm', dec: 2 });
  const etatRead = lab.readout({ label: 'État de M', format: (s) => s || '—' });

  /* ── la physique, en trois lignes ──────────────────────────────────── */
  // v = √(F/µ) : µ est donné en g/m, donc en kg/m il faut diviser par 1000.
  const celerite = () => Math.sqrt(tension.value / (mu.value / 1000));
  const retard = () => dM.value / celerite();

  // Le geste de la source. Nul avant t = 0 : la corde est au repos, puis la
  // source part. Pour la secousse, sin² part et revient à zéro en douceur —
  // une vraie main ne s'arrête pas net.
  // Période de répétition : le temps qu'il faut à l'ébranlement pour traverser
  // la corde entière, plus une pause, pour qu'elle soit bien vide entre deux.
  const periodeRepet = () => L / celerite() + 3 * theta.value;
  function source(u) {
    if (u < 0) return 0;
    if (forme.value === 'impulsion') {
      if (repeter.value) u = u % periodeRepet();
      if (u > theta.value) return 0;
      const s = Math.sin(Math.PI * u / theta.value);
      return ampli.value * s * s;
    }
    return ampli.value * Math.sin(2 * Math.PI * u / periode.value);
  }
  // La définition du cours, telle quelle.
  const y = (x, t) => source(t - x / celerite());

  /* ── l'historique, pour le graphe du bas ───────────────────────────── */
  let hist = [];                   // { t, ys, ym }
  function reset() { hist = []; }
  lab.onReset(reset);

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);

  const PAD = { l: 46, r: 16, t: 18, b: 24 };
  const GAP = 34;

  function draw(t) {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);

    const v = celerite(), tau = retard(), A = ampli.value;
    const plotW = w - PAD.l - PAD.r;
    const H = (h - PAD.t - PAD.b - GAP) / 2;
    const topY = PAD.t + H / 2;                 // axe de la corde
    const botY = PAD.t + H + GAP + H / 2;       // axe du graphe temporel
    // L'échelle verticale est très dilatée : 5 cm sur 10 m ne se verrait pas.
    const yScale = (H / 2 - 8) / Math.max(A, 1);
    const X = (x) => PAD.l + (x / L) * plotW;

    /* ── graphe 1 : l'aspect de la corde ── */
    label(PAD.l, PAD.t - 4, 'Aspect de la corde à l’instant t', 'lab');
    axis(PAD.l, topY, PAD.l + plotW, topY);
    for (let m = 0; m <= L; m += 2) {
      if (m < L) tick(X(m), topY, String(m));
    }
    label(PAD.l + plotW, topY - H / 2 + 15, 'x (m)', 'ax end');

    // la corde elle-même
    let d = '';
    const N = 420;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * L;
      d += (i ? 'L' : 'M') + X(x).toFixed(2) + ' ' + (topY - y(x, t) * yScale).toFixed(2);
    }
    make('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);

    // le front de l'onde : jusqu'où la perturbation est arrivée
    const front = Math.min(v * t, L);
    if (t > 0 && front < L && t < L / v * 1.05) {
      make('line', {
        x1: X(front), y1: topY - H / 2 + 6, x2: X(front), y2: topY + H / 2 - 6,
        stroke: 'var(--sub)', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: .7,
      }, g);
      label(X(front) + 5, topY - H / 2 + 15, 'front', 'ax sub');
    }

    // la source
    make('circle', { cx: X(0), cy: topY - y(0, t) * yScale, r: 5, fill: 'var(--ink)' }, g);
    label(X(0), topY + H / 2 - 2, 'S', 'pt');

    // le point M — et le grain de corde qui prouve qu'il ne va nulle part
    const yM = y(dM.value, t);
    if (voirGrain.value) {
      make('line', {
        x1: X(dM.value), y1: topY - A * yScale, x2: X(dM.value), y2: topY + A * yScale,
        stroke: 'var(--sub)', 'stroke-width': 1, opacity: .28,
      }, g);
    }
    make('circle', { cx: X(dM.value), cy: topY - yM * yScale, r: 6, fill: 'var(--sub)' }, g);
    label(X(dM.value), topY + H / 2 - 2, 'M', 'pt sub');

    /* ── graphe 2 : l'élongation de M au cours du temps ── */
    label(PAD.l, PAD.t + H + GAP - 12, 'Élongation du point M au cours du temps', 'lab');
    axis(PAD.l, botY, PAD.l + plotW, botY);

    // fenêtre de temps : assez large pour voir l'arrivée, puis elle défile
    const win = Math.max(0.25, tau * 2.4 + (forme.value === 'impulsion' ? theta.value * 3 : periode.value * 4));
    const t0 = Math.max(0, t - win), t1 = t0 + win;
    const T = (tt) => PAD.l + ((tt - t0) / win) * plotW;
    for (let k = 0; k <= 4; k++) {
      const tt = t0 + (k / 4) * win;
      if (k < 4) tick(PAD.l + (k / 4) * plotW, botY, fr(tt, 2));
    }
    label(PAD.l + plotW, botY + H / 2 - 2, 't (s)', 'ax end');

    // le retard, montré comme ce qu'il est : une distance sur l'axe du temps
    if (tau >= t0 && tau <= t1) {
      make('rect', {
        x: T(Math.max(0, t0)), y: botY - H / 2 + 4,
        width: Math.max(0, T(tau) - T(Math.max(0, t0))), height: H - 8,
        fill: 'var(--sub)', opacity: .07,
      }, g);
      make('line', {
        x1: T(tau), y1: botY - H / 2 + 4, x2: T(tau), y2: botY + H / 2 - 4,
        stroke: 'var(--sub)', 'stroke-width': 1, 'stroke-dasharray': '3 3',
      }, g);
      if (T(tau) - T(Math.max(0, t0)) > 26) {
        label((T(tau) + T(Math.max(0, t0))) / 2, botY - H / 2 + 15, 'τ', 'tau');
      }
    }

    // les deux traces
    const trace = (key, stroke, width, opacity) => {
      let p = '', started = false;
      for (const s of hist) {
        if (s.t < t0) continue;
        p += (started ? 'L' : 'M') + T(s.t).toFixed(2) + ' ' + (botY - s[key] * yScale).toFixed(2);
        started = true;
      }
      if (p) make('path', { d: p, fill: 'none', stroke, 'stroke-width': width, opacity, 'stroke-linejoin': 'round' }, g);
    };
    if (voirSource.value) trace('ys', 'var(--ink-mute)', 1.4, .85);
    trace('ym', 'var(--sub)', 2, 1);

    // la tête de lecture, pour relier les deux graphiques dans le temps
    make('circle', { cx: T(t), cy: botY - yM * yScale, r: 4, fill: 'var(--sub)' }, g);

    if (voirSource.value) {
      key(PAD.l + plotW - 4, botY - H / 2 + 15, [
        ['var(--ink-mute)', 'source S'], ['var(--sub)', 'point M'],
      ]);
    }

    /* ── les mesures ── */
    vRead.set(v);
    tauRead.set(tau);
    frontRead.set(front);
    ySRead.set(y(0, t));
    yMRead.set(yM);
    etatRead.set(
      t < tau ? 'au repos — l’onde n’est pas encore arrivée'
        : (forme.value === 'impulsion' && t > tau + theta.value)
          ? 'revenu au repos' : 'en mouvement');
  }

  /* ── petits utilitaires de dessin ── */
  function axis(x1, y1, x2, y2) {
    make('line', { x1, y1, x2, y2, stroke: 'var(--rule-2)', 'stroke-width': 1 }, g);
  }
  function tick(x, yy, txt) {
    make('line', { x1: x, y1: yy - 3, x2: x, y2: yy + 3, stroke: 'var(--rule-2)', 'stroke-width': 1 }, g);
    const n = make('text', { x, y: yy + 15, 'text-anchor': 'middle' }, g);
    n.setAttribute('class', 'ax'); n.textContent = txt;
  }
  function label(x, yy, txt, cls) {
    const n = make('text', { x, y: yy }, g);
    n.setAttribute('class', cls || 'ax');
    if (/\bend\b/.test(cls || '')) n.setAttribute('text-anchor', 'end');
    if (/\b(pt|tau)\b/.test(cls || '')) n.setAttribute('text-anchor', 'middle');
    n.textContent = txt;
    return n;
  }
  function key(x, yy, items) {
    let off = 0;
    for (let i = items.length - 1; i >= 0; i--) {
      const [col, txt] = items[i];
      const n = make('text', { x: x - off, y: yy, 'text-anchor': 'end' }, g);
      n.setAttribute('class', 'ax'); n.setAttribute('fill', col); n.textContent = txt;
      off += txt.length * 6.2 + 18;
      make('line', {
        x1: x - off + 10, y1: yy - 4, x2: x - off + 2, y2: yy - 4,
        stroke: col, 'stroke-width': 2,
      }, g);
    }
  }

  /* ── attraper M à la souris, directement sur la corde ── */
  lab.stage.style.cursor = 'ew-resize';
  let dragging = false;
  const toX = (ev) => {
    const r = svg.getBoundingClientRect();
    const { w } = lab.size();
    const px = ((ev.clientX - r.left) / r.width) * w;
    return Math.min(L, Math.max(0.5, ((px - PAD.l) / (w - PAD.l - PAD.r)) * L));
  };
  const down = (ev) => { dragging = true; dM.set(Math.round(toX(ev) * 10) / 10); reset(); svg.setPointerCapture?.(ev.pointerId); };
  const move = (ev) => { if (dragging) { dM.set(Math.round(toX(ev) * 10) / 10); reset(); } };
  const up = () => { dragging = false; };
  svg.addEventListener('pointerdown', down);
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', up);
  lab.onDestroy(() => {
    svg.removeEventListener('pointerdown', down);
    svg.removeEventListener('pointermove', move);
    svg.removeEventListener('pointerup', up);
    svg.removeEventListener('pointercancel', up);
  });

  /* ── la boucle ─────────────────────────────────────────────────────── */
  lab.loop((dt, t) => {
    hist.push({ t, ys: y(0, t), ym: y(dM.value, t) });
    // on ne garde que ce qui peut encore être affiché
    if (hist.length > 4000) hist = hist.slice(-3000);
    draw(t);
  }, { slow: 0.05 });
  lab.onResize(() => draw(lab.clock.t));
  draw(0);
}
