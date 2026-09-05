// L'identité visuelle, en un seul endroit.
//
// Le serveur en a besoin (l'en-tête du banc est rendu en Node), la page du
// catalogue aussi (elle est rendue dans le navigateur) : le module est donc du
// texte pur, sans DOM et sans dépendance. Il vit dans app/ parce que c'est app/
// que le serveur sert au navigateur — même arrangement que app/vignettes.js,
// que lib/catalogue.js lit depuis Node.
//
// ── L'IDÉE ────────────────────────────────────────────────────────────────
// La marque n'est pas un œil. Un œil dit « regarde » ; on veut dire « regarde
// À TRAVERS QUELQUE CHOSE ». C'est donc le schéma de la lentille convergente,
// celui que tout élève de bac a déjà tracé à la règle : la lumière sort de la
// lentille et se referme sur un point.
//
//        ⟨\
//        | \___
//        |  ___  •      ce qui était étalé devient un point : on voit
//        | /
//        ⟨/
//
// Le foyer est DÉTACHÉ des rayons, et ce détail n'est pas cosmétique : rayons
// et point collés, le dessin devient un mégaphone — un objet qui parle, exactement
// le contraire de ce qu'on promet. Séparés, l'œil lit « cela converge vers là ».
//
// Le faisceau entrant, lui, a été essayé et jeté : avec les rayons parallèles à
// gauche la silhouette devenait une fléchette, et la lentille disparaissait au
// milieu. Une marque se juge à sa silhouette, pas à son exactitude.
//
// ── LES RÈGLES ────────────────────────────────────────────────────────────
// 1. La marque se trace en `currentColor`. Elle est de la couleur de l'encre,
//    jamais de la couleur d'une matière : la couleur appartient aux matières.
// 2. Une seule couleur vive à l'écran à la fois — celle de la matière ouverte.
//    Le vermillon (--live) est la seule exception, et il ne sert qu'à dire
//    qu'une mesure est en train de tourner.
// 3. Trois familles de caractères, trois rôles, jamais mélangés :
//    la SÉRIF affirme (le nom, les titres), la SANS explique (le texte
//    courant), la MONO mesure (étiquettes, compteurs, unités).
// 4. La réglure graduée (.tickrule) est le seul ornement autorisé.

export const BRAND = {
  nom: 'See for yourself',
  descripteur: 'Simulations',
  // La phrase qui porte tout le reste. Elle est en une du catalogue.
  promesse: 'Ne me croyez pas sur parole.',
  // Ce que la marque veut dire, en une ligne, pour qui devrait l'expliquer.
  sens: 'La lumière sort de la lentille et se referme sur un point : '
    + 'l’instrument ne raconte pas, il montre.',
};

/* La marque. Tracée sur une grille de 32, sur l'axe optique y = 16.

   Les rayons partent des DEUX POINTES de la lentille et visent exactement le
   foyer (27,6 ; 16) — ils s'arrêtent avant lui, mais leur direction est juste :
   prolongés, ils tombent sur le point. Un dessin d'optique dont les rayons ne
   convergent pas vraiment est un dessin qui ment sur une page qui promet de ne
   pas mentir.

   `rayons: false` ne garde que la lentille et son foyer. La marque complète
   tient à 16 pixels, mais gravée dans un bouton minuscule ou brodée, il faut
   pouvoir jeter le détail : une marque qui ne se simplifie pas se salit. */
export function marque({ taille = 26, rayons = true, trait = 1.9, titre = '' } = {}) {
  const lentille = 'M8.5 5.5A17 17 0 0 1 8.5 26.5A17 17 0 0 1 8.5 5.5Z';
  // les rayons portent une classe : au survol, ils s'allongent vers le foyer et
  // le point se resserre — la marque fait sous le doigt ce qu'elle raconte
  const faisceau = rayons
    ? '<path class="rai" d="M8.5 5.5 22.4 13.2"/><path class="rai" d="M8.5 26.5 22.4 18.8"/>'
    : '';
  return `<svg class="marque" viewBox="0 0 32 32" width="${taille}" height="${taille}"`
    + ` fill="none" stroke="currentColor" stroke-width="${trait}"`
    + ` stroke-linecap="round" stroke-linejoin="round"`
    + (titre ? ` role="img" aria-label="${titre}"` : ' aria-hidden="true"') + '>'
    + `<path d="${lentille}"/>`
    + faisceau
    + `<circle cx="27.6" cy="16" r="2.5" fill="currentColor" stroke="none"/>`
    + '</svg>';
}

/* Le bloc-marque : la marque, le nom, et le descripteur séparé par un filet.
   C'est la seule composition autorisée — on ne recompose pas un logo à chaque
   page. `as` permet d'en faire un lien (catalogue) ou un bloc inerte (banc). */
export function blocMarque({ as = 'a', href = '#/', taille = 25, descripteur = BRAND.descripteur } = {}) {
  const attrs = as === 'a' ? ` href="${href}"` : '';
  return `<${as} class="marque-bloc"${attrs}>`
    + marque({ taille, titre: BRAND.nom })
    + `<b>${BRAND.nom}</b>`
    + (descripteur ? `<i>${descripteur}</i>` : '')
    + `</${as}>`;
}
