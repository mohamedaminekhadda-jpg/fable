/* HORS LIGNE — le site tient la promesse que la page du projet fait.
 *
 * « Chaque livre est un seul fichier HTML […] et il continue de fonctionner
 * quand la connexion tombe en plein cours. » C'était vrai du livre et faux du
 * site qui le dit : sans ce fichier, un visiteur hors réseau n'avait même pas
 * la bibliothèque. Un argument qu'on ne peut pas démontrer sur place est un
 * argument qu'on demande de croire.
 *
 * UN AGENT DE SERVICE EST LA CHOSE LA PLUS FACILE À CASSER D'UN SITE. Mal
 * écrit, il sert éternellement une version périmée à ceux qui sont déjà venus
 * — et ceux-là sont exactement les gens qui comptent. Trois règles, dans cet
 * ordre :
 *
 *   1. UNE PAGE VA D'ABORD AU RÉSEAU. Toujours. Le cache n'est qu'un filet de
 *      secours. Une publication nouvelle arrive donc immédiatement pour qui a
 *      du réseau, et personne ne reste coincé sur l'ancienne.
 *   2. CE QUI PORTE UNE VERSION EST IMMUABLE. `book.js?v=mu7f…` ne changera
 *      jamais de contenu : on peut le servir du cache sans rien demander, et
 *      c'est ce qui rend la lecture hors ligne instantanée.
 *   3. LE RESTE EST SERVI DU CACHE PUIS RAFRAÎCHI DERRIÈRE. Jamais plus d'une
 *      publication de retard.
 *
 * Il n'y a pas de bouton « télécharger ce livre » et c'est volontaire : la
 * bibliothèque pèse 44 Mo, et proposer ça d'un clic sur un forfait marocain
 * serait discourtois. À la place, UN LIVRE QU'ON A OUVERT RESTE LISIBLE — il
 * est tombé dans le cache en le lisant. On ne promet que ce qui s'est
 * réellement passé.
 */
'use strict';

/* Posée par la construction. Elle nomme le cache, donc une publication neuve
   part d'un cache neuf et l'ancien est jeté entier — pas de mélange possible
   entre deux versions du même fichier. */
var VERSION = 'muatcpjc';
var CACHE = 'fable-' + VERSION;

/* Le strict nécessaire pour que le site s'ouvre sans réseau. Pas les livres :
   quarante-quatre mégaoctets téléchargés à l'insu de quelqu'un, c'est un abus
   de confiance, pas une fonctionnalité. */
var COQUE = [
  './',
  './simulations.html',
  './notebook.html',
  './project.html',
  './404.html',
  './manifest.webmanifest',
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      /* `addAll` échoue en entier si UNE adresse manque, et un agent qui ne
         s'installe pas laisse le site sans hors-ligne, en silence. On prend
         donc les pages une par une et on accepte d'en perdre une. */
      return Promise.all(COQUE.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function () { /* tant pis pour celle-là */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (noms) {
      return Promise.all(noms.map(function (n) {
        /* Tout ce qui n'est pas de CETTE version s'en va. Sans ce ménage, le
           stockage du visiteur grandit d'une copie du site à chaque
           publication, pour toujours. */
        if (n !== CACHE && n.indexOf('fable-') === 0) return caches.delete(n);
        return null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function memeOrigine(url) { return url.origin === self.location.origin; }
function police(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

/* On ne met en cache qu'une réponse complète et saine. Une 206 (fragment) ou
   une 404 gardée est pire que rien : elle se resservira telle quelle. */
function gardable(r) { return r && r.status === 200 && r.type !== 'opaqueredirect'; }

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (!memeOrigine(url) && !police(url)) return;

  /* Le cahier écrit des données d'élève ; on ne se met pas entre lui et son
     stockage, et on ne garde pas de copie de ses pages. */
  if (memeOrigine(url) && url.pathname.indexOf('/cahier/') >= 0) return;

  /* ── 1. une page ────────────────────────────────────────────────────── */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (r) {
        if (gardable(r)) {
          var copie = r.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copie); });
        }
        return r;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true })
          .then(function (r) { return r || caches.match('./404.html') || caches.match('./'); });
      })
    );
    return;
  }

  /* ── 2. une adresse versionnée : immuable ───────────────────────────── */
  if (memeOrigine(url) && /[?&]v=/.test(url.search)) {
    e.respondWith(
      caches.match(req).then(function (r) {
        if (r) return r;
        return fetch(req).then(function (n) {
          if (gardable(n)) { var copie = n.clone(); caches.open(CACHE).then(function (c) { c.put(req, copie); }); }
          return n;
        });
      })
    );
    return;
  }

  /* ── 3. le reste : du cache, rafraîchi derrière ─────────────────────── */
  e.respondWith(
    caches.match(req).then(function (r) {
      var reseau = fetch(req).then(function (n) {
        if (gardable(n)) { var copie = n.clone(); caches.open(CACHE).then(function (c) { c.put(req, copie); }); }
        return n;
      }).catch(function () { return r; });
      return r || reseau;
    })
  );
});
