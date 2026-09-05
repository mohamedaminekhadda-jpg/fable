// Le caryotype
//
// Le §8-1 de la séance. Un caryotype est « une photographie de l'ensemble des
// chromosomes d'une cellule, classés par paire selon des critères comme la
// taille » — alors on classe, on compte, et on nomme.
//
// Les longueurs et les positions de centromère sont celles des vrais
// chromosomes humains. Cela vaut la peine : c'est ce qui rend visible que le
// 21 est le PLUS PETIT des autosomes. Une trisomie n'est viable que sur un
// petit chromosome, parce qu'un petit chromosome porte moins de gènes — d'où
// le fait que les trisomies vivantes soient 21, 18 et 13, et pas 1 ou 2.
//
// Rien n'est pré-écrit : on ajoute ou on retire un chromosome à une paire, et
// la simulation lit le caryotype obtenu et le nomme. Y compris les cas qui
// n'existent pas chez un enfant né vivant — et elle le dit aussi.

// n° : [longueur relative, position du centromère (fraction du bras court)]
const CHR = {
  1: [8.4, 0.49], 2: [8.0, 0.38], 3: [6.6, 0.46], 4: [6.3, 0.26], 5: [6.0, 0.27],
  6: [5.6, 0.36], 7: [5.2, 0.38], 8: [4.8, 0.31], 9: [4.6, 0.35], 10: [4.4, 0.30],
  11: [4.4, 0.40], 12: [4.3, 0.27], 13: [3.7, 0.15], 14: [3.5, 0.15], 15: [3.3, 0.15],
  16: [3.0, 0.41], 17: [2.7, 0.29], 18: [2.6, 0.24], 19: [2.1, 0.45], 20: [2.2, 0.43],
  21: [1.6, 0.14], 22: [1.7, 0.15], X: [5.1, 0.40], Y: [1.9, 0.27],
};
const GROUPES = [
  ['A', [1, 2, 3]], ['B', [4, 5]], ['C', [6, 7, 8, 9, 10, 11, 12, 'X']],
  ['D', [13, 14, 15]], ['E', [16, 17, 18]], ['F', [19, 20]], ['G', [21, 22, 'Y']],
];

// Ce que le cours nomme. Une formule → un syndrome et ses signes.
const SYNDROMES = {
  '+21': { nom: 'Trisomie 21 — syndrome de Down', signes: 'Nuque large, visage de forme '
    + 'spécifique, petite taille, doigts courts, troubles métaboliques ; malformations '
    + 'internes, notamment du cœur, et retard mental plus ou moins important.' },
  '+13': { nom: 'Trisomie 13 — syndrome de Patau', signes: 'Polydactylie (des doigts en plus) '
    + 'et malformations létales touchant le cœur ou le cerveau.' },
  '+18': { nom: 'Trisomie 18 — syndrome d’Edwards', signes: 'Malformations multiples et '
    + 'graves ; l’espérance de vie dépasse rarement la première année.' },
  'X0': { nom: 'Syndrome de Turner (45, X)', signes: 'Stérilité, généralement de petite taille.' },
  'XXY': { nom: 'Syndrome de Klinefelter (47, XXY)', signes: 'Individu de caractère masculin '
    + 'mais infertile ; augmentation du volume des glandes mammaires, testicules de petite '
    + 'taille, pilosité peu développée. Ces signes tiennent à une mauvaise sécrétion de '
    + 'testostérone.' },
  'XXX': { nom: 'Triplo X — trisomie X (47, XXX)', signes: 'Les manifestations cliniques sont '
    + 'habituellement assez discrètes ; le syndrome peut passer inaperçu.' },
  'XYY': { nom: 'Disomie Y (47, XYY)', signes: 'Difficultés d’apprentissage plus fréquentes '
    + '(environ 50 % de plus) et retard possible dans le développement du langage.' },
  '5p-': { nom: 'Maladie du cri du chat (délétion 5p)', signes: 'Se reconnaît chez le '
    + 'nouveau-né à son cri, qui ressemble au miaulement d’un chaton ; microcéphalie, retard '
    + 'mental et psychomoteur sévère, déficience cardiaque.' },
  't(14;21)': { nom: 'Translocation robertsonienne 14 ; 21', signes: 'Le bras long du 21 s’est '
    + 'soudé au 14. Le porteur a 45 chromosomes et va bien, mais il produit des gamètes '
    + 'déséquilibrés : c’est la forme héréditaire de la trisomie 21.' },
};

export function mount(lab) {
  const { make, fr } = lab;

  /* ── l'état : combien d'exemplaires de chaque chromosome ───────────── */
  let compte = {};
  const neuf = (sexe) => {
    const c = {};
    for (let i = 1; i <= 22; i++) c[i] = 2;
    c.X = sexe === 'F' ? 2 : 1; c.Y = sexe === 'F' ? 0 : 1;
    return c;
  };
  let structure = 'aucune';                     // délétion / translocation

  /* ── réglages ──────────────────────────────────────────────────────── */
  lab.group('Le caryotype');
  const depart = lab.select({
    label: 'Partir de', value: 'F',
    options: [
      { value: 'F', label: 'une femme — 46, XX' },
      { value: 'H', label: 'un homme — 46, XY' },
      { value: 't21', label: 'trisomie 21' },
      { value: 't13', label: 'trisomie 13' },
      { value: 'turner', label: 'syndrome de Turner' },
      { value: 'klf', label: 'syndrome de Klinefelter' },
      { value: 'xxx', label: 'triplo X' },
      { value: 'xyy', label: 'disomie Y' },
      { value: 'cri', label: 'maladie du cri du chat' },
      { value: 'trans', label: 'translocation 14 ; 21' },
    ],
    onChange: (v) => { poser(v); paint(); },
  });
  const paire = lab.select({
    label: 'Paire à modifier',
    options: Object.keys(CHR).map((k) => ({ value: k, label: 'paire ' + k })),
    value: '21',
  });
  lab.buttons([
    { label: '＋ un chromosome', onClick: () => {
      const k = paire.value;
      if (compte[k] >= 4) return dire('Quatre exemplaires : au-delà, plus rien ne se lit.');
      compte[k]++; paint();
    } },
    { label: '− un chromosome', onClick: () => {
      const k = paire.value;
      if (compte[k] <= 0) return dire('Il n’y en a déjà plus.');
      compte[k]--; paint();
    } },
    { label: 'remettre à zéro', onClick: () => { poser(depart.value); dire(''); paint(); } },
  ]);
  lab.group('Affichage');
  const bandes = lab.check({ label: 'Montrer les bandes', value: true });

  function poser(v) {
    structure = 'aucune';
    if (v === 'H' || v === 'F') { compte = neuf(v); return; }
    if (v === 't21') { compte = neuf('H'); compte[21] = 3; return; }
    if (v === 't13') { compte = neuf('F'); compte[13] = 3; return; }
    if (v === 'turner') { compte = neuf('F'); compte.X = 1; return; }
    if (v === 'klf') { compte = neuf('H'); compte.X = 2; return; }
    if (v === 'xxx') { compte = neuf('F'); compte.X = 3; return; }
    if (v === 'xyy') { compte = neuf('H'); compte.Y = 2; return; }
    if (v === 'cri') { compte = neuf('F'); structure = 'del5p'; return; }
    if (v === 'trans') { compte = neuf('H'); compte[14] = 1; compte[21] = 1; structure = 'trans'; }
  }
  poser('F');

  /* ── mesures ───────────────────────────────────────────────────────── */
  const nR = lab.readout({ label: 'nombre de chromosomes', format: (s) => s || '—', hi: true });
  const formuleR = lab.readout({ label: 'formule chromosomique', format: (s) => s || '—', hi: true });
  const sexeR = lab.readout({ label: 'sexe', format: (s) => s || '—' });
  const nomR = lab.readout({ label: 'ce caryotype s’appelle', format: (s) => s || '—', hi: true });
  const signesR = lab.readout({ label: 'ce que cela entraîne', format: (s) => s || '—' });
  const note = lab.readout({ label: '', format: (s) => s || '' });
  note.show(false);
  const dire = (t) => { note.set(t); note.show(!!t); };

  /* ── lire le caryotype ─────────────────────────────────────────────── */
  function lire() {
    const total = Object.values(compte).reduce((a, b) => a + b, 0)
      + (structure === 'trans' ? 1 : 0);          // le chromosome transloqué compte pour un
    const ecarts = [];
    for (let i = 1; i <= 22; i++) {
      if (compte[i] === 3) ecarts.push('+' + i);
      else if (compte[i] === 1) ecarts.push('−' + i);
      else if (compte[i] === 0) ecarts.push('0 × ' + i);
      else if (compte[i] === 4) ecarts.push('++' + i);
    }
    const gono = 'X'.repeat(compte.X) + 'Y'.repeat(compte.Y);
    const sexe = compte.Y > 0 ? 'masculin' : compte.X > 0 ? 'féminin' : '—';
    // Dans une translocation, le 14 et le 21 « manquants » sont justement ceux
    // qui se sont soudés : les écrire en moins ET écrire t(14;21) compterait la
    // même chose deux fois.
    const montres = structure === 'trans'
      ? ecarts.filter((e) => e !== '−14' && e !== '−21') : ecarts;
    const formule = total + ', ' + (gono || '—')
      + (montres.length ? ', ' + montres.join(', ') : '')
      + (structure === 'del5p' ? ', del(5p)' : structure === 'trans' ? ', t(14;21)' : '');

    // Le nom : d'abord les anomalies de structure, puis les autosomes, puis les gonosomes.
    let cle = null;
    if (structure === 'del5p') cle = '5p-';
    else if (structure === 'trans') cle = 't(14;21)';
    else if (ecarts.length === 1 && /^\+(21|13|18)$/.test(ecarts[0])) cle = ecarts[0];
    else if (!ecarts.length) {
      if (gono === 'X') cle = 'X0';
      else if (gono === 'XXY') cle = 'XXY';
      else if (gono === 'XXX') cle = 'XXX';
      else if (gono === 'XYY') cle = 'XYY';
    }
    return { total, ecarts, gono, sexe, formule, cle, syn: cle ? SYNDROMES[cle] : null };
  }

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  const PAD = { l: 20, r: 18, t: 30, b: 18 };

  function paint() {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    const W = w - PAD.l - PAD.r, H = h - PAD.t - PAD.b;
    const l = lire();
    label(PAD.l, 14, 'Le caryotype, rangé par groupes — les chromosomes sont à l’échelle', 'lab');

    // Sept rangées, une par groupe. La hauteur d'une rangée fixe l'échelle.
    const rh = (H - 16) / GROUPES.length;
    const hMax = Math.min(rh * 0.62, 76);
    const ech = hMax / 8.4;                       // le chromosome 1 fait la hauteur maximale
    let y = PAD.t + 14;
    for (const [nom, liste] of GROUPES) {
      // la place que prend la rangée
      const tot = liste.reduce((s, k) => s + Math.max(1, compte[k]), 0)
        + (nom === 'D' && structure === 'trans' ? 1 : 0);
      const pas = Math.min(46, (W - 40) / Math.max(1, tot));
      let x = PAD.l + 30;
      label(PAD.l, y + hMax * 0.55, nom, 'pt');
      for (const k of liste) {
        const n = compte[k];
        for (let c = 0; c < n; c++) {
          dessine(x, y, CHR[k][0] * ech, CHR[k][1],
            structure === 'del5p' && k === 5 && c === 0, n !== attendu(k));
          x += pas;
        }
        if (n === 0) { label(x + pas / 2, y + hMax * 0.5, '✗', 'tau'); x += pas; }
        label(x - pas * Math.max(1, n) / 2 - (n ? 0 : pas / 2), y + hMax + 13, String(k), 'ax');
      }
      if (nom === 'D' && structure === 'trans') {
        dessine(x, y, (CHR[14][0] + CHR[21][0] * 0.9) * ech, 0.08, false, true);
        label(x, y + hMax + 13, 't(14;21)', 'ax');
      }
      y += rh;
    }
    releves(l);
  }

  const attendu = (k) => (k === 'Y' ? (compte.Y > 0 ? 1 : 0) : k === 'X' ? (compte.Y > 0 ? 1 : 2) : 2);

  // Un chromosome : deux chromatides, un centromère, et des bandes qui ne
  // prétendent qu'à une chose — donner du relief pour comparer les tailles.
  function dessine(x, y, L, pCent, delete5p, anormal) {
    const lg = Math.max(3.5, Math.min(9, L * 0.16));
    const yc = y + L * pCent;
    const col = anormal ? 'var(--sub)' : 'var(--ink-soft)';
    const bras = (y0, y1) => {
      make('rect', { x: x - lg, y: y0, width: 2 * lg, height: Math.max(2, y1 - y0), rx: lg * 0.8,
        fill: col, opacity: anormal ? .85 : .55, stroke: col, 'stroke-width': .8 }, g);
    };
    bras(y, yc - 1.2);
    bras(yc + 1.2, y + L * (delete5p ? 1 : 1) - (delete5p ? 0 : 0));
    if (delete5p) {
      // la délétion : le bras court est raccourci, et on le marque
      make('rect', { x: x - lg, y, width: 2 * lg, height: Math.max(2, (yc - 1.2 - y) * 0.45),
        fill: 'var(--paper)', stroke: col, 'stroke-width': .8, 'stroke-dasharray': '2 2' }, g);
    }
    if (!bandes.value) return;
    const nb = Math.max(2, Math.round(L / 7));
    for (let i = 0; i < nb; i++) {
      const t = (i + 0.5) / nb;
      if (Math.abs(t - pCent) < 0.08) continue;
      make('rect', { x: x - lg, y: y + t * L - 1.3, width: 2 * lg, height: 2.6,
        fill: 'var(--ink)', opacity: i % 2 ? .28 : .14 }, g);
    }
  }

  function releves(l) {
    nR.set(l.total + (l.total === 46 ? '   (le nombre normal)' : l.total > 46 ? '   (un de trop)'
      : '   (un de moins)'));
    formuleR.set(l.formule);
    sexeR.set(l.sexe + (l.gono ? '   —  gonosomes ' + l.gono : ''));
    if (l.syn) { nomR.set(l.syn.nom); signesR.set(l.syn.signes); return; }
    if (!l.ecarts.length && (l.gono === 'XX' || l.gono === 'XY')) {
      nomR.set('caryotype normal'); signesR.set('—'); return;
    }
    // Un caryotype qu'on peut construire n'est pas forcément un caryotype qui vit.
    nomR.set('aucun syndrome connu ne correspond');
    signesR.set('Une trisomie n’est viable que sur un petit chromosome — 21, 18, 13 — ou sur '
      + 'les gonosomes. Ailleurs, le déséquilibre en gènes est tel que l’embryon ne se '
      + 'développe pas : ces caryotypes se construisent, mais ne s’observent pas chez un '
      + 'enfant né vivant.');
  }

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

  paire.el.addEventListener('change', paint);
  bandes.el.addEventListener('change', paint);
  lab.onResize(paint);
  paint();
}
