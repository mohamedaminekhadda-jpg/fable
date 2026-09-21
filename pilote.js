/* LE PILOTE — ce que l'essai renvoie, et rien d'autre.
 *
 * Un professeur fait essayer Fable à d'anciens élèves. Sans ce fichier, on
 * apprend ce qu'ils VEULENT BIEN DIRE à leur professeur, c'est-à-dire « c'est
 * bien ». Ce qu'on cherche est ailleurs : quel chapitre ils ouvrent, lequel ils
 * abandonnent, quelle figure ils touchent, laquelle ils regardent sans jamais
 * y toucher, et ce qui casse sur un téléphone qu'on n'a pas.
 *
 * ── CE FICHIER NE SE CHARGE PAS TOUT SEUL ────────────────────────────────
 *
 * Le site public ne l'appelle jamais. Il faut être arrivé par un lien qui
 * porte `?pilote=CODE` — le lien que le professeur distribue. Sans ce code,
 * l'amorce posée dans les pages sort en trois lignes et rien n'est chargé :
 * pas de requête, pas de mesure, pas un octet. C'est délibéré. Un site qui
 * mesure tout le monde « au cas où » est un site qu'on ne peut plus décrire
 * honnêtement à personne.
 *
 * ── ET IL NE MESURE RIEN AVANT D'AVOIR DEMANDÉ ───────────────────────────
 *
 * Le panneau s'ouvre à la première visite, dans la langue de la page, et dit
 * ce qui part. Tant que personne n'a répondu, la file reste vide. « Non » est
 * un vrai non : il est gardé, on ne redemande pas, et le site fonctionne
 * exactement pareil. Il y a un moyen visible de revenir sur un oui — la
 * pastille en bas à gauche — parce qu'un consentement qu'on ne peut pas
 * retirer n'en est pas un, et parce que ce sont des mineurs.
 *
 * ── CE QUI PART, ET CE QUI NE PART JAMAIS ────────────────────────────────
 *
 * Part : le code du groupe, un identifiant anonyme tiré par Firebase, la
 * taille de l'écran, la langue, quel livre, quel chapitre, combien de
 * secondes, quelles figures ont été touchées et combien de fois, le score
 * d'un exercice (juste le compte), et les erreurs JavaScript.
 *
 * Ne part JAMAIS : ce qui est écrit. Pas le cahier, pas une note, pas une
 * réponse rédigée, pas un nom, pas une adresse. La règle est tenue par
 * construction et non par vigilance — aucune des fonctions ci-dessous ne lit
 * la valeur d'un champ de saisie, et `envoyer()` refuse tout événement dont
 * la forme n'est pas une des sept déclarées.
 *
 * ── POURQUOI LA FILE EST DANS localStorage ───────────────────────────────
 *
 * Un élève lit dans le bus. Le réseau tombe, il ferme l'onglet, et la séance
 * est perdue si elle n'existait qu'en mémoire. Elle est donc écrite à chaque
 * événement et n'est effacée qu'après confirmation de Firestore. Au pire un
 * lot part deux fois — on sait dédoublonner à la lecture — au mieux rien ne
 * se perd, et c'est le bon sens du compromis : ici la donnée est chère et
 * rare, elle vaut un doublon.
 */
(function () {
  'use strict';

  /* ── où est ce fichier ─────────────────────────────────────────────────
     Même piège que `compte.js`, et pour la même raison : un `import()` écrit
     dans un script classique se résout contre l'adresse de la PAGE. Or ce
     script est chargé depuis quatre profondeurs — la racine, `cahier/`,
     `library/<livre>/` — et `./firebase-config.js` irait donc chercher le
     fichier là où il n'est pas. On relève notre propre adresse tant que
     `document.currentScript` vaut encore quelque chose. */
  var BASE = './', VERSION_Q = '';
  (function () {
    var sc = document.currentScript;
    var u = (sc && sc.src) || '';
    if (!u) return;
    BASE = u.replace(/[^/]*$/, '');
    var q = /[?&](v=[^&]*)/.exec(u);
    if (q) VERSION_Q = '?' + q[1];
  })();

  var CLE_CODE = 'fable-pilote-code';
  var CLE_ACCORD = 'fable-pilote-accord';      // 'oui' | 'non'
  var CLE_FILE = 'fable-pilote-file';
  var CLE_SEANCE = 'fable-pilote-seance';

  function lire(c) { try { return localStorage.getItem(c); } catch (e) { return null; } }
  function ecrire(c, v) { try { localStorage.setItem(c, v); return true; } catch (e) { return false; } }
  function oublier(c) { try { localStorage.removeItem(c); } catch (e) { /* rien à faire */ } }

  /* ── LE CODE DU GROUPE ─────────────────────────────────────────────────
     Il dit DE QUEL ESSAI vient la mesure — « soutien-bac-1 », « 2nde-mars » —
     et rien de plus. Ce n'est pas un identifiant de personne : dix élèves du
     même groupe portent le même code, et c'est exactement ce qu'on veut.
     Séparer les cohortes permet de comparer deux versions du même chapitre
     sans mélanger les deux publics. */
  var params = null;
  try { params = new URLSearchParams(location.search); } catch (e) { params = null; }
  var venu = params && params.get('pilote');

  /* `?pilote=off` : on part, et on efface tout ce qu'on avait posé. Écrit
     avant toute autre décision — quelqu'un qui veut sortir doit pouvoir
     sortir même si le reste du fichier a un défaut. */
  if (venu === 'off') {
    [CLE_CODE, CLE_ACCORD, CLE_FILE].forEach(oublier);
    try { sessionStorage.removeItem(CLE_SEANCE); } catch (e) { /* rien */ }
    return;
  }
  if (venu) ecrire(CLE_CODE, String(venu).slice(0, 40));
  var CODE = lire(CLE_CODE);

  /* ── DEUX FACONS D'ETRE DANS L'ESSAI ─────────────────────────────────
     Par le LIEN, avec un code de groupe : l'appareil est anonyme, on ne
     sait jamais qui lit. C'etait la seule facon jusqu'ici.

     Par INVITATION, maintenant : le professeur inscrit une adresse, la
     personne se connecte avec, et c'est son compte qui porte la lecture.
     Ce n'est plus anonyme, et le panneau le dit autrement dans ce cas —
     voir MOTS.jamaisCompte. Un essai nominatif se decide, il ne se
     decouvre pas.

     On ne va chercher l'invitation que si quelqu'un s'est deja connecte
     sur cet appareil : sans cette marque, un visiteur de passage
     telechargerait le SDK pour apprendre qu'il n'est invite a rien. */
  var CLE_INVITE = 'fable-pilote-invite';
  function marqueCompte() {
    try { return localStorage.getItem('fable-compte-vu') === '1'; } catch (e) { return false; }
  }
  var invitePossible = !CODE && marqueCompte();
  if (!CODE && !invitePossible) return;   // pas dans l'essai : on n'existe pas

  /* ── LA LANGUE ─────────────────────────────────────────────────────────
     Le site range son choix sous `fable:lang` et les pages le posent sur
     `FABLE_LANG` avant les scripts. À défaut, celle du document, puis celle
     du navigateur. Une phrase qu'on n'a pas traduite retombe sur l'anglais —
     la règle de la maison — plutôt que sur une clé ou sur du vide. */
  var LANGUE = (function () {
    var l = '';
    try { l = window.FABLE_LANG || localStorage.getItem('fable:lang') || ''; } catch (e) { /* rien */ }
    l = l || document.documentElement.getAttribute('lang') || navigator.language || 'en';
    l = String(l).slice(0, 2).toLowerCase();
    return l === 'fr' || l === 'ar' ? l : 'en';
  })();

  var MOTS = {
    titre: {
      en: 'This copy is part of a trial',
      fr: 'Cette copie fait partie d’un essai',
      ar: 'هذه النسخة جزء من تجربة',
    },
    corps: {
      en: 'It reports back how the book is used: which chapters you open, and how you handle each figure — which parts you press, how long you look before trying, whether it responds — plus anything that breaks.',
      fr: 'Elle renvoie comment le livre est utilisé : les chapitres ouverts, et la façon dont vous vous servez de chaque figure — ce que vous pressez, le temps que vous regardez avant d’essayer, si elle répond — ainsi que ce qui casse.',
      ar: 'تُرسِل طريقة استعمال الكتاب: الفصول التي تفتحها، وكيف تتعامل مع كلّ شكل — ما تضغط عليه، وكم تنظر قبل أن تجرّب، وهل يستجيب — وكذلك ما يتعطّل.',
    },
    jamais: {
      en: 'What you write never leaves this device — your notebook, your notes and your written answers stay here. Nothing sent identifies you.',
      fr: 'Ce que vous écrivez ne quitte jamais l’appareil — votre cahier, vos notes et vos réponses rédigées restent ici. Rien de ce qui part ne vous identifie.',
      ar: 'ما تكتبه لا يغادر هذا الجهاز أبدًا — دفترك وملاحظاتك وإجاباتك المكتوبة تبقى هنا. ولا شيء مما يُرسل يدلّ عليك.',
    },
    /* QUAND C'EST NOMINATIF, ON LE DIT. L'autre phrase promet que rien ne
       vous identifie ; invite par son adresse, c'est faux, et une promesse
       fausse a un mineur est la seule chose qu'on ne puisse pas rattraper. */
    jamaisCompte: {
      en: 'Your teacher invited this address, so what you read here is shown to them under it. '
        + 'What you WRITE still never leaves this device — your notebook, your notes and your '
        + 'written answers stay here.',
      fr: 'Votre professeur a invité cette adresse : ce que vous lisez ici lui est montré sous '
        + 'ce nom. Ce que vous ÉCRIVEZ ne quitte toujours pas l’appareil — votre cahier, vos '
        + 'notes et vos réponses rédigées restent ici.',
      ar: 'دعاك أستاذك بهذا العنوان، '
        + 'فما تقرأه هنا يُعرض عليه باسمك. '
        + 'أمّا ما تكتبه فلا يغادر هذا الجهاز.',
    },
    oui: { en: 'Allow', fr: 'Accepter', ar: 'أوافق' },
    non: { en: 'No thanks', fr: 'Non merci', ar: 'لا، شكرًا' },
    arreter: { en: 'Stop sending', fr: 'Arrêter l’envoi', ar: 'إيقاف الإرسال' },
    fermer: { en: 'Close', fr: 'Fermer', ar: 'إغلاق' },
    pastille: { en: 'trial', fr: 'essai', ar: 'تجربة' },
    actif: {
      en: 'This copy is sending usage back. You can stop at any time.',
      fr: 'Cette copie renvoie l’usage. Vous pouvez arrêter à tout moment.',
      ar: 'هذه النسخة تُرسِل بيانات الاستعمال. يمكنك الإيقاف متى شئت.',
    },
    arrete: {
      en: 'Stopped. Nothing more will be sent from this device.',
      fr: 'Arrêté. Plus rien ne partira de cet appareil.',
      ar: 'تمّ الإيقاف. لن يُرسل شيء بعد الآن من هذا الجهاز.',
    },
  };
  function T(k) { return (MOTS[k] && (MOTS[k][LANGUE] || MOTS[k].en)) || ''; }

  /* ── LE PANNEAU ────────────────────────────────────────────────────────
     Styles posés à la main plutôt que dans une feuille : ce script se charge
     dans un LIVRE aussi, et un livre est un fichier autonome dont on ne
     connaît ni les variables ni les classes. Tout ce qui suit est préfixé et
     ne dépend de rien du document hôte — sauf `prefers-color-scheme`, qui
     est du navigateur et non de la page. */
  /* LA PASTILLE DE L'ESSAI EST UN CRAN AU-DESSUS DU RETOUR. Le coin en bas
     a gauche est desormais celui de « Fable », sur les livres, le cahier et
     sfy — exactement la ou celle-ci se posait. Empilees elles se lisent ;
     superposees on n'en voit qu'une, et c'est la mauvaise. */
  var CSS = ''
    + '.flt-fond{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;'
    + 'padding:16px;background:rgba(20,17,14,.55);backdrop-filter:blur(3px);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}'
    + '.flt-boite{max-inline-size:29rem;inline-size:100%;background:#f7f4ed;color:#211d19;border:1px solid rgba(33,29,25,.16);'
    + 'border-radius:14px;padding:1.15rem 1.25rem 1rem;box-shadow:0 18px 50px rgba(20,17,14,.34);line-height:1.6}'
    + '.flt-boite h2{margin:0 0 .5rem;font-size:1.02rem;font-weight:650;letter-spacing:-.01em}'
    + '.flt-boite p{margin:0 0 .6rem;font-size:.8125rem;color:#4a423a}'
    + '.flt-boite p.flt-jamais{color:#211d19;border-inline-start:2px solid #8c2f2a;padding-inline-start:.6rem}'
    + '.flt-rang{display:flex;gap:.5rem;justify-content:flex-end;margin-block-start:.9rem;flex-wrap:wrap}'
    + '.flt-b{font:inherit;font-size:.8125rem;padding:.45rem .9rem;border-radius:8px;cursor:pointer;border:1px solid transparent}'
    + '.flt-b-oui{background:#8c2f2a;color:#fff;font-weight:600}'
    + '.flt-b-non{background:transparent;color:#4a423a;border-color:rgba(33,29,25,.22)}'
    + '.flt-b:focus-visible{outline:2px solid #8c2f2a;outline-offset:2px}'
    + '.flt-pastille{position:fixed;inset-block-end:52px;inset-inline-start:12px;z-index:2147482000;'
    + 'font:500 10px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;letter-spacing:.06em;text-transform:uppercase;'
    + 'padding:5px 9px;border-radius:999px;cursor:pointer;background:rgba(247,244,237,.92);color:#6b6058;'
    + 'border:1px solid rgba(33,29,25,.18);box-shadow:0 2px 8px rgba(20,17,14,.14)}'
    + '.flt-pastille:hover{color:#211d19}'
    + '@media (prefers-color-scheme:dark){'
    + '.flt-boite{background:#1c1920;color:#ece7e1;border-color:rgba(236,231,225,.14)}'
    + '.flt-boite p{color:#a49a91}.flt-boite p.flt-jamais{color:#ece7e1}'
    + '.flt-b-non{color:#a49a91;border-color:rgba(236,231,225,.2)}'
    + '.flt-pastille{background:rgba(28,25,32,.92);color:#8e847b;border-color:rgba(236,231,225,.16)}'
    + '.flt-pastille:hover{color:#ece7e1}}';

  var styleMis = false;
  function poserStyle() {
    if (styleMis) return;
    styleMis = true;
    var s = document.createElement('style');
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function elem(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    /* `textContent` et jamais `innerHTML` : ces phrases sont à nous
       aujourd'hui, et une phrase à nous devient une phrase traduite par
       quelqu'un d'autre demain. */
    if (txt) e.textContent = txt;
    return e;
  }

  var panneau = null;
  function fermerPanneau() {
    if (panneau && panneau.parentNode) panneau.parentNode.removeChild(panneau);
    panneau = null;
  }

  /* `demande` : la première fois, on demande. Sinon, on montre l'état et on
     offre la sortie. Une seule fonction pour les deux, parce que c'est le
     même panneau et que deux copies auraient divergé. */
  function ouvrirPanneau(demande) {
    poserStyle();
    fermerPanneau();
    var fond = elem('div', 'flt-fond');
    fond.setAttribute('role', 'dialog');
    fond.setAttribute('aria-modal', 'true');
    if (LANGUE === 'ar') fond.setAttribute('dir', 'rtl');
    var boite = elem('div', 'flt-boite');
    boite.appendChild(elem('h2', '', T('titre')));
    boite.appendChild(elem('p', '', demande ? T('corps') : T('actif')));
    boite.appendChild(elem('p', 'flt-jamais', T(PAR_INVITATION ? 'jamaisCompte' : 'jamais')));

    var rang = elem('div', 'flt-rang');
    if (demande) {
      var non = elem('button', 'flt-b flt-b-non', T('non'));
      var oui = elem('button', 'flt-b flt-b-oui', T('oui'));
      non.addEventListener('click', function () { repondre(false); fermerPanneau(); });
      oui.addEventListener('click', function () { repondre(true); fermerPanneau(); });
      rang.appendChild(non); rang.appendChild(oui);
    } else {
      var stop = elem('button', 'flt-b flt-b-non', T('arreter'));
      var ok = elem('button', 'flt-b flt-b-oui', T('fermer'));
      stop.addEventListener('click', function () {
        repondre(false);
        fermerPanneau();
        var mot = elem('div', 'flt-pastille', T('arrete'));
        document.body.appendChild(mot);
        setTimeout(function () { if (mot.parentNode) mot.parentNode.removeChild(mot); }, 4000);
      });
      ok.addEventListener('click', fermerPanneau);
      rang.appendChild(stop); rang.appendChild(ok);
    }
    boite.appendChild(rang);
    fond.appendChild(boite);
    /* Cliquer à côté ferme, mais SEULEMENT quand il n'y a rien à décider :
       une question à laquelle on répond par mégarde n'a pas été posée. */
    if (!demande) fond.addEventListener('click', function (e) { if (e.target === fond) fermerPanneau(); });
    document.body.appendChild(fond);
    (boite.querySelector('.flt-b-oui') || boite).focus && boite.querySelector('.flt-b-oui').focus();
    panneau = fond;
  }

  var pastille = null;
  function poserPastille() {
    if (pastille) return;
    poserStyle();
    pastille = elem('button', 'flt-pastille', T('pastille'));
    pastille.setAttribute('title', T('actif'));
    pastille.addEventListener('click', function () { ouvrirPanneau(false); });
    document.body.appendChild(pastille);
  }
  function retirerPastille() {
    if (pastille && pastille.parentNode) pastille.parentNode.removeChild(pastille);
    pastille = null;
  }

  function repondre(accepte) {
    ecrire(CLE_ACCORD, accepte ? 'oui' : 'non');
    if (accepte) { poserPastille(); demarrer(); }
    else {
      retirerPastille();
      oublier(CLE_FILE);          // ce qui attendait ne partira pas
      arrete = true;
    }
  }

  /* ── LA FILE ───────────────────────────────────────────────────────────
     Sept formes, pas une de plus. `pousser()` refuse ce qui n'est pas dans la
     liste : c'est la garantie structurelle que rien d'écrit ne s'ajoute un
     jour par distraction, dans six mois, quand on voudra « juste aussi
     savoir ce qu'ils ont répondu ». */
  var FORMES = { ouvre: 1, chapitre: 1, element: 1, exercice: 1, note: 1, panne: 1, fin: 1 };
  /* Une page de livre replie jusqu a cent cinquante fiches de figure d un
     coup : quatre cents evenements se remplissaient en deux seances, et les
     plus vieilles — donc les premieres impressions, les plus precieuses —
     partaient a la poubelle en silence. */
  var PLAFOND = 2000;
  var arrete = false;

  function file() {
    try { var f = JSON.parse(lire(CLE_FILE) || '[]'); return Array.isArray(f) ? f : []; }
    catch (e) { return []; }
  }
  function poserFile(f) {
    if (f.length > PLAFOND) f = f.slice(f.length - PLAFOND);
    ecrire(CLE_FILE, JSON.stringify(f));
  }

  var SEANCE = (function () {
    try {
      var s = sessionStorage.getItem(CLE_SEANCE);
      if (!s) { s = Math.random().toString(36).slice(2, 10); sessionStorage.setItem(CLE_SEANCE, s); }
      return s;
    } catch (e) { return Math.random().toString(36).slice(2, 10); }
  })();

  function pousser(ev) {
    if (arrete || !ev || !FORMES[ev.k]) return;
    if (lire(CLE_ACCORD) !== 'oui') return;
    ev.q = SEANCE;
    ev.t = Date.now();
    var f = file();
    f.push(ev);
    poserFile(f);
  }

  /* ── L'ENVOI ───────────────────────────────────────────────────────────
     Le SDK pèse quelques centaines de kilo-octets. On ne le charge qu'au
     premier envoi réel, et jamais sur un appareil qui a dit non : un élève
     qui refuse ne doit pas payer le poids de ce qu'il a refusé. */
  var fb = null, chargement = null;
  function charger() {
    if (fb) return Promise.resolve(fb);
    if (chargement) return chargement;
    chargement = (async function () {
      var cfg = await import(BASE + 'firebase-config.js' + VERSION_Q);
      var C = cfg.CONFIG_FIREBASE || {};
      if (!C.apiKey || !C.projectId) throw new Error('Firebase non configuré');
      var base = 'https://www.gstatic.com/firebasejs/' + (cfg.VERSION_SDK || '10.12.0') + '/';
      var app = await import(base + 'firebase-app.js');
      var auth = await import(base + 'firebase-auth.js');
      var fs = await import(base + 'firebase-firestore.js');
      /* `getApps()` d'abord : sur le cahier et l'accueil, `compte.js` a déjà
         initialisé l'application par défaut, et `initializeApp` une seconde
         fois lève. On se greffe sur la sienne plutôt que d'en ouvrir une
         seconde — deux applications, ce seraient deux sessions, donc deux
         identités anonymes pour un seul appareil. */
      var application = app.getApps().length ? app.getApp() : app.initializeApp(C);
      var a = auth.getAuth(application);
      /* ── QUI PORTE LA LECTURE ──
         UN COMPTE CONNECTE D'ABORD. S'il y en a un, c'est lui : le
         professeur a invite une personne, il doit retrouver cette personne.

         ANONYME SINON, et c'est toujours le bon defaut. Firebase tire un
         identifiant stable pour l'appareil sans demander ni nom ni adresse :
         un essai distribue par lien ne detient alors aucune donnee
         personnelle d'un mineur. Il faut avoir active « Anonymous » dans la
         console, et « Email link » pour les invitations.

         ON N'ATTEND PAS LA RESTAURATION DE SESSION AVANT DE DECIDER. Firebase
         relit IndexedDB de facon asynchrone ; `currentUser` est nul pendant
         un aller-retour, et ouvrir une session anonyme dans cet intervalle
         couperait la lecture en deux moities qui ne se rejoindraient jamais.
         On laisse donc `onAuthStateChanged` parler une premiere fois. */
      var qui = await new Promise(function (ok) {
        var fait = false;
        var stop = auth.onAuthStateChanged(a, function (u) {
          if (fait) return;
          fait = true; stop();
          ok(u);
        });
        setTimeout(function () { if (!fait) { fait = true; ok(a.currentUser); } }, 4000);
      });
      if (!qui) { await auth.signInAnonymously(a); qui = a.currentUser; }
      fb = {
        a: a, f: fs, db: fs.getFirestore(application), uid: qui.uid,
        anonyme: !!qui.isAnonymous,
        adresse: (qui.email || '').toLowerCase(),
      };
      return fb;
    })();
    return chargement;
  }

  /* Ce qu'on sait de l'appareil, et qui tient en une ligne. Pas la chaîne
     d'agent complète : elle est assez précise pour distinguer un visiteur
     parmi mille, et on n'en a aucun besoin. Une famille et une taille
     suffisent à répondre « est-ce que ça marche sur leurs téléphones ». */
  function appareil() {
    var ua = navigator.userAgent || '';
    var famille = /Android/i.test(ua) ? 'android'
      : /iPhone|iPad|iPod/i.test(ua) ? 'ios'
      : /Windows/i.test(ua) ? 'windows'
      : /Mac OS X/i.test(ua) ? 'mac'
      : /Linux/i.test(ua) ? 'linux' : 'autre';
    var nav = /Edg\//.test(ua) ? 'edge'
      : /OPR\//.test(ua) ? 'opera'
      : /Chrome\//.test(ua) ? 'chrome'
      : /Firefox\//.test(ua) ? 'firefox'
      : /Safari\//.test(ua) ? 'safari' : 'autre';
    var r = {};
    try {
      r.ecran = Math.round(screen.width) + 'x' + Math.round(screen.height);
      r.fenetre = Math.round(innerWidth) + 'x' + Math.round(innerHeight);
      r.dpr = Math.round((devicePixelRatio || 1) * 100) / 100;
      r.tactile = (navigator.maxTouchPoints || 0) > 0;
    } catch (e) { /* un navigateur avare : tant pis */ }
    try {
      var c = navigator.connection;
      if (c && c.effectiveType) r.reseau = c.effectiveType;   // '4g', '3g', 'slow-2g'
    } catch (e) { /* pas partout */ }
    r.famille = famille; r.nav = nav; r.langue = LANGUE;
    return r;
  }

  /* ── L'INTERRUPTEUR ────────────────────────────────────────────────────
     La console de l'essai peut fermer un groupe, ou tout éteindre. Le réglage
     vit dans un document que tout le monde peut LIRE et que seul le
     propriétaire peut écrire, et on le consulte une fois par séance, juste
     avant le premier envoi.

     SANS LUI, « ARRÊTER L'ESSAI » NE VOUDRAIT RIEN DIRE. Un collecteur qu'on
     ne peut plus joindre continue jusqu'à ce que chaque élève pense à ouvrir
     un lien de sortie, c'est-à-dire pour toujours. Un essai sur des mineurs
     doit pouvoir être éteint depuis un fauteuil, et en une seconde.

     Éteint, l'appareil ne se contente pas de se taire : il efface la file, le
     code et l'accord. À la visite suivante il est redevenu un visiteur
     ordinaire, et le panneau ne lui redemandera rien. */
  var verdictArret = null;
  function interrupteur(x) {
    if (verdictArret) return verdictArret;
    var d = x.f;
    verdictArret = d.getDoc(d.doc(x.db, 'reglages', 'pilote')).then(function (r) {
      var v = (r && r.exists && r.exists()) ? (r.data() || {}) : {};
      var fermes = v.fermes || [];
      var eteint = v.pause === true || fermes.indexOf(CODE) >= 0;
      if (!eteint) return false;
      arrete = true;
      [CLE_FILE, CLE_CODE, CLE_ACCORD].forEach(oublier);
      retirerPastille();
      return true;
    }).catch(function () {
      /* Injoignable — hors ligne, règles absentes. On continue : un essai qui
         s'arrête parce que le réseau a toussé perdrait la séance entière, et
         le réglage sera relu à la prochaine. */
      verdictArret = null;
      return false;
    });
    return verdictArret;
  }

  var envoiEnCours = false;
  function vider(dernier) {
    if (arrete || envoiEnCours) return Promise.resolve();
    if (lire(CLE_ACCORD) !== 'oui') return Promise.resolve();
    var f = file();
    if (!f.length) return Promise.resolve();
    envoiEnCours = true;
    var lot = f.slice();
    return charger().then(function (x) {
      return interrupteur(x).then(function (eteint) {
        if (eteint) { envoiEnCours = false; return null; }
        return x;
      });
    }).then(function (x) {
      if (!x) return null;
      var d = x.f;
      /* Un document PAR LOT, et non par événement. Firestore facture à
         l'écriture : trois cents clics d'un élève, c'est un document ici et
         trois cents là-bas. Le palier gratuit tient un essai entier. */
      var p = d.addDoc(d.collection(x.db, 'pilote', x.uid, 'lots'), {
        code: CODE, seance: SEANCE, n: lot.length, ev: lot,
        recu: d.serverTimestamp(), envoye: Date.now(), fin: !!dernier,
      });
      /* Le profil, fusionné : il ne grandit pas, il se met à jour. C'est lui
         qu'on lit pour compter les appareils et les retours. */
      var prof = d.setDoc(d.doc(x.db, 'pilote', x.uid), {
        code: CODE, vu: d.serverTimestamp(), appareil: appareil(),
        debut: d.serverTimestamp(),
      }, { merge: true });
      return Promise.all([p, prof]);
    }).then(function (fait) {
      if (!fait) return;
      /* On retire EXACTEMENT ce qui est parti, pas la file entière : des
         événements ont pu s'ajouter pendant l'envoi, et un `removeItem`
         franc les aurait emportés avec. */
      var reste = file().slice(lot.length);
      poserFile(reste);
      envoiEnCours = false;
    }).catch(function () {
      /* Réseau coupé, règles refusées, quota : on garde tout et on réessaiera.
         Aucun message : ce n'est pas le problème de l'élève. */
      envoiEnCours = false;
    });
  }

  /* ── CE QU'ON OBSERVE ──────────────────────────────────────────────────

     1. LA PAGE. Laquelle, et quel livre si c'en est un. */
  function quellePage() {
    var p = location.pathname;
    var m = /\/library\/([^/]+)\//.exec(p);
    if (m) return { p: 'livre', b: decodeURIComponent(m[1]) };
    if (/\/cahier\//.test(p)) return { p: 'cahier', b: '' };
    if (/notebook\.html$/.test(p)) return { p: 'notebook', b: '' };
    if (/simulations\.html$/.test(p)) return { p: 'simulations', b: '' };
    if (/project\.html$/.test(p)) return { p: 'projet', b: '' };
    if (/404\.html$/.test(p)) return { p: '404', b: '' };
    return { p: 'accueil', b: '' };
  }
  var OU = quellePage();

  var t0 = Date.now();
  var minuteur = 0;

  function demarrer() {
    if (arrete || demarrer.fait) return;
    demarrer.fait = true;

    pousser({ k: 'ouvre', p: OU.p, b: OU.b });

    /* 2. LES CHAPITRES, ET LE TEMPS PASSÉ DEDANS.
       Un livre est UNE page qui défile : les chapitres sont des `.book-chapter`
       empilés, pas des adresses. On compte donc le temps où chacun occupe le
       milieu de l'écran, et non le temps où il est « affiché » — une section
       de trois mille pixels est à l'écran pendant qu'on lit la précédente.
       Le seuil haut/bas isole la bande centrale, celle qu'on lit vraiment. */
    var compteur = {};
    var courant = null, depuis = 0;

    /* JUSQU'OU ILS SONT DESCENDUS. Le temps passe dans un chapitre dit s'il
       a retenu ; il ne dit pas OU on s'est arrete. Or « ils abandonnent aux
       deux tiers du chapitre 4 » est une phrase sur laquelle on peut agir, et
       « ils ont passe quatre minutes dans le chapitre 4 » n'en est pas une.

       On garde donc, par chapitre, le point le plus bas atteint, en centiemes
       de sa hauteur. Releve au defilement plutot qu'a la sortie : quelqu'un
       qui descend puis remonte pour relire a bel et bien atteint le bas. */
    var fond = {};
    var chapitresVus = [];
    function jauger() {
      for (var i = 0; i < chapitresVus.length; i++) {
        var c = chapitresVus[i];
        var r = c.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        var h = r.height || 1;
        /* Le bas de la fenetre, rapporte au chapitre : a zero on vient
           d'entrer, a cent on en voit la derniere ligne. */
        var p = Math.round(100 * Math.min(1, Math.max(0, (innerHeight - r.top) / h)));
        if (p > (fond[c.id] || 0)) fond[c.id] = p;
      }
    }
    var jaugeEnCours = false;
    addEventListener('scroll', function () {
      if (jaugeEnCours) return;
      jaugeEnCours = true;
      requestAnimationFrame(function () { jaugeEnCours = false; jauger(); });
    }, { passive: true });

    function quitter() {
      if (!courant) return;
      var s = Math.round((Date.now() - depuis) / 1000);
      if (s >= 3) {                     // moins de trois secondes, c'est un passage
        var id = courant.id;
        compteur[id] = (compteur[id] || 0) + s;
      }
      courant = null;
    }
    /* L'INSTANT DE LA PREMIERE ENTREE, par chapitre. Sans lui, une frise
       chronologique est un mensonge : tous les evenements d'une seance
       portent l'horodatage du REPLI, c'est-a-dire du depart, et se
       tasseraient donc a la fin dans une seule colonne. On garde l'ecart,
       en secondes, depuis l'ouverture de la page. */
    var arrive = {};
    function entrer(el) {
      if (courant === el) return;
      quitter();
      courant = el; depuis = Date.now();
      if (arrive[el.id] === undefined) arrive[el.id] = Math.round((depuis - t0) / 1000);
    }

    var vus = [];
    var obsCh = window.IntersectionObserver ? new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var i = vus.indexOf(e.target);
        if (i >= 0) vus.splice(i, 1);
        if (e.isIntersecting) vus.push(e.target);
      });
      /* Le dernier ENTRÉ gagne. Prendre « le plus haut » paraît juste et ne
         l'est pas : un chapitre qu'on a dépassé garde le `top` le plus
         petit — très négatif — et gagnerait pour toujours. Le piège s'est
         déjà refermé sur le corbeau qui suit la lecture, dans
         chrome-pages.js ; on ne le retend pas ici. */
      if (vus.length) entrer(vus[vus.length - 1]);
      else quitter();
    }, { rootMargin: '-35% 0px -45% 0px' }) : null;

    /* 3. LES FIGURES, UNE PAR UNE, ET EN DÉTAIL ────────────────────────────
       Chaque élément interactif est un `.iw[data-iw]` et `data-iw` nomme son
       type. On ne suit pas le TYPE mais l'EXEMPLAIRE : la même carte placée
       dans deux chapitres est deux figures, elle est lue à deux moments et
       elle peut très bien marcher ici et pas là.

       CE QU'ON CHERCHE N'EST PAS « COMBIEN DE CLICS ». C'est : est-ce que
       l'élève a compris que cette chose était vivante, est-ce qu'il a trouvé
       par où la prendre, et est-ce qu'il s'est énervé. Trois questions, et
       aucune ne se lit dans un total de clics :

         • LE TEMPS D'HÉSITATION (`av`) — les secondes entre « la figure est à
           l'écran » et « il l'a touchée ». Une figure prise en deux secondes
           s'annonce ; une figure prise au bout de quarante secondes ne
           s'annonce pas, même si elle finit par être prise.
         • LES CLICS MORTS (`mo`) — il a cliqué, et RIEN n'a changé dans la
           figure. C'est le signal le plus fort du lot : il a cru que c'était
           un bouton et ce n'en était pas un. Une figure à beaucoup de clics
           morts a une fausse promesse quelque part dans son dessin.
         • L'ÉNERVEMENT (`rg`) — trois clics ou plus au même endroit en moins
           d'une seconde. On tape sur ce qui ne répond pas.

       Et pour les réglages continus, ce que le total cache :
         • `gl` — quelle PART de la course d'un curseur a été explorée. Dix
           allers-retours dans le premier dixième, c'est quelqu'un qui n'a pas
           vu que ça allait plus loin.
         • `rv` — les changements de sens. Beaucoup de retours en arrière,
           c'est une recherche, pas une lecture.

       RIEN DE CE QUI EST ÉCRIT N'EST LU. Aucune valeur de champ, aucun texte,
       aucune réponse : on relève le RÔLE du bouton pressé — sa classe, jamais
       son libellé — et on compte. La promesse faite dans le panneau tient
       exactement, et elle tient par construction. */

    var fiches = [];
    var parBoite = window.WeakMap ? new WeakMap() : null;
    var rangs = {};          // les figures d'un chapitre, pour numéroter

    /* LE RANG SE CALCULE À LA FIN, JAMAIS À LA RENCONTRE. Une fiche peut
       naître très tôt — l'observateur de mutations en crée une dès qu'une
       figure bouge, et une figure bouge pendant que la page s'analyse
       encore. À cet instant le chapitre ne contient qu'une partie de ses
       figures, et trois d'entre elles se voyaient attribuer le rang zéro :
       trois fiches distinctes confondues en une seule ligne du rapport.
       Au repli, le document est entier et le rang est vrai. */
    function rangDe(box, chId) {
      if (!rangs[chId]) {
        var ch = chId ? document.getElementById(chId) : null;
        rangs[chId] = [].slice.call((ch || document).querySelectorAll('.iw[data-iw]'));
      }
      var i = rangs[chId].indexOf(box);
      return i < 0 ? 0 : i;
    }

    function fiche(box) {
      if (!box) return null;
      if (parBoite && parBoite.has(box)) return parBoite.get(box);
      var ch = box.closest ? box.closest('.book-chapter[id]') : null;
      var chId = (ch && ch.id) || '';
      /* SON TITRE, POUR QU'ELLE AIT UN NOM. « map #3 » ne se retient pas et
         ne se cherche pas ; « map — Le Maroc physique » se retrouve dans le
         livre en trois secondes. C'est le titre ECRIT PAR L'AUTEUR, deja
         public dans le manuel : ce n'est pas du texte d'eleve, et la regle
         « rien de ce qui est saisi » reste entiere. */
      var ti = '';
      try {
        var h = box.querySelector('.iw-title');
        ti = h ? (h.textContent || '').trim().slice(0, 70) : '';
      } catch (e) { ti = ''; }

      var f = {
        box: box, e: box.getAttribute('data-iw') || '?', c: chId, i: 0, ti: ti,
        n: 0, vu: 0, av: -1, ct: {}, mo: 0, rg: 0, kb: 0, rv: 0, gl: 0, fi: 0, db: 0, re: 0,
        emis: 0,
        depuis: 0, neLe: 0, prise: 0, change: 0,
        clics: [], curseur: null,
      };
      if (parBoite) parBoite.set(box, f);
      fiches.push(f);
      return f;
    }
    function ficheDe(n) {
      var box = n && n.closest ? n.closest('.iw[data-iw]') : null;
      return box ? fiche(box) : null;
    }

    /* LE RÔLE D'UN BOUTON, SANS SON TEXTE. On remonte jusqu'à la première
       classe qui commence par « iw » — `iw-btn`, `iwtl-chip`, `iwm-lpick` —
       parce que c'est ainsi que les cent deux éléments nomment leurs parties.
       Un clic qui ne trouve aucune classe de ce genre a touché la figure
       elle-même et pas une de ses commandes : on l'enregistre sous « . », et
       c'est un renseignement à part entière. */
    function role(n, box) {
      for (var e = n; e && e !== box.parentNode; e = e.parentNode) {
        var cl = e.className;
        if (typeof cl !== 'string') continue;
        var m = /(^|\s)(iw[a-z0-9-]{1,24})/.exec(cl);
        if (m && e !== box) return m[2];
      }
      return '.';
    }

    /* CE QUI A CHANGÉ, ET OÙ. Un seul observateur pour toute la page plutôt
       que cent cinquante-sept : on note l'instant du dernier changement DANS
       chaque figure, et un clic suivi de rien pendant un tiers de seconde est
       un clic mort. On surveille aussi les attributs SVG, sans quoi une
       orbite qui tourne ou une courbe qui se redessine passerait pour
       immobile — et la figure la plus vivante du livre serait accusée d'être
       morte. */
    if (window.MutationObserver) {
      new MutationObserver(function (recs) {
        var t = Date.now();
        for (var i = 0; i < recs.length; i++) {
          var f = ficheDe(recs[i].target.nodeType === 1 ? recs[i].target : recs[i].target.parentNode);
          if (f) f.change = t;
        }
      }).observe(document.body, {
        childList: true, subtree: true, characterData: true, attributes: true,
        attributeFilter: ['class', 'style', 'value', 'checked', 'selected', 'aria-expanded',
          'aria-selected', 'aria-checked', 'hidden', 'transform', 'd', 'cx', 'cy', 'x', 'y',
          'x1', 'y1', 'x2', 'y2', 'points', 'width', 'height', 'fill', 'stroke', 'offset', 'r'],
      });
    }

    var dernier = { f: null, t: 0 };
    function toucher(e, quoi) {
      var f = ficheDe(e.target);
      if (!f) return;
      var t = Date.now();

      /* ── CE QUI SE MESURE SUR LE CLIC BRUT ──
         AVANT le dédoublonnage, et c'est tout le sujet de ce bloc. Le garde-fou
         qui suit ignore deux événements rapprochés sur la même figure — il est
         là pour que `click` PUIS `change` ne comptent pas double — mais quatre
         clics rageurs en quatre-vingt-dix millisecondes sont, eux, rapprochés
         exprès. Mis après le garde-fou, le détecteur d'énervement ne voyait
         jamais rien : il était aveuglé par la protection contre le contraire.
         Un `click` capturé sur `document` arrive une fois par clic réel, donc
         ici on compte des clics et non des doublons. */
      if (quoi === 'clic') {
        var x = e.clientX || 0, y = e.clientY || 0;
        f.clics.push({ t: t, x: x, y: y });
        if (f.clics.length > 5) f.clics.shift();
        /* L'ÉNERVEMENT : trois clics au même endroit en moins d'une seconde. */
        if (f.clics.length >= 3) {
          var a = f.clics[f.clics.length - 3];
          if (t - a.t < 1000 && Math.abs(x - a.x) < 30 && Math.abs(y - a.y) < 30) {
            f.rg++;
            f.clics.length = 0;
          }
        }
        /* LE CLIC MORT : on repasse après un tiers de seconde et on demande si
           quoi que ce soit a bougé dans la figure depuis. */
        var avant = f.change;
        setTimeout(function () { if (f.change === avant) f.mo++; }, 330);
      }

      /* UN GESTE, PAS UN ÉVÉNEMENT. Cocher une case émet `click` PUIS
         `change` : quatre gestes mesurés donnaient douze interactions. Un
         compte trois fois trop grand est pire qu'un compte absent — celui-là,
         on le croit. */
      if (f === dernier.f && t - dernier.t < 250) return;
      dernier = { f: f, t: t };

      f.n++;
      if (!f.prise) {
        f.prise = t;
        /* L'hésitation ne se compte que si on a vu la figure arriver. Sans
           ce point de départ on ne sait rien, et -1 dit « on ne sait pas »
           plutôt que d'inventer un zéro flatteur. */
        if (f.neLe) f.av = Math.round((t - f.neLe) / 100) / 10;
      }
      if (quoi === 'clavier') { f.kb++; return; }

      var r = role(e.target, f.box);
      f.ct[r] = (f.ct[r] || 0) + 1;
    }

    document.addEventListener('click', function (e) { toucher(e, 'clic'); }, true);
    document.addEventListener('change', function (e) { toucher(e, 'change'); }, true);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Tab' || e.key === 'Shift') return;
      toucher(e, 'clavier');
    }, true);

    /* LES CURSEURS. `input` sur un `range` arrive à chaque pixel : on ne le
       compte pas comme un geste, on en tire la PART DE LA COURSE explorée et
       le nombre de demi-tours. Un champ de texte n'est jamais lu ici — ni sa
       valeur, ni sa longueur. */
    document.addEventListener('input', function (e) {
      var n = e.target;
      if (!n || n.type !== 'range') return;
      var f = ficheDe(n);
      if (!f) return;
      var v = parseFloat(n.value);
      if (!isFinite(v)) return;
      var lo = parseFloat(n.min), hi = parseFloat(n.max);
      if (!isFinite(lo)) lo = 0;
      if (!isFinite(hi)) hi = 100;
      var c = f.curseur;
      if (!c) { c = f.curseur = { bas: v, haut: v, prec: v, sens: 0 }; toucher(e, 'curseur'); }
      if (v < c.bas) c.bas = v;
      if (v > c.haut) c.haut = v;
      var s = v > c.prec ? 1 : v < c.prec ? -1 : 0;
      if (s && c.sens && s !== c.sens) f.rv++;
      if (s) c.sens = s;
      c.prec = v;
      f.gl = hi > lo ? Math.round(100 * (c.haut - c.bas) / (hi - lo)) : 0;
    }, true);

    /* 4. VUE, PAS VUE, ET COMBIEN DE TEMPS ─────────────────────────────────
       « Vue » ne peut pas être une seule proportion. Un seuil à quarante pour
       cent paraît raisonnable et écarte précisément les figures qui comptent
       le plus : une carte ou une simulation est plus haute que l'écran d'un
       téléphone, donc elle n'atteint JAMAIS quarante pour cent d'elle-même, et
       serait restée « jamais vue » même lue de bout en bout. Mesuré ici : zéro
       figure vue sur cent cinquante-sept.

       Deux façons d'être vue, donc, et la seconde rattrape la première :
       quatre dixièmes de la figure, OU la moitié de l'écran occupée par elle.
       On garde aussi le temps passé devant et le nombre de RETOURS : revenir
       trois fois sur la même figure, c'est soit qu'elle est bonne, soit qu'on
       ne l'a pas comprise — et la colonne des clics morts tranche. */
    var obsEl = window.IntersectionObserver ? new IntersectionObserver(function (es) {
      var t = Date.now();
      es.forEach(function (e) {
        var f = fiche(e.target);
        if (!f) return;
        var assez = e.intersectionRatio >= 0.4
          || (e.intersectionRect && e.intersectionRect.height >= innerHeight * 0.5);
        if (assez && !f.depuis) {
          f.depuis = t;
          if (!f.neLe) f.neLe = t; else f.re++;
        } else if (!e.isIntersecting && f.depuis) {
          f.vu += Math.round((t - f.depuis) / 100) / 10;
          f.depuis = 0;
        }
      });
    }, { threshold: [0, 0.2, 0.4, 0.7] }) : null;

    /* ── QUAND REGARDER LA PAGE ────────────────────────────────────────
       PAS AU MOMENT OÙ `body` APPARAÎT, et c'est tout le sujet. Un livre est
       un fichier unique de près de deux méga-octets : mesuré sur le manuel du
       baccalauréat, la balise `<body>` arrive à l'octet 277 000 et le dernier
       chapitre à l'octet 1 127 000. Un script asynchrone posé dans le `<head>`
       s'exécute donc quand `document.body` existe déjà et qu'il reste UN
       MÉGA-OCTET ET DEMI à analyser — c'est-à-dire devant un document où la
       plupart des chapitres et des figures n'existent pas encore.

       La première version faisait exactement ça et comptait zéro chapitre sur
       huit, zéro figure sur cent cinquante-sept, sans rien dire : une mesure
       vide qu'on aurait prise pour « ils n'ont rien lu ». On attend donc la
       fin de l'analyse, puis on repasse une fois au `load` — un livre pose
       des iframes et des figures tardives, et une figure arrivée après coup
       serait invisible pour toujours. */
    var connus = window.WeakSet ? new WeakSet() : null;
    function neuf(el) {
      if (!connus) return true;
      if (connus.has(el)) return false;
      connus.add(el);
      return true;
    }
    function scanner() {
      if (obsCh) {
        [].slice.call(document.querySelectorAll('.book-chapter[id]'))
          .forEach(function (c) { if (neuf(c)) { obsCh.observe(c); chapitresVus.push(c); } });
      }
      if (obsEl) {
        [].slice.call(document.querySelectorAll('.iw[data-iw]'))
          .forEach(function (b) { if (neuf(b)) obsEl.observe(b); });
      }
    }
    if (document.readyState === 'loading') addEventListener('DOMContentLoaded', scanner);
    else scanner();
    addEventListener('load', scanner);

    /* 5. LES SCORES. Les éléments d'exercice écrivent leur résultat dans le
       DOM ; on relève le COMPTE et jamais le contenu. « Sept sur dix » dit si
       le chapitre est au bon niveau ; la copie de l'élève ne nous regarde
       pas — et elle appartient à son professeur, pas à nous. */
    document.addEventListener('click', function (e) {
      var box = e.target && e.target.closest ? e.target.closest('.iw[data-iw]') : null;
      if (!box) return;
      setTimeout(function () {
        var s = box.querySelector('[data-score], .iwq-score, .iwtl-score, .iwx-msg');
        if (!s) return;
        var m = /(\d+)\s*(?:\/|sur|of|من)\s*(\d+)/.exec(s.textContent || '');
        if (!m) return;
        var ok = +m[1], sur = +m[2];
        if (!(sur > 0) || ok > sur) return;
        var ch = box.closest('.book-chapter[id]');
        pousser({ k: 'exercice', b: OU.b, c: (ch && ch.id) || '', e: box.getAttribute('data-iw') || '?', ok: ok, sur: sur });
      }, 60);
    }, true);

    /* 6. CE QUI CASSE. La chose la plus précieuse de la liste : des appareils
       qu'on ne possède pas, des réseaux qu'on n'a pas, et une erreur qu'aucun
       élève ne signalera jamais parce qu'il croira que c'est lui. */
    addEventListener('error', function (e) {
      pousser({
        k: 'panne', b: OU.b,
        m: String((e && e.message) || 'erreur').slice(0, 200),
        f: String((e && e.filename) || '').split('/').pop().slice(0, 80),
        l: (e && e.lineno) || 0,
      });
    });
    addEventListener('unhandledrejection', function (e) {
      var r = e && e.reason;
      pousser({ k: 'panne', b: OU.b, m: ('promesse: ' + ((r && r.message) || r || '?')).slice(0, 200), f: '', l: 0 });
    });

    /* 7. LE CAHIER. Combien d'entrées, jamais lesquelles. */
    if (OU.p === 'cahier') {
      document.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('[data-add], .nb-add, .add-block') : null;
        if (b) pousser({ k: 'note' });
      }, true);
    }

    /* ── LA CLÔTURE ──
       On replie les compteurs en événements au moment de partir. Les tenir en
       mémoire plutôt que d'écrire à chaque clic évite d'écrire mille fois
       dans localStorage pendant une lecture. */
    function replier() {
      quitter();
      var t = Date.now();
      rangs = {};            // le document a change depuis le dernier repli

      Object.keys(compteur).forEach(function (id) {
        var el = document.getElementById(id);
        pousser({
          k: 'chapitre', b: OU.b, c: id,
          n: (el && el.getAttribute('data-ctitle')) || '',
          s: compteur[id],
          /* Jusqu'ou ils sont descendus dedans, en centiemes. */
          pr: fond[id] || 0,
          /* Et a quelle seconde de la seance ils y sont arrives. */
          d0: arrive[id] === undefined ? -1 : arrive[id],
        });
        delete compteur[id];
      });

      /* UNE FICHE PAR FIGURE RENCONTRÉE, et seulement celles-là : une figure
         restée sous la ligne de flottaison n'a rien à raconter, et le compte
         total part avec « ouvre » — le rapport en déduit les jamais-vues sans
         qu'on ait à envoyer cent cinquante-sept objets vides. */
      for (var i = 0; i < fiches.length; i++) {
        var f = fiches[i];
        if (f.depuis) { f.vu += Math.round((t - f.depuis) / 100) / 10; f.depuis = t; }
        if (!f.neLe && !f.n) continue;
        /* RIEN DE NEUF, RIEN À DIRE. Un départ déclenche `visibilitychange`
           PUIS `pagehide` : le repli tournait deux fois et réexpédiait chaque
           figure, la seconde fois avec des compteurs remis à zéro. Vingt-deux
           fiches pour onze figures, et des moyennes divisées par deux sans
           que rien ne le signale. Une figure déjà racontée ne repart donc que
           si quelque chose s'est passé depuis. */
        var rien = !f.n && f.vu < 1 && !f.mo && !f.rg && !f.re;
        if (rien && f.emis) continue;
        f.emis = 1;
        f.i = rangDe(f.box, f.c);

        /* DEUX CHOSES QU'ON NE PEUT MESURER QU'À LA FIN.
           `fi` — la figure porte-t-elle une marque de réussite ? C'est une
           présomption, pas une certitude, et le rapport le dit ainsi.
           `db` — déborde-t-elle de sa boîte sur CET écran ? Un tableau plus
           large que le téléphone est invisible en tant que défaut depuis un
           ordinateur, et c'est exactement le genre de chose qu'un essai sur
           de vrais appareils est là pour trouver. */
        var fini = 0;
        try {
          fini = f.box.querySelector('.ok, .correct, .juste, .reussi, [data-done], .iw-ok') ? 1 : 0;
        } catch (e) { fini = 0; }
        var deborde = 0;
        try { deborde = f.box.scrollWidth > f.box.clientWidth + 4 ? 1 : 0; } catch (e) { deborde = 0; }

        /* Les six commandes les plus pressées, pas les trente : au-delà, on
           range du bruit qui coûte de la place et ne se lit dans aucun
           tableau. */
        var ct = {}, noms = Object.keys(f.ct).sort(function (a, b) { return f.ct[b] - f.ct[a]; });
        for (var j = 0; j < noms.length && j < 6; j++) ct[noms[j]] = f.ct[noms[j]];

        pousser({
          k: 'element', b: OU.b, c: f.c, e: f.e, i: f.i, ti: f.ti,
          /* La seconde de la seance ou la figure est apparue. Avec `av`, le
             premier geste se replace tout seul : d0 + av. */
          d0: f.neLe ? Math.round((f.neLe - t0) / 1000) : -1,
          n: f.n, vu: Math.round(f.vu) || 0, av: f.av,
          ct: ct, mo: f.mo, rg: f.rg, kb: f.kb, rv: f.rv, gl: f.gl,
          fi: fini, db: deborde, re: f.re,
        });
        /* Remise à zéro de ce qui a été raconté : une seconde clôture dans la
           même séance ne doit pas réexpédier les mêmes gestes. Ce qui n'est
           pas cumulable — l'hésitation, la part de course — ne bouge pas. */
        f.n = 0; f.vu = 0; f.mo = 0; f.rg = 0; f.kb = 0; f.rv = 0; f.re = 0; f.ct = {};
      }
    }

    /* `visibilitychange` et NON `beforeunload` : sur mobile, une page qu'on
       quitte en changeant d'application ne reçoit souvent que celui-là, et
       `beforeunload` n'arrive jamais. C'est le seul moment fiable. */
    /* UNE SEULE CLÔTURE PAR ÉCLIPSE. Un onglet passe « caché » à chaque fois
       qu'on change d'application, et sur un téléphone c'est dix fois dans une
       lecture ; mesuré ici pendant les essais, dix-huit clôtures pour une
       seule séance. Additionner leurs secondes aurait donné un temps de
       lecture faux et flatteur. On n'en écrit donc qu'une par éclipse, et le
       compteur repart quand l'élève revient : à la lecture, c'est la PLUS
       GRANDE de la séance qui vaut, pas leur somme. */
    var clos = false;
    function clore() {
      replier();
      if (!clos) {
        /* COMBIEN IL Y AVAIT À VOIR, pour savoir ce qui n'a pas été vu. On ne
           renvoie une fiche que pour les figures rencontrées ; sans ces deux
           totaux, « douze figures touchées » ne dit pas s'il y en avait quinze
           ou cent cinquante-sept. Compté ici, à la fermeture, parce que c'est
           le seul moment où le document est certainement entier. */
        pousser({
          k: 'fin', s: Math.round((Date.now() - t0) / 1000),
          nf: document.querySelectorAll('.iw[data-iw]').length,
          nc: document.querySelectorAll('.book-chapter[id]').length,
        });
        clos = true;
      }
      vider(true);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') clore();
      else clos = false;
    });
    addEventListener('pagehide', clore);

    /* Et régulièrement, parce qu'un onglet peut rester ouvert une heure puis
       mourir avec la batterie. */
    minuteur = setInterval(function () { replier(); vider(false); }, 90000);

    /* Ce qui restait d'une séance précédente part tout de suite. */
    setTimeout(function () { vider(false); }, 2500);
  }

  /* ── EN ROUTE ──────────────────────────────────────────────────────────
     On attend que `body` existe : le panneau et la pastille s'y accrochent,
     et ce script est chargé dans le `<head>` des livres. */
  function lancer() {
    var accord = lire(CLE_ACCORD);
    if (accord === 'non') { arrete = true; return; }
    if (accord === 'oui') { poserPastille(); demarrer(); return; }
    ouvrirPanneau(true);
  }

  /* ── EST-ON ATTENDU ? ──────────────────────────────────────────────────
     Si aucun code n'a ete distribue par lien, on regarde si le compte
     connecte porte une invitation. La reponse decide de DEUX choses : si
     l'essai existe du tout pour cette personne, et ce que le panneau lui
     promet. On attend donc Firebase avant d'ouvrir la bouche — un panneau
     qui annonce l'anonymat puis se ravise ne vaut rien.

     Une invitation retiree fait disparaitre l'essai a la visite suivante :
     `actif` est relu a chaque fois, jamais mis en cache. */
  var PAR_INVITATION = false;
  function partir() {
    if (document.body) lancer();
    else addEventListener('DOMContentLoaded', lancer);
  }

  if (CODE) partir();
  else {
    charger().then(function (x) {
      if (x.anonyme || !x.adresse) return null;
      var d = x.f;
      return d.getDoc(d.doc(x.db, 'invites', x.adresse)).then(function (r) {
        if (!r || !r.exists || !r.exists()) return null;
        var v = r.data() || {};
        if (v.actif === false) return null;
        CODE = String(v.code || 'invite').slice(0, 40);
        PAR_INVITATION = true;
        /* On tamponne l'invitation : c'est ce qui permet au professeur de
           savoir qui est venu, et c'est la SEULE jointure entre une adresse
           et un identifiant de mesure. Les regles ne laissent ecrire que
           ces deux champs-la. */
        var neuf = { uid: x.uid };
        if (!v.vu) neuf.vu = d.serverTimestamp();
        return d.setDoc(d.doc(x.db, 'invites', x.adresse), neuf, { merge: true })
          .catch(function () { /* tant pis, la lecture compte plus */ });
      });
    }).then(function () {
      if (CODE) partir();
    }).catch(function () { /* hors ligne, ou rien pour nous : on n'existe pas */ });
  }

  /* Une poignée pour la console du navigateur, quand on teste sur un vrai
     téléphone et qu'on veut savoir ce qui attend. Elle ne lit rien de plus
     que ce que ce fichier a déjà en main. */
  window.FablePilote = {
    code: CODE,
    etat: function () { return { accord: lire(CLE_ACCORD), enAttente: file().length, seance: SEANCE, ou: OU }; },
    vider: function () { return vider(false); },
  };
})();
