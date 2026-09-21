/* LA CONSOLE DE L'ESSAI — lancer un groupe, le suivre, l'arrêter.
 *
 * ── CE QUI PROTÈGE CETTE PAGE (ET CE QUI NE LA PROTÈGE PAS) ──────────────
 *
 * Elle est publiée avec le reste du site, parce qu'un hébergement statique ne
 * sait rien cacher : tout ce qui est publié est lisible par qui devine
 * l'adresse. Le panneau qui suit se montre à un propriétaire connecté et se
 * tait pour les autres, mais ce n'est PAS ce qui protège quoi que ce soit —
 * c'est de la politesse, pas une serrure, et trois clics dans l'inspecteur
 * l'ouvrent.
 *
 * Ce qui protège vraiment, ce sont les RÈGLES, dans `firestore.rules`, et
 * elles sont vérifiées par le serveur de Google : personne d'autre que les
 * adresses qui y sont écrites ne lit une seule mesure, quoi qu'il fasse de
 * cette page. C'est exactement la position déjà tenue par le panneau de
 * l'Atelier, et elle est écrite ici pour qu'on ne l'oublie pas en la relisant.
 *
 * ── L'ARRÊT À DISTANCE ───────────────────────────────────────────────────
 *
 * Fermer un groupe n'est pas une étiquette : le réglage part dans un document
 * que le collecteur lit au début de chaque séance, et un appareil dont le
 * groupe est fermé s'efface tout seul. Sans ça, « arrêter l'essai » aurait
 * voulu dire « rattraper onze adolescents un par un », ce qui n'est pas un
 * bouton d'arrêt. Il y a aussi un arrêt général, pour le jour où il faut que
 * tout s'éteigne d'un coup.
 */
import { CONFIG_FIREBASE, VERSION_SDK, PROPRIETAIRES } from './firebase-config.js';
import { rendreRapport, csv } from './pilote-rapport.js';

const $ = (s) => document.querySelector(s);
const B = 'https://www.gstatic.com/firebasejs/' + (VERSION_SDK || '10.12.0') + '/';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let F = null, A = null, db = null, auth = null;
let groupes = [], donnees = [], reglages = { fermes: [], pause: false };

/* L'adresse du site, telle qu'un élève la recevra. Déduite de la page plutôt
   qu'écrite en dur : la console publiée sous `/fable/` doit proposer des liens
   sous `/fable/`, et une adresse recopiée à la main se trompe un jour. */
const RACINE = location.href.replace(/\/trial\.html.*$/, '/').replace(/\/[^/]*$/, '/');

function etat(m, mal) {
  const e = $('#ess-etat');
  e.textContent = m || '';
  e.className = 'ess-etat' + (mal ? ' ess-mal' : '');
}

async function firebase() {
  if (F) return;
  const app = await import(B + 'firebase-app.js');
  A = await import(B + 'firebase-auth.js');
  F = await import(B + 'firebase-firestore.js');
  const application = app.getApps().length ? app.getApp() : app.initializeApp(CONFIG_FIREBASE);
  auth = A.getAuth(application);
  db = F.getFirestore(application);
}

function proprietaire(u) {
  return !!(u && u.email && (PROPRIETAIRES || []).indexOf(String(u.email).toLowerCase()) >= 0);
}

/* ── LA PORTE ──────────────────────────────────────────────────────────── */
async function demarrer() {
  await firebase();
  A.onAuthStateChanged(auth, async (u) => {
    if (!proprietaire(u)) {
      $('#ess-porte').hidden = false;
      $('#ess-console').hidden = true;
      $('#ess-qui').textContent = u ? `Signed in as ${u.email} — not an owner of this project.` : '';
      return;
    }
    $('#ess-porte').hidden = true;
    $('#ess-console').hidden = false;
    $('#ess-qui').textContent = u.email;
    await tout();
  });
  $('#ess-entrer').onclick = async () => {
    try { await A.signInWithPopup(auth, new A.GoogleAuthProvider()); }
    catch (e) { etat('Sign-in failed: ' + e.message, 1); }
  };
}

async function tout() {
  await Promise.all([chargerGroupes(), chargerReglages()]);
  peindreGroupes();
  await chargerMesures();
}

/* ── LES GROUPES ───────────────────────────────────────────────────────── */
async function chargerGroupes() {
  try {
    const s = await F.getDocs(F.collection(db, 'pilote-groupes'));
    groupes = s.docs.map((d) => ({ code: d.id, ...d.data() }));
  } catch (e) { etat('Cannot read the groups: ' + e.message, 1); groupes = []; }
}
async function chargerReglages() {
  try {
    const d = await F.getDoc(F.doc(db, 'reglages', 'pilote'));
    reglages = d.exists() ? { fermes: [], pause: false, ...d.data() } : { fermes: [], pause: false };
  } catch (e) { reglages = { fermes: [], pause: false }; }
}
async function poserReglages() {
  await F.setDoc(F.doc(db, 'reglages', 'pilote'), reglages, { merge: true });
}

/* Le code vient du NOM, pas du hasard : « Soutien - bac, group 1 » donne
   « soutien-bac-group-1 ». Il finit dans un lien qu'un professeur peut lire a
   voix haute, et dans une colonne de tableur ou l'on doit reconnaitre le
   groupe sans se reporter a une legende. Un suffixe numerique evite la
   collision si deux groupes portent le meme nom. */
function codeDe(nom) {
  const base = String(nom || 'essai').toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 22) || 'essai';
  let c = base, n = 2;
  while (groupes.some((g) => g.code === c)) c = base + '-' + n++;
  return c;
}

async function lancer() {
  const nom = $('#ess-nom').value.trim();
  if (!nom) { $('#ess-nom').focus(); return; }
  const code = codeDe(nom);
  const g = {
    nom, note: $('#ess-note').value.trim().slice(0, 300),
    cree: Date.now(), ferme: false,
  };
  try {
    await F.setDoc(F.doc(db, 'pilote-groupes', code), g);
    groupes.push({ code, ...g });
    $('#ess-nom').value = ''; $('#ess-note').value = '';
    peindreGroupes();
    etat('');
    /* On met le lien tout de suite sous les yeux : c'est la seule chose dont
       on a besoin dans la minute qui suit. */
    const l = document.getElementById('lien-' + code);
    if (l) { l.scrollIntoView({ block: 'center' }); l.focus(); l.select && l.select(); }
  } catch (e) { etat('Could not create the group: ' + e.message, 1); }
}

function lienDe(code) { return RACINE + '?pilote=' + encodeURIComponent(code); }

async function fermer(code, oui) {
  const s = new Set(reglages.fermes || []);
  if (oui) s.add(code); else s.delete(code);
  reglages.fermes = [...s];
  try {
    await poserReglages();
    await F.setDoc(F.doc(db, 'pilote-groupes', code), { ferme: !!oui }, { merge: true });
    const g = groupes.find((x) => x.code === code);
    if (g) g.ferme = !!oui;
    peindreGroupes();
    etat(oui
      ? 'Closed. Each device in that group erases itself the next time it opens the book.'
      : 'Open again.');
  } catch (e) { etat('Could not change it: ' + e.message, 1); }
}

async function pause(oui) {
  reglages.pause = !!oui;
  try { await poserReglages(); peindreGroupes(); etat(oui ? 'Everything is stopped.' : 'Running again.'); }
  catch (e) { etat('Could not change it: ' + e.message, 1); }
}

function peindreGroupes() {
  const ferme = new Set(reglages.fermes || []);
  const parCode = {};
  donnees.forEach((p) => {
    const c = p.profil.code || '?';
    (parCode[c] = parCode[c] || { app: 0, seances: new Set() }).app++;
    (p.lots || []).forEach((l) => parCode[c].seances.add(l.seance));
  });

  $('#ess-pause').textContent = reglages.pause ? 'Resume everything' : 'Stop everything';
  $('#ess-pause').className = 'btn ' + (reglages.pause ? 'btn-1' : 'btn-2');
  $('#ess-pausemot').textContent = reglages.pause
    ? 'Every trial copy is stopped and erases itself on next open.'
    : '';

  if (!groupes.length) {
    $('#ess-groupes').innerHTML = '<p class="ess-rien">No group yet. Name one above and you get a link to hand out.</p>';
    return;
  }
  $('#ess-groupes').innerHTML = groupes
    .sort((a, b) => (b.cree || 0) - (a.cree || 0))
    .map((g) => {
      const f = ferme.has(g.code);
      const m = parCode[g.code] || { app: 0, seances: new Set() };
      return `<div class="ess-g${f ? ' ess-g-ferme' : ''}">
        <div class="ess-g-t">
          <b>${esc(g.nom)}</b>
          <span class="ess-tag">${esc(g.code)}</span>
          ${f ? '<span class="ess-mal">closed</span>' : ''}
          <span class="ess-g-n">${m.app} device(s) · ${m.seances.size} session(s)</span>
        </div>
        ${g.note ? `<p class="ess-g-note">${esc(g.note)}</p>` : ''}
        <div class="ess-g-l">
          <input id="lien-${esc(g.code)}" class="ess-lien" readonly value="${esc(lienDe(g.code))}">
          <button class="btn btn-2" data-copier="${esc(g.code)}">Copy</button>
          <button class="btn btn-2" data-fermer="${esc(g.code)}" data-oui="${f ? '0' : '1'}">${f ? 'Reopen' : 'Close'}</button>
        </div>
      </div>`;
    }).join('');
}

/* ── LES MESURES ───────────────────────────────────────────────────────── */
async function chargerMesures() {
  etat('Reading…');
  try {
    const gens = await F.getDocs(F.collection(db, 'pilote'));
    const out = [];
    for (const g of gens.docs) {
      const lots = await F.getDocs(F.collection(db, 'pilote', g.id, 'lots'));
      out.push({ uid: g.id, profil: g.data(), lots: lots.docs.map((d) => d.data()) });
    }
    donnees = out;
    peindreGroupes();
    if (!out.length) {
      $('#ess-rapport').innerHTML =
        '<p class="ess-rien">Nothing has come back yet. Either nobody has opened a trial link, '
        + 'or the Firestore rules are not published — see below.</p>';
      etat('');
      return;
    }
    $('#ess-rapport').innerHTML = rendreRapport(out);
    $('#ess-csv').hidden = false;
    etat('');
  } catch (e) {
    etat('Refused: ' + e.message, 1);
    $('#ess-rapport').innerHTML =
      '<p class="ess-rien">Firestore refused the read. The usual cause is that '
      + '<code>firestore.rules</code> has not been published in the Firebase console.</p>';
  }
}

/* ── LES BOUTONS ───────────────────────────────────────────────────────── */
document.addEventListener('click', async (e) => {
  const c = e.target.closest('[data-copier]');
  if (c) {
    const l = lienDe(c.getAttribute('data-copier'));
    try { await navigator.clipboard.writeText(l); c.textContent = 'Copied'; setTimeout(() => { c.textContent = 'Copy'; }, 1400); }
    catch (x) { document.getElementById('lien-' + c.getAttribute('data-copier')).select(); }
    return;
  }
  const f = e.target.closest('[data-fermer]');
  if (f) {
    const code = f.getAttribute('data-fermer');
    const oui = f.getAttribute('data-oui') === '1';
    if (oui && !confirm('Close "' + code + '"? Every device in it stops and erases itself the next time it opens the book.')) return;
    await fermer(code, oui);
  }
});

/* « ?demo » remplace tout : sans ce drapeau, la porte s'ouvrirait derrière le
   faux rapport et le referait disparaître à la première réponse de Firebase. */
const DEMO = location.search.includes('demo');

addEventListener('DOMContentLoaded', () => {
  $('#ess-lancer').onclick = lancer;
  $('#ess-rafraichir').onclick = tout;
  $('#ess-pause').onclick = () => {
    if (!reglages.pause && !confirm('Stop every trial copy, in every group?')) return;
    pause(!reglages.pause);
  };
  $('#ess-csv').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv(donnees)], { type: 'text/csv' }));
    a.download = 'fable-essai-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
  };
  $('#ess-nom').addEventListener('keydown', (e) => { if (e.key === 'Enter') lancer(); });
  if (!DEMO) {
    demarrer().catch(function (e) {
      /* Le message va dans la porte, qui est la seule chose a l'ecran a ce
         moment-la ; `etat()` ecrit plus bas, dans un bloc encore cache. */
      $('#ess-qui').textContent = 'Firebase did not load: ' + e.message;
      $('#ess-qui').className = 'ess-mal';
    });
  }
});

/* Une poignée pour voir la forme du rapport sans attendre un seul élève.
   Le jeu inventé vit dans un fichier à part : il ne part pas en ligne pour
   rien, et il ne peut pas se confondre avec de vraies mesures. */
if (DEMO) {
  addEventListener('DOMContentLoaded', async () => {
    const m = await import('./pilote-demo.js');
    donnees = m.essaiInvente();
    groupes = m.groupesInventes();
    $('#ess-porte').hidden = true;
    $('#ess-console').hidden = false;
    $('#ess-qui').textContent = 'made-up data — this is only the shape';
    peindreGroupes();
    $('#ess-rapport').innerHTML = rendreRapport(donnees);
    $('#ess-csv').hidden = false;
  });
}
