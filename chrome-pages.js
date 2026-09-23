/* LA BARRE, SUR LES PAGES AUTRES QUE L'ACCUEIL.
 *
 * The landing page's theme switch and sticky hairline live inside the big
 * library script, tangled with the shelf and its string table. Cutting them
 * out of working code to share them would have been surgery on the one page
 * that matters most; this is the same behaviour, written once, in a file the
 * other three pages load. One copy, not three inline ones.
 *
 * It reads the SAME keys as the landing page - `fable-theme` and, through
 * `window.T`, whatever the language script decided - so a choice made on any
 * page is the choice on all of them. */
(function () {
  'use strict';

  /* The label has to say what pressing it DOES, not what the page is, so it
     reads the state rather than toggling a word. `window.T` is there when the
     language script has run; English is the fallback, which is the house
     rule. */
  function mot(k, secours) {
    try { return (window.T && window.T(k)) || secours; } catch (e) { return secours; }
  }

  var root = document.documentElement;
  var btn = document.getElementById('theme');

  if (btn) {
    var poser = function (t) {
      if (t) root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
      var sombre = t === 'dark' || (!t && matchMedia('(prefers-color-scheme:dark)').matches);
      btn.textContent = sombre ? mot('light', 'Light') : mot('dark', 'Dark');
      btn.setAttribute('aria-pressed', sombre ? 'true' : 'false');
    };
    try { poser(localStorage.getItem('fable-theme')); } catch (e) { poser(null); }
    btn.addEventListener('click', function () {
      var suite = btn.getAttribute('aria-pressed') === 'true' ? 'light' : 'dark';
      poser(suite);
      try { localStorage.setItem('fable-theme', suite); } catch (e) { /* refused */ }
    });
  }

  /* The hairline under the bar appears only once the bar has left the top of
     the page - otherwise it draws a line under nothing. A sentinel above it
     and an observer, rather than a scroll handler that runs on every pixel. */
  (function () {
    var s = document.getElementById('sentinelle');
    var m = document.getElementById('masthead');
    if (!s || !m || !window.IntersectionObserver) return;
    new IntersectionObserver(function (es) {
      m.classList.toggle('is-stuck', !es[0].isIntersecting);
    }, { threshold: 0 }).observe(s);
  })();

  /* The palette button belongs to the library, and the library is not on this
     page. Rather than show a search that searches nothing, it becomes a link
     back to the shelf - the place where searching works. */
  (function () {
    var b = document.getElementById('open-palette');
    if (!b || document.getElementById('palette')) return;
    var a = document.createElement('a');
    a.className = b.className;
    a.href = 'library.html';
    a.innerHTML = b.innerHTML;
    a.style.textDecoration = 'none';
    var kbd = a.querySelector('kbd');
    if (kbd) kbd.remove();
    b.parentNode.replaceChild(a, b);
  })();

  /* ── LE CORBEAU QUI SUIT LA LECTURE ─────────────────────────────
     Chaque section porte un `data-mot` : la clé de ce que l'oiseau en dit. Le
     texte vient de la table partagée, comme tout le reste, donc il existe dans
     les trois langues et suit le sélecteur sans rien de particulier à faire.

     UN OBSERVATEUR, PAS UN ÉCOUTEUR DE DÉFILEMENT. Le second se déclenche à
     chaque pixel et ferait travailler un téléphone pour rien ; le premier ne
     parle que quand une section entre ou sort.

     LA SECTION LA PLUS HAUTE GAGNE. Deux sections sont visibles ensemble la
     moitié du temps ; sans règle, l'oiseau hésite entre les deux à chaque
     petit mouvement. On garde celle dont le haut est le plus haut dans la
     fenêtre : c'est celle qu'on est en train de lire. */
  (function () {
    var oiseau = document.getElementById('compagnon');
    if (!oiseau || !window.IntersectionObserver) return;
    var boite = oiseau.querySelector('.bulle-boite');
    var sections = [].slice.call(document.querySelectorAll('[data-mot]'));
    if (!boite || !sections.length) return;

    var vues = [], motActuel = '', minuteur = 0;

    /* LE MOT PAR DEFAUT EST POSE ICI, pas par un `data-i18n` sur la bulle.
       Le passage de langue reecrit le contenu de TOUT element qui en porte
       un ; il aurait donc efface la phrase que l'oiseau venait de dire sur
       la section, et remis la formule d'attente a sa place. Le seul texte
       de cette bulle doit venir d'ici. */
    try { if (window.T) boite.textContent = window.T('cmpDefaut'); } catch (e) { /* table absente */ }

    function dire(mot) {
      if (!mot || mot === motActuel) return;
      motActuel = mot;
      var texte = mot;
      try { if (window.T) texte = window.T(mot); } catch (e) { /* table absente */ }
      /* On efface, on remplace, on remontre : le texte ne doit pas changer
         sous l'œil, sinon on lit la moitié de l'ancien et la moitié du neuf. */
      oiseau.classList.add('change');
      clearTimeout(minuteur);
      minuteur = setTimeout(function () {
        boite.textContent = texte;
        oiseau.classList.remove('change');
      }, 200);
    }

    /* LA DERNIERE SECTION DANS LAQUELLE ON EST ENTRE GAGNE, et rien d'autre.
       La premiere version prenait « la plus haute à l'écran » : une section
       déjà dépassée a le haut le plus haut — négatif, même — donc elle gagnait
       pour toujours et l'oiseau répétait la même phrase jusqu'au pied de page.

       En descendant, chaque section franchit la bande à son tour et prend la
       parole ; en remontant, la précédente y rentre et la reprend. C'est
       exactement ce qu'on veut d'un compagnon de lecture, et cela tient en
       quatre lignes. */
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        var i = vues.indexOf(e.target);
        if (i >= 0) vues.splice(i, 1);
        if (e.isIntersecting) vues.push(e.target);
      });
      if (vues.length) dire(vues[vues.length - 1].getAttribute('data-mot'));
    }, { rootMargin: '-25% 0px -45% 0px' });
    sections.forEach(function (s) { io.observe(s); });

    /* IL ARRIVE APRÈS LE HAUT DE PAGE ET S'EN VA AVANT LE PIED. En haut, la
       page se présente toute seule et n'a besoin de personne ; en bas, il se
       poserait par-dessus le pied — exactement le doublon qu'on vient
       d'enlever, revenu par la fenêtre. */
    var pied = document.querySelector('.foot');
    var haut = document.querySelector('main .hero') || document.querySelector('main');

    function montrer(oui) { oiseau.classList.toggle('la', !!oui); }
    var passeLeHaut = false, avantLePied = true;
    function juger() { montrer(passeLeHaut && avantLePied); }

    if (haut) {
      new IntersectionObserver(function (e) {
        passeLeHaut = !e[0].isIntersecting;
        juger();
      }, { rootMargin: '-40% 0px 0px 0px' }).observe(haut);
    } else { passeLeHaut = true; }

    if (pied) {
      new IntersectionObserver(function (e) {
        avantLePied = !e[0].isIntersecting;
        juger();
        /* PAS DE MARGE ICI. Une marge basse negative remonte le bord de la
           zone observee, donc le pied cessait d'y entrer et l'oiseau restait
           pose par-dessus lui - precisement le chevauchement qu'on voulait
           eviter. La fenetre telle quelle est la bonne mesure : des que le
           pied se montre, l'oiseau s'en va. */
      }).observe(pied);
    }
    juger();
  })();

  /* ── LE BOUTON DU COMPTE, SUR CES PAGES AUSSI ────────────────────────────
     Il n'y etait pas. `poserBouton` n'etait appele qu'a UN endroit, dans le
     grand script de l'accueil ; les quatre autres pages portaient bien le
     `<span class="compte-hote">` venu de la barre partagee, et personne ne le
     remplissait. Consequences, toutes invisibles tant qu'on restait sur
     l'accueil : pas de bouton « Se connecter », pas de nom affiche, et
     surtout pas d'onglets de proprietaire — puisque c'est l'ecouteur pose par
     `poserBouton` qui les revele. On arrivait donc sur « L'essai » deconnecte,
     sans rien pour se connecter, et sans les onglets par lesquels on venait
     d'arriver.

     Ici et pas dans la barre : ce fichier est charge par les pages qui ne
     sont PAS l'accueil, et l'accueil garde son propre appel. Deux appels sur
     la meme page poseraient deux boutons. */
  if (window.FableCompte && window.FableCompte.poserBouton) {
    var hoteCompte = document.getElementById('compte-hote');
    if (hoteCompte) window.FableCompte.poserBouton(hoteCompte);
  }
})();
