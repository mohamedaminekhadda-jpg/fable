// Équilibrer une réaction chimique.
//
// Équilibrer n'est pas un jeu d'écriture : c'est vérifier qu'aucun atome n'a
// disparu. La simulation ne connaît pas la réponse — elle COMPTE, exactement
// comme l'élève, et affiche ce compte en atomes qu'on peut aligner du regard.
//
// Deux choses rendent la leçon visible, et aucune n'est décorative :
//
//   • Les atomes de chaque élément sont posés en deux rangées face à face, de
//     part et d'autre de la flèche. Une équation équilibrée est une figure
//     SYMÉTRIQUE. On n'a pas besoin de lire les nombres pour voir qu'il en
//     manque : la rangée est plus courte.
//
//   • La masse des deux côtés est affichée en permanence. Tant que l'équation
//     n'est pas équilibrée, elles diffèrent — et c'est là toute la raison
//     d'équilibrer. Lavoisier n'a pas énoncé une règle de calcul, il a énoncé
//     que la matière ne se perd pas.

import {
  REACTIONS, ESPECES, COULEUR, elements, bilan, equilibree, simplifiee,
  masses, masseMolaire,
} from './reactions.js';

const MAX_ESPECES = 5;

export function mount(lab) {
  const { make, fr } = lab;
  const svg = lab.svg();

  let etaitEquilibree = false;

  const quoi = lab.select({
    label: 'La réaction', options: REACTIONS, value: 'methane',
    onChange: () => { reglerLesCurseurs(); etaitEquilibree = false; dessine(); },
  });

  lab.group('Les coefficients');
  const coefs = [];
  for (let i = 0; i < MAX_ESPECES; i++) {
    coefs.push(lab.slider({
      label: '—', min: 1, max: 15, step: 1, value: 1, dec: 0, onInput: dessine,
    }));
  }

  const voirMolecules = lab.check({ label: 'Montrer les molécules', value: true, onChange: dessine });

  lab.buttons([
    { label: 'Tout remettre à 1', onClick: () => { coefs.forEach((c) => c.set(1)); etaitEquilibree = false; dessine(); } },
    { label: 'Montrer la solution', onClick: () => {
      const r = reaction();
      r.sol.forEach((v, i) => coefs[i].set(v));
      dessine();
    } },
  ]);

  const txt = (v) => (v == null ? '—' : String(v));
  lab.group('Le verdict');
  const rEtat = lab.readout({ label: 'L’équation', format: txt, hi: true });
  lab.group('La masse, des deux côtés');
  const rMg = lab.readout({ label: 'À gauche', format: txt });
  const rMd = lab.readout({ label: 'À droite', format: txt });
  const rEcart = lab.readout({ label: 'Écart', format: txt, hi: true });

  const reaction = () => REACTIONS.find((r) => r.value === quoi.value);
  const valeurs = () => {
    const r = reaction();
    return r.sol.map((_, i) => Math.round(coefs[i].value));
  };

  /* Un jeu de curseurs pour toutes les réactions : on les renomme et on cache
     ceux qui ne servent pas. Créer et détruire des contrôles à chaque
     changement ferait sauter le panneau sous les doigts. */
  function reglerLesCurseurs() {
    const r = reaction();
    const noms = [...r.g, ...r.d];
    coefs.forEach((c, i) => {
      const sert = i < noms.length;
      c.show(sert);
      if (!sert) return;
      const e = ESPECES[noms[i]];
      const cote = i < r.g.length ? 'réactif' : 'produit';
      c.row.querySelector('label').textContent = 'devant ' + e.f + '  (' + cote + ')';
      c.set(1);
    });
  }

  /* ── outils de tracé ───────────────────────────────────────────────────── */
  let regle = null;
  const mesure = (s, fs, bold) => {
    if (!regle) return String(s).length * fs * 0.55;
    regle.setAttribute('font-size', fs);
    regle.setAttribute('font-weight', bold ? 600 : 400);
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
  // une apparition d'une seule image, sans boucle d'animation à tenir
  const surgit = (el, delai) => {
    el.setAttribute('opacity', '0');
    el.style.transition = 'opacity .34s ease ' + (delai || 0) + 'ms';
    requestAnimationFrame(() => el.setAttribute('opacity', '1'));
  };

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    regle = make('text', { x: -9999, y: -9999, fill: 'none' }, svg);
    const { w: W, h: H } = lab.size();
    const r = reaction();
    const c = valeurs();
    const eq = equilibree(r, c);
    const simple = simplifiee(c);
    const b = bilan(r, c);
    const m = masses(r, c);

    const fsT = Math.max(13, Math.min(18, W / 42));
    T(svg, 12, 10 + fsT, r.label, { fs: fsT, bold: true, anchor: 'start' });
    const lignes = coupe(r.quoi, W - 24, 11.5);
    lignes.forEach((l, i) => T(svg, 12, 12 + fsT * 2 + i * 13, l,
      { fs: 11.5, anchor: 'start', fill: 'var(--ink-soft)' }));
    let y = 12 + fsT * 2 + lignes.length * 13 + 14;

    y = equation(r, c, eq, W, y) + 12;

    const els = elements(r);
    const hTally = 22 + els.length * 26;
    const reste = H - y - 10;
    if (voirMolecules.value && reste > hTally + 90) {
      y = molecules(r, c, W, y, Math.min(reste - hTally - 10, 150)) + 10;
    }
    tally(r, b, els, W, Math.max(y, H - 8 - hTally), eq);

    /* ── les mesures ── */
    rEtat.set(!eq ? 'pas encore équilibrée'
      : simple ? 'ÉQUILIBRÉE, et sous sa forme la plus simple'
        : 'équilibrée, mais simplifiable (divisez tout)');
    rMg.set(fr(m.g, 3) + ' g/mol');
    rMd.set(fr(m.d, 3) + ' g/mol');
    const d = m.d - m.g;
    rEcart.set(Math.abs(d) < 1e-9 ? 'aucun — rien ne se perd'
      : fr(Math.abs(d), 3) + ' g/mol ' + (d > 0 ? 'de trop à droite' : 'de trop à gauche'));
    etaitEquilibree = eq;
    if (regle) { regle.remove(); regle = null; }
  }

  /* ── l'équation, écrite avec les coefficients courants ──────────────────── */
  function equation(r, c, eq, W, y) {
    const g = make('g', {}, svg);
    const fs = Math.max(13, Math.min(19, W / 40));
    const noms = [...r.g, ...r.d];
    // on mesure d'abord tout le monde pour centrer la ligne
    const morceaux = [];
    noms.forEach((k, i) => {
      if (i === r.g.length) morceaux.push({ t: '→', fleche: true });
      else if (i) morceaux.push({ t: '+', signe: true });
      morceaux.push({ t: String(c[i]), coef: true, mis: c[i] !== 1 });
      morceaux.push({ t: ESPECES[k].f, formule: true });
    });
    const esp = fs * 0.42;
    let large = 0;
    morceaux.forEach((p) => {
      p.w = mesure(p.t, p.coef || p.formule ? fs : fs * 0.9, p.coef);
      large += p.w + esp;
    });
    let x = Math.max(10, (W - (large - esp)) / 2);
    morceaux.forEach((p) => {
      if (p.fleche) {
        const yy = y + fs * 0.62;
        make('path', { d: 'M' + x + ' ' + yy + 'h' + (p.w + esp * 0.6),
          stroke: eq ? 'var(--sub)' : 'var(--ink-mute)', 'stroke-width': eq ? 2.4 : 1.6,
          'stroke-dasharray': eq ? null : '4 4', fill: 'none' }, g);
        make('path', { d: 'M' + (x + p.w + esp * 0.6) + ' ' + yy + 'l-6 -4v8z',
          fill: eq ? 'var(--sub)' : 'var(--ink-mute)' }, g);
        x += p.w + esp;
        return;
      }
      const t = T(g, x, y + fs, p.t, {
        fs: p.signe ? fs * 0.9 : fs, anchor: 'start', mono: p.coef,
        bold: p.coef && p.mis,
        fill: p.coef ? (p.mis ? 'var(--sub)' : 'var(--ink-mute)')
          : p.signe ? 'var(--ink-mute)' : 'var(--ink)',
      });
      if (p.formule) t.setAttribute('font-weight', '500');
      x += p.w + esp;
    });
    if (eq) {
      const et = T(g, W / 2, y + fs + 20, 'aucun atome ne manque nulle part',
        { fs: 11, fill: 'var(--sub)', bold: true });
      if (!etaitEquilibree) surgit(et, 60);
      return y + fs + 24;
    }
    return y + fs + 6;
  }

  /* ── les molécules, répétées autant de fois qu'on en a demandé ──────────── */
  function molecules(r, c, W, y, hMax) {
    const g = make('g', {}, svg);
    const noms = [...r.g, ...r.d];
    const total = c.reduce((s, v) => s + v, 0);
    // un rayon qui tient compte du nombre à poser : treize dioxygènes ne se
    // dessinent pas à la même taille qu'une molécule d'eau
    const R = Math.max(4.5, Math.min(11, (W * 0.62) / Math.max(10, total) / 1.6));
    const pasX = R * 4.4, pasY = R * 3.6;
    const cases = [];
    noms.forEach((k, i) => { for (let n = 0; n < c[i]; n++) cases.push({ k, gauche: i < r.g.length }); });
    const gauche = cases.filter((x) => x.gauche), droite = cases.filter((x) => !x.gauche);
    const dessineGroupe = (liste, x0, x1) => {
      const parLigne = Math.max(1, Math.floor((x1 - x0) / pasX));
      const lignes = Math.ceil(liste.length / parLigne);
      liste.forEach((u, n) => {
        const li = Math.floor(n / parLigne), co = n % parLigne;
        const dans = Math.min(parLigne, liste.length - li * parLigne);
        const cx = (x0 + x1) / 2 + (co - (dans - 1) / 2) * pasX;
        const cy = y + R * 2 + li * pasY;
        if (cy + R * 2 < y + hMax) molecule(g, ESPECES[u.k], cx, cy, R);
      });
      return lignes;
    };
    const mid = W / 2;
    dessineGroupe(gauche, 14, mid - 22);
    dessineGroupe(droite, mid + 22, W - 14);
    make('line', { x1: mid, y1: y + 4, x2: mid, y2: y + hMax - 6,
      stroke: 'var(--rule-2)', 'stroke-width': 1, 'stroke-dasharray': '3 4' }, g);
    return y + hMax;
  }

  function atome(p, x, yy, r, z) {
    make('circle', { cx: x, cy: yy, r, fill: COULEUR[z] || '#888',
      stroke: 'var(--paper)', 'stroke-width': Math.max(0.8, r * 0.16) }, p);
    if (r >= 6.5) {
      T(p, x, yy + r * 0.36, z, { fs: r * 1.0, bold: true, mono: true,
        fill: z === 'H' ? 'var(--ink)' : '#fff' });
    }
  }

  function molecule(p, e, x, yy, R) {
    const lien = (x1, y1, x2, y2) => make('line', { x1, y1, x2, y2,
      stroke: 'var(--ink-mute)', 'stroke-width': Math.max(1, R * 0.22), opacity: 0.55 }, p);
    if (e.mode === 'bloc') {
      const w = mesure(e.f, R * 1.15) + R * 1.4;
      make('rect', { x: x - w / 2, y: yy - R * 1.05, width: w, height: R * 2.1, rx: R * 0.5,
        fill: 'var(--paper-3)', stroke: 'var(--rule-2)', 'stroke-width': 1 }, p);
      T(p, x, yy + R * 0.4, e.f, { fs: R * 1.15, mono: true, fill: 'var(--ink-soft)' });
      return;
    }
    if (e.mode === 'seul') { atome(p, x, yy, R, Object.keys(e.a)[0]); return; }
    if (e.mode === 'paire') {
      lien(x - R * 0.8, yy, x + R * 0.8, yy);
      atome(p, x - R * 0.8, yy, R, e.paire[0]);
      atome(p, x + R * 0.8, yy, R, e.paire[1]);
      return;
    }
    if (e.mode === 'lineaire') {
      lien(x - R * 1.5, yy, x + R * 1.5, yy);
      atome(p, x - R * 1.5, yy, R * 0.95, e.autour);
      atome(p, x + R * 1.5, yy, R * 0.95, e.autour);
      atome(p, x, yy, R, e.centre);
      return;
    }
    // étoile : le central, les autres autour
    const n = e.a[e.autour];
    const dep = e.centre === 'O' ? -2.6 : -Math.PI / 2;
    const arc = e.centre === 'O' ? 1.4 : (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      const a = dep + i * arc;
      const px = x + Math.cos(a) * R * 1.7, py = yy + Math.sin(a) * R * 1.7;
      lien(x, yy, px, py);
      atome(p, px, py, R * 0.62, e.autour);
    }
    atome(p, x, yy, R, e.centre);
  }

  /* ── le compte des atomes, en deux rangées face à face ──────────────────── */
  function tally(r, b, els, W, y, eq) {
    const g = make('g', {}, svg);
    const mid = W / 2;
    const dispo = mid - 74;
    const maxN = Math.max(1, ...els.map((z) => Math.max(b[z].g, b[z].d)));
    const rr = Math.max(2.6, Math.min(6, dispo / maxN / 2.5));
    const pas = rr * 2.5;

    T(g, mid, y + 8, 'les atomes, comptés',
      { fs: 9.5, mono: true, fill: 'var(--ink-mute)' });
    els.forEach((z, i) => {
      const yy = y + 26 + i * 26;
      const juste = b[z].g === b[z].d;
      T(g, mid, yy + 4, z, { fs: 11.5, bold: true, mono: true,
        fill: juste ? 'var(--sub)' : 'var(--ink-mute)' });
      for (let k = 0; k < b[z].g; k++) {
        make('circle', { cx: mid - 16 - k * pas, cy: yy, r: rr, fill: COULEUR[z] || '#888',
          opacity: juste ? 0.95 : 0.5 }, g);
      }
      for (let k = 0; k < b[z].d; k++) {
        make('circle', { cx: mid + 16 + k * pas, cy: yy, r: rr, fill: COULEUR[z] || '#888',
          opacity: juste ? 0.95 : 0.5 }, g);
      }
      T(g, 12, yy + 4, String(b[z].g), { fs: 10.5, mono: true, anchor: 'start',
        fill: juste ? 'var(--ink)' : 'var(--ink-mute)' });
      T(g, W - 12, yy + 4, String(b[z].d), { fs: 10.5, mono: true, anchor: 'end',
        fill: juste ? 'var(--ink)' : 'var(--ink-mute)' });
      if (!juste) {
        const trop = b[z].d > b[z].g;
        T(g, trop ? mid + 16 + Math.max(b[z].g, 0) * pas + 6 : mid - 16 - b[z].d * pas - 6,
          yy + 4, Math.abs(b[z].d - b[z].g) + ' en trop',
          { fs: 9, anchor: trop ? 'start' : 'end', fill: '#c1440e' });
      }
    });
    if (eq && !etaitEquilibree) surgit(g, 0);
  }

  reglerLesCurseurs();
  lab.onResize(dessine);
  lab.onReset(() => { reglerLesCurseurs(); etaitEquilibree = false; dessine(); });
  dessine();
}
