## La manipulation, dans l’ordre

1. Laissez M₂ collé à M₁ : `d = 0`. Les deux courbes se superposent — les micros
   reçoivent la même chose au même instant. Ils vibrent **en phase**.
2. Éloignez M₂ lentement. La courbe bleue glisse vers la droite : M₂ reçoit la
   vibration plus tard.
3. Continuez jusqu’à ce que les deux courbes se **superposent de nouveau**.
   Appuyez sur **＋ Relever d**.
4. Recommencez trois ou quatre fois.

L’écart entre deux relevés successifs est la longueur d’onde. Avec f = 1000 Hz
à 20 °C, vous devriez retrouver la série du cours : environ 34, 68, 102, 136 cm.

Puis `v = λ f`. Comparez à la valeur réelle affichée : c’est votre mesure contre
la physique.

## Pourquoi les courbes se superposent tous les λ

Les deux micros reçoivent la même vibration, décalée du temps qu’il faut au son
pour aller de l’un à l’autre : `d / v`. Ce décalage ne change rien à l’allure du
signal s’il vaut un nombre entier de périodes :

`d / v = k T`  ⟺  `d = k v T`  ⟺  **`d = k λ`**

C’est la règle du §3-1, et elle se voit ici plutôt qu’elle ne se récite. À
mi-chemin, `d = (2k+1) λ/2`, une courbe est en haut quand l’autre est en bas :
**en opposition de phase**.

## Deux erreurs que cette expérience corrige

- **« Le décalage des courbes, c’est λ. »** Non : l’axe de l’oscilloscope est un
  **temps**. Ce qu’on lit dessus est un retard, en millisecondes. λ est une
  **longueur**, et on la lit sur le banc, avec une règle.
- **« Il suffit d’un seul relevé. »** Le premier `d` où les courbes se
  superposent donne λ, mais une seule mesure n’a pas d’incertitude. Quatre
  relevés et une moyenne des écarts, c’est une mesure.

## La célérité n’est pas un nombre à retenir

Elle dépend de la température, et le simulateur la calcule :

`v = 331,3 + 0,606 θ`  (m/s)

Poussez θ de −10 °C à 40 °C et regardez λ suivre, à fréquence constante. C’est
la phrase du cours — « pour les gaz, la célérité du son augmente avec la
température » — devenue une manette.

## À essayer

- Doublez f. λ est-elle divisée par deux ? Et v, a-t-elle bougé ?
- Réglez `d` sur une opposition de phase, puis changez la sensibilité
  horizontale. Le décalage **en divisions** change ; l’opposition, non.
- Le son est longitudinal : les grains d’air se déplacent **le long** du banc,
  jamais en travers. Les zones serrées sont les compressions.
