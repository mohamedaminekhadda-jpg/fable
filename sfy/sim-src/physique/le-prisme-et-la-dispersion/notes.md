## Pourquoi les couleurs se séparent

Décochez **« Le verre disperse »**. Le prisme dévie toujours le faisceau, mais il
ne le décompose plus : un seul rayon blanc sort. Recochez, le spectre s’ouvre.

C’est toute l’interprétation du §4-3, et elle tient en une phrase : l’indice
dépend de la longueur d’onde. Comme `sin i = n sin r` à chaque face, un indice
différent donne un chemin différent, donc une déviation différente. Le violet,
pour qui `n` est le plus grand, est le plus dévié — le rouge le moins.

La dispersion n’est pas un pouvoir du prisme. C’est une propriété du **verre**,
que le prisme se contente de rendre visible. Changez de verre : le flint dense
étale beaucoup plus que le crown, avec le même angle au sommet.

## Les quatre relations, vérifiables en direct

`sin i₁ = n sin r₁`  ·  `r₁ + r₂ = A`  ·  `n sin r₂ = sin i₂`  ·  `D = i₁ + i₂ − A`

Les relevés `r₁` et `r₂` sont affichés séparément : leur somme vaut A quelle que
soit l’incidence, et c’est la seule des quatre qui ne se voie pas sur un dessin.

## La réflexion totale n’est pas un cas à part

Montez `A` vers 75°, ou passez au flint dense. À un moment, plus rien ne sort par
la face de sortie. Ce n’est pas un cas particulier programmé : `n sin r₂ = sin i₂`
n’a simplement plus de solution quand `n sin r₂ > 1`. Le rayon se réfléchit alors
à l’intérieur, et le tracé le suit — il ressort en général par la base.

## Mesurer l’indice, comme au goniomètre

C’est la manipulation qui vaut le détour, et elle demande de la méthode.

1. Passez sur **une seule radiation** et choisissez sa longueur d’onde.
2. Faites varier `i₁` et appuyez sur **＋ Relever (i₁ , D)** à chaque fois.
   Cherchez à **encadrer** le plus petit `D` : il vous faut des points de part et
   d’autre, sinon vous ne savez pas que vous êtes au minimum.
3. Appuyez sur **＋ Relever n**. La simulation applique la formule du goniomètre

   `n = sin((A + D_m)/2) / sin(A/2)`

   qui ne vaut **qu’au minimum de déviation**, là où `r₁ = r₂ = A/2`.
4. Recommencez pour une deuxième couleur, puis une troisième.

Regardez le graphe `D = f(i₁)` : la courbe est **plate** au voisinage du minimum.
C’est ce qui rend la méthode bonne — une erreur de un degré sur `i₁` ne coûte
presque rien sur `D`, donc presque rien sur `n`. Un minimum pointu serait
impossible à viser.

## A et B, sans les chercher

`n = A + B/λ²` n’est pas une droite en `λ`, mais **c’en est une en `1/λ²`**.
Le troisième graphe porte vos indices mesurés en fonction de `1/λ²` : les points
s’alignent, l’ordonnée à l’origine est `A`, la pente est `B`. Les deux sont
affichées à côté de leurs valeurs vraies.

C’est la question 2 de l’exercice 4, à ceci près que vous avez mesuré les indices
au lieu de les lire dans l’énoncé.

## Ce que ce prisme ne fait pas

Il ne montre pas l’intensité. Aux fortes incidences, une bonne part de la lumière
est **réfléchie** au lieu d’être transmise — c’est pourquoi une vitre vue de biais
devient un miroir. Les rayons tracés ici ont tous la même épaisseur, quelle que
soit l’incidence : la marche est exacte, la brillance ne l’est pas.

## À essayer

- Placez-vous au minimum de déviation en lumière blanche. C’est le réglage des
  spectroscopes : le spectre y est le plus net, et le moins déformé.
- Avec `A = 60°` et le crown, cherchez à partir de quelle incidence le rayon ne
  ressort plus. Comparez à l’angle limite `r = arcsin(1/n)`.
- Prenez trois couleurs très proches (par exemple 480, 500, 520 nm). La droite
  `n = f(1/λ²)` tient encore, mais `B` devient beaucoup plus incertain : un
  levier court mesure mal une pente.
