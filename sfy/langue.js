/* La langue de la coquille — français ou anglais.
 *
 * Le choix est rangé sous `fable:lang`, la MÊME clé que la page d'accueil de
 * Fable et que le cahier. Publié, tout cela vit sous une seule origine
 * (`…/fable/`), donc les trois surfaces lisent le même réglage : on choisit
 * une fois, pas trois.
 *
 * Ouvert seul, sur son propre domaine, See for yourself garde sa clé à lui et
 * se comporte pareil — c'est simplement un `localStorage` de plus.
 *
 * Ce qui n'est PAS ici : le texte des simulations elles-mêmes. Chacune porte
 * ses propres libellés, et le catalogue porte ses titres et ses résumés ;
 * ils se traduisent là où ils sont écrits, pas dans cette table.
 */

const CLE = 'fable:lang';

function choisie() {
  let v = null;
  try { v = localStorage.getItem(CLE); } catch (e) { /* stockage refusé */ }
  if (v === 'fr' || v === 'en') return v;
  /* Sans choix enregistré, la langue du navigateur décide : un visiteur
     francophone doit arriver chez lui sans avoir à cliquer. */
  const n = (navigator.language || 'fr').toLowerCase();
  return n.indexOf('en') === 0 ? 'en' : 'fr';
}

export const LANG = choisie();

const TEXTES = {
  fr: {
    chercher: 'Chercher une expérience…',
    theme: 'Clair / sombre',
    promesse: 'Ne me croyez pas sur parole.',
    lede: 'Des expériences que l’on règle, relance et mesure soi-même — une par notion, à côté du cours. Rien n’est raconté : tout se calcule et se voit à l’écran.',
    matieres: 'Matières',
    recentes: 'Ajoutées récemment',
    inconnue: 'Matière inconnue',
    retour: 'Retour au catalogue',
    aucuneExp: 'Aucune expérience',
    aucunRes: 'Aucun résultat',
    rienDeTel: 'Rien de tel ici',
    laMarque: 'La marque',
    exp1: 'expérience', expN: 'expériences',
    res1: 'résultat', resN: 'résultats',
    dossier1: 'dossier ignoré dans sims/', dossierN: 'dossiers ignorés dans sims/',
    videTitre: 'La bibliothèque est vide : le catalogue lit le dossier',
    videTerminal: 'Dans un terminal :',
    videChoix: 'Choisissez la matière et donnez un titre.',
    videSquelette: 'Le squelette est créé et fonctionne déjà — ouvrez',
    videRecharge: 'Rechargez cette page : la carte apparaît toute seule.',
    titrePage: 'See for yourself',
    reglages: 'Réglages', mesures: 'Mesures',
    aVoir: 'Ce qu’il faut voir', plein: 'Plein écran',
    sim1: 'simulation', simN: 'simulations',
    aucuneSim: 'aucune simulation pour l’instant',
    mirEye: 'La preuve, tout de suite',
    mirH: 'Tournez le miroir.',
    mirP: 'Le rayon réfléchi n’est pas dessiné. Il est résolu à chaque mouvement par r = i − 2(i·n)n — la même façon de faire que dans chaque expérience de ce banc. L’angle d’entrée vaut l’angle de sortie parce que la géométrie l’impose, et non parce que quelqu’un l’a dessiné pour que ça tombe juste.',
    mirNote: 'Angle d’entrée, angle de sortie — mesurés sur les rayons eux-mêmes.',
    mirIn: 'entrée', mirOut: 'sortie', mirGap: 'd’écart', mirPoignee: 'Angle du miroir',
    mirTitre: 'Un rayon lumineux qui se réfléchit sur un miroir que l’on tourne',
  },
  en: {
    chercher: 'Search for an experiment…',
    theme: 'Light / dark',
    promesse: 'Don’t take my word for it.',
    lede: 'Experiments you set, run and measure yourself — one per idea, alongside the lesson. Nothing is asserted: everything is computed, and you watch it happen.',
    matieres: 'Subjects',
    recentes: 'Recently added',
    inconnue: 'Unknown subject',
    retour: 'Back to the catalogue',
    aucuneExp: 'No experiments',
    aucunRes: 'No results',
    rienDeTel: 'Nothing like that here',
    laMarque: 'The brand',
    exp1: 'experiment', expN: 'experiments',
    res1: 'result', resN: 'results',
    dossier1: 'folder skipped in sims/', dossierN: 'folders skipped in sims/',
    videTitre: 'The shelf is empty: the catalogue reads the folder',
    videTerminal: 'In a terminal:',
    videChoix: 'Pick the subject and give it a title.',
    videSquelette: 'The skeleton is created and already runs — open',
    videRecharge: 'Reload this page: the card appears on its own.',
    titrePage: 'See for yourself',
    reglages: 'Settings', mesures: 'Readings',
    aVoir: 'What to look for', plein: 'Full screen',
    sim1: 'simulation', simN: 'simulations',
    aucuneSim: 'no simulations yet',
    mirEye: 'The proof, right here',
    mirH: 'Drag the mirror.',
    mirP: 'The reflected ray is not drawn. It is solved on every movement by r = i − 2(i·n)n — the same way every experiment on this bench works. The angle in equals the angle out because the geometry says so, not because someone drew it to come out right.',
    mirNote: 'Angle in, angle out — measured off the rays themselves.',
    mirIn: 'in', mirOut: 'out', mirGap: 'apart', mirPoignee: 'Mirror angle',
    mirTitre: 'A light ray reflecting off a mirror you can turn',
  },
};

export function T(k) {
  const t = TEXTES[LANG] || TEXTES.fr;
  return t[k] != null ? t[k] : (TEXTES.fr[k] != null ? TEXTES.fr[k] : k);
}

/* Le champ d'une matière, dans la langue choisie. Les traductions vivent dans
   un bloc `en` à côté du français, dans lib/subjects.js : le catalogue les
   publie telles quelles, donc rien à synchroniser ici. */
export function champ(sujet, nom) {
  if (!sujet) return '';
  if (LANG === 'en' && sujet.en && sujet.en[nom] != null) return sujet.en[nom];
  return sujet[nom] != null ? sujet[nom] : '';
}

/* Le sélecteur, posé dans l'en-tête. Changer de langue recharge : la coquille
   se redessine entièrement depuis le catalogue, et il n'y a qu'un seul chemin
   à maintenir au lieu d'un rendu à chaud en plus. */
export function poserSelecteur(hote) {
  if (!hote) return;
  hote.innerHTML = ['fr', 'en'].map((v) =>
    `<button type="button" class="lang-btn" data-lang="${v}"`
    + ` aria-pressed="${v === LANG ? 'true' : 'false'}">${v.toUpperCase()}</button>`).join('');
  hote.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.lang-btn');
    if (!b) return;
    const v = b.getAttribute('data-lang');
    if (v === LANG) return;
    try { localStorage.setItem(CLE, v); } catch (e2) { /* stockage refusé */ }
    location.reload();
  });
}
