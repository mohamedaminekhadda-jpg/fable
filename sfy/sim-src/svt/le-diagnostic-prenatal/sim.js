// Le diagnostic prénatal
//
// Le §8-2. Le cours énumère les examens — échographie, amniocentèse,
// choriocentèse, cordocentèse, marquage FISH — et les situations qui les rendent
// nécessaires. Vu en liste, tout se vaut. Posé sur les quarante semaines d'une
// grossesse, rien ne se vaut plus :
//
//   • chaque examen a une FENÊTRE, avant et après laquelle il est impossible ;
//   • plus il renseigne, plus il coûte — l'échographie ne prélève rien et ne
//     risque rien, les prélèvements donnent un caryotype et risquent une
//     fausse couche ;
//   • ils ne répondent pas à la même question, et c'est la question qui décide.
//
// La barre du temps est donc la commande principale : à chaque semaine, la
// simulation dit ce qui est possible aujourd'hui, ce qui ne l'est plus, et ce
// qui ne l'est pas encore.

const EXAMENS = [
  {
    id: 'echo1', nom: 'Échographie du 1ᵉʳ trimestre', a: 11, b: 14, risque: 0,
    prelev: 'rien — des ultrasons',
    voit: 'La clarté nucale, dont l’épaisseur oriente vers une trisomie 21 sans la prouver. '
      + 'Datation de la grossesse.',
    comment: 'Une sonde émet des ultrasons et reçoit leur écho ; un système transforme le '
      + 'délai entre émission et réception en image.',
  },
  {
    id: 'chorio', nom: 'Choriocentèse (villosités choriales)', a: 11, b: 14, risque: 1,
    prelev: 'un fragment de placenta',
    voit: 'Le caryotype complet du fœtus, et l’ADN pour une maladie génique connue.',
    comment: 'C’est le prélèvement le plus précoce : on obtient un caryotype dès la fin du '
      + 'premier trimestre, ce qu’aucune échographie ne donnera jamais.',
  },
  {
    id: 'echo2', nom: 'Échographie morphologique', a: 20, b: 25, risque: 0,
    prelev: 'rien — des ultrasons',
    voit: 'Les malformations : cœur, cerveau, membres, reins. C’est l’examen qui repère une '
      + 'polydactylie ou une malformation cardiaque.',
    comment: 'Elle ne dit rien des chromosomes — elle montre des organes.',
  },
  {
    id: 'amnio', nom: 'Amniocentèse', a: 14, b: 18, risque: 0.5,
    prelev: 'du liquide amniotique',
    voit: 'Le caryotype complet, à partir des cellules du fœtus en suspension dans le liquide.',
    comment: 'La fenêtre du cours : « entre la 14ᵉ et la 18ᵉ semaine de grossesse ». Il faut '
      + 'ensuite mettre les cellules en culture, ce qui prend une à trois semaines.',
  },
  {
    id: 'cordo', nom: 'Cordocentèse', a: 19, b: 38, risque: 2,
    prelev: 'du sang fœtal, au cordon ombilical',
    voit: 'Le caryotype, mais aussi tout ce qui se lit dans le sang : anémies, infections, '
      + 'groupes sanguins.',
    comment: 'Le plus tardif et le plus risqué ; on n’y vient que pour une question à laquelle '
      + 'les autres ne répondent pas.',
  },
  {
    id: 'fish', nom: 'Marquage chromosomique (FISH)', a: 11, b: 38, risque: 0,
    prelev: 'rien de plus — il s’applique aux cellules déjà prélevées',
    voit: 'La présence ou l’absence d’une séquence précise, en quelques heures.',
    comment: 'Une sonde nucléotidique s’hybride avec la séquence complémentaire et porte une '
      + 'substance fluorescente, facile à détecter : d’où « hybridation in situ en '
      + 'fluorescence ». Elle ne remplace pas le caryotype, elle donne une réponse vite.',
  },
];

// Les situations où le cours rend le diagnostic prénatal obligatoire.
const INDICATIONS = [
  'Les parents ont déjà eu un enfant atteint d’une anomalie chromosomique, d’une maladie '
    + 'héréditaire ou d’une malformation congénitale.',
  'L’un des parents est lui-même atteint d’une maladie héréditaire ou d’une anomalie '
    + 'chromosomique.',
  'Un problème de consanguinité.',
  'Un couple stérile, ou ayant eu des fausses couches à répétition.',
  'Une mère de plus de 38 ans — la probabilité d’une anomalie augmente avec l’âge.',
];

export function mount(lab) {
  const { make, fr } = lab;

  lab.group('La grossesse');
  const sem = lab.slider({ label: 'Semaine', min: 4, max: 40, step: 1, value: 16, unit: 'ᵉ sem.', dec: 0 });
  lab.group('L’examen');
  const quel = lab.select({
    label: 'On regarde', value: 'amnio',
    options: EXAMENS.map((e) => ({ value: e.id, label: e.nom })),
  });
  lab.group('Affichage');
  const vue = lab.select({
    label: 'Vue', value: 'calendrier',
    options: [{ value: 'calendrier', label: 'le calendrier des examens' },
      { value: 'indications', label: 'quand le diagnostic s’impose' }],
  });

  /* ── mesures ───────────────────────────────────────────────────────── */
  const dispoR = lab.readout({ label: 'possible cette semaine ?', format: (s) => s || '—', hi: true });
  const prelR = lab.readout({ label: 'ce qu’on prélève', format: (s) => s || '—' });
  const voitR = lab.readout({ label: 'ce que cela montre', format: (s) => s || '—', hi: true });
  const risqR = lab.readout({ label: 'risque de fausse couche', format: (s) => s || '—' });
  const commR = lab.readout({ label: 'comment cela marche', format: (s) => s || '—' });
  const aujR = lab.readout({ label: 'disponibles aujourd’hui', format: (s) => s || '—' });
  const caryoR = lab.readout({ label: 'le plus tôt pour un caryotype', format: (s) => s || '—' });

  const exam = () => EXAMENS.find((e) => e.id === quel.value);

  /* ── le dessin ─────────────────────────────────────────────────────── */
  const svg = lab.svg();
  const g = make('g', {}, svg);
  const PAD = { l: 20, r: 18, t: 30, b: 18 };

  function paint() {
    const { w, h } = lab.size();
    while (g.firstChild) g.removeChild(g.firstChild);
    const W = w - PAD.l - PAD.r, H = h - PAD.t - PAD.b;
    if (vue.value === 'calendrier') calendrier(PAD.l, PAD.t, W, H);
    else indications(PAD.l, PAD.t, W, H);
    releves();
  }

  function calendrier(X0, Y0, W, H) {
    label(X0, 14, 'Les quarante semaines, et la fenêtre de chaque examen', 'lab');
    const gx = X0 + 190, gw = W - 200;
    if (gw < 180) return;
    const X = (s) => gx + ((s - 4) / 36) * gw;
    const rh = Math.min(34, (H - 54) / EXAMENS.length);
    const y0 = Y0 + 26;

    // les trimestres, en fond
    [[4, 14, '1ᵉʳ trimestre'], [14, 27, '2ᵉ trimestre'], [27, 40, '3ᵉ trimestre']]
      .forEach(([a, b, nom], i) => {
        make('rect', { x: X(a), y: y0 - 14, width: X(b) - X(a), height: rh * EXAMENS.length + 18,
          fill: i % 2 ? 'var(--ink-mute)' : 'var(--paper-2)', opacity: i % 2 ? .06 : .5 }, g);
        label((X(a) + X(b)) / 2, y0 - 6, nom, 'ax');
      });

    EXAMENS.forEach((e, i) => {
      const y = y0 + i * rh + rh / 2, sel = e.id === quel.value;
      const ouvert = sem.value >= e.a && sem.value <= e.b;
      label(gx - 10, y + 4, e.nom.length > 26 ? e.nom.slice(0, 25) + '…' : e.nom,
        sel ? 'tau end' : 'ax end');
      make('rect', { x: X(e.a), y: y - rh * 0.28, width: X(e.b) - X(e.a), height: rh * 0.56, rx: 4,
        fill: sel ? 'var(--sub)' : 'var(--ink-soft)', opacity: sel ? .8 : .35 }, g);
      // le risque, en épaisseur de trait sous la barre
      if (e.risque > 0) {
        make('line', { x1: X(e.a), y1: y + rh * 0.34, x2: X(e.b), y2: y + rh * 0.34,
          stroke: 'var(--sub)', 'stroke-width': Math.max(1, e.risque * 1.6), opacity: .55 }, g);
      }
      if (ouvert) make('circle', { cx: X(sem.value), cy: y, r: 4.2, fill: 'var(--ink)' }, g);
    });

    // la semaine courante
    const xs = X(sem.value);
    make('line', { x1: xs, y1: y0 - 14, x2: xs, y2: y0 + rh * EXAMENS.length + 4,
      stroke: 'var(--ink)', 'stroke-width': 1.8 }, g);
    // Ramené dans le cadre : à la 40ᵉ semaine le repère est sur le bord droit,
    // et son étiquette, centrée dessus, sortait de moitié.
    cadrer(label(xs, y0 - 24, fr(sem.value, 0) + 'ᵉ semaine', 'tau'), X0 + 2, X0 + W - 2);

    // l'échelle
    const yb = y0 + rh * EXAMENS.length + 18;
    make('line', { x1: gx, y1: yb, x2: gx + gw, y2: yb, stroke: 'var(--ink-soft)', 'stroke-width': 1 }, g);
    for (let s = 4; s <= 40; s += 4) {
      make('line', { x1: X(s), y1: yb, x2: X(s), y2: yb + 5, stroke: 'var(--ink-soft)', 'stroke-width': 1 }, g);
      label(X(s), yb + 17, String(s), 'ax');
    }
    if (yb + 30 < Y0 + H) label(gx + gw, yb + 30, 'semaines de grossesse', 'ax end');
  }

  function indications(X0, Y0, W, H) {
    label(X0, 14, 'Le diagnostic prénatal s’impose dans ces cas', 'lab');
    const lh = Math.min(46, (H - 30) / INDICATIONS.length);
    INDICATIONS.forEach((t, i) => {
      const y = Y0 + 24 + i * lh;
      make('circle', { cx: X0 + 10, cy: y + 4, r: 4.5, fill: 'var(--sub)' }, g);
      couper(t, Math.max(30, Math.floor((W - 40) / 6.6)))
        .forEach((l, k) => label(X0 + 26, y + 8 + k * 14, l, 'ax start'));
    });
  }

  function releves() {
    const e = exam(), s = sem.value;
    const ouvert = s >= e.a && s <= e.b;
    dispoR.set(ouvert ? 'oui — sa fenêtre va de la ' + e.a + 'ᵉ à la ' + e.b + 'ᵉ semaine'
      : s < e.a ? 'pas encore : il faut attendre la ' + e.a + 'ᵉ semaine (dans '
        + (e.a - s) + ' semaine' + (e.a - s > 1 ? 's' : '') + ')'
        : 'trop tard : sa fenêtre s’est fermée à la ' + e.b + 'ᵉ semaine');
    prelR.set(e.prelev);
    voitR.set(e.voit);
    risqR.set(e.risque === 0 ? 'aucun — rien n’est prélevé'
      : 'environ ' + fr(e.risque, 1).replace(',0', '') + ' %  — c’est le prix d’un prélèvement');
    commR.set(e.comment);
    const dispo = EXAMENS.filter((x) => s >= x.a && s <= x.b);
    aujR.set(dispo.length ? dispo.map((x) => x.nom.split(' (')[0]).join(' · ') : 'aucun');
    // Le caryotype demande des cellules fœtales : seuls trois examens en donnent.
    const avecCaryo = EXAMENS.filter((x) => /caryotype/i.test(x.voit));
    const tot = avecCaryo.reduce((a, b) => (b.a < a.a ? b : a));
    caryoR.set(tot.nom.split(' (')[0] + ', dès la ' + tot.a + 'ᵉ semaine'
      + '   —  une échographie n’en donne jamais');
  }

  function cadrer(n, minX, maxX) {
    let b; try { b = n.getBBox(); } catch { return n; }
    if (!b.width) return n;
    const dx = b.x < minX ? minX - b.x : b.x + b.width > maxX ? maxX - (b.x + b.width) : 0;
    if (dx) n.setAttribute('x', +n.getAttribute('x') + dx);
    return n;
  }
  function couper(texte, n) {
    const mots = texte.split(' '), out = []; let l = '';
    for (const m of mots) {
      if ((l + ' ' + m).trim().length > n) { out.push(l.trim()); l = m; } else l += ' ' + m;
    }
    if (l.trim()) out.push(l.trim());
    return out;
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

  [quel, vue].forEach((s) => s.el.addEventListener('change', paint));
  sem.el.addEventListener('input', paint);
  lab.onResize(paint);
  paint();
}
