# Générateur d'illustrations animées

Chaque exercice du catalogue est décrit par une fiche `specs/{id}.js`. Le générateur en tire
`assets/exercises/{id}.svg`, conforme à la section 6.2 de la spécification : personnage en traits
de 10, tête pleine de rayon 14, `currentColor` uniquement, animation CSS sur `transform`, classes
préfixées par l'identifiant.

```sh
node tools/motion/build.js                      # toutes les fiches
node tools/motion/build.js squat --preview      # une fiche, avec planche de contrôle PNG
node tools/motion/build.js squat --preview --out dossier
```

La planche montre le SVG réellement produit, figé à 12 instants du cycle, plus la position clé
(cadre épais). Elle utilise Edge ou Chrome en mode headless (variable `BROWSER` pour en choisir un).

## Fiche

```js
import { profil } from '../rig.js';

export default {
  id: 'squat',                 // = nom du fichier = identifiant du catalogue
  title: 'Squat',              // <title> du SVG
  cycle: 2.4,                  // durée d'un cycle (s), au tempo réel
  keyTime: 0.45,               // instant de la position clé (fraction du cycle)
  skeleton: profil(),          // squelette
  ground: 214,                 // y du sol (filet de 14 à 226), ou [x1, x2, y]
  props: [],                   // décor fixe dessiné derrière le personnage
  front: [],                   // décor fixe dessiné devant
  attach: {},                  // décor lié à un segment
  poses: { haut: { … }, bas: { … } },
  timeline: [[0, 'haut'], [0.45, 'bas'], [0.55, 'bas'], [0.95, 'haut'], [1, 'haut']],
};
```

Le SVG dessine le personnage dans la **première pose de la chronologie**. La position clé est celle
où l'illustration est figée dans les listes et avec le mouvement réduit : choisir la plus parlante.

### Angles

Les angles sont **absolus**, en degrés, dans le repère de l'écran (y vers le bas) :

| Angle | Direction du segment (de son articulation vers son extrémité) |
|---|---|
| `0` | vers la droite |
| `90` | vers le bas |
| `180` ou `-180` | vers la gauche |
| `-90` (ou `270`) | vers le haut |

Un angle qui croît tourne dans le sens des aiguilles d'une montre. Entre deux poses, chaque angle est
interpolé linéairement entre les valeurs données : passer de `-90` à `270` fait un tour complet.

### Squelettes

`profil({ double, pieds, lengths })` : racine au bassin.

| Segment | Parent | Longueur | Remarque |
|---|---|---|---|
| `cuisse` | bassin | 40 | |
| `tibia` | `cuisse` | 40 | |
| `pied` | `tibia` | 14 | absent avec `pieds: false` |
| `tronc` | bassin | 60 | du bassin aux épaules |
| `tete` | `tronc` | 24 | disque plein au bout |
| `bras` | `tronc` | 32 | part des épaules |
| `avant-bras` | `bras` | 32 | main comprise |

Avec `double: true`, un second jeu `cuisse-2`, `tibia-2`, `pied-2`, `bras-2`, `avant-bras-2` figure
le côté éloigné, à 45 % d'opacité. À n'utiliser que si les deux côtés bougent différemment
(fente, mouvement alterné) ; sinon un seul membre suffit, comme dans les SVG d'origine.

`face({ pieds, lengths })` : vue de face, racine au milieu du bassin. Segments `hanche-g/-d` (8),
`cuisse-g/-d`, `tibia-g/-d`, `pied-g/-d` (avec `pieds: true`), `tronc`, `tete`, `epaule-g/-d` (16),
`bras-g/-d`, `avant-bras-g/-d`. `-g` est la gauche de l'écran. `FACE_DEBOUT` donne les angles d'une
pose debout, bras le long du corps.

Un squelette sur mesure est une liste `{ name, parent, length, kind?, opacity?, width? }`, parents
déclarés avant leurs enfants ; `kind: 'head'` dessine un disque, `kind: 'none'` rien (segment de liaison).

### Poses

```js
{
  angles: { cuisse: 90, tibia: 90, pied: 0, tronc: -90, tete: -90, bras: 90, 'avant-bras': 90 },
  pin: { point: 'pied', at: [120, 209] },   // ou root: [x, y], position du bassin
  ik: [{ chain: ['bras', 'avant-bras'], target: [150, 150], bend: 1 }],
}
```

- `pin` place le personnage de sorte que le point nommé tombe en `at`. Un point est `root`, le nom
  d'un segment (son extrémité) ou `segment@0.5` (une fraction du segment). Le point épinglé ne doit
  pas dépendre d'une chaîne IK.
- `ik` calcule les angles de deux segments consécutifs pour que l'extrémité du second atteigne
  `target` : mains ou pieds posés. `bend: 1` ou `-1` choisit le côté du coude ou du genou ; essayer
  l'autre valeur si l'articulation plie à l'envers.
- Une pose peut en étendre une autre : `{ ...haut, angles: { ...haut.angles, tronc: -60 } }`.

Un membre en appui a son extrémité à 5 unités au-dessus de la surface (demi-épaisseur du trait) :
pied sur un sol à `y = 214` → `at: [x, 209]`.

### Chronologie

`[[t, 'pose', options?], …]`, de `0` à `1`, en terminant sur la pose de départ. Deux entrées
successives de même pose forment un arrêt. `options` porte sur la transition qui suit l'entrée :
`{ ease: 'in-out' | 'in' | 'out' | 'linear', samples: n }`. Par défaut, `in-out` ; avec une IK,
3 images intermédiaires pour que les appuis ne glissent pas. `ease: 'out'` convient à une phase
explosive.

### Décor

Éléments `{ line: [x1, y1, x2, y2] }`, `{ rect: [x, y, w, h] }`, `{ circle: [cx, cy, r] }`,
`{ polyline: [x1, y1, x2, y2, …] }` ou `{ path: 'd' }`, avec `w` (épaisseur, 4 par défaut),
`fill: true` et `opacity`. Un décor reste schématique : une chaise se dessine en 4 traits.

Dans `attach`, les coordonnées sont locales au segment : `x` le long du segment depuis son
articulation, `y` perpendiculaire (vers la droite du segment).

## Vérifications

`build.js` refuse un SVG de plus de 10 Ko, une couleur écrite en dur, une classe non préfixée ou
l'absence de `data-cycle` / `data-key-time`. Il reste à regarder la planche : appuis fixes, coudes et
genoux pliés dans le bon sens, aucun membre sous le sol, boucle sans saut.
