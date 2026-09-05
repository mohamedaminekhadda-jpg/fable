// Cinq pôles, quinze flux et neuf passages.
//
// Le fond de carte n'est plus ici : les contours des pays viennent de Natural
// Earth, dans `monde-fond.js`, produit par `scripts/carto.mjs`. Ce fichier ne
// porte plus que ce qui est propre au sujet — qui commerce avec qui, par où, et
// combien.
//
// Coordonnées en degrés (longitude, latitude).
// Ordres de grandeur 2023 : OMC pour les flux, Office des changes pour le Maroc.

// Exportations mondiales de marchandises, milliards de dollars.
export const MONDE_EXPORT = 23800;

/* Les cinq pôles. `part` est la part des exportations mondiales de
   marchandises — elle inclut, comme toutes les statistiques de l'OMC, ce que
   les pays d'un pôle se vendent entre eux. `interne` est justement cette
   part-là. Le rapport des deux est le fait le plus important de la page, et
   c'est pourquoi il se calcule sur les exportations totales du pôle, et non sur
   les quelques flèches dessinées : celles-ci n'en montrent que les principales. */
export const POLES = [
  { id: 'na', nom: 'Amérique du Nord', court: 'Am. du Nord', lon: -98, lat: 40,
    part: 13, interne: 1250, couleur: '#3d5a80',
    detail: 'États-Unis, Canada, Mexique. L’ALENA devenu ACEUM en 2020 : deux '
      + 'cinquièmes de ce que ce pôle vend, il se le vend à lui-même.' },
  { id: 'eu', nom: 'Europe', court: 'Europe', lon: 12, lat: 50,
    part: 36, interne: 5200, couleur: '#2a9d8f',
    detail: 'Union européenne, Royaume-Uni, Suisse, Norvège. Le pôle le plus '
      + 'commerçant du monde, et de très loin le plus tourné vers lui-même : '
      + 'trois cinquièmes de ses exportations ne quittent pas l’Europe.' },
  { id: 'as', nom: 'Asie de l’Est et du Sud-Est', court: 'Asie', lon: 112, lat: 30,
    part: 33, interne: 4400, couleur: '#c1440e',
    detail: 'Chine, Japon, Corée du Sud, Taïwan, ASEAN. L’atelier du monde, '
      + 'devenu aussi son premier marché : les pièces circulent d’un pays à '
      + 'l’autre avant que l’objet fini ne parte.' },
  { id: 'mo', nom: 'Moyen-Orient', court: 'Moyen-Orient', lon: 47, lat: 25,
    part: 6, interne: 140, couleur: '#8d6a4f',
    detail: 'Golfe Persique et péninsule Arabique. Un pôle d’un seul produit, '
      + 'ou presque, et qui exporte presque tout : un dixième seulement de ce '
      + 'qu’il vend reste dans la région.' },
  { id: 'af', nom: 'Afrique', court: 'Afrique', lon: 20, lat: 2,
    part: 3, interne: 115, couleur: '#c9a227',
    detail: 'Cinquante-quatre pays, 18 % des habitants de la planète, 3 % du '
      + 'commerce mondial, et seulement un sixième de ses exportations vendues '
      + 'à d’autres Africains. La ZLECAf, en vigueur depuis 2021, vise '
      + 'précisément ce chiffre-là.' },
];

// Principaux flux dirigés entre pôles, en milliards de dollars par an. Ils ne
// prétendent pas épuiser le commerce mondial : l'Amérique latine, la Russie et
// l'Océanie n'ont pas de pôle sur cette carte.
export const FLUX = [
  { de: 'as', vers: 'na', v: 1250 },
  { de: 'as', vers: 'eu', v: 1100 },
  { de: 'eu', vers: 'na', v: 700 },
  { de: 'eu', vers: 'as', v: 700 },
  { de: 'na', vers: 'as', v: 560 },
  { de: 'na', vers: 'eu', v: 520 },
  { de: 'mo', vers: 'as', v: 600 },
  { de: 'mo', vers: 'eu', v: 200 },
  { de: 'as', vers: 'mo', v: 250 },
  { de: 'eu', vers: 'mo', v: 180 },
  { de: 'na', vers: 'mo', v: 60 },
  { de: 'eu', vers: 'af', v: 200 },
  { de: 'af', vers: 'eu', v: 180 },
  { de: 'as', vers: 'af', v: 150 },
  { de: 'af', vers: 'as', v: 120 },
];

/* Les passages stratégiques. `part` se lit dans `mesure` : un détroit ne se
   compare pas à un autre sur la même grandeur, et prétendre le contraire ferait
   un joli graphique faux.

   `cote` et `dy` disent de quel côté poser le nom. Autour de la mer Rouge,
   Suez, Bab el-Mandeb, Ormuz et le Bosphore tiennent dans un carré de quinze
   degrés : une règle générale les empilait tous du même côté, alors qu'un choix
   fait passage par passage les répartit d'un coup. */
export const PASSAGES = [
  { id: 'malacca', nom: 'Détroit de Malacca', lon: 100.5, lat: 2.5, part: 25, cote: 'g', dy: 1,
    mesure: 'du commerce maritime mondial', large: '2,8 km au plus étroit',
    texte: 'Le passage le plus fréquenté de la planète : environ 100 000 navires '
      + 'par an. Il relie l’océan Indien à la mer de Chine, donc le pétrole du '
      + 'Golfe aux usines chinoises.' },
  { id: 'ormuz', nom: 'Détroit d’Ormuz', lon: 56.3, lat: 26.6, part: 20, cote: 'd', dy: -1,
    mesure: 'du pétrole mondial', large: '33 km au plus étroit',
    texte: 'Seule sortie du Golfe Persique. Aucun autre passage au monde ne '
      + 'concentre autant d’hydrocarbures sur si peu de kilomètres, et c’est ce '
      + 'qui en fait un enjeu militaire permanent.' },
  { id: 'suez', nom: 'Canal de Suez', lon: 32.3, lat: 30.5, part: 12, cote: 'g', dy: -1,
    mesure: 'du commerce maritime mondial', large: 'creusé, 193 km de long',
    texte: 'Ouvert en 1869, il évite le contournement de l’Afrique et raccourcit '
      + 'de neuf jours le trajet Asie-Europe. En 2021, un seul porte-conteneurs '
      + 'échoué en travers a bloqué le commerce mondial pendant six jours.' },
  { id: 'babel', nom: 'Bab el-Mandeb', lon: 43.3, lat: 12.6, part: 10, cote: 'g', dy: 1,
    mesure: 'du commerce maritime mondial', large: '29 km',
    texte: 'La porte sud de la mer Rouge : sans elle, Suez ne sert à rien. Les '
      + 'deux passages vont ensemble, et une menace sur l’un vaut pour l’autre.' },
  { id: 'gibraltar', nom: 'Détroit de Gibraltar', lon: -5.6, lat: 36.0, part: 10, cote: 'g', dy: -1,
    mesure: 'du commerce maritime mondial', large: '14 km au plus étroit',
    texte: 'La porte de la Méditerranée, et la frontière maritime du Maroc. '
      + 'Tanger Med, sur sa rive sud, est devenu le premier port à conteneurs '
      + 'd’Afrique et de Méditerranée.', maroc: true },
  { id: 'panama', nom: 'Canal de Panama', lon: -79.6, lat: 9.1, part: 5, cote: 'g', dy: 1,
    mesure: 'du commerce maritime mondial', large: 'creusé, 82 km de long',
    texte: 'Ouvert en 1914, il relie l’Atlantique au Pacifique. Il fonctionne '
      + 'avec de l’eau douce : les sécheresses y réduisent désormais le nombre '
      + 'de navires admis chaque jour.' },
  { id: 'bosphore', nom: 'Détroit du Bosphore', lon: 29.0, lat: 41.1, part: 3, cote: 'd', dy: -1,
    mesure: 'du commerce maritime mondial', large: '700 m au plus étroit',
    texte: 'La seule sortie de la mer Noire : blé et pétrole de Russie, '
      + 'd’Ukraine et du Caucase passent tous par là, au milieu d’Istanbul.' },
  { id: 'taiwan', nom: 'Détroit de Taïwan', lon: 119.5, lat: 24.5, part: 20, cote: 'd', dy: -1,
    mesure: 'du trafic de conteneurs mondial', large: '130 km',
    texte: 'Presque tous les navires reliant l’Asie du Nord-Est au reste du '
      + 'monde l’empruntent, et les semi-conducteurs les plus avancés de la '
      + 'planète y sont fabriqués sur l’île elle-même.' },
  { id: 'cap', nom: 'Cap de Bonne-Espérance', lon: 18.5, lat: -34.4, part: 0, cote: 'g', dy: 1,
    mesure: 'route de contournement', large: 'pleine mer',
    texte: 'Ce n’est pas un passage étroit : c’est ce qu’on emprunte quand Suez '
      + 'devient impraticable. Le détour coûte une dizaine de jours de mer, ce '
      + 'qui donne sa valeur exacte au canal.' },
];

// La grande route maritime, d'Europe à l'Asie orientale, dans l'ordre.
export const ROUTE = [
  [4, 52], [-6, 44], [-5.6, 36], [5, 37], [18, 34], [30, 32], [32.3, 30.5],
  [35, 27], [39, 20], [43.3, 12.6], [50, 12], [58, 15], [65, 12], [75, 8],
  [85, 6], [95, 5], [100.5, 2.5], [104, 3], [108, 8], [113, 15], [117, 22],
  [119.5, 24.5], [122, 31],
];
export const ROUTE_GOLFE = [[58, 15], [56.3, 26.6], [52, 28], [50, 29]];

/* ── le Maroc dans les échanges ──────────────────────────────────────────── */
export const MAROC = {
  exports: 41, imports: 73,           // milliards de dollars, marchandises
  clients: [
    { nom: 'Espagne', v: 9.0, ue: true }, { nom: 'France', v: 7.8, ue: true },
    { nom: 'Italie', v: 1.7, ue: true }, { nom: 'Inde', v: 1.5 },
    { nom: 'États-Unis', v: 1.5 }, { nom: 'Brésil', v: 1.3 },
    { nom: 'Allemagne', v: 1.2, ue: true }, { nom: 'Turquie', v: 0.9 },
    { nom: 'Royaume-Uni', v: 0.9 }, { nom: 'Pays-Bas', v: 0.7, ue: true },
  ],
  fournisseurs: [
    { nom: 'Espagne', v: 15.0, ue: true }, { nom: 'Chine', v: 12.0 },
    { nom: 'France', v: 8.0, ue: true }, { nom: 'États-Unis', v: 5.0 },
    { nom: 'Turquie', v: 3.2 }, { nom: 'Italie', v: 3.0, ue: true },
    { nom: 'Allemagne', v: 2.5, ue: true }, { nom: 'Inde', v: 2.1 },
    { nom: 'Russie', v: 2.0 }, { nom: 'Arabie saoudite', v: 1.9 },
  ],
};

export const TANGER = { lon: -5.5, lat: 35.9, nom: 'Tanger Med' };

/* Tout ce qui se déduit se déduit ici, et nulle part ailleurs. */
export const totalFlux = () => FLUX.reduce((s, f) => s + f.v, 0);
export const totalInterne = () => POLES.reduce((s, p) => s + p.interne, 0);
export function sortants(id) { return FLUX.filter((f) => f.de === id).reduce((s, f) => s + f.v, 0); }
export function entrants(id) { return FLUX.filter((f) => f.vers === id).reduce((s, f) => s + f.v, 0); }

// Exportations totales d'un pôle, déduites de sa part du commerce mondial.
export const exportsTotal = (id) => (POLES.find((q) => q.id === id).part / 100) * MONDE_EXPORT;
/* Part des exportations d'un pôle qui ne quittent pas ce pôle. Le chiffre qui
   sépare l'Europe de l'Afrique bien mieux que n'importe quel PIB — et il se
   calcule sur les exportations totales, pas sur la somme des flèches
   dessinées, qui n'en sont qu'une sélection. */
export const repli = (id) => POLES.find((q) => q.id === id).interne / exportsTotal(id);

export function marocBilan() {
  const som = (l) => l.reduce((s, x) => s + x.v, 0);
  const somUE = (l) => l.filter((x) => x.ue).reduce((s, x) => s + x.v, 0);
  const ue = somUE(MAROC.clients) + somUE(MAROC.fournisseurs);
  return {
    balance: MAROC.exports - MAROC.imports,
    couverture: MAROC.exports / MAROC.imports,
    total: MAROC.exports + MAROC.imports,
    partUE: ue / (som(MAROC.clients) + som(MAROC.fournisseurs)),
    premierClient: MAROC.clients.slice().sort((a, b) => b.v - a.v)[0],
    premierFournisseur: MAROC.fournisseurs.slice().sort((a, b) => b.v - a.v)[0],
  };
}
