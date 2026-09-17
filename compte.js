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

  /* OÙ EST CE FICHIER. Le compte est servi une seule fois, à la racine du
     site, et chargé depuis trois profondeurs différentes : `/index.html`,
     `/cahier/index.html`, `/sfy/index.html`. Or un `import()` écrit dans un
     script classique se résout contre l'adresse de la PAGE, pas contre celle
     du script — `./firebase-config.js` serait donc allé chercher le fichier
     dans `cahier/`, où il n'est pas. On relève donc notre propre adresse au
     chargement, tant que `document.currentScript` existe (il ne vaut plus rien
     une fois dans une fonction asynchrone). */
  /* Les adresses qui voient l'entrée de l'Atelier. Lues depuis la
     configuration ; vides, personne ne la voit — pas même vous. */
  var proprietaires = [];
  function chezSoi() {
    var u = etat.utilisateur;
    return !!(u && u.email && proprietaires.indexOf(String(u.email).toLowerCase()) >= 0);
  }

  /* ── LES OUTILS LOCAUX ──
     Studio, la Console et Le Classeur tournent sur VOTRE machine, en Node. Ils
     ne sont pas sur le site et ne peuvent pas y être : ils écrivent des
     fichiers, lancent des constructions et poussent sur un dépôt, et un
     hébergement statique n'exécute rien. Ce panneau n'« ouvre » donc aucun
     accès — il ouvre des liens vers des ports, ce qui n'est pas un secret mais
     une convention.

     Une adresse peut aussi être une URL complète : c'est ce qui permet de
     joindre Studio depuis ailleurs, à travers un tunnel qui authentifie AVANT
     d'arriver à la machine. Chacun règle la sienne dans son navigateur ; rien
     n'est publié. */
  var OUTILS = [
    { id: 'console', nom: 'Console', quoi: 'ce qui est en ligne, construire, déployer', port: 4310 },
    { id: 'studio', nom: 'Studio', quoi: 'écrire et construire les manuels', port: 4000 },
    { id: 'classeur', nom: 'Le Classeur', quoi: 'la plateforme : classes, bulletins, examens', port: 4300 },
  ];
  var CLE_ADR = 'fable-outils-adresses';
  function adresses() {
    try { return JSON.parse(localStorage.getItem(CLE_ADR) || '{}') || {}; } catch (e) { return {}; }
  }
  function adresseDe(o, t) {
    var v = t[o.id];
    if (!v) return 'http://localhost:' + o.port + '/';
    if (/^\d+$/.test(String(v))) return 'http://localhost:' + v + '/';
    return String(v).replace(/\/*$/, '/');
  }
  /* Seuls `http:` et `https:`. Sans ce filtre, une adresse `javascript:…`
     collée dans le champ deviendrait un lien qui exécute du code au clic. */
  function adresseValide(v) {
    if (/^\d+$/.test(v)) { var k = Number(v); return k > 0 && k < 65536; }
    try { var u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; } catch (e) { return false; }
  }

  var BASE = (function () {
    var sc = document.currentScript;
    var u = (sc && sc.src) || '';
    return u ? u.replace(/[^/]*$/, '') : './';
  })();

  function prevenir() { ecouteurs.forEach(function (f) { try { f(etat); } catch (e) { /* un écouteur fautif ne casse pas les autres */ } }); }
  function dire(m) { etat.dernier = m; prevenir(); }

  /* ── le chargement, tardif et facultatif ────────────────────────────────
     Le SDK fait quelques centaines de kilo-octets. On ne le charge qu'au
     moment où quelqu'un veut vraiment se connecter : un visiteur qui écrit
     hors ligne ne doit pas payer le poids d'un service qu'il n'utilise pas. */
  async function charger() {
    if (fb) return fb;
    var cfg = await import(BASE + 'firebase-config.js');
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

  /* ── UNE SEULE FENÊTRE ─────────────────────────────────────────────────
     Le cahier avait la sienne. L'accueil et les simulations en auraient eu
     une chacun, et les trois auraient divergé — c'est déjà arrivé dans ce
     projet aux médaillons, dessinés en double. Elle vit donc ici, avec son
     style, et les trois surfaces l'ouvrent.

     Les couleurs sont des variables `--fc-…` : chaque page peut les reprendre
     pour que la fenêtre soit chez elle, et sans rien faire elle suit déjà le
     clair et le sombre du système. */
  /* LES COULEURS VIENNENT DE LA PAGE, pas du système. Premier essai : une
     règle `prefers-color-scheme` — et la fenêtre s'ouvrait en sombre sur un
     accueil réglé en clair, parce que le thème de Fable est un choix de
     l'utilisateur et non celui du système d'exploitation.
     Chaque jeton va donc chercher celui de l'hôte, avec une chaîne de replis :
     l'accueil dit `--card` et `--ink-3`, le cahier `--paper` et `--slate`, les
     simulations `--paper` et `--ink-mute`. La fenêtre est chez elle partout,
     et suit le thème de la page sans rien savoir d'elle. */
  var STYLE = '.fc-dlg{color-scheme:light dark;  --fc-pap:var(--card,var(--paper,#faf6ee));  --fc-enc:var(--ink,#211d19);  --fc-mut:var(--ink-3,var(--slate,var(--ink-mute,#6f675c)));  --fc-trait:var(--rule,var(--trait,var(--paper-3,#ded5c6)));  --fc-acc:var(--accent,var(--sub,#8c2f2a));  border:1px solid var(--fc-trait);border-radius:12px;background:var(--fc-pap);color:var(--fc-enc);  padding:0;inline-size:min(24rem,calc(100vw - 2rem));  font:400 15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;  box-shadow:0 30px 70px -30px rgba(0,0,0,.55)}.fc-dlg::backdrop{background:rgba(20,17,14,.45)}.fc-dlg h2{margin:0 0 4px;font-size:17px;letter-spacing:-.01em}.fc-dlg .fc-corps{padding:20px}.fc-dlg p{margin:0 0 14px;color:var(--fc-mut);font-size:13.5px}.fc-dlg label{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;  color:var(--fc-mut);margin:10px 0 3px}.fc-dlg input{font:inherit;font-size:14px;width:100%;padding:8px 10px;border-radius:7px;  border:1px solid var(--fc-trait);background:var(--fc-pap);color:var(--fc-enc)}.fc-dlg input:focus{outline:2px solid var(--fc-acc);outline-offset:1px}.fc-dlg button{font:inherit;font-size:14px;cursor:pointer;border-radius:100px;padding:8px 14px;  border:1px solid var(--fc-trait);background:transparent;color:var(--fc-enc)}.fc-dlg button:hover{border-color:var(--fc-mut)}.fc-dlg .fc-fort{background:var(--fc-acc);border-color:var(--fc-acc);color:var(--fc-pap);font-weight:600;width:100%}.fc-dlg .fc-ou{display:flex;align-items:center;gap:10px;margin:16px 0 2px;  font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--fc-mut)}.fc-dlg .fc-ou::before,.fc-dlg .fc-ou::after{content:"";flex:1;height:1px;background:var(--fc-trait)}.fc-dlg .fc-rang{display:flex;gap:8px;margin-top:16px}.fc-dlg .fc-rang button{flex:1}.fc-dlg .fc-err{min-height:16px;font-size:13px;margin:10px 0 0;  color:color-mix(in oklab,#e0554d 72%,var(--fc-enc))}.fc-dlg .fc-qui{display:flex;align-items:center;gap:10px;margin-bottom:14px}.fc-dlg .fc-qui img{inline-size:36px;block-size:36px;border-radius:50%}.fc-dlg .fc-qui b{display:block;font-size:15px}.fc-dlg .fc-qui span{font-size:12.5px;color:var(--fc-mut)}\
.fc-dlg .fc-outils{list-style:none;margin:0;padding:0}\
.fc-dlg .fc-outils li{border-bottom:1px solid var(--fc-trait)}\
.fc-dlg .fc-outils a{display:block;padding:9px 2px;text-decoration:none;color:inherit}\
.fc-dlg .fc-outils a:hover{color:var(--fc-acc)}\
.fc-dlg .fc-outils b{display:block;font-size:14.5px}\
.fc-dlg .fc-outils span{font-size:12.5px;color:var(--fc-mut)}\
.fc-dlg .fc-note{font-size:12px;color:var(--fc-mut);margin:10px 0 0}\
.fc-dlg .fc-note button{font-size:12px;padding:3px 9px;margin-top:6px}';

  var dlg = null;
  function fenetre() {
    if (dlg) return dlg;
    var st = document.createElement('style'); st.textContent = STYLE;
    document.head.appendChild(st);
    dlg = document.createElement('dialog');
    dlg.className = 'fc-dlg';
    document.body.appendChild(dlg);
    /* Cliquer à côté referme : `showModal` ne ferme que sur Échap, et une
       fenêtre dont on ne devine pas la sortie donne l'impression d'être pris. */
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    return dlg;
  }

  function ouvrirDialogue() {
    var d = fenetre();
    d.innerHTML = '';
    var c = document.createElement('div'); c.className = 'fc-corps';

    if (etat.utilisateur) {
      var u = etat.utilisateur;
      c.innerHTML = '<h2>Votre compte</h2>'
        + '<div class="fc-qui">' + (u.photo ? '<img alt="" src="' + echappe(u.photo) + '">' : '')
        + '<span><b>' + echappe(u.nom || u.email) + '</b>'
        + '<span>' + echappe(etat.dernier || 'Vos cahiers suivent ce compte.') + '</span></span></div>'
        + (chezSoi() ? atelierHtml() : '')
        + '<div class="fc-rang"><button data-fermer>Fermer</button>'
        + '<button data-sortir>Se déconnecter</button></div>';
      if (chezSoi()) brancherAtelier(c);
      c.querySelector('[data-sortir]').onclick = function () {
        window.FableCompte.deconnecter().then(function () { d.close(); });
      };
    } else {
      c.innerHTML = '<h2>Votre compte Fable</h2>'
        + '<p>Un seul compte pour les livres, le cahier et les simulations. '
        + 'Vos cahiers restent sur cet appareil — le compte en garde une copie, '
        + 'pour les retrouver ailleurs.</p>'
        + '<button class="fc-fort" data-google>Continuer avec Google</button>'
        + '<div class="fc-ou">ou par e-mail</div>'
        + '<label for="fc-mail">Adresse</label>'
        + '<input id="fc-mail" type="email" autocomplete="username" placeholder="vous@exemple.fr">'
        + '<label for="fc-mdp">Mot de passe</label>'
        + '<input id="fc-mdp" type="password" autocomplete="current-password">'
        + '<p class="fc-err" data-err></p>'
        + '<div class="fc-rang"><button data-creer>Créer un compte</button>'
        + '<button class="fc-fort" data-entrer>Se connecter</button></div>';
      var err = c.querySelector('[data-err]');
      var dire2 = function (e) { err.textContent = (e && e.message) || String(e); };
      c.querySelector('[data-google]').onclick = function () {
        err.textContent = '';
        window.FableCompte.connecterGoogle().then(function () { d.close(); }, dire2);
      };
      var parMail = function (creer) {
        err.textContent = '';
        window.FableCompte.connecterEmail(
          c.querySelector('#fc-mail').value.trim(), c.querySelector('#fc-mdp').value, creer
        ).then(function () { d.close(); }, dire2);
      };
      c.querySelector('[data-entrer]').onclick = function () { parMail(false); };
      c.querySelector('[data-creer]').onclick = function () { parMail(true); };
    }
    var f = c.querySelector('[data-fermer]');
    if (f) f.onclick = function () { d.close(); };
    d.appendChild(c);
    d.showModal();
  }

  function atelierHtml() {
    var t = adresses();
    return '<div class="fc-ou">votre atelier</div>'
      + '<ul class="fc-outils">'
      + OUTILS.map(function (o) {
        var u = adresseDe(o, t);
        return '<li><a href="' + echappe(u) + '" target="_blank" rel="noopener">'
          + '<b>' + echappe(o.nom) + '</b><span>' + echappe(o.quoi) + '</span></a></li>';
      }).join('')
      + '</ul>'
      + '<p class="fc-note">Ils tournent sur cette machine. Ailleurs, ces liens ouvrent '
      + 'un port vide — ce qui est exactement la protection : ils n’écoutent que 127.0.0.1. '
      + '<button data-adresses>Changer une adresse…</button></p>';
  }

  function brancherAtelier(c) {
    var b = c.querySelector('[data-adresses]');
    if (!b) return;
    b.onclick = function () {
      var t = adresses();
      var noms = OUTILS.map(function (o, i) { return (i + 1) + ' = ' + o.nom; }).join(', ');
      var q = prompt('Quel outil ? (' + noms + ')', '1');
      if (q === null) return;
      var o = OUTILS[Number(q) - 1];
      if (!o) return;
      var v = (prompt('Adresse de ' + o.nom + ' — un port (4310), ou une URL complète '
        + '(https://studio.mon-tailnet.ts.net) :', String(t[o.id] || o.port)) || '').trim();
      if (!v) return;
      if (!adresseValide(v)) { alert('Attendu : un port, ou une adresse http(s) complète.'); return; }
      t[o.id] = /^\d+$/.test(v) ? Number(v) : v;
      try { localStorage.setItem(CLE_ADR, JSON.stringify(t)); } catch (e) { /* refusé */ }
      ouvrirDialogue();
    };
  }

  function echappe(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (x) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x];
    });
  }

  /* ── LE BOUTON, POSÉ PARTOUT PAREIL ──
     Chaque page donne l'élément d'accueil et la classe de son propre style ;
     le contenu et le comportement viennent d'ici. C'est ce qui fait que les
     trois surfaces montrent la MÊME personne sans se recopier. */
  async function poserBouton(hote, classe) {
    if (!hote) return false;
    if (!(await window.FableCompte.configure())) return false;
    window.FableCompte.surChangement(function (e) {
      hote.innerHTML = '';
      var b = document.createElement('button');
      b.type = 'button';
      if (classe) b.className = classe;
      if (e.utilisateur) {
        var court = (e.utilisateur.nom || e.utilisateur.email || '').split(' ')[0].split('@')[0];
        if (e.utilisateur.photo) {
          var im = new Image(); im.src = e.utilisateur.photo; im.alt = '';
          im.width = 18; im.height = 18;
          im.style.cssText = 'border-radius:50%;vertical-align:-4px;margin-inline-end:6px';
          b.appendChild(im);
        }
        b.appendChild(document.createTextNode(court));
        b.title = e.utilisateur.email + (e.dernier ? ' — ' + e.dernier : '');
      } else {
        b.textContent = 'Se connecter';
      }
      b.onclick = ouvrirDialogue;
      hote.appendChild(b);
    });
    return true;
  }

  window.FableCompte = {
    etat: etat,
    /* `configure` se lit sans rien charger : l'interface doit savoir s'il faut
       montrer un bouton de connexion AVANT de télécharger le moindre SDK. */
    configure: async function () {
      try {
        var cfg = await import(BASE + 'firebase-config.js');
        etat.pret = !!(cfg.CONFIG_FIREBASE && cfg.CONFIG_FIREBASE.apiKey && cfg.CONFIG_FIREBASE.projectId);
        proprietaires = (cfg.PROPRIETAIRES || []).map(function (e) { return String(e).trim().toLowerCase(); }).filter(Boolean);
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
    ouvrirDialogue: ouvrirDialogue,
    poserBouton: poserBouton,
    /* Les deux morceaux de logique qui peuvent se tromper sans qu'on le voie :
       le découpage, et la décision de qui gagne. Exposés pour être vérifiés
       depuis la console du navigateur, sans compte ni réseau. */
    _essai: { decouper: decouper, decider: decider, TAILLE: TAILLE },
  };
})();
