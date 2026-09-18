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
    a.href = './';
    a.innerHTML = b.innerHTML;
    a.style.textDecoration = 'none';
    var kbd = a.querySelector('kbd');
    if (kbd) kbd.remove();
    b.parentNode.replaceChild(a, b);
  })();
})();
