// Le Maroc : les défis du développement
//
// Une carte thématique se construit par COUCHES, et c'est en les posant l'une
// après l'autre qu'on comprend un pays. Densité, agriculture irriguée,
// phosphates, industrie, tourisme, ports, barrages : chacune se lit seule, et
// c'est leur superposition qui dit l'essentiel.
//
// Elles tombent presque toutes au même endroit — une bande atlantique large de
// deux cents kilomètres, entre Kénitra et Safi. Ce n'est pas un hasard, et la
// carte laisse le voir plutôt qu'elle ne l'affirme : c'est là que se trouvent
// les plaines, la pluie, les barrages, les ports, donc les villes, donc les
// usines. Le revers du même fait est la marge : montagne, Oriental, Sahara.
//
// Le fond est un CROQUIS : un tracé simplifié, comme celui qu'on demande à
// l'épreuve. Les positions sont justes, le détail des côtes ne l'est pas — et
// il n'a pas à l'être pour ce qu'on cherche à montrer.

import { REGIONS, RELIEFS, LIEUX, COUCHES } from './maroc.js';
import { CONTOURS } from './maroc-fond.js';

export function mount(lab) {
  const { make, fr } = lab;

  lab.group('La carte');
  const couche = lab.select({
    label: 'Couche', value: 'population',
    options: COUCHES.map((c) => ({ value: c.id, label: c.nom }))
      .concat([{ value: 'toutes', label: 'toutes les couches à la fois' }]),
  });
  const region = lab.select({
    label: 'Région', value: 'Casablanca-Settat',
    options: REGIONS.map((r) => ({ value: r.nom, label: r.nom })),
  });
  lab.group('Ce qu’on ajoute');
  const relief = lab.check({ label: 'Les massifs montagneux', value: true });
  const nomsR = lab.check({ label: 'Les noms de régions', value: true });
  const vue = lab.select({
    label: 'Ce qu’on regarde', value: 'carte',
    options: [{ value: 'carte', label: 'la carte' },
      { value: 'classement', label: 'les régions, classées' }],
  });

  /* ── mesures ───────────────────────────────────────────────────────── */
  const regR = lab.readout({ label: 'région', format: (s) => s || '—', hi: true });
  const popR = lab.readout({ label: 'population (2014)', format: (s) => s || '—' });
  const surfR = lab.readout({ label: 'superficie', format: (s) => s || '—' });
  const densR = lab.readout({ label: 'densité', format: (s) => s || '—', hi: true });
  const partR = lab.readout({ label: 'part du pays', format: (s) => s || '—' });
  const litR = lab.readout({ label: 'la bande atlantique', format: (s) => s || '—', hi: true });
  const coucheR = lab.readout({ label: 'ce que montre la couche', format: (s) => s || '—' });
  const lieuxR = lab.readout({ label: 'dans cette région', format: (s) => s || '—' });

  const reg = () => REGIONS.find((r) => r.nom === region.value);
  const POP = REGIONS.reduce((s, r) => s + r.pop, 0);
  // Les quatre régions qui bordent l'Atlantique entre Kénitra et Safi, plus
  // Tanger : c'est la définition la plus simple de la « bande atlantique ».
  const LITTORAL = ['Casablanca-Settat', 'Rabat-Salé-Kénitra', 'Tanger-Tétouan-Al Hoceïma', 'Marrakech-Safi'];

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  // 28,3° : la latitude moyenne du pays, de Tanger à Lagouira.
  const geo = lab.carte(CONTOURS, { parallele: 28.3 });
  const PAD = { l: 20, r: 18, t: 32, b: 18 };
  let cibles = [];

  function paint() {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    cibles = [];
    const W = w - PAD.l - PAD.r, H = h - PAD.t - PAD.b;
    relief.row.hidden = vue.value !== 'carte';
    nomsR.row.hidden = vue.value !== 'carte';
    if (vue.value === 'carte') carte(PAD.l, PAD.t, W, H);
    else classement(PAD.l, PAD.t, W, H);
    releves();
  }

  function carte(X0, Y0, W, H) {
    const c = COUCHES.find((x) => x.id === couche.value);
    label(X0, 14, c ? 'Le Maroc — ' + c.nom : 'Le Maroc — toutes les couches', 'lab');
    const aPoser = [];              // les noms de massifs, posés en dernier

    /* La projection vient du banc, qui cale l'emprise du contour dans la boîte.
       Le parallèle de référence est celui du milieu du pays : sans lui, une
       longitude vaudrait un degré de latitude, ce qui n'est vrai qu'à
       l'équateur, et le Maroc serait étiré d'un bon quart.

       Elle est séparable — l'abscisse ne dépend que de la longitude, l'ordonnée
       que de la latitude — donc les régions, les reliefs et les trente-six
       lieux continuent d'être placés par X() et Y() sans rien changer. */
    const P = geo.cadre({ x: X0 + 130, y: Y0 + 20, w: W - 150, h: H - 26 });
    const X = (lon) => P(lon, 0)[0];
    const Y = (lat) => P(0, lat)[1];

    /* Le pays. Ce fut quarante-quatre points tapés à la main, dont une frontière
       saharienne en marches d'escalier ; c'est maintenant le tracé de Natural
       Earth, édition « point de vue marocain » — celle qui donne un seul pays,
       Sahara compris, comme la carte scolaire. */
    make('path', { d: geo.chemin('MA', P),
      fill: 'var(--paper-2)', stroke: 'var(--ink-soft)', 'stroke-width': 1.4,
      'stroke-linejoin': 'round' }, g);

    // la densité, en aplats derrière tout le reste
    if (couche.value === 'population' || couche.value === 'toutes') {
      const dmax = Math.max(...REGIONS.map((r) => r.densite));
      REGIONS.forEach((r) => {
        const t = Math.sqrt(r.densite / dmax);
        const rad = 6 + 34 * Math.sqrt(r.pop / Math.max(...REGIONS.map((q) => q.pop)));
        make('circle', { cx: X(r.xy[0]), cy: Y(r.xy[1]), r: rad,
          fill: 'rgb(' + Math.round(232 - 200 * t) + ',' + Math.round(226 - 134 * t)
            + ',' + Math.round(213 - 139 * t) + ')',
          opacity: .8, stroke: r.nom === region.value ? 'var(--ink)' : 'var(--paper)',
          'stroke-width': r.nom === region.value ? 2.4 : 1 }, g);
      });
    }

    /* Les massifs, en traits épais. Leurs NOMS sont mis de côté et posés en tout
       dernier : « Moyen Atlas » tombait en plein sur le chiffre d'une région, et
       entre un repère de relief et une donnée, c'est la donnée qui gagne. Le
       nom qui ne trouve pas de place n'est pas écrit — le trait, lui, reste, et
       il suffit à situer la chaîne. */
    if (relief.value) {
      RELIEFS.forEach((m) => {
        make('path', { d: m.pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]) + ' ' + Y(p[1])).join(' '),
          fill: 'none', stroke: 'var(--ink-mute)', 'stroke-width': 5, opacity: .35,
          'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
        const mid = m.pts[Math.floor(m.pts.length / 2)];
        aPoser.push({ x: X(mid[0]), y: Y(mid[1]) - 8, nom: m.nom, cls: 'ax mid', prio: 2 });
      });
    }

    // les symboles de la couche choisie
    const vus = couche.value === 'toutes'
      ? LIEUX : LIEUX.filter((l) => l.couche === couche.value);
    vus.forEach((l) => {
      const col = (COUCHES.find((x) => x.id === l.couche) || {}).sym || 'var(--sub)';
      const rr = 3 + l.poids * 0.62;
      symbole(l.couche, X(l.xy[0]), Y(l.xy[1]), rr, col);
      cibles.push({ lieu: l, x: X(l.xy[0]), y: Y(l.xy[1]), r: rr + 5 });
      if (couche.value !== 'toutes' && l.poids >= 5) {
        aPoser.push({ x: X(l.xy[0]), y: Y(l.xy[1]) - rr - 5, nom: l.nom, cls: 'ax mid', prio: 1 });
      }
    });

    // les régions : un point de repère et, si demandé, leur nom
    REGIONS.forEach((r) => {
      const x = X(r.xy[0]), y = Y(r.xy[1]);
      cibles.push({ reg: r, x, y, r: 16 });
      const vedette = r.nom === region.value;
      if (nomsR.value && couche.value !== 'population' && couche.value !== 'toutes') {
        aPoser.push({ x, y, nom: abrege(r.nom), cls: vedette ? 'tau mid' : 'ax mid', prio: vedette ? -1 : 0 });
      }
      if ((couche.value === 'population' || couche.value === 'toutes') && nomsR.value) {
        aPoser.push({ x, y: y + 4, nom: fr(r.pop, 1), cls: vedette ? 'tau mid' : 'ax mid', prio: vedette ? -1 : 0 });
      }
    });

    /* Toutes les étiquettes de la carte sont posées ici, et dans cet ordre :
       la région sélectionnée d'abord, puis les autres régions, puis les lieux,
       puis les massifs. Chacune n'est écrite que si elle ne recouvre rien de
       déjà posé — on mesure l'encre au lieu de la deviner.

       L'ordre EST la règle : entre le chiffre d'une région et le nom d'une
       chaîne de montagnes, c'est la donnée qui gagne. Une étiquette sacrifiée
       ne perd rien, puisque cliquer le symbole donne toujours son nom ; deux
       étiquettes superposées, elles, ne se lisent ni l'une ni l'autre. */
    const pris = [...g.querySelectorAll('text')].map((t) => t.getBBox());
    aPoser.sort((a, b) => a.prio - b.prio).forEach((m) => {
      const t = label(m.x, m.y, m.nom, m.cls);
      t.setAttribute('stroke', 'var(--paper-2)'); t.setAttribute('stroke-width', '3');
      t.setAttribute('paint-order', 'stroke');
      const b = t.getBBox();
      const heurte = pris.some((p) => b.x < p.x + p.width + 2 && b.x + b.width + 2 > p.x
        && b.y < p.y + p.height + 1 && b.y + b.height + 1 > p.y);
      if (heurte) t.remove(); else pris.push(b);
    });

    legende(X0, Y0 + 26);
  }
  const abrege = (n) => n.split(/[- ]/)[0].replace('L’', '');

  // Chaque couche a sa forme : on doit pouvoir lire la carte en noir et blanc.
  function symbole(type, x, y, r, col) {
    const a = { fill: col, opacity: .82, stroke: 'var(--paper)', 'stroke-width': 1 };
    if (type === 'ports') {
      make('path', { d: 'M' + x + ' ' + (y - r) + 'L' + (x + r) + ' ' + y
        + 'L' + x + ' ' + (y + r) + 'L' + (x - r) + ' ' + y + 'Z', ...a }, g);
    } else if (type === 'phosphates') {
      make('rect', { x: x - r * 0.85, y: y - r * 0.85, width: r * 1.7, height: r * 1.7, ...a }, g);
    } else if (type === 'industrie') {
      make('path', { d: 'M' + (x - r) + ' ' + (y + r) + 'L' + (x - r) + ' ' + (y - r * 0.2)
        + 'L' + x + ' ' + (y + r * 0.3) + 'L' + x + ' ' + (y - r * 0.6)
        + 'L' + (x + r) + ' ' + (y + r * 0.3) + 'L' + (x + r) + ' ' + (y + r) + 'Z', ...a }, g);
    } else if (type === 'eau') {
      make('path', { d: 'M' + (x - r) + ' ' + (y + r * 0.6) + 'Q' + x + ' ' + (y - r * 1.1)
        + ' ' + (x + r) + ' ' + (y + r * 0.6) + 'Z', ...a }, g);
    } else if (type === 'tourisme') {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r;
        d += (i ? 'L' : 'M') + (x + rad * Math.cos(ang)) + ' ' + (y + rad * Math.sin(ang));
      }
      make('path', { d: d + 'Z', ...a }, g);
    } else {
      make('circle', { cx: x, cy: y, r, ...a }, g);
    }
  }

  function legende(x, y) {
    const liste = couche.value === 'toutes'
      ? COUCHES.filter((c) => c.sym) : COUCHES.filter((c) => c.id === couche.value && c.sym);
    liste.forEach((c, i) => {
      const py = y + i * 17;
      symbole(c.id, x + 8, py, 5.5, c.sym);
      label(x + 19, py + 4, c.nom, 'ax start');
    });
    if (couche.value === 'population' || couche.value === 'toutes') {
      const py = y + liste.length * 17 + (liste.length ? 6 : 0);
      make('circle', { cx: x + 8, cy: py, r: 6, fill: 'rgb(70,120,100)', opacity: .8 }, g);
      label(x + 19, py + 4, 'population : le disque, la densité : la teinte', 'ax start');
    }
  }

  function classement(X0, Y0, W, H) {
    label(X0, 14, 'Les douze régions, classées par densité', 'lab');
    const tri = REGIONS.slice().sort((a, b) => b.densite - a.densite);
    const bh = Math.min(26, (H - 34) / tri.length);
    const bx = X0 + 210, bw = W - 300;
    const dmax = tri[0].densite;
    tri.forEach((r, i) => {
      const y = Y0 + 26 + i * bh, sel = r.nom === region.value;
      const l = Math.max(1.5, (r.densite / dmax) * bw);
      make('rect', { x: bx, y: y + bh * 0.14, width: l, height: bh * 0.68, rx: 2,
        fill: LITTORAL.includes(r.nom) ? 'var(--sub)' : 'var(--ink-soft)', opacity: sel ? 1 : .55 }, g);
      label(bx - 8, y + bh * 0.66, r.nom, sel ? 'tau end' : 'ax end');
      label(bx + l + 8, y + bh * 0.66, fr(r.densite, 1) + ' hab/km²', 'ax start');
      cibles.push({ reg: r, x: bx + bw / 2, y: y + bh / 2, r: bh, large: true, x0: X0, x1: X0 + W });
    });
    const yb = Y0 + 26 + tri.length * bh + 16;
    if (yb < Y0 + H) {
      make('rect', { x: X0, y: yb - 10, width: 11, height: 11, fill: 'var(--sub)', opacity: .8 }, g);
      label(X0 + 18, yb, 'les quatre régions de la bande atlantique', 'ax start');
    }
  }

  function releves() {
    const r = reg();
    regR.set(r.nom + '  —  chef-lieu : ' + r.chef);
    popR.set(fr(r.pop, 3).replace(',', ',') + ' million' + (r.pop > 1 ? 's' : '') + ' d’habitants');
    surfR.set(fr(r.surf, 0) + ' km²');
    const tri = REGIONS.slice().sort((a, b) => b.densite - a.densite);
    // « 1ᵉ » n'existe pas : au premier rang on écrit « 1ʳᵉ ».
    const rang = tri.indexOf(r) + 1;
    densR.set(fr(r.densite, 1) + ' hab/km²   —  ' + rang + (rang === 1 ? 'ʳᵉ' : 'ᵉ') + ' des douze');
    partR.set(fr(r.pop / POP * 100, 1) + ' % de la population du pays, sur '
      + fr(r.surf / REGIONS.reduce((s, q) => s + q.surf, 0) * 100, 1) + ' % du territoire');
    const pl = REGIONS.filter((q) => LITTORAL.includes(q.nom));
    const pp = pl.reduce((s, q) => s + q.pop, 0), ps = pl.reduce((s, q) => s + q.surf, 0);
    litR.set('quatre régions rassemblent ' + fr(pp / POP * 100, 0) + ' % des Marocains sur '
      + fr(ps / REGIONS.reduce((s, q) => s + q.surf, 0) * 100, 0) + ' % du territoire');
    const c = COUCHES.find((x) => x.id === couche.value);
    coucheR.set(c ? MOTS[c.id] : MOTS.toutes);
    // ce que la couche montre dans la région choisie, par proximité
    const proches = LIEUX.filter((l) => (couche.value === 'toutes' || l.couche === couche.value)
      && Math.hypot(l.xy[0] - r.xy[0], l.xy[1] - r.xy[1]) < 2.2);
    lieuxR.set(proches.length ? proches.map((l) => l.nom).join(' · ') : 'rien de cette couche ici');
  }

  const MOTS = {
    population: 'Le disque dit la population, la teinte la densité. Les deux ne se confondent '
      + 'pas : le Drâa-Tafilalet a plus d’habitants que Guelmim, mais s’étend sur le double.',
    agriculture: 'Toutes les grandes plaines irriguées sont atlantiques ou proches d’un barrage. '
      + 'L’agriculture marocaine tient à l’eau, et l’eau tient aux montagnes.',
    phosphates: 'Le Maroc détient les premières réserves mondiales. Khouribga, Benguerir et '
      + 'Youssoufia sont reliés par voie ferrée aux ports de Casablanca, Jorf Lasfar et Safi : '
      + 'la mine ne vaut que par le port.',
    industrie: 'Casablanca d’abord, puis Tanger et Kénitra pour l’automobile. Une industrie '
      + 'littorale, tournée vers l’exportation, et concentrée sur trois cents kilomètres.',
    tourisme: 'Deux moteurs : le balnéaire (Agadir) et le patrimoine (Marrakech, Fès). '
      + 'Le tourisme est l’une des premières sources de devises du pays.',
    ports: 'Tanger Med est devenu le premier port à conteneurs d’Afrique. Le pays a joué sa '
      + 'position sur le détroit — quatorze kilomètres entre deux continents.',
    eau: 'La politique des barrages date des années 1960. Elle a permis l’irrigation, mais '
      + 'la sécheresse récurrente reste la première contrainte du pays.',
    toutes: 'Superposées, les couches se rassemblent presque toutes sur la même bande '
      + 'atlantique. C’est là que sont les plaines, la pluie, les ports et les hommes — et '
      + 'c’est ce déséquilibre qui fait le principal défi du territoire.',
  };

  /* ── choisir en cliquant ───────────────────────────────────────────── */
  const clic = (ev) => {
    const rr = svg.getBoundingClientRect(), { w, h } = lab.size();
    const px = (ev.clientX - rr.left) * (w / rr.width), py = (ev.clientY - rr.top) * (h / rr.height);
    let best = null, d2 = 1e9;
    for (const c of cibles) {
      if (c.large && (px < c.x0 || px > c.x1)) continue;
      const dx = c.large ? 0 : px - c.x, dy = py - c.y;
      const d = dx * dx + dy * dy;
      if (d < c.r * c.r * 1.5 && d < d2) { d2 = d; best = c; }
    }
    if (!best) return;
    if (best.reg) { region.set(best.reg.nom); paint(); }
    else if (best.lieu) { lieuxR.set(best.lieu.nom + ' — ' + best.lieu.mot); }
  };
  svg.addEventListener('pointerdown', clic);
  svg.style.cursor = 'pointer';
  lab.onDestroy(() => svg.removeEventListener('pointerdown', clic));

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

  [couche, region, vue].forEach((s) => s.el.addEventListener('change', paint));
  [relief, nomsR].forEach((c) => c.el.addEventListener('change', paint));
  lab.onResize(paint);
  paint();
}
