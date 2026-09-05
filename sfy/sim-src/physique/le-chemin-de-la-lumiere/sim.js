// Le chemin de la lumière — le jeu, et le bac à sable
//
// Un jeu, et c'est assumé — mais rien n'y est truqué. Chaque rebond est
// d′ = d − 2(d·n)n, chaque traversée est sin i = n sin r, et si la lumière reste
// prisonnière du verre c'est parce que la formule n'a plus de solution, pas
// parce qu'on l'a décidé. Le moteur est dans optique.js, il ne connaît pas le
// DOM, et `npm run test:optique` le confronte aux lois du cours.
//
// Deux modes, et le second n'est pas un supplément :
//
//   LE JEU          douze casse-tête, chacun avec sa leçon et sa solution
//                   vérifiée. On y apprend ce que fait chaque pièce.
//   LE BAC À SABLE  un grand plateau, tout le matériel, et les montages du
//                   cours prêts à poser : la chambre noire, l'image d'une
//                   lentille, la fibre optique, les ombres d'une ampoule.
//                   Ici, la simulation MESURE : OA, OA′ et γ sont lus sur les
//                   rayons, et la relation de conjugaison n'est affichée qu'en
//                   face, pour être comparée. Elle ne sert jamais à produire la
//                   mesure — sinon il n'y aurait rien à vérifier.
//
// Ce qui en fait une leçon et non un joli casse-tête tient à deux cases :
// « les angles », qui affiche i et r à chaque contact, et « le verre disperse »,
// qui gèle l'indice et casse tous les niveaux de couleur — le §4-3 du cours en
// une case à cocher.
//
// Le plateau est sombre dans les deux thèmes, et ce n'est pas une coquetterie :
// un faisceau ne se voit pas sur du papier blanc.

import {
  tracer, cheminOptique, cssMelange, cssDe, MELANGES, MILIEUX, mesurerImage,
  segmentDe, polygoneDe, trianglePrisme, depuisDeg, arcDe, RAD, lambdaDe,
} from './optique.js';
import { NIVEAUX, PLATEAU, TAILLES, PAS, poser, parId } from './niveaux.js';
import {
  PLATEAU_SABLE, TAILLES_SABLE, NOMS_SABLE, TIROIR_SABLE, MONTAGES, montageParId,
} from './montages.js';
import { ico } from './icones.js';

const NS = 'http://www.w3.org/2000/svg';
const CLE_RESOLUS = 'sfy-lumiere-resolus';

/* ── Le plateau prend toute la place ────────────────────────
   Le tiroir des pièces était une bande DANS le plateau, et à deux modes et
   quatorze pièces il n'y tenait plus : la bande et le bandeau mangeaient un
   tiers de la hauteur, donc un tiers de la largeur utile — la scène est bien
   plus large que haute, et tout y est mis à l'échelle ensemble. Le tiroir est
   passé dans le panneau, où les icônes le rendent plus lisible, et le plateau
   a gagné près d'un tiers.
   Reste un bandeau d'une ligne, qui ne recouvre jamais le plateau : la
   première version posait l'indice EN HAUT et il cachait la source, le seul
   endroit qu'il ne fallait pas cacher. */
const VUES = {
  jeu: { w: PLATEAU.w, h: 114, bandeau: 102, bandeauH: 11 },
  sable: { w: PLATEAU_SABLE.w, h: 150, bandeau: PLATEAU_SABLE.h + 2, bandeauH: 11 },
};

/* Les sept couleurs qui ont un nom, plus la radiation qu'on règle. Une source
   du jeu porte des raies nommées ; un laser du bac à sable porte UNE longueur
   d'onde, et c'est ce qu'est un laser. */
const COULEURS = [
  { v: 'blanc', nom: 'blanc', bandes: ['r', 'v', 'b'] },
  { v: 'rouge', nom: 'rouge', bandes: ['r'] },
  { v: 'vert', nom: 'vert', bandes: ['v'] },
  { v: 'bleu', nom: 'bleu', bandes: ['b'] },
  { v: 'jaune', nom: 'jaune (rouge + vert)', bandes: ['r', 'v'] },
  { v: 'cyan', nom: 'cyan (vert + bleu)', bandes: ['v', 'b'] },
  { v: 'magenta', nom: 'magenta (rouge + bleu)', bandes: ['r', 'b'] },
  { v: 'mono', nom: 'une seule radiation (λ réglable)', bandes: null },
];
const couleurDe = (bandes) => {
  if (!bandes || !bandes.length) return 'blanc';
  if (bandes.some((b) => typeof b === 'number')) return 'mono';
  const cle = ['r', 'v', 'b'].filter((c) => bandes.includes(c)).join('');
  return ({ rvb: 'blanc', r: 'rouge', v: 'vert', b: 'bleu',
    rv: 'jaune', vb: 'cyan', rb: 'magenta' })[cle] || 'blanc';
};
const EMET = new Set(['laser', 'ampoule', 'objet', 'source']);
const AVEC_LONGUEUR = new Set(['miroir', 'ecran', 'diaphragme', 'lentille', 'filtre', 'separateur']);

export function mount(lab) {
  const { make, fr } = lab;

  /* ── état ──────────────────────────────────────────────────────────── */
  let mode = 'jeu';
  let niv = NIVEAUX[0];
  let montage = MONTAGES[0];
  let poses = [];                            // les pièces posées par le joueur
  let choisie = -1;
  let sortie = null;
  let aideVue = false;
  let stock = [];
  let resolus = new Set();
  try { resolus = new Set(JSON.parse(localStorage.getItem(CLE_RESOLUS) || '[]')); } catch { /* première fois */ }

  const VUE = () => VUES[mode];
  const BORD = () => (mode === 'jeu' ? PLATEAU : PLATEAU_SABLE);
  const fixes = () => (mode === 'jeu' ? niv.fixe : []);
  const laPiece = () => (choisie >= 0 ? poses[choisie] : null);

  /* ── panneau ───────────────────────────────────────────────────────── */
  lab.group('Le mode');
  lab.select({
    label: 'Ce qu’on fait',
    options: [{ value: 'jeu', label: 'Le jeu — douze casse-tête' },
      { value: 'sable', label: 'Le bac à sable — tout le matériel' }],
    value: 'jeu',
    onChange: (v) => { mode = v; if (v === 'jeu') charger(niv); else charge(montage); },
  });

  const gJeu = lab.group('Le niveau');
  const choix = lab.select({
    label: 'Choisir',
    options: NIVEAUX.map((n, i) => ({ value: n.id, label: (i + 1) + '. ' + n.nom })),
    value: niv.id,
    onChange: (id) => charger(parId(id)),
  });
  const btJeu = lab.buttons([
    { label: 'Un indice', onClick: () => { aideVue = !aideVue; peindre(); } },
    { label: 'Montrer une solution', onClick: montrerSolution },
    { label: 'Niveau suivant', onClick: suivant },
  ]);

  const gSable = lab.group('Le montage');
  const choixM = lab.select({
    label: 'Charger',
    options: MONTAGES.map((m) => ({ value: m.id, label: m.nom })),
    value: montage.id,
    onChange: (id) => charge(montageParId(id)),
  });
  const btSable = lab.buttons([{ label: 'Vider le plateau', onClick: () => { poses = []; choisie = -1; refaire(); } }]);

  /* Un seul tiroir pour les deux modes : le jeu n'en montre que ce que le
     niveau autorise, avec le compte restant. Deux listes auraient fini par
     diverger, et l'icône est de toute façon la même pièce. */
  const gAjout = lab.group('Le matériel');
  const btAjout = lab.buttons(TIROIR_SABLE.map((t) => ({
    label: NOMS_SABLE[t], onClick: () => ajouter(t),
  })));
  btAjout.forEach((b, i) => {
    const t = TIROIR_SABLE[i];
    b.dataset.type = t;
    b.style.cssText = 'display:inline-flex;align-items:center;gap:6px;text-transform:none;'
      + 'letter-spacing:.02em;font-size:11.5px;padding:0 11px';
    b.innerHTML = ico(t, 15) + '<span>' + NOMS_SABLE[t] + '</span>'
      + '<b class="cl-n" style="font-weight:600;opacity:.7"></b>';
    b.setAttribute('aria-label', NOMS_SABLE[t]);   // le nom, l'icône étant muette
  });

  const gPiece = lab.group('La pièce choisie');
  /* Une ligne qui dit CE QU'ON règle : sans elle, six curseurs flottent sans
     qu'on sache à quoi ils appartiennent. */
  const titrePiece = (() => {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;align-items:center;gap:7px;margin:-2px 0 9px;'
      + 'font-size:12.5px;color:var(--ink-soft)';
    gPiece.parentNode.insertBefore(d, gPiece.nextSibling);
    return d;
  })();
  const sAngle = lab.slider({ label: 'Angle', min: 0, max: 359, step: 1, value: 0, unit: '°', dec: 0,
    onInput: (v) => majPiece('angle', v) });
  const selCouleur = lab.select({ label: 'Couleur de la lumière',
    options: COULEURS.map((c) => ({ value: c.v, label: c.nom })), value: 'blanc',
    onChange: (v) => {
      const c = COULEURS.find((k) => k.v === v);
      majPiece('bandes', c.bandes ? c.bandes.slice() : [sLambda.value]);
      majPanneau();
    } });
  const sLambda = lab.slider({ label: 'Longueur d’onde λ', min: 400, max: 700, step: 1, value: 633,
    unit: 'nm', dec: 0, onInput: (v) => majPiece('bandes', [v]) });
  /* Le signe de f n'est pas un détail de réglage : c'est ce qui distingue une
     lentille qui rassemble d'une lentille qui écarte. Un curseur qui passerait
     par zéro n'aurait aucun sens physique — alors le signe est un choix, et la
     focale une grandeur. */
  const selLentille = lab.select({ label: 'Lentille',
    options: [{ value: 'c', label: 'convergente (f > 0)' },
      { value: 'd', label: 'divergente (f < 0)' }],
    value: 'c',
    onChange: () => majPiece('f', (selLentille.value === 'd' ? -1 : 1) * Math.abs(sF.value)) });
  const sF = lab.slider({ label: 'Distance focale |f|', min: 12, max: 90, step: 1, value: 34, unit: 'u',
    dec: 0, onInput: (v) => majPiece('f', (selLentille.value === 'd' ? -1 : 1) * v) });
  const selCourbure = lab.select({ label: 'Miroir courbe',
    options: [{ value: 'c', label: 'concave (il fait converger)' },
      { value: 'x', label: 'convexe (il fait diverger)' }],
    value: 'c',
    onChange: () => majPiece('R', (selCourbure.value === 'x' ? -1 : 1) * Math.abs(sR.value)) });
  const sR = lab.slider({ label: 'Rayon de courbure |R|', min: 30, max: 200, step: 2, value: 90,
    unit: 'u', dec: 0, onInput: (v) => majPiece('R', (selCourbure.value === 'x' ? -1 : 1) * v) });
  const sOuv = lab.slider({ label: 'Ouverture du miroir', min: 12, max: 110, step: 2, value: 46,
    unit: 'u', dec: 0, onInput: (v) => majPiece('ouverture', v) });
  const sTrou = lab.slider({ label: 'Largeur du trou', min: 0.6, max: 20, step: 0.2, value: 2, unit: 'u',
    dec: 1, onInput: (v) => majPiece('trou', v) });
  const sHaut = lab.slider({ label: 'Hauteur de l’objet', min: 8, max: 60, step: 2, value: 26, unit: 'u',
    dec: 0, onInput: (v) => majPiece('h', v) });
  const sLong = lab.slider({ label: 'Longueur', min: 10, max: 140, step: 2, value: 30, unit: 'u',
    dec: 0, onInput: (v) => majPiece('longueur', v) });
  const btPiece = lab.buttons([{ label: 'Retirer la pièce', onClick: () => {
    if (choisie >= 0) { poses.splice(choisie, 1); choisie = -1; refaire(); }
  } }]);

  lab.group('Ce qu’on regarde');
  const vNormales = lab.check({ label: 'Les normales', value: false, onChange: peindre });
  const vAngles = lab.check({ label: 'Les angles i et r', value: false, onChange: peindre });
  const vRayons = lab.check({ label: 'Les rayons de construction', value: true, onChange: refaire });
  const verre = lab.select({
    label: 'Le verre des prismes',
    options: ['crown', 'flint', 'lourd'].map((k) => ({ value: k, label: MILIEUX[k].nom })),
    value: 'crown',
    onChange: refaire,
  });
  const vDisperse = lab.check({ label: 'Le verre disperse (B ≠ 0)', value: true, onChange: refaire });

  const rCibles = lab.readout({ label: 'Billes allumées', hi: true, format: (v) => v });
  const rRebonds = lab.readout({ label: 'Réflexions', dec: 0 });
  const rChemin = lab.readout({ label: 'Chemin optique Σn·L', unit: 'u', dec: 1 });
  const rRayons = lab.readout({ label: 'Segments tracés', dec: 0 });
  const rOA = lab.readout({ label: 'OA', dec: 1, format: (v) => v });
  const rOAp = lab.readout({ label: 'OA′ mesuré', dec: 1, hi: true, format: (v) => v });
  const rGamma = lab.readout({ label: 'γ = A′B′/AB', dec: 3, format: (v) => v });
  const rConj = lab.readout({ label: '1/OA′ − 1/OA', dec: 4, format: (v) => v });
  const rF = lab.readout({ label: '1/f', dec: 4, format: (v) => v });

  /* ── la scène ──────────────────────────────────────────────────────── */
  /* Le SVG est fabriqué ici et non par lab.svg() pour une seule raison : la
     boîte de vue change avec le mode, et lab.svg() la refixe à chaque
     redimensionnement. Tout le reste passe par le banc. */
  const svg = make('svg', { preserveAspectRatio: 'xMidYMid meet' }, lab.stage);
  svg.style.touchAction = 'none';
  svg.style.userSelect = 'none';
  svg.style.isolation = 'isolate';
  /* Déclarée avant `ajuster`, qui est donnée à l'observateur de taille : une
     `const` définie plus bas serait dans sa zone morte si l'observateur tirait
     avant la fin du montage. */
  let decoupe = null;
  function ajuster() {
    const { w, h } = lab.size();
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    svg.setAttribute('viewBox', '0 0 ' + VUE().w + ' ' + VUE().h);
    if (decoupe) {
      decoupe.setAttribute('width', VUE().w);
      decoupe.setAttribute('height', BORD().h);
    }
  }
  lab.onResize(ajuster);

  const defs = make('defs', {}, svg);
  defs.innerHTML =
    '<linearGradient id="cl-fond" x1="0" y1="0" x2=".35" y2="1">'
    + '<stop offset="0" stop-color="#141d31"/><stop offset="1" stop-color="#070a12"/></linearGradient>'
    + '<linearGradient id="cl-verre" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0" stop-color="#e6f0ff" stop-opacity=".26"/>'
    + '<stop offset="1" stop-color="#8fb6ff" stop-opacity=".10"/></linearGradient>'
    + '<linearGradient id="cl-eau" x1="0" y1="0" x2="1" y2="0">'
    + '<stop offset="0" stop-color="#57b6ff" stop-opacity=".30"/>'
    + '<stop offset=".5" stop-color="#a8e4ff" stop-opacity=".12"/>'
    + '<stop offset="1" stop-color="#57b6ff" stop-opacity=".30"/></linearGradient>'
    + '<linearGradient id="cl-miroir" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0" stop-color="#f4f8ff"/><stop offset=".5" stop-color="#9fb0cc"/>'
    + '<stop offset="1" stop-color="#5a6880"/></linearGradient>'
    /* Tout ce qui est calculé est coupé au bord du plateau. Une image virtuelle
       tombe volontiers à vingt unités à gauche de la scène, et le SVG est plus
       large que sa vue : sans découpe, le repère A′B′ se dessinait dans la marge
       de la page, hors du cadre, où il n'a plus rien à repérer. Le nombre, lui,
       reste dans le panneau : rien n'est perdu, seulement pas dessiné. */
    + '<clipPath id="cl-plateau"><rect id="cl-plateau-r" x="0" y="0" width="10" height="10"/></clipPath>';
  decoupe = defs.querySelector('#cl-plateau-r');

  const gFond = make('g', { style: 'pointer-events:none' }, svg);
  const dansPlateau = { 'clip-path': 'url(#cl-plateau)' };
  const gRais = make('g', { style: 'mix-blend-mode:screen;pointer-events:none', ...dansPlateau }, svg);
  const gTaches = make('g', { style: 'mix-blend-mode:screen;pointer-events:none', ...dansPlateau }, svg);
  const gEtincelles = make('g', { style: 'mix-blend-mode:screen;pointer-events:none', ...dansPlateau }, svg);
  const gPieces = make('g', dansPlateau, svg);
  const gCibles = make('g', { style: 'pointer-events:none', ...dansPlateau }, svg);
  const gNotes = make('g', { style: 'pointer-events:none', ...dansPlateau }, svg);
  const gCadran = make('g', dansPlateau, svg);
  const gHaut = make('g', { style: 'pointer-events:none' }, svg);

  const T = (parent, x, y, txt, o = {}) => {
    const n = make('text', {
      x, y, 'text-anchor': o.anchor || 'middle',
      'font-size': o.size || 3.4, fill: o.fill || '#98a6c2',
      'font-family': o.mono === false ? 'inherit' : 'var(--mono, ui-monospace, monospace)',
      'letter-spacing': o.track || 0, opacity: o.opacity != null ? o.opacity : 1,
      style: 'pointer-events:none',
    }, parent);
    n.textContent = txt;
    return n;
  };
  const vide = (g) => { while (g.firstChild) g.removeChild(g.firstChild); };
  const dL = (a, b) => 'M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1];

  /* ── le fond ───────────────────────────────────────────────────────────
     Refait seulement au changement de mode : sa trame fait un millier de
     rectangles, et les refaire à chaque image du glissement rendait le plateau
     poisseux. */
  let cadreGagne = null;
  function peindreFond() {
    vide(gFond);
    const B = BORD();
    make('rect', { x: 0, y: 0, width: VUE().w, height: B.h, rx: 2, fill: 'url(#cl-fond)' }, gFond);
    const g = make('g', { opacity: .45 }, gFond);
    const pas = PAS.xy * 2;
    for (let x = pas; x < B.w; x += pas) {
      for (let y = pas; y < B.h; y += pas) {
        make('rect', { x: x - .17, y: y - .17, width: .34, height: .34, fill: '#5b6d94' }, g);
      }
    }
    make('rect', { x: .4, y: .4, width: VUE().w - .8, height: B.h - .8, rx: 2,
      fill: 'none', stroke: '#2c3852', 'stroke-width': .5 }, gFond);
    cadreGagne = make('rect', { x: .4, y: .4, width: VUE().w - .8, height: B.h - .8,
      rx: 2, fill: 'none', stroke: '#ffd23b', 'stroke-width': .8, opacity: 0 }, gFond);
  }

  /* ── charger ───────────────────────────────────────────────────────── */
  function charger(n) {
    mode = 'jeu'; niv = n;
    poses = [];
    stock = Object.entries(niv.tiroir || {}).map(([type, v]) =>
      (typeof v === 'number' ? { type, n: v } : { type, ...v }));
    choisie = -1; aideVue = false;
    verre.set(niv.verre || 'crown');
    choix.set(niv.id);
    lab.clock.reset();
    ajuster(); peindreFond(); majPanneau(); refaire();
  }
  function charge(m) {
    mode = 'sable'; montage = m;
    poses = m.pieces.map((p) => ({ ...p }));
    choisie = -1; aideVue = false;
    choixM.set(m.id);
    lab.clock.reset();
    ajuster(); peindreFond(); majPanneau(); refaire();
  }
  lab.onReset(() => {
    if (mode === 'jeu') { poses = []; } else { poses = montage.pieces.map((p) => ({ ...p })); }
    choisie = -1; refaire();
  });

  const reste = (type) => {
    const s = stock.find((x) => x.type === type);
    return s ? s.n - poses.filter((p) => p.type === type).length : 0;
  };
  function suivant() { charger(NIVEAUX[(NIVEAUX.indexOf(niv) + 1) % NIVEAUX.length]); }
  function montrerSolution() {
    if (!niv.solution || !niv.solution.length) return;
    if (niv.solutionVerre) verre.set(niv.solutionVerre);
    poses = niv.solution.map((p) => ({ ...TAILLES[p.type], ...p }));
    choisie = -1; refaire();
  }
  /* Le tiroir sert les deux modes. Dans le jeu il respecte le stock du niveau
     et les tailles du jeu ; dans le bac à sable il pose la pièce au milieu, en
     plus grand, puisque le plateau l'est. */
  /* Où poser la pièce qui arrive. Toujours au même endroit, la deuxième se
     cache sous la première : on croit que le bouton n’a rien fait, et le clic
     suivant attrape la mauvaise. On cherche donc la première place libre en
     spirale carrée autour du point de dépôt. */
  function placeLibre(x0, y0, B) {
    const loin = (x, y) => poses.every((p) => Math.hypot(p.x - x, p.y - y) > 9);
    for (let r = 0; r <= 6; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (r && Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          // douze : un multiple du pas, la place trouvée reste libre après accrochage
          const x = x0 + dx * 12, y = y0 + dy * 12;
          if (x < B.x + 8 || x > B.x + B.w - 8 || y < B.y + 8 || y > B.y + B.h - 8) continue;
          if (loin(x, y)) return { x, y };
        }
      }
    }
    return { x: x0, y: y0 };
  }
  function ajouter(type) {
    const B = BORD();
    if (mode === 'jeu') {
      if (reste(type) <= 0) return;
      const st = stock.find((x) => x.type === type) || {};
      /* `angle: 0` d'abord : TAILLES ne le porte pas, et une pièce sans angle
         part en NaN dès le premier polygone — le prisme devient invisible sans
         un mot d'erreur. Le mettre en tête laisse TAILLES le redéfinir. */
      const neuve = { angle: 0, ...TAILLES[type], ...st, type,
        ...placeLibre(30, Math.round(B.h / 2), B) };
      delete neuve.n;
      poses.push(poser(neuve));
    } else {
      poses.push(poser({ angle: 0, ...TAILLES_SABLE[type], type,
        ...placeLibre(Math.round(B.w / 2), Math.round(B.h / 2), B) }));
    }
    choisie = poses.length - 1;
    refaire();
  }
  function majPiece(champ, v) {
    const p = laPiece();
    if (!p) return;
    p[champ] = v;
    refaire();
  }

  /* Le panneau suit le mode et la pièce choisie : montrer une focale quand un
     miroir est sélectionné, c'est promettre un réglage qui n'existe pas. */
  /* Le panneau suit le mode et la pièce choisie. Montrer une focale quand un
     miroir plan est sélectionné, c'est promettre un réglage qui n'existe pas. */
  function majPanneau() {
    const jeu = mode === 'jeu';
    gJeu.hidden = !jeu; btJeu[0].parentNode.hidden = !jeu; choix.show(jeu);
    gSable.hidden = jeu; btSable[0].parentNode.hidden = jeu; choixM.show(!jeu);

    // le tiroir : seules les pièces permises, avec le compte quand il y en a un
    let visibles = 0;
    btAjout.forEach((b) => {
      const t = b.dataset.type;
      const permis = jeu ? !!stock.find((x) => x.type === t) : true;
      b.hidden = !permis;
      if (!permis) return;
      visibles++;
      const n = jeu ? reste(t) : null;
      b.querySelector('.cl-n').textContent = n == null ? '' : '\u00d7' + n;
      // le compte fait partie du nom : « ×2 » lu tout seul ne dit rien
      b.setAttribute('aria-label', NOMS_SABLE[t]
        + (n == null ? '' : ', ' + n + ' restant' + (n > 1 ? 's' : '')));
      b.disabled = n === 0;
      b.style.opacity = n === 0 ? '.35' : '1';
      b.style.cursor = n === 0 ? 'not-allowed' : 'pointer';
    });
    gAjout.hidden = !visibles;
    btAjout[0].parentNode.hidden = !visibles;

    const p = laPiece(), t = p ? p.type : null;
    gPiece.hidden = !p; btPiece[0].parentNode.hidden = !p; titrePiece.hidden = !p;
    if (p) titrePiece.innerHTML = ico(t, 17) + '<span>' + (NOMS_SABLE[t] || t) + '</span>';

    sAngle.show(!!p && t !== 'oeil');
    selCouleur.show(EMET.has(t));
    sLambda.show(EMET.has(t) && couleurDe(p && p.bandes) === 'mono');
    selLentille.show(t === 'lentille');
    sF.show(t === 'lentille');
    selCourbure.show(t === 'miroirc');
    sR.show(t === 'miroirc');
    sOuv.show(t === 'miroirc');
    sTrou.show(t === 'diaphragme');
    sHaut.show(t === 'objet');
    sLong.show(!!p && AVEC_LONGUEUR.has(t));

    if (p) {
      sAngle.set(p.angle || 0);
      if (EMET.has(t)) {
        selCouleur.set(couleurDe(p.bandes));
        const mono = (p.bandes || []).find((b) => typeof b === 'number');
        if (mono != null) sLambda.set(mono);
      }
      if (t === 'lentille') { selLentille.set(p.f < 0 ? 'd' : 'c'); sF.set(Math.abs(p.f)); }
      if (t === 'miroirc') {
        selCourbure.set(p.R < 0 ? 'x' : 'c');
        sR.set(Math.abs(p.R)); sOuv.set(p.ouverture || 46);
      }
      if (t === 'diaphragme') sTrou.set(p.trou);
      if (t === 'objet') sHaut.set(p.h);
      if (p.longueur) sLong.set(p.longueur);
    }

    rCibles.row.hidden = !jeu; rRebonds.row.hidden = !jeu; rChemin.row.hidden = !jeu;
    rRayons.row.hidden = jeu;
    const m = !jeu && mesure();
    [rOA, rOAp, rGamma, rConj, rF].forEach((r) => { r.row.hidden = jeu || !m; });
  }

  /* ── le calcul ─────────────────────────────────────────────────────── */
  /* Le verre est un réglage global : on le pose SUR les pièces, on n'en fait pas
     des copies. La première version recopiait chaque pièce à chaque tracé, et
     `mesurerImage` comparait alors l'objet de la scène à celui que les rayons
     avaient mémorisé — deux copies distinctes, jamais égales. L'image ne se
     mesurait donc jamais, et le panneau annonçait « à l'infini » avec aplomb.
     Une identité perdue ne se voit pas : elle rend seulement tout vide. */
  function appliquerVerre() {
    for (const p of poses) {
      if (p.type === 'prisme' || p.type === 'lentille') p.milieu = verre.value;
    }
  }
  let tracees = [];
  function scene() {
    appliquerVerre();
    tracees = fixes().concat(poses);
    return { bord: BORD(), pieces: tracees };
  }
  const objetEtLentille = () => [
    tracees.find((p) => p.type === 'objet'),
    tracees.find((p) => p.type === 'lentille'),
  ];
  function mesure() {
    if (mode !== 'sable' || !sortie) return null;
    const [o, l] = objetEtLentille();
    if (!o || !l) return null;
    return mesurerImage(sortie, o, l);
  }

  function refaire() {
    const sable = mode === 'sable';
    sortie = tracer(scene(), {
      disperse: vDisperse.value,
      maxSegments: sable ? 3400 : 900,
      maxRebonds: sable ? 40 : 60,
      // sans les rayons de construction, un sténopé ne montre qu'un point : le
      // trou est trop petit pour qu'un éventail uniforme le traverse
      viser: vRayons.value,
    });
    if (sable) {
      rRayons.set(sortie.segments.length);
      const m = mesure();
      const f1 = (v, d) => (v == null || !isFinite(v) ? '—' : fr(v, d));
      rOA.set(m ? f1(m.OA, 1) + ' u' : '—');
      rOAp.set(m ? (m.OAp == null ? 'à l’infini' : f1(m.OAp, 1) + ' u') : '—');
      rGamma.set(m && m.gamma != null ? f1(m.gamma, 3) : '—');
      rConj.set(m && m.conjugaison != null ? f1(m.conjugaison, 4) : '—');
      rF.set(m ? f1(m.attendu, 4) : '—');
    } else {
      const n = sortie.etats.filter((e) => e.ok).length;
      rCibles.set(n + ' / ' + sortie.etats.length);
      rRebonds.set(sortie.contacts.filter((c) => c.type === 'miroir' || c.type === 'totale').length);
      rChemin.set(cheminOptique(sortie.segments, vDisperse.value));
      if (sortie.gagne && !resolus.has(niv.id)) {
        resolus.add(niv.id);
        try { localStorage.setItem(CLE_RESOLUS, JSON.stringify([...resolus])); } catch { /* tant pis */ }
      }
    }
    majPanneau();
    peindre();
  }

  /* ── dessin ────────────────────────────────────────────────────────── */
  let etincelles = [], pulses = [];

  function peindreRais() {
    vide(gRais); vide(gTaches); vide(gEtincelles);
    etincelles = []; pulses = [];
    if (!sortie) return;
    // Un plateau chargé de deux mille segments ne peut pas se redessiner en
    // quatre passes à chaque image : on allège, et le faisceau reste lisible.
    const dense = sortie.segments.length > 320;
    for (const s of sortie.segments) {
      const c = cssMelange(s.cles);
      /* Un eventail se dessine fin, un laser epais. Cent rayons partis d'un
         objet, chacun avec le halo d'un laser, font un mur de lumiere ou l'on
         ne distingue plus le trajet d'aucun -- et c'est le trajet qu'on vient
         regarder. */
      const large = !s.src || s.src.piece.type === 'laser' || s.src.piece.type === 'source';
      const o = Math.max(.1, Math.min(1, s.i)) * (dense ? .5 : 1) * (large ? 1 : .5);
      const d = dL(s.a, s.b);
      if (large && !dense) {
        make('path', { d, stroke: c, 'stroke-width': 3.4, opacity: .09 * o, fill: 'none', 'stroke-linecap': 'round' }, gRais);
        make('path', { d, stroke: c, 'stroke-width': 1.5, opacity: .22 * o, fill: 'none', 'stroke-linecap': 'round' }, gRais);
      } else if (large) {
        make('path', { d, stroke: c, 'stroke-width': 1.2, opacity: .16 * o, fill: 'none' }, gRais);
      }
      make('path', { d, stroke: c, 'stroke-width': large ? (dense ? .3 : .55) : .22,
        opacity: (large ? (dense ? .7 : .95) : .5) * o, fill: 'none', 'stroke-linecap': 'round' }, gRais);
      if (large && !dense && o > .55) make('path', { d, stroke: '#fff', 'stroke-width': .17, opacity: .55 * o, fill: 'none' }, gRais);

      const L = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
      if (large && !dense && etincelles.length < 70 && L > 8 && o > .3) {
        const n = Math.min(3, Math.floor(L / 26) + 1);
        for (let k = 0; k < n; k++) {
          const e = make('circle', { r: .45, fill: c, opacity: .8 * o }, gEtincelles);
          etincelles.push({ el: e, a: s.a, b: s.b, ph: (k + Math.random()) / n });
        }
      }
    }
    /* Les taches sur l'écran : chacune est un rayon qui est arrivé là. Elles
       s'additionnent en mode `screen`, si bien que l'image se forme d'elle-même
       là où beaucoup de rayons tombent — personne ne la dessine. */
    for (const e of sortie.ecrans || []) {
      for (const t of e.taches) {
        make('circle', { cx: t.p[0], cy: t.p[1], r: 2.2, fill: cssMelange(t.cles),
          opacity: .13 * Math.min(1, t.i) }, gTaches);
        make('circle', { cx: t.p[0], cy: t.p[1], r: .8, fill: cssMelange(t.cles),
          opacity: .8 * Math.min(1, t.i) }, gTaches);
      }
    }
  }

  function peindrePiece(p, parent, mini) {
    const g = make('g', {}, parent);
    const s = segmentDe(p.x, p.y, p.angle || 0, p.longueur || 0);
    const dir = depuisDeg(p.angle || 0), le = [-dir[1], dir[0]];

    if (p.type === 'source' || p.type === 'laser') {
      const c = cssMelange(p.bandes || ['r', 'v', 'b']);
      make('circle', { cx: p.x, cy: p.y, r: 5.8, fill: c, opacity: .16 }, g);
      if (p.type === 'laser') {
        // un boîtier, parce qu'un laser est un objet et non un point
        const pts = polygoneDe(p.x, p.y, p.angle || 0, [[-4, -2.4], [1.6, -2.4], [1.6, 2.4], [-4, 2.4]]);
        make('polygon', { points: pts.map((q) => q.join(',')).join(' '), fill: '#2a3550' }, g);
      }
      make('circle', { cx: p.x, cy: p.y, r: 3, fill: c, opacity: .95 }, g);
      make('circle', { cx: p.x, cy: p.y, r: 1.3, fill: '#fff', opacity: .9 }, g);
      make('path', { d: dL([p.x, p.y], [p.x + dir[0] * 7, p.y + dir[1] * 7]),
        stroke: '#f6efd8', 'stroke-width': .9, opacity: .5 }, g);
      return g;
    }
    if (p.type === 'ampoule') {
      const c = cssMelange(p.bandes || ['r', 'v', 'b']);
      make('circle', { cx: p.x, cy: p.y, r: 9, fill: c, opacity: .10 }, g);
      make('circle', { cx: p.x, cy: p.y, r: 5, fill: c, opacity: .2 }, g);
      make('circle', { cx: p.x, cy: p.y, r: 3.4, fill: 'none', stroke: '#ffe9b5', 'stroke-width': .5 }, g);
      make('circle', { cx: p.x, cy: p.y, r: 1.5, fill: '#fff8e0' }, g);
      // le culot
      make('rect', { x: p.x - 1.6, y: p.y + 3.2, width: 3.2, height: 2.2, rx: .4, fill: '#8b93a8' }, g);
      return g;
    }
    if (p.type === 'objet') {
      // la flèche lumineuse AB du cours : A sur l'axe, B au sommet
      const A = [p.x - le[0] * p.h / 2, p.y - le[1] * p.h / 2];
      const B = [p.x + le[0] * p.h / 2, p.y + le[1] * p.h / 2];
      const c = cssMelange(p.bandes || ['r', 'v', 'b']);
      make('path', { d: dL(A, B), stroke: c, 'stroke-width': 2.6, opacity: .18, 'stroke-linecap': 'round' }, g);
      make('path', { d: dL(A, B), stroke: c, 'stroke-width': .9, opacity: .95 }, g);
      const t1 = [B[0] - le[0] * 3 + dir[0] * 2, B[1] - le[1] * 3 + dir[1] * 2];
      const t2 = [B[0] - le[0] * 3 - dir[0] * 2, B[1] - le[1] * 3 - dir[1] * 2];
      make('polygon', { points: [B, t1, t2].map((q) => q.join(',')).join(' '), fill: c, opacity: .95 }, g);
      if (!mini) {
        T(g, A[0] - le[0] * 3.4, A[1] - le[1] * 3.4 + 1, 'A', { size: 3.2, fill: '#c8d3ea' });
        T(g, B[0] + le[0] * 3.4, B[1] + le[1] * 3.4 + 1, 'B', { size: 3.2, fill: '#c8d3ea' });
      }
      return g;
    }
    if (p.type === 'ecran') {
      make('path', { d: dL(s.a, s.b), stroke: '#c9d3e8', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: .55 }, g);
      // le dos, hachuré : un écran a une face qui reçoit
      for (let k = -Math.floor(p.longueur / 2 / 3); k <= Math.floor(p.longueur / 2 / 3); k++) {
        const q = [p.x + dir[0] * k * 3, p.y + dir[1] * k * 3];
        make('path', { d: dL(q, [q[0] - le[0] * 2.2, q[1] - le[1] * 2.2]),
          stroke: '#5a6884', 'stroke-width': .35 }, g);
      }
      return g;
    }
    if (p.type === 'diaphragme') {
      const h = (p.trou || 2) / 2;
      const c1 = [p.x - dir[0] * h, p.y - dir[1] * h], c2 = [p.x + dir[0] * h, p.y + dir[1] * h];
      make('path', { d: dL(s.a, c1), stroke: '#232c40', 'stroke-width': 3, 'stroke-linecap': 'butt' }, g);
      make('path', { d: dL(c2, s.b), stroke: '#232c40', 'stroke-width': 3, 'stroke-linecap': 'butt' }, g);
      make('path', { d: dL(s.a, c1), stroke: '#4a5875', 'stroke-width': .5 }, g);
      make('path', { d: dL(c2, s.b), stroke: '#4a5875', 'stroke-width': .5 }, g);
      return g;
    }
    if (p.type === 'oeil') {
      const recu = ((sortie && sortie.vus) || []).find((v) => v.oeil === p);
      const c = recu && recu.cles.length ? cssMelange(recu.cles) : '#3a465f';
      make('circle', { cx: p.x, cy: p.y, r: p.r + 3, fill: c, opacity: recu && recu.cles.length ? .18 : 0 }, g);
      make('path', {
        d: 'M' + (p.x - p.r) + ' ' + p.y + 'Q' + p.x + ' ' + (p.y - p.r * .95) + ' ' + (p.x + p.r) + ' ' + p.y
          + 'Q' + p.x + ' ' + (p.y + p.r * .95) + ' ' + (p.x - p.r) + ' ' + p.y + 'Z',
        fill: '#0d1220', stroke: '#c9d3e8', 'stroke-width': .5,
      }, g);
      make('circle', { cx: p.x, cy: p.y, r: p.r * .42, fill: c }, g);
      return g;
    }
    if (p.type === 'mur') {
      make('rect', { x: p.x - p.w / 2, y: p.y - p.h / 2, width: p.w, height: p.h, rx: .8,
        fill: '#212a3e', stroke: '#3a465f', 'stroke-width': .5 }, g);
      for (let y = p.y - p.h / 2 + 3.5; y < p.y + p.h / 2 - 1; y += 4) {
        make('path', { d: dL([p.x - p.w / 2 + .9, y], [p.x + p.w / 2 - .9, y]),
          stroke: '#2f3a52', 'stroke-width': .4 }, g);
      }
      return g;
    }
    if (p.type === 'bloc') {
      const pts = polygoneDe(p.x, p.y, p.angle || 0,
        [[-p.w / 2, -p.h / 2], [p.w / 2, -p.h / 2], [p.w / 2, p.h / 2], [-p.w / 2, p.h / 2]]);
      make('polygon', { points: pts.map((q) => q.join(',')).join(' '),
        fill: p.milieu === 'eau' ? 'url(#cl-eau)' : 'url(#cl-verre)',
        stroke: p.milieu === 'eau' ? '#8fd8ff' : '#dceaff', 'stroke-width': .45 }, g);
      if (!mini) T(g, p.x, p.y - p.h / 2 + 5, p.milieu, { size: 2.6, fill: '#8fd8ff', opacity: .75 });
      return g;
    }
    if (p.type === 'miroir') {
      const u = [le[0] * 1.5, le[1] * 1.5];
      make('path', { d: dL([s.a[0] - u[0], s.a[1] - u[1]], [s.b[0] - u[0], s.b[1] - u[1]]),
        stroke: '#4d5a74', 'stroke-width': 1.4, 'stroke-linecap': 'round' }, g);
      make('path', { d: dL(s.a, s.b), stroke: '#0d1220', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
      make('path', { d: dL(s.a, s.b), stroke: 'url(#cl-miroir)', 'stroke-width': 1.4, 'stroke-linecap': 'round' }, g);
      return g;
    }
    if (p.type === 'miroirc') {
      /* L’arc dessiné est celui du calcul, pas une approximation posée à côté :
         mêmes C, R et ouverture que `arcDe`, donc le trait EST la surface qui
         réfléchit. Un dessin qui s’en écarterait ferait mentir tous les angles
         affichés — et l’aberration de sphéricité, qui se voit à l’œil ici,
         deviendrait indistinguable d’un bug de tracé. */
      const a = arcDe(p);
      const th = Math.acos(a.cosMax), c0 = Math.atan2(a.dirS[1], a.dirS[0]);
      const chemin = (dec) => {
        const rr = a.R + dec;
        const q = (k) => [a.C[0] + Math.cos(c0 + k * th) * rr, a.C[1] + Math.sin(c0 + k * th) * rr];
        const q1 = q(-1), q2 = q(1);
        return 'M' + q1[0] + ' ' + q1[1] + 'A' + rr + ' ' + rr + ' 0 0 1 ' + q2[0] + ' ' + q2[1];
      };
      /* Le dos ne réfléchit pas, et de quel côté il tombe n’est pas décoratif :
         la face utile d’un concave est celle qui regarde C, celle d’un convexe
         est le bombement, à l’opposé. Un dos du mauvais côté recouvre la face
         qui travaille et fait croire à un miroir décalé. */
      make('path', { d: chemin(p.R < 0 ? -1.5 : 1.5), fill: 'none', stroke: '#4d5a74', 'stroke-width': 1.4 }, g);
      make('path', { d: chemin(0), fill: 'none', stroke: '#0d1220', 'stroke-width': 2.4 }, g);
      make('path', { d: chemin(0), fill: 'none', stroke: 'url(#cl-miroir)', 'stroke-width': 1.4 }, g);
      if (!mini) {
        /* L’axe, le centre de courbure et le foyer à mi-chemin : R/2 se VOIT.
           Un miroir convexe met C à quatre-vingt-dix unités DERRIÈRE lui, souvent
           hors du plateau : l’axe est coupé au bord et les repères qui tombent
           dehors ne sont pas dessinés, sinon ils flottent hors du bac à sable et
           ne repèrent plus rien. */
        const B = BORD();
        const dedans = (q) => q[0] >= B.x && q[0] <= B.x + B.w && q[1] >= B.y && q[1] <= B.y + B.h;
        const auBord = (q) => [Math.min(B.x + B.w, Math.max(B.x, q[0])),
          Math.min(B.y + B.h, Math.max(B.y, q[1]))];
        make('path', { d: dL([p.x, p.y], auBord(a.C)), stroke: '#7f8da9', 'stroke-width': .25,
          'stroke-dasharray': '2 2', opacity: .7 }, g);
        if (dedans(a.C)) {
          make('circle', { cx: a.C[0], cy: a.C[1], r: .9, fill: '#7f8da9', opacity: .85 }, g);
          T(g, a.C[0], a.C[1] - 2.8, 'C', { size: 2.7, fill: '#7f8da9' });
        }
        /* Le foyer d’un convexe est VIRTUEL : aucun rayon n’y passe, les
           réfléchis s’en écartent comme s’ils en venaient. Un cercle plein là
           promettrait un point brillant — il est pointillé. */
        const F = [(p.x + a.C[0]) / 2, (p.y + a.C[1]) / 2];
        if (dedans(F)) {
          const virtuel = p.R < 0;
          make('circle', { cx: F[0], cy: F[1], r: 1.2, fill: 'none', stroke: '#ffd23b',
            'stroke-width': .4, opacity: virtuel ? .55 : .85,
            'stroke-dasharray': virtuel ? '1 1' : 'none' }, g);
          T(g, F[0], F[1] - 2.8, virtuel ? 'F virtuel' : 'F',
            { size: 2.7, fill: '#ffd23b', opacity: .9 });
        }
      }
      return g;
    }
    if (p.type === 'separateur') {
      make('path', { d: dL(s.a, s.b), stroke: '#cfe0ff', 'stroke-width': 1.3, opacity: .35 }, g);
      make('path', { d: dL(s.a, s.b), stroke: '#eaf2ff', 'stroke-width': .4, opacity: .9,
        'stroke-dasharray': '1.8 1.2' }, g);
      return g;
    }
    if (p.type === 'filtre') {
      const c = cssMelange(p.bandes || ['r']);
      const u = [le[0] * .95, le[1] * .95];
      const pts = [[s.a[0] + u[0], s.a[1] + u[1]], [s.b[0] + u[0], s.b[1] + u[1]],
        [s.b[0] - u[0], s.b[1] - u[1]], [s.a[0] - u[0], s.a[1] - u[1]]];
      make('polygon', { points: pts.map((q) => q.join(',')).join(' '),
        fill: c, opacity: .32, stroke: c, 'stroke-width': .45 }, g);
      return g;
    }
    if (p.type === 'prisme') {
      const pts = polygoneDe(p.x, p.y, p.angle || 0, trianglePrisme(p.cote));
      make('polygon', { points: pts.map((q) => q.join(',')).join(' '),
        fill: 'url(#cl-verre)', stroke: '#dceaff', 'stroke-width': .55, 'stroke-linejoin': 'round' }, g);
      return g;
    }
    if (p.type === 'lentille') {
      const h = p.longueur / 2;
      const A = [p.x - dir[0] * h, p.y - dir[1] * h], B = [p.x + dir[0] * h, p.y + dir[1] * h];
      const dec = (P, k) => [P[0] + le[0] * k, P[1] + le[1] * k];
      let forme;
      /* L’épaisseur suit l’ouverture : à cinquante unités de haut, un bombement
         de deux unités et demie ne se lit plus — la forme redevient un rectangle
         et ne dit plus si la lentille rassemble ou écarte. */
      const ep = Math.min(4.4, Math.max(2.3, p.longueur * 0.075));
      if ((p.f || 0) >= 0) {
        // biconvexe : deux arcs qui bombent vers l’extérieur
        const e = ep;
        const C1 = dec([p.x, p.y], e), C2 = dec([p.x, p.y], -e);
        forme = 'M' + A[0] + ' ' + A[1] + 'Q' + C1[0] + ' ' + C1[1] + ' ' + B[0] + ' ' + B[1]
          + 'Q' + C2[0] + ' ' + C2[1] + ' ' + A[0] + ' ' + A[1] + 'Z';
      } else {
        /* Biconcave : les faces se creusent vers l’axe, le bord est épais. Une
           lentille divergente dessinée bombée mentirait sur ce qu’elle fait — et
           c’est la seule chose que cette forme ait à dire. */
        const bord = ep, creux = ep - 0.45;
        const A1 = dec(A, bord), B1 = dec(B, bord), B2 = dec(B, -bord), A2 = dec(A, -bord);
        const K1 = dec([p.x, p.y], bord - creux), K2 = dec([p.x, p.y], creux - bord);
        forme = 'M' + A1[0] + ' ' + A1[1] + 'Q' + K1[0] + ' ' + K1[1] + ' ' + B1[0] + ' ' + B1[1]
          + 'L' + B2[0] + ' ' + B2[1] + 'Q' + K2[0] + ' ' + K2[1] + ' ' + A2[0] + ' ' + A2[1] + 'Z';
      }
      make('path', { d: forme, fill: 'url(#cl-verre)', stroke: '#dceaff', 'stroke-width': .5,
        'stroke-linejoin': 'round' }, g);
      if (!mini) {
        /* Les deux foyers, à |f| de part et d’autre sur l’axe. Ceux d’une
           divergente sont pointillés : aucun rayon n’y passe, ils sont virtuels,
           et un cercle plein là promettrait un point lumineux qui n’existe pas. */
        const virtuel = (p.f || 0) < 0;
        [1, -1].forEach((k) => {
          const F = [p.x + le[0] * Math.abs(p.f) * k, p.y + le[1] * Math.abs(p.f) * k];
          make('circle', { cx: F[0], cy: F[1], r: 1, fill: 'none', stroke: '#ffd23b',
            'stroke-width': .35, opacity: virtuel ? .5 : .75,
            'stroke-dasharray': virtuel ? '1 1' : 'none' }, g);
        });
      }
      return g;
    }
    return g;
  }

  function peindrePieces() {
    vide(gPieces);
    fixes().forEach((p) => { if (p.type !== 'cible') peindrePiece(p, gPieces); });
    poses.forEach((p, i) => {
      const g = peindrePiece(p, gPieces);
      g.style.cursor = 'grab';
      if (i === choisie) make('circle', { cx: p.x, cy: p.y, r: .9, fill: '#ffd23b', opacity: .95 }, g);
    });
  }

  function peindreCibles() {
    vide(gCibles);
    pulses = [];
    const etats = (sortie && sortie.etats) || [];
    fixes().filter((p) => p.type === 'cible').forEach((c) => {
      const e = etats.find((k) => k.cible === c) || { ok: false, eu: '', veut: '' };
      const veut = cssMelange(c.bandes);
      const g = make('g', {}, gCibles);
      if (e.ok) {
        const halo = make('circle', { cx: c.x, cy: c.y, r: c.r + 6, fill: veut, opacity: .14 }, g);
        make('circle', { cx: c.x, cy: c.y, r: c.r + 2.6, fill: veut, opacity: .24 }, g);
        make('circle', { cx: c.x, cy: c.y, r: c.r, fill: veut, opacity: .95 }, g);
        make('circle', { cx: c.x, cy: c.y, r: c.r * .42, fill: '#fff', opacity: .85 }, g);
        pulses.push({ el: halo, r0: c.r + 6 });
      } else {
        make('circle', { cx: c.x, cy: c.y, r: c.r, fill: veut, opacity: .09 }, g);
        make('circle', { cx: c.x, cy: c.y, r: c.r, fill: 'none', stroke: veut,
          'stroke-width': .7, opacity: .8, 'stroke-dasharray': '1.7 1.4' }, g);
        // « presque » est une information : on montre ce qui est arrivé
        if (e.eu && e.eu !== e.veut) {
          make('circle', { cx: c.x, cy: c.y, r: c.r * .42, fill: MELANGES[e.eu].css, opacity: .9 }, g);
        }
      }
    });
  }

  function peindreNotes() {
    vide(gNotes);
    if (!sortie) return;

    /* La figure du cours, quand elle a un sens : l'axe optique, les foyers, et
       le point où les rayons se recoupent — mesuré, pas calculé. */
    const m = mesure();
    if (m && m.OAp != null) {
      const O = objetEtLentille()[1];
      const ax = m.axe, la = m.lat;
      const P = (t, u2) => [O.x + ax[0] * t + la[0] * u2, O.y + ax[1] * t + la[1] * u2];
      /* L’axe s’arrête au bord du plateau. Tracé sur trois cents unités comme
         avant, il débordait du bac à sable et courait dans la marge de la page :
         une ligne qui sort du cadre ne repère plus rien. */
      const bornes = (() => {
        const B = BORD();
        let t0 = -300, t1 = 300;
        [[ax[0], O.x, B.x, B.x + B.w], [ax[1], O.y, B.y, B.y + B.h]].forEach(([d, o, lo, hi]) => {
          if (Math.abs(d) < 1e-9) return;
          const a1 = (lo - o) / d, a2 = (hi - o) / d;
          t0 = Math.max(t0, Math.min(a1, a2));
          t1 = Math.min(t1, Math.max(a1, a2));
        });
        return [t0, t1];
      })();
      make('path', { d: dL(P(bornes[0], 0), P(bornes[1], 0)), stroke: '#5f6d8c',
        'stroke-width': .25, 'stroke-dasharray': '2 2', opacity: .8 }, gNotes);
      const f = O.f;
      [[-f, 'F'], [f, 'F′']].forEach(([t, nom]) => {
        const q = P(t, 0);
        make('path', { d: dL([q[0] - la[0] * 1.6, q[1] - la[1] * 1.6], [q[0] + la[0] * 1.6, q[1] + la[1] * 1.6]),
          stroke: '#8fa2c8', 'stroke-width': .4 }, gNotes);
        T(gNotes, q[0] + la[0] * 4, q[1] + la[1] * 4 + 1, nom, { size: 2.8, fill: '#8fa2c8' });
      });
      // A′B′ : le segment mesuré, du pied de l'image à son sommet
      const Ap = P(m.OAp, 0), Bp = m.Bp;
      const B2 = BORD();
      const dedans = (q) => q[0] >= B2.x + 1 && q[0] <= B2.x + B2.w - 1
        && q[1] >= B2.y + 1 && q[1] <= B2.y + B2.h - 1;
      if (dedans(Ap) && dedans(Bp)) {
        make('path', { d: dL(Ap, Bp), stroke: '#ffd23b', 'stroke-width': .7, opacity: .9 }, gNotes);
        make('circle', { cx: Bp[0], cy: Bp[1], r: 1.4, fill: '#ffd23b' }, gNotes);
        T(gNotes, Bp[0] + la[0] * 4, Bp[1] + la[1] * 4 + 1, 'B′', { size: 3, fill: '#ffd23b' });
        T(gNotes, Ap[0], Ap[1] + 4.4, m.reelle ? 'image réelle' : 'image virtuelle',
          { size: 2.6, fill: '#ffd23b', opacity: .85 });
      } else {
        /* L'image existe et elle est mesurée, mais elle tombe hors du plateau —
           une loupe la met volontiers loin derrière l'objet. Plutôt que de la
           dessiner dans la marge de la page, ou de la laisser disparaître sans
           un mot, on le dit au bord, sur l'axe : le nombre est dans le panneau. */
        const bx = Math.min(Math.max(Ap[0], B2.x + 3), B2.x + B2.w - 3);
        const by = Math.min(Math.max(Ap[1], B2.y + 6), B2.y + B2.h - 3);
        const vers = Ap[0] < B2.x ? -1 : 1;
        make('path', { d: dL([bx, by], [bx + vers * 4, by]), stroke: '#ffd23b',
          'stroke-width': .4, opacity: .7, 'stroke-dasharray': '1.4 1' }, gNotes);
        T(gNotes, bx + vers * 3, by - 3,
          (m.reelle ? 'image réelle' : 'image virtuelle') + ' — hors plateau',
          { size: 2.6, fill: '#ffd23b', opacity: .8, anchor: vers < 0 ? 'start' : 'end' });
      }
    }

    if (!vNormales.value && !vAngles.value) return;
    const posees = [];
    for (const c of sortie.contacts) {
      const [x, y] = c.p, n = c.n;
      if (vNormales.value) {
        make('path', { d: dL([x - n[0] * 7, y - n[1] * 7], [x + n[0] * 7, y + n[1] * 7]),
          stroke: '#93a6cc', 'stroke-width': .3, 'stroke-dasharray': '1.2 1', opacity: .85 }, gNotes);
      }
      if (!vAngles.value) continue;
      const txt = c.type === 'totale'
        ? 'i = ' + fr(c.i, 1) + '° > limite'
        : 'i = ' + fr(c.i, 1) + '°  r = ' + fr(c.r, 1) + '°';
      /* L'étiquette se pose LE LONG de la surface : centrée sur le contact,
         elle se fait traverser par les faisceaux qui en partent, et deux
         nombres barrés d'un trait de lumière ne se lisent pas. */
      const lo = [-n[1], n[0]];
      let tx = x + lo[0] * 13, ty = y + lo[1] * 13;
      const B = BORD();
      if (tx < 22 || tx > VUE().w - 22 || ty < 6 || ty > B.h - 4) { tx = x - lo[0] * 13; ty = y - lo[1] * 13; }
      tx = Math.min(Math.max(tx, 22), VUE().w - 22);
      ty = Math.min(Math.max(ty, 6), B.h - 3);
      while (posees.some((q) => Math.abs(q.x - tx) < 30 && Math.abs(q.y - ty) < 3.6)) ty += 4;
      T(gNotes, tx, ty, txt, { size: 2.7, fill: c.type === 'totale' ? '#ffd23b' : '#c2cee8' });
      posees.push({ x: tx, y: ty });
    }
  }

  function peindreCadran() {
    vide(gCadran);
    const p = laPiece();
    if (!p || p.type === 'oeil') return;                 // rien à orienter
    const R = 13, d = depuisDeg(p.angle || 0);
    make('circle', { cx: p.x, cy: p.y, r: R, fill: 'none', stroke: '#ffd23b',
      'stroke-width': .3, opacity: .4, 'stroke-dasharray': '1 1.7' }, gCadran);
    make('path', { d: dL([p.x - d[0] * R, p.y - d[1] * R], [p.x + d[0] * R, p.y + d[1] * R]),
      stroke: '#ffd23b', 'stroke-width': .28, opacity: .3 }, gCadran);
    const b = make('circle', { cx: p.x + d[0] * R, cy: p.y + d[1] * R, r: 2.1,
      fill: '#ffd23b', opacity: .95 }, gCadran);
    b.setAttribute('data-role', 'bouton');
    b.style.cursor = 'grab';
    T(gCadran, p.x, p.y - R - 2.2, fr(p.angle || 0, 0) + '°', { size: 3, fill: '#ffd23b' });
  }

  function replier(texte, parLigne) {
    const lignes = [];
    let cur = '';
    for (const m of texte.split(' ')) {
      if ((cur + ' ' + m).length > parLigne) { lignes.push(cur); cur = m; }
      else cur = cur ? cur + ' ' + m : m;
    }
    if (cur) lignes.push(cur);
    return lignes;
  }

  function peindreHaut() {
    vide(gHaut);
    const V = VUE();
    const gagne = !!(mode === 'jeu' && sortie && sortie.gagne);
    if (cadreGagne) cadreGagne.setAttribute('opacity', gagne ? .55 : 0);

    make('rect', { x: 0, y: V.bandeau - 1, width: V.w, height: V.bandeauH + 2, rx: 2,
      fill: '#0b1120', opacity: .9 }, gHaut);
    const etiquette = gagne ? 'RÉUSSI' : (mode === 'jeu' ? niv.nom : montage.nom).toUpperCase();
    if (gagne) {
      make('rect', { x: 0, y: V.bandeau - 1, width: V.w, height: V.bandeauH + 2, rx: 2,
        fill: 'none', stroke: '#ffd23b', 'stroke-width': .4, opacity: .5 }, gHaut);
    }
    T(gHaut, 6, V.bandeau + 4.4, etiquette,
      { size: 2.7, fill: gagne ? '#ffd23b' : '#5f6d8c', anchor: 'start', track: .5 });

    const texte = mode === 'sable' ? montage.quoi
      : (gagne ? niv.lecon : (aideVue ? niv.aide : null));
    // la place reservee a l'etiquette suit sa longueur, sinon « LA CHAMBRE
    // NOIRE » passe sous la premiere ligne du texte
    const gauche = 14 + etiquette.length * 1.95;
    const milieu = (gauche + V.w - 6) / 2;
    const parLigne = Math.round((V.w - gauche - 8) / 1.72);
    if (texte) {
      const lignes = replier(texte, parLigne).slice(0, 3);
      const y0 = V.bandeau + (V.bandeauH - lignes.length * 4.1) / 2 + 3.4;
      lignes.forEach((l, i) => T(gHaut, milieu, y0 + i * 4.1, l,
        { size: 3, fill: gagne ? '#d6dff2' : '#a9b6d2', mono: false }));
    } else {
      const n = sortie ? sortie.etats.filter((e) => e.ok).length : 0;
      const tot = sortie ? sortie.etats.length : 0;
      T(gHaut, milieu, V.bandeau + 8.6, n + ' bille' + (n > 1 ? 's' : '') + ' sur ' + tot
        + ' allumée' + (n > 1 ? 's' : '') + ' — « Un indice » si vous séchez',
      { size: 2.9, fill: '#6c7b9c', mono: false });
    }
  }

  function peindre() {
    peindreRais(); peindrePieces(); peindreCibles();
    peindreNotes(); peindreCadran(); peindreHaut();
    btJeu[2].style.display = mode === 'jeu' && sortie && sortie.gagne ? '' : 'none';
    btJeu[1].style.display = mode === 'jeu' && niv.solution && niv.solution.length ? '' : 'none';
    btJeu[0].classList.toggle('on', aideVue);
  }

  /* ── la main ───────────────────────────────────────────────────────── */
  const pt = (ev) => {
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = svg.createSVGPoint();
    p.x = ev.clientX; p.y = ev.clientY;
    const q = p.matrixTransform(m.inverse());
    return { x: q.x, y: q.y };
  };

  let geste = null, prise = null;

  function pieceSous(q) {
    for (let i = poses.length - 1; i >= 0; i--) {
      const p = poses[i];
      if (p.type === 'miroirc') {
        // un arc n’est pas un disque : on mesure l’écart à la surface elle-même
        const a = arcDe(p);
        const v = [q.x - a.C[0], q.y - a.C[1]], d = Math.hypot(v[0], v[1]) || 1;
        const dans = (v[0] / d) * a.dirS[0] + (v[1] / d) * a.dirS[1] >= a.cosMax;
        if (dans && Math.abs(d - a.R) <= 3.5) return i;
        if (Math.hypot(q.x - p.x, q.y - p.y) <= 4) return i;
        continue;
      }
      const r = p.type === 'prisme' ? p.cote * .62
        : p.type === 'oeil' ? p.r + 2
          : p.type === 'ampoule' ? 7
            : p.type === 'objet' ? Math.max(7, p.h / 2)
              : p.type === 'bloc' || p.type === 'mur' ? Math.max(p.w, p.h) / 2
                : Math.max(5, (p.longueur || 10) / 2);
      if (Math.hypot(q.x - p.x, q.y - p.y) <= r) return i;
    }
    return -1;
  }

  svg.addEventListener('pointerdown', (ev) => {
    const q = pt(ev);
    // La capture retarge la suite du geste sur le SVG, ce qu'on veut ; mais elle
    // jette sur un pointeur qui n'est pas actif, et le jet se produirait ICI,
    // avant tout le reste du gestionnaire. Un clic perdu vaut mieux qu'un
    // gestionnaire mort.
    try { svg.setPointerCapture(ev.pointerId); } catch { /* pointeur synthétique */ }

    if (choisie >= 0 && ev.target.getAttribute && ev.target.getAttribute('data-role') === 'bouton') {
      geste = 'tourner';
      return;
    }
    const i = pieceSous(q);
    if (i >= 0) {
      choisie = i; geste = 'poser';
      prise = { dx: poses[i].x - q.x, dy: poses[i].y - q.y };
      majPanneau(); peindre();
      return;
    }
    choisie = -1; majPanneau(); peindre();
  });

  svg.addEventListener('pointermove', (ev) => {
    if (!geste) return;
    const p = laPiece();
    if (!p) return;
    const q = pt(ev), B = BORD();
    if (geste === 'poser') {
      const s = poser({ x: q.x + prise.dx, y: q.y + prise.dy, angle: p.angle || 0 });
      p.x = Math.max(4, Math.min(VUE().w - 4, s.x));
      p.y = Math.max(4, Math.min(B.h - 4, s.y));
    } else {
      p.angle = poser({ x: p.x, y: p.y, angle: Math.atan2(q.y - p.y, q.x - p.x) / RAD }).angle;
      sAngle.set(p.angle);
    }
    refaire();
  });

  svg.addEventListener('pointerup', (ev) => {
    geste = null; prise = null;
    try { svg.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ }
  });

  /* Le clavier fait ce que la souris fait mal : le degré près. */
  const clavier = (ev) => {
    const t = ev.target;
    if (t && /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(t.tagName)) return;
    const p = laPiece();
    if (!p) return;
    const pas = ev.shiftKey ? 5 : 1;
    if (ev.key === 'ArrowLeft') { p.angle = ((p.angle || 0) - pas + 360) % 360; sAngle.set(p.angle); refaire(); ev.preventDefault(); }
    else if (ev.key === 'ArrowRight') { p.angle = ((p.angle || 0) + pas) % 360; sAngle.set(p.angle); refaire(); ev.preventDefault(); }
    else if (ev.key === 'Delete' || ev.key === 'Backspace') {
      poses.splice(choisie, 1); choisie = -1; refaire(); ev.preventDefault();
    }
  };
  window.addEventListener('keydown', clavier);
  lab.onDestroy(() => window.removeEventListener('keydown', clavier));

  /* ── le souffle ────────────────────────────────────────────────────────
     La boucle ne recalcule RIEN : elle fait respirer ce qui est déjà tracé.
     Tout le calcul se fait au geste, jamais à l'image. */
  lab.loop((dt, t) => {
    for (const e of etincelles) {
      const u = (t * .22 + e.ph) % 1;
      e.el.setAttribute('cx', e.a[0] + (e.b[0] - e.a[0]) * u);
      e.el.setAttribute('cy', e.a[1] + (e.b[1] - e.a[1]) * u);
    }
    const battement = 1 + Math.sin(t * 2.6) * .07;
    for (const p of pulses) p.el.setAttribute('r', p.r0 * battement);
  });

  ajuster();
  charger(NIVEAUX[0]);
}
