/* LE RAPPORT DE L'ESSAI — les chiffres, ce qu'ils veulent dire, et de quoi
 * creuser jusqu'à la figure exacte.
 *
 * Un module à part, et pas un morceau de la console, pour une raison précise :
 * ce calcul est la seule chose du projet qui transforme des clics en
 * décisions, et il ne doit exister qu'une fois.
 *
 * ── UN TABLEAU QU'ON NE PEUT PAS OUVRIR EST UNE IMPASSE ──────────────────
 *
 * La première version montrait sept tableaux justes et morts. « map : vue par
 * cinq, touchée par zéro » est un bon début et une mauvaise fin : QUELLE
 * carte, dans quel chapitre, à quelle minute, sur quel téléphone ? Sans la
 * réponse, il n'y a rien à corriger lundi matin.
 *
 * Tout se clique donc, et tout ouvre le même tiroir : une figure, un
 * chapitre, un appareil, une séance, une journée, une ligne brute. Un clic
 * pose aussi un FILTRE, et le reste de la page se recalcule derrière —
 * choisir un chapitre, c'est voir la frise, les figures et les pannes de ce
 * chapitre seulement.
 *
 * ── LES DESSINS SONT DU SVG ÉCRIT À LA MAIN ──────────────────────────────
 *
 * Pas de bibliothèque de graphiques. Trois cents kilo-octets pour six barres
 * et une frise, sur une page que l'auteur ouvre seul, seraient un mauvais
 * échange ; et la règle de la maison sur le mouvement — rien qui tourne en
 * boucle — est plus facile à tenir quand on écrit soi-même chaque trait.
 *
 * ── CE QU'IL SAIT RECONNAÎTRE ────────────────────────────────────────────
 *
 * Six diagnostics, chacun une PHRASE plutôt qu'une note. « 0,31 » ne dit pas
 * quoi faire ; « on la prend pour un bouton » se corrige dans l'après-midi.
 */

/* Les lots peuvent arriver deux fois — c'est le prix de ne jamais rien perdre
   quand le réseau tombe. On dédoublonne donc, et LA CLEF DOIT PORTER TOUT CE
   QUI DISTINGUE DEUX ÉVÉNEMENTS.
   Une première version prenait « le chapitre OU la figure », et perdait des
   mesures pour de bon : à la clôture, les figures sont dépliées dans une
   seule boucle synchrone, donc elles portent toutes le MÊME horodatage à la
   milliseconde près. Sept figures d'un même chapitre devenaient une. */
export function evenements(tout) {
  const vus = new Set(), out = [];
  for (const p of tout) {
    for (const l of p.lots) {
      for (const e of (l.ev || [])) {
        /* Le message fait partie de la clef : deux pannes differentes dans la
           MEME milliseconde — ce qui arrive, une erreur en declenchant une
           autre — se confondaient en une seule, et la seconde disparaissait
           sans laisser de trace. Trouve parce que le jeu invente en posait
           deux et que le rapport n'en montrait qu'une. */
        const cle = [p.uid, e.q, e.t, e.k, e.b || '', e.c || '', e.e || '', e.i || 0,
          (e.m || '').slice(0, 40)].join('|');
        if (vus.has(cle)) continue;
        vus.add(cle);
        out.push({ ...e, uid: p.uid, code: l.code || p.profil.code || '?' });
      }
    }
  }
  return out;
}

export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const med = (a) => (a.length ? a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
const mn = (s) => (s < 60 ? Math.round(s) + 's' : Math.round(s / 60) + ' min');
const jour = (t) => new Date(t).toISOString().slice(0, 10);
const heure = (t) => new Date(t).toISOString().slice(11, 16);
const court = (u) => String(u).slice(0, 6);

/* ── ALLER VOIR DANS LE LIVRE ────────────────────────────────────────────
   Un diagnostic qu'on ne peut pas aller verifier de ses yeux reste une
   opinion. Chaque chapitre et chaque emplacement de figure porte donc un
   lien vers le livre publie, a l'endroit exact, ou le petit script `voir.js`
   pose un anneau autour de la chose.

   La racine se deduit de la page plutot que de s'ecrire : la console publiee
   sous `/fable/` doit pointer vers `/fable/library/...`, et une adresse
   recopiee a la main se trompe un jour. */
const RACINE_SITE = location.href.replace(/[?#].*$/, '').replace(/\/[^/]*$/, '/');
function lienLivre(b, ch, i) {
  if (!b || !ch) return '';
  const q = ch + (i === undefined || i === null ? '' : '.' + i);
  const u = `${RACINE_SITE}library/${encodeURIComponent(b)}/?voir=${encodeURIComponent(q)}`;
  return `<a class="ess-voir" href="${esc(u)}" target="_blank" rel="noopener"
    title="Open the book here">see it ↗</a>`;
}

/* Le nom lisible d'une figure : son titre d'auteur s'il y en a un, son type
   sinon. C'est ce qui fait la différence entre « map #3 » et « map — Le Maroc
   physique », c'est-à-dire entre un identifiant et une chose qu'on retrouve
   dans le livre. */
function nomFigure(e) {
  return e.ti ? `${e.e} — ${e.ti}` : e.e || '?';
}

/* ── LES DESSINS ────────────────────────────────────────────────────────── */

/* Des barres, horizontales, avec leur valeur au bout. Horizontales parce que
   les étiquettes sont des titres de chapitre : à la verticale il faudrait les
   coucher, et une étiquette couchée ne se lit pas. */
function barres(lignes, opts = {}) {
  if (!lignes.length) return '<p class="ess-rien">Nothing yet.</p>';
  const max = Math.max(1, ...lignes.map((l) => l.v));
  const H = 26, L = 560, Lg = opts.etiquette || 210;
  const svg = lignes.map((l, i) => {
    const w = Math.round((L - Lg - 60) * l.v / max);
    const y = i * H;
    const marque = l.marque != null
      ? `<circle cx="${Lg + Math.round((L - Lg - 60) * l.marque / max)}" cy="${y + 11}" r="3.5"
           class="ess-pt"><title>${esc(l.marqueTitre || '')}</title></circle>`
      : '';
    return `<g class="ess-brow" data-clic="${esc(l.clic || '')}" tabindex="0">
      <rect x="0" y="${y}" width="${L}" height="${H - 4}" class="ess-bhit"/>
      <text x="0" y="${y + 15}" class="ess-blab">${esc(l.nom)}</text>
      <rect x="${Lg}" y="${y + 4}" width="${Math.max(2, w)}" height="14" rx="3" class="ess-bfill"/>
      ${marque}
      <text x="${Lg + Math.max(2, w) + 8}" y="${y + 15}" class="ess-bval">${esc(l.txt)}</text>
    </g>`;
  }).join('');
  return `<svg class="ess-svg" viewBox="0 0 ${L} ${lignes.length * H}" role="img">${svg}</svg>`;
}

/* Une colonne par jour : quand ils ont lu, et combien. Cliquer un jour n'est
   pas décoratif — c'est le filtre le plus utile du lot, parce qu'un essai se
   lit par vagues (le jour où le professeur en a parlé, puis la veille du
   contrôle). */
function colonnes(jours) {
  if (!jours.length) return '<p class="ess-rien">Nothing yet.</p>';
  const max = Math.max(1, ...jours.map((j) => j.v));
  const L = 560, H = 120, l = Math.min(46, Math.floor(L / jours.length) - 6);
  const pas = jours.length > 1 ? (L - l) / (jours.length - 1) : 0;
  return `<svg class="ess-svg" viewBox="0 0 ${L} ${H + 26}" role="img">${jours.map((j, i) => {
    const h = Math.round((H - 10) * j.v / max);
    const x = Math.round(i * pas);
    return `<g class="ess-crow" data-clic="jour:${esc(j.j)}" tabindex="0">
      <rect x="${x}" y="0" width="${l}" height="${H}" class="ess-bhit"/>
      <rect x="${x}" y="${H - h}" width="${l}" height="${Math.max(2, h)}" rx="3" class="ess-bfill"/>
      <text x="${x + l / 2}" y="${H + 13}" class="ess-jlab">${esc(j.j.slice(5))}</text>
      <text x="${x + l / 2}" y="${H - h - 5}" class="ess-bval ess-mid">${esc(String(j.v))}</text>
    </g>`;
  }).join('')}</svg>`;
}

/* ── LA FRISE ────────────────────────────────────────────────────────────
   Une séance, de gauche à droite, en secondes depuis l'ouverture. Chaque
   marque est un moment : un chapitre atteint, une figure prise, un exercice,
   une panne. C'est la seule vue qui raconte un ORDRE — « il a ouvert, filé au
   chapitre 4, touché la carte, puis plus rien pendant six minutes » — et
   l'ordre est ce qu'aucun total ne rend. */
function frise(ev, seance) {
  const dedans = ev.filter((e) => e.q === seance);
  if (!dedans.length) return '<p class="ess-rien">Nothing in this session.</p>';
  const fin = Math.max(30, ...dedans.filter((e) => e.k === 'fin').map((e) => e.s || 0),
    ...dedans.map((e) => (e.d0 >= 0 ? e.d0 : 0) + (e.av > 0 ? e.av : 0)));
  const L = 560, H = 96;
  const x = (s) => 26 + Math.round((L - 46) * Math.min(1, Math.max(0, s / fin)));

  const marques = [];
  dedans.forEach((e) => {
    if (e.k === 'chapitre' && e.d0 >= 0) {
      marques.push({ s: e.d0, y: 20, cls: 'ess-m-ch',
        t: `${e.n || e.c} · reached at ${mn(e.d0)}, stayed ${mn(e.s)}, ${e.pr || 0}% down`,
        clic: 'chapitre:' + e.c });
    } else if (e.k === 'element' && e.d0 >= 0) {
      const pris = e.av >= 0;
      marques.push({ s: e.d0 + (pris ? e.av : 0), y: 44,
        cls: pris ? 'ess-m-el' : 'ess-m-vu',
        t: `${nomFigure(e)} · ${pris ? `taken after ${e.av}s` : 'seen, never taken'}`
          + (e.mo ? ` · ${e.mo} dead click(s)` : '') + (e.rg ? ` · fought ${e.rg}×` : ''),
        clic: 'element:' + e.e });
    } else if (e.k === 'exercice') {
      marques.push({ s: fin * 0.5, y: 68, cls: 'ess-m-ex',
        t: `${e.e} · ${e.ok}/${e.sur}`, clic: 'element:' + e.e });
    } else if (e.k === 'panne') {
      marques.push({ s: fin * 0.5, y: 68, cls: 'ess-m-pa',
        t: e.m, clic: '' });
    }
  });

  const rangs = [['Chapters', 20], ['Figures', 44], ['Score / fault', 68]];
  return `<svg class="ess-svg ess-frise" viewBox="0 0 ${L} ${H}" role="img">
    ${rangs.map(([n, y]) => `<text x="0" y="${y + 4}" class="ess-rlab">${esc(n)}</text>
      <line x1="26" y1="${y}" x2="${L - 20}" y2="${y}" class="ess-rline"/>`).join('')}
    ${marques.map((m) => `<circle cx="${x(m.s)}" cy="${m.y}" r="5" class="ess-mark ${m.cls}"
        data-clic="${esc(m.clic)}" tabindex="0"><title>${esc(m.t)}</title></circle>`).join('')}
    <text x="26" y="${H - 4}" class="ess-jlab ess-start">0s</text>
    <text x="${L - 20}" y="${H - 4}" class="ess-jlab ess-end">${esc(mn(fin))}</text>
  </svg>`;
}

/* ── LES AGRÉGATS ───────────────────────────────────────────────────────── */
function parFigure(ev) {
  const fig = {};
  ev.filter((e) => e.k === 'element').forEach((e) => {
    const k = e.e || '?';
    const f = (fig[k] = fig[k] || {
      vu: new Set(), touche: new Set(), n: 0, mo: 0, rg: 0, kb: 0, re: 0, db: 0,
      av: [], gl: [], ct: {}, lieux: {}, titres: new Set(),
    });
    f.vu.add(e.uid);
    f.n += e.n || 0; f.mo += e.mo || 0; f.rg += e.rg || 0; f.kb += e.kb || 0; f.re += e.re || 0;
    if (e.db) f.db++;
    if (e.ti) f.titres.add(e.ti);
    if (e.n > 0) f.touche.add(e.uid);
    if (typeof e.av === 'number' && e.av >= 0) f.av.push(e.av);
    if (e.gl) f.gl.push(e.gl);
    Object.keys(e.ct || {}).forEach((r) => { f.ct[r] = (f.ct[r] || 0) + e.ct[r]; });
    const lieu = `${e.c || '?'} #${e.i || 0}`;
    const L = (f.lieux[lieu] = f.lieux[lieu] || { vu: new Set(), n: 0, mo: 0, rg: 0, av: [], ti: e.ti || '' });
    L.vu.add(e.uid); L.n += e.n || 0; L.mo += e.mo || 0; L.rg += e.rg || 0;
    if (typeof e.av === 'number' && e.av >= 0) L.av.push(e.av);
  });
  return fig;
}

function verdict(f) {
  if (f.touche.size === 0 && f.vu.size >= 2) return ['never touched', 1];
  if (f.n >= 4 && f.mo / f.n > 0.4) return ['taken for a button', 1];
  if (f.rg >= 2) return ['they fight it', 1];
  const m = med(f.av);
  if (m !== null && m > 15) return ['slow to find', 0];
  if (f.gl.length && med(f.gl) < 35) return ['only its first part is used', 0];
  if (f.db) return [`cut off on ${f.db} screen(s)`, 0];
  return ['', 0];
}
function gravite(f) {
  let g = 0;
  if (f.touche.size === 0 && f.vu.size >= 2) g += 100;
  if (f.n >= 4) g += 60 * (f.mo / f.n);
  g += 10 * f.rg;
  const m = med(f.av);
  if (m !== null) g += Math.min(20, m);
  if (f.gl.length) g += Math.max(0, (40 - med(f.gl)) / 3);
  if (f.db) g += 15;
  return g;
}

/* Exporte : la console des invitations dresse le meme genre de tableau,
   et deux mises en page du meme objet finiraient par ne plus se
   ressembler. */
export function table(tetes, lignes) {
  if (!lignes.length) return '<p class="ess-rien">Nothing yet.</p>';
  const th = tetes.map((t) => `<th${t[1] ? ' class="n"' : ''}>${esc(t[0])}</th>`).join('');
  const tr = lignes.map((l) => {
    const c = l.clic ? ` data-clic="${esc(l.clic)}" tabindex="0" class="ess-cliq"` : '';
    const cells = (l.cells || l);
    return `<tr${c}>` + cells.map((v, i) =>
      `<td${tetes[i][1] ? ' class="n"' : ''}>${v}</td>`).join('') + '</tr>';
  }).join('');
  return `<div class="ess-tw"><table class="ess-t"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
}
const titre = (t, note, pourquoi) =>
  `<h3 class="ess-h">${esc(t)}${note ? ` <span class="ess-hn">${esc(note)}</span>` : ''}</h3>`
  + (pourquoi ? `<p class="ess-why">${pourquoi}</p>` : '');
const carte = (n, quoi, fort) =>
  `<div class="ess-c${fort ? ' ess-c-fort' : ''}"><b>${esc(n)}</b><span>${esc(quoi)}</span></div>`;

/* ── LE TIROIR ──────────────────────────────────────────────────────────── */
function tiroir(quoi, ev, tout) {
  const [genre, clef] = String(quoi).split(/:(.+)/);
  const h = [];

  if (genre === 'element') {
    const mien = ev.filter((e) => e.k === 'element' && e.e === clef);
    const fig = parFigure(mien)[clef];
    if (!fig) return '';
    h.push(`<h4>${esc(clef)}</h4>`);
    if (fig.titres.size) {
      h.push(`<p class="ess-why">In the book as: ${[...fig.titres].map((t) =>
        `<span class="ess-tag">${esc(t)}</span>`).join(' ')}</p>`);
    }
    h.push('<p class="ess-why">Every placement of it, then every device that met one.</p>');
    h.push(table([['where'], ['title'], ['devices', 1], ['gestures', 1], ['dead', 1], ['wait', 1], ['']],
      Object.keys(fig.lieux).map((l) => {
        const L = fig.lieux[l];
        const [ch, rang] = l.split(' #');
        const livre = (mien[0] || {}).b;
        return { clic: 'lieu:' + clef + '|' + l,
          cells: [`<code>${esc(l)}</code>`, esc(L.ti || '—'), L.vu.size,
            L.n || '<span class="ess-mal">0</span>', L.mo || '',
            med(L.av) === null ? '' : med(L.av) + 's', lienLivre(livre, ch, rang)] };
      })));
    h.push(table([['device'], ['where'], ['gestures', 1], ['wait', 1], ['dead', 1], ['fight', 1], ['range', 1]],
      mien.map((e) => ({ clic: 'appareil:' + e.uid,
        cells: [`<span class="ess-tag">${esc(court(e.uid))}</span>`, `<code>${esc(e.c)} #${e.i || 0}</code>`,
          e.n, e.av >= 0 ? e.av + 's' : '—', e.mo || '', e.rg || '', e.gl ? e.gl + '%' : ''] }))));

  } else if (genre === 'chapitre') {
    const mien = ev.filter((e) => e.k === 'chapitre' && e.c === clef);
    const nom = (mien[0] && mien[0].n) || clef;
    h.push(`<h4>${esc(nom)} <span class="ess-hn">${esc(clef)}</span>
      ${lienLivre((mien[0] || {}).b, clef)}</h4>`);
    h.push('<p class="ess-why">How far down each device got, and how long it stayed. '
      + 'A low depth with a long stay is someone stuck near the top.</p>');
    h.push(table([['device'], ['reached at', 1], ['stayed', 1], ['got to', 1]],
      mien.sort((a, b) => (b.pr || 0) - (a.pr || 0)).map((e) => ({ clic: 'appareil:' + e.uid,
        cells: [`<span class="ess-tag">${esc(court(e.uid))}</span>`,
          e.d0 >= 0 ? mn(e.d0) : '—', mn(e.s || 0),
          `<span class="ess-jauge"><i style="inline-size:${Math.max(2, e.pr || 0)}%"></i></span> ${e.pr || 0}%`] }))));
    const dedans = ev.filter((e) => e.k === 'element' && e.c === clef);
    if (dedans.length) {
      h.push('<p class="ess-why" style="margin-block-start:1rem">The figures inside it.</p>');
      const f2 = parFigure(dedans);
      h.push(table([['figure'], ['seen', 1], ['touched', 1], ['dead', 1], ['verdict']],
        Object.keys(f2).map((k) => {
          const [v, fort] = verdict(f2[k]);
          return { clic: 'element:' + k,
            cells: [esc(k), f2[k].vu.size, f2[k].touche.size, f2[k].mo || '',
              v ? `<span class="${fort ? 'ess-mal' : 'ess-bof'}">${esc(v)}</span>` : ''] };
        })));
    }

  } else if (genre === 'appareil') {
    const p = tout.find((x) => x.uid === clef);
    const mien = ev.filter((e) => e.uid === clef);
    const a = (p && p.profil.appareil) || {};
    h.push(`<h4>Device ${esc(court(clef))}</h4>`);
    h.push(`<p class="ess-why">${esc(`${a.famille || '?'} · screen ${a.ecran || '?'} · window ${a.fenetre || '?'}`
      + `${a.reseau ? ' · ' + a.reseau : ''}${a.tactile ? ' · touch' : ''} · ${a.nav || '?'} · ${a.langue || '?'}`)}</p>`);
    const seances = [...new Set(mien.map((e) => e.q))];
    h.push(table([['session'], ['when'], ['read', 1], ['chapters', 1], ['figures taken', 1]],
      seances.map((q) => {
        const s = mien.filter((e) => e.q === q);
        return { clic: 'seance:' + q,
          cells: [`<code>${esc(q)}</code>`, esc(new Date(Math.min(...s.map((e) => e.t))).toISOString().slice(0, 16).replace('T', ' ')),
            mn(s.filter((e) => e.k === 'chapitre').reduce((x, e) => x + (e.s || 0), 0)),
            new Set(s.filter((e) => e.k === 'chapitre').map((e) => e.c)).size,
            s.filter((e) => e.k === 'element' && e.n > 0).length] };
      })));
    seances.forEach((q) => {
      h.push(`<p class="ess-why" style="margin-block-start:.9rem"><code>${esc(q)}</code></p>`);
      h.push(frise(mien, q));
    });

  } else if (genre === 'seance') {
    h.push(`<h4>Session ${esc(clef)}</h4>`);
    h.push('<p class="ess-why">In order, from the moment the page opened.</p>');
    h.push(frise(ev, clef));
    h.push(table([['at', 1], ['what'], ['detail']],
      ev.filter((e) => e.q === clef).sort((a, b) => (a.d0 ?? 0) - (b.d0 ?? 0)).map((e) => [
        e.d0 >= 0 ? mn(e.d0) : '—', esc(e.k),
        esc(e.k === 'element' ? nomFigure(e) : e.k === 'chapitre' ? (e.n || e.c) : (e.m || e.p || '')),
      ])));

  } else if (genre === 'lieu') {
    const [type, ou] = clef.split('|');
    const mien = ev.filter((e) => e.k === 'element' && e.e === type && `${e.c} #${e.i || 0}` === ou);
    const [chLieu, rangLieu] = ou.split(' #');
    h.push(`<h4>${esc(type)} <span class="ess-hn">${esc(ou)}</span>
      ${lienLivre((mien[0] || {}).b, chLieu, rangLieu)}</h4>`);
    if (mien[0] && mien[0].ti) h.push(`<p class="ess-why">${esc(mien[0].ti)}</p>`);
    h.push(table([['device'], ['seen for', 1], ['wait', 1], ['gestures', 1], ['dead', 1], ['fight', 1], ['parts pressed']],
      mien.map((e) => ({ clic: 'appareil:' + e.uid,
        cells: [`<span class="ess-tag">${esc(court(e.uid))}</span>`, mn(e.vu || 0),
          e.av >= 0 ? e.av + 's' : '—', e.n, e.mo || '', e.rg || '',
          Object.keys(e.ct || {}).map((r) => `<span class="ess-tag">${esc(r)} ${e.ct[r]}</span>`).join(' ')] }))));
  }

  return h.join('');
}

/* ── LE RAPPORT ─────────────────────────────────────────────────────────── */
function corps(ev, tout, filtre) {
  const o = [];

  const seances = new Set(ev.map((e) => e.uid + '|' + e.q));
  const parAppareil = {};
  ev.forEach((e) => { (parAppareil[e.uid] = parAppareil[e.uid] || new Set()).add(e.q); });
  const revenus = Object.values(parAppareil).filter((s) => s.size > 1).length;
  const secondes = ev.filter((e) => e.k === 'chapitre').reduce((a, e) => a + (e.s || 0), 0);
  const total = Math.max(0, ...ev.filter((e) => e.k === 'fin').map((e) => e.nf || 0));
  const rencontrees = new Set(ev.filter((e) => e.k === 'element').map((e) => e.c + '#' + e.i)).size;

  o.push('<div class="ess-cartes">'
    + carte(Object.keys(parAppareil).length, 'devices')
    + carte(seances.size, 'sessions')
    + carte(`${revenus} / ${Object.keys(parAppareil).length}`, 'came back', revenus > 0)
    + carte(mn(secondes), 'read, in total')
    + (total ? carte(`${rencontrees} / ${total}`, 'figures reached') : '')
    + carte(ev.filter((e) => e.k === 'panne').length, 'errors')
    + '</div>');

  /* ── quand ── */
  const jours = {};
  ev.filter((e) => e.k === 'ouvre').forEach((e) => { jours[jour(e.t)] = (jours[jour(e.t)] || 0) + 1; });
  o.push(titre('When they read', '— click a day to look at it alone',
    'Sessions per day. A trial arrives in waves: the day the teacher mentioned it, then the night '
    + 'before a test. The shape of that tells you what the book is actually for.'));
  o.push(colonnes(Object.keys(jours).sort().map((j) => ({ j, v: jours[j] }))));

  /* ── le tunnel ── */
  const chap = {};
  ev.filter((e) => e.k === 'chapitre').forEach((e) => {
    const k = e.c;
    const c = (chap[k] = chap[k] || { nom: e.n || e.c, s: 0, qui: new Set(), pr: [], d0: [] });
    c.s += e.s || 0; c.qui.add(e.uid);
    if (e.pr) c.pr.push(e.pr);
    if (e.d0 >= 0) c.d0.push(e.d0);
  });
  o.push(titre('Where the reading stops', '— click a chapter',
    'The bar is how many devices reached the chapter; the dot is how far down the median one got. '
    + 'A tall bar with an early dot is a chapter people open and abandon — which is a different '
    + 'problem from one nobody reaches at all.'));
  o.push(barres(Object.keys(chap).sort().map((k) => {
    const c = chap[k];
    const p = med(c.pr) || 0;
    return { nom: c.nom, v: c.qui.size, txt: `${c.qui.size} · ${mn(c.s)} · ${p}% down`,
      marque: c.qui.size * p / 100, marqueTitre: `median depth ${p}%`, clic: 'chapitre:' + k };
  })));

  /* ── les figures ── */
  const fig = parFigure(ev);
  o.push(titre('Every element, graded', '— click a row to see each one',
    'Worst first. <b>Wait</b> is the median delay between a figure appearing and the first gesture. '
    + '<b>Dead</b> counts presses after which nothing inside it changed — the strongest signal here, '
    + 'because it means the drawing promised something it does not do. <b>Fight</b> is three presses '
    + 'in one spot inside a second. <b>Range</b> is how much of a slider was explored.'));
  o.push(table([['element'], ['seen', 1], ['touched', 1], ['gestures', 1], ['wait', 1],
    ['dead', 1], ['fight', 1], ['range', 1], ['verdict']],
    Object.keys(fig).sort((a, b) => gravite(fig[b]) - gravite(fig[a])).map((k) => {
      const f = fig[k];
      const [v, fort] = verdict(f);
      const nom = f.titres.size === 1 ? `<b>${esc(k)}</b> <span class="ess-rien">${esc([...f.titres][0])}</span>`
        : `<b>${esc(k)}</b>`;
      return { clic: 'element:' + k,
        cells: [nom, f.vu.size, f.touche.size, f.n,
          med(f.av) === null ? '<span class="ess-rien">—</span>' : med(f.av) + 's',
          f.mo || '', f.rg || '', f.gl.length ? med(f.gl) + '%' : '',
          v ? `<span class="${fort ? 'ess-mal' : 'ess-bof'}">${esc(v)}</span>` : ''] };
    })));

  /* ── les séances ── */
  o.push(titre('Session by session', '— click one for its timeline',
    'Each reading, in order. The timeline is the only view that shows a sequence, and a sequence is '
    + 'what no total can give you.'));
  const rangees = [];
  Object.keys(parAppareil).forEach((uid) => {
    [...parAppareil[uid]].forEach((q) => {
      const s = ev.filter((e) => e.uid === uid && e.q === q);
      if (!s.length) return;
      rangees.push({ clic: 'seance:' + q, t: Math.min(...s.map((e) => e.t)), cells: [
        `<span class="ess-tag">${esc(court(uid))}</span>`,
        esc(new Date(Math.min(...s.map((e) => e.t))).toISOString().slice(0, 16).replace('T', ' ')),
        mn(s.filter((e) => e.k === 'chapitre').reduce((a, e) => a + (e.s || 0), 0)),
        new Set(s.filter((e) => e.k === 'chapitre').map((e) => e.c)).size,
        s.filter((e) => e.k === 'element' && e.n > 0).length,
        s.filter((e) => e.k === 'panne').length || '',
      ] });
    });
  });
  o.push(table([['device'], ['started'], ['read', 1], ['chapters', 1], ['figures taken', 1], ['errors', 1]],
    rangees.sort((a, b) => b.t - a.t)));

  /* ── ce qui casse ── */
  const pannes = {};
  ev.filter((e) => e.k === 'panne').forEach((e) => {
    const k = (e.m || '?') + (e.f ? `  (${e.f}:${e.l})` : '');
    (pannes[k] = pannes[k] || { n: 0, qui: new Set() });
    pannes[k].n++; pannes[k].qui.add(e.uid);
  });
  o.push(titre('What broke', '',
    'On their phones, on their networks. No pupil will ever report these — they will assume it was them.'));
  o.push(table([['error'], ['devices', 1], ['times', 1]],
    Object.entries(pannes).sort((a, b) => b[1].n - a[1].n)
      .map(([k, v]) => [`<code>${esc(k)}</code>`, v.qui.size, v.n])));

  /* ── les scores ── */
  const ex = ev.filter((e) => e.k === 'exercice');
  if (ex.length) {
    const par = {};
    ex.forEach((e) => {
      const k = `${e.e || '?'} · ${e.c || ''}`;
      (par[k] = par[k] || { ok: 0, sur: 0, n: 0 });
      par[k].ok += e.ok; par[k].sur += e.sur; par[k].n++;
    });
    o.push(titre('Exercises', '',
      'Score only, never the answers. Below half, the material is above the level — or the question '
      + 'is unclear.'));
    o.push(table([['exercise'], ['attempts', 1], ['average', 1]],
      Object.entries(par).map(([k, v]) =>
        [esc(k), v.n, Math.round(100 * v.ok / Math.max(1, v.sur)) + '%'])
        .sort((a, b) => parseInt(a[2]) - parseInt(b[2]))));
  }

  /* ── le brut ── */
  o.push(titre('Every event', '— the raw rows, filter with the box',
    'Nothing is hidden from you here: this is exactly what arrived, one row per measurement. '
    + 'The tables above are only ways of adding these up.'));
  o.push('<input class="ess-filtre" id="ess-cherche" placeholder="filter — type an element, a chapter, a device…">');
  o.push('<div id="ess-brut">' + brut(ev, '') + '</div>');

  return o.join('');
}

export function brut(ev, q) {
  const bas = String(q || '').toLowerCase();
  const gardees = ev.filter((e) => !bas || JSON.stringify(e).toLowerCase().includes(bas));
  const montrees = gardees.slice(0, 400);
  return (gardees.length > montrees.length
    ? `<p class="ess-rien">${gardees.length} rows, showing the first ${montrees.length}.</p>` : '')
    + table([['when'], ['device'], ['session'], ['what'], ['chapter'], ['element'], ['numbers']],
      montrees.sort((a, b) => b.t - a.t).map((e) => {
        const nb = Object.keys(e).filter((k) =>
          ['n', 's', 'av', 'mo', 'rg', 'kb', 'rv', 'gl', 'db', 're', 'pr', 'd0', 'ok', 'sur', 'vu', 'i', 'nf', 'nc']
            .includes(k) && e[k] !== undefined && e[k] !== 0 && e[k] !== -1)
          .map((k) => `<span class="ess-tag">${k} ${esc(e[k])}</span>`).join(' ');
        return { clic: e.k === 'element' ? 'element:' + e.e : e.k === 'chapitre' ? 'chapitre:' + e.c : 'seance:' + e.q,
          cells: [esc(heure(e.t)), `<span class="ess-tag">${esc(court(e.uid))}</span>`,
            `<code>${esc(e.q)}</code>`, esc(e.k), esc(e.c || ''),
            esc(e.k === 'element' ? nomFigure(e) : (e.m || '')), nb] };
      }));
}

/* ── LE MONTAGE ─────────────────────────────────────────────────────────── */
export function monter(tout, hote, tiroirHote) {
  const tousEv = evenements(tout);
  let filtre = null;

  function ev() {
    if (!filtre) return tousEv;
    const [g, c] = String(filtre).split(/:(.+)/);
    if (g === 'jour') return tousEv.filter((e) => jour(e.t) === c);
    if (g === 'chapitre') return tousEv.filter((e) => e.c === c || e.k === 'ouvre' || e.k === 'fin');
    if (g === 'appareil') return tousEv.filter((e) => e.uid === c);
    if (g === 'seance') return tousEv.filter((e) => e.q === c);
    if (g === 'element') return tousEv.filter((e) => e.e === c || e.k !== 'element');
    return tousEv;
  }

  function peindre() {
    const chips = filtre
      ? `<div class="ess-chips">Looking at <span class="ess-chip">${esc(filtre)}
           <button data-vider aria-label="clear">×</button></span></div>`
      : '';
    hote.innerHTML = chips + corps(ev(), tout, filtre);
  }

  function ouvrirTiroir(quoi) {
    const h = tiroir(quoi, tousEv, tout);
    if (!h) return;
    tiroirHote.innerHTML = `<div class="ess-tiroir-in">
      <button class="ess-fermer" data-fermer aria-label="close">×</button>
      ${h}
      <p class="ess-why" style="margin-block-start:1rem">
        <button class="btn btn-2" data-filtre="${esc(quoi)}">Show only this in the report</button></p>
    </div>`;
    tiroirHote.classList.add('on');
    tiroirHote.scrollTop = 0;
  }

  hote.addEventListener('click', (e) => {
    if (e.target.closest('[data-vider]')) { filtre = null; peindre(); return; }
    const c = e.target.closest('[data-clic]');
    if (c && c.getAttribute('data-clic')) ouvrirTiroir(c.getAttribute('data-clic'));
  });
  hote.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const c = e.target.closest && e.target.closest('[data-clic]');
    if (c && c.getAttribute('data-clic')) { e.preventDefault(); ouvrirTiroir(c.getAttribute('data-clic')); }
  });
  hote.addEventListener('input', (e) => {
    if (e.target.id !== 'ess-cherche') return;
    const d = document.getElementById('ess-brut');
    if (d) d.innerHTML = brut(ev(), e.target.value);
  });
  tiroirHote.addEventListener('click', (e) => {
    if (e.target.closest('[data-fermer]')) { tiroirHote.classList.remove('on'); return; }
    const f = e.target.closest('[data-filtre]');
    if (f) { filtre = f.getAttribute('data-filtre'); tiroirHote.classList.remove('on'); peindre(); return; }
    const c = e.target.closest('[data-clic]');
    if (c && c.getAttribute('data-clic')) ouvrirTiroir(c.getAttribute('data-clic'));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') tiroirHote.classList.remove('on');
  });

  peindre();
}

/* Le même jeu, à plat, pour un tableur. Une colonne par champ, jamais un objet
   imbriqué : c'est ce qui permet d'ouvrir le fichier et de trier tout de
   suite, sans rien préparer. */
export function csv(tout) {
  const ev = evenements(tout);
  const cols = ['code', 'device', 'session', 'when', 'what', 'book', 'chapter', 'element', 'title',
    'position', 'seconds', 'depth', 'reached_at', 'gestures', 'wait', 'dead', 'fight', 'keyboard',
    'range', 'reversals', 'returns', 'cutoff', 'seen_for', 'right', 'outof', 'message'];
  const v = (x) => (x === undefined || x === null ? '' : x);
  const l = ev.map((e) => [e.code, e.uid, e.q, new Date(e.t).toISOString(), e.k, v(e.b), v(e.c),
    v(e.e), v(e.ti), v(e.i), v(e.s), v(e.pr), v(e.d0), v(e.n), v(e.av), v(e.mo), v(e.rg), v(e.kb),
    v(e.gl), v(e.rv), v(e.re), v(e.db), v(e.vu), v(e.ok), v(e.sur), (e.m || '').replace(/[\r\n]/g, ' ')]);
  return [cols.join(','), ...l.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(','))]
    .join('\n');
}
