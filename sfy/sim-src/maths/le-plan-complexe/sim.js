// Le plan complexe — déplacer z, et voir où va son image.
//
// Un nombre complexe est un POINT, et une transformation est un DÉPLACEMENT de ce
// point. Tant qu'on ne fait que calculer, z ↦ z² est une identité remarquable ;
// dès qu'on tire le point à la souris, c'est un mouvement dont on voit la règle :
// le module s'élève au carré, l'argument double, et le point tourne deux fois
// plus vite que le doigt.
//
// Deux vues. La première met une transformation en mouvement. La seconde montre
// les racines n-ièmes de l'unité, et surtout que leur somme est nulle — ce qui,
// posé bout à bout, se voit comme un polygone qui se referme.

const TRANSFORMS = [
  { id: 'conj', nom: 'z ↦ z̄  (conjugué)', f: (x, y) => [x, -y],
    lecture: 'symétrie par rapport à l’axe des réels : le module ne change pas, '
      + 'l’argument change de signe.' },
  { id: 'oppose', nom: 'z ↦ −z  (opposé)', f: (x, y) => [-x, -y],
    lecture: 'symétrie par rapport à l’origine, c’est-à-dire la rotation d’un '
      + 'demi-tour : l’argument augmente de π.' },
  { id: 'inverse', nom: 'z ↦ 1/z', f: (x, y) => { const d = x * x + y * y; return d ? [x / d, -y / d] : null; },
    lecture: 'le module devient son inverse, l’argument change de signe. Les points '
      + 'du cercle unité restent sur le cercle ; l’intérieur et l’extérieur '
      + 's’échangent.' },
  { id: 'carre', nom: 'z ↦ z²', f: (x, y) => [x * x - y * y, 2 * x * y],
    lecture: 'le module est élevé au carré, l’argument est DOUBLÉ. Suivez le cercle '
      + 'unité à la souris : l’image en fait deux tours pendant que vous en faites un.' },
  { id: 'cube', nom: 'z ↦ z³', f: (x, y) => [x ** 3 - 3 * x * y * y, 3 * x * x * y - y ** 3],
    lecture: 'l’argument est triplé : l’image fait trois tours quand le point en '
      + 'fait un. C’est ce qui donnera trois racines cubiques à tout complexe.' },
  { id: 'similitude', nom: 'z ↦ a z + b  (similitude)', f: null,
    lecture: 'une rotation d’angle arg(a), une homothétie de rapport |a| et une '
      + 'translation de vecteur b, dans cet ordre. Toute similitude directe du plan '
      + 's’écrit ainsi, et c’est le théorème du chapitre.' },
];

export function mount(lab) {
  const { fr } = lab;
  const svg = lab.svg();

  const vue = lab.select({ label: 'Ce qu’on regarde', value: 'transf',
    options: [{ value: 'transf', label: 'une transformation' },
      { value: 'racines', label: 'les racines n-ièmes' }],
    onChange: () => { maj(); dessine(); } });
  const tr = lab.select({ label: 'La transformation',
    options: TRANSFORMS.map((t) => ({ value: t.id, label: t.nom })), value: 'carre',
    onChange: () => { maj(); dessine(); } });
  const rho = lab.slider({ label: '|a|', min: 0.1, max: 2.5, step: 0.01, value: 1.4, dec: 2, onInput: dessine });
  const theta = lab.slider({ label: 'arg(a)', min: -180, max: 180, step: 1, value: 60, dec: 0,
    format: (v) => fr(v, 0) + '°', onInput: dessine });
  const bx = lab.slider({ label: 'partie réelle de b', min: -3, max: 3, step: 0.05, value: 1, dec: 2, onInput: dessine });
  const by = lab.slider({ label: 'partie imaginaire de b', min: -3, max: 3, step: 0.05, value: 0.5, dec: 2, onInput: dessine });
  const nRac = lab.slider({ label: 'n', min: 2, max: 12, step: 1, value: 6, dec: 0, onInput: dessine });
  const somme = lab.check({ label: 'Poser les racines bout à bout', value: true, onChange: dessine });
  const trace = lab.check({ label: 'Laisser la trace de l’image', value: true, onChange: dessine });

  const texte = (v) => (v == null ? '—' : String(v));
  lab.group('Le point z');
  const rZ = lab.readout({ label: 'z', format: texte, hi: true });
  const rMod = lab.readout({ label: '|z|', format: texte });
  const rArg = lab.readout({ label: 'arg(z)', format: texte });
  lab.group('Son image');
  const rZp = lab.readout({ label: 'z′', format: texte, hi: true });
  const rModp = lab.readout({ label: '|z′|', format: texte });
  const rArgp = lab.readout({ label: 'arg(z′)', format: texte });
  const rLien = lab.readout({ label: 'Ce qui s’est passé', format: texte });

  let z = [1.1, 0.7];
  let trainee = [];

  function maj() {
    const v = vue.value, sim = tr.value === 'similitude';
    tr.show(v === 'transf');
    [rho, theta, bx, by].forEach((s) => s.show(v === 'transf' && sim));
    trace.show(v === 'transf');
    nRac.show(v === 'racines');
    somme.show(v === 'racines');
    trainee = [];
  }

  const mk = (t, a, p) => lab.make(t, a, p);
  function txt(p, x, y, s, a = {}) {
    const t = mk('text', { x, y, 'font-size': a.fs || 11, fill: a.fill || 'var(--ink)',
      'text-anchor': a.anchor || 'start', 'font-weight': a.bold ? 600 : 400,
      'font-family': a.mono ? 'var(--mono)' : 'inherit', opacity: a.op != null ? a.op : 1,
      'paint-order': a.halo ? 'stroke' : null, stroke: a.halo ? 'var(--paper)' : null,
      'stroke-width': a.halo ? 3.2 : null, 'stroke-linejoin': a.halo ? 'round' : null }, p);
    t.textContent = s;
    return t;
  }
  // L'écriture algébrique, comme on l'écrit sur une copie : pas de « + -1 i »,
  // pas de « 1 i », et « 0 » plutôt que « 0 + 0i ».
  function alg(c, d = 3) {
    if (!c) return 'non défini';
    const [x, y] = c;
    const px = fr(x, d), py = fr(Math.abs(y), d);
    if (Math.abs(y) < 5e-4) return px;
    if (Math.abs(x) < 5e-4) return (y < 0 ? '−' : '') + (Math.abs(Math.abs(y) - 1) < 5e-4 ? 'i' : py + ' i');
    return px + (y < 0 ? ' − ' : ' + ') + (Math.abs(Math.abs(y) - 1) < 5e-4 ? 'i' : py + ' i');
  }
  const module = (c) => Math.hypot(c[0], c[1]);
  const argum = (c) => (Math.atan2(c[1], c[0]) * 180) / Math.PI;

  function image(c) {
    const t = TRANSFORMS.find((x) => x.id === tr.value);
    if (t.f) return t.f(c[0], c[1]);
    const th = (theta.value * Math.PI) / 180, r = rho.value;
    const ax = r * Math.cos(th), ay = r * Math.sin(th);
    return [ax * c[0] - ay * c[1] + bx.value, ax * c[1] + ay * c[0] + by.value];
  }

  let rep = null;

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const { w: W, h: H } = lab.size();
    const v = vue.value;
    const fsT = Math.max(12, Math.min(16, W / 46));
    const t = TRANSFORMS.find((x) => x.id === tr.value);
    txt(svg, 10, 8 + fsT, v === 'transf' ? t.nom : 'Les racines n-ièmes de l’unité',
      { fs: fsT, bold: true, mono: v === 'transf' });
    txt(svg, 10, 10 + fsT * 2, v === 'transf'
      ? 'Tirez le point M pour déplacer z. Son image M′ suit.'
      : 'Elles se placent d’elles-mêmes sur le cercle, aux sommets d’un polygone régulier.',
      { fs: 10.5, fill: 'var(--ink-soft)' });
    const haut = 18 + fsT * 2;

    // le plan, à échelles égales : sans cela un cercle devient une ellipse et
    // « module » ne veut plus rien dire
    const box = { x: 8, y: haut, w: W - 16, h: H - haut - 8 };
    const R = v === 'racines' ? 1.55 : 2.6;
    const e = Math.min(box.w / (2 * R), box.h / (2 * R));
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const X = (u) => cx + u * e, Y = (u) => cy - u * e;
    rep = { cx, cy, e, box };

    /* Le fond AVANT le groupe découpé, et non après. En SVG il n'y a pas d'ordre
       de plan : c'est l'ordre du document qui décide, et un rectangle opaque
       ajouté en dernier recouvre tout ce qui précède. La scène était entièrement
       dessinée, entièrement juste, et entièrement cachée. */
    const g = mk('g', {}, svg);
    mk('rect', { x: box.x, y: box.y, width: box.w, height: box.h, fill: 'var(--paper)',
      stroke: 'var(--rule)', 'stroke-width': 1 }, g);
    const cid = 'cadrePlan';
    mk('rect', { x: box.x, y: box.y, width: box.w, height: box.h },
      mk('clipPath', { id: cid }, mk('defs', {}, g)));
    const dedans = mk('g', { 'clip-path': 'url(#' + cid + ')' }, g);

    // quadrillage entier, axes marqués
    const kMax = Math.ceil(R);
    for (let k = -kMax; k <= kMax; k++) {
      const ax = Math.abs(k) < 1e-9;
      mk('line', { x1: X(k), y1: box.y, x2: X(k), y2: box.y + box.h,
        stroke: ax ? 'var(--ink-soft)' : 'var(--rule)', 'stroke-width': ax ? 1.4 : 1,
        opacity: ax ? 0.85 : 0.35 }, dedans);
      mk('line', { x1: box.x, y1: Y(k), x2: box.x + box.w, y2: Y(k),
        stroke: ax ? 'var(--ink-soft)' : 'var(--rule)', 'stroke-width': ax ? 1.4 : 1,
        opacity: ax ? 0.85 : 0.35 }, dedans);
      if (!ax && Math.abs(k) <= kMax) {
        txt(dedans, X(k), Y(0) + 13, String(k), { fs: 9, anchor: 'middle', mono: true,
          fill: 'var(--ink-soft)', halo: true });
        txt(dedans, X(0) + 5, Y(k) + 3.5, String(k) + 'i', { fs: 9, mono: true,
          fill: 'var(--ink-soft)', halo: true });
      }
    }
    // le cercle unité : la référence de tout le chapitre
    mk('circle', { cx: X(0), cy: Y(0), r: e, fill: 'none', stroke: 'var(--ink-soft)',
      'stroke-width': 1.2, 'stroke-dasharray': '4 3', opacity: 0.7 }, dedans);

    if (v === 'transf') vueTransf(dedans, X, Y, e);
    else vueRacines(dedans, X, Y, e);
  }

  function fleche(p, x1, y1, x2, y2, col, larg = 1.8) {
    const a = Math.atan2(y2 - y1, x2 - x1), l = 8;
    mk('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': larg, 'stroke-linecap': 'round' }, p);
    mk('path', { d: 'M' + x2 + ' ' + y2
      + 'L' + (x2 - l * Math.cos(a - 0.4)) + ' ' + (y2 - l * Math.sin(a - 0.4))
      + 'L' + (x2 - l * Math.cos(a + 0.4)) + ' ' + (y2 - l * Math.sin(a + 0.4)) + 'Z', fill: col }, p);
  }

  function vueTransf(g, X, Y, e) {
    const t = TRANSFORMS.find((x) => x.id === tr.value);
    const zp = image(z);

    // la trace : c'est elle qui montre la LOI, une position ne montrant qu'un cas
    if (trace.value && trainee.length > 1) {
      mk('path', { d: trainee.map((p, i) => (i ? 'L' : 'M') + X(p[0]) + ' ' + Y(p[1])).join(' '),
        fill: 'none', stroke: '#c9772b', 'stroke-width': 1.2, opacity: 0.5 }, g);
    }

    // les vecteurs, depuis l'origine : un complexe est aussi un vecteur
    fleche(g, X(0), Y(0), X(z[0]), Y(z[1]), 'var(--sub)');
    if (zp) fleche(g, X(0), Y(0), X(zp[0]), Y(zp[1]), '#c9772b');

    // les arcs d'argument, pour que « l'argument double » se VOIE
    const arc = (c, col) => {
      const r = Math.min(e * 0.42, Math.max(18, e * module(c) * 0.5));
      const a1 = Math.atan2(c[1], c[0]);
      const grand = Math.abs(a1) > Math.PI ? 1 : 0;
      mk('path', { d: 'M' + X(0) + ' ' + Y(0) + ' m' + r + ' 0 A' + r + ' ' + r + ' 0 ' + grand
        + ' ' + (a1 > 0 ? 0 : 1) + ' ' + (X(0) + r * Math.cos(a1)) + ' ' + (Y(0) - r * Math.sin(a1)),
        fill: 'none', stroke: col, 'stroke-width': 1.4, opacity: 0.8 }, g);
    };
    arc(z, 'var(--sub)');
    if (zp && module(zp) > 1e-6) arc(zp, '#c9772b');

    /* L'étiquette part RADIALEMENT, vers l'extérieur : posée toujours en haut à
       droite, elle tombait sur la graduation « 1 » de l'axe dès que le point
       s'en approchait. En s'écartant de l'origine, elle quitte les axes d'elle-même. */
    const pt = (c, nom, col) => {
      if (!c) return;
      const d = Math.hypot(c[0], c[1]) || 1;
      mk('circle', { cx: X(c[0]), cy: Y(c[1]), r: 6, fill: col, stroke: 'var(--paper)', 'stroke-width': 2 }, g);
      txt(g, X(c[0]) + (c[0] / d) * 20, Y(c[1]) - (c[1] / d) * 20 + 4, nom,
        { fs: 12, anchor: 'middle', bold: true, fill: col, halo: true });
    };
    pt(z, 'M(z)', 'var(--sub)');
    pt(zp, 'M′(z′)', '#c9772b');

    rZ.set(alg(z)); rMod.set(fr(module(z), 4)); rArg.set(fr(argum(z), 2) + '°');
    if (!zp) { rZp.set('non défini'); rModp.set('—'); rArgp.set('—'); rLien.set('z = 0 n’a pas d’inverse'); return; }
    rZp.set(alg(zp)); rModp.set(fr(module(zp), 4)); rArgp.set(fr(argum(zp), 2) + '°');
    /* Le lien entre les deux, calculé et non annoncé : c'est ce qui rend la règle
       vérifiable. Sur z², le rapport des modules doit valoir |z| et l'écart des
       arguments doit valoir arg z — l'élève peut le contrôler à chaque position. */
    const m = module(z), mp = module(zp);
    let l = '—';
    if (m > 1e-6) {
      const da = ((argum(zp) - argum(z) + 540) % 360) - 180;
      l = '|z′|/|z| = ' + fr(mp / m, 3) + '   arg(z′) − arg(z) = ' + fr(da, 1) + '°';
    }
    rLien.set(l);
  }

  function vueRacines(g, X, Y, e) {
    const n = Math.round(nRac.value);
    const rac = [];
    for (let k = 0; k < n; k++) {
      const a = (2 * Math.PI * k) / n;
      rac.push([Math.cos(a), Math.sin(a)]);
    }
    // le polygone régulier : les n racines sont ses sommets
    mk('path', { d: rac.map((c, i) => (i ? 'L' : 'M') + X(c[0]) + ' ' + Y(c[1])).join(' ') + ' Z',
      fill: 'var(--sub)', 'fill-opacity': 0.1, stroke: 'var(--sub)', 'stroke-width': 1.6 }, g);
    rac.forEach((c, k) => {
      fleche(g, X(0), Y(0), X(c[0]), Y(c[1]), 'var(--ink-soft)', 1);
      mk('circle', { cx: X(c[0]), cy: Y(c[1]), r: 5.5, fill: 'var(--sub)',
        stroke: 'var(--paper)', 'stroke-width': 1.8 }, g);
      const d = Math.hypot(c[0], c[1]) || 1;
      txt(g, X(c[0]) + (c[0] / d) * 16, Y(c[1]) - (c[1] / d) * 16 + 4,
        k === 0 ? '1' : 'ω' + (k === 1 ? '' : indice(k)),
        { fs: 11.5, anchor: 'middle', bold: true, mono: true, fill: 'var(--sub)', halo: true });
    });

    /* Les mêmes vecteurs, posés bout à bout. Le chemin se referme exactement sur
       l'origine, et c'est la démonstration visuelle que la somme des racines est
       nulle — un fait qu'on démontre d'ordinaire par la somme d'une suite
       géométrique, et qu'on ne voit jamais. */
    if (somme.value) {
      let p = [-0.55, -1.15];
      const dep = p.slice();
      rac.forEach((c) => {
        const q = [p[0] + c[0], p[1] + c[1]];
        fleche(g, X(p[0]), Y(p[1]), X(q[0]), Y(q[1]), '#c9772b', 1.6);
        p = q;
      });
      const ferme = Math.hypot(p[0] - dep[0], p[1] - dep[1]);
      mk('circle', { cx: X(dep[0]), cy: Y(dep[1]), r: 4, fill: 'none', stroke: '#c9772b', 'stroke-width': 2 }, g);
      txt(g, X(dep[0]), Y(dep[1]) + 20, 'la chaîne se referme : somme = ' + fr(ferme, 12),
        { fs: 10, anchor: 'middle', bold: true, fill: '#c9772b', halo: true });
    }

    rZ.set('les n racines de zⁿ = 1');
    rMod.set('toutes de module 1');
    rArg.set('multiples de ' + fr(360 / n, 2) + '°');
    rZp.set('ω = ' + alg([Math.cos(2 * Math.PI / n), Math.sin(2 * Math.PI / n)], 4));
    rModp.set('1');
    rArgp.set(fr(360 / n, 2) + '°  =  2π/' + n);
    const sx = rac.reduce((s, c) => s + c[0], 0), sy = rac.reduce((s, c) => s + c[1], 0);
    rLien.set('somme des racines = ' + alg([sx, sy], 12) + '  (nulle dès que n ≥ 2)');
  }
  const indice = (k) => String(k).replace(/\d/g, (c) => '₀₁₂₃₄₅₆₇₈₉'[+c]);

  /* ── tirer M ───────────────────────────────────────────────────────────── */
  function versZ(evt) {
    if (!rep) return null;
    const r = svg.getBoundingClientRect();
    const { w: W, h: H } = lab.size();
    const px = ((evt.clientX - r.left) / r.width) * W;
    const py = ((evt.clientY - r.top) / r.height) * H;
    return [(px - rep.cx) / rep.e, (rep.cy - py) / rep.e];
  }
  let tire = false;
  const onDown = (e) => {
    if (vue.value !== 'transf') return;
    const c = versZ(e);
    if (!c) return;
    tire = true; z = c; trainee.push(image(z)); dessine();
  };
  const onMove = (e) => {
    if (!tire) return;
    const c = versZ(e);
    if (!c) return;
    z = c;
    const im = image(z);
    if (im) { trainee.push(im); if (trainee.length > 600) trainee.shift(); }
    dessine();
  };
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
  lab.buttons([{ label: 'Effacer la trace', onClick: () => { trainee = []; dessine(); } }]);

  maj();
  lab.onResize(dessine);
  dessine();
}
