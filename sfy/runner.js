/* ── LA LANGUE DU CADRE ──
   La page d'une simulation est fabriquee a la construction, donc en francais.
   Le cadre — titre, « Reglages », « Mesures », « Ce qu'il faut voir » — porte
   ses deux versions, et c'est ici qu'on choisit.
   Le CONTENU de la simulation, lui, reste dans la langue ou il est ecrit :
   chaque sim.js porte ses propres libelles. */
import { LANG, T, poserSelecteur } from './langue.js?v=mu6jgis0';

poserSelecteur(document.getElementById('langsel'));
document.documentElement.lang = LANG;
{
  const d = document;
  for (const el of d.querySelectorAll('[data-i18n]')) {
    const v = T(el.getAttribute('data-i18n'));
    if (v) el.textContent = v;
  }
  for (const el of d.querySelectorAll('[data-i18n-title]')) {
    const v = T(el.getAttribute('data-i18n-title'));
    if (v) el.title = v;
  }
  if (LANG === 'en') {
    const S = window.__SIM__ || {};
    if (S.titleEn) {
      const h = d.getElementById('lab-titre');
      if (h) h.textContent = S.titleEn;
      d.title = S.titleEn + ' — See for yourself';
    }
    const sub = d.querySelector('.lab-sub');
    if (sub && sub.dataset.subEn) sub.textContent = sub.dataset.subEn;
    const look = d.querySelector('.lab-look');
    if (look && look.dataset.lookEn) {
      const t = look.querySelector('.look-txt');
      if (t) t.textContent = look.dataset.lookEn;
    }
  }
}
// Loads one simulation onto the bench.
//
// The reason this is a module rather than a few lines in the generated page is
// the error handling. A simulation that fails to import, exports no mount(), or
// throws on its first frame must say so in plain words on screen: an author
// staring at a blank rectangle learns nothing, and neither does a teacher.
import { createLab } from './harness.js?v=mu6jgis0';

const SIM = window.__SIM__ || {};

/* theme, shared with the catalogue through the same key */
const root = document.documentElement;
const saved = localStorage.getItem('sfy-theme');
if (saved) root.setAttribute('data-theme', saved);
else if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-theme', 'dark');

document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('sfy-theme', next);
});

document.querySelector('[data-full]')?.addEventListener('click', () => {
  const wrap = document.querySelector('.lab-stagewrap');
  if (!document.fullscreenElement) wrap?.requestFullscreen?.();
  else document.exitFullscreen?.();
});

function showError(title, detail) {
  const box = document.getElementById('err');
  box.hidden = false;
  box.innerHTML = '<h4></h4><pre></pre>';
  box.querySelector('h4').textContent = title;
  box.querySelector('pre').textContent = detail;
}

const lab = createLab({
  stage: document.getElementById('stage'),
  fields: document.getElementById('fields'),
  rows: document.getElementById('rows'),
  readoutPanel: document.getElementById('readouts'),
  side: document.querySelector('.lab-side'),
  subject: SIM.subject,
});

const src = './sim-src/' + SIM.subject + '/' + SIM.id + '/sim.js';
let mod = null;
try {
  mod = await import(src);
} catch (e) {
  showError('Impossible de charger la simulation',
    src + '\n\n' + ((e && (e.stack || e.message)) || e)
    + '\n\nVérifiez que sim.js existe et que c’est un module ES valide.');
}

if (mod) {
  if (typeof mod.mount !== 'function') {
    showError('sim.js n’exporte pas mount()',
      'Le module doit exporter une fonction :\n\n  export function mount(lab) { … }');
  } else {
    try {
      const cleanup = mod.mount(lab);
      if (typeof cleanup === 'function') lab.onDestroy(cleanup);
    } catch (e) {
      lab.fatal(e);
    }
  }
}

// An experiment with nothing to adjust is legitimate; an empty panel with a
// heading over it just looks broken.
if (!document.getElementById('fields').children.length) {
  document.getElementById('controls').hidden = true;
}

window.addEventListener('pagehide', () => lab.destroy());
