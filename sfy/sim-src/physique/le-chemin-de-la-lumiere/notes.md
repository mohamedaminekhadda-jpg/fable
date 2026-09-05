## Un jeu dont les règles sont les lois

Il n’y a rien de dessiné à la main dans ce plateau. Le faisceau part de la
source, cherche la première surface qu’il rencontre, et ce qui se passe là est
la loi — pas une animation qui lui ressemble.

| ce qu’on voit | ce que le programme calcule |
|---|---|
| le rebond sur un miroir | `d′ = d − 2(d·n)n`, donc `i = r` |
| l’entrée dans le verre | `sin i = n sin r` |
| le faisceau prisonnier du verre | rien : `sin r = (n₁/n₂) sin i` n’a plus de solution |
| l’éventail de couleurs | `n(λ) = A + B/λ²`, un indice par radiation |
| la lentille | `u′ = u − h/f`, et `f` dépend de `λ` |

Cochez **« Les angles i et r »** et tournez un miroir : les deux nombres restent
égaux, quoi que vous fassiez. Traversez le verre : ils se séparent, et toujours
du bon côté — `r < i` en entrant, `r > i` en sortant.

## La lumière est prise sur trois raies

Un spectre est continu. Ici il est échantillonné sur trois longueurs d’onde
réelles, celles qui servent depuis toujours à mesurer un verre : **C** (rouge,
656,3 nm), **e** (verte, 546,1 nm) et **g** (bleue, 435,8 nm).

Trois raies suffisent à tout ce que le jeu demande, et elles donnent les
mélanges : rouge + vert = jaune, les trois ensemble = blanc. **Deux faisceaux
qui tombent sur la même bille s’ajoutent** — c’est la synthèse additive, et
c’est le niveau « Refaire du jaune ».

Une bille exige **exactement** sa couleur. Du blanc ne satisfait pas une bille
rouge : il faut lui retirer le reste.

## Ce qui a été appris en construisant ces niveaux

Les premiers niveaux demandaient au prisme d’étaler un spectre assez large pour
viser trois billes séparées. Le vérificateur les a refusés, et il avait raison :

> sur un bras de cinquante unités, l’éventail d’un prisme de crown mesure
> **0,8 unité**.

C’est pourquoi un spectroscope a un bras long, et pourquoi ces niveaux étaient
infaisables — ce qui ne se voit pas en les regardant. On croit seulement qu’on
n’a pas trouvé.

Ce qui sépare franchement les couleurs à cette échelle, c’est **l’angle limite**,
parce qu’il dépend lui aussi de λ :

| verre | limite rouge | limite bleue | fenêtre |
|---|---|---|---|
| crown | 41,33° | 40,92° | 0,41° |
| flint | 38,26° | 37,54° | 0,73° |
| flint dense | 35,04° | 34,10° | **0,94°** |

Entre ces deux angles — moins d’un degré — **le bleu est totalement réfléchi
pendant que le rouge et le vert passent**. Le prisme devient un trieur de
couleurs, net, et c’est le niveau « Le bleu piégé ». Un cran du cadran vaut un
degré : la précision n’est pas une coquetterie, c’est le sujet.

## Le verre n’est pas un décor

Le panneau propose trois verres, et ce sont de vrais verres : les coefficients
de Cauchy viennent de l’indice à 587,6 nm et du nombre d’Abbe, le crown est du
BK7. Changer de verre change l’indice, donc la déviation, donc l’angle limite —
et le niveau « Le bon verre » n’est soluble qu’avec **un seul** des trois. Le
test le vérifie : si les autres marchaient aussi, la question ne serait pas une
question.

Décochez **« Le verre disperse »** et l’indice se fige à la raie verte. Le
prisme dévie encore, mais ne trie plus : les niveaux de couleur deviennent
insolubles. C’est le §4-3 du cours, réduit à une case à cocher — et la meilleure
démonstration que ces niveaux reposaient bien sur la dispersion.

## Le chemin optique

Le relevé **Σn·L** additionne les longueurs parcourues, chacune multipliée par
l’indice du milieu. C’est la grandeur que le principe de Fermat rend minimale, et
c’est aussi pourquoi le verre « ralentit » la lumière sans qu’aucune vitesse
n’apparaisse dans le calcul : un même trajet géométrique y coûte plus cher.

## Pour la classe

- **Une bille mal servie affiche ce qu’elle a reçu**, au centre, dans la couleur
  reçue. Une bille rouge avec un point blanc dit « tu m’as tout envoyé » — ce qui
  est une erreur différente de « tu m’as manquée », et elle se lit.
- **« Recommencer »**, dans la barre du haut, vide le plateau sans changer de
  niveau. L’horloge repart : elle compte le temps passé sur ce niveau-là.
- **Les flèches ← et →** tournent la pièce choisie d’un degré, cinq avec Maj.
  Plusieurs niveaux ne se gagnent pas autrement.
- **« Montrer une solution »** en pose une, la vraie, celle que le test joue à
  chaque `npm run test:optique`. Il y en a d’autres.

## Le bac à sable

Le second mode donne un grand plateau, tout le matériel, et les montages du
cours prêts à poser. Chaque pièce y apporte une physique que le jeu n'avait pas.

| pièce | ce qu'elle est | ce qu'elle rend possible |
|---|---|---|
| **laser** | une direction et **une** longueur d'onde, réglable de 400 à 700 nm | l'indice suit λ pour de vrai : `n(450) = 1,5254` contre `n(633) = 1,5151` dans le crown |
| **ampoule** | un point qui rayonne dans **toutes** les directions | les ombres — et sans éventail, pas d'image |
| **objet** | la flèche AB du cours : chacun de ses points rayonne dans un cône | une lentille en fait une **image**, et non un point |
| **trou** | deux volets et rien entre eux | la chambre noire |
| **écran** | il garde où la lumière tombe | l'image s'y forme sans que personne ne la dessine |
| **œil** | il s'allume dans la couleur qu'il reçoit | « qu'est-ce qu'on verrait d'ici ? » |
| **miroir courbe** | un **arc** de rayon R et d'ouverture réglables, concave ou convexe | le foyer à R/2, et l'aberration de sphéricité quand on l'ouvre |
| **lentille** | mince, de focale **signée** : convergente ou divergente | l'image réelle renversée d'une convergente, l'image virtuelle plus petite d'une divergente |

### Le miroir courbe n'est pas un miroir plan qu'on plie

Il n'y a **aucune formule de miroir** dans le code. Un arc est une portion de
cercle de centre C : on cherche l'intersection du rayon avec ce cercle, la
normale au point touché est le rayon `CP` lui-même, et on réfléchit avec la
même ligne que pour un miroir plan — `d′ = d − 2(d·n)n`. Tout le reste en
découle, et rien n'est posé à la main :

- quatre rayons parallèles à l'axe, sur un miroir de rayon 120, se recoupent à
  **59,995** du sommet. `R/2 = 60`. La formule des foyers est **retrouvée**,
  jamais appliquée.
- ouvrez le miroir et ils cessent de se recouper au même endroit : l'étalement
  atteint **2,79 unités**. C'est l'aberration de sphéricité, et c'est pourquoi
  un télescope digne du nom est parabolique.

Le dessin est fait des **mêmes** C, R et ouverture que le calcul : le trait
*est* la surface qui réfléchit. Un arc dessiné approximativement ferait mentir
les angles affichés, et l'aberration deviendrait indistinguable d'un bug de
tracé.

Le dos, qui ne réfléchit pas, tombe du côté opposé à la face utile — loin de C
pour un concave, vers C pour un convexe. Posé du mauvais côté il recouvre la
face qui travaille, et le miroir a l'air décalé de deux unités : c'est
exactement ce qu'on a vu à l'écran avant de regarder le signe.

C et F ne sont dessinés que s'ils tombent **dans** le plateau. Un convexe met C
à quatre-vingt-dix unités derrière lui, souvent dehors : l'axe est coupé au
bord, et un repère qui flotte hors du cadre ne repère plus rien. Le foyer d'un
convexe est en outre **virtuel** — pointillé, parce qu'aucun rayon n'y passe.

### Le signe de la focale n'est pas un réglage

Une lentille ne passe pas continuûment de convergente à divergente : à `f = 0`
il n'y a pas de lentille. Le signe est donc un **choix** (convergente /
divergente) et la focale une **grandeur** — pas un curseur qui traverse zéro.

`f = −30`, objet à 60 : la mesure sur les rayons donne `OA′ = −23,08` et
`γ = 0,231`. Image virtuelle, droite, plus petite — et `1/OA′ − 1/OA` tombe sur
`−0,0333 = 1/f`. Les étiquettes F et F′ se croisent d'elles-mêmes quand f
change de signe : elles sont posées en `−f` et `+f`, pas réécrites à la main.

La forme suit : biconvexe pour `f > 0`, **biconcave** pour `f < 0`. Une lentille
divergente dessinée bombée mentirait sur ce qu'elle fait, et un foyer virtuel
dessiné plein promettrait un point brillant où aucun rayon ne passe.

### La couleur, en toutes lettres

Un menu de huit entrées sur chaque émetteur : blanc, rouge, vert, bleu, **jaune
(rouge + vert)**, **cyan (vert + bleu)**, **magenta (rouge + bleu)**, ou *une
seule radiation* — et là seulement le curseur λ apparaît. Les trois secondaires
ne sont pas des couleurs de plus : ce sont deux raies qui voyagent ensemble, se
séparent dans un prisme et se font trier par un filtre. Le menu ne fait que
**nommer** ce que le moteur savait déjà faire.

### Où est passé le tiroir

Le tiroir des pièces était une bande **dans** le plateau. À deux modes et
quatorze pièces il n'y tenait plus : la bande et le bandeau mangeaient un tiers
de la hauteur, donc un tiers de la **largeur** utile — la scène est bien plus
large que haute, et tout y est mis à l'échelle ensemble. Le tiroir est passé
dans le panneau, avec une icône par pièce, et la vue est tombée de `160 × 146` à
`160 × 114` pour le jeu et de `224 × 154` à `224 × 150` pour le bac à sable : le
même plateau dans moins de vue, donc dessiné plus grand à largeur d'écran
égale.

Les icônes sont la **figure** de l'objet — le trait d'un miroir et son dos
hachuré, l'arc d'un miroir courbe avec son centre, le triangle d'un prisme, les
deux volets d'un diaphragme et le vide entre eux — jamais une lettre ni un
symbole emprunté ailleurs. Tracées en `currentColor` sur une boîte de 24, elles
suivent le thème clair comme sombre.

Trois détails qui ne se voient qu'à l'usage :

- le panneau ne montre que les réglages de la pièce choisie — une focale
  proposée sur un miroir plan promet un réglage qui n'existe pas ;
- en mode jeu, le même tiroir n'affiche que ce que le niveau autorise, avec le
  compte restant (`×2`), et se grise à zéro ;
- une pièce qui arrive cherche la première place libre en spirale, par pas de
  douze — un multiple du pas de la grille, pour que la place reste libre après
  accrochage. Posées toutes au même point, la deuxième se cache sous la
  première et on croit que le bouton n'a rien fait. |

### Ce que le bac à sable mesure

Posez un objet et une lentille : le panneau affiche **OA**, **OA′** et
**γ = A′B′/AB**. Ils sont **lus sur les rayons** — on cherche le point où les
rayons partis du sommet B se recoupent, au sens des moindres carrés. La relation

`1/OA′ − 1/OA = 1/f`

est affichée juste en face, pour être comparée. Elle ne sert jamais à produire
la mesure : si elle le faisait, il n'y aurait rien à vérifier. Au montage
proposé, la mesure donne `OA′ = 50,5` là où la relation prédit `50,455`.

Tirez l'objet plus près que le foyer et rien n'a besoin d'être ajouté : les
rayons ressortent divergents, les moindres carrés les font se croiser **en
arrière** de la lentille, `OA′` devient négatif et `γ` dépasse 1. C'est l'image
virtuelle, droite et agrandie — la loupe.

### Pourquoi il y a des « rayons de construction »

Un trou de sténopé large de 1,6 unité, vu depuis 80 unités, mesure un degré.
Dans un éventail uniforme de soixante degrés, il faut cent rayons pour qu'**un
seul** passe : c'est bien pourquoi une chambre noire est sombre, mais une image
faite d'un rayon ne s'observe pas.

Chaque point de l'objet envoie donc aussi des rayons **vers** les ouvertures —
le trou, la lentille. Ce n'est pas une ruse : c'est la construction du cours, où
l'on trace les rayons utiles et non les mille qui vont se perdre dans le mur. La
physique de chacun est inchangée. La case **« les rayons de construction »**
les retire, et le sténopé redevient l'objet sombre qu'il est.

### Les montages

- **La chambre noire** — l'image est renversée, et le test le vérifie : le haut
  de l'objet arrive en bas de l'écran. Élargissez le trou : l'image s'éclaircit
  et se brouille, ce qui est le compromis de tous les sténopés.
- **L'image d'une lentille** — l'écran est posé là où l'image se forme.
  Déplacez l'objet et il faudra le déplacer aussi ; c'est la mise au point.
- **La fibre optique** — cinq réflexions totales à 71,3° pour un angle limite de
  35,0°. Le rayon entre par le **bout** : par le côté il arriverait sur les
  parois à 33°, sous l'angle limite, et ressortirait au premier rebond. C'est
  aussi pourquoi on ne branche pas une fibre en la perçant.
- **L'ampoule et les ombres** — cent quarante rayons, deux obstacles, et des
  cônes d'ombre que personne n'a dessinés.
- **Le prisme et l'écran** — le spectre reste un liseré, et c'est la vérité :
  voir plus large demande un bras plus long.
- **Le miroir concave** — cinq lasers parallèles à l'axe, un miroir de rayon 90
  ouvert à 60 : ils se recoupent à R/2, et pas tous exactement au même point.
  L'aberration de sphéricité se lit à l'œil.
- **La loupe** — l'objet est en deçà du foyer. Le panneau donne `OA′ < 0` et
  `γ > 1` : image virtuelle, droite, agrandie. Basculez la lentille en
  divergente et l'image redevient plus petite, sans rien déplacer.
- **L'œil et le miroir** — il n'y a qu'un angle où l'œil voit la source.
