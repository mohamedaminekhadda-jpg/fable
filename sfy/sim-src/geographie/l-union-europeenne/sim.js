// L'Union européenne — construire le bloc sous les yeux du lecteur.
//
// Un curseur d'années, une carte, une frise. On tire le curseur de 1957 à
// aujourd'hui et les pays s'allument dans l'ordre où ils sont entrés : six,
// neuf, dix, douze, quinze, vingt-cinq, vingt-sept, vingt-huit, puis
// vingt-sept de nouveau quand le Royaume-Uni s'en va.
//
// La même carte sert ensuite à poser les autres questions — la zone
// euro, l'espace Schengen, la richesse par tête — et c'est là que l'affaire
// devient intéressante : les trois cartes ne se superposent pas. On peut être
// dans l'Union sans l'euro, dans Schengen sans l'Union, et deux pays membres du
// même marché peuvent avoir huit fois d'écart de revenu.

import {
  PAYS, VAGUES, AN_MIN, AN_MAX,
  couleurVague, estMembre, bilan, teinte,
} from './europe.js';
import { CONTOURS } from './europe-fond.js';

/* L'emprise de la carte. Elle descend jusqu'au 29ᵉ parallèle pour que le Maroc
   y figure — sa candidature de 1987 est au programme — et s'arrête là, sinon le
   Sahara tirerait tout le cadre vers le sud et l'Europe deviendrait minuscule.
   Le parallèle de référence est fixé au milieu du continent : à zéro, la
   projection étirerait la Scandinavie du double de sa largeur. */
const BORNES = { lon0: -25, lon1: 45, lat0: 29, lat1: 71 };
const PARALLELE = 50;

/* Les pays hors sujet étaient d'abord dessinés en gris clair à 55 % — ils se
   mélangeaient au fond de la page, et sur le thème sombre le code du pays
   devenait illisible : la couleur réellement affichée n'était plus celle sur
   laquelle on avait choisi la couleur du texte. Ils sont désormais opaques, et
   leur contraste ne dépend donc plus du thème. */
const PALE = '#b8c0c8';          // un pays qui n'est pas dans le sujet du moment
const OR = '#d4a017';            // l'euro
const VERT = '#2e8b57';          // Schengen
const BRIQUE = '#b5462f';        // l'exception : membre, mais pas dedans
const CANDIDAT = '#9aa3ad';

const VUES = [
  { value: 'adhesions', label: 'les élargissements' },
  { value: 'euro', label: 'la zone euro' },
  { value: 'schengen', label: 'l’espace Schengen' },
  { value: 'richesse', label: 'la richesse par habitant' },
  { value: 'population', label: 'la population' },
];

/* Noir ou blanc sur un fond donné. Un seuil de luminance — « au-dessus de 0,42,
   écrire en noir » — donne la bonne réponse presque partout et la mauvaise juste
   à côté du seuil : l'or de la zone euro tombait à 0,39, donc du blanc, donc un
   contraste de 2,4 alors que le noir en donnait 7,2. On calcule les deux
   rapports et on garde le meilleur ; il n'y a plus de « juste à côté ». */
const NOIR = '#141a20', BLANC = '#ffffff';
function luminance(hex) {
  const c = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function lisible(hex) {
  const L = luminance(hex);
  const contre = (autre) => {
    const A = luminance(autre);
    return (Math.max(A, L) + 0.05) / (Math.min(A, L) + 0.05);
  };
  return contre(NOIR) >= contre(BLANC) ? NOIR : BLANC;
}

export function mount(lab) {
  const { fr } = lab;
  const svg = lab.svg();
  const geo = lab.carte(CONTOURS, { parallele: PARALLELE });

  /* ── réglages ─────────────────────────────────────────────────────────── */
  const an = lab.slider({
    label: 'Année', min: AN_MIN, max: AN_MAX, step: 1, value: AN_MAX, dec: 0,
    format: (v) => String(Math.round(v)), onInput: dessine,
  });
  let joue = null;
  const [btn] = lab.buttons([{
    label: '▶  Dérouler l’histoire',
    onClick: (b) => {
      if (joue) { clearInterval(joue); joue = null; b.textContent = '▶  Dérouler l’histoire'; return; }
      if (an.value >= AN_MAX) an.set(AN_MIN);
      b.textContent = '❙❙  Arrêter';
      joue = setInterval(() => {
        an.set(Math.min(AN_MAX, an.value + 1));
        dessine();
        if (an.value >= AN_MAX) { clearInterval(joue); joue = null; b.textContent = '▶  Dérouler l’histoire'; }
      }, 90);
    },
  }]);
  lab.onDestroy(() => joue && clearInterval(joue));

  const vue = lab.select({ label: 'Ce qu’on regarde', options: VUES, value: 'adhesions', onChange: dessine });
  const voisins = lab.check({ label: 'Montrer les voisins hors Union', value: true, onChange: dessine });
  const cands = lab.check({ label: 'Montrer les pays candidats', value: false, onChange: dessine });

  /* ── mesures ──────────────────────────────────────────────────────────── */
  lab.group('Le bloc, cette année-là');
  const rN = lab.readout({ label: 'États membres', dec: 0, hi: true });
  const rPop = lab.readout({ label: 'Population', unit: ' M hab.', dec: 1 });
  const rPib = lab.readout({ label: 'PIB total', unit: ' Md $', dec: 0 });
  const rTete = lab.readout({ label: 'PIB par habitant', unit: ' $', dec: 0 });
  const rPart = lab.readout({ label: 'Part du PIB mondial', unit: ' %', dec: 1 });
  const rEcart = lab.readout({ label: 'Écart riche / pauvre', dec: 1, format: (v) => fr(v, 1) + ' ×' });
  const rEuro = lab.readout({ label: 'Dans la zone euro', dec: 0 });
  const rSch = lab.readout({ label: 'Dans l’espace Schengen', dec: 0 });

  let sel = null;                                   // le pays cliqué

  /* ── dessin ───────────────────────────────────────────────────────────── */
  const mk = (t, a, p) => lab.make(t, a, p);
  function txt(p, x, y, s, a = {}) {
    const t = mk('text', { x, y, 'font-size': a.fs || 12, fill: a.fill || 'var(--ink)',
      'text-anchor': a.anchor || 'start', 'font-weight': a.bold ? 600 : 400,
      'font-family': a.mono ? 'var(--mono)' : 'inherit', opacity: a.op != null ? a.op : 1 }, p);
    t.textContent = s;
    return t;
  }
  /* Couper un texte à une largeur donnée demande de savoir ce que mesure ce
     texte. J'avais d'abord estimé un caractère à 0,52 fois la taille de police :
     l'estimation est fausse de quelques pour cent, et comme la fiche n'a que
     huit pixels de marge à droite, quelques pour cent suffisaient à la faire
     sortir du cadre — ce qu'un balayage à six tailles d'écran a montré tout de
     suite. On mesure donc pour de vrai, avec une règle invisible retirée en fin
     de tracé pour qu'elle ne traîne pas dans le SVG. */
  let regle = null;
  function mesure(s, fs, mono, bold) {
    if (!regle) return String(s).length * fs * 0.52;
    regle.setAttribute('font-size', fs);
    regle.setAttribute('font-family', mono ? 'var(--mono)' : 'inherit');
    regle.setAttribute('font-weight', bold ? 600 : 400);
    regle.textContent = String(s);
    const l = regle.getComputedTextLength();
    return l || String(s).length * fs * 0.52;
  }
  function coupe(s, largeur, fs, opt = {}) {
    const mots = String(s).split(/\s+/), out = [];
    let l = '';
    mots.forEach((m) => {
      if (!l) { l = m; return; }
      const essai = l + ' ' + m;
      if (mesure(essai, fs, opt.mono, opt.bold) <= largeur) l = essai;
      else { out.push(l); l = m; }
    });
    if (l) out.push(l);
    return out;
  }

  // La couleur d'un pays dépend de la vue ET de l'année : c'est tout le sujet.
  function remplissage(p, annee, ech) {
    const m = estMembre(p, annee);
    if (vue.value === 'adhesions') {
      if (m) return couleurVague(p.ue);
      if (p.sortie && annee >= p.sortie) return couleurVague(2020);
      return p.candidat && annee >= p.candidat ? CANDIDAT : PALE;
    }
    if (vue.value === 'euro') {
      if (m && p.euro && annee >= p.euro) return OR;
      if (m) return BRIQUE;
      return PALE;
    }
    if (vue.value === 'schengen') {
      if (p.schengen && annee >= p.schengen) return VERT;
      if (m) return BRIQUE;
      return PALE;
    }
    if (!m) return PALE;
    if (vue.value === 'richesse') return teinte(ech((p.pib * 1000) / p.pop));
    return teinte(ech(p.pop));
  }

  function dessine() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    regle = mk('text', { x: -9999, y: -9999, fill: 'none' }, svg);
    const { w: W, h: H } = lab.size();
    const annee = Math.round(an.value);
    const b = bilan(annee);

    rN.set(b.n); rPop.set(b.pop); rPib.set(b.pib); rTete.set(b.pibParTete);
    rPart.set(b.partMonde * 100); rEcart.set(b.ecart);
    rEuro.set(b.euro); rSch.set(b.schengen);

    const large = W >= 620;
    const PW = large ? Math.max(168, Math.min(250, W * 0.25)) : 0;
    const FH = Math.max(56, Math.min(88, H * 0.17));
    const bandeH = large ? 0 : 22;
    const carteBox = { x: 4, y: 4 + bandeH, w: W - PW - (large ? 14 : 8), h: H - FH - 14 - bandeH };

    /* échelle des vues continues — bornée sur les membres du moment, sinon la
       rampe se calerait sur un pays absent de la carte */
    let ech = () => 0.5, bornes = null;
    if (vue.value === 'richesse' || vue.value === 'population') {
      const vals = b.membres.map((p) => (vue.value === 'richesse' ? (p.pib * 1000) / p.pop : p.pop));
      if (vals.length) {
        const lo = Math.min(...vals), hi = Math.max(...vals);
        // échelle logarithmique : de Malte à l'Allemagne il y a un facteur 156,
        // et sur une échelle linéaire les vingt-cinq autres partagent la même teinte
        const L = Math.log(lo), Hh = Math.log(hi);
        ech = (v) => (Hh > L ? (Math.log(v) - L) / (Hh - L) : 0.5);
        bornes = { lo, hi };
      }
    }

    /* ── la carte ───────────────────────────────────────────────────────── */
    const P = geo.cadre(carteBox, { bornes: BORNES });
    const gCarte = mk('g', { 'clip-path': 'url(#cadreCarte)' }, svg);
    // L'emprise coupe l'Afrique du Nord en pleine course : sans découpe, le
    // Sahara marocain et l'Algérie déborderaient sur la frise. Un rectangle de
    // découpe vaut mieux que de renoncer à montrer le Maroc.
    const defs = mk('defs', {}, svg);
    const cp = mk('clipPath', { id: 'cadreCarte' }, defs);
    mk('rect', { x: P.boite.x, y: P.boite.y, width: P.boite.w, height: P.boite.h }, cp);
    mk('rect', { x: P.boite.x, y: P.boite.y, width: P.boite.w, height: P.boite.h, rx: 3,
      fill: 'var(--ink)', 'fill-opacity': 0.04, stroke: 'var(--rule)', 'stroke-width': 1 }, svg);

    // Le décor d'abord : les pays qui ne sont pas du sujet mais sans lesquels
    // on ne reconnaîtrait pas la carte — la Russie, la Libye, le Levant.
    const auSujet = new Set(PAYS.map((p) => p.code));
    geo.codes().forEach((code) => {
      if (auSujet.has(code)) return;
      const d = geo.chemin(code, P);
      if (d) mk('path', { d, fill: 'var(--ink)', 'fill-opacity': 0.07,
        stroke: 'var(--ink-soft)', 'stroke-width': 0.5, 'stroke-opacity': 0.3 }, gCarte);
    });

    const etiquettes = [];
    PAYS.forEach((p) => {
      const m = estMembre(p, annee);
      const estCandidat = p.candidat && annee >= p.candidat && !m;
      const sorti = p.sortie && annee >= p.sortie;
      const d = geo.chemin(p.code, P);
      if (!d) return;
      /* Décocher « les candidats » ne doit pas faire disparaître la Turquie de
         la surface de la Terre : elle repasse simplement en décor. Sans cela,
         la Méditerranée orientale s'ouvrait sur un trou, et une carte trouée
         n'est plus une carte. */
      const hors = !m && !sorti;
      if (hors && ((estCandidat && !cands.value) || (!estCandidat && !voisins.value))) {
        mk('path', { d, fill: 'var(--ink)', 'fill-opacity': 0.07,
          stroke: 'var(--ink-soft)', 'stroke-width': 0.5, 'stroke-opacity': 0.3 }, gCarte);
        return;
      }
      const fill = remplissage(p, annee, ech);
      const g = mk('g', { cursor: 'pointer' }, gCarte);
      const chemin = mk('path', { d, fill,
        stroke: sel === p.code ? 'var(--ink)' : 'var(--paper)',
        'stroke-width': sel === p.code ? 2.2 : 0.6,
        'stroke-linejoin': 'round',
        'stroke-dasharray': estCandidat ? '3 2' : null }, g);
      g.addEventListener('click', () => { sel = sel === p.code ? null : p.code; dessine(); });

      /* Un pays minuscule — Malte, le Luxembourg, le Monténégro — occupe deux
         pixels : impossible à viser à la souris. On lui ajoute une cible ronde
         invisible, centrée sur son ancre. Le dessin reste juste, le clic
         devient possible. */
      const b = chemin.getBBox();
      const anc = P(p.lon, p.lat);
      if (Math.max(b.width, b.height) < 12) {
        mk('circle', { cx: anc[0], cy: anc[1], r: 7, fill: 'transparent' }, g);
      }
      etiquettes.push({ p, anc, b, fill, m, sorti });
    });

    /* Les étiquettes après tous les pays, sinon un voisin dessiné ensuite passe
       par-dessus. Elles ne sont posées que là où le pays est assez large pour
       les porter ; ailleurs, c'est la fiche qui nomme. */
    const fsC = Math.max(7, Math.min(11, P.parDegre * 1.5));
    // Les Balkans mettent six pays dans un mouchoir : à 820 pixels, « SI » et
    // « HR » se recouvraient. Un code qui n'a pas la place ne s'écrit pas — la
    // fiche le nomme au clic, et deux codes empilés ne nomment rien.
    const pris = [];
    etiquettes.forEach(({ p, anc, b, fill, m, sorti }) => {
      if (b.width < mesure(p.code, fsC, true) + 3 || b.height < fsC + 1) return;
      const lw = mesure(p.code, fsC, true);
      const boite = { x: anc[0] - lw / 2, y: anc[1] - fsC * 0.7, w: lw, h: fsC };
      if (pris.some((q) => boite.x < q.x + q.w + 1 && boite.x + boite.w + 1 > q.x
        && boite.y < q.y + q.h + 1 && boite.y + boite.h + 1 > q.y)) return;
      pris.push(boite);
      txt(gCarte, anc[0], anc[1] + fsC * 0.34, p.code,
        { fs: fsC, anchor: 'middle', bold: true, mono: true,
          fill: m || sorti ? lisible(fill) : 'var(--ink-soft)' });
      // un pays sorti garde sa place et perd sa couleur : le Brexit se voit
      if (sorti && vue.value === 'adhesions') {
        const l = mesure(p.code, fsC, true) / 2 + 2;
        mk('line', { x1: anc[0] - l, y1: anc[1], x2: anc[0] + l, y2: anc[1],
          stroke: '#ffffff', 'stroke-width': 1.4, opacity: 0.95 }, gCarte);
      }
    });

    /* ── la légende ─────────────────────────────────────────────────────── */
    const entrees = () => {
      if (vue.value === 'adhesions') {
        return VAGUES.filter((v) => v.an <= annee)
          .map((v) => ({ c: v.couleur, t: v.an + ' — ' + v.titre }));
      }
      if (vue.value === 'euro') {
        return [{ c: OR, t: 'a adopté l’euro' }, { c: BRIQUE, t: 'membre, hors zone euro' },
          { c: PALE, t: 'hors de l’Union' }];
      }
      if (vue.value === 'schengen') {
        return [{ c: VERT, t: 'dans l’espace Schengen' }, { c: BRIQUE, t: 'membre, hors Schengen' },
          { c: PALE, t: 'ni l’un ni l’autre' }];
      }
      return null;                                   // rampe continue
    };

    const yBas = H - FH - 12;                 // la frise commence là : rien en dessous

    if (large) {
      const px = W - PW + 4, pw = PW - 12;
      let py = 16;
      coupe(vue.value === 'adhesions' ? 'Entrées dans l’Union'
        : VUES.find((v) => v.value === vue.value).label, pw, 11.5, { bold: true })
        .forEach((l) => { txt(svg, px, py, l, { fs: 11.5, bold: true, fill: 'var(--ink-soft)' }); py += 13; });
      py += 3;
      const L = entrees();
      if (L) {
        L.forEach((e) => {
          mk('rect', { x: px, y: py - 7, width: 13, height: 10, rx: 2.5, fill: e.c,
            stroke: 'var(--rule)', 'stroke-width': 0.6 }, svg);
          const lignes = coupe(e.t, pw - 19, 10.5);
          lignes.forEach((ligne, i) => {
            txt(svg, px + 19, py + i * 11.5, ligne, { fs: 10.5, fill: 'var(--ink-soft)' });
          });
          py += 11.5 * lignes.length + 4;
        });
      } else if (bornes) {
        const gid = 'rampe-' + vue.value;
        const defs = mk('defs', {}, svg);
        const lg = mk('linearGradient', { id: gid, x1: '0', y1: '0', x2: '1', y2: '0' }, defs);
        for (let i = 0; i <= 20; i++) {
          mk('stop', { offset: (i * 5) + '%', 'stop-color': teinte(i / 20) }, lg);
        }
        mk('rect', { x: px, y: py - 4, width: pw, height: 12, rx: 3, fill: 'url(#' + gid + ')',
          stroke: 'var(--rule)', 'stroke-width': 0.6 }, svg);
        const unite = vue.value === 'richesse' ? ' $' : ' M';
        txt(svg, px, py + 20, fr(bornes.lo, vue.value === 'richesse' ? 0 : 2) + unite,
          { fs: 10, fill: 'var(--ink-soft)' });
        txt(svg, px + pw, py + 20, fr(bornes.hi, vue.value === 'richesse' ? 0 : 1) + unite,
          { fs: 10, fill: 'var(--ink-soft)', anchor: 'end' });
        txt(svg, px, py + 34, 'échelle logarithmique', { fs: 9.5, fill: 'var(--ink-soft)', op: 0.75 });
        py += 46;
      }

      /* la fiche du pays cliqué — jamais collée à la légende, jamais poussée
         dans la frise */
      py = Math.max(py + 14, Math.min(H * 0.42, yBas - 190));
      if (py < yBas - 24) {
        mk('line', { x1: px, y1: py - 12, x2: px + pw, y2: py - 12, stroke: 'var(--rule)' }, svg);
        fiche(px, py, pw, annee, yBas);
      }
    } else {
      // écran étroit : la légende devient une bande, et la fiche trois lignes
      // bande étroite : on pose les entrées de légende tant qu'elles tiennent,
      // et la dernière qui ne tient pas n'est pas dessinée à moitié
      const L = entrees();
      let bx = 6;
      (L || []).forEach((e) => {
        const lw = mesure(e.t, 9.5);
        if (bx + 15 + lw > W - 6) return;
        mk('rect', { x: bx, y: 4, width: 11, height: 9, rx: 2, fill: e.c }, svg);
        txt(svg, bx + 15, 12.5, e.t, { fs: 9.5, fill: 'var(--ink-soft)' });
        bx += 15 + lw + 12;
      });
      if (!L && bornes) {
        const defs = mk('defs', {}, svg);
        const lg = mk('linearGradient', { id: 'rampeB', x1: '0', y1: '0', x2: '1', y2: '0' }, defs);
        for (let i = 0; i <= 20; i++) mk('stop', { offset: (i * 5) + '%', 'stop-color': teinte(i / 20) }, lg);
        mk('rect', { x: 6, y: 4, width: Math.min(150, W * 0.35), height: 9, rx: 2, fill: 'url(#rampeB)' }, svg);
        txt(svg, Math.min(150, W * 0.35) + 14, 12.5,
          fr(bornes.lo, 0) + ' → ' + fr(bornes.hi, 0) + (vue.value === 'richesse' ? ' $/hab.' : ' M hab.'),
          { fs: 9.5, fill: 'var(--ink-soft)' });
      }
      if (sel) ficheEtroite(annee, W, H - FH - 12);
    }

    function fiche(px, py, pw, annee2, yMax) {
      let y = py;
      // Une note de pays fait parfois six lignes. Plutôt que de la laisser
      // descendre dans la frise, on écrit tant qu'il reste de la place et on
      // s'arrête net : mieux vaut une note tronquée qu'une page cassée.
      const ligne = (s, o = {}) => {
        if (y > yMax) return false;
        txt(svg, px, y, s, o);
        y += o.saut || 13;
        return true;
      };
      if (!sel) {
        coupe('Cliquez un pays : sa date d’entrée, sa population, sa richesse et ses '
          + 'appartenances s’affichent ici.', pw, 10.5)
          .forEach((l) => ligne(l, { fs: 10.5, fill: 'var(--ink-soft)', op: 0.8 }));
        return;
      }
      const p = PAYS.find((q) => q.code === sel);
      coupe(p.nom, pw, 13, { bold: true }).forEach((l) => ligne(l, { fs: 13, bold: true, saut: 16 }));
      y += 2;
      const m = estMembre(p, annee2);
      const statut = m ? 'membre depuis ' + p.ue
        : p.sortie && annee2 >= p.sortie ? 'a quitté l’Union en ' + p.sortie
        : p.ue && annee2 < p.ue ? 'entrera en ' + p.ue
        : p.candidat && annee2 >= p.candidat ? 'candidat depuis ' + p.candidat : 'hors de l’Union';
      coupe(statut, pw, 11).forEach((l) => ligne(l, { fs: 11, fill: 'var(--sub)' }));
      y += 5;
      [
        ['population', fr(p.pop, p.pop < 10 ? 2 : 1) + ' M hab.'],
        ['PIB', fr(p.pib, 0) + ' Md $'],
        ['PIB / habitant', fr((p.pib * 1000) / p.pop, 0) + ' $'],
        ['euro', p.euro ? (annee2 >= p.euro ? 'depuis ' + p.euro : 'prévu en ' + p.euro) : 'non'],
        ['Schengen', p.schengen ? (annee2 >= p.schengen ? 'depuis ' + p.schengen : 'en ' + p.schengen) : 'non'],
      ].forEach(([a, v]) => {
        if (y > yMax) return;
        txt(svg, px + pw, y, v, { fs: 10.5, anchor: 'end', mono: true });
        ligne(a, { fs: 10.5, fill: 'var(--ink-soft)', saut: 14 });
      });
      if (p.note && y < yMax - 12) {
        y += 4;
        coupe(p.note, pw, 10).forEach((l) => ligne(l, { fs: 10, fill: 'var(--ink-soft)', op: 0.85, saut: 12 }));
      }
    }
    function ficheEtroite(annee2, w, ybas) {
      const p = PAYS.find((q) => q.code === sel);
      const m = estMembre(p, annee2);
      const s = p.nom + ' — ' + (m ? 'membre depuis ' + p.ue : p.sortie && annee2 >= p.sortie
        ? 'sorti en ' + p.sortie : p.candidat ? 'candidat depuis ' + p.candidat : 'hors Union')
        + ' · ' + fr(p.pop, 1) + ' M hab. · ' + fr((p.pib * 1000) / p.pop, 0) + ' $/hab.';
      const L = coupe(s, w - 12, 10.5);
      L.forEach((l, i) => txt(svg, 6, ybas - (L.length - 1 - i) * 12, l, { fs: 10.5, fill: 'var(--ink-soft)' }));
    }

    /* ── la frise ───────────────────────────────────────────────────────── */
    const fx0 = 40, fx1 = W - 12, fy1 = H - 16, fy0 = H - FH + 6;
    const X = (a) => fx0 + ((a - AN_MIN) / (AN_MAX - AN_MIN)) * (fx1 - fx0);
    // le nombre de membres année par année — le maximum sort du calcul, il
    // n'est pas écrit à la main : ajouter un pays au fichier suffit
    const compte = [];
    for (let a = AN_MIN; a <= AN_MAX; a++) compte.push(bilan(a).n);
    const nMax = Math.max(...compte);
    const Y = (n) => fy1 - (n / nMax) * (fy1 - fy0);

    // la courbe en escalier, remplie : c'est la frise et le graphique à la fois
    const pts = [];
    let prec = null;
    compte.forEach((n, i) => {
      const a = AN_MIN + i;
      if (prec !== null && n !== prec) pts.push([X(a), Y(prec)]);
      pts.push([X(a), Y(n)]);
      prec = n;
    });
    mk('path', {
      d: 'M' + fx0 + ' ' + fy1 + ' L' + pts.map((q) => q[0] + ' ' + q[1]).join(' L') + ' L' + X(AN_MAX) + ' ' + fy1 + ' Z',
      fill: 'var(--sub)', opacity: 0.14,
    }, svg);
    mk('path', { d: 'M' + pts.map((q) => q[0] + ' ' + q[1]).join(' L'), fill: 'none',
      stroke: 'var(--sub)', 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, svg);
    mk('line', { x1: fx0, y1: fy1, x2: fx1, y2: fy1, stroke: 'var(--rule)' }, svg);
    txt(svg, fx0 - 6, Y(nMax) + 3.5, String(nMax), { fs: 9, anchor: 'end', fill: 'var(--ink-soft)', mono: true });
    txt(svg, fx0 - 6, fy1 + 3.5, '0', { fs: 9, anchor: 'end', fill: 'var(--ink-soft)', mono: true });
    // « membres » ne s'écrit que s'il reste de la place entre le 0 et le 27 :
    // sur une scène courte la frise fait quarante pixels de haut, et les trois
    // étiquettes se marchaient dessus.
    if (fy1 - Y(nMax) > 46) {
      txt(svg, fx0 - 6, (Y(nMax) + fy1) / 2 - 8, 'membres',
        { fs: 8.5, anchor: 'end', fill: 'var(--ink-soft)', op: 0.8 });
    }

    // les vagues, étiquetées sur deux rangs quand elles se serrent
    let dernier = -1e9, haut = true;
    VAGUES.forEach((v) => {
      const x = X(v.an);
      if (x - dernier < 34) haut = !haut; else haut = true;
      dernier = x;
      mk('line', { x1: x, y1: fy0 - 2, x2: x, y2: fy1, stroke: v.couleur, 'stroke-width': 1,
        opacity: v.an <= annee ? 0.75 : 0.22, 'stroke-dasharray': v.depart ? '3 3' : null }, svg);
      mk('circle', { cx: x, cy: Y(bilan(v.an).n), r: 3, fill: v.couleur,
        stroke: 'var(--paper)', 'stroke-width': 1.2, opacity: v.an <= annee ? 1 : 0.3 }, svg);
      const ty = haut ? fy0 - 6 : fy0 + 8;
      const t = txt(svg, x, ty, String(v.an), { fs: 9, anchor: 'middle', mono: true,
        fill: v.an <= annee ? 'var(--ink-soft)' : 'var(--rule)' });
      // une étiquette de bord ne doit pas sortir du cadre
      const demi = 11;
      if (x - demi < 2) t.setAttribute('text-anchor', 'start'), t.setAttribute('x', 2);
      if (x + demi > W - 2) t.setAttribute('text-anchor', 'end'), t.setAttribute('x', W - 2);
    });

    // le curseur
    const cx = X(annee);
    mk('line', { x1: cx, y1: fy0 - 12, x2: cx, y2: fy1 + 3, stroke: 'var(--ink)', 'stroke-width': 1.6 }, svg);
    const bw = 34, bx2 = Math.max(2, Math.min(W - bw - 2, cx - bw / 2));
    mk('rect', { x: bx2, y: fy1 + 4, width: bw, height: 13, rx: 3.5, fill: 'var(--ink)' }, svg);
    txt(svg, bx2 + bw / 2, fy1 + 13.5, String(annee),
      { fs: 9.5, anchor: 'middle', mono: true, bold: true, fill: 'var(--paper)' });

    // cliquer la frise change l'année
    const zone = mk('rect', { x: fx0, y: fy0 - 14, width: fx1 - fx0, height: fy1 - fy0 + 18,
      fill: 'transparent', cursor: 'crosshair' }, svg);
    zone.addEventListener('click', (e) => {
      const r = svg.getBoundingClientRect();
      const px2 = ((e.clientX - r.left) / r.width) * W;
      an.set(Math.round(AN_MIN + ((px2 - fx0) / (fx1 - fx0)) * (AN_MAX - AN_MIN)));
      an.set(Math.max(AN_MIN, Math.min(AN_MAX, an.value)));
      dessine();
    });

    if (regle) { regle.remove(); regle = null; }
  }

  lab.onResize(dessine);
  dessine();
}
