// La courbe d'Aston et l'énergie de liaison
//
// Le §II-2-2, le §III et tout le §IV. Le point de départ est une mesure
// dérangeante : un noyau pèse MOINS que ses nucléons pris un à un. Ce qui
// manque, le défaut de masse, n'est pas perdu — c'est l'énergie qui tient le
// noyau ensemble, par E = Δm c².
//
//   Δm = Z·m_p + (A−Z)·m_n − m_noyau        E_ℓ = Δm·c²        E_ℓ/A
//
// Aucune énergie de liaison n'est écrite dans ce fichier ni dans sa table :
// toutes sortent des masses mesurées. On peut donc vérifier le calcul contre
// les valeurs du cours — 28,3 MeV pour l'hélium 4, 7,59 MeV/nucléon pour
// l'uranium 235 — au lieu de les recopier.
//
// La courbe d'Aston porte l'OPPOSÉE de E_ℓ/A, comme le cours. Ce signe n'est pas
// une coquetterie : il creuse une vallée, et l'on voit alors que les noyaux
// lourds comme les noyaux légers ont intérêt à y descendre. La fission et la
// fusion cessent d'être deux règles à retenir pour devenir deux façons de
// tomber au même endroit.

import { NOYAUX, LE_PLUS_LIE, trouve, U_MEV, U_KG, MEV_J, C, M_P, M_N, M_E } from './noyaux.js';

export function mount(lab) {
  const { make, fr } = lab;

  /* ── réglages ──────────────────────────────────────────────────────── */
  lab.group('Le noyau étudié');
  const choix = lab.select({
    label: 'Noyau',
    options: NOYAUX.map((n) => ({ value: n.cle, label: n.cle + ' — ' + n.nom })),
    value: 'He-4',
  });
  lab.group('Affichage');
  const vue = lab.select({
    label: 'Ce qu’on regarde',
    options: [{ value: 'aston', label: 'la courbe d’Aston' },
      { value: 'noyau', label: 'le défaut de masse de ce noyau' }],
    value: 'aston',
  });
  const sens = lab.select({
    label: 'Axe vertical',
    options: [{ value: 'aston', label: '− E/A — la vallée du cours' },
      { value: 'direct', label: '+ E/A — la bosse' }],
    value: 'aston',
  });
  const fleches = lab.check({ label: 'Montrer où mènent fission et fusion', value: true });

  /* ── mesures ───────────────────────────────────────────────────────── */
  const compo = lab.readout({ label: 'composition', format: (s) => s || '—' });
  const mNuc = lab.readout({ label: 'Z·m_p + N·m_n', format: (s) => s || '—' });
  const mNoy = lab.readout({ label: 'masse du noyau', format: (s) => s || '—' });
  const dmRead = lab.readout({ label: 'défaut de masse Δm', format: (s) => s || '—', hi: true });
  const relRead = lab.readout({ label: 'Δm / masse', format: (s) => s || '—' });
  const elRead = lab.readout({ label: 'énergie de liaison E = Δm c²', format: (s) => s || '—', hi: true });
  const eaRead = lab.readout({ label: 'E par nucléon', format: (s) => s || '—', hi: true });
  const stab = lab.readout({ label: 'stabilité', format: (s) => s || '—' });
  lab.readout({ label: '— les unités —', format: () => '' });
  const u1 = lab.readout({ label: '1 u', format: (s) => s || '—' });
  const u2 = lab.readout({ label: '1 u en énergie', format: (s) => s || '—' });
  const u3 = lab.readout({ label: '1 MeV', format: (s) => s || '—' });

  const noyau = () => trouve(choix.value.split('-')[0], +choix.value.split('-')[1]);

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  const graphe = lab.chart({
    x: { label: 'A — nombre de nucléons', zero: false },
    y: { label: 'E / A', unit: 'MeV par nucléon', zero: false },
  });
  const PAD = { l: 20, r: 18, t: 34, b: 18 };
  let cibles = [];                    // {n, x, y} en pixels, pour le clic

  function paint() {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    cibles = [];
    sens.row.hidden = vue.value !== 'aston';
    fleches.row.hidden = vue.value !== 'aston';

    const W = w - PAD.l - PAD.r, H = h - PAD.t - PAD.b;
    if (vue.value === 'aston') dessinAston(PAD.l, PAD.t, W, H);
    else dessinNoyau(PAD.l, PAD.t, W, H);

    const n = noyau();
    compo.set(n.Z + ' protons et ' + n.N + ' neutrons — ' + n.nom);
    mNuc.set(fr(n.nucleons, 6) + ' u');
    mNoy.set(fr(n.noyau, 6) + ' u');
    dmRead.set(n.A === 1 ? 'aucun : un seul nucléon n’est lié à rien'
      : fr(n.dm, 6) + ' u   soit ' + (n.dm * U_KG).toExponential(3).replace('.', ',').replace('e-', ' × 10⁻') + ' kg');
    relRead.set(n.A === 1 ? '—' : fr(100 * n.dm / n.nucleons, 3) + ' %  de la masse — un défaut très faible');
    elRead.set(n.A === 1 ? '0' : fr(n.El, 2) + ' MeV   soit ' + fr(n.El * MEV_J * 1e11, 3) + ' × 10⁻¹¹ J');
    eaRead.set(n.A === 1 ? '—' : fr(n.EA, 3) + ' MeV / nucléon');
    const ecart = LE_PLUS_LIE.EA - n.EA;
    stab.set(n.A === 1 ? '—'
      : ecart < 0.001 ? 'le plus lié de la table — le fond de la vallée'
        : fr(ecart, 3) + ' MeV/nucléon sous le maximum (' + LE_PLUS_LIE.cle + ')');
    u1.set(fr(U_KG * 1e27, 5) + ' × 10⁻²⁷ kg');
    u2.set(fr(U_MEV, 2) + ' MeV   (c’est u·c²)');
    u3.set(fr(MEV_J * 1e13, 4) + ' × 10⁻¹³ J');
  }

  /* ── la courbe d'Aston ─────────────────────────────────────────────── */
  function dessinAston(X0, Y0, W, H) {
    const bas = sens.value === 'aston';
    label(X0, 14, bas ? 'Courbe d’Aston — on porte l’OPPOSÉE de E/A, ce qui creuse une vallée'
      : 'Énergie de liaison par nucléon — le maximum est le noyau le plus solide', 'lab');
    const signe = bas ? -1 : 1;
    const lies = NOYAUX.filter((n) => n.A > 1);
    const n = noyau();
    graphe.draw(g, { x: X0, y: Y0 + 8, w: W, h: H - 8 }, {
      curves: [{ pts: lies.slice().sort((a, b) => a.A - b.A).map((o) => [o.A, signe * o.EA]),
        color: 'var(--rule)', width: 1.2 }],
      points: lies.map((o) => ({ x: o.A, y: signe * o.EA,
        r: o === n ? 5.5 : 2.6,
        color: o === n ? 'var(--sub)' : o === LE_PLUS_LIE ? 'var(--ink)' : 'var(--ink-mute)' })),
    });
    // Les cibles du clic : on demande au graphe où il a posé chaque point.
    lies.forEach((o) => { const p = graphe.at(o.A, signe * o.EA); if (p) cibles.push({ n: o, ...p }); });

    // Les deux étiquettes sont posées à la main, de part et d'autre : le graphe
    // les met toutes au-dessus, et près du fond de la vallée le noyau choisi et
    // le plus lié sont voisins — leurs noms se chevauchaient.
    const pm = graphe.at(LE_PLUS_LIE.A, signe * LE_PLUS_LIE.EA);
    // Ramenées dans le cadre, elles aussi : un noyau léger comme l'hélium 4 est
    // tout contre l'axe des ordonnées, et son nom mordait sur les graduations.
    // Elles sont retenues : ce sont des données, et les légendes leur cèdent.
    const noms = [];
    if (pm && n !== LE_PLUS_LIE) noms.push(cadrer(label(pm.x, pm.y + 17, LE_PLUS_LIE.cle, 'ax'), X0 + 58, X0 + W - 4));
    if (n.A > 1) {
      const pn = graphe.at(n.A, signe * n.EA);
      if (pn) noms.push(cadrer(label(pn.x, pn.y - 10, n.cle, 'tau'), X0 + 58, X0 + W - 4));
    } else {
      // L'hydrogène 1 n'est pas sur la courbe, et l'y pointer serait faux : un
      // nucléon seul n'a pas d'énergie de liaison. On le dit plutôt.
      label(X0 + W / 2, Y0 + 26,
        'L’hydrogène 1 n’est pas sur la courbe : un nucléon seul n’est lié à rien.', 'tau');
    }

    if (!fleches.value) return;
    // Fission et fusion, dessinées comme deux descentes vers le même creux.
    const creux = graphe.at(LE_PLUS_LIE.A, signe * LE_PLUS_LIE.EA);
    const gauche = graphe.at(2, signe * trouve('H', 2).EA);
    const droite = graphe.at(238, signe * trouve('U', 238).EA);
    if (!creux || !gauche || !droite) return;
    // La légende va au point de contrôle de sa flèche : la courbe est convexe
    // entre un bout et le creux, donc l'espace au-delà de la corde est vide, des
    // deux côtés et dans les deux orientations.
    const fleche = (de, vers, texte) => {
      const mx = (de.x + vers.x) / 2, my = (de.y + vers.y) / 2 + (bas ? -30 : 30);
      make('path', { d: 'M' + de.x + ' ' + de.y + ' Q' + mx + ' ' + my + ' ' + vers.x + ' ' + vers.y,
        fill: 'none', stroke: 'var(--sub)', 'stroke-width': 1.6, 'stroke-dasharray': '6 4', opacity: .85 }, g);
      const a = Math.atan2(vers.y - my, vers.x - mx);
      make('path', { d: 'M' + vers.x + ' ' + vers.y
        + ' L' + (vers.x - 9 * Math.cos(a - 0.4)) + ' ' + (vers.y - 9 * Math.sin(a - 0.4))
        + ' L' + (vers.x - 9 * Math.cos(a + 0.4)) + ' ' + (vers.y - 9 * Math.sin(a + 0.4)) + ' Z',
        fill: 'var(--sub)' }, g);
      // La légende est mesurée puis ramenée dans le cadre. Le point de contrôle
      // de la flèche de fusion tombe près de l'axe des ordonnées, et la légende,
      // centrée dessus, débordait sur les graduations — d'autant plus que la
      // scène était étroite.
      // Sur une petite scène il n'y a pas la place pour tout. La légende s'efface
      // alors devant le nom du noyau : la flèche continue de dire le sens, et le
      // texte est dans la note. Effacer la donnée pour garder la légende serait
      // l'inverse de ce qu'il faut faire.
      const t = cadrer(label(mx, my + (bas ? -9 : 17), texte, 'tau'), X0 + 58, X0 + W - 4);
      if (chevauche(t, noms)) t.remove();
    };
    fleche(gauche, creux, 'fusion : les légers s’unissent');
    fleche(droite, creux, 'fission : les lourds se cassent');
  }

  /* ── le défaut de masse, en vraie grandeur puis à la loupe ─────────── */
  function dessinNoyau(X0, Y0, W, H) {
    const n = noyau();
    label(X0, 14, 'Le noyau, puis la pesée : ses nucléons séparés, et lui', 'lab');
    const colP = 'var(--sub)', colN = 'var(--ink-mute)';

    /* le noyau dessiné, un cercle par nucléon */
    const boxW = Math.min(W * 0.34, H * 0.62);
    const cx = X0 + boxW / 2, cy = Y0 + 20 + boxW / 2;
    const R = boxW * 0.44;
    const r = Math.max(2.2, Math.min(9, R / Math.pow(n.A, 1 / 3) * 0.9));
    // Les protons et les neutrons sont mélangés, mais toujours de la même façon
    // pour un même noyau : un tirage aléatoire à chaque image ferait scintiller
    // le noyau sans rien apprendre.
    let graine = n.A * 7919 + n.Z * 104729;
    const rnd = () => { graine = (graine * 1664525 + 1013904223) >>> 0; return graine / 4294967296; };
    const genre = Array.from({ length: n.A }, (_, i) => (i < n.Z ? 'p' : 'n'));
    for (let i = genre.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1)); const t = genre[i]; genre[i] = genre[j]; genre[j] = t;
    }
    const OR = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n.A; i++) {
      const rad = R * Math.sqrt((i + 0.5) / n.A), th = i * OR;
      make('circle', { cx: cx + rad * Math.cos(th), cy: cy + rad * Math.sin(th), r,
        fill: genre[i] === 'p' ? colP : colN, opacity: .9 }, g);
    }
    label(cx, cy + R + 26, n.cle + ' — ' + n.Z + ' p, ' + n.N + ' n', 'pt');
    legende(cx, cy + R + 44, [[colP, 'proton'], [colN, 'neutron']]);

    /* la pesée */
    const bx = X0 + boxW + 40, bw = X0 + W - bx;
    if (bw < 180) return;
    const y0 = Y0 + 34, bh = 22, gap = 40;
    const maxi = n.nucleons;
    const barre = (y, val, col, titre, sous) => {
      make('rect', { x: bx, y, width: bw * (val / maxi), height: bh, rx: 3, fill: col, opacity: .55 }, g);
      make('rect', { x: bx, y, width: bw, height: bh, rx: 3, fill: 'none',
        stroke: 'var(--rule)', 'stroke-width': 1 }, g);
      label(bx, y - 5, titre, 'ax');
      label(bx + bw, y - 5, sous, 'ax end');
    };
    barre(y0, n.nucleons, colP, 'les ' + n.A + ' nucléons, séparés', fr(n.nucleons, 6) + ' u');
    barre(y0 + gap, n.noyau, 'var(--ink-soft)', 'le noyau ' + n.cle, fr(n.noyau, 6) + ' u');

    // Les phrases sont repliées sur la largeur réellement disponible. Écrites
    // d'un trait, elles sortaient du cadre dès que la scène rétrécissait — et
    // c'est la scène qui décide, pas le texte.
    const cols = Math.max(28, Math.floor(bw / 6.6));
    if (n.A === 1) {
      couper('Un nucléon seul n’est lié à rien : il n’y a pas de défaut de masse.', cols)
        .forEach((l, i) => label(bx, y0 + 2 * gap + 22 + i * 15, l, 'ax start'));
      return;
    }
    // À l'échelle, les deux barres sont identiques — c'est justement la phrase du
    // cours (« ce défaut est faible en valeur relative »). On la montre, puis on
    // ouvre la loupe, sinon il n'y aurait rien à voir.
    const dit = couper('Les deux barres se ressemblent : Δm ne vaut que '
      + fr(100 * n.dm / n.nucleons, 3) + ' % de la masse. À la loupe :', cols);
    const yl = y0 + 2 * gap + 6 + (dit.length - 1) * 15;
    dit.forEach((l, i) => label(bx, yl - 10 - (dit.length - 1 - i) * 15, l, 'ax start'));
    // ×100 et pas davantage : le plus gros défaut relatif de la table (le fer)
    // vaut 0,94 % de la masse, si bien qu'à ×100 la barre remplit le cadre sans
    // jamais le dépasser. Un facteur qui sature effacerait ce qu'on veut lire —
    // que le fer perd relativement PLUS que l'uranium.
    const facteur = 100;
    const lw = bw * (n.dm / n.nucleons) * facteur;
    make('rect', { x: bx, y: yl, width: Math.min(lw, bw), height: bh, rx: 3, fill: 'var(--sub)' }, g);
    make('rect', { x: bx, y: yl, width: bw, height: bh, rx: 3, fill: 'none',
      stroke: 'var(--rule)', 'stroke-width': 1 }, g);
    // Sous la barre, jamais au bout : au bout, un gros Δm pousse le texte dehors.
    label(bx, yl + bh + 15, 'Δm = ' + fr(n.dm, 6) + ' u,  grossi ' + facteur + ' fois', 'ax start');

    const ye = yl + gap + 22;
    label(bx, ye, 'E = Δm c² = ' + fr(n.El, 2) + ' MeV', 'tau start');
    label(bx, ye + 20, 'soit ' + fr(n.EA, 3) + ' MeV par nucléon', 'ax start');
  }

  function legende(x, y, items) {
    const larg = items.length * 78;
    items.forEach(([c, t], i) => {
      const px = x - larg / 2 + i * 78 + 8;
      make('circle', { cx: px, cy: y - 4, r: 4.5, fill: c }, g);
      label(px + 9, y, t, 'ax start');
    });
  }

  /* ── choisir un noyau en cliquant sur la courbe ────────────────────── */
  const clic = (ev) => {
    if (!cibles.length) return;
    const r = svg.getBoundingClientRect(), { w, h } = lab.size();
    const px = (ev.clientX - r.left) * (w / r.width), py = (ev.clientY - r.top) * (h / r.height);
    let best = null, d2 = 400;                       // 20 px de tolérance
    for (const c of cibles) {
      const d = (c.x - px) ** 2 + (c.y - py) ** 2;
      if (d < d2) { d2 = d; best = c; }
    }
    if (best) { choix.set(best.n.cle); paint(); }
  };
  svg.addEventListener('pointerdown', clic);
  svg.style.cursor = 'pointer';
  lab.onDestroy(() => svg.removeEventListener('pointerdown', clic));

  /* ── utilitaires ───────────────────────────────────────────────────── */
  function label(x, y, txt, cls) {
    const t = make('text', { x, y }, g);
    const c = cls || 'ax';
    t.setAttribute('class', c);
    const a = /\bend\b/.test(c) ? 'end' : /\bstart\b/.test(c) ? 'start'
      : /\b(pt|tau)\b/.test(c) ? 'middle' : null;
    if (a) t.setAttribute('text-anchor', a);
    t.textContent = txt;
    return t;
  }
  // On mesure l'encre plutôt que de deviner la largeur du texte : la police et
  // la longueur changent, la mesure non.
  function couper(texte, n) {
    const mots = texte.split(' '), out = []; let l = '';
    for (const m of mots) {
      if ((l + ' ' + m).trim().length > n) { out.push(l.trim()); l = m; } else l += ' ' + m;
    }
    if (l.trim()) out.push(l.trim());
    return out;
  }
  const chevauche = (n, autres) => {
    let a; try { a = n.getBBox(); } catch { return false; }
    return autres.some((o) => {
      let b; try { b = o.getBBox(); } catch { return false; }
      return a.x < b.x + b.width && b.x < a.x + a.width
        && a.y < b.y + b.height && b.y < a.y + a.height;
    });
  };
  function cadrer(n, minX, maxX) {
    let b; try { b = n.getBBox(); } catch { return n; }
    if (!b.width) return n;
    const dx = b.x < minX ? minX - b.x : b.x + b.width > maxX ? maxX - (b.x + b.width) : 0;
    if (dx) n.setAttribute('x', +n.getAttribute('x') + dx);
    return n;
  }

  [choix, vue, sens].forEach((s) => s.el.addEventListener('change', paint));
  fleches.el.addEventListener('change', paint);
  lab.onResize(paint);
  paint();
}
