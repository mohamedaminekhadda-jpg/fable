## D’abord le dessin que tout le monde connaît

Avec **x²** entre 0 et 2, poussez le curseur du nombre de tranches. Les
rectangles se resserrent, l’escalier épouse la courbe, et la somme approche 8/3.

Regardez la mesure **« Erreur »** en même temps. Avec la méthode **à gauche** :

| tranches | erreur |
|---|---|
| 10 | environ 4 × 10⁻¹ |
| 100 | environ 4 × 10⁻² |
| 500 | environ 8 × 10⁻³ |

Dix fois plus de rectangles, dix fois moins d’erreur. C’est déjà une information,
et elle est décevante : pour gagner **une décimale**, il faut **dix fois plus de
calculs**.

## Puis le graphe que personne ne montre

Le second cadre porte l’erreur en fonction de n, avec **deux échelles
logarithmiques**. Dans ce repère, une loi de la forme erreur ≈ C/n^p devient une
**droite de pente −p**, et l’on peut donc lire p à l’œil.

Les quatre méthodes y sont tracées ensemble, et **en général** elles se rangent
en deux familles :

- **gauche** et **droite** : pente **−1**. Erreur divisée par 2 quand on double n.
- **milieu** et **trapèzes** : pente **−2**. Erreur divisée par **4** quand on
  double n.

Changez de méthode : la courbe épaisse change, et la pente mesurée s’affiche en
haut du cadre. Elle n’est pas écrite dans le programme de la simulation — elle
est calculée à chaque image en comparant l’erreur à n = 20 et à n = 200.

> C’est le fait à retenir, et il n’est pas dans le cours de terminale : les
> méthodes ne diffèrent pas d’un peu, elles diffèrent d’un **ordre**. Avec
> 500 tranches sur x², la méthode du milieu est **trois mille fois** plus précise
> que celle de gauche, pour exactement le même nombre d’additions. Sur
> 1/(1+x²) le rapport atteint six mille.

Le mot **« en général »** ci-dessus est là exprès : deux des huit fonctions ne
suivent pas la règle, et ce sont les deux plus instructives. Cherchez-les avant
de lire la suite.

## Pourquoi le milieu est si bon

Mettez **deux ou trois tranches** seulement, et choisissez **au milieu**. Regardez
un rectangle : il dépasse la courbe d’un côté et lui manque de l’autre, et les
deux morceaux se compensent presque exactement.

C’est toute l’explication. Le rectangle à gauche se trompe **toujours dans le
même sens** ; celui du milieu se trompe des deux côtés à la fois. Les trapèzes
font pareil, par l’autre bout : ils coupent la corde au lieu de la tangente.

Sur une fonction **affine**, essayez : les trapèzes deviennent **exacts**, et le
graphe de l’erreur le dit en disparaissant.

## Une intégrale n’est pas une aire

Choisissez **x³ − 2x**, puis mettez a = −2 et b = 2.

La somme vaut **zéro**. Les rectangles sous l’axe sont dessinés en rouge : ils
comptent **négativement**. Une intégrale est une aire *algébrique*, et une copie
qui répond « l’aire vaut 0 » sans le dire perd le point.

Pour obtenir l’aire géométrique, il faut découper aux zéros de la fonction et
additionner des valeurs absolues — ce que la simulation ne fait pas, exprès.

## Les deux exceptions

**sin x sur [0, π] : les quatre méthodes ont la même pente −2.** Regardez le
graphe de l’erreur — les courbes se superposent. Ce n’est pas un défaut du
tracé : les trois sommes sont **rigoureusement égales**, et cela se démontre en
une ligne. La somme à droite moins la somme à gauche vaut h·(f(π) − f(0)), et
sin(π) = sin(0) = 0. Elles sont donc identiques, et les trapèzes, qui en sont la
moyenne, le sont aussi. Vérifiez-le : n = 4 donne 1,8961188979 pour les trois.

Poussez maintenant b à 2π, ou ramenez-le à 2 : l’égalité se rompt, la méthode de
gauche retrouve sa pente −1 et se détache des autres. **L’exception venait des
bornes, pas de la fonction.**

**√x sur [0, 4] : le milieu et les trapèzes tombent à −1,5.** La raison est en
x = 0, où la tangente est verticale : f′ n’y est pas bornée, et la majoration
d’erreur du cours suppose précisément que f′ ou f″ le soit. Une hypothèse qu’on
oublie de vérifier finit toujours par se rappeler à nous — ici, elle coûte un
demi-ordre, et le gain du milieu tombe de trois mille à cent quatre-vingt-dix.

## À essayer

- Sur **1/x**, mettez a = 1 et faites glisser b. L’aire affichée **est** ln b :
  posez b = e ≈ 2,718 et lisez 1,000. Le logarithme népérien n’est pas une touche
  de calculatrice, c’est cette aire.
- Sur **1 / (1 + x²)** entre 0 et 1, l’aire vaut π/4. Avec vingt tranches au
  milieu vous avez déjà 3,1416 en multipliant par quatre. C’est ainsi qu’on a
  calculé π pendant trois siècles.
- Sur **sin x**, poussez b de π à 2π. L’aire monte à 2, puis **redescend à 0**. La
  seconde arche annule la première.
- Sur **√x** entre 0 et 4, la tangente est verticale en 0 : la fonction n’y est pas
  dérivable, et l’aire vaut pourtant 16/3. **Dérivable et intégrable sont deux
  choses différentes**, et c’est le contre-exemple le plus simple.
