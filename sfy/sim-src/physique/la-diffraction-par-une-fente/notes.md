## La manipulation, dans l’ordre

C’est l’exercice 3 de la séance, fait au lieu d’être lu.

1. Laissez `λ` et `D` tranquilles pendant toute la mesure — on ne fait varier
   qu’une chose à la fois, et ici c’est `a`.
2. Posez les deux curseurs `C₁` et `C₂` sur les deux **extinctions** qui
   encadrent la tache centrale : les endroits où la courbe touche zéro. Cliquez
   sur l’écran, le curseur le plus proche vient s’y placer.
3. Appuyez sur **＋ Relever (1/a , L)**.
4. Changez de fente. Recommencez. Quatre ou cinq fentes suffisent.

Le graphe s’ouvre tout seul. Les points doivent tomber sur une **droite passant
par l’origine**, et sa pente vaut `2λD` :

`L = 2λD / a`  soit  `L = (2λD) × (1/a)`

d’où `λ = pente / 2D`. Comparez à `λ` du laser, affiché juste en dessous.

Si un point sort de la droite, ce n’est pas la simulation : c’est un curseur mal
posé. Reprenez-le, il n’y a rien d’autre à corriger.

## Ce que la figure n’est pas

Elle n’est pas dessinée. Chaque colonne de l’écran vaut

`I / I₀ = (sin u / u)²`  avec  `u = π a sin θ / λ`

Les extinctions tombent donc là où `sin θ = k λ/a` sans qu’on les y place, et les
franges secondaires valent 4,7 % puis 1,7 % de l’éclairement central parce que la
fonction le dit. La **courbe** du haut est cet éclairement, sans retouche.

La **bande** du dessous est une photo, et « Photo surexposée » est cochée par
défaut : à l’échelle vraie, une frange à 4,7 % est presque noire. L’œil et le
capteur ne sont pas linéaires — c’est pourquoi une photo de diffraction montre
bien plus de franges qu’un tracé fidèle. La courbe dit le vrai, la bande dit ce
qu’on voit.

## Les trois influences du cours, en une manette chacune

- **a diminue → la tache s’élargit.** Contre-intuitif, et c’est le cœur du
  chapitre : plus l’ouverture est étroite, plus l’onde s’étale.
- **λ diminue → la tache rétrécit.** Passez du rouge (633 nm) au bleu (450 nm)
  sans rien toucher d’autre.
- **D augmente → la tache s’élargit.** Là, rien d’étonnant : l’angle est le même,
  l’écran est plus loin.

L’angle, lui, ne dépend **que** de `λ/a`. Changer `D` déplace la tache sur
l’écran sans changer `θ` d’un iota — le relevé `θ` le montre.

## λ/a ou asin(λ/a) ?

Le cours écrit `θ = λ/a`. La valeur exacte est `θ = asin(λ/a)`, et l’écran est à
`x = D tan θ`, pas `D θ`. Les deux relevés sont affichés côte à côte avec leur
écart. Aux valeurs d’ici il vaut quelques millièmes de pour cent : l’approximation
est excellente, et c’est bien pour cela qu’on l’enseigne.

Pour voir où elle cède, poussez `a` vers 30 µm avec `λ` à 750 nm. `λ/a` approche
alors 0,025 et l’écart devient lisible. En dessous de `a = λ`, il n’y a plus
d’extinction du tout : la fente est plus étroite que l’onde.

## Fente ou fil : la même figure

Les exercices passent du fil de pêche aux fils calibrés puis au cheveu. Ce n’est
pas une distraction : une fente de largeur `a` et un fil de diamètre `a` donnent
la même figure de diffraction hors du centre — c’est le théorème de Babinet.
Basculez l’obstacle, la tache ne bouge pas. C’est ce qui permet de **mesurer un
cheveu avec un laser**, ce que fait l’exercice 3 à sa dernière question.

## À essayer

- Relevez cinq fentes, lisez `λ`. Puis changez `D` et refaites les cinq. La pente
  change, `λ` non.
- Mélangez volontairement deux valeurs de `D` dans un même graphe. Les points ne
  s’alignent plus, et la simulation vous le dit — `2λD` n’est plus une constante.
- Posez les curseurs sur la **deuxième** extinction de chaque côté : vous mesurez
  `2L`. La pente double, et `λ` lue est deux fois trop grande. La formule ne
  protège de rien si l’on ne mesure pas ce qu’elle décrit.
