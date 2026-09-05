// De l'ADN à la protéine.
//
// Trois scènes qui sont une seule histoire : la molécule, sa copie en ARN, sa
// lecture en protéine. On peut les regarder tourner, mais surtout on peut
// CHANGER UNE LETTRE — et voir ce que cette lettre fait au bout de la chaîne.
//
// La séquence est celle du vrai gène de la bêta-globine. Changez la vingtième
// base en T et vous venez de faire la drépanocytose : un acide glutamique
// devient une valine, et l'hémoglobine se déforme. C'est la démonstration que
// le cours annonce sans jamais pouvoir la montrer — une lettre sur des
// milliards, et une maladie.

import {
  GENE, NOM_GENE, COULEUR, COMPLEMENT, LIAISONS, CODE, AA, FAMILLE, BASES,
  complementaire, transcrire, traduire, proteine, effetMutation, DREPANOCYTOSE,
} from './adn.js';

const VUES = [
  { value: 'molecule', label: '1 · la molécule d’ADN' },
  { value: 'transcription', label: '2 · la transcription en ARN' },
  { value: 'traduction', label: '3 · la traduction en protéine' },
];

export function mount(lab) {
  const { fr } = lab;
  const svg = lab.svg();

  let seq = GENE;                 // le brin codant, seul état modifiable
  let temps = 0;
  let choisie = -1;               // la base cliquée

  const vue = lab.select({ label: 'L’étape', options: VUES, value: 'molecule',
    onChange: () => { lab.clock.reset(); majControles(); dessine(); } });
  const helice = lab.check({ label: 'Enrouler la double hélice', value: true, onChange: dessine });
  const apparier = lab.check({ label: 'Montrer les liaisons hydrogène', value: true, onChange: dessine });

  lab.buttons([
    { label: 'Faire la mutation drépanocytaire', onClick: () => {
      seq = seq.slice(0, DREPANOCYTOSE.position) + DREPANOCYTOSE.base
        + seq.slice(DREPANOCYTOSE.position + 1);
      choisie = DREPANOCYTOSE.position; dessine();
    } },
    { label: 'Revenir au gène normal', onClick: () => { seq = GENE; choisie = -1; dessine(); } },
  ]);

  const texte = (v) => (v == null ? '—' : String(v));
  lab.group('Le gène');
  const rNom = lab.readout({ label: 'Gène', format: texte });
  const rBase = lab.readout({ label: 'Base choisie', format: texte });
  lab.group('Ce qui en sort');
  const rARN = lab.readout({ label: 'ARN messager', format: texte });
  const rProt = lab.readout({ label: 'Protéine', format: texte, hi: true });
  const rLong = lab.readout({ label: 'Longueur', format: texte });
  const rCourant = lab.readout({ label: 'En cours', format: texte });
  lab.group('La mutation');
  const rMut = lab.readout({ label: 'Effet', format: texte, hi: true });

  function majControles() {
    helice.show(vue.value === 'molecule');
    apparier.show(vue.value === 'molecule');
  }

  /* ── outils de tracé ──────────────────────────────────────────────────── */
  const mk = (t, a, p) => lab.make(t, a, p);
  let regle = null;
  const mesure = (s, fs, bold) => {
    if (!regle) return String(s).length * fs * 0.55;
    regle.setAttribute('font-size', fs);
    regle.setAttribute('font-weight', bold ? 600 : 400);
    regle.textContent = String(s);
    return regle.getComputedTextLength() || String(s).length * fs * 0.55;
  };
  function txt(p, x, y, s, a = {}) {
    const t = mk('text', { x, y, 'font-size': a.fs || 12, fill: a.fill || 'var(--ink)',
      'text-anchor': a.anchor || 'middle', 'font-weight': a.bold ? 600 : 400,
      'font-family': a.mono ? 'var(--mono)' : 'inherit', opacity: a.op != null ? a.op : 1,
      'paint-order': a.halo ? 'stroke' : null, stroke: a.halo ? 'var(--paper)' : null,
      'stroke-width': a.halo ? 3.2 : null, 'stroke-linejoin': a.halo ? 'round' : null }, p);
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
  // Une base : une pastille de sa couleur, sa lettre au milieu. Toujours la même
  // couleur pour la même lettre, dans les trois scènes — c'est ce qui permet de
  // suivre une base de l'ADN jusqu'à la protéine.
  function base(p, x, y, r, b, opts = {}) {
    mk('circle', { cx: x, cy: y, r, fill: COULEUR[b] || '#888',
      'fill-opacity': opts.pale ? 0.35 : 0.92,
      stroke: opts.marque ? 'var(--ink)' : 'var(--paper)',
      'stroke-width': opts.marque ? 2.4 : 1.4 }, p);
    if (r >= 7 && !opts.muet) {
      txt(p, x, y + r * 0.36, b, { fs: r * 1.05, bold: true, mono: true, fill: '#fff' });
    }
  }

  /* ── le dessin ────────────────────────────────────────────────────────── */
  let cibles = [];

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    regle = mk('text', { x: -9999, y: -9999, fill: 'none' }, svg);
    cibles = [];
    const { w: W, h: H } = lab.size();
    const arn = transcrire(seq);
    const prot = proteine(arn);

    const fsT = Math.max(13, Math.min(18, W / 42));
    const v = VUES.find((x) => x.value === vue.value);
    txt(svg, 12, 10 + fsT, v.label.replace(/^\d · /, ''), { fs: fsT, bold: true, anchor: 'start' });
    const sous = vue.value === 'molecule'
      ? 'Cliquez une base du ruban du bas pour la changer : tout le reste suit.'
      : vue.value === 'transcription'
        ? 'L’ARN polymérase lit le brin transcrit et écrit l’ARN. La thymine y devient uracile.'
        : 'Le ribosome lit l’ARN trois lettres à la fois. Chaque triplet appelle un acide aminé.';
    // la hauteur du bandeau suit le NOMBRE DE LIGNES du sous-titre : il en fait
    // une à 1 280 pixels et deux à 900, et une hauteur fixe le faisait recouvrir
    // la première étiquette de la scène
    const lignes = coupe(sous, W - 24, 11.5);
    lignes.forEach((l, i) => {
      txt(svg, 12, 12 + fsT * 2 + i * 13, l, { fs: 11.5, anchor: 'start', fill: 'var(--ink-soft)' });
    });
    const haut = 12 + fsT * 2 + lignes.length * 13 + 6;

    /* Le ruban est sous les TROIS scènes, pas seulement sous la molécule : c'est
       le seul endroit où l'on agit, et pouvoir changer une base sans quitter la
       transcription ou la traduction, c'est justement voir la conséquence au
       moment où elle se produit. */
    const hRuban = 88;
    /* Sauf sur une fenêtre vraiment basse : la transcription a besoin de ses
       trois rangées, et un ruban qui les écrase ne rend service à personne. La
       molécule, elle, garde toujours son ruban — c'est sa scène. */
    const avecRuban = vue.value === 'molecule' || H - 8 - haut - hRuban >= 210;
    const hScene = avecRuban ? H - hRuban - 12 : H;
    if (vue.value === 'molecule') scMolecule(W, hScene, haut);
    else if (vue.value === 'transcription') scTranscription(W, hScene, haut, arn);
    else scTraduction(W, hScene, haut, arn, prot);
    if (avecRuban) ruban(10, H - 8 - hRuban, W - 20, hRuban);

    /* ── mesures ── */
    rNom.set(NOM_GENE);
    rBase.set(choisie < 0 ? 'aucune — cliquez le ruban'
      : 'n° ' + (choisie + 1) + ' : ' + seq[choisie] + ' — ' + COMPLEMENT[seq[choisie]]
        + '   (' + LIAISONS[seq[choisie]] + ' liaisons)');
    rARN.set(arn.match(/.{1,3}/g).join(' '));
    rProt.set(prot.map((c) => c.aa).join('-'));
    rLong.set(prot.length + ' acides aminés');
    const e = effetMutation(GENE, seq);
    rMut.set(e.texte);
    if (regle) { regle.remove(); regle = null; }
  }

  /* ── scène 1 : la molécule ────────────────────────────────────────────── */
  function scMolecule(W, H, haut) {
    const box = { x: 10, y: haut, w: W - 20, h: H - 8 - haut };

    /* La double hélice. Les deux brins sont deux sinusoïdes décalées d'un
       demi-tour ; les barreaux les relient. Quand un barreau est vu de profil il
       se raccourcit — c'est ce qui donne l'impression de rotation, et c'est aussi
       exactement ce qui se passe pour une hélice réelle. */
    /* L'hélice est un GROS PLAN, pas la séquence entière : quarante-cinq paires
       en travers d'un écran donnent des pastilles trop petites pour porter leur
       lettre, et une hélice sans ses lettres n'apprend rien. On en montre donc
       autant que la largeur permet d'en écrire, et la fenêtre suit la base qu'on
       clique — le ruban du bas, lui, garde la séquence complète. */
    const n = seq.length;
    const vus = Math.max(10, Math.min(n, Math.floor((box.w - 24) / 27)));
    const deb = choisie < 0 ? 0
      : Math.max(0, Math.min(n - vus, choisie - Math.floor(vus / 2)));
    const cy = box.y + box.h / 2;
    const amp = helice.value ? Math.min(box.h * 0.34, 60) : 0;
    const pas = (box.w - 24) / (vus - 1);
    const x0 = box.x + 12;
    const tour = helice.value ? temps * 1.1 : 0;
    const phase = (i) => tour + (i * Math.PI * 2) / 11;      // ~11 paires par tour
    const yA = (i) => cy - amp * Math.sin(phase(i));
    const yB = (i) => cy + amp * Math.sin(phase(i));
    const g = mk('g', {}, svg);

    const px = (i) => x0 + (i - deb) * pas;
    const fen = [...Array(vus).keys()].map((k) => deb + k);

    // les deux squelettes sucre-phosphate
    [[yA, 0.95], [yB, 0.7]].forEach(([f, op]) => {
      let d = '';
      fen.forEach((i, k) => { d += (k ? 'L' : 'M') + px(i) + ' ' + f(i); });
      mk('path', { d, fill: 'none', stroke: 'var(--ink-soft)', 'stroke-width': 3.4,
        'stroke-linecap': 'round', opacity: op }, g);
    });

    // les barreaux, du plus lointain au plus proche pour que l'avant recouvre
    const ordre = fen.slice().sort((a, b) => Math.cos(phase(a)) - Math.cos(phase(b)));
    /* Les lettres, c'est tout ou rien pour la scène entière. Décider pastille par
       pastille les faisait apparaître et disparaître au fil de la rotation, ce
       qui scintillait. */
    const lettres = Math.max(4, Math.min(pas * 0.42, 11)) * 0.72 >= 7;
    ordre.forEach((i) => {
      const x = px(i), b = seq[i], c = COMPLEMENT[b];
      const av = (Math.cos(phase(i)) + 1) / 2;               // 0 derrière, 1 devant
      const r = Math.max(4, Math.min(pas * 0.42, 11)) * (0.72 + 0.28 * av);
      if (apparier.value) {
        const nl = LIAISONS[b];
        for (let k = 0; k < nl; k++) {
          const t = (k + 1) / (nl + 1);
          const y = yA(i) + (yB(i) - yA(i)) * t;
          mk('line', { x1: x - 2.4, y1: y, x2: x + 2.4, y2: y, stroke: 'var(--ink-mute)',
            'stroke-width': 1.4, opacity: 0.35 + 0.45 * av }, g);
        }
      } else {
        mk('line', { x1: x, y1: yA(i), x2: x, y2: yB(i), stroke: 'var(--ink-mute)',
          'stroke-width': 1.2, opacity: 0.3 }, g);
      }
      /* Quatre fois par tour l'hélice se croise et les deux pastilles d'une paire
         se superposent. Y écrire les deux lettres donnait un amas illisible : on
         les tait le temps du croisement, les couleurs suffisent à suivre. */
      const muet = !lettres || Math.abs(yA(i) - yB(i)) < r * 1.9;
      base(g, x, yA(i), r, b, { pale: av < 0.4, marque: i === choisie, muet });
      base(g, x, yB(i), r, c, { pale: av < 0.4, muet });
    });
    txt(g, box.x + 4, box.y + 12, 'brin codant', { fs: 10, anchor: 'start', fill: 'var(--ink-soft)', halo: true });
    txt(g, box.x + 4, box.y + box.h - 4, 'brin transcrit', { fs: 10, anchor: 'start', fill: 'var(--ink-soft)', halo: true });
    if (vus < n) {
      txt(g, box.x + box.w - 4, box.y + 12,
        'gros plan : bases ' + (deb + 1) + ' à ' + (deb + vus) + ' sur ' + n,
        { fs: 10, anchor: 'end', fill: 'var(--ink-mute)', halo: true });
    }
  }

  /* Le ruban du bas : la même séquence, à plat, groupée en codons et cliquable.
     C'est le seul endroit où l'on modifie l'ADN — on change la molécule, pas
     « le texte », et on la change sans quitter la scène qu'on regarde. */
  function ruban(x, y, w, h) {
    const g = mk('g', {}, svg);
    const n = seq.length, nc = n / 3;
    const larg = (w - 8) / n;
    txt(g, x, y + 11, 'la séquence — cliquez une base pour la changer',
      { fs: 10.5, anchor: 'start', fill: 'var(--ink-soft)' });
    const yb = y + 38, hb = 26;
    for (let c = 0; c < nc; c++) {
      const xa = x + 4 + c * 3 * larg;
      mk('rect', { x: xa, y: yb - 4, width: larg * 3, height: hb + 8, rx: 4,
        fill: c % 2 ? 'var(--ink)' : 'transparent', 'fill-opacity': 0.045 }, g);
      if (larg * 3 > 22) {
        txt(g, xa + larg * 1.5, yb + hb + 18, String(c + 1),
          { fs: 9, mono: true, fill: 'var(--ink-mute)' });
      }
    }
    for (let i = 0; i < n; i++) {
      const xa = x + 4 + i * larg;
      const r = mk('rect', { x: xa, y: yb, width: larg - 1.5, height: hb, rx: 3,
        fill: COULEUR[seq[i]], 'fill-opacity': i === choisie ? 1 : 0.82,
        stroke: i === choisie ? 'var(--ink)' : 'transparent', 'stroke-width': 2,
        cursor: 'pointer' }, g);
      if (larg > 11) {
        txt(g, xa + larg / 2 - 0.75, yb + hb * 0.68, seq[i],
          { fs: Math.min(14, larg * 0.9), bold: true, mono: true, fill: '#fff' });
      }
      cibles.push({ el: r, i });
    }
    // la base d'origine, rappelée sous celle qu'on a changée
    for (let i = 0; i < n; i++) {
      if (seq[i] === GENE[i]) continue;
      const xa = x + 4 + i * larg;
      txt(g, xa + larg / 2, yb - 8, GENE[i],
        { fs: 10, bold: true, mono: true, fill: 'var(--ink-mute)' });
      mk('line', { x1: xa + larg / 2 - 4, y1: yb - 12, x2: xa + larg / 2 + 4, y2: yb - 5,
        stroke: '#c1121f', 'stroke-width': 1.4 }, g);
    }
  }

  /* ── scène 2 : la transcription ───────────────────────────────────────── */
  function scTranscription(W, H, haut, arn) {
    const n = seq.length;
    const avance = Math.min(n, temps * 5.5);                  // bases par seconde
    const k = Math.floor(avance);
    const g = mk('g', {}, svg);
    /* L'enzyme déborde de sa position de 2,6 bases de chaque côté : sur la
       première et la dernière base, cette avance-là sort du cadre. Le brin est
       donc rentré de tout un rayon d'enzyme aux deux bouts. */
    let larg = (W - 48) / (n + 5.2);
    const rxPol = Math.max(26, larg * 2.6);
    larg = (W - 48 - 2 * rxPol) / n;
    const x0 = 24 + rxPol;
    /* Les étiquettes sont à gauche, là où passe la bulle de transcription au
       départ — et dans la bulle les bases s'écartent de 16 pixels. L'écart aux
       brins tient donc compte de la base ÉCARTÉE, pas de la base au repos.

       Les deux brins restent à 58 pixels l'un de l'autre — ils sont appariés, les
       écarter davantage serait faux. C'est la descente vers l'ARN qui prend la
       hauteur disponible, et l'ensemble est centré dans la scène. */
    const dispo = H - 8 - haut;
    const vers = Math.max(78, Math.min(160, dispo * 0.34));
    const off = Math.max(0, (dispo - (36 + 58 + vers + 34)) / 2);
    const yCod = haut + 48 + off, yTrans = yCod + 58, yARN = yTrans + vers;

    const etiq = (y, s) => txt(g, 16, y + 4, s, { fs: 10, anchor: 'start', fill: 'var(--ink-soft)' });
    etiq(yCod - 36, 'brin codant  (non lu)');
    etiq(yTrans + 33, 'brin transcrit  — c’est celui que l’enzyme lit');
    etiq(yARN - 22, 'ARN messager en construction');

    // les deux brins, écartés dans la bulle de transcription
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.5) * larg;
      const dans = Math.abs(i - avance) < 3.2;                 // la bulle ouverte
      const ec = dans ? 16 : 0;
      const r = Math.min(larg * 0.42, 10);
      base(g, x, yCod - ec, r, seq[i], { pale: i > avance + 3 });
      base(g, x, yTrans + ec, r, COMPLEMENT[seq[i]], { pale: i > avance + 3 });
      if (!dans && i < avance) {
        mk('line', { x1: x, y1: yCod + r, x2: x, y2: yTrans - r, stroke: 'var(--ink-mute)',
          'stroke-width': 1, opacity: 0.25 }, g);
      }
    }

    // l'ARN polymérase
    const xp = x0 + (avance + 0.5) * larg;
    mk('ellipse', { cx: xp, cy: (yCod + yTrans) / 2, rx: rxPol, ry: 34,
      fill: 'var(--sub)', 'fill-opacity': 0.18, stroke: 'var(--sub)', 'stroke-width': 2 }, g);
    txt(g, xp, (yCod + yTrans) / 2 + 4, 'ARN pol', { fs: 10.5, bold: true, fill: 'var(--sub)' });

    // l'ARN déjà écrit
    for (let i = 0; i < k; i++) {
      const x = x0 + (i + 0.5) * larg;
      const r = Math.min(larg * 0.42, 10);
      base(g, x, yARN, r, arn[i]);
      if (seq[i] === 'T') {
        txt(g, x, yARN + r + 12, 'T→U', { fs: 8.5, bold: true, mono: true, fill: '#c1121f' });
      }
    }
    if (k > 0 && k < n) {
      mk('line', { x1: xp, y1: yTrans + 22, x2: x0 + (k - 0.5) * larg, y2: yARN - 12,
        stroke: 'var(--sub)', 'stroke-width': 1.6, 'stroke-dasharray': '4 3', opacity: 0.7 }, g);
    }

    rCourant.set(k >= n ? 'transcription terminée : ' + n + ' bases copiées'
      : 'base ' + (k + 1) + ' sur ' + n + ' — l’enzyme lit '
        + COMPLEMENT[seq[k]] + ' et écrit ' + arn[k]);
  }

  /* ── scène 3 : la traduction ──────────────────────────────────────────── */
  function scTraduction(W, H, haut, arn, prot) {
    const codons = arn.match(/.{1,3}/g);
    const avance = Math.min(codons.length, temps * 1.15);      // codons par seconde
    const k = Math.min(codons.length - 1, Math.floor(avance));
    const dedans = avance - k;                                  // l'arrivée du tARN
    const g = mk('g', {}, svg);

    /* Le ribosome déborde du dernier codon de 1,15 largeur : la place qu'il faut
       n'est donc pas celle de l'ARN seul. On en tient compte dans la largeur d'un
       codon, sans quoi il sortait de la scène sur les écrans étroits. */
    /* La chaîne en haut, l'ARN en bas, et entre les deux la descente de l'ARNt :
       cet écart prend la hauteur disponible, et l'ensemble est centré. */
    const dispo = H - 8 - haut;
    const ecart = Math.max(116, Math.min(240, dispo * 0.45));
    const dec = Math.max(0, (dispo - (34 + ecart + 39)) / 2);
    const yc = haut + 34 + dec, yARN = yc + ecart;
    const nc = codons.length;
    const larg = Math.min(46, (W - 40) / nc, (W / 2 - 8) / (nc / 2 + 1.3));
    const x0 = (W - larg * nc) / 2;

    // l'ARN messager, par codons
    codons.forEach((c, i) => {
      const x = x0 + i * larg;
      const lu = i < k, actif = i === k;
      mk('rect', { x: x + 1, y: yARN - 15, width: larg - 2, height: 30, rx: 4,
        fill: actif ? 'var(--sub)' : 'var(--ink)', 'fill-opacity': actif ? 0.22 : lu ? 0.1 : 0.05,
        stroke: actif ? 'var(--sub)' : 'var(--rule)', 'stroke-width': actif ? 2 : 1 }, g);
      txt(g, x + larg / 2, yARN + 5, c, { fs: Math.min(13, larg * 0.31), bold: true, mono: true,
        fill: actif ? 'var(--sub)' : 'var(--ink-soft)', op: lu || actif ? 1 : 0.55 });
      if (larg > 30) txt(g, x + larg / 2, yARN + 28, String(i + 1), { fs: 8.5, mono: true, fill: 'var(--ink-mute)' });
    });
    txt(g, 16, yARN + 5, 'ARN', { fs: 10, anchor: 'start', fill: 'var(--ink-soft)' });

    // le ribosome, à cheval sur le codon lu
    const xr = x0 + k * larg + larg / 2;
    mk('ellipse', { cx: xr, cy: yARN - 34, rx: larg * 1.15, ry: 30, fill: 'var(--ink-soft)',
      'fill-opacity': 0.2, stroke: 'var(--ink-soft)', 'stroke-width': 1.8 }, g);
    mk('ellipse', { cx: xr, cy: yARN + 22, rx: larg * 0.95, ry: 17, fill: 'var(--ink-soft)',
      'fill-opacity': 0.16, stroke: 'var(--ink-soft)', 'stroke-width': 1.6 }, g);
    txt(g, xr, yARN - 30, 'ribosome', { fs: 9.5, bold: true, fill: 'var(--ink-soft)' });

    // le tARN qui apporte l'acide aminé, descendant vers son codon
    const codon = codons[k];
    const aa = CODE[codon];
    if (aa && aa !== 'Stop') {
      const yt = yARN - 108 + dedans * 46;
      const anti = [...codon].map((b) => ({ A: 'U', U: 'A', G: 'C', C: 'G' }[b])).join('');
      mk('path', { d: 'M' + (xr - 20) + ' ' + yt + ' L' + (xr + 20) + ' ' + yt
        + ' L' + (xr + 13) + ' ' + (yt + 26) + ' L' + (xr - 13) + ' ' + (yt + 26) + ' Z',
        fill: 'var(--paper-3)', stroke: 'var(--ink-soft)', 'stroke-width': 1.6 }, g);
      txt(g, xr, yt + 18, anti, { fs: 11, bold: true, mono: true, fill: 'var(--ink-soft)' });
      txt(g, xr, yt - 6, 'ARNt', { fs: 9, fill: 'var(--ink-mute)' });
      const col = FAMILLE[AA[aa][1]] || 'var(--sub)';
      mk('circle', { cx: xr, cy: yt - 22, r: 13, fill: col, 'fill-opacity': 0.9,
        stroke: 'var(--paper)', 'stroke-width': 2 }, g);
      txt(g, xr, yt - 18, aa, { fs: 9.5, bold: true, fill: '#fff' });
    }

    // la chaîne d'acides aminés déjà assemblée
    const faits = prot.slice(0, k);
    const dxA = Math.min(42, (W - 70) / Math.max(1, faits.length));
    /* La chaîne sort du ribosome : sans ce trait, elle avait l'air de flotter à
       côté, et c'est justement le lien qu'il faut voir. */
    if (faits.length) {
      const xf = 30 + (faits.length - 1) * dxA;
      mk('path', { d: 'M' + (xf + 13) + ' ' + yc + ' Q' + ((xf + xr) / 2) + ' ' + (yc + 18)
        + ' ' + xr + ' ' + (yARN - 62), fill: 'none', stroke: 'var(--ink-soft)',
        'stroke-width': 1.4, 'stroke-dasharray': '4 4', opacity: 0.5 }, g);
    }
    faits.forEach((c, i) => {
      const col = FAMILLE[AA[c.aa][1]] || 'var(--sub)';
      const x = 30 + i * dxA;
      if (i) {
        mk('line', { x1: x - dxA + 13, y1: yc, x2: x - 13, y2: yc,
          stroke: 'var(--ink-soft)', 'stroke-width': 2 }, g);
      }
      mk('circle', { cx: x, cy: yc, r: 13, fill: col, 'fill-opacity': 0.9,
        stroke: 'var(--paper)', 'stroke-width': 2 }, g);
      txt(g, x, yc + 4, c.aa, { fs: 9.5, bold: true, fill: '#fff' });
    });
    txt(g, 16, yc - 24, 'la protéine qui s’assemble', { fs: 10, anchor: 'start', fill: 'var(--ink-soft)' });

    rCourant.set(!aa ? '—' : aa === 'Stop'
      ? 'codon ' + (k + 1) + ' = ' + codon + ' : codon STOP, la traduction s’arrête'
      : 'codon ' + (k + 1) + ' = ' + codon + ' → ' + AA[aa][0] + ' (' + AA[aa][1] + ')');
  }

  /* ── changer une base ─────────────────────────────────────────────────── */
  const onClick = (e) => {
    const c = cibles.find((z) => z.el === e.target);
    if (!c) return;
    // on fait tourner A → T → G → C → A : quatre clics ramènent au départ, donc
    // rien n'est jamais perdu
    const j = (BASES.indexOf(seq[c.i]) + 1) % 4;
    seq = seq.slice(0, c.i) + BASES[j] + seq.slice(c.i + 1);
    choisie = c.i;
    dessine();
  };
  svg.addEventListener('click', onClick);
  lab.onDestroy(() => svg.removeEventListener('click', onClick));

  majControles();
  lab.onResize(dessine);
  lab.loop((dt, t) => { temps = t; dessine(); });
}
