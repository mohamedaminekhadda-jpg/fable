// The catalogue.
//
// Everything on screen comes from one fetch of /api/catalogue, which is itself
// just a walk of the sims/ folder. There is no state to get out of step with the
// disk: reload the page and you are looking at what is actually there.

import { vignette } from './vignettes.js';
import { BRAND, marque, blocMarque } from './brand.js';

// L'enseigne est montée depuis brand.js, jamais recopiée dans index.html : une
// marque écrite à deux endroits est une marque qui finit par différer.
document.getElementById('marque').outerHTML = blocMarque({ href: '#/' });

const view = document.getElementById('view');
const q = document.getElementById('q');
const root = document.documentElement;

/* theme — the same key the lab uses, so switching in one carries to the other */
const saved = localStorage.getItem('sfy-theme');
if (saved) root.setAttribute('data-theme', saved);
else if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-theme', 'dark');
document.getElementById('theme').addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('sfy-theme', next);
});

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Accent-insensitive matching: nobody types "géométrie" with the accent when
// they are searching in a hurry.
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

let DATA = { subjects: [], sims: [], counts: {}, problems: [], levels: [] };

async function load() {
  const r = await fetch('catalogue.json');
  DATA = await r.json();
  cycleDuFoyer();
  render();
}

/* Tant qu'aucune matière n'est ouverte, le foyer de la marque passe en revue les
   couleurs des matières : l'enseigne montre ce qu'il y a sur les étagères, puis
   se fixe dès qu'on en choisit une. Les images sont fabriquées à partir de
   DATA.subjects et jamais recopiées ici — ajouter une matière ajoute une étape
   au cycle, sans toucher à cette fonction. */
function cycleDuFoyer() {
  const suite = (nuit) => {
    const n = DATA.subjects.length;
    if (!n) return '';
    const pas = 100 / n;
    const teinte = (s) => (nuit ? (s.colourDark || s.colour) : s.colour);
    // chaque matière tient les trois quarts de son pas, le reste est le fondu
    const arrets = DATA.subjects.map((s, i) =>
      `${(i * pas).toFixed(2)}%,${(i * pas + pas * 0.74).toFixed(2)}%{fill:${teinte(s)}}`);
    arrets.push(`100%{fill:${teinte(DATA.subjects[0])}}`);
    return arrets.join(' ');
  };
  const st = document.getElementById('foyer-cycle') || document.createElement('style');
  st.id = 'foyer-cycle';
  st.textContent = `@keyframes foyer-jour{${suite(false)}}@keyframes foyer-nuit{${suite(true)}}`;
  document.head.appendChild(st);
}

const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);

/* Une matière pose ses DEUX teintes et laisse le thème trancher (voir le bloc
   [data-sub] dans style.css). Poser --sub directement figerait la carte dans la
   teinte du papier clair, et la nuit toutes les matières se ressembleraient. */
const teintes = (s) => `data-sub="${esc(s.id)}" style="--sub-l:${esc(s.colour)};`
  + `--sub-d:${esc(s.colourDark || s.colour)}"`;

/* La réglure graduée qui compte : un cran par expérience, au pas constant, donc
   sa longueur EST le nombre. Au-delà de ce que la colonne peut tenir on retombe
   sur la réglure ordinaire : mieux vaut un ornement muet qu'un compte faux. */
function reglure(n, classes, pas, large) {
  const compte = n > 0 && n * pas <= large;
  return `<div class="tickrule ${classes}${compte ? ' compte' : ''}"`
    + (compte ? ` style="--n:${n}" title="${n} ${n === 1 ? 'expérience' : 'expériences'}"` : '')
    + '></div>';
}

function subjectCard(s) {
  const n = DATA.counts[s.id] || 0;
  return `<a class="subject" href="#/${s.id}" ${teintes(s)}>
    <div class="subject-top">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${s.icon}</svg>
      <h3>${esc(s.name)}</h3>
    </div>
    <p>${esc(s.tagline)}</p>
    ${reglure(n, '', 11, 200)}
    <div class="count">${n ? `<b>${n}</b> ${n === 1 ? 'simulation' : 'simulations'}` : 'aucune simulation pour l’instant'}</div>
  </a>`;
}

function simCard(sim) {
  const s = DATA.subjects.find((x) => x.id === sim.subject)
    || { id: sim.subject, colour: '#888', short: sim.subject };
  const chips = [
    ...(sim.levels || []).map((l) => (DATA.levels.find((x) => x.id === l) || { name: l }).name),
    ...(sim.minutes ? [sim.minutes + ' min'] : []),
  ];
  return `<a class="sim" href="s/${esc(sim.subject)}/${esc(sim.id)}/index.html" ${teintes(s)}>
    <div class="sim-vig-band">${vignette(sim)}</div>
    <div class="sim-kicker"><i></i>${esc(s.short)}</div>
    <h3>${esc(sim.title)}</h3>
    ${sim.summary ? `<p>${esc(sim.summary)}</p>` : '<p></p>'}
    ${sim.look ? `<div class="sim-look">${esc(sim.look)}</div>` : ''}
    ${chips.length ? `<div class="chips">${chips.map((c) => `<span class="chip min">${esc(c)}</span>`).join('')}</div>` : ''}
  </a>`;
}

function problemsBlock() {
  if (!DATA.problems.length) return '';
  return `<div class="problems">
    <h4>${plural(DATA.problems.length, 'dossier ignoré dans sims/', 'dossiers ignorés dans sims/')}</h4>
    <ul>${DATA.problems.map((p) => `<li><code>${esc(p.where)}</code> — ${esc(p.msg)}</li>`).join('')}</ul>
  </div>`;
}

/* The empty state is a real screen, not a shrug. Someone opening this on day
   one should be able to write their first simulation from what it says. */
function emptyBench(subject) {
  const where = subject ? `sims/${subject.id}/` : 'sims/&lt;matière&gt;/';
  return `<div class="empty">
    <h3>Rien sur la paillasse${subject ? ' en ' + esc(subject.short.toLowerCase()) : ''}</h3>
    <p>La bibliothèque est vide : le catalogue lit le dossier <code>${where}</code>, et il n’y a encore rien dedans.</p>
    <ol class="steps">
      <li>Dans un terminal : <code>npm run new</code></li>
      <li>Choisissez la matière et donnez un titre.</li>
      <li>Le squelette est créé et fonctionne déjà — ouvrez <code>sim.js</code> et écrivez la physique.</li>
      <li>Rechargez cette page : la carte apparaît toute seule.</li>
    </ol>
  </div>`;
}

/* Le pied redit la promesse et signe. Il ne porte aucune navigation : la seule
   sortie qu'il propose est la planche d'identité, pour qui reprend la marque. */
function pied() {
  return `<footer class="pied">
    <div class="pied-l">${marque({ taille: 30 })}<span class="promesse">${esc(BRAND.promesse)}</span></div>
    <div class="tickrule"></div>
    <div class="fine">
      <span>${esc(BRAND.nom)}</span>
      <span>${DATA.sims.length} expériences</span>
      <a href="#/marque">La marque</a>
    </div>
  </footer>`;
}

function home() {
  const total = DATA.sims.length;
  return `<section class="hero">
      <h1>${esc(BRAND.promesse)}</h1>
      <p>Des expériences que l’on règle, relance et mesure soi-même — une par notion,
         à côté du cours. Rien n’est raconté : tout se calcule et se voit à l’écran.</p>
      <div class="tickrule"></div>
    </section>
    <div class="shelf-h">Matières</div>
    <div class="subjects">${DATA.subjects.map(subjectCard).join('')}</div>
    ${total ? `<div class="shelf-h">Ajoutées récemment</div>
      <div class="sims">${DATA.sims.slice().sort((a, b) => b.updated - a.updated).slice(0, 6).map(simCard).join('')}</div>`
      : emptyBench(null)}
    ${problemsBlock()}
    ${pied()}`;
}

function subjectPage(id) {
  const s = DATA.subjects.find((x) => x.id === id);
  if (!s) return `<section class="hero"><h1>Matière inconnue</h1><p><a href="#/">Retour au catalogue</a></p></section>`;
  const sims = DATA.sims.filter((x) => x.subject === id);
  return `<section class="hero" ${teintes(s)}>
      <h1>${esc(s.name)}</h1>
      <p>${esc(s.tagline)}</p>
      ${reglure(sims.length, 'sub', 16, 560)}
    </section>
    <div class="shelf-h">${sims.length ? plural(sims.length, 'expérience', 'expériences') : 'Aucune expérience'}</div>
    ${sims.length ? `<div class="sims">${sims.map(simCard).join('')}</div>` : emptyBench(s)}
    ${pied()}`;
}

/* La planche d'identité.
   Elle MONTRE le système au lieu de le décrire : la marque à ses tailles
   réelles, les quatre teintes posées sur les deux papiers où elles vivront,
   les trois familles dans leurs trois rôles. Quiconque doit reprendre la marque
   — une affiche, un export, une deuxième application — a tout ici, et n'a rien
   à deviner. */
function marquePage() {
  const t = (s) => `<div class="papier ${s === 'clair' ? 'clair' : 'sombre'}">
    <div class="pastilles">${DATA.subjects.map((x) => `<div class="pastille">
      <i style="background:${esc(s === 'clair' ? x.colour : (x.colourDark || x.colour))}"></i>
      ${esc(x.short)}</div>`).join('')}
      <div class="pastille"><i style="background:${s === 'clair' ? '#c8452c' : '#ff6a52'}"></i>en mesure</div>
    </div></div>`;
  return `<section class="hero">
      <h1>La marque</h1>
      <p>${esc(BRAND.sens)}</p>
      <div class="tickrule"></div>
    </section>
    <div class="shelf-h">Le système</div>
    <div class="planche">
      <div class="pl large">
        <h4>Le bloc-marque</h4>
        <div class="tailles">
          <figure>${marque({ taille: 72 })}<figcaption>72 px</figcaption></figure>
          <figure>${marque({ taille: 40 })}<figcaption>40 px</figcaption></figure>
          <figure>${marque({ taille: 25 })}<figcaption>25 px — en-tête</figcaption></figure>
          <figure>${marque({ taille: 16, trait: 2.8 })}<figcaption>16 px — favicon</figcaption></figure>
          <figure>${marque({ taille: 25, rayons: false, trait: 2.2 })}<figcaption>réduction extrême</figcaption></figure>
          <figure style="align-items:flex-start">${blocMarque({ as: 'div', taille: 25 })}
            <figcaption>le bloc complet</figcaption></figure>
        </div>
        <p>La lumière sort de la lentille et se referme sur un point : c’est le
           schéma que tout élève a déjà tracé à la règle. Le foyer reste
           <em>détaché</em> des rayons — collés, le dessin devient un mégaphone,
           c’est-à-dire un objet qui parle, l’exact contraire de la promesse. Si
           la marque doit descendre plus bas encore, on jette les rayons et l’on
           garde la lentille et son foyer.</p>
      </div>

      <div class="pl">
        <h4>Les teintes, sur leurs deux papiers</h4>
        <div class="papiers">${t('clair')}${t('sombre')}</div>
        <p>Chaque matière porte deux valeurs de sa couleur, une par thème : une
           teinte unique s’éteint toujours sur l’un des deux fonds. Une seule
           couleur vive à l’écran à la fois — celle de la matière ouverte.</p>
      </div>

      <div class="pl">
        <h4>Trois familles, trois rôles</h4>
        <div class="voix">
          <div><dt>Sérif</dt><div class="ex-serif">Ne me croyez pas sur parole.</div></div>
          <div><dt>Sans</dt><div class="ex-sans">Le texte courant, celui qui explique
            ce que l’on va régler et pourquoi.</div></div>
          <div><dt>Mono</dt><div class="ex-mono">λ = 632,8 nm · 45 bases · 12 min</div></div>
        </div>
        <p>La sérif affirme, la sans explique, la mono mesure. Hésiter sur la
           famille, c’est hésiter sur le rôle du texte.</p>
      </div>

      <div class="pl">
        <h4>Ce qui bouge, et pourquoi</h4>
        <div class="voix">
          <div><dt>Foyer</dt><div class="ex-sans">Il prend la couleur de la matière
            ouverte. Tant qu’aucune ne l’est, il les passe en revue : l’enseigne
            montre ce qu’il y a sur les étagères, puis se fixe.</div></div>
          <div><dt>Mise au&nbsp;point</dt><div class="ex-sans">Au survol et au clavier, les
            rayons s’allongent et le point se resserre — la marque met au point,
            c’est-à-dire fait ce qu’elle raconte.</div></div>
          <div><dt>Réglure</dt><div class="ex-sans">Un cran par expérience, au pas
            constant : la longueur du filet <em>est</em> le compte, et deux
            étagères se comparent sans lire un chiffre.</div></div>
          <div><dt>Lecture</dt><div class="ex-sans">Le curseur devient une tête de
            lecture : seules les valeurs qu’il approche s’allument, d’autant plus
            fort qu’il en est près, et s’éteignent derrière lui. Quatorze par
            matière, justes, calées sur les crans.</div></div>
          <div><dt>Mesure</dt><div class="ex-sans">En arrivant sur une étagère, la
            réglure s’étend de zéro à sa longueur et le compteur monte avec elle :
            l’étagère se mesure devant vous au lieu d’afficher un résultat tout
            fait.</div></div>
          <div><dt>Tracé</dt><div class="ex-sans">La vignette d’une carte se dessine
            au survol, trait après trait. C’est une figure tracée, pas une image —
            et l’ordre du geste dit déjà quelque chose d’elle.</div></div>
          <div><dt>Arrivée</dt><div class="ex-sans">Les cartes montent l’une après
            l’autre, très vite. Pas pendant une recherche : sous les doigts, une
            liste qui rejoue son entrée à chaque lettre ne se lit plus.</div></div>
          <div><dt>Témoin</dt><div class="ex-sans">Le vermillon ne bat que pendant
            qu’une horloge tourne. Un voyant toujours allumé ne dit plus rien.</div></div>
        </div>
        <p>Huit mouvements, et pas un de décoratif : chacun est commandé par un
           état réel de la page. Tous s’effacent si le système demande moins
           d’animation.</p>
      </div>

      <div class="pl large">
        <h4>Les règles</h4>
        <ol class="regles">
          <li><span><b>Encre et papier d’abord.</b> Tout ce qui n’est pas une donnée
            se tient dans ces deux-là.</span></li>
          <li><span><b>Une seule couleur vive.</b> Celle de la matière ouverte. Le
            vermillon est réservé au témoin de mesure — il ne dit qu’une chose :
            une horloge tourne en ce moment.</span></li>
          <li><span><b>Trois familles, trois rôles</b>, jamais mélangés.</span></li>
          <li><span><b>Un seul ornement</b> — la réglure graduée. Ni ombre décorative,
            ni dégradé, ni icône qui ne dise rien.</span></li>
        </ol>
        <div class="tickrule" style="margin-top:18px"></div>
      </div>
    </div>
    ${pied()}`;
}

function searchPage(term) {
  const t = norm(term);
  const hits = DATA.sims.filter((s) => {
    const hay = norm([s.title, s.summary, s.look, (s.tags || []).join(' '),
      (DATA.subjects.find((x) => x.id === s.subject) || {}).name].join(' '));
    return hay.includes(t);
  });
  return `<section class="hero">
      <h1>${hits.length ? plural(hits.length, 'résultat', 'résultats') : 'Aucun résultat'}</h1>
      <p>pour « ${esc(term)} »</p>
    </section>
    ${hits.length ? `<div class="sims">${hits.map(simCard).join('')}</div>`
      : `<div class="empty"><h3>Rien de tel ici</h3><p>Essayez un autre mot, ou parcourez les matières depuis
         <a href="#/">le catalogue</a>.</p></div>`}`;
}

function render() {
  const term = q.value.trim();
  if (term) { view.innerHTML = searchPage(term); apreteVue(); return; }
  const hash = location.hash.replace(/^#\/?/, '');
  view.innerHTML = hash === 'marque' ? marquePage() : hash ? subjectPage(hash) : home();
  apreteVue();
  // A subject page tints the whole masthead, so the search field and the theme
  // button pick up the subject's colour too. Les deux teintes sont posées, et
  // c'est la règle de thème qui choisit — comme partout ailleurs.
  const s = DATA.subjects.find((x) => x.id === hash);
  matiereCourante = s || null;          // ce que la réglure affichera au survol
  regleOuverte = null;                  // la précédente vient de partir avec le HTML
  const root2 = document.documentElement.style;
  root2.setProperty('--sub-l', s ? s.colour : '#10707f');
  root2.setProperty('--sub-d', s ? (s.colourDark || s.colour) : '#4ec5d6');
  // aucune matière ouverte : le foyer se met à défiler (voir cycleDuFoyer)
  document.body.classList.toggle('sans-sujet', !s);
}

/* Ce qu'il faut faire au HTML fraîchement posé : trois gestes, tous facultatifs
   au sens où la page reste juste et lisible s'ils ne se produisent pas. */
const doux = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;

/* L'arrivée ne se joue qu'à un CHANGEMENT DE PAGE. La recherche re-rend à
   chaque touche frappée : sans ce drapeau, toutes les cartes rejouaient leur
   entrée à chaque lettre, et la liste clignotait sous les doigts. */
let animerArrivee = true;

function apreteVue() {
  /* 1. pathLength="1" sur chaque tracé de vignette. Posé ici plutôt que dans les
        vingt-huit dessins de vignettes.js : c'est une affaire d'animation, pas
        de dessin, et un motif ne doit pas avoir à s'en soucier. Il rend la même
        durée à tous les traits, quelle que soit leur longueur réelle. */
  view.querySelectorAll('.sim-vig *').forEach((e) => e.setAttribute('pathLength', '1'));

  /* 2. L'arrivée des cartes, décalée — et plafonnée à dix, au-delà on attendrait. */
  const anime = doux() && animerArrivee;
  view.querySelectorAll('.sim, .subject').forEach((c, i) => {
    if (anime) c.style.animationDelay = Math.min(i, 10) * 34 + 'ms';
    else c.style.animation = 'none';
  });

  /* 3. Les réglures qui comptent se posent : largeur nulle au départ, puis leur
        vraie longueur à l'image suivante — il faut que le navigateur ait vu le
        zéro, sinon il n'y a pas de transition à jouer, seulement un saut. */
  const regles = [...view.querySelectorAll('.tickrule.compte')];
  const poser = () => regles.forEach((r) => r.classList.add('posee'));
  if (anime) requestAnimationFrame(() => requestAnimationFrame(poser));
  else poser();

  /* 4. Et le compteur monte avec la réglure : les deux disent la même chose, ils
        doivent arriver ensemble. Le nombre affiché reste celui du catalogue —
        on ne fait qu'y conduire. */
  if (!anime) return;
  view.querySelectorAll('.subject .count b').forEach((b) => {
    const cible = parseInt(b.textContent, 10);
    if (!Number.isFinite(cible) || cible < 2) return;
    const t0 = performance.now(), duree = 600;
    b.textContent = '0';
    const pas = (t) => {
      // la page a pu être re-rendue sous nos pieds : on n'écrit pas dans un
      // nœud détaché, et on ne garde pas une boucle en vie pour rien
      if (!b.isConnected) return;
      const k = Math.min(1, (t - t0) / duree);
      b.textContent = String(Math.round(cible * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(pas);
      else b.textContent = String(cible);   // on finit sur la vraie valeur, toujours
    };
    requestAnimationFrame(pas);
  });
}

/* ── la réglure qui se laisse lire ──────────────────────────────────────────
   Au survol, le filet devient une vraie règle graduée : des valeurs de la
   matière ouverte montent sous les crans, l'une après l'autre, et se retirent
   ensemble quand le curseur s'en va.

   Le curseur est une TÊTE DE LECTURE : seules les valeurs qu'il approche
   s'allument, d'autant plus fort qu'il en est près, et elles s'éteignent
   derrière lui. Tout afficher d'un coup donnait une frise illisible de quatorze
   étiquettes ; là, on lit une règle en la parcourant, comme on ferait du doigt
   sur une vraie.

   Trois autres choix méritent d'être notés. Les étiquettes se CALENT sur les
   crans existants — une graduation posée entre deux traits ne serait plus une
   graduation. Elles alternent haut et bas, ce qui permet de les serrer deux
   fois plus sans qu'elles se chevauchent jamais. Et on n'en met que si le filet
   est assez long : un filet de quatre-vingt-seize pixels sous une carte de
   matière n'est pas une règle qu'on lit, c'est une longueur qu'on compare. */
let matiereCourante = null;
let regleOuverte = null;
/* Avec 76 px, un pied de page pleine largeur porte les quatorze valeurs.

   Sur le chevauchement, attention au raisonnement facile : « la portée est plus
   courte que l'écart entre deux étiquettes d'une même rangée, donc elles ne
   s'allument jamais ensemble » est FAUX. Curseur posé entre les deux, chacune
   n'est qu'à un demi-écart — 76 px — et les deux s'allument. C'est mesuré.

   Ce qui les empêche de se recouvrir est donc ailleurs, et tient à une seule
   règle sur le CONTENU : aucune valeur ne dépasse la distance qui sépare deux
   étiquettes d'une même rangée (2 × 76 = 152 px, soit ~24 signes en mono de
   10 px). Les listes de lib/subjects.js s'y tiennent, et le contrôle plus bas
   dans ce fichier le vérifie à l'affichage. */
const ESPACE_MIN = 76;                  // entre deux crans étiquetés
const PORTEE = 130;                     // jusqu'où la tête de lecture éclaire

function ouvrirReglure(el) {
  const large = el.getBoundingClientRect().width;
  const liste = (matiereCourante && matiereCourante.mesures) || DATA.mesures || [];
  const n = Math.min(liste.length, Math.floor(large / ESPACE_MIN));
  if (n < 3) return;                    // trop court pour être lu : on n'y touche pas
  const pas = parseFloat(getComputedStyle(el).getPropertyValue('--pas')) || 8;
  const g = document.createElement('div');
  g.className = 'grad';
  const marques = [];
  for (let i = 0; i < n; i++) {
    // au centre de la i-ième tranche, puis calé sur le cran le plus proche
    const vise = ((i + 0.5) / n) * large;
    const x = Math.min(large - 1, Math.round(vise / pas) * pas);
    const s = document.createElement('span');
    s.className = 'g' + (i % 2 ? ' bas' : '');
    s.style.left = ((x / large) * 100).toFixed(3) + '%';
    s.innerHTML = `<i></i><b>${esc(liste[i])}</b>`;
    g.appendChild(s);
    marques.push({ el: s, x });
  }
  const tete = document.createElement('div');
  tete.className = 'tete';
  g.appendChild(tete);
  el.appendChild(g);

  /* Le garde-fou du chevauchement, vérifié sur le texte RÉELLEMENT rendu et non
     sur un compte de caractères : une valeur plus large que l'écart entre deux
     étiquettes d'une même rangée pourrait recouvrir sa voisine. On le dit tout
     haut plutôt que de le laisser se voir un jour à l'écran. */
  const limite = 2 * (large / n);
  marques.forEach((m) => {
    const w = m.el.querySelector('b').getBoundingClientRect().width;
    if (w > limite) {
      console.warn('réglure : « ' + m.el.querySelector('b').textContent + ' » fait '
        + Math.round(w) + ' px pour ' + Math.round(limite)
        + ' px disponibles — elle peut en recouvrir une autre. À raccourcir dans lib/subjects.js.');
    }
  });

  /* Une seule écriture par image : suivre la souris à chaque événement fait
     recalculer la mise en page des dizaines de fois par seconde pour rien. */
  let sourisX = -1e4, prevu = 0;
  const peindre = () => {
    prevu = 0;
    tete.style.left = sourisX + 'px';
    marques.forEach((m) => {
      const d = Math.abs(m.x - sourisX);
      const p = d >= PORTEE ? 0 : Math.pow(1 - d / PORTEE, 1.5);
      m.el.style.setProperty('--p', p.toFixed(3));
    });
  };
  const bouge = (e) => {
    sourisX = e.clientX - el.getBoundingClientRect().left;
    if (!prevu) prevu = requestAnimationFrame(peindre);
  };
  el.addEventListener('mousemove', bouge);
  el._reglure = { bouge, annule: () => prevu && cancelAnimationFrame(prevu) };

  el.getBoundingClientRect();           // on force le calcul avant d'animer
  el.classList.add('ouvert');
  regleOuverte = el;
}

function fermerReglure() {
  const el = regleOuverte;
  if (!el) return;
  regleOuverte = null;
  el.classList.remove('ouvert');
  if (el._reglure) {
    el.removeEventListener('mousemove', el._reglure.bouge);
    el._reglure.annule();
    el._reglure = null;
  }
  // tout s'éteint ensemble : un retrait échelonné donnerait l'impression que la
  // page traîne derrière le curseur
  el.querySelectorAll('.grad .g').forEach((s) => s.style.setProperty('--p', '0'));
  const g = el.querySelector('.grad');
  setTimeout(() => { if (g && g.parentNode === el) g.remove(); }, 260);
}

view.addEventListener('mouseover', (e) => {
  const r = e.target.closest && e.target.closest('.tickrule');
  if (!r || r === regleOuverte) return;
  fermerReglure();
  ouvrirReglure(r);
});
view.addEventListener('mouseout', (e) => {
  const r = e.target.closest && e.target.closest('.tickrule');
  if (!r || r !== regleOuverte) return;
  if (e.relatedTarget && r.contains(e.relatedTarget)) return;
  fermerReglure();
});

let typing = null;
q.addEventListener('input', () => {
  clearTimeout(typing);
  animerArrivee = false;                // on tape : pas de rejeu à chaque lettre
  typing = setTimeout(render, 120);
});
q.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { q.value = ''; animerArrivee = true; render(); }
});
window.addEventListener('hashchange', () => { q.value = ''; animerArrivee = true; render(); });

load().catch((e) => {
  view.innerHTML = `<div class="empty"><h3>Le serveur ne répond pas</h3>
    <p>${esc(e.message)}<br>Lancez <code>npm start</code> puis rechargez.</p></div>`;
});
