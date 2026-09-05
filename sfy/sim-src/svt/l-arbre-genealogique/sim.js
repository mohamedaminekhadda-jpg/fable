// L'arbre généalogique
//
// Le §2-2 et tout ce qui en découle — les §IV et §V de la séance. L'arbre
// généalogique n'est pas une illustration : c'est l'INSTRUMENT de la génétique
// humaine, celui qui remplace les croisements dirigés qu'on ne peut pas faire.
//
// D'où le parti pris : l'arbre est entièrement modifiable. On ajoute un
// conjoint, un enfant, on change un sexe, on noircit un symbole — et à chaque
// geste la déduction se refait. Un arbre figé n'apprend qu'un cas ; celui-ci
// sert pour n'importe quel exercice.
//
// Deux choses que la simulation refuse de faire :
//
//   • Désigner UN mode. Un arbre exclut plus qu'il ne désigne, et il en reste
//     presque toujours plusieurs. Les maladies du cours sont tranchées par des
//     informations extérieures — l'énoncé, ou une statistique comme « dix fois
//     plus d'hommes daltoniens ». Faire croire qu'un arbre suffit serait le
//     mensonge le plus utile et le plus faux.
//
//   • Deviner un génotype qu'elle ne sait pas. Quand l'arbre ne fixe pas les
//     génotypes du couple, le risque est calculé sur TOUTES les possibilités,
//     pondérées — et la simulation dit que ce n'est pas certain.

import { MODES, analyse, attributions, risque, ecrire, estAtteint } from './genetique.js';
import { EXEMPLES, charger } from './exemples.js';

export function mount(lab) {
  const { make, fr } = lab;

  /* ── l'état ────────────────────────────────────────────────────────── */
  let etat = charger(EXEMPLES[0]);
  let choisi = null;                                  // id de l'individu sélectionné

  /* ── réglages ──────────────────────────────────────────────────────── */
  lab.group('L’arbre');
  const exemple = lab.select({
    label: 'Partir de', value: 'muco',
    options: EXEMPLES.map((e) => ({ value: e.id, label: e.nom }))
      .concat([{ value: 'vide', label: 'un arbre vide' }]),
    onChange: (v) => {
      etat = v === 'vide'
        ? { indivs: [], unions: [], prochain: 1, prochaineU: 1 }
        : charger(EXEMPLES.find((e) => e.id === v));
      choisi = null; paint();
    },
  });

  lab.buttons([
    { label: '＋ couple', onClick: () => {
      const a = { id: etat.prochain++, sexe: 'H', atteint: false };
      const b = { id: etat.prochain++, sexe: 'F', atteint: false };
      etat.indivs.push(a, b);
      etat.unions.push({ id: etat.prochaineU++, a: a.id, b: b.id, enfants: [] });
      choisi = a.id; paint();
    } },
    { label: '＋ conjoint', onClick: () => {
      const i = trouve(choisi); if (!i) return dire('Choisissez d’abord quelqu’un dans l’arbre.');
      const c = { id: etat.prochain++, sexe: i.sexe === 'H' ? 'F' : 'H', atteint: false };
      etat.indivs.push(c);
      etat.unions.push({ id: etat.prochaineU++, a: i.sexe === 'H' ? i.id : c.id,
        b: i.sexe === 'H' ? c.id : i.id, enfants: [] });
      paint();
    } },
    { label: '＋ enfant', onClick: () => {
      const u = unionDe(choisi);
      if (!u) return dire('Cette personne n’a pas encore de conjoint : ajoutez-en un d’abord.');
      const e = { id: etat.prochain++, sexe: u.enfants.length % 2 ? 'F' : 'H', atteint: false };
      etat.indivs.push(e); u.enfants.push(e.id); choisi = e.id; paint();
    } },
  ]);
  lab.buttons([
    { label: 'sexe', onClick: () => {
      const i = trouve(choisi); if (!i) return dire('Choisissez d’abord quelqu’un.');
      // Un parent qui change de sexe change de rôle dans son union : sans cela
      // on se retrouverait avec deux pères, et la transmission n'aurait plus de
      // sens (qui donne le X, qui donne le Y ?).
      i.sexe = i.sexe === 'H' ? 'F' : 'H';
      etat.unions.forEach((u) => {
        if (u.a === i.id || u.b === i.id) {
          const autre = u.a === i.id ? trouve(u.b) : trouve(u.a);
          if (autre && autre.sexe === i.sexe) autre.sexe = i.sexe === 'H' ? 'F' : 'H';
          const h = [trouve(u.a), trouve(u.b)].find((p) => p.sexe === 'H');
          const f = [trouve(u.a), trouve(u.b)].find((p) => p.sexe === 'F');
          if (h && f) { u.a = h.id; u.b = f.id; }
        }
      });
      paint();
    } },
    { label: 'atteint', onClick: () => {
      const i = trouve(choisi); if (!i) return dire('Choisissez d’abord quelqu’un.');
      i.atteint = !i.atteint; paint();
    } },
    { label: 'supprimer', onClick: () => {
      const i = trouve(choisi); if (!i) return dire('Choisissez d’abord quelqu’un.');
      if (etat.unions.some((u) => (u.a === i.id || u.b === i.id) && u.enfants.length)) {
        return dire('Cette personne a des enfants : supprimez-les d’abord.');
      }
      etat.indivs = etat.indivs.filter((x) => x.id !== i.id);
      etat.unions = etat.unions.filter((u) => u.a !== i.id && u.b !== i.id);
      etat.unions.forEach((u) => { u.enfants = u.enfants.filter((c) => c !== i.id); });
      choisi = null; paint();
    } },
  ]);

  lab.group('La déduction');
  const modeChoisi = lab.select({
    label: 'Génotypes selon le mode',
    options: MODES.map((m) => ({ value: m.id, label: m.nom })),
    value: 'AR',
  });
  const montrerG = lab.check({ label: 'Écrire les génotypes sur l’arbre', value: true });
  const sexeEnf = lab.select({
    label: 'L’enfant à naître serait',
    options: [{ value: 'H', label: 'un garçon' }, { value: 'F', label: 'une fille' }],
    value: 'H',
  });
  const freq = lab.slider({
    label: 'Fréquence de l’allèle dans la population', min: 0.001, max: 0.2, step: 0.001,
    value: 0.01, dec: 3,
  });

  /* ── mesures ───────────────────────────────────────────────────────── */
  const compte = lab.readout({ label: 'l’arbre', format: (s) => s || '—' });
  const ratio = lab.readout({ label: 'atteints', format: (s) => s || '—' });
  const possiblesR = lab.readout({ label: 'modes possibles', format: (s) => s || '—', hi: true });
  const excl = MODES.map((m) => lab.readout({ label: '✗ ' + m.court, format: (s) => s || '—' }));
  const genoR = lab.readout({ label: 'génotype du sélectionné', format: (s) => s || '—' });
  const coupleR = lab.readout({ label: 'couple étudié', format: (s) => s || '—' });
  const risqueR = lab.readout({ label: 'risque pour l’enfant', format: (s) => s || '—', hi: true });
  const certR = lab.readout({ label: 'les génotypes sont-ils sûrs ?', format: (s) => s || '—' });
  const note = lab.readout({ label: '', format: (s) => s || '' });
  note.show(false);
  let message = '';
  const dire = (t) => { message = t; note.set(t); note.show(!!t); };

  /* ── petites recherches ────────────────────────────────────────────── */
  const trouve = (id) => etat.indivs.find((i) => i.id === id);
  const unionDe = (id) => etat.unions.find((u) => u.a === id || u.b === id);
  const unionParente = (id) => etat.unions.find((u) => u.enfants.includes(id));

  // Le modèle de dessin (unions) vers celui du raisonnement (père/mère).
  function versGenetique(noms) {
    return etat.indivs.map((i) => {
      const u = unionParente(i.id);
      return {
        id: i.id, sexe: i.sexe, atteint: i.atteint,
        nom: noms[i.id] || String(i.id),
        pere: u ? u.a : null, mere: u ? u.b : null,
      };
    });
  }

  /* ── la mise en page de l'arbre ────────────────────────────────────── */
  // Les générations d'abord, par un point fixe : un enfant est sous ses parents,
  // et un conjoint entré dans la famille se met au niveau de son partenaire.
  function generations() {
    const g = {}; etat.indivs.forEach((i) => { g[i.id] = 0; });
    for (let k = 0; k < etat.indivs.length + 2; k++) {
      let bouge = false;
      etat.unions.forEach((u) => {
        const n = Math.max(g[u.a] || 0, g[u.b] || 0);
        if (g[u.a] !== n) { g[u.a] = n; bouge = true; }
        if (g[u.b] !== n) { g[u.b] = n; bouge = true; }
        u.enfants.forEach((c) => { if (g[c] < n + 1) { g[c] = n + 1; bouge = true; } });
      });
      if (!bouge) break;
    }
    return g;
  }

  // Puis les abscisses : chaque union occupe un bloc large comme sa descendance,
  // et le couple se centre au-dessus de ses enfants.
  function abscisses() {
    const x = {}, faites = new Set();
    let curseur = 0;
    const placer = (u, x0) => {
      if (faites.has(u.id)) return 0;
      faites.add(u.id);
      let xi = x0, total = 0;
      for (const cid of u.enfants) {
        const su = unionDe(cid);
        if (su && !faites.has(su.id)) { const w = placer(su, xi); xi += w; total += w; }
        else { x[cid] = xi; xi += 1; total += 1; }
      }
      const w = Math.max(2, total);
      const c = x0 + w / 2;
      x[u.a] = c - 0.6; x[u.b] = c + 0.6;
      return w;
    };
    // les unions fondatrices : celles dont aucun des deux n'est enfant de quelqu'un
    etat.unions.forEach((u) => {
      if (!unionParente(u.a) && !unionParente(u.b) && !faites.has(u.id)) {
        curseur += placer(u, curseur) + 0.8;
      }
    });
    etat.unions.forEach((u) => { if (!faites.has(u.id)) curseur += placer(u, curseur) + 0.8; });
    etat.indivs.forEach((i) => { if (x[i.id] === undefined) { x[i.id] = curseur; curseur += 1; } });
    return x;
  }

  // Les noms du cours : I-1, II-3… numérotés par génération, de gauche à droite.
  function nommer(gen, x) {
    const parGen = {};
    etat.indivs.forEach((i) => { (parGen[gen[i.id]] = parGen[gen[i.id]] || []).push(i); });
    const noms = {}, ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    Object.keys(parGen).sort((a, b) => a - b).forEach((g) => {
      parGen[g].sort((a, b) => x[a.id] - x[b.id])
        .forEach((i, k) => { noms[i.id] = (ROM[g] || 'G' + g) + '-' + (k + 1); });
    });
    return noms;
  }

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  const PAD = { l: 20, r: 18, t: 30, b: 18 };
  let cibles = [];

  function paint() {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    cibles = [];
    const W = w - PAD.l - PAD.r, H = h - PAD.t - PAD.b;

    const gen = generations(), x = abscisses(), noms = nommer(gen, x);
    const gens = versGenetique(noms);

    if (!etat.indivs.length) {
      label(PAD.l + W / 2, PAD.t + H / 2, 'Arbre vide — « ＋ couple » pour commencer.', 'tau');
      videRelevés(); return;
    }

    /* la géométrie */
    const xs = Object.values(x), maxX = Math.max(...xs), minX = Math.min(...xs);
    const maxG = Math.max(...Object.values(gen));
    const pasX = Math.min(96, (W - 60) / Math.max(1, maxX - minX + 1.6));
    const pasY = Math.min(96, (H - 46) / Math.max(1, maxG + 1));
    const R = Math.max(9, Math.min(17, Math.min(pasX, pasY) * 0.26));
    // L'arbre est centré : un petit arbre calé à gauche laisse un grand vide à
    // droite et donne à croire qu'il manque quelque chose.
    const larg = (maxX - minX + 0.6) * pasX;
    const dec = Math.max(30, (W - larg) / 2);
    const X = (i) => PAD.l + dec + (x[i] - minX + 0.3) * pasX;
    const Y = (i) => PAD.t + 26 + gen[i] * pasY;

    label(PAD.l, 14, 'L’arbre — cliquez sur une personne pour la choisir, puis modifiez-la', 'lab');

    /* les traits d'union et de fratrie, sous les symboles */
    etat.unions.forEach((u) => {
      const xa = X(u.a), xb = X(u.b), y = Y(u.a);
      make('line', { x1: Math.min(xa, xb) + R, y1: y, x2: Math.max(xa, xb) - R, y2: y,
        stroke: 'var(--ink-soft)', 'stroke-width': 1.4 }, g);
      if (!u.enfants.length) return;
      const cx = (xa + xb) / 2, yb = y + (pasY - R) * 0.45;
      make('line', { x1: cx, y1: y, x2: cx, y2: yb, stroke: 'var(--ink-soft)', 'stroke-width': 1.4 }, g);
      const exs = u.enfants.map(X);
      make('line', { x1: Math.min(...exs), y1: yb, x2: Math.max(...exs), y2: yb,
        stroke: 'var(--ink-soft)', 'stroke-width': 1.4 }, g);
      u.enfants.forEach((c) => make('line', { x1: X(c), y1: yb, x2: X(c), y2: Y(c) - R,
        stroke: 'var(--ink-soft)', 'stroke-width': 1.4 }, g));
    });

    /* les symboles : carré pour un homme, cercle pour une femme, noirci si atteint */
    const mode = modeChoisi.value;
    const att = attributions(mode, gens, freq.value);
    const certains = genotypesCertains(att.assignations);
    etat.indivs.forEach((i) => {
      const cx = X(i.id), cy = Y(i.id), sel = i.id === choisi;
      const rempli = i.atteint;
      const attrs = { fill: rempli ? 'var(--sub)' : 'var(--paper)',
        stroke: sel ? 'var(--ink)' : 'var(--ink-soft)', 'stroke-width': sel ? 2.6 : 1.6 };
      if (i.sexe === 'H') make('rect', { x: cx - R, y: cy - R, width: 2 * R, height: 2 * R, ...attrs }, g);
      else make('circle', { cx, cy, r: R, ...attrs }, g);
      label(cx, cy + R + 14, noms[i.id], 'ax');
      if (montrerG.value && att.ok) {
        const gg = certains[i.id];
        label(cx, cy + R + 27, gg ? ecrire(mode, gg) : '?', 'ax');
      }
      cibles.push({ id: i.id, x: cx, y: cy, r: R + 4 });
    });

    legende(PAD.l, PAD.t + H - 2);
    releves(gens, noms, att, certains);
  }

  // Un génotype n'est écrit que s'il est le MÊME dans toutes les attributions
  // compatibles. Sinon l'arbre ne le détermine pas, et on écrit « ? » plutôt
  // qu'un génotype choisi au hasard parmi ceux qui restent.
  function genotypesCertains(assignations) {
    if (!assignations.length) return {};
    const out = { ...assignations[0].geno };
    for (const a of assignations) {
      for (const k in out) if (a.geno[k] !== out[k]) delete out[k];
    }
    return out;
  }

  function legende(x, y) {
    const items = [['rect', 'homme'], ['circle', 'femme']];
    let px = x;
    items.forEach(([forme, txt]) => {
      if (forme === 'rect') make('rect', { x: px, y: y - 9, width: 10, height: 10,
        fill: 'var(--paper)', stroke: 'var(--ink-soft)', 'stroke-width': 1.4 }, g);
      else make('circle', { cx: px + 5, cy: y - 4, r: 5.4, fill: 'var(--paper)',
        stroke: 'var(--ink-soft)', 'stroke-width': 1.4 }, g);
      label(px + 15, y, txt, 'ax start'); px += 15 + txt.length * 6.4 + 14;
    });
    make('rect', { x: px, y: y - 9, width: 10, height: 10, fill: 'var(--sub)' }, g);
    label(px + 15, y, 'atteint', 'ax start');
  }

  function videRelevés() {
    compte.set('vide'); ratio.set('—'); possiblesR.set('—');
    excl.forEach((r) => r.show(false));
    genoR.set('—'); coupleR.set('—'); risqueR.set('—'); certR.set('—');
  }

  /* ── les relevés ───────────────────────────────────────────────────── */
  function releves(gens, noms, att, certains) {
    const nH = etat.indivs.filter((i) => i.sexe === 'H').length;
    const aH = etat.indivs.filter((i) => i.sexe === 'H' && i.atteint).length;
    const aF = etat.indivs.filter((i) => i.sexe === 'F' && i.atteint).length;
    const pl = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
    compte.set(pl(etat.indivs.length, 'personne') + ', ' + pl(etat.unions.length, 'couple'));
    ratio.set(aH + ' homme' + (aH > 1 ? 's' : '') + ' et ' + aF + ' femme' + (aF > 1 ? 's' : '')
      + (aH > 2 * Math.max(1, aF) ? '  — bien plus d’hommes : cela oriente vers X récessif' : ''));

    const a = analyse(gens, freq.value);
    const ok = a.filter((m) => m.possible);
    possiblesR.set(ok.length ? ok.map((m) => m.court).join(' · ')
      + (ok.length > 1 ? '   (' + ok.length + ' modes : l’arbre ne tranche pas seul)' : '   (un seul !)')
      : 'aucun — cet arbre est impossible tel quel');
    a.forEach((m, k) => {
      const r = excl[k];
      r.show(!m.possible);
      if (!m.possible) r.set(m.raison);
    });
    const boiteux = a.filter((m) => m.desaccord);
    if (boiteux.length) {
      dire('Incohérence interne sur ' + boiteux.map((m) => m.court).join(', ')
        + ' : la règle du cours et la recherche de génotypes ne disent pas la même chose.');
    } else if (message && /Incohérence/.test(message)) dire('');

    const mode = modeChoisi.value;
    const sel = trouve(choisi);
    genoR.set(!sel ? 'personne n’est sélectionné'
      : !att.ok ? 'ce mode est impossible pour cet arbre'
        : certains[sel.id] ? noms[sel.id] + ' : ' + ecrire(mode, certains[sel.id])
          : noms[sel.id] + ' : indéterminé — l’arbre laisse plusieurs génotypes ouverts');

    const u = unionDe(choisi);
    if (!u || !att.ok) {
      coupleR.set(u ? 'ce mode est impossible pour cet arbre' : 'choisissez quelqu’un qui a un conjoint');
      risqueR.set('—'); certR.set('—'); return;
    }
    coupleR.set(noms[u.a] + ' × ' + noms[u.b]
      + (u.enfants.length ? '  (' + u.enfants.length + ' enfant'
        + (u.enfants.length > 1 ? 's' : '') + ' déjà)' : ''));
    const r = risque(mode, gens, u.a, u.b, sexeEnf.value, freq.value);
    if (!r) { risqueR.set('—'); certR.set('—'); return; }
    risqueR.set(fr(r.p * 100, 1) + ' %   pour ' + (sexeEnf.value === 'H' ? 'un garçon' : 'une fille'));
    certR.set(r.certain ? 'oui : ' + r.paires[0].cle.split(' × ').map((x) => ecrire(mode, x)).join(' × ')
      : 'non — ' + r.paires.slice(0, 3).map((p) => p.cle.split(' × ').map((x) => ecrire(mode, x)).join(' × ')
        + ' : ' + fr(p.p * 100, 0) + ' %').join(' ; '));
  }

  /* ── choisir quelqu'un ─────────────────────────────────────────────── */
  const clic = (ev) => {
    const rect = svg.getBoundingClientRect(), { w, h } = lab.size();
    const px = (ev.clientX - rect.left) * (w / rect.width);
    const py = (ev.clientY - rect.top) * (h / rect.height);
    const t = cibles.find((c) => Math.abs(px - c.x) <= c.r && Math.abs(py - c.y) <= c.r);
    choisi = t ? t.id : null;
    dire(''); paint();
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

  [modeChoisi, sexeEnf].forEach((s) => s.el.addEventListener('change', paint));
  montrerG.el.addEventListener('change', paint);
  freq.el.addEventListener('input', paint);
  lab.onResize(paint);
  paint();
}
