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
import { monter, csv, evenements, table, esc as escR } from './pilote-rapport.js';

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
  /* Voir compte.js : le defaut ne suffit pas partout. */
  try { await A.setPersistence(auth, A.browserLocalPersistence); }
  catch (e) { /* stockage cloisonne */ }
  db = F.getFirestore(application);
}

function proprietaire(u) {
  /* `isAnonymous` d'abord : le collecteur de l'essai ouvre une session
     anonyme sur le meme projet, et elle n'a ni adresse ni droits. */
  return !!(u && !u.isAnonymous && u.email
    && (PROPRIETAIRES || []).indexOf(String(u.email).toLowerCase()) >= 0);
}

/* ── QUAND FIRESTORE DIT NON ─────────────────────────────────────────────
   « Missing or insufficient permissions » est exact et parfaitement inutile :
   il ne dit ni qui demandait, ni ce qu'attendaient les regles, ni quoi faire
   ensuite. Or ici la cause est presque toujours la meme et elle se corrige en
   cinq minutes — les regles ne sont pas publiees.

   On montre donc l'identite telle que la BASE la voit, parce que c'est la
   seule qui compte : la page laisse entrer sur une comparaison en minuscules,
   les regles comparaient autrefois a la lettre pres, et un compte a majuscule
   passait la porte pour se faire refuser derriere. */
function refus(e) {
  return e && (e.code === 'permission-denied'
    || /insufficient permissions|PERMISSION_DENIED/i.test(e.message || ''));
}

function expliquerRefus(ou) {
  var u = auth && auth.currentUser;
  var html = '<div class="ess-check">'
    + '<p class="eyebrow ess-mal">Firestore refused</p>'
    + '<p class="ess-why">The database turned the request down. That is the rules speaking, '
    + 'not the page \u2014 and almost always because they have not been published yet.</p>'
    + '<ol>'
    + '<li><b>Publish the rules.</b> Firebase console \u2192 your project \u2192 Firestore Database '
    + '\u2192 <b>Rules</b> \u2192 paste <code>firestore.rules</code> \u2192 Publish. '
    + 'Nothing can be written or read until this is done.</li>'
    + '<li><b>Enable Anonymous sign-in.</b> Authentication \u2192 Sign-in method \u2192 Anonymous.</li>'
    + '</ol>'
    + '<p class="ess-why" style="margin-block-start:.7rem">What the database sees of you right now:<br>'
    + '<code>' + esc((u && u.email) || 'not signed in') + '</code> \u00b7 '
    + 'verified: <code>' + ((u && u.emailVerified) ? 'yes' : 'no') + '</code><br>'
    + 'The rules must list that address, in lower case. It is also in '
    + '<code>PROPRIETAIRES</code> in <code>web/firebase-config.js</code>, and the two are kept '
    + 'in step by hand.</p>'
    + '</div>';
  $(ou).innerHTML = html;
}

/* ── LA PORTE ──────────────────────────────────────────────────────────── */
async function demarrer() {
  /* ON N'AFFICHE PAS LA PORTE AVANT DE SAVOIR. Firebase restaure la session
     depuis IndexedDB, ce qui prend un aller-retour : afficher tout de suite
     donnait « connectez-vous » une demi-seconde a quelqu'un qui l'etait
     deja, et cette demi-seconde suffit a faire croire qu'on a ete
     deconnecte. On dit qu'on regarde, puis on tranche. */
  $('#ess-porte').hidden = true;
  $('#ess-attente').hidden = false;
  await firebase();
  A.onAuthStateChanged(auth, async (u) => {
    $('#ess-attente').hidden = true;
    /* LA MEME TRACE QUE `compte.js`. Se connecter ici est se connecter
       partout — meme projet, meme session — mais la barre du haut ne le
       saurait pas : elle ne recharge le SDK que si cette marque existe. Sans
       cette ligne, on se connectait a la console et l'en-tete continuait
       d'afficher « Se connecter » sur toutes les autres pages. */
    try {
      if (u && !u.isAnonymous) localStorage.setItem('fable-compte-vu', '1');
      else localStorage.removeItem('fable-compte-vu');
    } catch (e) { /* stockage refuse */ }
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
  await Promise.all([chargerGroupes(), chargerReglages(), chargerInvites()]);
  peindreGroupes();
  peindreInvites();
  /* Les invitations se repeignent APRES les mesures aussi : c'est la que
     « combien de seances » et « quels livres » trouvent leurs chiffres. */
  await chargerMesures();
  peindreInvites();
}

/* ── LES INVITATIONS ──────────────────────────────────────────────────────
   Le professeur inscrit une adresse ; la personne se connecte avec ; sa
   lecture porte desormais son nom au lieu d'un identifiant d'appareil.

   DEUX FACONS DE LA PREVENIR, et la seconde existe parce que la premiere
   echoue souvent. Firebase sait poster un lien de connexion — pas de
   serveur a nous, pas de mot de passe a inventer pour un eleve. Mais un
   courriel automatique tombe dans les indesirables, et un adolescent ne lit
   pas ses courriels. On donne donc aussi le lien a copier : le professeur
   l'envoie par le moyen qu'ils utilisent vraiment.

   L'ADRESSE EST L'IDENTIFIANT DU DOCUMENT, en minuscules. Deux raisons : on
   ne peut pas inviter deux fois la meme personne par accident, et les regles
   peuvent comparer l'identifiant a `request.auth.token.email` sans avoir a
   lire le document — donc sans ouvrir la liste de la classe a celui qui en
   fait partie. */

let invites = [];

const adresseValable = (a) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(a || '').trim());
const clefAdresse = (a) => String(a || '').trim().toLowerCase();

async function chargerInvites() {
  try {
    const s = await F.getDocs(F.collection(db, 'invites'));
    invites = s.docs.map((d) => ({ adresse: d.id, ...d.data() }));
  } catch (e) {
    if (refus(e)) expliquerRefus('#ess-rapport');
    invites = [];
  }
}

async function inviter() {
  const brute = $('#ess-courriel').value;
  const adresse = clefAdresse(brute);
  if (!adresseValable(adresse)) { etat('That does not look like an e-mail address.', 1); $('#ess-courriel').focus(); return; }
  const code = $('#ess-groupe').value || (groupes[0] && groupes[0].code) || '';
  if (!code) { etat('Create a group first — an invitation belongs to one.', 1); return; }

  try {
    await F.setDoc(F.doc(db, 'invites', adresse), {
      email: adresse, code, actif: true,
      cree: Date.now(), parQui: (auth.currentUser || {}).email || '',
    }, { merge: true });
    $('#ess-courriel').value = '';
    await chargerInvites();
    peindreInvites();
    etat('Invited. Send them the link, or press “E-mail it”.');
  } catch (e) {
    etat('Could not invite: ' + e.message, 1);
    if (refus(e)) expliquerRefus('#ess-rapport');
  }
}

/* Le lien d'invitation « a la main » : la meme page, avec le code du groupe.
   Il ouvre l'essai tout de suite, en anonyme, et le compte prendra le relais
   des que la personne se connectera avec l'adresse invitee. Un eleve n'est
   donc jamais bloque derriere une boite mail qu'il ne lit pas. */
const lienInvite = (inv) => RACINE + '?pilote=' + encodeURIComponent(inv.code);

async function posterLien(adresse) {
  try {
    await A.sendSignInLinkToEmail(auth, adresse, {
      url: RACINE + '?bienvenue=1',
      handleCodeInApp: true,
    });
    etat('Sent to ' + adresse + '. It expires, and it may land in spam.');
  } catch (e) {
    /* La cause la plus frequente, et de loin : la methode « Email link »
       n'est pas activee dans la console Firebase. On le dit, plutot que de
       recopier un code d'erreur. */
    etat('Could not send: ' + e.message
      + ' — check Authentication → Sign-in method → Email link is on.', 1);
  }
}

async function revoquer(adresse, oui) {
  try {
    await F.setDoc(F.doc(db, 'invites', adresse), { actif: !oui }, { merge: true });
    await chargerInvites();
    peindreInvites();
    etat(oui
      ? 'Revoked. Their next visit stops measuring and the trial disappears for them.'
      : 'Active again.');
  } catch (e) { etat('Could not change it: ' + e.message, 1); }
}

/* ── CE QUE CHAQUE PERSONNE A FAIT ────────────────────────────────────────
   La jointure : l'invitation porte l'`uid` que la personne a tamponne en
   arrivant, et les mesures sont rangees sous cet uid. On rapproche les deux
   ICI, dans la console, et nulle part ailleurs — le magasin de mesures ne
   contient aucune adresse, et c'est ce qui fait qu'une fuite de celui-ci ne
   dirait rien de personne. */
function activiteDe(uid) {
  if (!uid) return null;
  const p = donnees.find((x) => x.uid === uid);
  if (!p) return null;
  const ev = evenements([p]);
  const livres = {};
  ev.filter((e) => e.k === 'chapitre').forEach((e) => {
    const b = e.b || '?';
    (livres[b] = livres[b] || { s: 0, ch: new Set() });
    livres[b].s += e.s || 0;
    livres[b].ch.add(e.c);
  });
  return {
    seances: new Set(ev.map((e) => e.q)).size,
    secondes: ev.filter((e) => e.k === 'chapitre').reduce((a, e) => a + (e.s || 0), 0),
    figures: ev.filter((e) => e.k === 'element' && e.n > 0).length,
    pannes: ev.filter((e) => e.k === 'panne').length,
    livres,
    dernier: Math.max(0, ...ev.map((e) => e.t || 0)),
  };
}

function peindreInvites() {
  const ou = $('#ess-invites');
  if (!ou) return;

  /* Le menu des groupes suit ceux qui existent : inviter quelqu'un dans un
     groupe qu'on n'a pas cree donnerait une mesure orpheline. */
  const sel = $('#ess-groupe');
  if (sel) {
    const avant = sel.value;
    sel.innerHTML = groupes.map((g) =>
      `<option value="${esc(g.code)}">${esc(g.nom)}</option>`).join('');
    if (avant && groupes.some((g) => g.code === avant)) sel.value = avant;
  }

  if (!invites.length) {
    ou.innerHTML = '<p class="ess-rien">Nobody invited yet. An address above, and they get a link.</p>';
    return;
  }

  const mn = (s) => (s < 60 ? Math.round(s) + 's' : Math.round(s / 60) + ' min');
  const lignes = invites
    .sort((a, b) => (b.cree || 0) - (a.cree || 0))
    .map((inv) => {
      const act = activiteDe(inv.uid);
      const livres = act ? Object.keys(act.livres) : [];
      const etatTxt = inv.actif === false
        ? '<span class="ess-mal">revoked</span>'
        : inv.uid ? 'signed in'
          : '<span class="ess-rien">not yet</span>';
      return {
        clic: inv.uid ? 'appareil:' + inv.uid : '',
        cells: [
          `<b>${esc(inv.adresse)}</b>`,
          `<span class="ess-tag">${esc(inv.code || '?')}</span>`,
          etatTxt,
          act ? act.seances : '',
          act ? mn(act.secondes) : '',
          livres.length
            ? livres.map((b) => `<span class="ess-tag">${esc(b)} · ${act.livres[b].ch.size} ch</span>`).join(' ')
            : '<span class="ess-rien">—</span>',
          `<button class="btn btn-2 ess-mini" data-copier-inv="${esc(inv.adresse)}">Copy link</button>`
          + `<button class="btn btn-2 ess-mini" data-poster="${esc(inv.adresse)}">E-mail it</button>`
          + `<button class="btn btn-2 ess-mini" data-revoquer="${esc(inv.adresse)}"`
          + ` data-oui="${inv.actif === false ? '0' : '1'}">`
          + (inv.actif === false ? 'Restore' : 'Revoke') + '</button>',
        ],
      };
    });

  ou.innerHTML = table(
    [['address'], ['group'], ['state'], ['sessions', 1], ['read', 1], ['books'], ['']],
    lignes);
}

/* ── LES GROUPES ───────────────────────────────────────────────────────── */
async function chargerGroupes() {
  try {
    const s = await F.getDocs(F.collection(db, 'pilote-groupes'));
    groupes = s.docs.map((d) => ({ code: d.id, ...d.data() }));
  } catch (e) {
    etat('Cannot read the groups: ' + e.message, 1);
    if (refus(e)) expliquerRefus('#ess-rapport');
    groupes = [];
  }
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
  } catch (e) {
    etat('Could not create the group: ' + e.message, 1);
    if (refus(e)) expliquerRefus('#ess-rapport');
  }
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
    monter(out, $('#ess-rapport'), $('#ess-tiroir'));
    $('#ess-csv').hidden = false;
    etat('');
  } catch (e) {
    etat('Refused: ' + e.message, 1);
    expliquerRefus('#ess-rapport');
  }
}

/* ── LES BOUTONS ───────────────────────────────────────────────────────── */
document.addEventListener('click', async (e) => {
  const ci = e.target.closest('[data-copier-inv]');
  if (ci) {
    const inv = invites.find((x) => x.adresse === ci.getAttribute('data-copier-inv'));
    if (!inv) return;
    try {
      await navigator.clipboard.writeText(lienInvite(inv));
      ci.textContent = 'Copied';
      setTimeout(() => { ci.textContent = 'Copy link'; }, 1400);
    } catch (x) { etat(lienInvite(inv)); }
    return;
  }
  const pe = e.target.closest('[data-poster]');
  if (pe) { await posterLien(pe.getAttribute('data-poster')); return; }
  const rv = e.target.closest('[data-revoquer]');
  if (rv) {
    const adr = rv.getAttribute('data-revoquer');
    const oui = rv.getAttribute('data-oui') === '1';
    if (oui && !confirm('Revoke ' + adr + '? Their next visit stops measuring.')) return;
    await revoquer(adr, oui);
    return;
  }
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
  $('#ess-inviter').onclick = inviter;
  $('#ess-courriel').addEventListener('keydown', (e) => { if (e.key === 'Enter') inviter(); });
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
      $('#ess-attente').hidden = true;
      $('#ess-porte').hidden = false;
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
    invites = m.invitesInventes();
    $('#ess-porte').hidden = true;
    $('#ess-console').hidden = false;
    $('#ess-qui').textContent = 'made-up data — this is only the shape';
    peindreGroupes();
    peindreInvites();
    monter(donnees, $('#ess-rapport'), $('#ess-tiroir'));
    $('#ess-csv').hidden = false;
  });
}
