## Faire l’expérience, pas seulement la lire

Laissez n = 20 et p = 0,35, puis appuyez sur **« + 1 000 tirages »**.

Chaque tirage, c’est vingt épreuves de Bernoulli : la machine tire vingt fois un
nombre au hasard, compte combien sont inférieurs à 0,35, et note ce total. Mille
tirages donnent mille totaux, dont on fait un histogramme — les **traits orange**.

Les **bâtons** sont la loi théorique, calculée par la formule

> P(X = k) = C(n, k) p^k (1 − p)^(n−k)

À mille tirages, les traits sautillent autour des bâtons. Appuyez sur
**« + 10 000 »** deux ou trois fois : ils se couchent dessus. **Rien n’a été
ajusté** — c’est la loi des grands nombres, et vous venez de la faire.

## Le second cadre : la moyenne qui se range

Sous l’histogramme, la courbe orange est la **moyenne des tirages effectués**, en
fonction de leur nombre, sur une échelle horizontale logarithmique. La ligne
verte est **n p**.

Au début elle part dans tous les sens. Puis elle se resserre, et elle finit par
tenir entre les deux traits gris, qui sont à ±2σ. Ce resserrement est en
**1/√N** : pour diviser l’écart par deux, il faut **quatre fois** plus de tirages.
C’est pour cela qu’un sondage sur mille personnes n’est pas deux fois meilleur
qu’un sondage sur cinq cents.

## Une expérience qu’on peut refaire à l’identique

Le curseur **« Graine du tirage »** fixe le point de départ du générateur. La même
graine donne **exactement** la même série de tirages.

C’est un outil, pas une curiosité :

- Changez la graine sans rien toucher d’autre : l’histogramme observé change,
  parfois nettement. **Une série n’est pas la loi.**
- Reposez la graine sur sa valeur précédente : la série revient à l’identique.
  On peut donc discuter un résultat surprenant au lieu de le perdre.
- Faites-le à 10 000 tirages : cette fois les deux graines donnent presque le même
  histogramme. **Ce que la loi prédit, c’est ce vers quoi toutes les séries vont.**

## Quatre lectures à savoir faire

- **E(X) = n p.** Le trait vert traverse l’histogramme à son centre de gravité.
  Avec n = 20 et p = 0,35, E(X) = 7 : les bâtons sont les plus hauts autour de 7.
- **V(X) = n p (1 − p)**, et σ en est la racine. Poussez p vers 0,5 : la variance
  est maximale, l’histogramme est le plus étalé. Poussez p vers 0 ou 1 : il se
  resserre sur un seul bâton. **L’incertitude est maximale quand les deux issues
  sont équiprobables.**
- **Le mode n’est pas toujours E(X).** La mesure « valeur la plus probable » est
  cherchée dans la loi, bâton par bâton. Avec n = 20 et p = 0,35, E(X) = 7 et le
  mode est 7 ; mais essayez p = 0,37 : E(X) = 7,4 et le mode reste 7, parce qu’un
  mode est un entier et une espérance ne l’est pas.
- **P(X ≤ k)** se lit en cochant l’escalier violet : il monte de 0 à 1, par
  marches dont la hauteur est P(X = k).

## À essayer

- Mettez **n = 1**. Il ne reste que deux bâtons, de hauteurs 1 − p et p : c’est
  l’épreuve de Bernoulli, dont la binomiale n’est que la répétition.
- Mettez **p = 0,5** et **n = 100**. L’histogramme devient une belle cloche
  symétrique — c’est l’approximation normale, hors programme, mais l’œil la voit
  bien avant qu’on la nomme.
- Mettez **n = 100** et **p = 0,02**, puis regardez le mode : 2. Les événements
  rares sur un grand nombre d’essais donnent une loi très dissymétrique, ramassée
  près de zéro. C’est le régime dit de Poisson.
- Réglez **k** sur une valeur loin de l’espérance : k = 15 avec n = 20 et p = 0,35.
  La loi donne P(X = 15) = 2,6 × 10⁻⁴, donc **environ trois cas attendus sur dix
  mille tirages**. Lancez-en dix mille et comparez : vous en obtiendrez peut-être
  0, peut-être 6. Les deux sont normaux — quand l’attendu est de l’ordre de
  quelques unités, la fluctuation est du même ordre que la quantité mesurée.
  C’est pourquoi mesurer un événement rare demande un échantillon énorme : pour
  connaître cette probabilité à 10 % près, il faudrait environ un million de
  tirages.
