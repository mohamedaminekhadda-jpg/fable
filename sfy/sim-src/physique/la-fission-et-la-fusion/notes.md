## Pourquoi un neutron, et pas un proton

Le cours le dit en une phrase : « on utilise le neutron dans le bombardement car
c’est une particule neutre qui arrive facilement au noyau sans entrer en
répulsion avec lui ». Essayez l’autre : passez le projectile sur **proton**.

Il approche, ralentit, et fait demi-tour. Il n’atteint jamais le noyau, parce
qu’un noyau d’uranium porte 92 charges positives et le repousse de loin. Le
neutron, lui, ne sent rien de tout cela : il traverse et se fait capturer.

C’est la même barrière qui gêne la fusion, vue de l’autre côté.

## Une fission, en trois temps

1. Le neutron arrive et se fait **capturer** : l’uranium 235 devient uranium 236.
2. Cet U-236 est instable. Il **s’allonge**, comme une goutte qu’on étire.
3. Passé un certain étirement, la répulsion électrique entre les deux moitiés
   l’emporte sur la cohésion nucléaire : il **se pince et se casse**. Deux
   fragments très inégaux partent à grande vitesse, avec deux ou trois neutrons.

Les 180 MeV libérés ne sont presque pas du rayonnement : c’est surtout de
l’**énergie cinétique** des deux fragments. Dans un réacteur, cette énergie
devient de la chaleur en quelques micromètres, et c’est cette chaleur qui fait la
vapeur qui fait tourner la turbine.

## Tout tient dans k

Chaque fission relâche deux ou trois neutrons. Tous ne provoquent pas une
nouvelle fission : certains s’échappent, d’autres sont absorbés sans casser quoi
que ce soit. Le nombre qui en provoque une, c’est **k**.

| k | ce qui se passe | à quoi cela correspond |
|---|---|---|
| k < 1 | chaque génération est plus maigre | la chaîne s’éteint |
| k = 1 | chaque fission en fait exactement une | un réacteur en marche |
| k > 1 | chaque génération est plus nombreuse | l’emballement |

Poussez k à 1,05 et suivez douze générations : on passe de 1 à moins de deux
fissions. Poussez-le à 2 : plus de quatre mille. **C’est la même manette**, et
c’est pourquoi un réacteur passe son temps à la régler, avec des barres qui
absorbent les neutrons en excès.

Un détail qui compte : à k = 1 exactement, rien ne s’emballe et rien ne s’éteint,
mais la puissance ne monte pas non plus. Pour démarrer, il faut passer un moment
au-dessus de 1, puis revenir.

## La fusion : la même barrière, dans l’autre sens

Deux noyaux sont positifs, donc ils se repoussent. La courbe du bas est leur
énergie potentielle : elle **monte** quand ils se rapprochent — c’est Coulomb —
puis **plonge** brutalement au contact, quand l’interaction nucléaire prend le
relais. La bosse entre les deux est la **barrière**.

`V = Z₁Z₂ e² / 4πε₀ r`, prise au contact `r = 1,2 (A₁^⅓ + A₂^⅓)` fm

La ligne horizontale est l’énergie apportée. Tant qu’elle passe **sous** la
bosse, les deux noyaux rebroussent chemin au point où la courbe la coupe. Dès
qu’elle passe au-dessus, ils se touchent et fusionnent.

Comparez les couples : deutérium + tritium demande 0,44 MeV, carbone + carbone en
demande 9,4 — **vingt et une fois plus**, parce que `Z₁Z₂` passe de 1 à 36. C’est
pour cela que les étoiles brûlent l’hydrogène pendant des milliards d’années
avant de toucher au carbone, et qu’il leur faut être bien plus chaudes pour cela.

## Une réserve honnête sur la température

Le relevé « température équivalente » applique `E = 3/2 kT`. Il donne des
milliards de degrés, alors qu’un tokamak vise cent à cent-cinquante millions.

L’écart est réel et il a deux causes, toutes deux hors programme : dans un gaz
chaud, **quelques** noyaux vont bien plus vite que la moyenne, et la mécanique
quantique permet de **traverser** la barrière sans passer par-dessus. La barrière
calculée ici est donc la bonne ; c’est la conclusion « il faut donc telle
température » qui est trop sévère.

## À essayer

- Mettez k à 0,95, puis 1,00, puis 1,05, en gardant douze générations. Trois
  mondes différents pour cinq centièmes d’écart.
- Sur la fusion, prenez proton + proton et montez l’énergie : la barrière coûte
  0,60 MeV et la réaction n’en rend que 0,42. Le Soleil s’en accommode parce
  qu’il a beaucoup de temps et énormément de protons.
- Regardez le point de rebroussement se rapprocher du contact à mesure que vous
  montez l’énergie, puis disparaître d’un coup quand elle dépasse la barrière.
