## L’expérience à faire en premier

Choisissez **z ↦ z²**, puis promenez la souris **le long du cercle unité**, en
faisant lentement un tour complet.

Votre point fait **un** tour. Son image en fait **deux**.

C’est toute la règle : sur z², le module est élevé au carré — donc il ne change
pas sur le cercle, où il vaut 1 — et l’**argument est doublé**. Passez à **z ↦ z³**
et refaites le tour : l’image en fait trois.

Regardez la mesure **« Ce qui s’est passé »** : elle affiche |z′|/|z| et
arg(z′) − arg(z) à chaque instant. Sur z², le premier vaut |z| et le second vaut
arg(z), quelle que soit la position. Vous pouvez le vérifier partout.

## Ce que la trace apprend

La trace orange est le chemin de l’image. Une position montre un cas ; la trace
montre la **loi**.

- Sur **z ↦ 1/z**, promenez le point sur un cercle de rayon 2 : la trace est un
  cercle de rayon 1/2, parcouru **dans l’autre sens**. Les points du cercle unité,
  eux, ne bougent pas de ce cercle : c’est le seul lieu invariant.
- Sur **z ↦ z̄**, la trace est le reflet exact de votre geste dans l’axe des réels.
  Les points de cet axe sont fixes.
- Sur **z ↦ z²**, suivez une **droite verticale** : la trace est une parabole. Suivre
  une droite horizontale en donne une autre, tournée. C’est la première fois qu’on
  voit une identité algébrique produire une courbe.

## La similitude, et le théorème du chapitre

Choisissez **z ↦ a z + b**. Quatre curseurs apparaissent : le module de a,
l’argument de a, et les deux parties de b.

Faites-les varier un par un, et nommez ce que vous voyez :

1. **arg(a)** seul fait **tourner** autour de l’origine — c’est une rotation.
2. **|a|** seul **éloigne ou rapproche** de l’origine — c’est une homothétie.
3. **b** seul **translate** tout le plan, sans rien tourner.

D’où le théorème, qu’il faut savoir énoncer : *toute similitude directe du plan
s’écrit z ↦ az + b, avec |a| pour rapport et arg(a) pour angle.* Mettez |a| = 1 :
il ne reste qu’une rotation suivie d’une translation, donc une rotation autour
d’un autre centre.

## La somme des racines est nulle, et on la voit

Passez à **les racines n-ièmes**. Les n points se posent sur le cercle, aux
sommets d’un polygone régulier, séparés de 2π/n.

Maintenant l’essentiel. Cochez **« Poser les racines bout à bout »** : les mêmes n
vecteurs sont replacés à la queue les uns des autres, en bas à gauche. **Le chemin
revient exactement à son point de départ.**

C’est la démonstration visuelle de

> 1 + ω + ω² + … + ω^(n−1) = 0

que l’on prouve d’ordinaire avec la somme d’une suite géométrique — et qu’on ne
voit jamais. La mesure affiche l’écart de fermeture : il est de l’ordre de 10⁻¹⁶,
c’est-à-dire nul à la précision de la machine.

Faites varier n. Le polygone se referme pour **tout** n ≥ 2. Pour n = 2, les deux
racines sont 1 et −1, et la « chaîne » est un aller-retour.

## À essayer

- Sur **z ↦ z²**, posez le point exactement sur **i** (module 1, argument 90°).
  L’image tombe sur −1 : c’est i² = −1, et l’argument est passé de 90° à 180°.
- Sur **z ↦ 1/z**, approchez l’origine. Le module de l’image explose, et la
  simulation le dit : en z = 0 elle affiche « non défini ». Zéro est le seul
  complexe sans inverse.
- Avec **n = 3** dans la seconde vue, lisez la valeur de ω : −0,5 + 0,866 i. Ce
  0,866 est √3/2, et ω est donc e^(2iπ/3), la racine cubique de l’unité qui
  revient dans tous les exercices.
- Toujours en similitude, mettez |a| = 1, arg(a) = 90° et b = 0 : vous obtenez la
  multiplication par i, donc le quart de tour. **Multiplier par i, c’est tourner.**
