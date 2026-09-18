/* LE CURSEUR QUI FAIT LA DÉMONSTRATION — ET QUI REND LA MAIN.
 *
 * La figure au-dessus est la vraie : même moteur, même feuille, même code que
 * celui qui la sert à un élève. Ce script ne la redessine pas et ne mime rien
 * — il envoie de VRAIS événements sur ses VRAIS boutons : un `click` sur
 * l'onglet, un `change` sur la liste, une valeur qui bouge sur le curseur de
 * réglage. Si la figure ne répond pas, la démo ne bouge pas, et c'est la bonne
 * réponse : on ne peut pas promettre une interactivité que l'élément n'a pas.
 *
 * Ce qu'il presse ne vient pas d'ici. `marketing/survey.json` a été écrit par
 * un vrai navigateur qui a pressé chaque candidat de chaque élément et n'a
 * gardé que ce qui l'a changé ; la construction recopie cette liste dans la
 * page. Deviner avait échoué deux fois, et silencieusement.
 *
 * AU PREMIER GESTE DU VISITEUR, le curseur s'efface. Une main qui se bat contre
 * une animation est pire qu'une page immobile, et la question que la démo
 * cherche à provoquer — « et si j'essayais autre chose ? » — mérite une page
 * qui se taise dès qu'on y touche.
 */
(function () {
  'use strict';

  var boite = document.getElementById('dm-gestes');
  var GESTES = [];
  try { GESTES = JSON.parse(boite && boite.textContent) || []; } catch (e) { GESTES = []; }

  var cur = document.getElementById('dm-curseur');
  if (!cur || !GESTES.length) return;

  var DOUX = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var VERS = 720;      // le trajet du curseur, la même durée que sa transition
  var PRESSE = 280;    // le temps de la pression elle-même
  var POSE = 1500;     // et le temps de REGARDER ce qui a changé
  var TIRE = 950;      // un curseur de réglage qu'on traîne d'un bout à l'autre

  var duree = 900;
  for (var d = 0; d < GESTES.length; d++) {
    duree += VERS + PRESSE + POSE + (estTire(GESTES[d]) ? TIRE : 0);
  }

  var i = 0, joue = false, rendu = false, minuteurs = [];

  function estTire(g) { return g.how === 'drag' || g.how === 'swipe'; }
  function plus(fn, ms) { var t = setTimeout(fn, ms); minuteurs.push(t); return t; }
  function tout() {
    for (var k = 0; k < minuteurs.length; k++) { clearTimeout(minuteurs[k]); clearInterval(minuteurs[k]); }
    minuteurs = [];
  }

  /* Le sélecteur peut ne plus rien trouver : la figure a pu changer de balisage
     depuis l'enquête. On passe au geste suivant plutôt que de s'arrêter — une
     démo qui boite vaut mieux qu'une démo qui gèle. */
  function cible(g) {
    var l;
    try { l = document.querySelectorAll(g.sel); } catch (e) { return null; }
    return l[g.idx] || l[0] || null;
  }

  function viser(x, y) { cur.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)'; }

  /* On envoie la séquence complète parce que les éléments n'écoutent pas tous
     la même chose : certains ont un `click`, d'autres un `pointerdown` délégué
     à un ancêtre, et les figures en SVG n'ont souvent ni l'un ni l'autre sur le
     nœud qu'on voit. */
  function presser(el) {
    var o = { bubbles: true, cancelable: true, view: window };
    try { el.dispatchEvent(new PointerEvent('pointerdown', o)); } catch (e) { /* vieux navigateur */ }
    el.dispatchEvent(new MouseEvent('mousedown', o));
    try { el.dispatchEvent(new PointerEvent('pointerup', o)); } catch (e) { /* idem */ }
    el.dispatchEvent(new MouseEvent('mouseup', o));
    if (typeof el.click === 'function') el.click();
  }

  function choisir(el) {
    if (!el.options || el.options.length < 2) { presser(el); return; }
    el.selectedIndex = (el.selectedIndex + 1) % el.options.length;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* LA VALEUR VISÉE N'EST PAS ÉCRITE ICI. On va vers le bout le plus éloigné de
     là où la figure est posée, en fraction de SON échelle : c'est elle qui sait
     ce que ses bornes veulent dire, pas nous. Une valeur en dur donnerait une
     démo juste pour une figure et absurde pour la suivante. */
  function tirer(el, fini) {
    if (el.type !== 'range') { presser(el); fini(); return; }
    var min = parseFloat(el.min) || 0;
    var max = parseFloat(el.max);
    if (!isFinite(max) || max <= min) { presser(el); fini(); return; }
    var pas = parseFloat(el.step) || (max - min) / 100;
    var de = parseFloat(el.value); if (!isFinite(de)) de = (min + max) / 2;
    var vers = (de - min) > (max - de) ? min + (max - min) * 0.18 : min + (max - min) * 0.82;

    var r = el.getBoundingClientRect();
    var n = 28, k = 0;
    cur.classList.add('vite');
    var h = setInterval(function () {
      if (!joue) { clearInterval(h); cur.classList.remove('vite'); return; }
      k++;
      var p = k / n;
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;   // doux aux deux bouts
      var v = de + (vers - de) * e;
      el.value = String(Math.round(v / pas) * pas);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      viser(r.left + r.width * ((parseFloat(el.value) - min) / (max - min)), r.top + r.height / 2);
      if (k >= n) {
        clearInterval(h);
        cur.classList.remove('vite');
        el.dispatchEvent(new Event('change', { bubbles: true }));
        fini();
      }
    }, Math.round(TIRE / 28));
    minuteurs.push(h);
  }

  function pas() {
    if (!joue) return;
    var g = GESTES[i % GESTES.length];
    i++;
    var el = cible(g);
    if (!el) { plus(pas, 250); return; }
    var r = el.getBoundingClientRect();
    /* Hors du cadre ou de taille nulle : viser ça montrerait un curseur qui
       presse le vide au bord de l'écran. */
    if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) { plus(pas, 250); return; }

    viser(r.left + r.width / 2, r.top + r.height / 2);
    cur.classList.add('on');
    plus(function () {
      if (!joue) return;
      cur.classList.add('press');
      plus(function () { cur.classList.remove('press'); }, 430);
      if (g.how === 'select') { choisir(el); plus(pas, POSE); }
      else if (estTire(g)) { tirer(el, function () { plus(pas, POSE); }); }
      else { presser(el); plus(pas, POSE); }
    }, VERS);
  }

  function demarrer() {
    if (rendu || joue) return;
    joue = true;
    document.body.classList.add('dm-auto');
    plus(pas, 450);
  }

  function arreter() {
    joue = false; tout();
    cur.classList.remove('on', 'press', 'vite');
  }

  function laMain() {
    if (rendu) return;
    rendu = true;
    arreter();
    document.body.classList.remove('dm-auto');
    /* Et on le DIT au site, qui le montre dans son pied de page et cesse de
       compter. Sans ça, le rail arracherait la figure des mains du visiteur au
       bout de ses dix secondes — le seul moment où il faut se taire. */
    try {
      if (window.parent !== window && window.parent.__demoMain) window.parent.__demoMain();
    } catch (e) { /* une autre origine : il n'y en a pas, mais on ne parie pas dessus */ }
  }

  /* Le retour en mode automatique, demandé par le site. On repart du PREMIER
     geste : reprendre au milieu d'une séquence sur une figure que le visiteur a
     laissée dans un autre état donne un curseur qui presse des choses sans
     rapport avec ce qu'on voit. */
  function reprendre() {
    rendu = false; i = 0;
    demarrer();
  }

  /* `isTrusted` est la seule chose qui distingue le visiteur du curseur : les
     événements envoyés plus haut sont synthétiques et le portent à faux. Sans
     cette vérification, la démo se rendrait la main à elle-même au premier
     geste qu'elle joue. */
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (nom) {
    document.addEventListener(nom, function (e) {
      if (!e.isTrusted) return;
      laMain();
    }, { capture: true, passive: true });
  });

  var page = document.querySelector('.dm-page');

  window.__demo = {
    pret: true,
    /* Ce que le site compare pour savoir s'il regarde bien la figure qu'il
       vient de demander, et pas celle d'avant. */
    nom: (page && page.getAttribute('data-demo')) || '',
    duree: duree,
    gestes: GESTES.length,
    play: demarrer,
    pause: arreter,
    reprendre: reprendre,
    rendu: function () { return rendu; },
    /* ON MESURE LA FIGURE, PAS LE DOCUMENT. `scrollHeight` ne descend jamais
       sous la hauteur de la fenetre, et la fenetre ici EST le cadre que le site
       vient de regler sur la mesure precedente : chaque figure heritait donc de
       la hauteur de la plus haute deja vue, et le cadre ne redescendait plus
       jamais. Le rectangle du contenu, lui, ne doit rien au cadre. */
    hauteur: function () {
      var r = document.querySelector('.dm-page') || document.body;
      return Math.ceil(r.getBoundingClientRect().height) + 2;
    },
  };

  /* Ouverte seule — « open it full size » — la page se lance toute seule. Dans
     un cadre, c'est le site qui décide, et il ne décide qu'une fois la section
     à l'écran : rien ne doit tourner derrière un visiteur qui lit plus haut. */
  if (window.top === window && !DOUX) demarrer();
})();
