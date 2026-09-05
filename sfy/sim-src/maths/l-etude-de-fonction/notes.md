## Trois courbes, un seul axe

Les trois panneaux partagent l’axe des abscisses, et le curseur les traverse
tous les trois **à la même valeur de x**. C’est là tout l’intérêt : ce qui se
passe sur un panneau se lit sur les autres au même endroit.

Tirez le curseur lentement sur **x³ − 3x + 1** et vérifiez les trois
correspondances. Ce sont les trois seules choses à retenir du chapitre.

1. **La pente de la tangente sur f est l’ordonnée du point sur f′.** Quand la
   tangente monte, le point de f′ est au-dessus de l’axe. Quand elle descend, il
   est en dessous.
2. **La tangente est horizontale exactement quand f′ coupe l’axe.** C’est la
   définition d’un extremum, et le cercle orange marque l’endroit sur les trois
   panneaux à la fois.
3. **La courbure se retourne exactement quand f″ coupe l’axe.** Avant, la courbe
   tourne vers le haut ; après, vers le bas. Le losange violet marque le point
   d’inflexion.

## Le tableau de variations n’est pas un objet à part

La bande sous la courbe de f est **verte quand f′ > 0** et **rouge quand
f′ < 0**, avec la flèche correspondante. Regardez-la, puis regardez la courbe de
f′ juste en dessous : la bande change de couleur précisément là où f′ change de
côté.

Un tableau de variations **est** le signe de la dérivée, mis en tableau. Rien de
plus. Celui que vous voyez ici n’a pas été écrit : il est construit à chaque
image en cherchant les zéros de f′, puis en regardant le signe de f′ entre deux
zéros consécutifs — exactement la méthode qu’on vous demande d’appliquer.

## Six pièges, un par fonction

- **x e^(−x)** — le maximum est en 1, l’inflexion en 2. Ce ne sont **pas** les
  mêmes points, et les confondre est l’erreur la plus fréquente de l’épreuve.
- **(2x+1)/(x−1)** — f′ ne s’annule jamais : elle vaut −3/(x−1)², donc elle est
  strictement négative partout. Pas d’extremum. Et surtout : la fonction est
  décroissante **sur chacun** de ses deux intervalles, ce qui ne permet pas de
  dire qu’elle est décroissante sur leur réunion — les deux branches le montrent
  d’un coup d’œil.
- **x + 1/x** — il y a un maximum en −1 où f vaut **−2**, et un minimum en 1 où f
  vaut **+2**. Le maximum est donc plus petit que le minimum. « Maximum local »
  ne veut pas dire « plus grande valeur de la fonction ».
- **e^x − x − 1** — f″ = e^x ne s’annule jamais : la courbe est convexe partout,
  donc **aucun point d’inflexion**, quoi qu’en dise l’allure. Le minimum vaut 0,
  et c’est la démonstration de e^x ≥ x + 1.
- **x − ln(x)** — même chose : f″ = 1/x² est toujours positive. La courbe semble
  « beaucoup tourner » près de zéro, et pourtant elle ne change jamais de sens
  de courbure. L’œil se trompe, f″ non.
- **ln(x)/x** — le maximum vaut 1/e en x = e. C’est ce qui prouve que la suite
  x^(1/x) est maximale en e, et l’inflexion tombe en e^(3/2) ≈ 4,48.

## Ce que ne fait aucune calculatrice

Décochez **f′** et **f″**, puis choisissez **(2x+1)/(x−1)** ou **x + 1/x**.
Regardez la courbe : les deux branches sont **séparées**, jamais reliées par un
trait vertical.

La plupart des calculatrices graphiques tracent ce trait, parce qu’elles relient
deux points successifs sans se demander s’il y a un pôle entre eux. Ce trait
n’existe pas : il ferait croire que la fonction prend toutes les valeurs
intermédiaires, donc qu’elle est continue là où elle n’est même pas définie.
Ici le tracé se coupe dès que le saut dépasse la hauteur du cadre.

## À essayer

- Sur **(x²−1)/(x²+1)**, posez le curseur en 0 : f′(0) = 0 et la tangente est
  horizontale. La fonction est **paire**, donc sa dérivée est **impaire** — et une
  fonction impaire définie en 0 y vaut nécessairement 0. Le dessin le confirme,
  mais c’est l’algèbre qui le prouve.
- Cherchez, sur la cubique, le point où f″ = 0 : c’est x = 0, et f y vaut 1.
  Placez-y le curseur et regardez la tangente : elle **traverse** la courbe au
  lieu de rester du même côté. C’est la signature d’un point d’inflexion, et le
  seul cas où cela arrive.
- Sur **x e^(−x)**, poussez le curseur vers la droite. f(x) tend vers 0, f′ aussi,
  f″ aussi : les trois courbes s’aplatissent ensemble sur l’axe. L’asymptote
  horizontale n’est pas seulement une propriété de f.
