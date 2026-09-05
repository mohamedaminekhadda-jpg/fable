## Pourquoi un arbre, et pas une expérience

Le cours ouvre sur les difficultés de la génétique humaine : on ne dirige pas les
mariages, les enfants sont peu nombreux, les générations durent vingt-cinq ans,
et il y a 2⁴⁶ combinaisons chromosomiques possibles à chaque œuf. Aucune de ces
difficultés ne se contourne.

L’arbre généalogique est la réponse : **puisqu’on ne peut pas provoquer les
croisements, on lit ceux qui ont eu lieu**. C’est un instrument, pas une
illustration — et c’est pourquoi celui-ci se modifie entièrement.

## Ce que la simulation fait, et refuse de faire

Elle ne désigne jamais **un** mode de transmission. Elle donne la liste de ceux
qui restent possibles, et pour chaque mode écarté, **la raison** — celle du
cours, en une phrase.

Vous verrez presque toujours qu’il en reste **plusieurs**. Ce n’est pas une
faiblesse du programme : c’est la vérité d’un arbre. Prenez le rachitisme
vitamino-résistant, le cas le plus caractéristique du cours : un père atteint
transmet à toutes ses filles et à aucun de ses fils. C’est le motif du dominant
lié à X — mais l’autosomique dominant, l’autosomique récessif et le récessif lié
à X passent tous aussi, parce que la mère pourrait être porteuse.

Les maladies du cours sont tranchées par autre chose : l’énoncé qui l’annonce,
ou une statistique — « dix fois plus d’hommes que de femmes daltoniens ».
Le relevé « atteints » vous signale d’ailleurs ce déséquilibre quand il apparaît.

Croire qu’un arbre suffit serait l’erreur la plus commode, et la plus fausse.

## Les quatre exclusions à connaître

| ce qu’on observe | ce que cela écarte |
|---|---|
| deux parents sains, un enfant atteint | tout mode **dominant** |
| deux parents atteints, un enfant sain | tout mode **récessif** |
| une fille atteinte, père sain | récessif **lié à X** |
| un père atteint, une fille saine | dominant **lié à X** |
| une femme atteinte | lié à **Y** |

Les deux dernières tiennent à une seule chose : **un père donne son unique X à
toutes ses filles, et son Y à tous ses fils**. Tout le raisonnement gonosomique
sort de là.

## Deux méthodes, jamais une seule

Chaque mode est jugé deux fois : par les règles ci-dessus, qui donnent une
phrase ; et par une recherche exhaustive de toutes les répartitions de génotypes
compatibles, qui ne suppose rien. Si les deux se contredisaient, la simulation le
dirait au lieu de choisir — c’est un contrôle sur son propre raisonnement.

## Les génotypes, et les points d’interrogation

Un génotype n’est écrit sur l’arbre que s’il est **le même dans toutes** les
répartitions possibles. Sinon vous lisez « ? », et c’est la bonne réponse : dans
l’arbre de l’hémophilie, une sœur d’un garçon atteint est saine — mais nul ne
peut dire, du seul arbre, si elle est conductrice.

C’est exactement la question que se pose le couple du cours avant de consulter,
et c’est pour cela qu’on fait ensuite une analyse d’ADN.

## Le risque pour l’enfant à naître

Choisissez quelqu’un qui a un conjoint : le risque s’affiche pour leur prochain
enfant, garçon ou fille.

Quand l’arbre fixe les génotypes, on retrouve les chiffres du cours — 25 % pour
deux porteurs sains, 50 % pour un parent atteint en dominant, 50 % des garçons
pour une mère conductrice en récessif lié à X, et **0 % des filles**.

Quand il ne les fixe pas, le calcul porte sur toutes les possibilités, pondérées
par leur probabilité, et le relevé le dit franchement. La fréquence de l’allèle
dans la population entre alors en jeu — c’est le seul moment où elle compte.

## À essayer

- Chargez le daltonisme, puis rendez la mère atteinte au lieu de saine. Le
  récessif lié à X reste-t-il possible ? Et que deviennent ses fils ?
- Chargez le rachitisme et ajoutez au père atteint **une fille saine**. Le
  dominant lié à X tombe aussitôt, avec sa raison.
- Partez d’un arbre vide et essayez de construire un arbre où **un seul** mode
  survit. C’est plus difficile qu’il n’y paraît, et c’est tout le sujet.
