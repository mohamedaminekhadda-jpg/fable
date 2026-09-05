## Comment lire l’escalier

Le tracé se construit toujours de la même façon, et il faut savoir le refaire à
la main sur une copie :

1. On part de **u(0)** sur l’axe des abscisses.
2. On monte **verticalement jusqu’à la courbe** : la hauteur atteinte est u(1).
3. On va **horizontalement jusqu’à la droite y = x** : cela reporte u(1) sur
   l’axe des abscisses.
4. On recommence.

C’est tout. La droite y = x ne sert qu’à une chose : transformer une **hauteur**
en une **abscisse**, pour pouvoir la réinjecter dans f.

## Le seul nombre qui compte

Appuyez sur **« Dérouler »** avec la première suite, puis essayez les autres.
Vous verrez quatre dessins, et un seul nombre les explique : **f’(l)**, la pente
de la courbe au point fixe.

| ce que vous voyez | ce que vaut f’(l) |
|---|---|
| escalier qui monte vers l | entre 0 et 1 |
| spirale qui se resserre | entre −1 et 0 |
| spirale qui s’élargit, puis cycle | inférieur à −1 |
| escalier qui s’échappe | supérieur à 1 |

Le critère à retenir, et il est au programme : **si |f’(l)| < 1, le point fixe
attire ; si |f’(l)| > 1, il repousse.** Cochez **« La tangente au point fixe »** :
quand cette tangente est moins pentue que la diagonale, ça converge. Quand elle
est plus pentue, ça part.

> Un point fixe n’est **pas** une limite. C’est un *candidat*. Le passage
> obligé d’une copie — « si u(n) converge vers l, alors l vérifie f(l) = l » —
> commence par un **si**, et la suite 3,2 u(1−u) montre pourquoi : son point fixe
> existe, se calcule, et n’est la limite de rien.

## Le rapport des écarts

Regardez la mesure **« Rapport des écarts »** pendant que la suite se déroule.
Elle affiche |u(n+1) − l| ÷ |u(n) − l|, et elle se stabilise sur **|f’(l)|**.

C’est la réponse à la question que les élèves posent toujours : *à quelle
vitesse ?*

- Pour **√(u+2)**, f’(2) = 0,25 : chaque pas divise l’écart par quatre. Depuis
  u(0) = 6, il faut **dix pas** pour cinq décimales exactes.
- Pour **cos**, f’(l) ≈ −0,67 : chaque pas ne retire qu’un tiers de l’écart. Il
  en faut **vingt-huit** pour la même précision — presque trois fois plus, et le
  rapport des deux nombres de pas est celui des deux logarithmes de |f’(l)|.
- Pour **0,5 u + 3**, la dérivée est constante, donc le rapport vaut exactement
  0,5 **dès le premier pas** — c’est le propre des suites arithmético-géométriques,
  dont la vitesse ne dépend pas du point de départ.

## Le cas remarquable : u/2 + 1/u

Choisissez cette suite et déroulez. Le rapport des écarts ne se stabilise pas :
il **tend vers zéro**. La raison est visible sur le dessin — au point fixe, la
courbe est **tangente à l’horizontale**, donc f’(√2) = 0.

Conséquence : une fois la suite entrée dans le voisinage de √2, le nombre de
décimales exactes **double** à chaque pas. Depuis u(0) = 5, comptez-les :

| pas | 3 | 4 | 5 | 6 |
|---|---|---|---|---|
| décimales exactes | 1 | 3 | 7 | 15 |

Six pas, et la calculatrice n’a plus de chiffres à afficher. C’est la méthode de
Newton, et c’est ainsi que votre calculatrice extrait les racines carrées.

Comparez avec les dix pas de √(u+2) et les vingt-huit de cos : **f’(l) = 0 n’est
pas « un peu mieux », c’est un autre régime.**

## Ce que le papier ne peut pas faire

- **Tirez u(0)** sur la suite u² − 1. Entre les deux points fixes la suite tombe
  sur le cycle 0 → −1 ; au-delà, elle explose. La frontière entre les deux, vous
  la trouvez à la main en quelques secondes. Ce que vous venez de délimiter
  s’appelle un **bassin d’attraction**.
- Passez de **3,2 u(1−u)** à **3,9 u(1−u)**. Même formule, un coefficient à peine
  changé, et le tracé ne se referme plus jamais. Puis, sur 3,9, décalez u(0) d’un
  millième : la suite prend un tout autre chemin. Ce n’est pas au programme —
  mais c’est à deux clics de l’exercice ordinaire, et cela mérite d’être vu.

## À essayer

- Sur **(u+3)/(u+1)**, regardez le graphe de droite : les termes encadrent la
  limite en alternant au-dessus et au-dessous. Une suite convergente n’est donc
  **pas forcément monotone** — et l’encadrement alterné est justement ce qui
  permet de majorer l’erreur sans connaître la limite.
- Mettez **u(0) = 2** sur la première suite, puis **u(0) = −2**. Le point fixe est
  atteint immédiatement dans un cas : c’est ce qu’on appelle une suite
  stationnaire, et le tracé se réduit à un point.
- Cherchez, sur **cos**, la valeur du point fixe affichée : 0,739085… Aucune
  fonction usuelle ne l’exprime. Elle a été trouvée ici par **dichotomie**, la
  même méthode que le théorème des valeurs intermédiaires met en œuvre.
