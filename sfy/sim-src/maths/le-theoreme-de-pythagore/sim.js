// Le théorème de Pythagore — les trois carrés.
//
// « a² + b² = c² » est une phrase. Les trois carrés construits sur les trois
// côtés, eux, sont des surfaces : on les voit, on lit leur aire, et l'on peut
// poser les deux petites bout à bout pour les comparer à la grande. Quand les
// deux longueurs coïncident, l'égalité est vraie ; quand elles ne coïncident
// pas, elle est fausse. Il n'y a rien d'autre à comprendre.
//
// Et c'est là que le déplacement du point C fait tout le travail : le théorème
// n'est PAS toujours vrai. Il l'est exactement quand l'angle en C est droit, et
// l'ensemble des points où cela se produit est un cercle — celui de diamètre
// [AB]. En tirant C, l'élève découvre ce cercle tout seul, et découvre du même
// coup que la réciproque du théorème sert à reconnaître un angle droit.

const LIMITES = { cMin: 3, cMax: 7 };

export function mount(lab) {
  const { fr } = lab;
  const svg = lab.svg();

  const cAB = lab.slider({ label: 'Longueur de [AB]', min: LIMITES.cMin, max: LIMITES.cMax,
    step: 0.1, value: 5, dec: 1, onInput: () => { cadre(); dessine(); } });
  const vCercle = lab.check({ label: 'Le cercle de l’angle droit', value: false, onChange: dessine });
  const vAires = lab.check({ label: 'Écrire les aires', value: true, onChange: dessine });
  lab.buttons([
    { label: 'Mettre l’angle droit', onClick: () => { redresse(); dessine(); } },
  ]);

  const texte = (v) => (v == null ? '—' : String(v));
  lab.group('Les trois côtés');
  const rA = lab.readout({ label: 'a = BC', format: texte });
  const rB = lab.readout({ label: 'b = AC', format: texte });
  const rC = lab.readout({ label: 'c = AB', format: texte });
  const rAngle = lab.readout({ label: 'angle en C', format: texte, hi: true });
  lab.group('Les deux aires');
  const rSom = lab.readout({ label: 'a² + b²', format: texte });
  const rHyp = lab.readout({ label: 'c²', format: texte });
  const rEcart = lab.readout({ label: 'différence', format: texte });
  const rVerdict = lab.readout({ label: 'Alors ?', format: texte, hi: true });

  // A et B sont posés ; C se promène. Le monde est en unités, et il ne bouge
  // qu'avec [AB] : une vue qui se recadre pendant qu'on tire le point donne le
  // tournis et fait croire que la figure change de forme.
  let C = [1.5, 3];
  let vue = null;

  const borne = (c) => ({ xa: -0.3 * c, xb: 1.3 * c, ya: 0.16 * c, yb: 1.0 * c });

  /* Le cadre est CALCULÉ, et non estimé au jugé. J'avais d'abord posé des
     marges à vue — et les carrés sortaient de l'écran dès que C allait dans un
     coin de sa zone. On construit donc les trois carrés pour chaque coin de
     cette zone, on prend l'enveloppe de tout, et l'on est certain que rien ne
     dépassera jamais. Le cadre ne dépend que de [AB] : il ne bouge pas pendant
     qu'on tire le point, ce qui serait insupportable. */
  function cadre() {
    const c = cAB.value;
    const A = [0, 0], B = [c, 0];
    const z = borne(c);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const compte = (p) => {
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
      y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    };
    [[z.xa, z.ya], [z.xa, z.yb], [z.xb, z.ya], [z.xb, z.yb], [c / 2, z.yb]].forEach((P) => {
      carre(A, P, B).forEach(compte);
      carre(B, P, A).forEach(compte);
    });
    carre(A, B, [c / 2, 1]).forEach(compte);
    const m = c * 0.08;
    vue = { x0: x0 - m, x1: x1 + m, y0: y0 - m, y1: y1 + m };
    C = [Math.max(z.xa, Math.min(z.xb, C[0])), Math.max(z.ya, Math.min(z.yb, C[1]))];
  }
  function redresse() {
    // le pied de l'angle droit le plus proche : la projection de C sur le cercle
    // de diamètre [AB], dont le centre est le milieu de [AB] et le rayon c/2
    const c = cAB.value, m = [c / 2, 0], r = c / 2;
    const d = Math.hypot(C[0] - m[0], C[1] - m[1]) || 1;
    C = [m[0] + ((C[0] - m[0]) / d) * r, Math.max(0.16 * c, m[1] + ((C[1] - m[1]) / d) * r)];
  }

  const mk = (t, a, p) => lab.make(t, a, p);
  let regle = null;
  const mesure = (s, fs, bold) => {
    if (!regle) return String(s).length * fs * 0.52;
    regle.setAttribute('font-size', fs);
    regle.setAttribute('font-weight', bold ? 600 : 400);
    regle.textContent = String(s);
    return regle.getComputedTextLength() || String(s).length * fs * 0.52;
  };
  /* Toutes les étiquettes de la figure passent par ici et sont posées EN
     DERNIER, dans l'ordre de leur importance : les noms des sommets et la
     mesure de l'angle d'abord, les aires ensuite, la légende du cercle en
     dernier. Chacune n'est écrite que si elle ne recouvre rien. Sur une figure
     dont l'utilisateur choisit lui-même la forme, aucune position n'est sûre à
     l'avance — c'est la mesure qui tranche, pas le placement. */
  let aPoser = [];
  function vider(g) {
    const pris = [];
    aPoser.sort((a, b) => a.prio - b.prio).forEach((l) => {
      const t = txt(g, l.x, l.y, l.s, l.o);
      const b = t.getBBox();
      const heurte = pris.some((p) => b.x < p.x + p.width + 2 && b.x + b.width + 2 > p.x
        && b.y < p.y + p.height + 1 && b.y + b.height + 1 > p.y);
      if (heurte) t.remove(); else pris.push(b);
    });
    aPoser = [];
  }
  function txt(p, x, y, s, a = {}) {
    const t = mk('text', { x, y, 'font-size': a.fs || 12, fill: a.fill || 'var(--ink)',
      'text-anchor': a.anchor || 'middle', 'font-weight': a.bold ? 600 : 400,
      'font-family': a.mono ? 'var(--mono)' : 'inherit', opacity: a.op != null ? a.op : 1,
      'paint-order': a.halo ? 'stroke' : null, stroke: a.halo ? 'var(--paper)' : null,
      'stroke-width': a.halo ? 3.4 : null, 'stroke-linejoin': a.halo ? 'round' : null }, p);
    t.textContent = s;
    return t;
  }

  /* Le carré construit sur [PQ], du côté opposé au point `loin`. La normale
     (−dy, dx) place toujours le carré du côté positif du segment ; il suffit
     donc de la retourner quand le troisième sommet s'y trouve déjà. */
  function carre(P, Q, loin) {
    const dx = Q[0] - P[0], dy = Q[1] - P[1];
    const cote = (v) => dx * (v[1] - P[1]) - dy * (v[0] - P[0]);
    const n = cote(loin) > 0 ? [dy, -dx] : [-dy, dx];
    return [P, Q, [Q[0] + n[0], Q[1] + n[1]], [P[0] + n[0], P[1] + n[1]]];
  }
  const aire = (p) => {
    let s = 0;
    for (let i = 0; i < p.length; i++) {
      const q = p[(i + 1) % p.length];
      s += p[i][0] * q[1] - q[0] * p[i][1];
    }
    return Math.abs(s) / 2;
  };

  let repere = null;

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    regle = mk('text', { x: -9999, y: -9999, fill: 'none' }, svg);
    aPoser = [];
    const { w: W, h: H } = lab.size();
    const c = cAB.value;
    const A = [0, 0], B = [c, 0];
    const a = Math.hypot(C[0] - B[0], C[1] - B[1]);
    const b = Math.hypot(C[0] - A[0], C[1] - A[1]);

    const fsT = Math.max(13, Math.min(18, W / 42));
    txt(svg, 12, 10 + fsT, 'Tirez le point C', { fs: fsT, bold: true, anchor: 'start' });
    // le sous-titre se raccourcit plutôt que de sortir du cadre
    const longS = 'Les deux carrés bleus mis bout à bout font-ils la même longueur que le carré orange ?';
    const courtS = 'Les deux bleus font-ils la longueur de l’orange ?';
    txt(svg, 12, 12 + fsT * 2, mesure(longS, 11.5) < W - 24 ? longS : courtS,
      { fs: 11.5, anchor: 'start', fill: 'var(--ink-soft)' });
    const haut = 20 + fsT * 2;

    // la bande de comparaison en bas, la figure au-dessus. 92 px : deux barres,
    // leur écart, et la phrase de conclusion sous le trait rouge — à 74 px cette
    // dernière sortait du cadre d'un pixel.
    const HB = 92;
    const box = { x: 8, y: haut, w: W - 16, h: H - haut - HB - 10 };
    // échelles ÉGALES : un carré doit être carré, sans quoi la figure ne prouve rien
    const e = Math.min(box.w / (vue.x1 - vue.x0), box.h / (vue.y1 - vue.y0));
    const ox = box.x + (box.w - (vue.x1 - vue.x0) * e) / 2;
    const oy = box.y + (box.h - (vue.y1 - vue.y0) * e) / 2;
    const X = (u) => ox + (u - vue.x0) * e;
    const Y = (u) => oy + (vue.y1 - u) * e;
    repere = { X, Y, e, ox, oy, vue, box };

    const g = mk('g', {}, svg);
    const poly = (pts, fill, stroke, larg = 1.6, op = 0.42) =>
      mk('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]) + ' ' + Y(p[1])).join(' ') + ' Z',
        fill, 'fill-opacity': op, stroke, 'stroke-width': larg, 'stroke-linejoin': 'round' }, g);

    // le cercle où l'angle en C est droit : c'est le cercle de diamètre [AB]
    if (vCercle.value) {
      mk('circle', { cx: X(c / 2), cy: Y(0), r: (c / 2) * e, fill: 'none',
        stroke: '#2a9d8f', 'stroke-width': 1.4, 'stroke-dasharray': '5 4', opacity: 0.9 }, g);
      aPoser.push({ x: X(c / 2), y: Y(c / 2) - 8, s: 'ici l’angle en C est droit', prio: 2,
        o: { fs: 10.5, fill: '#2a9d8f', bold: true, halo: true } });
    }

    const BLEU = 'var(--sub)', ORANGE = '#c9772b';
    const cAC = carre(A, C, B), cBC = carre(B, C, A), cAB2 = carre(A, B, C);
    poly(cAB2, ORANGE, ORANGE, 1.8, 0.34);
    poly(cAC, BLEU, BLEU, 1.8, 0.34);
    poly(cBC, BLEU, BLEU, 1.8, 0.34);

    /* L'aire n'est écrite que si le carré est assez grand pour la porter, et
       assez loin de C pour ne pas tomber sur la marque de l'angle. Un carré de
       côté 1 sur un écran étroit fait douze pixels : y forcer « b² = 1,0 »
       revient à poser le texte sur le sommet A. */
    if (vAires.value) {
      const centre = (p) => [p.reduce((s, q) => s + q[0], 0) / 4, p.reduce((s, q) => s + q[1], 0) / 4];
      const fsA = Math.max(10, Math.min(15, e * 0.42));
      [[cAC, b, 'b²', BLEU], [cBC, a, 'a²', BLEU], [cAB2, c, 'c²', ORANGE]].forEach(([K, cote, nom, col]) => {
        if (cote * e < 46) return;
        const k = centre(K);
        if (Math.hypot(X(k[0]) - X(C[0]), Y(k[1]) - Y(C[1])) < 34) return;
        aPoser.push({ x: X(k[0]), y: Y(k[1]) + fsA * 0.35, s: nom + ' = ' + fr(cote * cote, 1), prio: 1,
          o: { fs: fsA, bold: true, mono: true, fill: col, halo: true } });
      });
    }

    // le triangle par-dessus les carrés
    poly([A, B, C], 'var(--ink)', 'var(--ink)', 2.2, 0.12);

    // la marque de l'angle en C : un vrai petit carré quand il est droit, un arc
    // sinon — la différence doit sauter aux yeux
    const angC = (Math.acos(Math.max(-1, Math.min(1,
      ((A[0] - C[0]) * (B[0] - C[0]) + (A[1] - C[1]) * (B[1] - C[1])) / (a * b)))) * 180) / Math.PI;
    const droit = Math.abs(angC - 90) < 0.35;
    const u1 = [(A[0] - C[0]) / b, (A[1] - C[1]) / b];
    const u2 = [(B[0] - C[0]) / a, (B[1] - C[1]) / a];
    const t = Math.min(0.5, 14 / e);
    if (droit) {
      poly([C, [C[0] + u1[0] * t, C[1] + u1[1] * t],
        [C[0] + (u1[0] + u2[0]) * t, C[1] + (u1[1] + u2[1]) * t],
        [C[0] + u2[0] * t, C[1] + u2[1] * t]], '#2a9d8f', '#2a9d8f', 1.6, 0.5);
    } else {
      mk('path', { d: 'M' + X(C[0] + u1[0] * t) + ' ' + Y(C[1] + u1[1] * t)
        + 'A' + t * e + ' ' + t * e + ' 0 0 0 ' + X(C[0] + u2[0] * t) + ' ' + Y(C[1] + u2[1] * t),
        fill: 'none', stroke: 'var(--ink-soft)', 'stroke-width': 1.6 }, g);
    }
    aPoser.push({ x: X(C[0] + (u1[0] + u2[0]) * t * 1.5), y: Y(C[1] + (u1[1] + u2[1]) * t * 1.5) + 4,
      s: fr(angC, 1) + '°', prio: 0,
      o: { fs: 11.5, bold: true, mono: true, fill: droit ? '#2a9d8f' : 'var(--ink-soft)', halo: true } });

    // les trois sommets, C en gros parce que c'est le seul qu'on manipule
    [[A, 'A'], [B, 'B']].forEach(([P, nom]) => {
      mk('circle', { cx: X(P[0]), cy: Y(P[1]), r: 4.5, fill: 'var(--ink)',
        stroke: 'var(--paper)', 'stroke-width': 1.6 }, g);
      aPoser.push({ x: X(P[0]), y: Y(P[1]) + 19, s: nom, prio: 0, o: { fs: 13, bold: true, halo: true } });
    });
    const gC = mk('g', { cursor: 'grab' }, g);
    mk('circle', { cx: X(C[0]), cy: Y(C[1]), r: 11, fill: 'var(--sub)', 'fill-opacity': 0.22 }, gC);
    mk('circle', { cx: X(C[0]), cy: Y(C[1]), r: 6.5, fill: 'var(--sub)',
      stroke: 'var(--paper)', 'stroke-width': 2 }, gC);
    aPoser.push({ x: X(C[0]), y: Y(C[1]) - 16, s: 'C', prio: 0,
      o: { fs: 14, bold: true, fill: 'var(--sub)', halo: true } });

    vider(g);
    comparaison({ x: 8, y: H - HB - 2, w: W - 16, h: HB }, a, b, c, droit);
    if (regle) { regle.remove(); regle = null; }

    /* ── mesures ── */
    rA.set(fr(a, 2)); rB.set(fr(b, 2)); rC.set(fr(c, 2));
    rAngle.set(fr(angC, 1) + '°' + (droit ? '   c’est un angle droit' : ''));
    rSom.set(fr(a * a + b * b, 2) + '   (' + fr(a * a, 1) + ' + ' + fr(b * b, 1) + ')');
    rHyp.set(fr(c * c, 2));
    const d = a * a + b * b - c * c;
    rEcart.set((d > 0 ? '+' : '') + fr(d, 2));
    rVerdict.set(droit
      ? 'angle droit  →  a² + b² = c²'
      : d > 0 ? 'angle aigu  →  a² + b² est PLUS GRAND que c²'
        : 'angle obtus  →  a² + b² est PLUS PETIT que c²');
  }

  /* ── la bande de comparaison ──────────────────────────────────────────────
     Les deux petites aires posées bout à bout, sous la grande. C'est la même
     question que le théorème, mais posée en longueurs : deux segments coïncident
     ou non, et cela se juge sans calcul. */
  function comparaison(box, a, b, c, droit) {
    const g = mk('g', {}, svg);
    const L = box.x + 74, R = box.x + box.w - 12;
    const maxi = Math.max(a * a + b * b, c * c) * 1.06;
    const l = (v) => (v / maxi) * (R - L);
    const h = 17, y1 = box.y + 10, y2 = y1 + h + 8;

    txt(g, L - 8, y1 + h * 0.72, 'a² + b²', { fs: 12, anchor: 'end', bold: true, mono: true, fill: 'var(--sub)' });
    mk('rect', { x: L, y: y1, width: l(a * a), height: h, fill: 'var(--sub)', 'fill-opacity': 0.72 }, g);
    mk('rect', { x: L + l(a * a), y: y1, width: l(b * b), height: h, fill: 'var(--sub)', 'fill-opacity': 0.4,
      stroke: 'var(--paper)', 'stroke-width': 1 }, g);
    txt(g, L - 8, y2 + h * 0.72, 'c²', { fs: 12, anchor: 'end', bold: true, mono: true, fill: '#c9772b' });
    mk('rect', { x: L, y: y2, width: l(c * c), height: h, fill: '#c9772b', 'fill-opacity': 0.62 }, g);

    // le trait de comparaison : il descend du bout de la somme jusqu'au bout de c²
    const xs = L + l(a * a + b * b), xc = L + l(c * c);
    mk('line', { x1: xs, y1: y1 - 4, x2: xs, y2: y2 + h + 5, stroke: 'var(--sub)', 'stroke-width': 1.6 }, g);
    mk('line', { x1: xc, y1: y2 - 4, x2: xc, y2: y2 + h + 5, stroke: '#c9772b', 'stroke-width': 1.6 }, g);
    if (Math.abs(xs - xc) > 3) {
      mk('line', { x1: Math.min(xs, xc), y1: y2 + h + 5, x2: Math.max(xs, xc), y2: y2 + h + 5,
        stroke: '#c1121f', 'stroke-width': 2.4 }, g);
      const et = 'il manque ' + fr(Math.abs(a * a + b * b - c * c), 1);
      txt(g, (xs + xc) / 2, y2 + h + 16, et, { fs: 11, bold: true, fill: '#c1121f', halo: true });
    } else {
      txt(g, (xs + xc) / 2, y2 + h + 16, droit ? 'les deux longueurs sont égales' : 'presque égales',
        { fs: 11.5, bold: true, fill: '#2a9d8f', halo: true });
    }
  }

  /* ── tirer C ──────────────────────────────────────────────────────────── */
  function versMonde(evt) {
    if (!repere) return null;
    const r = svg.getBoundingClientRect();
    const { w: W, h: H } = lab.size();
    const px = ((evt.clientX - r.left) / r.width) * W;
    const py = ((evt.clientY - r.top) / r.height) * H;
    const c = cAB.value;
    return [Math.max(-0.3 * c, Math.min(1.3 * c, repere.vue.x0 + (px - repere.ox) / repere.e)),
      Math.max(0.16 * c, Math.min(1.0 * c, repere.vue.y1 - (py - repere.oy) / repere.e))];
  }
  let tire = false;
  const onDown = (e) => {
    const p = versMonde(e);
    if (!p) return;
    // on ne saisit que dans le cadre de la figure, pas dans la bande du bas
    const r = svg.getBoundingClientRect();
    const { h: H } = lab.size();
    const py = ((e.clientY - r.top) / r.height) * H;
    if (py > repere.box.y + repere.box.h) return;
    tire = true; C = p; dessine();
  };
  const onMove = (e) => { if (!tire) return; const p = versMonde(e); if (p) { C = p; dessine(); } };
  const onUp = () => { tire = false; };
  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', onUp);
  svg.addEventListener('pointercancel', onUp);
  lab.onDestroy(() => {
    svg.removeEventListener('pointerdown', onDown);
    svg.removeEventListener('pointermove', onMove);
    svg.removeEventListener('pointerup', onUp);
    svg.removeEventListener('pointercancel', onUp);
  });

  cadre();
  redresse();
  lab.onResize(dessine);
  dessine();
}
