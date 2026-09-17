/* LE COMPTE — se connecter, et retrouver ses cahiers sur un autre appareil.
 *
 * Le site publié n'est que des fichiers : GitHub Pages ne fait tourner aucun
 * code à nous. Un compte demandait donc quelque chose de neuf, et c'est
 * Firebase — Auth pour l'identité, Firestore pour les cahiers. Rien à louer,
 * rien à mettre à jour, et les règles de `firestore.rules` font le gardien.
 *
 * ── L'APPAREIL RESTE LA SOURCE ───────────────────────────────────────────
 *
 * Le cahier vit dans IndexedDB, comme avant, et il marche entier sans compte.
 * Le nuage est une COPIE qui suit la personne. C'est délibéré : un élève dont
 * le réseau tombe en plein cours doit continuer à écrire, et un cahier ne doit
 * pas disparaître parce qu'un service a changé d'avis.
 *
 * ── CE QUI ARRIVE QUAND DEUX APPAREILS ONT ÉCRIT ─────────────────────────
 *
 * Le plus récent gagne, cahier par cahier, d'après `updated`. Ce n'est pas une
 * fusion ligne à ligne, et ça ne prétend pas l'être : deux personnes qui
 * écrivent dans le MÊME cahier en même temps, sur deux appareils, verront la
 * version la plus récente l'emporter. Le dire est plus honnête que de laisser
 * croire à une magie qui n'existe pas.
 *
 * ── POURQUOI LES CAHIERS SONT DÉCOUPÉS ───────────────────────────────────
 *
 * Un document Firestore ne peut pas dépasser 1 Mio, et un cahier porte ses
 * images EN CLAIR à l'intérieur (c'est ce qui fait qu'un export est un seul
 * fichier). Trois photos et la limite est franchie. Le cahier part donc en
 * morceaux numérotés, dans une sous-collection, et se recolle à la lecture.
 * Cela permet de rester sur le palier gratuit : Cloud Storage, qui n'aurait
 * pas cette limite, réclame maintenant un compte de facturation.
 */
(function () {
  'use strict';

  var etat = {
    pret: false,        // la configuration est-elle remplie ?
    utilisateur: null,
    occupe: false,
    dernier: '',
  };
  var ecouteurs = [];
  var fb = null;        // les modules Firebase, chargés à la demande

  function prevenir() { ecouteurs.forEach(function (f) { try { f(etat); } catch (e) { /* un écouteur fautif ne casse pas les autres */ } }); }
  function dire(m) { etat.dernier = m; prevenir(); }

  /* ── le chargement, tardif et facultatif ────────────────────────────────
     Le SDK fait quelques centaines de kilo-octets. On ne le charge qu'au
     moment où quelqu'un veut vraiment se connecter : un visiteur qui écrit
     hors ligne ne doit pas payer le poids d'un service qu'il n'utilise pas. */
  async function charger() {
    if (fb) return fb;
    var cfg = await import('./firebase-config.js');
    var C = cfg.CONFIG_FIREBASE || {};
    if (!C.apiKey || !C.projectId) throw new Error('Firebase n’est pas configuré (web/firebase-config.js).');
    var base = 'https://www.gstatic.com/firebasejs/' + (cfg.VERSION_SDK || '10.12.0') + '/';
    var app = await import(base + 'firebase-app.js');
    var auth = await import(base + 'firebase-auth.js');
    var fs = await import(base + 'firebase-firestore.js');
    var application = app.initializeApp(C);
    fb = {
      auth: auth.getAuth(application),
      db: fs.getFirestore(application),
      a: auth, f: fs,
    };
    fb.a.onAuthStateChanged(fb.auth, function (u) {
      etat.utilisateur = u ? { uid: u.uid, email: u.email || '', nom: u.displayName || '', photo: u.photoURL || '' } : null;
      prevenir();
      if (u) synchroniser();
    });
    return fb;
  }

  /* ── le magasin local ──
     Exposé par jaguar-shim.js. Sur la version installée il n'existe pas, et le
     compte ne s'y affiche donc jamais : là-bas les cahiers sont des fichiers. */
  function magasin() { return window.JaguarStore || null; }

  /* ── découpe ──
     350 000 caractères : même intégralement accentué, un morceau reste sous le
     mégaoctet une fois encodé en UTF-8. La numérotation est complétée par des
     zéros pour que l'ordre alphabétique des identifiants soit l'ordre des
     morceaux — c'est lui qui sert au recollage. */
  var TAILLE = 350000;
  function numero(k) { var s = String(k); while (s.length < 4) s = '0' + s; return s; }
  function decouper(t) {
    var out = [];
    for (var i = 0; i < t.length; i += TAILLE) out.push(t.slice(i, i + TAILLE));
    return out;
  }

  function refCahier(id) { return fb.f.doc(fb.db, 'users', etat.utilisateur.uid, 'cahiers', id); }
  function refMorceaux(id) { return fb.f.collection(fb.db, 'users', etat.utilisateur.uid, 'cahiers', id, 'morceaux'); }

  async function pousserCahier(id, nb) {
    var txt = JSON.stringify(nb);
    var parts = decouper(txt);
    /* Combien de morceaux la version précédente avait-elle ? Si le cahier a
       RÉTRÉCI, les morceaux en trop doivent disparaître — sinon la lecture
       recolle la fin d'une version d'avant à la nouvelle, et le JSON obtenu
       est un mélange qui ne s'analyse même pas. */
    var avant = 0;
    try { var d = await fb.f.getDoc(refCahier(id)); if (d.exists()) avant = d.data().n || 0; } catch (e) { /* première fois */ }

    var lot = fb.f.writeBatch(fb.db);
    lot.set(refCahier(id), {
      nom: (nb && nb.nom) || (nb && nb.student && nb.student.prenom) || 'Cahier',
      updated: (nb && nb.updated) || Date.now(),
      cover: (nb && nb.brand && nb.brand.cover) || 'jaguar',
      accent: (nb && nb.brand && nb.brand.accent) || '#c9a054',
      n: parts.length,
    });
    parts.forEach(function (t, k) { lot.set(fb.f.doc(refMorceaux(id), numero(k)), { t: t }); });
    for (var k = parts.length; k < avant; k++) lot.delete(fb.f.doc(refMorceaux(id), numero(k)));
    await lot.commit();
  }

  async function tirerCahier(id) {
    var d = await fb.f.getDoc(refCahier(id));
    if (!d.exists()) return null;
    var snap = await fb.f.getDocs(fb.f.query(refMorceaux(id), fb.f.orderBy('__name__')));
    var t = '';
    snap.forEach(function (s) { t += (s.data() && s.data().t) || ''; });
    if (!t) return null;
    try { return JSON.parse(t); } catch (e) { return null; }
  }

  async function listeDistante() {
    var snap = await fb.f.getDocs(fb.f.collection(fb.db, 'users', etat.utilisateur.uid, 'cahiers'));
    var out = [];
    snap.forEach(function (s) { out.push({ id: s.id, updated: (s.data() && s.data().updated) || 0 }); });
    return out;
  }

  /* ── QUI GAGNE ──
     Séparé de l'envoi et de la réception exprès : c'est ici que sont les
     décisions, donc c'est ici que sont les erreurs possibles, et une fonction
     pure se vérifie sans réseau ni compte. Elle est exposée sous `_essai`
     plus bas, et c'est ce qui permet d'en faire la preuve.

     Cahier par cahier, la version la plus récente gagne. Ce qui n'existe que
     d'un côté est copié vers l'autre. Aucune suppression n'est propagée : un
     cahier effacé sur un appareil revient depuis le nuage, ce qui est le moins
     mauvais des deux défauts — perdre du travail est pire que devoir effacer
     deux fois. */
  function decider(locaux, distants) {
    var quandDist = {};
    distants.forEach(function (d) { quandDist[d.id] = d.updated || 0; });
    var quandLoc = {};
    locaux.forEach(function (c) { quandLoc[c.id] = (c.notebook && c.notebook.updated) || 0; });
    var monter = [], descendre = [];
    Object.keys(quandLoc).forEach(function (id) {
      /* Strictement plus récent : à égalité on ne touche à rien. Les deux
         côtés portent alors le même travail, et réécrire pour rien coûte une
         écriture par cahier à chaque ouverture. */
      if (!(id in quandDist) || quandLoc[id] > quandDist[id]) monter.push(id);
    });
    Object.keys(quandDist).forEach(function (id) {
      if (!(id in quandLoc) || quandDist[id] > quandLoc[id]) descendre.push(id);
    });
    return { monter: monter, descendre: descendre };
  }

  async function synchroniser() {
    var st = magasin();
    if (!st || !etat.utilisateur || etat.occupe) return;
    etat.occupe = true; dire('Synchronisation…');
    try {
      var locaux = await st.tousCahiers();
      var parId = {};
      locaux.forEach(function (c) { parId[c.id] = c.notebook; });
      var quoi = decider(locaux, await listeDistante());

      var montes = 0, descendus = 0;
      for (var i = 0; i < quoi.monter.length; i++) {
        await pousserCahier(quoi.monter[i], parId[quoi.monter[i]]);
        montes++;
      }
      for (var j = 0; j < quoi.descendre.length; j++) {
        var nb = await tirerCahier(quoi.descendre[j]);
        /* Un cahier illisible — morceau manquant, écriture interrompue — ne
           doit pas écraser celui de l'appareil. On le laisse où il est. */
        if (nb) { await st.putCahier({ id: quoi.descendre[j], notebook: nb }); descendus++; }
      }

      if (montes || descendus) {
        var bouts = [];
        if (montes) bouts.push(montes + ' envoyé' + (montes > 1 ? 's' : ''));
        if (descendus) bouts.push(descendus + ' reçu' + (descendus > 1 ? 's' : ''));
        dire('À jour — ' + bouts.join(', ') + '.');
      } else dire('À jour.');
    } catch (e) {
      dire('Synchronisation impossible : ' + ((e && e.message) || e));
    } finally {
      etat.occupe = false; prevenir();
    }
  }

  /* Un seul cahier, après un enregistrement. Repoussé de quelques secondes :
     on écrit en tapant, et pousser à chaque frappe serait absurde. */
  var minuteur = null, enAttente = {};
  function pousserBientot(id) {
    if (!etat.utilisateur || !fb) return;
    enAttente[id] = 1;
    clearTimeout(minuteur);
    minuteur = setTimeout(async function () {
      var st = magasin(); if (!st) return;
      var ids = Object.keys(enAttente); enAttente = {};
      for (var i = 0; i < ids.length; i++) {
        try {
          var c = await st.getCahier(ids[i]);
          if (c) await pousserCahier(c.id, c.notebook);
        } catch (e) { dire('Envoi impossible : ' + ((e && e.message) || e)); }
      }
    }, 4000);
  }

  /* Firebase renvoie des codes ; un élève lit une phrase. Chacune dit ce qui
     s'est passé ET ce qu'on peut faire — un message qui ne mène à rien n'aide
     que celui qui l'a écrit. */
  var RAISONS = {
    'auth/popup-blocked': 'Le navigateur a bloqué la fenêtre de Google. Autorisez les fenêtres pour ce site, ou passez par l’e-mail.',
    'auth/popup-closed-by-user': 'La fenêtre de Google a été fermée avant la fin.',
    'auth/cancelled-popup-request': 'Une autre fenêtre de connexion était déjà ouverte.',
    'auth/unauthorized-domain': 'Ce domaine n’est pas autorisé dans Firebase (Authentication → Settings → Authorized domains).',
    'auth/operation-not-allowed': 'Cette méthode n’est pas activée dans Firebase (Authentication → Sign-in method).',
    'auth/invalid-email': 'Cette adresse e-mail n’est pas valide.',
    'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/user-not-found': 'Aucun compte avec cette adresse. Utilisez « Créer un compte ».',
    'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse. Utilisez « Se connecter ».',
    'auth/weak-password': 'Mot de passe trop court — six caractères au minimum.',
    'auth/network-request-failed': 'Pas de réseau. Vos cahiers restent sur cet appareil, comme toujours.',
  };
  function raison(e) {
    var c = (e && e.code) || '';
    if (RAISONS[c]) return RAISONS[c];
    /* Les trois pannes du RÉGLAGE, celles qu'on rencontre en branchant le
       projet et pas en s'en servant. Elles arrivent sous des codes verbeux —
       « auth/api-key-not-valid.-please-pass-a-valid-api-key. » — d'où le test
       sur un fragment plutôt que sur le code entier. */
    if (/api-key/.test(c)) return 'La clef Firebase n’est pas valide. Recollez la configuration dans la console (panneau « Comptes »).';
    if (/configuration-not-found/.test(c)) return 'Le projet répond, mais l’authentification n’y est pas activée (Firebase → Authentication → Get started).';
    if (/project-not-found|invalid-app-id/.test(c)) return 'Ce projet Firebase est introuvable — vérifiez `projectId` et `appId`.';
    var m = (e && e.message) || String(e);
    /* « Firebase: Error (auth/quelque-chose). » : l'emballage n'apprend rien,
       le code oui. On ne garde que lui plutôt que d'afficher la phrase entière. */
    var dedans = /\(([^)]+)\)/.exec(m);
    return dedans ? dedans[1] : m;
  }

  window.FableCompte = {
    etat: etat,
    /* `configure` se lit sans rien charger : l'interface doit savoir s'il faut
       montrer un bouton de connexion AVANT de télécharger le moindre SDK. */
    configure: async function () {
      try {
        var cfg = await import('./firebase-config.js');
        etat.pret = !!(cfg.CONFIG_FIREBASE && cfg.CONFIG_FIREBASE.apiKey && cfg.CONFIG_FIREBASE.projectId);
      } catch (e) { etat.pret = false; }
      return etat.pret;
    },
    surChangement: function (f) { ecouteurs.push(f); try { f(etat); } catch (e) { /* ignore */ } },
    connecterGoogle: async function () {
      var x = await charger();
      var f = new x.a.GoogleAuthProvider();
      try {
        await x.a.signInWithPopup(x.auth, f);
      } catch (e) {
        /* Une fenêtre bloquée n'est pas un refus : sur un téléphone, dans une
           application qui ouvre les liens chez elle, elle l'est presque
           toujours. On repart alors par redirection — la page s'en va chez
           Google et revient connectée. */
        var c = (e && e.code) || '';
        if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment') {
          await x.a.signInWithRedirect(x.auth, f);
          return;
        }
        var err = new Error(raison(e)); err.code = c; throw err;
      }
    },
    connecterEmail: async function (email, mdp, creer) {
      if (!email) throw new Error('Une adresse e-mail est demandée.');
      if (!mdp || mdp.length < 6) throw new Error('Mot de passe trop court — six caractères au minimum.');
      var x = await charger();
      try {
        if (creer) await x.a.createUserWithEmailAndPassword(x.auth, email, mdp);
        else await x.a.signInWithEmailAndPassword(x.auth, email, mdp);
      } catch (e) { var err = new Error(raison(e)); err.code = e && e.code; throw err; }
    },
    deconnecter: async function () {
      if (!fb) return;
      await fb.a.signOut(fb.auth);
      dire('');
    },
    synchroniser: synchroniser,
    pousserBientot: pousserBientot,
    /* Les deux morceaux de logique qui peuvent se tromper sans qu'on le voie :
       le découpage, et la décision de qui gagne. Exposés pour être vérifiés
       depuis la console du navigateur, sans compte ni réseau. */
    _essai: { decouper: decouper, decider: decider, TAILLE: TAILLE },
  };
})();
