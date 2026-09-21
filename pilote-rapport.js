/* LE RAPPORT DE L'ESSAI — les chiffres, et ce qu'ils veulent dire.
 *
 * Un module à part, et pas un morceau de la console, pour une raison précise :
 * ce calcul est la seule chose du projet qui transforme des clics en décisions,
 * et il ne doit exister qu'une fois. La version d'avant vivait à l'intérieur
 * d'un script local ; le jour où la console est arrivée sur le site, il y
 * aurait eu deux copies du même tableau, et c'est toujours la copie qu'on ne
 * regarde pas qui garde la bonne formule.
 *
 * Il ne dessine rien lui-même — il rend du HTML avec des classes `ess-` et
 * laisse la page décider de quoi ça a l'air. C'est ce qui lui permet d'être
 * juste et d'être beau sans que les deux se gênent.
 *
 * ── CE QU'IL SAIT RECONNAÎTRE ────────────────────────────────────────────
 *
 * Six diagnostics, et chacun est une PHRASE plutôt qu'une note. « 0,31 » ne
 * dit pas quoi faire lundi matin ; « on la prend pour un bouton » se corrige
 * dans l'après-midi.
 *
 *   never touched            vue par plusieurs, prise par personne
 *   taken for a button       on appuie, et rien ne bouge
 *   they fight it            trois appuis au même endroit en une seconde
 *   slow to find             de longues secondes avant le premier geste
 *   only its first part…     un curseur exploré sur un tiers de sa course
 *   cut off on N screens     plus large que l'écran, sur de vrais téléphones
 */

/* Les lots peuvent arriver deux fois — c'est le prix de ne jamais rien perdre
   quand le réseau tombe. On dédoublonne donc, et LA CLEF DOIT PORTER TOUT CE
   QUI DISTINGUE DEUX ÉVÉNEMENTS.
   Une première version prenait « le chapitre OU la figure », et perdait des
   mesures pour de bon : à la clôture, les figures sont dépliées dans une seule
   boucle synchrone, donc elles portent toutes le MÊME horodatage à la
   milliseconde près. Sept figures d'un même chapitre devenaient une. */
export function evenements(tout) {
  const vus = new Set(), out = [];
  for (const p of tout) {
    for (const l of p.lots) {
      for (const e of (l.ev || [])) {
        const cle = [p.uid, e.q, e.t, e.k, e.b || '', e.c || '', e.e || '', e.i || 0].join('|');
        if (vus.has(cle)) continue;
        vus.add(cle);
        out.push({ ...e, uid: p.uid, code: l.code || p.profil.code || '?' });
      }
    }
  }
  return out;
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const med = (a) => (a.length ? a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
const mn = (s) => (s < 60 ? Math.round(s) + 's' : Math.round(s / 60) + ' min');

function table(tetes, lignes) {
  if (!lignes.length) return '<p class="ess-rien">Nothing yet.</p>';
  const th = tetes.map((t) => `<th${t[1] ? ' class="n"' : ''}>${esc(t[0])}</th>`).join('');
  const tr = lignes.map((l) => '<tr>' + l.map((c, i) =>
    `<td${tetes[i][1] ? ' class="n"' : ''}>${c}</td>`).join('') + '</tr>').join('');
  return `<div class="ess-tw"><table class="ess-t"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
}
const titre = (t, note, pourquoi) =>
  `<h3 class="ess-h">${esc(t)}${note ? ` <span class="ess-hn">${esc(note)}</span>` : ''}</h3>`
  + (pourquoi ? `<p class="ess-why">${pourquoi}</p>` : '');
const carte = (n, quoi, fort) =>
  `<div class="ess-c${fort ? ' ess-c-fort' : ''}"><b>${esc(n)}</b><span>${esc(quoi)}</span></div>`;

/* ── LE DIAGNOSTIC D'UNE FIGURE ─────────────────────────────────────────── */
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

export function rendreRapport(tout) {
  const ev = evenements(tout);
  if (!ev.length) return '';
  const o = [];

  /* ── en un coup d'œil ── */
  const seances = new Set(ev.map((e) => e.uid + '|' + e.q));
  const parAppareil = {};
  ev.forEach((e) => { (parAppareil[e.uid] = parAppareil[e.uid] || new Set()).add(e.q); });
  const revenus = Object.values(parAppareil).filter((s) => s.size > 1).length;
  const secondes = ev.filter((e) => e.k === 'chapitre').reduce((a, e) => a + (e.s || 0), 0);
  const total = Math.max(0, ...ev.filter((e) => e.k === 'fin').map((e) => e.nf || 0));
  const rencontrees = new Set(ev.filter((e) => e.k === 'element').map((e) => e.c + '#' + e.i)).size;

  o.push('<div class="ess-cartes">'
    + carte(tout.length, 'devices')
    + carte(seances.size, 'sessions')
    + carte(`${revenus} / ${tout.length}`, 'came back', revenus > 0)
    + carte(mn(secondes), 'read, in total')
    + (total ? carte(`${rencontrees} / ${total}`, 'figures reached') : '')
    + carte(ev.filter((e) => e.k === 'panne').length, 'errors')
    + '</div>');

  /* ── qui est revenu ── */
  o.push(titre('Did they come back?', '— the only number that is not flattery',
    'One device, one pupil. A second session means they opened it again without being asked. '
    + 'Everything below explains this number.'));
  o.push(table([['group'], ['device'], ['sessions', 1], ['read', 1], ['last seen'], ['phone']],
    tout.map((p) => {
      const s = parAppareil[p.uid] || new Set();
      const lu = ev.filter((e) => e.uid === p.uid && e.k === 'chapitre').reduce((a, e) => a + e.s, 0);
      const a = p.profil.appareil || {};
      const vu = p.profil.vu && p.profil.vu.toDate ? p.profil.vu.toDate() : null;
      return [esc(p.profil.code || '?'), `<span class="ess-tag">${esc(p.uid.slice(0, 6))}</span>`,
        s.size > 1 ? `<b>${s.size}</b>` : s.size, mn(lu),
        vu ? esc(vu.toISOString().slice(0, 16).replace('T', ' ')) : '—',
        esc(`${a.famille || '?'} · ${a.ecran || '?'}${a.reseau ? ' · ' + a.reseau : ''}`)];
    }).sort((x, y) => parseInt(String(y[2]).replace(/\D/g, '') || 0) - parseInt(String(x[2]).replace(/\D/g, '') || 0))));

  /* ── où ils s'arrêtent ── */
  o.push(titre('Where the reading stops', '',
    'Minutes per chapter, and how many devices reached it. A chapter nobody reaches is not a bad '
    + 'chapter — it is a chapter behind something that stopped them.'));
  const chap = {};
  ev.filter((e) => e.k === 'chapitre').forEach((e) => {
    const k = `${e.b || '?'} · ${e.n || e.c}`;
    (chap[k] = chap[k] || { s: 0, qui: new Set() });
    chap[k].s += e.s || 0; chap[k].qui.add(e.uid);
  });
  const maxS = Math.max(1, ...Object.values(chap).map((c) => c.s));
  o.push(table([['chapter'], ['devices', 1], ['total', 1], ['', 0]],
    Object.entries(chap).sort((a, b) => b[1].s - a[1].s).map(([k, c]) =>
      [esc(k), c.qui.size, mn(c.s),
        `<span class="ess-bar" style="inline-size:${Math.round(140 * c.s / maxS)}px"></span>`])));

  /* ── LE TABLEAU QUI COMPTE ── */
  const fig = {};
  ev.filter((e) => e.k === 'element').forEach((e) => {
    const k = e.e || '?';
    const f = (fig[k] = fig[k] || {
      vu: new Set(), touche: new Set(), n: 0, mo: 0, rg: 0, kb: 0, re: 0, db: 0,
      av: [], gl: [], ct: {}, lieux: {},
    });
    f.vu.add(e.uid);
    f.n += e.n || 0; f.mo += e.mo || 0; f.rg += e.rg || 0; f.kb += e.kb || 0; f.re += e.re || 0;
    if (e.db) f.db++;
    if (e.n > 0) f.touche.add(e.uid);
    if (typeof e.av === 'number' && e.av >= 0) f.av.push(e.av);
    if (e.gl) f.gl.push(e.gl);
    Object.keys(e.ct || {}).forEach((r) => { f.ct[r] = (f.ct[r] || 0) + e.ct[r]; });
    const lieu = `${e.c || '?'} #${e.i || 0}`;
    const L = (f.lieux[lieu] = f.lieux[lieu] || { vu: new Set(), n: 0, mo: 0, rg: 0, av: [] });
    L.vu.add(e.uid); L.n += e.n || 0; L.mo += e.mo || 0; L.rg += e.rg || 0;
    if (typeof e.av === 'number' && e.av >= 0) L.av.push(e.av);
  });

  o.push(titre('Every element, graded', '— read this one',
    'One row per element type, worst first. <b>Seen</b> and <b>touched</b> are devices. The rest say '
    + 'why. <b>Wait</b> is the median delay between a figure appearing and the first gesture — one that '
    + 'announces itself is taken in a few seconds. <b>Dead</b> counts presses after which nothing inside '
    + 'the figure changed: the strongest signal here, because it means the drawing promised something it '
    + 'does not do. <b>Fight</b> is three presses in the same spot inside a second. <b>Range</b> is how '
    + 'much of a slider was actually explored.'));
  o.push(table([['element'], ['seen', 1], ['touched', 1], ['gestures', 1], ['wait', 1],
    ['dead', 1], ['fight', 1], ['range', 1], ['verdict']],
    Object.keys(fig).sort((a, b) => gravite(fig[b]) - gravite(fig[a])).map((k) => {
      const f = fig[k];
      const [v, fort] = verdict(f);
      return [`<b>${esc(k)}</b>`, f.vu.size, f.touche.size, f.n,
        med(f.av) === null ? '<span class="ess-rien">—</span>' : med(f.av) + 's',
        f.mo || '', f.rg || '', f.gl.length ? med(f.gl) + '%' : '',
        v ? `<span class="${fort ? 'ess-mal' : 'ess-bof'}">${esc(v)}</span>` : ''];
    })));

  /* ── la même figure, placée à deux endroits ── */
  const lieux = [];
  Object.keys(fig).forEach((k) => {
    Object.keys(fig[k].lieux).forEach((l) => {
      const L = fig[k].lieux[l];
      lieux.push({ e: k, l, vu: L.vu.size, n: L.n, mo: L.mo, rg: L.rg, av: med(L.av) });
    });
  });
  const pires = lieux.filter((x) => x.n === 0 || x.mo > 0 || x.rg > 0)
    .sort((a, b) => (b.mo * 4 + b.rg * 6 + (b.n === 0 ? 5 * b.vu : 0))
      - (a.mo * 4 + a.rg * 6 + (a.n === 0 ? 5 * a.vu : 0))).slice(0, 14);
  o.push(titre('The worst placements', '',
    'The same element can work in one chapter and fail in the next — wrong size, wrong moment, nothing '
    + 'above it saying to try. This is the instance, not the type: chapter and position.'));
  o.push(table([['element'], ['where'], ['devices', 1], ['gestures', 1], ['dead', 1], ['wait', 1]],
    pires.map((x) => [`<b>${esc(x.e)}</b>`, `<span class="ess-rien">${esc(x.l)}</span>`, x.vu,
      x.n || '<span class="ess-mal">0</span>', x.mo || '', x.av === null ? '' : x.av + 's'])));

  /* ── quelles parties sont pressées ── */
  o.push(titre('Which part they press', '',
    'The class of the control, never its wording. A figure whose most-pressed part is <code>.</code> — '
    + 'the artwork itself, no control — has buttons that are not reading as buttons.'));
  o.push(table([['element'], ['parts pressed, most first']],
    Object.keys(fig).filter((k) => Object.keys(fig[k].ct).length).map((k) => {
      const c = fig[k].ct;
      const noms = Object.keys(c).sort((a, b) => c[b] - c[a]).slice(0, 6);
      return [`<b>${esc(k)}</b>`,
        noms.map((r) => `<span class="ess-tag">${esc(r)} ${c[r]}</span>`).join(' ')];
    })));

  /* ── les scores ── */
  const ex = ev.filter((e) => e.k === 'exercice');
  if (ex.length) {
    o.push(titre('Exercises', '',
      'Score only, never the answers. Below half, the material is above the level — or the question is '
      + 'unclear.'));
    const par = {};
    ex.forEach((e) => {
      const k = `${e.e || '?'} · ${e.c || ''}`;
      (par[k] = par[k] || { ok: 0, sur: 0, n: 0 });
      par[k].ok += e.ok; par[k].sur += e.sur; par[k].n++;
    });
    o.push(table([['exercise'], ['attempts', 1], ['average', 1]],
      Object.entries(par).map(([k, v]) =>
        [esc(k), v.n, Math.round(100 * v.ok / Math.max(1, v.sur)) + '%'])
        .sort((a, b) => parseInt(a[2]) - parseInt(b[2]))));
  }

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

  return o.join('');
}

/* Le même jeu, à plat, pour un tableur. Une colonne par champ, jamais un objet
   imbriqué : c'est ce qui permet d'ouvrir le fichier et de trier tout de
   suite, sans rien préparer. */
export function csv(tout) {
  const ev = evenements(tout);
  const cols = ['code', 'device', 'session', 'when', 'what', 'book', 'chapter', 'element',
    'position', 'seconds', 'gestures', 'wait', 'dead', 'fight', 'keyboard', 'range',
    'reversals', 'returns', 'cutoff', 'right', 'outof', 'message'];
  const l = ev.map((e) => [e.code, e.uid, e.q, new Date(e.t).toISOString(), e.k, e.b || '',
    e.c || '', e.e || '', e.i === undefined ? '' : e.i, e.s === undefined ? '' : e.s,
    e.n === undefined ? '' : e.n, e.av === undefined ? '' : e.av, e.mo || '', e.rg || '',
    e.kb || '', e.gl || '', e.rv || '', e.re || '', e.db || '',
    e.ok === undefined ? '' : e.ok, e.sur === undefined ? '' : e.sur, (e.m || '').replace(/[\r\n]/g, ' ')]);
  return [cols.join(','), ...l.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(','))]
    .join('\n');
}
