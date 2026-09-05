// Le titrage acide-base.
//
// Un titrage n'est pas une courbe à recopier : c'est un geste. On verse, on
// regarde le pH-mètre, on cherche l'endroit où quelques gouttes font tout
// basculer, et de ce volume-là on déduit une concentration qu'on ne connaissait
// pas. Le reste — la courbe, l'indicateur, le pH à l'équivalence — n'est là que
// pour rendre ce geste lisible.
//
// ── LE MODÈLE ──────────────────────────────────────────────────────────────
// Le pH n'est jamais approché : il sort de l'ÉLECTRONEUTRALITÉ de la solution,
// résolue pour de bon. Les formules de cours (pH = −log C, pH = pKa à la
// demi-équivalence) sont des approximations qui se trompent précisément là où
// l'on regarde — à l'équivalence, où l'eau elle-même fournit ses ions. Une
// simulation qui afficherait pH = 7,00 à l'équivalence d'un acide faible
// enseignerait une erreur.
//
//   acide fort   : Cb + h = Kw/h + Ca            → équation du second degré
//   acide faible : Cb + h = Kw/h + Ca·Ka/(Ka+h)  → résolue par dichotomie
//
// La dichotomie est GÉOMÉTRIQUE (on coupe en √(lo·hi)) parce que l'inconnue
// court sur quinze décades : couper en (lo+hi)/2 userait cent itérations dans
// les fortes concentrations et n'atteindrait jamais 10⁻¹².

const KW = 1e-14;

const ACIDES = [
  { value: 'hcl', label: 'Acide chlorhydrique HCl (fort)', formule: 'HCl', ka: null },
  { value: 'ethanoique', label: 'Acide éthanoïque CH₃COOH (faible)', formule: 'CH₃COOH', ka: 1.8e-5 },
  { value: 'methanoique', label: 'Acide méthanoïque HCOOH (faible)', formule: 'HCOOH', ka: 1.8e-4 },
];

/* Les trois indicateurs du lycée, avec leur vraie zone de virage et leurs deux
   teintes. C'est la zone qui décide si un indicateur convient, et elle ne se
   négocie pas : on la lit sur le flacon. */
const INDICATEURS = [
  { value: 'bbt', label: 'Bleu de bromothymol (6,0 – 7,6)', z0: 6.0, z1: 7.6, a: '#d8c327', b: '#2a6cae' },
  { value: 'helianthine', label: 'Hélianthine (3,1 – 4,4)', z0: 3.1, z1: 4.4, a: '#c8402a', b: '#e0a91c' },
  { value: 'phenol', label: 'Phénolphtaléine (8,2 – 10,0)', z0: 8.2, z1: 10.0, a: null, b: '#cf3f8c' },
  { value: 'aucun', label: 'aucun', z0: 0, z1: 0, a: null, b: null },
];

/* Le pH de la solution, à tout instant du dosage. */
export function ph(acide, ca, va, cb, vb) {
  const v = va + vb;
  const Ca = (ca * va) / v;              // acide apporté, dilué par le mélange
  const Cb = (cb * vb) / v;              // soude apportée, diluée de même
  if (!acide.ka) {
    // h² + (Cb − Ca)·h − Kw = 0, dont on garde la seule racine positive
    const b = Cb - Ca;
    return -Math.log10((-b + Math.sqrt(b * b + 4 * KW)) / 2);
  }
  const f = (h) => Cb + h - KW / h - (Ca * acide.ka) / (acide.ka + h);
  let lo = 1e-15, hi = 1;                // f croît de −∞ vers une valeur positive
  for (let i = 0; i < 120; i++) {
    const m = Math.sqrt(lo * hi);
    if (f(m) > 0) hi = m; else lo = m;
  }
  return -Math.log10(Math.sqrt(lo * hi));
}

// Le volume à l'équivalence : autant de soude versée que d'acide présent.
export const equivalence = (ca, va, cb) => (ca * va) / cb;

const melange = (c1, c2, t) => {
  const h = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const A = h(c1), B = h(c2);
  const k = (i) => Math.round(A[i] + (B[i] - A[i]) * t);
  return 'rgb(' + k(0) + ',' + k(1) + ',' + k(2) + ')';
};

/* La teinte du bécher. « Incolore » n'est pas une couleur : la phénolphtaléine
   avant virage laisse voir l'eau, et c'est l'opacité qui doit tomber, pas la
   teinte qui doit virer au blanc. */
function teinte(ind, pH) {
  if (!ind.b) return { c: '#9fc4d8', o: 0.28 };
  const t = Math.max(0, Math.min(1, (pH - ind.z0) / (ind.z1 - ind.z0)));
  if (!ind.a) return { c: ind.b, o: 0.10 + 0.62 * t };
  return { c: melange(ind.a, ind.b, t), o: 0.70 };
}

export function mount(lab) {
  const { make, fr } = lab;
  const svg = lab.svg();

  let trace = new Map();                 // Vb arrondi → pH, là où l'on est passé
  let vbE = null;                        // l'équivalence, telle que l'élève la marque
  let bulles = [];                       // les traînées colorées qui s'effacent
  let minuteur = 0;

  const oublier = () => { trace.clear(); vbE = null; };

  lab.group('La prise d’essai');
  const quelAcide = lab.select({ label: 'L’acide dosé', options: ACIDES, value: 'hcl',
    onChange: () => { oublier(); dessine(); } });
  const ca = lab.slider({ label: 'Concentration Ca', min: 0.01, max: 0.2, step: 0.005,
    value: 0.1, unit: 'mol/L', dec: 3, onInput: () => { oublier(); dessine(); } });
  const va = lab.slider({ label: 'Volume prélevé Va', min: 5, max: 25, step: 1,
    value: 20, unit: 'mL', dec: 0, onInput: () => { oublier(); dessine(); } });

  lab.group('La burette');
  const cb = lab.slider({ label: 'Soude Cb', min: 0.02, max: 0.2, step: 0.005,
    value: 0.1, unit: 'mol/L', dec: 3, onInput: () => { oublier(); dessine(); } });
  const vb = lab.slider({ label: 'Volume versé Vb', min: 0, max: 40, step: 0.05,
    value: 0, unit: 'mL', dec: 2, onInput: verse });

  lab.group('Le bécher');
  const quelInd = lab.select({ label: 'Indicateur coloré', options: INDICATEURS,
    value: 'bbt', onChange: dessine });

  lab.buttons([
    { label: '+ 0,05 mL', onClick: () => goutte(0.05) },
    { label: '+ 1 mL', onClick: () => goutte(1) },
    { label: 'Marquer l’équivalence ici', onClick: () => { vbE = +vb.value; dessine(); } },
    { label: 'Vider et recommencer', onClick: () => { vb.set(0); oublier(); dessine(); } },
  ]);

  const txt = (v) => (v == null ? '—' : String(v));
  lab.group('Le pH-mètre');
  const rPh = lab.readout({ label: 'pH', dec: 2, hi: true });
  const rSaut = lab.readout({ label: 'Pente', format: txt });
  const rCouleur = lab.readout({ label: 'Le bécher', format: txt });
  lab.group('Ce que vous en déduisez');
  const rVe = lab.readout({ label: 'Équivalence marquée', format: txt });
  const rCa = lab.readout({ label: 'Concentration déduite', format: txt, hi: true });
  const rEcart = lab.readout({ label: 'Écart au vrai Ca', format: txt });

  const acide = () => ACIDES.find((a) => a.value === quelAcide.value);
  const indic = () => INDICATEURS.find((i) => i.value === quelInd.value);

  function goutte(d) {
    vb.set(Math.min(40, Math.round((+vb.value + d) * 100) / 100));
    verse();
  }

  /* Verser laisse une trace : la courbe se dessine LÀ OÙ L'ON EST PASSÉ, et pas
     ailleurs. Un titrage dont la courbe complète s'affiche d'avance ne demande
     plus de chercher le saut — il le montre. */
  function verse() {
    const v = +vb.value;
    trace.set(Math.round(v * 20) / 20, ph(acide(), +ca.value, +va.value, +cb.value, v));
    lache();
    dessine();
  }

  /* La traînée colorée. Là où la goutte tombe, la solution est localement
     basique : on y voit passer la couleur de la forme basique, qui s'efface
     quand on agite. Près de l'équivalence elle met plus longtemps à partir, et
     c'est précisément le signe que les chimistes guettent. */
  function lache() {
    const ind = indic();
    if (!ind.b) return;
    const p = ph(acide(), +ca.value, +va.value, +cb.value, +vb.value);
    const reste = Math.max(0, 1 - Math.abs(p - (ind.z0 + ind.z1) / 2) / 3);
    bulles.push({ t0: performance.now(), duree: 380 + 950 * reste, c: ind.b });
    if (bulles.length > 5) bulles.shift();
  }

  /* ── outils de tracé ───────────────────────────────────────────────────── */
  let regle = null;
  const mesure = (s, fs) => {
    if (!regle) return String(s).length * fs * 0.55;
    regle.setAttribute('font-size', fs);
    regle.textContent = String(s);
    return regle.getComputedTextLength() || String(s).length * fs * 0.55;
  };
  function T(p, x, y, s, a = {}) {
    const t = make('text', { x, y, 'font-size': a.fs || 11, fill: a.fill || 'var(--ink)',
      'text-anchor': a.anchor || 'middle', 'font-weight': a.bold ? 600 : 400,
      'font-family': a.mono ? 'var(--mono)' : 'inherit', opacity: a.op != null ? a.op : 1 }, p);
    t.textContent = s;
    return t;
  }
  function coupe(s, largeur, fs) {
    const mots = String(s).split(/\s+/), out = [];
    let l = '';
    mots.forEach((m) => {
      if (!l) { l = m; return; }
      const e = l + ' ' + m;
      if (mesure(e, fs) <= largeur) l = e; else { out.push(l); l = m; }
    });
    if (l) out.push(l);
    return out;
  }

  const graphe = lab.chart({
    x: { label: 'volume de soude versé', unit: 'mL', min: 0, max: 40 },
    y: { label: 'pH', min: 0, max: 14, ticks: 7 },
  });

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    regle = make('text', { x: -9999, y: -9999, fill: 'none' }, svg);
    const { w: W, h: H } = lab.size();
    const A = acide(), ind = indic();
    const V = +vb.value, Ca = +ca.value, Va = +va.value, Cb = +cb.value;
    const p = ph(A, Ca, Va, Cb, V);

    const fsT = Math.max(13, Math.min(18, W / 42));
    T(svg, 12, 10 + fsT, 'Le titrage de ' + A.formule + ' par la soude',
      { fs: fsT, bold: true, anchor: 'start' });
    const lignes = coupe('Versez, lisez le pH-mètre, cherchez le saut — puis marquez-le et '
      + 'déduisez la concentration de l’acide.', W - 24, 11.5);
    lignes.forEach((l, i) => T(svg, 12, 12 + fsT * 2 + i * 13, l,
      { fs: 11.5, anchor: 'start', fill: 'var(--ink-soft)' }));
    const haut = 12 + fsT * 2 + lignes.length * 13 + 8;

    /* La paillasse tient à gauche quand il y a la place, et passe au-dessus du
       graphe quand la scène devient étroite : un bécher de trente pixels de
       large ne montre plus rien. */
    const cote = W >= 700;
    const Lw = cote ? Math.min(230, W * 0.28) : W;
    paillasse(cote ? { x: 8, y: haut, w: Lw, h: H - haut - 8 }
      : { x: 8, y: haut, w: W - 16, h: 120 }, p, ind, V, cote);

    const gb = cote ? { x: Lw + 10, y: haut, w: W - Lw - 18, h: H - haut - 8 }
      : { x: 0, y: haut + 126, w: W, h: H - haut - 134 };
    if (gb.w > 190 && gb.h > 130) courbe(gb, p, V, ind);

    /* ── les mesures ── */
    rPh.set(p);
    const dv = 0.05;
    const pente = Math.abs(ph(A, Ca, Va, Cb, V + dv) - ph(A, Ca, Va, Cb, Math.max(0, V - dv)))
      / (V > 0 ? 2 * dv : dv);
    rSaut.set(fr(pente, 1) + ' pH par mL' + (pente > 8 ? '  ← LE SAUT' : ''));
    rCouleur.set(!ind.b ? 'sans indicateur'
      : p < ind.z0 ? 'forme acide, franche'
        : p > ind.z1 ? 'forme basique, franche'
          : 'EN TRAIN DE VIRER (zone ' + fr(ind.z0, 1) + ' – ' + fr(ind.z1, 1) + ')');
    rVe.set(vbE == null ? 'cliquez « Marquer l’équivalence »' : fr(vbE, 2) + ' mL');
    if (vbE == null) { rCa.set('—'); rEcart.set('—'); } else {
      const deduite = (Cb * vbE) / Va;
      rCa.set(fr(deduite, 4) + ' mol/L');
      const e = Ca > 0 ? (100 * (deduite - Ca)) / Ca : 0;
      rEcart.set(fr(Math.abs(e), 1) + ' %   (vrai Ca = ' + fr(Ca, 3) + ' mol/L)');
    }
    if (regle) { regle.remove(); regle = null; }
  }

  /* ── la paillasse : la burette et le bécher ─────────────────────────────── */
  function paillasse(b, p, ind, V, cote) {
    const g = make('g', {}, svg);
    const cx = b.x + b.w / 2;
    const hBur = cote ? Math.min(b.h * 0.46, 200) : 54;
    const wBur = 18;
    const yBur = b.y + 4;

    make('rect', { x: cx - wBur / 2, y: yBur, width: wBur, height: hBur, rx: 3,
      fill: 'var(--paper)', stroke: 'var(--rule-2)', 'stroke-width': 1.4 }, g);
    const plein = 1 - V / 40;
    make('rect', { x: cx - wBur / 2 + 2, y: yBur + 2 + (hBur - 4) * (1 - plein),
      width: wBur - 4, height: Math.max(0, (hBur - 4) * plein), rx: 2,
      fill: 'var(--sub)', 'fill-opacity': 0.3 }, g);
    for (let k = 0; k <= 4; k++) {
      const y = yBur + 3 + ((hBur - 6) * k) / 4;
      make('line', { x1: cx + wBur / 2, y1: y, x2: cx + wBur / 2 + 5, y2: y,
        stroke: 'var(--ink-mute)', 'stroke-width': 1 }, g);
      if (cote) {
        T(g, cx + wBur / 2 + 8, y + 3.2, fr(10 * k, 0),
          { fs: 8.5, mono: true, anchor: 'start', fill: 'var(--ink-mute)' });
      }
    }
    make('path', { d: 'M' + (cx - 6) + ' ' + (yBur + hBur) + 'h12l-6 9z',
      fill: 'var(--ink-soft)', opacity: 0.75 }, g);

    const hBec = cote ? Math.min(b.h * 0.28, 90) : 42;
    const wBec = cote ? Math.min(b.w * 0.66, 104) : 78;
    const yBec = yBur + hBur + (cote ? 30 : 10);
    const nivMax = hBec - 9;
    const niv = nivMax * Math.min(1, (+va.value + V) / (+va.value + 30));
    const c = teinte(ind, p);
    const cuve = make('rect', { x: cx - wBec / 2, y: yBec + hBec - niv, width: wBec,
      height: niv, fill: c.c, 'fill-opacity': c.o }, g);
    cuve.style.transition = 'fill .28s linear, fill-opacity .28s linear';
    make('path', { d: 'M' + (cx - wBec / 2) + ' ' + yBec + 'v' + hBec + 'h' + wBec + 'V' + yBec,
      fill: 'none', stroke: 'var(--ink-soft)', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g);

    /* La traînée de la dernière goutte. Chaque ellipse naît opaque et large de
       rien, puis s'efface : une transition CSS suffit, il n'y a pas de boucle
       d'animation à tenir pour trois ovales. */
    const now = performance.now();
    bulles = bulles.filter((u) => now - u.t0 < u.duree);
    bulles.forEach((u) => {
      const reste = u.duree - (now - u.t0);
      const e = make('ellipse', { cx, cy: yBec + hBec - niv + 7, rx: 12, ry: 5,
        fill: u.c, opacity: 0.7 * (reste / u.duree) }, g);
      e.style.transition = 'opacity ' + reste + 'ms linear, rx ' + reste + 'ms ease-out';
      requestAnimationFrame(() => {
        e.setAttribute('opacity', '0');
        e.setAttribute('rx', String(wBec / 2 - 3));
      });
    });
    if (bulles.length && !minuteur) {
      minuteur = setTimeout(() => { minuteur = 0; dessine(); }, 400);
    }

    T(g, cx, yBec + hBec + 15, fr(+va.value, 0) + ' mL d’acide',
      { fs: 10, fill: 'var(--ink-soft)' });
    if (cote) {
      T(g, cx, yBur - 6, 'soude ' + fr(+cb.value, 3) + ' mol/L',
        { fs: 10, fill: 'var(--ink-soft)' });
    }
  }

  /* ── la courbe, tracée de ce que l'on a réellement versé ────────────────── */
  function courbe(b, p, V, ind) {
    const pts = [...trace.entries()].sort((a, c) => a[0] - c[0]).map(([x, y]) => [x, y]);
    const g = graphe.draw(svg, b, {
      curves: pts.length > 1 ? [{ pts, color: 'var(--sub)', width: 2 }] : [],
      points: [{ x: V, y: p, r: 4.5, color: 'var(--sub)' }],
    });
    const box = graphe.box;
    if (!box) return;
    if (ind.b) {
      const y1 = box.Y(Math.min(14, ind.z1)), y0 = box.Y(Math.max(0, ind.z0));
      make('rect', { x: box.L, y: y1, width: box.R - box.L, height: Math.max(1, y0 - y1),
        fill: ind.b, opacity: 0.13 }, g);
      T(g, box.R - 6, y1 - 4, 'zone de virage',
        { fs: 9, anchor: 'end', fill: 'var(--ink-mute)' });
    }
    if (vbE != null) {
      const x = box.X(vbE);
      make('line', { x1: x, y1: box.T, x2: x, y2: box.B, stroke: 'var(--ink)',
        'stroke-width': 1.4, 'stroke-dasharray': '5 4', opacity: 0.7 }, g);
      T(g, x, box.T + 12, 'VE marqué', { fs: 9.5, mono: true, fill: 'var(--ink-soft)' });
    }
    if (pts.length < 2) {
      T(g, (box.L + box.R) / 2, (box.T + box.B) / 2, 'versez pour tracer la courbe',
        { fs: 12, fill: 'var(--ink-mute)' });
    }
  }

  lab.onResize(dessine);
  lab.onReset(() => { vb.set(0); oublier(); dessine(); });
  lab.onDestroy(() => { if (minuteur) clearTimeout(minuteur); });
  dessine();
}
