/* UN ESSAI INVENTÉ, POUR VOIR LA FORME DU RAPPORT AVANT D'AVOIR LES DONNÉES.
 *
 * Deux usages, et le second est le vrai. Il vérifie que les tableaux se
 * calculent juste — c'est ainsi qu'on a trouvé que sept figures d'un même
 * chapitre se dédoublonnaient en quatre. Et surtout il montre À QUOI
 * RESSEMBLERA LE RÉSULTAT avant de distribuer le moindre lien : on décide
 * beaucoup mieux quelles questions poser à un professeur quand on a déjà vu
 * la tête des réponses.
 *
 * UN CAS PAR VERDICT. Chaque figure illustre un diagnostic différent, pour
 * qu'on voie d'un coup d'œil ce que la console sait reconnaître.
 *
 * Fichier à part, chargé seulement par « ?demo » : de fausses mesures qui
 * traîneraient dans le même fichier que les vraies finiraient un jour par
 * être lues comme vraies.
 */
const FIGURES = ['map', 'solar', 'quiz', 'periodic', 'sim', 'flashcards', 'wave'];

const PROFILS = {
  map: { n: 0, av: -1, mo: 0, rg: 0, gl: 0, db: 1, ct: {} },
  solar: { n: 0, av: -1, mo: 0, rg: 0, gl: 0, db: 0, ct: {} },
  periodic: { n: 11, av: 9, mo: 8, rg: 0, gl: 0, db: 0, ct: { '.': 8, 'iwp-el': 3 } },
  flashcards: { n: 9, av: 6, mo: 1, rg: 2, gl: 0, db: 0, ct: { 'iw-btn': 6, '.': 3 } },
  sim: { n: 8, av: 4, mo: 0, rg: 0, gl: 22, db: 0, ct: { 'iws-range': 8 } },
  wave: { n: 3, av: 28, mo: 0, rg: 0, gl: 0, db: 0, ct: { 'iw-btn': 3 } },
  quiz: { n: 7, av: 3, mo: 0, rg: 0, gl: 0, db: 0, ct: { 'iwq-opt': 5, 'iw-btn': 2 } },
};

export function groupesInventes() {
  return [
    { code: 'soutien-bac-1', nom: 'Soutien — bac, group 1', cree: Date.now() - 12 * 864e5,
      note: 'Six former pupils, physics and maths. Two weeks from 21 September.', ferme: false },
    { code: 'soutien-bac-2', nom: 'Soutien — bac, group 2', cree: Date.now() - 5 * 864e5,
      note: 'The control group: same book, no introduction from the teacher.', ferme: false },
  ];
}

export function essaiInvente() {
  const q = (n) => 'q' + n;
  const inv = [];
  for (let d = 0; d < 5; d++) {
    const uid = 'demo' + d + 'x'.repeat(8);
    const seances = d < 2 ? 3 : d < 4 ? 2 : 1;
    const ev = [];
    for (let s = 0; s < seances; s++) {
      ev.push({ k: 'ouvre', p: 'livre', b: 'manuel-bac-demo', q: q(s), t: Date.now() - d * 9e7 - s * 864e5 });
      ['chapter-01', 'chapter-02', 'chapter-04'].slice(0, 3 - s).forEach((c, i) => {
        ev.push({
          k: 'chapitre', b: 'manuel-bac-demo', c,
          n: ['Mathématiques', 'SVT', 'Physique-chimie'][i],
          s: 120 + d * 40 + i * 60, q: q(s), t: Date.now(),
        });
      });
      FIGURES.forEach((f, i) => {
        const P = PROFILS[f];
        ev.push({
          k: 'element', b: 'manuel-bac-demo', c: 'chapter-0' + (1 + i % 4), e: f, i,
          n: P.n, vu: 12 + i * 4, av: P.av, ct: P.ct, mo: P.mo, rg: P.rg, kb: 0,
          rv: f === 'sim' ? 4 : 0, gl: P.gl, fi: 0, db: d < 2 ? P.db : 0, re: (i + d) % 3,
          q: q(s), t: Date.now() + i,
        });
      });
      if (d % 2 === 0) {
        ev.push({ k: 'exercice', b: 'manuel-bac-demo', c: 'chapter-02', e: 'quiz',
          ok: 3 + d % 3, sur: 8, q: q(s), t: Date.now() });
      }
      ev.push({ k: 'fin', s: 400 + d * 100, nf: 157, nc: 8, q: q(s), t: Date.now() });
    }
    if (d === 1 || d === 3) {
      ev.push({ k: 'panne', b: 'manuel-bac-demo', f: 'index.html', l: 8821, q: q(0), t: Date.now(),
        m: "Cannot read properties of null (reading 'getContext')" });
    }
    if (d === 3) {
      ev.push({ k: 'panne', b: 'manuel-bac-demo', m: 'WebGL context lost', f: 'index.html',
        l: 9110, q: q(0), t: Date.now() });
    }
    inv.push({
      uid,
      profil: {
        code: d < 3 ? 'soutien-bac-1' : 'soutien-bac-2',
        vu: { toDate: () => new Date(Date.now() - d * 864e5) },
        appareil: {
          famille: ['android', 'android', 'ios', 'android', 'windows'][d],
          ecran: ['360x800', '412x915', '390x844', '360x780', '1366x768'][d],
          reseau: ['3g', '4g', '4g', 'slow-2g', ''][d],
          tactile: d < 4,
        },
      },
      lots: [{ code: d < 3 ? 'soutien-bac-1' : 'soutien-bac-2', seance: 'q0', ev }],
    });
  }
  return inv;
}
