## La mesure qui dérange

Pesez les nucléons d’un noyau séparément, puis pesez le noyau. **Il en manque.**
Passez sur « le défaut de masse de ce noyau » : les deux barres se ressemblent
tellement qu’il faut une loupe ×100 pour voir l’écart — c’est exactement la
phrase du cours, « ce défaut de masse est faible en valeur relative ».

Le grossissement est le même pour tous les noyaux, et c’est voulu : on peut donc
comparer. Le fer perd relativement **plus** que l’uranium (0,94 % contre 0,81 %),
ce qui est une autre façon de dire qu’il est mieux lié.

Pour l’hélium 4, il manque 0,030 u sur 4,032, soit **0,75 %**. Ce n’est pas une
erreur de pesée : c’est de l’énergie partie ailleurs quand le noyau s’est formé.

`Δm = Z·m_p + (A−Z)·m_n − m_noyau`   puis   `E_ℓ = Δm·c²`

Et 0,030 u valent 28,3 MeV. C’est l’énergie qu’il faudrait **fournir** pour
défaire l’hélium 4 en deux protons et deux neutrons libres.

## Rien n’est recopié

Le fichier de données ne contient **aucune énergie de liaison** : uniquement des
masses atomiques mesurées. Tout le reste — Δm, `E_ℓ`, `E_ℓ/A`, la courbe entière
— en est déduit. Vous pouvez donc vérifier :

| noyau | ce que donne le calcul | ce que dit le cours |
|---|---|---|
| hélium 4 | 28,30 MeV | 28,3 MeV |
| carbone 12 | 92,16 MeV | 92,16 MeV |
| fer 56 | 492,26 MeV | 492,3 MeV |
| uranium 235 | 7,591 MeV/nucléon | 7,59 MeV/nucléon |

## Pourquoi le signe moins

La courbe d’Aston porte **l’opposée** de `E_ℓ/A`. Ce n’est pas une coquetterie :
avec le signe moins, la courbe creuse une **vallée**, et les noyaux les plus
stables sont au fond. On voit alors la même chose que pour une bille : tout ce
qui est haut sur les bords a intérêt à descendre.

- À gauche, les noyaux légers descendent en **s’unissant** : c’est la fusion.
- À droite, les noyaux lourds descendent en **se cassant** : c’est la fission.

Les deux libèrent de l’énergie, et pour la même raison. Basculez l’axe sur
`+ E/A` : c’est la même information, en bosse au lieu de vallée — et la vallée
se raconte mieux.

## Le fond de la vallée

Le maximum de `E_ℓ/A` n’est pas écrit dans le code : il est **cherché dans la
table**. C’est le **nickel 62** avec 8,795 MeV/nucléon, talonné par le fer 56 à
8,790. On dit souvent « le fer 56 » — il est en réalité deuxième d’un cheveu, et
c’est le genre de détail qu’une table honnête rend visible.

Au-delà de ce point, ajouter des nucléons ne rend plus le noyau plus solide : la
répulsion électrique entre protons, qui agit à longue distance, finit par gagner
sur l’attraction nucléaire, qui n’agit qu’entre voisins.

## L’hélium 4 dépasse

Regardez le début de la courbe : elle monte irrégulièrement, et **l’hélium 4 fait
une pointe** bien au-dessus de ses voisins, le lithium 6 comme le lithium 7. Deux
protons et deux neutrons forment un assemblage remarquablement solide — c’est
pourquoi il est éjecté tel quel dans la radioactivité α, sous le nom de
particule α.

## Cliquer plutôt que chercher

Chaque point de la courbe est un noyau, et **un clic le sélectionne**. Les
relevés à droite suivent aussitôt. C’est plus rapide que la liste, et cela permet
de comparer deux voisins pour voir ce qui les sépare.

## À essayer

- Comparez le deutérium (1,11 MeV/nucléon) et l’hélium 4 (7,07). Quatre nucléons
  bien assemblés valent bien mieux que deux.
- Cliquez sur l’uranium 238 puis sur le strontium 94 et le xénon 139, ses
  produits de fission. Passez de 7,57 à environ 8,6 MeV/nucléon : c’est ce gain,
  multiplié par 235 nucléons, qui fait les ~180 MeV d’une fission.
- Cherchez l’hydrogène 1. Son défaut de masse est nul, et c’est normal : un seul
  nucléon n’est lié à rien.
