/* LE JAGUAR — la version navigateur : le serveur, mais dans la page.
 *
 * Le cahier installé parle à un petit serveur Node qui écrit
 * `notebooks/<id>/notebook.json` sur le disque. Sur le web il n'y a pas de
 * serveur, alors ce fichier en tient le rôle : il détourne `fetch` et répond
 * lui-même aux onze routes que `app.html` appelle. `app.html` n'a pas besoin
 * de savoir lequel des deux lui répond, et c'est tout l'intérêt — une seule
 * application, deux dos.
 *
 * ── Pourquoi un détournement de `fetch` et non une réécriture ──────────────
 * Réécrire `app.html` pour le web aurait donné deux copies de deux cents
 * kilo-octets à faire évoluer ensemble. Elles auraient divergé, comme les
 * médaillons de mérite avaient divergé entre la plateforme et le cahier avant
 * qu'une seule table ne les serve. Ici le contrat est l'API, pas le code.
 *
 * ── Où vivent les données, et pourquoi ce n'est pas suffisant ──────────────
 * IndexedDB est la copie de travail : rapide, hors ligne, sans compte. Ce
 * n'est PAS un endroit sûr pour une année de notes, et il faut le dire au lieu
 * de l'espérer. Cinq façons de tout perdre, toutes ordinaires :
 *
 *   1. « Effacer les données de navigation » — tous les navigateurs rangent le
 *      stockage d'un site avec les cookies et le cache. Un élève qui vide ses
 *      cookies pour réparer un autre site efface son cahier.
 *   2. Safari sur iPhone et iPad supprime le stockage après environ sept jours
 *      sans visite. Deux semaines de vacances et le cahier n'est plus là.
 *      Ajouter le site à l'écran d'accueil lève ce couperet — d'où l'invite.
 *   3. Le stockage est par navigateur ET par profil. Chrome à la maison et
 *      Chrome au collège sont deux cahiers différents. Il n'y a aucune
 *      synchronisation, jamais.
 *   4. La navigation privée est effacée à la fermeture.
 *   5. Quand le disque se remplit, le navigateur jette le stockage « au mieux ».
 *      `navigator.storage.persist()` demande à en être exempté ; c'est la seule
 *      des cinq qu'on puisse fermer par du code.
 *
 * D'où les deux sorties, et elles ne sont pas des options :
 *
 *   • Sur Chrome et Edge de bureau, `showSaveFilePicker` donne un VRAI fichier
 *     sur le disque de l'élève. Choisi une fois, réécrit à chaque
 *     enregistrement. Vider le navigateur n'y touche pas. Déposé dans un
 *     dossier Drive ou OneDrive, il est synchronisé et versionné gratuitement,
 *     par quelqu'un d'autre, et aucune donnée d'élève ne passe par nous.
 *   • Partout ailleurs, l'export d'un fichier et son import. Un cahier pèse
 *     quelques kilo-octets : c'est une pièce jointe, pas une sauvegarde.
 *
 * Et comme un export que personne ne fait ne protège personne, la barre
 * affiche l'âge de la dernière sauvegarde et devient ambre puis rouge. Le
 * rappel fait partie du stockage, pas de la finition.
 */
(function () {
  'use strict';

  /* ── réglages ──────────────────────────────────────────────────────────── */
  const DB = 'jaguar';
  const V = 1;
  const CAHIERS = 'cahiers';        // id → { id, notebook }
  const META = 'meta';              // clé → valeur (poignée de fichier, dates)

  // Au-delà, une image est réduite. Une photo de téléphone fait quatre
  // méga-octets ; collée telle quelle, elle rend le cahier intransportable —
  // et c'est l'export qui est la sécurité, donc il doit rester léger.
  const IMG_MAX = 1600;
  const IMG_Q = 0.82;
  const GARDE_TELLE_QUELLE = 300 * 1024;   // une petite image passe intacte

  const AMBRE = 7 * 24 * 3600 * 1000;      // pas sauvegardé depuis une semaine
  const ROUGE = 14 * 24 * 3600 * 1000;

  const COVERS = [
    { id: 'jaguar', nom: 'Le Jaguar', quoi: 'Le cahier d’écolier, sable et encre' },
    { id: 'koutoubia', nom: 'Koutoubia', quoi: 'Papier recyclé vert d’eau' },
    { id: 'gazelle', nom: 'La Gazelle', quoi: 'Papier rosé, la gazelle en course' },
  ];

  /* ── IndexedDB, réduit à ce qu'on en fait ──────────────────────────────── */
  let _db = null;
  function ouvrir() {
    if (_db) return Promise.resolve(_db);
    return new Promise((ok, ko) => {
      const r = indexedDB.open(DB, V);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains(CAHIERS)) d.createObjectStore(CAHIERS, { keyPath: 'id' });
        if (!d.objectStoreNames.contains(META)) d.createObjectStore(META);
      };
      r.onsuccess = () => { _db = r.result; ok(_db); };
      r.onerror = () => ko(r.error);
    });
  }
  function tx(magasin, mode, fn) {
    return ouvrir().then((d) => new Promise((ok, ko) => {
      const t = d.transaction(magasin, mode);
      const rq = fn(t.objectStore(magasin));
      t.oncomplete = () => ok(rq && rq.result);
      t.onabort = t.onerror = () => ko(t.error);
    }));
  }
  const getCahier = (id) => tx(CAHIERS, 'readonly', (s) => s.get(id));
  const putCahier = (o) => tx(CAHIERS, 'readwrite', (s) => s.put(o));
  const tousCahiers = () => tx(CAHIERS, 'readonly', (s) => s.getAll());
  const getMeta = (k) => tx(META, 'readonly', (s) => s.get(k));
  const setMeta = (k, v) => tx(META, 'readwrite', (s) => s.put(v, k));

  /* ── le modèle, extrait des sources réelles au moment de la construction ──
     `model.js` est produit par `scripts/make-web.mjs` depuis
     `lib/notebook-model.js` et `lib/config.js`. Recopier `defaultNotebook` à la
     main aurait créé une deuxième vérité, et un cahier neuf sur le web aurait
     fini par ne plus avoir la même forme qu'un cahier neuf sur le bureau. */
  const defaultNotebook = (nom) => window.JaguarModel.defaultNotebook(nom);
  const slug = (s) => window.JaguarModel.slug(s);

  /* Le même nettoyage que le serveur, pour la même raison : les pages d'un
     cahier SONT du HTML, écrit dans un `contenteditable` et rendu avec
     `innerHTML`. Ici il n'y a pas de professeur à attaquer, mais un extrait de
     manuel arrive avec son balisage, et surtout : un cahier exporté du web
     doit pouvoir s'ouvrir dans l'application installée, qui nettoie. Deux
     règles différentes aux deux bouts et le rond-point ne tourne plus. */
  const nettoyer = (nb) => (window.JaguarSanitize && window.JaguarSanitize.sanitizeNotebook
    ? window.JaguarSanitize.sanitizeNotebook(nb) : nb);

  /* ── la bibliothèque publiée (les manuels), s'il y en a une ────────────── */
  let _biblio = null;
  function biblio() {
    if (_biblio) return Promise.resolve(_biblio);
    return vraiFetch('../library/library.json')
      .then((r) => (r.ok ? r.json() : { books: [] }))
      .catch(() => ({ books: [] }))
      .then((j) => { _biblio = j && j.books ? j : { books: [] }; return _biblio; });
  }

  /* Le cahier désigne un livre par `books/<quelque chose>`, et ce quelque chose
     peut être le slug publié OU le nom du dossier d'origine — un extrait collé
     depuis l'application installée garde le nom du dossier, qui n'est pas
     forcément propre pour une URL (« Alice in wonderland »). On accepte les
     deux, sinon un cahier venu du bureau perdrait ses extraits en arrivant. */
  async function trouverLivre(dir) {
    const b = await biblio();
    const cle = String(dir || '').replace(/^books\//, '');
    return b.books.find((x) => x.dir === dir || x.slug === cle || x.source === cle) || null;
  }

  /* ── un vrai fichier sur le disque (Chrome, Edge, Opera de bureau) ──────── */
  const supporteFichier = typeof window.showSaveFilePicker === 'function';
  let poignee = null;          // FileSystemFileHandle
  let autorise = false;

  async function permission(demander) {
    if (!poignee) return false;
    const opts = { mode: 'readwrite' };
    let e = await poignee.queryPermission(opts);
    // `requestPermission` exige un geste de l'utilisateur : au retour sur le
    // site la poignée est là mais muette, et il faut un clic pour la réveiller.
    // C'est pour cela que la barre propose « Reconnecter » plutôt que d'échouer
    // en silence à chaque enregistrement.
    if (e === 'prompt' && demander) e = await poignee.requestPermission(opts);
    autorise = e === 'granted';
    return autorise;
  }

  async function reprendrePoignee() {
    if (!supporteFichier) return;
    try {
      // Une poignée est clonable en structure : IndexedDB la garde d'une visite
      // à l'autre, ce qu'aucun autre stockage ne sait faire.
      poignee = (await getMeta('poignee')) || null;
      if (poignee) await permission(false);
    } catch { poignee = null; }
  }

  async function choisirFichier() {
    const p = await window.showSaveFilePicker({
      suggestedName: 'mon-cahier-jaguar.json',
      types: [{ description: 'Cahier Le Jaguar', accept: { 'application/json': ['.json'] } }],
    });
    poignee = p;
    await setMeta('poignee', p);
    await permission(true);
    await ecrireFichier(true);
    peindreBarre();
  }

  let enAttente = null, minuterie = 0;
  function ecrireBientot() {
    // Le cahier enregistre à chaque frappe ou presque. Écrire le fichier à
    // chaque fois ferait tourner le disque pour rien ; deux secondes de calme
    // suffisent, et l'IndexedDB a déjà la version à jour entre-temps.
    clearTimeout(minuterie);
    minuterie = setTimeout(() => ecrireFichier(false), 2000);
  }

  async function ecrireFichier(forcer) {
    if (!poignee || (!autorise && !(await permission(false)))) return false;
    try {
      const paquet = await exporterTout();
      const w = await poignee.createWritable();
      await w.write(new Blob([JSON.stringify(paquet, null, 2)], { type: 'application/json' }));
      await w.close();
      await setMeta('derniereSauvegarde', Date.now());
      peindreBarre();
      return true;
    } catch (e) {
      // Le fichier a pu être déplacé ou supprimé depuis. On le dit dans la
      // barre au lieu de perdre l'enregistrement sans un mot.
      if (forcer) alert('Le fichier n’a pas pu être écrit : ' + (e && e.message ? e.message : e));
      autorise = false;
      peindreBarre();
      return false;
    }
  }

  /* ── export / import ───────────────────────────────────────────────────── */
  async function exporterTout() {
    const tous = await tousCahiers();
    return { jaguar: 1, exported: Date.now(), cahiers: tous.map((c) => ({ id: c.id, notebook: c.notebook })) };
  }

  async function telecharger() {
    const paquet = await exporterTout();
    const nom = 'jaguar-' + new Date().toISOString().slice(0, 10) + '.json';
    const url = URL.createObjectURL(new Blob([JSON.stringify(paquet, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    await setMeta('derniereSauvegarde', Date.now());
    peindreBarre();
  }

  /* On accepte les deux formes : le paquet exporté d'ici, ET un
     `notebook.json` sorti tel quel de `notebooks/<id>/` de l'application
     installée. C'est ce qui rend les deux versions interopérables — sans quoi
     « je passe du bureau au web » voudrait dire recopier une année à la main. */
  async function importer(texte) {
    let j;
    try { j = JSON.parse(texte); } catch { throw new Error('Ce fichier n’est pas un cahier (JSON illisible).'); }
    let entrees;
    if (j && Array.isArray(j.cahiers)) entrees = j.cahiers;
    else if (j && Array.isArray(j.subjects)) entrees = [{ id: j.id || slug(nomDe(j)), notebook: j }];
    else if (j && j.notebook && Array.isArray(j.notebook.subjects)) entrees = [{ id: j.id || j.notebook.id, notebook: j.notebook }];
    else throw new Error('Ce fichier ne contient pas de cahier.');

    let n = 0;
    for (const e of entrees) {
      if (!e || !e.notebook) continue;
      let id = String(e.id || e.notebook.id || slug(nomDe(e.notebook)) || 'cahier');
      // On n'écrase jamais un cahier existant en silence : l'import est une
      // récupération, et écraser serait exactement la perte qu'on évite.
      if (await getCahier(id)) {
        if (!confirm('Un cahier « ' + id + ' » existe déjà. Importer une copie à côté ?')) continue;
        let k = 2; while (await getCahier(id + '-' + k)) k++;
        id = id + '-' + k;
      }
      e.notebook.id = id;
      await putCahier({ id, notebook: nettoyer(e.notebook) });
      n++;
    }
    if (!n) return 0;
    await setMeta('derniereSauvegarde', Date.now());
    return n;
  }
  const nomDe = (nb) => (nb && nb.student && (nb.student.prenom || nb.student.nom)) || 'cahier';

  /* ── les images, réduites à l'entrée ───────────────────────────────────── */
  function reduireImage(dataUrl, mimeSource) {
    // Un SVG ne passe jamais par un canvas : il en sortirait pixellisé, et il
    // est de toute façon léger. Une petite image garde ses octets d'origine —
    // ré-encoder une capture PNG nette en JPEG la salirait pour rien.
    const octets = Math.floor((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
    if (/svg/i.test(mimeSource) || octets <= GARDE_TELLE_QUELLE) return Promise.resolve(dataUrl);
    return new Promise((ok) => {
      const im = new Image();
      im.onload = () => {
        try {
          const e = Math.min(1, IMG_MAX / Math.max(im.width, im.height));
          if (e >= 1 && octets <= GARDE_TELLE_QUELLE) return ok(dataUrl);
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(im.width * e));
          c.height = Math.max(1, Math.round(im.height * e));
          const g = c.getContext('2d');
          // Un JPEG n'a pas de transparence : sans ce fond, un PNG transparent
          // ressortirait sur du noir.
          g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
          g.drawImage(im, 0, 0, c.width, c.height);
          const sortie = c.toDataURL('image/jpeg', IMG_Q);
          ok(sortie.length < dataUrl.length ? sortie : dataUrl);
        } catch { ok(dataUrl); }
      };
      im.onerror = () => ok(dataUrl);
      im.src = dataUrl;
    });
  }

  /* ── le gabarit des éléments interactifs, cuit à la construction ────────── */
  let _coque = null;
  function coque() {
    if (_coque) return Promise.resolve(_coque);
    return vraiFetch('widget-shell.json').then((r) => r.json()).then((j) => { _coque = j; return j; });
  }
  async function rendreWidget(type, cfg) {
    const k = await coque();
    const attr = JSON.stringify(cfg || {}).replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
    return k.avant + '<div class="iw" data-iw="' + type + '" data-cfg=\'' + attr + '\'></div>' + k.apres;
  }

  /* ── les réponses ──────────────────────────────────────────────────────── */
  const json = (o, code) => new Response(JSON.stringify(o), {
    status: code || 200, headers: { 'Content-Type': 'application/json' },
  });

  const ROUTES = [
    ['GET', '/api/nb/list', async () => {
      const tous = await tousCahiers();
      tous.sort((a, b) => (b.notebook.updated || 0) - (a.notebook.updated || 0));
      return json({
        notebooks: tous.map((c) => ({
          id: c.id, title: nomDe(c.notebook), brand: c.notebook.brand, updated: c.notebook.updated,
        })),
      });
    }],

    ['POST', '/api/nb/create', async (_u, corps) => {
      const nb = defaultNotebook(corps.name);
      let id = nb.id, n = 1;
      while (await getCahier(id)) id = nb.id + '-' + (++n);
      nb.id = id;
      await putCahier({ id, notebook: nb });
      return json({ id, notebook: nb });
    }],

    ['GET', '/api/nb/load', async (u) => {
      const c = await getCahier(u.searchParams.get('id'));
      if (!c) return json({ error: 'not found' }, 404);
      return json({ notebook: nettoyer(c.notebook) });
    }],

    ['POST', '/api/nb/save', async (_u, corps) => {
      const { id, notebook } = corps;
      if (!id || !notebook) return json({ error: 'id + notebook required' }, 400);
      nettoyer(notebook);
      /* `owner` n'a pas de sens ici : il n'y a qu'une personne. Le laisser
         traîner serait pire qu'inutile — un cahier exporté vers l'application
         installée y arriverait en désignant un propriétaire qui n'existe pas
         dans cette école, et son propre auteur se retrouverait dehors. */
      delete notebook.owner;
      notebook.updated = Date.now();
      await putCahier({ id, notebook });
      ecrireBientot();
      peindreBarre();
      return json({ ok: true, updated: notebook.updated });
    }],

    ['POST', '/api/nb/asset', async (_u, corps) => {
      const { name, data } = corps;
      const m = /^data:([^;]+);base64,(.*)$/s.exec(data || '');
      if (!name || !m) return json({ error: 'name + data URL required' }, 400);
      /* Le serveur écrivait le fichier et renvoyait son chemin. Ici l'image
         devient une URL `data:` gardée DANS le cahier, et ce n'est pas un
         pis-aller : c'est ce qui fait qu'un cahier exporté est un seul fichier,
         images comprises. Un chemin aurait pointé vers un stockage que l'export
         n'emporte pas — on aurait exporté des cadres vides. */
      const url = await reduireImage(data, m[1]);
      return json({ url });
    }],

    ['GET', '/nb/covers', async () => json({ covers: COVERS })],

    ['GET', '/api/badges.js', async () => {
      // La table des médaillons est le fichier réel, copié tel quel par la
      // construction : une seule table pour les deux applications.
      const r = await vraiFetch('badges.js');
      return new Response(await r.text(), { headers: { 'Content-Type': 'application/javascript' } });
    }],

    ['GET', '/api/nb/books', async () => {
      const b = await biblio();
      return json({ books: b.books });
    }],

    ['GET', '/api/nb/chapters', async (u) => {
      const livre = await trouverLivre(u.searchParams.get('dir'));
      return json({ chapters: (livre && livre.chapterList) || [] });
    }],

    ['POST', '/api/nb/render-chapter', async (_u, corps) => {
      /* Le serveur rendait le chapitre à la demande, avec le moteur du livre.
         Ici les chapitres sont rendus une fois, à la publication : le cahier ne
         fait plus que les chercher. C'est aussi la seule façon honnête de le
         faire sur un hébergement statique — le moteur de rendu ne tient pas
         dans un navigateur, et prétendre le contraire aurait donné un import
         qui marche sur les chapitres simples et casse sur les autres. */
      const livre = await trouverLivre(corps.dir);
      const ch = livre && (livre.chapterList || []).find((c) => c.file === corps.file);
      if (!livre || !ch) return json({ error: 'chapitre introuvable' }, 404);
      const racine = new URL('../library/' + encodeURIComponent(livre.slug) + '/', location.href);
      const r = await vraiFetch(new URL('chapters/' + encodeURIComponent(ch.rendu), racine).href);
      if (!r.ok) return json({ error: 'chapitre non publié' }, 404);
      /* Le jeton posé à la construction devient ici une URL ABSOLUE. Le HTML
         part dans une iframe par `srcdoc`, dont l'URL de base est celle de la
         page parente : un `<base>` relatif y viserait à côté et l'extrait
         importé arriverait sans ses illustrations. La construction ne connaît
         pas l'adresse de publication ; `location` la connaît. */
      const html = (await r.text()).split('__JAGUAR_BASE__').join(new URL('src/', racine).href);
      return json({ html, title: ch.title, book: livre.title });
    }],

    ['POST', '/api/nb/render-widget', async (_u, corps) => {
      if (!corps.type) return json({ error: 'type required' }, 400);
      return json({ html: await rendreWidget(corps.type, corps.cfg) });
    }],
  ];

  /* ── le détournement ───────────────────────────────────────────────────── */
  const vraiFetch = window.fetch.bind(window);
  const cheminDe = (u) => u.pathname.replace(/^.*?(?=\/(?:api|nb)\/)/, '');  // insensible au préfixe du dépôt

  window.fetch = function (entree, init) {
    let url;
    try { url = new URL(typeof entree === 'string' ? entree : entree.url, location.href); } catch { return vraiFetch(entree, init); }
    // Seules nos routes sont détournées. Wikipédia, les polices, la
    // bibliothèque : tout le reste passe par le vrai `fetch`.
    if (url.origin !== location.origin) return vraiFetch(entree, init);
    const methode = ((init && init.method) || (entree && entree.method) || 'GET').toUpperCase();
    const r = ROUTES.find((x) => x[0] === methode && x[1] === cheminDe(url));
    if (!r) return vraiFetch(entree, init);

    let corps = {};
    try { if (init && init.body) corps = JSON.parse(init.body); } catch { corps = {}; }
    return Promise.resolve()
      .then(() => r[2](url, corps))
      .catch((e) => json({ error: (e && e.message) || String(e) }, 500));
  };

  /* ── l'enregistrement de la dernière seconde ───────────────────────────────
   *
   * Le cahier enregistre 900 ms après la dernière frappe, ET une dernière fois
   * en partant : `beforeunload` appelle `capturePage()` — qui verse le contenu
   * du `contenteditable` dans le modèle — puis `navigator.sendBeacon`.
   *
   * Or un beacon n'est PAS un `fetch`. Il passait donc à côté du détournement
   * et partait sur le réseau, où il n'y a plus de serveur : sur un
   * hébergement statique, `POST /api/nb/save` répond 404. Autrement dit
   * l'enregistrement qui compte le plus — celui de la fermeture — était le
   * seul qui n'avait pas lieu, et une phrase tapée juste avant de fermer
   * l'onglet disparaissait sans un mot. C'est exactement la perte silencieuse
   * que tout ce fichier cherche à empêcher, et elle était dedans.
   */
  const ATTENTE = 'jaguar-attente';
  const vraiBeacon = navigator.sendBeacon && navigator.sendBeacon.bind(navigator);

  if (vraiBeacon) {
    navigator.sendBeacon = function (url, data) {
      let u;
      try { u = new URL(url, location.href); } catch { return vraiBeacon(url, data); }
      if (u.origin !== location.origin || cheminDe(u) !== '/api/nb/save') return vraiBeacon(url, data);

      /* On ne sait pas lire un Blob de façon synchrone, et la page est en train
         de partir. On écrit donc d'abord dans `localStorage`, qui EST synchrone
         et aboutit donc même si le navigateur nous coupe ; IndexedDB suit si
         elle en a le temps, et efface l'attente quand c'est fait. */
      const enregistre = (texte) => {
        let c = null;
        try { c = JSON.parse(texte); } catch { return; }
        if (!c || !c.id || !c.notebook) return;
        nettoyer(c.notebook);
        c.notebook.updated = Date.now();
        try { localStorage.setItem(ATTENTE, JSON.stringify(c)); } catch { /* quota : IndexedDB reste notre chance */ }
        putCahier({ id: c.id, notebook: c.notebook }).then(() => {
          try { localStorage.removeItem(ATTENTE); } catch { /* rien à faire */ }
          ecrireBientot();
        }, () => { /* l'attente dans localStorage prend le relais au prochain démarrage */ });
      };

      if (typeof data === 'string') enregistre(data);
      else if (data && typeof data.text === 'function') data.text().then(enregistre, () => {});
      return true;   // le cahier croit avoir envoyé — et il a raison, c'est gardé
    };
  }

  /* `beforeunload` est le pire moment pour enregistrer : le navigateur peut
     couper à tout instant, et sur iOS il ne se déclenche JAMAIS — l'appel de
     la dernière chance n'y a donc jamais eu lieu, même dans la version
     installée. `pagehide` et le passage en arrière-plan, eux, arrivent
     toujours, et pendant que la page est encore bien vivante.
     On ne touche pas à `app.html` pour autant : on lui envoie le
     `beforeunload` qu'il attend, plus tôt et sur des événements fiables. Son
     propre `capturePage()` fait alors son travail dans de bonnes conditions. */
  let dernierAdieu = 0;
  function adieu() {
    if (Date.now() - dernierAdieu < 400) return;
    dernierAdieu = Date.now();
    try { window.dispatchEvent(new Event('beforeunload')); } catch { /* rien à faire */ }
  }
  window.addEventListener('pagehide', adieu);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') adieu(); });

  /* Au démarrage : une attente laissée par une fermeture que le navigateur a
     coupée trop tôt est reversée dans IndexedDB. On ne la reverse que si elle
     est PLUS RÉCENTE, sinon on écraserait une modification faite depuis —
     depuis un autre onglet, par exemple. */
  async function recupererAttente() {
    let t = null;
    try { t = localStorage.getItem(ATTENTE); } catch { return; }
    if (!t) return;
    try {
      const c = JSON.parse(t);
      if (c && c.id && c.notebook) {
        const actuel = await getCahier(c.id);
        if (!actuel || (c.notebook.updated || 0) >= ((actuel.notebook && actuel.notebook.updated) || 0)) {
          await putCahier({ id: c.id, notebook: nettoyer(c.notebook) });
        }
      }
    } catch { /* attente illisible : mieux vaut la jeter que boucler dessus */ }
    try { localStorage.removeItem(ATTENTE); } catch { /* rien à faire */ }
  }

  /* ── la barre de sauvegarde ────────────────────────────────────────────── */
  let barre = null;
  function construireBarre() {
    barre = document.createElement('div');
    barre.id = 'jaguar-save';
    barre.innerHTML = ''
      + '<style>'
      + '#jaguar-save{position:fixed;left:12px;bottom:12px;z-index:99999;font:12px/1.35 system-ui,sans-serif;'
      + 'background:#14161c;color:#e7e9ee;border:1px solid #2a2f3a;border-radius:10px;'
      + 'box-shadow:0 6px 22px rgba(0,0,0,.35);padding:8px 10px;max-width:330px}'
      + '#jaguar-save b{font-weight:650}'
      + '#jaguar-save .js-etat{display:flex;align-items:center;gap:7px;margin-bottom:6px}'
      + '#jaguar-save .js-point{width:8px;height:8px;border-radius:50%;background:#3ecf8e;flex:0 0 auto}'
      + '#jaguar-save.js-ambre .js-point{background:#e8b23a}#jaguar-save.js-rouge .js-point{background:#e8543a}'
      + '#jaguar-save.js-ambre{border-color:#6b5320}#jaguar-save.js-rouge{border-color:#7a2f22}'
      + '#jaguar-save .js-boutons{display:flex;flex-wrap:wrap;gap:6px}'
      + '#jaguar-save button{font:inherit;cursor:pointer;background:#232833;color:#e7e9ee;'
      + 'border:1px solid #333a49;border-radius:7px;padding:4px 9px}'
      + '#jaguar-save button:hover{background:#2c323f}'
      + '#jaguar-save button.js-fort{background:#2f6d4f;border-color:#3b8a63}'
      + '#jaguar-save .js-note{opacity:.72;margin-top:6px}'
      + '#jaguar-save .js-plier{position:absolute;top:4px;right:6px;border:0;background:none;padding:2px 4px;opacity:.6}'
      + '#jaguar-save.js-plie .js-boutons,#jaguar-save.js-plie .js-note{display:none}'
      + '</style>'
      + '<button class="js-plier" title="Réduire">—</button>'
      + '<div class="js-etat"><span class="js-point"></span><span class="js-texte">…</span></div>'
      + '<div class="js-boutons"></div>'
      + '<div class="js-note"></div>';
    document.body.appendChild(barre);
    barre.querySelector('.js-plier').onclick = () => barre.classList.toggle('js-plie');
    return barre;
  }

  const AGE = (ms) => {
    if (ms == null) return null;
    const j = Math.floor((Date.now() - ms) / 86400000);
    if (j <= 0) return 'aujourd’hui';
    if (j === 1) return 'hier';
    return 'il y a ' + j + ' jours';
  };

  async function peindreBarre() {
    if (!barre) return;
    const quand = await getMeta('derniereSauvegarde');
    const vieux = quand == null ? Infinity : Date.now() - quand;
    barre.classList.toggle('js-ambre', vieux >= AMBRE && vieux < ROUGE);
    barre.classList.toggle('js-rouge', vieux >= ROUGE);

    const t = barre.querySelector('.js-texte');
    const b = barre.querySelector('.js-boutons');
    const n = barre.querySelector('.js-note');

    if (poignee && autorise) {
      t.innerHTML = '<b>Enregistré dans votre fichier</b>';
      n.textContent = (poignee.name || 'fichier') + ' — ' + (AGE(quand) || 'à l’instant')
        + '. Vider le navigateur n’y touche pas.';
    } else if (poignee) {
      t.innerHTML = '<b>Fichier à reconnecter</b>';
      n.textContent = 'Le navigateur demande un clic pour réécrire ' + (poignee.name || 'votre fichier') + '.';
    } else if (quand == null) {
      t.innerHTML = '<b>Jamais sauvegardé</b>';
      n.textContent = 'Le cahier est dans ce navigateur seulement. Effacer les données de navigation l’effacerait.';
    } else {
      t.innerHTML = 'Dernière sauvegarde : <b>' + AGE(quand) + '</b>';
      n.textContent = 'Le cahier vit dans ce navigateur. Une sauvegarde le met à l’abri.';
    }

    b.innerHTML = '';
    const bouton = (txt, fort, fn) => {
      const e = document.createElement('button');
      e.textContent = txt; if (fort) e.className = 'js-fort'; e.onclick = fn; b.appendChild(e);
    };
    if (supporteFichier && !poignee) {
      bouton('Choisir un fichier…', vieux >= AMBRE, () => choisirFichier().catch(() => {}));
    }
    if (poignee && !autorise) bouton('Reconnecter', true, async () => { if (await permission(true)) { await ecrireFichier(true); } peindreBarre(); });
    bouton('Télécharger une copie', !supporteFichier && vieux >= AMBRE, () => telecharger());
    bouton('Importer…', false, () => choisirImport());
  }

  function choisirImport() {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = '.json,application/json';
    i.onchange = async () => {
      const f = i.files && i.files[0];
      if (!f) return;
      try {
        const n = await importer(await f.text());
        if (!n) return;
        alert(n + (n > 1 ? ' cahiers importés.' : ' cahier importé.') + ' La page va se recharger.');
        location.reload();
      } catch (e) { alert(e.message || String(e)); }
    };
    i.click();
  }

  /* ── mise en route ─────────────────────────────────────────────────────── */
  async function demarrer() {
    // La seule des cinq pertes qu'on puisse fermer par du code : demander à
    // être exempté du ménage que fait le navigateur quand le disque se remplit.
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch { /* refusé, tant pis */ }
    // Avant tout le reste : ce qu'une fermeture brutale avait laissé en plan.
    await recupererAttente();
    await reprendrePoignee();
    construireBarre();
    await peindreBarre();
    setInterval(peindreBarre, 60000);   // l'âge affiché doit vieillir tout seul

    /* Sur iPhone, Safari efface le stockage après environ sept jours sans
       visite — sauf si le site est installé sur l'écran d'accueil. Le dire une
       fois vaut mieux qu'un cahier disparu pendant les vacances. */
    const iOS = /iP(hone|ad|od)/.test(navigator.userAgent);
    const installe = window.navigator.standalone === true
      || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    if (iOS && !installe && !(await getMeta('avertiIOS'))) {
      await setMeta('avertiIOS', 1);
      setTimeout(() => alert('Sur iPhone et iPad, Safari efface les données d’un site '
        + 'après environ une semaine sans visite.\n\nAjoutez « Le Jaguar » à l’écran '
        + 'd’accueil (Partager → Sur l’écran d’accueil) pour garder votre cahier, '
        + 'et téléchargez une copie de temps en temps.'), 1200);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();

  // Pour la page de couverture, qui doit retrouver un cahier sans passer par
  // l'application : elle est chargée dans une iframe, hors de ce contexte.
  window.JaguarStore = { getCahier, tousCahiers, exporterTout, importer };
})();
