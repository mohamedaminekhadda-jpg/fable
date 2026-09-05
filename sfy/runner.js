// Loads one simulation onto the bench.
//
// The reason this is a module rather than a few lines in the generated page is
// the error handling. A simulation that fails to import, exports no mount(), or
// throws on its first frame must say so in plain words on screen: an author
// staring at a blank rectangle learns nothing, and neither does a teacher.
import { createLab } from './harness.js';

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
