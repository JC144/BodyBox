# BodyBox

PWA de musculation à la maison : on compose ou importe un circuit d'exercices, on enchaîne les tours en notant les répétitions de chaque série, puis on suit sa régularité et sa progression. Tout reste sur l'appareil (IndexedDB) et l'application fonctionne hors-ligne après la première visite.

La spécification complète est dans [SPECIFICATION.md](SPECIFICATION.md).

## Lancer en local

L'application n'a ni build ni dépendance : les fichiers sont servis tels quels.

```sh
npm start                          # http://localhost:8080/
node tools/serve.js 8123 /body-box/   # sert depuis un sous-répertoire : http://localhost:8123/body-box/
```

Le service worker, `crypto.randomUUID()` et le Wake Lock exigent un contexte sécurisé : `localhost` ou HTTPS.

## Tests

```sh
npm test    # équivaut à : node --test
```

Les tests portent sur les fonctions pures : validation du JSON, logique de séance, scoring, sauvegarde, ordre et renommage des circuits, éditeur de circuit.

## Déploiement

Il suffit de copier le dépôt sur un hébergement statique en HTTPS, par exemple GitHub Pages. Tous les chemins sont relatifs.

**À chaque livraison :**

1. Incrémenter `CACHE_VERSION` dans [sw.js](sw.js).
2. Incrémenter `APP_VERSION` dans [js/version.js](js/version.js).
3. Si un fichier a été ajouté, l'ajouter à la liste `PRECACHE` de [sw.js](sw.js).

`tools/` et `tests/` ne sont pas nécessaires en production. Ils ne sont pas pré-cachés.

## Créer ou modifier un circuit

Le bouton **+** de l'accueil ouvre **Réglages › Circuits**. **Créer un circuit** y ouvre l'éditeur sur un circuit vide, **Modifier** sur un circuit existant. Dans l'éditeur, le **+** des exercices ouvre le catalogue (avec recherche), puis les réglages de l'exercice choisi (objectif et consigne facultatifs) ; **Valider** l'ajoute. Glisser un exercice vers la gauche permet de le modifier ou de le retirer ; **↑** et **↓** le déplacent. Seuls les exercices du catalogue peuvent être ajoutés.

Le même onglet permet d'**importer un circuit** (fichier ou texte JSON) et, par l'icône de partage de chaque circuit, d'envoyer son JSON à une autre application.

## Circuits fournis

Le dossier [playlists/](playlists/) contient le circuit d'exemple et trois circuits complets par niveau, pré-chargés au premier lancement : [débutant](playlists/niveau-1-debutant.json), [intermédiaire](playlists/niveau-2-intermediaire.json) et [avancé](playlists/niveau-3-avance.json).

## Ajouter un exercice au catalogue

Les exercices (nom, consigne, description, muscles) sont décrits dans [js/exercises.js](js/exercises.js), indépendamment des circuits, qui n'y font référence que par identifiant.

1. Écrire la fiche d'animation `tools/motion/specs/{id}.js`, puis générer le SVG et sa planche de contrôle : `node tools/motion/build.js {id} --preview`. Le mode d'emploi est dans [tools/motion/README.md](tools/motion/README.md).
2. Ajouter l'entrée dans [js/exercises.js](js/exercises.js).
3. Ajouter le SVG à `PRECACHE` dans [sw.js](sw.js), puis incrémenter `CACHE_VERSION`.

`npm test` vérifie la cohérence du catalogue, des SVG, du pré-cache et des fiches.

## Organisation

| Chemin | Rôle |
|---|---|
| `js/app.js` | Démarrage, reprise d'une séance interrompue, mises à jour |
| `js/router.js` | Routage par fragment (`#/…`) |
| `js/db.js` | Accès IndexedDB (base `bodybox`, migrations) |
| `js/exercises.js`, `js/catalog.js` | Catalogue des exercices (données) et registre (logique) |
| `js/completion-grid.js`, `js/scoring-details.js` | Grille, indicateurs et courbe du scoring, affichés sur l'accueil |
| `js/playlist-import.js`, `js/session.js`, `js/scoring.js`, `js/backup.js`, `js/dates.js`, `js/playlist-order.js`, `js/playlist-editor.js` | Logique pure, testée avec `node --test` |
| `js/strings.js` | Tous les textes de l'interface et le formatage des dates |
| `js/screens/` | Un module par écran |
| `css/tokens.css` | Palette, niveaux de gris de la grille, typographie |
| `tools/motion/` | Générateur des illustrations animées, une fiche par exercice |

## Notes d'implémentation

- **CSP.** La politique autorise `style-src 'unsafe-inline'`. Les illustrations SVG sont insérées dans le DOM avec leur balise `<style>` d'animation, et la CSP bloquerait sinon ces styles. Les scripts restent limités à `'self'`.
- **Mention « Record ».** Elle n'apparaît que s'il existe au moins une séance antérieure sur le circuit. Sinon, chaque exercice serait marqué comme record dès la première séance.
- **Courbe de progression.** Elle place un point par jour où l'exercice choisi a au moins une série.
- **Anciens termes.** L'interface parle de circuit, de tour et de série ; le code, les routes et le stockage gardent les noms d'origine (`playlist`, `loop`, `entry`), tout comme les identifiants d'exercices (`abdominaux` pour le crunch, `abdominaux-lateraux` pour le crunch croisé). Les renommer rendrait illisibles les données et les fichiers JSON déjà existants.
