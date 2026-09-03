/* Produit par scripts/make-web.mjs — NE PAS MODIFIER.
   Extrait de lib/notebook-model.js et lib/config.js pour que le cahier du
   navigateur crée exactement la même forme de cahier que celui du bureau. */
window.JaguarModel = (function () {
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function slug(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'book';
}
function defaultNotebook(name) {
  const now = Date.now();
  const page = (title, template, origin) => ({ id: 'p' + (now + Math.floor(Math.random() * 1e6)).toString(36), title, template: template || 'lined', origin: origin || 'student', html: '', created: now, updated: now, grade: null, comments: [] });
  return {
    id: slug(name || 'notebook'),
    brand: { title: 'LE JAGUAR', subtitle: 'Cahier de l’élève', bg: 'aurora', accent: '#c9a054', cover: 'jaguar' },
    student: { nom: '', prenom: name || '', classe: '', avatar: null },
    badges: [
      { icon: '🔥', label: 'Série', value: '0 j' },
      { icon: '⏱', label: 'Temps', value: '0 h' },
      { icon: 'A', label: 'Moyenne', value: '—' },
    ],
    subjects: [
      { id: 's' + now.toString(36), name: 'Matière', icon: 'Σ', color: '#5b6cff', origin: 'student',
        sections: { lecons: [page('Nouvelle leçon', 'lined', 'student')], exams: [], exercices: [], outline: [] } },
    ],
    updated: now,
  };
}
return { slug: slug, defaultNotebook: defaultNotebook };
})();
