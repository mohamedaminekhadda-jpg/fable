// Les indicateurs du développement
//
// Un pays ne se résume pas à un nombre, et c'est tout le propos. La même
// cinquantaine de pays est donc regardée de trois façons :
//
//   • EN NUAGE — deux indicateurs croisés, la population en surface, le
//     continent en couleur. C'est là qu'on voit les corrélations : la fécondité
//     tombe quand le revenu monte, l'espérance de vie plafonne.
//   • SUR UN PLANISPHÈRE — chaque pays à sa vraie place, coloré par la valeur
//     choisie. On y lit d'un coup les continents entiers : l'Afrique
//     sahélienne, l'Europe, le Golfe.
//   • EN CLASSEMENT — parce qu'un rang se retient, et qu'il change du tout au
//     tout selon l'indicateur choisi.
//
// Basculer entre les trois sur les mêmes données est l'exercice : une carte
// n'est pas un fait, c'est un choix de représentation.

import { PAYS, INDICATEURS, CONTINENTS, COULEUR, valeur } from './pays.js';
import { CONTOURS } from './monde-fond.js';

/* L'emprise du planisphère. On coupe sous le 56ᵉ parallèle sud et au-dessus du
   78ᵉ nord : l'Antarctique et le Grand Nord n'occupent que de la place, et
   aucun des cinquante et un pays n'y habite. */
const BORNES = { lon0: -180, lon1: 180, lat0: -56, lat1: 78 };

export function mount(lab) {
  const { make, fr } = lab;

  /* ── réglages ──────────────────────────────────────────────────────── */
  lab.group('Ce qu’on regarde');
  const vue = lab.select({
    label: 'Représentation', value: 'nuage',
    options: [{ value: 'nuage', label: 'un nuage de points' },
      { value: 'planisphere', label: 'un planisphère' },
      { value: 'classement', label: 'un classement' }],
  });
  lab.group('Les indicateurs');
  const opts = INDICATEURS.map((i) => ({ value: i.id, label: i.nom }));
  const axeX = lab.select({ label: 'En abscisse', options: opts, value: 'pib' });
  const axeY = lab.select({ label: 'En ordonnée', options: opts, value: 'esp' });
  const annee = lab.select({
    label: 'Année', value: '2022',
    options: [{ value: '2022', label: 'aujourd’hui (2022)' }, { value: '1990', label: '1990' }],
  });
  lab.group('Ce qu’on montre');
  const filtre = lab.select({
    label: 'Continent', value: 'tous',
    options: [{ value: 'tous', label: 'tous les continents' }]
      .concat(CONTINENTS.map((c) => ({ value: c, label: c }))),
  });
  const nordSud = lab.check({ label: 'Distinguer le Nord et le Sud', value: false });
  const noms = lab.check({ label: 'Écrire les noms', value: true });

  /* ── mesures ───────────────────────────────────────────────────────── */
  const choisiR = lab.readout({ label: 'pays choisi', format: (s) => s || 'cliquez un pays', hi: true });
  const profR = INDICATEURS.map((i) => lab.readout({ label: i.court, format: (s) => s || '—' }));
  const rangR = lab.readout({ label: 'rang', format: (s) => s || '—' });
  const evolR = lab.readout({ label: 'depuis 1990', format: (s) => s || '—' });
  const ecartR = lab.readout({ label: 'l’écart Nord / Sud', format: (s) => s || '—', hi: true });
  const liaisonR = lab.readout({ label: 'les deux indicateurs', format: (s) => s || '—' });

  let choisi = PAYS.find((p) => p.nom === 'Maroc');

  const an = () => +annee.value;
  const ind = (id) => INDICATEURS.find((i) => i.id === id);
  const montres = () => PAYS.filter((p) => filtre.value === 'tous' || p.continent === filtre.value);
  const dispo = (p, id) => valeur(p, id, an()) != null;

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  // parallèle de référence à zéro : la plate carrée, celle de tous les
  // planisphères scolaires. Sur une carte du monde entier il n'y a pas de
  // latitude moyenne qui ait un sens.
  const geo = lab.carte(CONTOURS, { parallele: 0 });
  const PAD = { l: 20, r: 18, t: 32, b: 18 };
  let cibles = [];

  function paint() {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    cibles = [];
    const W = w - PAD.l - PAD.r, H = h - PAD.t - PAD.b;
    const v = vue.value;
    axeY.row.hidden = v !== 'nuage';
    nordSud.row.hidden = v === 'classement';

    if (v === 'nuage') nuage(PAD.l, PAD.t, W, H);
    else if (v === 'planisphere') planisphere(PAD.l, PAD.t, W, H);
    else classement(PAD.l, PAD.t, W, H);
    releves();
  }

  /* ── le nuage de points ────────────────────────────────────────────── */
  function nuage(X0, Y0, W, H) {
    const ix = ind(axeX.value), iy = ind(axeY.value);
    label(X0, 14, 'Chaque disque est un pays ; sa surface est sa population', 'lab');
    const L = X0 + 62, R = X0 + W - 12, T = Y0 + 14, B = Y0 + H - 40;
    const liste = montres().filter((p) => dispo(p, ix.id) && dispo(p, iy.id));
    if (!liste.length) return label(X0 + W / 2, Y0 + H / 2, 'Rien à montrer pour cette année.', 'tau');

    const ech = (id, a, b) => {
      const i = ind(id);
      const vs = liste.map((p) => valeur(p, id, an()));
      let lo = Math.min(...vs), hi = Math.max(...vs);
      if (i.log) { lo = Math.log10(Math.max(200, lo)); hi = Math.log10(hi); }
      const m = (hi - lo) * 0.08 || 1;
      lo -= m; hi += m;
      return { lo, hi, i, px: (val) => a + ((i.log ? Math.log10(Math.max(200, val)) : val) - lo) / (hi - lo) * (b - a) };
    };
    const ex = ech(ix.id, L, R), ey = ech(iy.id, B, T);

    // le quadrillage
    graduations(ex, L, R, (x, txt) => {
      make('line', { x1: x, y1: T, x2: x, y2: B, stroke: 'var(--rule)', 'stroke-width': 1, opacity: .55 }, g);
      // « ax » seul s'ancre au DÉBUT du texte : chaque graduation se décalait
      // donc à droite de son propre trait, et la dernière sortait du cadre.
      label(x, B + 15, txt, 'ax mid');
    });
    graduations(ey, B, T, (y, txt) => {
      make('line', { x1: L, y1: y, x2: R, y2: y, stroke: 'var(--rule)', 'stroke-width': 1, opacity: .55 }, g);
      label(L - 6, y + 3.5, txt, 'ax end');
    });
    // Le titre de l'ordonnée est écrit à la verticale : sa LARGEUR de texte doit
    // tenir dans la HAUTEUR du cadre. Sur une scène courte, le nom complet
    // dépassait en haut et en bas — on prend alors le nom court.
    // Le titre porté par un axe doit tenir DANS cet axe — en largeur pour
    // l'abscisse, en hauteur pour l'ordonnée puisqu'elle est écrite à la
    // verticale. La classe « lab » est espacée : environ 7,6 px par caractère,
    // et l'on choisit le nom long ou le nom court d'après cette estimation.
    // (Mesurer le tracé serait plus juste, mais getBBox ne répond pas toujours
    // sur un texte qui vient d'être créé hors écran.)
    const tient = (s, place) => s.length * 7.6 < place - 12;
    const longX = ix.nom + (ix.unite ? ' (' + ix.unite + ')' : '')
      + (ix.log ? ' — échelle logarithmique' : '');
    const courtX = ix.court + (ix.log ? ' (log)' : '');
    label((L + R) / 2, B + 32, tient(longX, R - L) ? longX : courtX, 'lab mid');
    const longY = iy.nom + (iy.unite ? ' (' + iy.unite + ')' : '');
    const ty = label(X0 + 12, (T + B) / 2, tient(longY, B - T) ? longY : iy.court, 'lab');
    ty.setAttribute('transform', 'rotate(-90 ' + (X0 + 12) + ' ' + ((T + B) / 2) + ')');
    ty.setAttribute('text-anchor', 'middle');

    // les disques, du plus gros au plus petit pour que rien ne se cache
    const popMax = Math.max(...liste.map((p) => p.pop));
    /* Les noms déjà écrits, pour ne pas les recouvrir. Le pays SÉLECTIONNÉ est
       posé en premier — sinon il arrive en fin de tournée, ne cède à personne,
       et se retrouve par-dessus un nom déjà là. Le Maroc étant sélectionné par
       défaut et peu peuplé, c'était le cas le plus fréquent. */
    const posesN = [], aEcrire = [];
    liste.slice().sort((a, b) => b.pop - a.pop).forEach((p) => {
      const x = ex.px(valeur(p, ix.id, an())), y = ey.px(valeur(p, iy.id, an()));
      const r = 4 + 22 * Math.sqrt(p.pop / popMax);
      const sel = p === choisi;
      make('circle', { cx: x, cy: y, r,
        fill: nordSud.value ? (p.groupe === 'nord' ? '#4f8a6a' : '#c2703d') : COULEUR[p.continent],
        opacity: sel ? .95 : .55, stroke: sel ? 'var(--ink)' : 'var(--paper)',
        'stroke-width': sel ? 2.4 : 1 }, g);
      cibles.push({ p, x, y, r: Math.max(r, 7) });
      if (noms.value && (r > 11 || sel)) aEcrire.push({ p, x, y, r, sel });
    });

    /* Les noms viennent après tous les disques, et dans un autre ordre que
       ceux-ci. Les disques vont du plus gros au plus petit, pour qu'un petit
       pays ne disparaisse pas sous un grand ; les noms commencent par le pays
       SÉLECTIONNÉ, puis suivent la population. Sans cela, le Maroc — choisi par
       défaut et peu peuplé — était étiqueté en dernier, ne cédait à personne, et
       se posait par-dessus « Inde » ou « Pakistan ».

       Un nom qui recouvrirait un nom déjà écrit n'est pas écrit du tout : le
       pays reste cliquable, et deux noms superposés n'en donnent aucun. */
    /* La légende passe AVANT les noms de pays, et non après : sinon elle n'est
       pas encore là quand ils cherchent une place libre, et « Nigeria » se pose
       sur « Océanie ». L'encre déjà posée — titres d'axes, graduations,
       légende — entre alors dans le calcul. */
    legende(L, T + 4);
    [...g.querySelectorAll('text')].forEach((t) => posesN.push(t.getBBox()));
    aEcrire.sort((a, b) => (b.sel - a.sel) || (b.p.pop - a.p.pop)).forEach(({ p, x, y, r, sel }) => {
      const t = label(x, y - r - 5, p.nom, sel ? 'tau' : 'ax');
      t.setAttribute('stroke', 'var(--paper)'); t.setAttribute('stroke-width', '3');
      t.setAttribute('paint-order', 'stroke');
      const b = t.getBBox();
      const heurte = posesN.some((q) => b.x < q.x + q.width + 2 && b.x + b.width + 2 > q.x
        && b.y < q.y + q.height + 1 && b.y + b.height + 1 > q.y);
      if (heurte) t.remove(); else posesN.push(b);
    });
  }

  function graduations(e, a, b, dessine) {
    const n = 5;
    for (let k = 0; k <= n; k++) {
      const t = e.lo + (e.hi - e.lo) * k / n;
      const val = e.i.log ? Math.pow(10, t) : t;
      const pos = a + (b - a) * k / n;
      dessine(pos, e.i.log ? court(val) : fr(val, e.i.dec));
    }
  }
  const court = (v) => (v >= 1000 ? fr(Math.round(v / 1000), 0) + 'k' : fr(Math.round(v), 0));

  function legende(x, y) {
    const items = nordSud.value ? [['#4f8a6a', 'Nord'], ['#c2703d', 'Sud']]
      : CONTINENTS.map((c) => [COULEUR[c], c]);
    items.forEach(([col, nom], i) => {
      const px = x + 8, py = y + i * 15;
      make('circle', { cx: px, cy: py, r: 5, fill: col, opacity: .75 }, g);
      label(px + 10, py + 4, nom, 'ax start');
    });
  }

  /* ── le planisphère ─────────────────────────────────────────────────────
     Il fut un temps une grille de carreaux tous identiques, au motif que le
     développement ne se mesure pas en kilomètres carrés. L'argument était bon
     et le résultat mauvais : personne ne retrouve son pays sur un damier, et
     une carte qu'on ne lit pas n'enseigne rien. Les contours sont désormais
     ceux de Natural Earth. Le Qatar y est minuscule, comme dans la réalité —
     c'est le nuage de points et le classement qui rétablissent l'équité entre
     les pays, chacun à sa façon. */
  function planisphere(X0, Y0, W, H) {
    const i = ind(axeX.value);
    // Le titre long ne tient pas sous mille pixels : même règle que les axes du
    // nuage, environ 7,6 px par caractère dans la classe « lab ».
    const longT = 'Chaque pays à sa vraie place et à sa vraie taille — coloré par ' + i.court;
    const courtT = 'Coloré par ' + i.court;
    label(X0, 14, longT.length * 7.6 < W - 12 ? longT : courtT, 'lab');
    const liste = PAYS.filter((p) => dispo(p, i.id));
    const vs = liste.map((p) => valeur(p, i.id, an()));
    const lo = Math.min(...vs), hi = Math.max(...vs);

    const P = geo.cadre({ x: X0, y: Y0 + 20, w: W, h: H - 74 }, { bornes: BORNES });
    make('rect', { x: P.boite.x, y: P.boite.y, width: P.boite.w, height: P.boite.h, rx: 3,
      fill: 'var(--ink)', 'fill-opacity': 0.035, stroke: 'var(--rule)', 'stroke-width': 1 }, g);

    // les pays dont il n'est pas question, en fond : sans eux on ne reconnaît
    // ni un continent ni un littoral
    const auSujet = new Set(PAYS.map((p) => p.code));
    geo.codes().forEach((code) => {
      if (auSujet.has(code)) return;
      const d = geo.chemin(code, P);
      if (d) make('path', { d, fill: 'var(--ink)', 'fill-opacity': 0.07,
        stroke: 'var(--ink-soft)', 'stroke-width': 0.4, 'stroke-opacity': 0.28 }, g);
    });

    PAYS.forEach((p) => {
      const d = geo.chemin(p.code, P);
      if (!d) return;
      const v = valeur(p, i.id, an());
      const vu = filtre.value === 'tous' || p.continent === filtre.value;
      const sel = p === choisi;
      make('path', { d,
        fill: v == null ? 'var(--paper-3)' : teinte(v, lo, hi, i),
        opacity: vu ? 1 : .18,
        stroke: sel ? 'var(--ink)' : 'var(--paper)', 'stroke-width': sel ? 2 : 0.5,
        'stroke-linejoin': 'round' }, g);
      // La cible de clic est le centre du pays, avec un rayon plancher : sans
      // lui, le Qatar et Singapour seraient invisibles à la souris.
      const a = geo.ancre(p.code, P);
      if (a) cibles.push({ p, x: a[0], y: a[1], r: Math.max(6, P.parDegre * 2.2) });
    });

    echelleCouleur(P.boite.x, P.boite.y + P.boite.h + 20, Math.min(300, W * 0.5), lo, hi, i);
  }

  // Une teinte du pâle au foncé. `sens` retourne l'échelle pour les indicateurs
  // où un chiffre élevé est une mauvaise nouvelle — fécondité, mortalité.
  /* Le PIB par habitant va de 1 300 à 114 000 dollars. Réparti linéairement sur
     la rampe, tout ce qui est sous 20 000 — c'est-à-dire les trois quarts de
     l'humanité — tombe dans la même nuance pâle, et la carte ne montre plus que
     les cinq pays les plus riches. L'indicateur porte déjà `log`, puisque le
     nuage de points en a besoin ; la couleur doit suivre la même échelle, sans
     quoi les deux représentations racontent deux histoires différentes des
     mêmes chiffres. */
  const echelonne = (v, i) => (i.log ? Math.log10(Math.max(1, v)) : v);
  function teinte(v, lo, hi, i) {
    const a0 = echelonne(lo, i), a1 = echelonne(hi, i);
    let t = (echelonne(v, i) - a0) / (a1 - a0 || 1);
    if (i.sens < 0) t = 1 - t;
    t = Math.max(0, Math.min(1, t));
    const a = [226, 219, 203], b = [22, 84, 66];
    return 'rgb(' + a.map((c, k) => Math.round(c + (b[k] - c) * t)).join(',') + ')';
  }

  function echelleCouleur(x, y, w, lo, hi, i) {
    const n = 40;
    // La barre avance par pas réguliers dans l'échelle EFFECTIVE, pas dans les
    // valeurs : sinon le dégradé de la légende ne ressemble plus à celui de la
    // carte qu'il prétend expliquer.
    const a0 = echelonne(lo, i), a1 = echelonne(hi, i);
    for (let k = 0; k < n; k++) {
      const a = a0 + (a1 - a0) * k / (n - 1);
      const v = i.log ? 10 ** a : a;
      make('rect', { x: x + (k / n) * w, y, width: w / n + 0.6, height: 11,
        fill: teinte(v, lo, hi, i) }, g);
    }
    label(x, y + 26, fr(i.sens < 0 ? hi : lo, i.dec), 'ax start');
    label(x + w, y + 26, fr(i.sens < 0 ? lo : hi, i.dec), 'ax end');
    label(x + w / 2, y + 26, (i.sens < 0 ? '←  mieux' : 'mieux  →')
      + (i.log ? '   (échelle logarithmique)' : ''), 'ax mid');
  }

  /* ── le classement ─────────────────────────────────────────────────── */
  function classement(X0, Y0, W, H) {
    const i = ind(axeX.value);
    label(X0, 14, 'Classement par ' + i.court + (i.sens < 0 ? ' (le plus faible en tête)' : ''), 'lab');
    const liste = montres().filter((p) => dispo(p, i.id))
      .sort((a, b) => (valeur(b, i.id, an()) - valeur(a, i.id, an())) * (i.sens < 0 ? -1 : 1));
    const bh = Math.min(19, (H - 30) / Math.max(1, liste.length));
    const vs = liste.map((p) => valeur(p, i.id, an()));
    const max = Math.max(...vs);
    /* La colonne des noms était large de 128 pixels quoi qu'il arrive, et
       « 17. Émirats arabes unis » en réclame davantage : le libellé sortait par
       la gauche dès que les barres étaient assez hautes pour être étiquetées.
       On mesure donc le plus long avant de fixer la colonne. */
    const regle = make('text', { x: -9999, y: -9999, fill: 'none' }, g);
    regle.setAttribute('class', 'ax end');
    const largeurNom = liste.reduce((m, p, k) => {
      regle.textContent = (k + 1) + '. ' + p.nom;
      return Math.max(m, regle.getComputedTextLength() || 0);
    }, 0);
    regle.remove();
    const bx = X0 + Math.max(128, largeurNom + 14), bw = X0 + W - 82 - bx;
    liste.forEach((p, k) => {
      const y = Y0 + 24 + k * bh, v = valeur(p, i.id, an());
      const sel = p === choisi;
      make('rect', { x: bx, y: y + bh * 0.12, width: Math.max(1, (v / max) * bw), height: bh * 0.72,
        rx: 2, fill: nordSud.value ? (p.groupe === 'nord' ? '#4f8a6a' : '#c2703d') : COULEUR[p.continent],
        opacity: sel ? 1 : .6 }, g);
      /* La hauteur de ligne descend jusqu'à onze pixels quand les cinquante et
         un pays sont affichés, alors que le texte de la classe en fait treize :
         les rangs se chevauchaient deux à deux. La police suit donc la ligne. */
      if (bh > 9) {
        const fs = Math.min(11, bh * 0.62);
        const t1 = label(bx - 8, y + bh * 0.68, (k + 1) + '. ' + p.nom, sel ? 'tau end' : 'ax end');
        const t2 = label(bx + Math.max(1, (v / max) * bw) + 7, y + bh * 0.68, fr(v, i.dec), 'ax start');
        // en style, pas en attribut : une règle CSS de classe l'emporterait sur
        // un attribut de présentation, et la taille demandée serait ignorée
        t1.style.fontSize = fs + 'px'; t2.style.fontSize = fs + 'px';
      }
      cibles.push({ p, x: bx + bw / 2, y: y + bh / 2, r: bh, large: true, x0: X0, x1: X0 + W });
    });
  }

  /* ── les relevés ───────────────────────────────────────────────────── */
  function releves() {
    const p = choisi;
    choisiR.set(p ? p.nom + '  —  ' + p.continent + ', ' + (p.groupe === 'nord' ? 'Nord' : 'Sud') : null);
    INDICATEURS.forEach((i, k) => {
      const v = p ? valeur(p, i.id, an()) : null;
      profR[k].set(v == null ? 'non renseigné en 1990'
        : fr(v, i.dec) + (i.unite ? ' ' + i.unite : ''));
    });
    const i = ind(axeX.value);
    const liste = PAYS.filter((q) => dispo(q, i.id))
      .sort((a, b) => (valeur(b, i.id, an()) - valeur(a, i.id, an())) * (i.sens < 0 ? -1 : 1));
    rangR.set(p && dispo(p, i.id)
      ? (liste.indexOf(p) + 1) + 'ᵉ sur ' + liste.length + '  pour ' + i.court : '—');
    // ce que le pays a gagné depuis 1990, quand on le sait
    if (p && p.a1990.idh != null) {
      const d = p.idh - p.a1990.idh;
      evolR.set('IDH ' + fr(p.a1990.idh, 3) + ' → ' + fr(p.idh, 3)
        + '   (' + (d >= 0 ? '+' : '') + fr(d * 100, 1) + ' points)'
        + '   espérance de vie ' + (p.esp - p.a1990.esp >= 0 ? '+' : '')
        + fr(p.esp - p.a1990.esp, 1) + ' an' + (Math.abs(p.esp - p.a1990.esp) > 1 ? 's' : ''));
    } else evolR.set('—');

    // l'écart Nord / Sud sur l'indicateur en cours
    const moy = (gr) => {
      const l = PAYS.filter((q) => q.groupe === gr && dispo(q, i.id));
      return l.reduce((s, q) => s + valeur(q, i.id, an()), 0) / (l.length || 1);
    };
    const mn = moy('nord'), ms = moy('sud');
    const rap = i.sens < 0 ? ms / mn : mn / ms;
    ecartR.set('moyenne du Nord ' + fr(mn, i.dec) + ', du Sud ' + fr(ms, i.dec)
      + '   —  un rapport de ' + fr(rap, 1) + ' pour ' + i.court);

    if (vue.value === 'nuage') {
      const ix = ind(axeX.value), iy = ind(axeY.value);
      const l = PAYS.filter((q) => dispo(q, ix.id) && dispo(q, iy.id));
      liaisonR.set(l.length > 2
        ? 'corrélation ' + fr(correlation(l, ix, iy), 2) + '  —  '
          + comment(correlation(l, ix, iy)) : '—');
      liaisonR.show(true);
    } else liaisonR.show(false);
  }
  // Le coefficient de corrélation, calculé sur les rangs (Spearman) : il résiste
  // aux valeurs extrêmes, et le Qatar en est une.
  function correlation(l, ix, iy) {
    const rang = (id) => {
      const tri = l.slice().sort((a, b) => valeur(a, id, an()) - valeur(b, id, an()));
      const m = new Map(); tri.forEach((p, k) => m.set(p, k + 1)); return m;
    };
    const rx = rang(ix.id), ry = rang(iy.id), n = l.length;
    let d2 = 0;
    l.forEach((p) => { d2 += Math.pow(rx.get(p) - ry.get(p), 2); });
    return 1 - (6 * d2) / (n * (n * n - 1));
  }
  const comment = (r) => (Math.abs(r) > 0.8 ? 'lien très net' : Math.abs(r) > 0.5 ? 'lien net'
    : Math.abs(r) > 0.3 ? 'lien faible' : 'presque aucun lien')
    + (r < -0.3 ? ', en sens inverse' : '');

  /* ── choisir un pays ───────────────────────────────────────────────── */
  const clic = (ev) => {
    const r = svg.getBoundingClientRect(), { w, h } = lab.size();
    const px = (ev.clientX - r.left) * (w / r.width), py = (ev.clientY - r.top) * (h / r.height);
    let best = null, d2 = 1e9;
    for (const c of cibles) {
      const dx = c.large ? 0 : px - c.x, dy = py - c.y;
      if (c.large && (px < c.x0 || px > c.x1)) continue;
      const d = dx * dx + dy * dy;
      if (d < c.r * c.r * 1.6 && d < d2) { d2 = d; best = c; }
    }
    if (best) { choisi = best.p; paint(); }
  };
  svg.addEventListener('pointerdown', clic);
  svg.style.cursor = 'pointer';
  lab.onDestroy(() => svg.removeEventListener('pointerdown', clic));

  function label(x, y, txt, cls) {
    const t = make('text', { x, y }, g);
    const c = cls || 'ax';
    t.setAttribute('class', c);
    // « mid » centre explicitement. Sans lui, un titre placé au milieu d'un axe
    // partait vers la droite depuis ce milieu au lieu de l'entourer — il était
    // centré de position et pas d'ancrage, ce qui ne se voit qu'au débordement.
    const a = /\bend\b/.test(c) ? 'end' : /\bstart\b/.test(c) ? 'start'
      : /\b(pt|tau|mid)\b/.test(c) ? 'middle' : null;
    if (a) t.setAttribute('text-anchor', a);
    t.textContent = txt;
    return t;
  }

  [vue, axeX, axeY, annee, filtre].forEach((s) => s.el.addEventListener('change', paint));
  [nordSud, noms].forEach((c) => c.el.addEventListener('change', paint));
  lab.onResize(paint);
  paint();
}
