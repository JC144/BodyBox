# BodyBox — Spécification de la PWA de musculation

| | |
|---|---|
| Version du document | 1.2 |
| Date | 30 septembre 2026 |
| Statut | Référence pour le développement de la v1 |

## Sommaire

1. [Présentation](#1-présentation)
2. [Écrans et navigation](#2-écrans-et-navigation)
3. [Règles de la séance](#3-règles-de-la-séance)
4. [Format JSON d'un circuit](#4-format-json-dun-circuit)
5. [Données et persistance](#5-données-et-persistance)
6. [Catalogue d'exercices et motion design](#6-catalogue-dexercices-et-motion-design)
7. [Espace scoring](#7-espace-scoring)
8. [Direction artistique](#8-direction-artistique)
9. [Exigences PWA et techniques](#9-exigences-pwa-et-techniques)
10. [Exigences non fonctionnelles](#10-exigences-non-fonctionnelles)
11. [Critères d'acceptation](#11-critères-dacceptation)
12. [Jalons et évolutions](#12-jalons-et-évolutions)

---

## 1. Présentation

### 1.1 Objectif

BodyBox est une application web progressive (PWA) pour téléphone qui accompagne une séance de musculation à la maison. L'utilisateur compose ou importe un circuit d'exercices, enchaîne les tours en notant les répétitions de chaque série, puis suit sa régularité et sa progression jour après jour.

L'application fonctionne entièrement sur l'appareil : pas de compte, pas de serveur, pas de connexion requise après la première visite.

### 1.2 Périmètre de la v1

| Inclus | Exclu |
|---|---|
| Création et modification d'un circuit à partir des exercices du catalogue (depuis les Réglages) | Création d'exercices hors catalogue dans l'application |
| Réalisation d'une séance en circuit, tour après tour, avec saisie des répétitions | Minuteur de récupération, compte à rebours |
| Comptage des tours et du temps passé | Saisie de charges (kg) |
| Catalogue d'exercices décrits et illustrés par une animation | Compte utilisateur, synchronisation entre appareils |
| Espace scoring : grille de complétion, indicateurs, courbe | Partage, classement, notifications |
| Installation sur l'écran d'accueil, usage hors-ligne | Version pour ordinateur ou tablette optimisée |
| Sauvegarde et restauration des données en JSON | |
| Import d'un circuit depuis un fichier ou un texte JSON ; partage du JSON d'un circuit vers une autre application | |
| Trois circuits par niveau pré-chargés au premier lancement | |

### 1.3 Glossaire

| Terme | Définition |
|---|---|
| **Exercice** | Un mouvement du catalogue (ex. pompes), avec son nom, sa consigne, sa description, les muscles travaillés et son illustration animée. Le catalogue est livré avec l'application ; les circuits y font référence par identifiant. |
| **Circuit** | Une liste ordonnée d'exercices à enchaîner, composée dans l'éditeur ou importée depuis un JSON. |
| **Séance** | La réalisation d'un circuit, du démarrage jusqu'à ce que l'utilisateur y mette fin. |
| **Tour** | Un passage complet sur tous les exercices du circuit pendant une séance. |
| **Série** | Les répétitions enchaînées sur un exercice lors d'un tour ; l'utilisateur en déclare le nombre. |
| **Volume** | Le total des répétitions d'un exercice sur une journée. |

Dans le code, les routes et le stockage, les noms antérieurs sont conservés pour ne pas casser les données existantes : un circuit s'y appelle `playlist`, un tour `loop` et une série `entry`.

---

## 2. Écrans et navigation

### 2.1 Navigation

Le routage se fait par le fragment d'URL (`#/…`), sans rechargement de page.

| Route | Écran |
|---|---|
| `#/playlists` | Accueil : choix du circuit et grille de scoring |
| `#/import` | Import d'un circuit |
| `#/playlists/{id}` | Détail d'un circuit |
| `#/session` | Séance en cours |
| `#/sessions/{id}` | Récapitulatif d'une séance |
| `#/settings` et `#/settings/playlists` | Réglages, onglet Général ou Circuits |
| `#/editor` et `#/editor/{id}` | Éditeur : création d'un circuit, ou modification du circuit `{id}` |

Il n'y a pas de barre d'onglets. L'accueil est le point de départ : un bouton en forme d'engrenage, à gauche du titre, ouvre les **Réglages**, et un bouton **+** ouvre l'onglet **Circuits** des Réglages, d'où l'on crée, importe ou partage un circuit. Le scoring n'a pas d'écran propre : il est entièrement sur l'accueil. Les autres écrans, hors séance, n'affichent pas de grand titre : leur nom sert de lien retour vers l'accueil (**← Réglages**, **← Import**, **← nom du circuit**…). La séance en cours n'offre aucune sortie autre que **Terminer la séance**. Une route inconnue redirige vers `#/playlists`.

### 2.2 Accueil

De haut en bas :

- Le bouton **Réglages** (engrenage) à gauche du titre « BodyBox ».
- Tout à droite du titre, tant que l'application n'est pas installée, un bouton **Installer**. Sur Android et les navigateurs qui le permettent, il ouvre l'invite d'installation du navigateur ; sur iPhone et iPad, il ouvre une aide pas à pas (menu Partager, « Sur l'écran d'accueil », « Ajouter ») qui rappelle que l'application installée ne reprend pas les données du navigateur et comment les transférer par export puis restauration. Le bouton disparaît dès que l'application est installée, et n'apparaît pas quand elle est ouverte depuis l'écran d'accueil ni sur un navigateur qui ne permet pas l'installation.
- Le titre de section « Circuits », avec tout à droite un bouton **+** qui ouvre l'onglet **Circuits** des Réglages.
- La liste des circuits, dans l'ordre choisi dans les Réglages : nom, nombre d'exercices, date de la dernière séance. Un appui sur un circuit ouvre son détail : l'accueil file vers la gauche en s'effaçant, élément par élément de haut en bas, le circuit touché partant en dernier.
- La grille de scoring, tous circuits confondus (voir [7.1](#71-grille-de-complétion)). Un appui sur une case déroule le détail du jour sous la grille, avec le nom du circuit de chaque séance ; un second appui sur la même case le replie.
- Une pointe de flèche vers le bas, large, qui déplie sur place le **scoring détaillé**, sans changer d'écran ; la flèche passe vers le haut par un fondu enchaîné (la flèche sortante s'efface, puis l'autre apparaît) et un second appui replie. Le scoring détaillé comprend un sélecteur de circuit (**Tous les circuits** par défaut, puis chaque circuit dans l'ordre choisi dans les Réglages ; les circuits supprimés dont l'historique est conservé viennent en dernier, avec la mention « supprimé »), les indicateurs, les records et la courbe de progression (voir [7.2](#72-indicateurs) et [7.3](#73-courbe-de-progression)). Avec « Tous les circuits », la courbe propose les exercices de tous les circuits. L'état déplié et le circuit choisi sont conservés tant que l'application reste ouverte.
- Au premier lancement, les trois circuits par niveau sont déjà présents (voir [4.6](#46-circuits-par-niveau)).
- État vide : un message explique qu'aucun circuit n'est présent, avec deux actions : **Créer un circuit**, qui ouvre l'éditeur (voir [2.9](#29-éditeur-de-circuit)), et **Charger le circuit d'exemple** (voir [4.4](#44-exemple-complet)), qui l'enregistre puis ouvre son détail ; s'il ne peut pas être chargé, un message l'indique et rien n'est enregistré.
- Si une séance est en cours, un bandeau en haut de l'écran propose de la reprendre (voir [3.5](#35-interruption-et-reprise)).

### 2.3 Import

- S'ouvre depuis **Importer un circuit**, dans l'onglet **Circuits** des Réglages.
- Deux modes de saisie : choisir un fichier `.json` sur l'appareil, ou coller le contenu dans une zone de texte.
- Le bouton **Importer** valide le contenu selon les règles de la section [4](#4-format-json-dun-circuit).
- En cas d'erreur, toutes les erreurs détectées sont listées, chacune avec le champ concerné. Rien n'est enregistré.
- Si un circuit portant le même `id` existe déjà, l'application demande confirmation : **Remplacer** ou **Annuler**. Le remplacement conserve l'historique des séances.
- En cas de succès, l'application ouvre le détail du circuit importé.

### 2.4 Détail d'un circuit

- Affiche le nom, la description et la liste ordonnée des exercices avec, pour chacun, une vignette fixe de l'illustration, le nom et l'objectif de répétitions s'il est défini.
- À l'ouverture, les éléments arrivent de la droite les uns après les autres, de haut en bas (titre, description, record, chaque exercice, puis le bouton), avec un léger décalage entre chacun, à la façon des écrans Metro.
- Au retour par le lien du titre, c'est l'inverse : le circuit file vers la droite en s'effaçant, élément par élément de haut en bas, le titre partant en dernier, puis les éléments de l'accueil arrivent de la gauche, en cascade de haut en bas. Le retour par le bouton du navigateur fait arriver l'accueil de la même façon, sans la sortie.
- Sous chaque exercice du catalogue, un volet **Exécution**, replié par défaut, donne les muscles travaillés et la description de l'exercice (voir [6.3](#63-modèle-dun-exercice)).
- Records, affichés seulement s'il existe un historique sur ce circuit. Chaque record commence par « **RECORD** · date » (date du dernier record battu), suivi d'une valeur par ligne :
  - sous la description : le plus grand nombre de tours complets sur une séance ;
  - sous chaque exercice : le plus grand nombre de tours de l'exercice sur une séance, puis son plus grand total de répétitions sur une séance.
- Les records sont une information secondaire : petits caractères, en gris, comme les autres mentions de la liste.
- Action principale : **Démarrer**.
- Pas d'autre action : le scoring est sur l'accueil, la modification et la suppression dans les Réglages (voir [2.8](#28-réglages)).
- **Démarrer** est désactivé si une séance est déjà en cours sur un autre circuit ; un message invite à la reprendre ou à la terminer.

### 2.5 Séance en cours

Écran central de l'application, conçu pour être lu à bout de bras et manipulé d'une seule main.

De haut en bas :

| Zone | Contenu |
|---|---|
| Bandeau | Chronomètre (`mm:ss`, puis `h:mm:ss`), numéro du tour en cours, position dans le circuit (ex. `2/5`) |
| Illustration | Animation de l'exercice en cours, en boucle |
| Exercice | Nom de l'exercice, consigne courte, objectif de répétitions s'il est défini |
| Saisie | Nombre de répétitions en très grand, boutons **−** et **+**, appui sur le nombre pour ouvrir le clavier numérique |
| Actions | **Valider** (bouton principal, pleine largeur, juste sous la saisie), **Terminer la séance** (action secondaire, tout en bas de l'écran) |

Le bouton retour du téléphone n'interrompt pas la séance : il déclenche la même confirmation que **Terminer la séance**.

### 2.6 Récapitulatif de séance

Affiché à la fin d'une séance, et accessible ensuite depuis le détail d'un jour, dans la grille de l'accueil.

- Durée, nombre de tours complets, nombre total de répétitions.
- Tableau par exercice : répétitions à chaque tour et total.
- Mention « Record » sur un exercice lorsque la meilleure série de la séance dépasse toutes les séries antérieures sur ce circuit.
- Action : **Retour à l'accueil**.

### 2.7 Scoring

Affiché sur l'accueil (voir [2.2](#22-accueil)) ; ses règles sont décrites en section [7](#7-espace-scoring).

### 2.8 Réglages

Deux onglets, **Général** (par défaut) et **Circuits**. L'onglet affiché est reflété dans l'adresse. Le changement d'onglet est animé de la même façon au clic, au clavier et au glissé : l'en-tête quitté rétrécit et l'en-tête choisi grossit, la page courante s'efface du côté opposé à l'onglet choisi, puis la nouvelle page arrive de ce côté.

Sur écran tactile, un glissé horizontal du doigt passe à l'onglet voisin : vers la gauche pour l'onglet suivant, vers la droite pour le précédent, sans boucler. Tant que le doigt touche l'écran, la page courante s'efface en suivant le doigt, l'en-tête de l'onglet courant rétrécit et celui de l'onglet visé grossit. Au lâcher, le changement d'onglet se termine si le geste est assez marqué (le quart de la largeur de l'écran, ou un geste vif) ; sinon, tout revient en place. Au début du geste, le premier mouvement net décide : vertical, la page défile normalement ; horizontal, le geste change d'onglet et la page ne défile pas. À la souris, le glissé ne change pas d'onglet.

**Général**

- Thème : sombre (par défaut), clair, ou selon le système.
- **Exporter mes données** et **Restaurer une sauvegarde** (voir [5.4](#54-sauvegarde-et-restauration)).
- **Effacer toutes les données**, avec double confirmation. L'application repart alors comme au premier lancement, avec les circuits par niveau (voir [4.6](#46-circuits-par-niveau)).
- Version de l'application et état du stockage persistant.

**Circuits** : pour chaque circuit, dans l'ordre d'affichage de l'accueil :

- **↑** et **↓** le déplacent d'un rang ; l'ordre est enregistré immédiatement. Un circuit créé ou importé ensuite se place après les autres, par nom.
- **Renommer** ouvre une fenêtre avec le nom actuel. Le nouveau nom compte de 1 à 60 caractères, espaces de bord retirés ; **Enregistrer** reste désactivé tant qu'il est vide. Les séances passées conservent le nom qu'avait le circuit à leur démarrage ; une séance en cours prend le nouveau nom.
- Une icône de partage, à droite du nom, ouvre le menu de partage du système pour envoyer le JSON du circuit (format de la section [4](#4-format-json-dun-circuit), fichier `{id}.json`) à une autre application. Si le navigateur ne sait pas partager un fichier, le JSON est partagé comme texte ; s'il ne sait pas partager du tout, le fichier est téléchargé. Fermer le menu sans choisir d'application ne produit aucun message.
- **Modifier** ouvre l'éditeur sur ce circuit (voir [2.9](#29-éditeur-de-circuit)).
- **Supprimer** demande confirmation et propose de supprimer aussi l'historique des séances (décoché par défaut). Si l'historique est conservé, le circuit reste sélectionnable dans le scoring détaillé de l'accueil avec la mention « supprimé ». C'est le seul endroit où l'on peut supprimer un circuit.
- Après une action, le focus reste sur le bouton utilisé, ou sur un voisin s'il devient indisponible.
- Sous la liste (ou dans l'état vide) : **Créer un circuit**, qui ouvre l'éditeur sur un circuit vide, et **Importer un circuit**, qui ouvre l'écran d'import (voir [2.3](#23-import)).

### 2.9 Éditeur de circuit

Ouvert depuis l'onglet **Circuits** des Réglages, sans titre propre : **← Nouveau circuit** ou **← Modifier le circuit** ramène à cet onglet, après confirmation si des modifications n'ont pas été enregistrées. Il n'y a pas de bouton **Annuler**. Fermer ou recharger la page déclenche l'avertissement du navigateur.

- **Nom** (1 à 60 caractères, espaces de bord retirés) et **description** facultative (200 caractères au plus).
- Le titre de section « Exercices », avec tout à droite un bouton **+** qui ajoute un exercice (désactivé à 50 exercices).
- Liste ordonnée des exercices (1 à 50) : vignette, numéro, nom, objectif et consigne propre au circuit s'ils sont définis. **↑** et **↓** déplacent l'exercice ; le focus suit comme dans les Réglages. L'objectif et la consigne ne se modifient pas depuis la liste.
- Glisser un exercice vers la gauche découvre deux boutons : **Modifier** (crayon), qui ouvre ses réglages (étape 2 ci-dessous), et **Retirer** (corbeille, fond rouge), qui l'enlève sans confirmation ; un message le signale. Relâchée avant la moitié, la ligne se referme ; un appui sur la ligne ou ailleurs la referme aussi. Une seule ligne est ouverte à la fois. Au clavier, le focus sur l'un des deux boutons ouvre la ligne.
- L'ajout se fait dans une fenêtre plein écran, en deux étapes, chacune titrée comme un écran (**← Titre**, lien vers l'étape précédente) :
  1. **← Ajouter un exercice** : le catalogue, avec un champ de recherche qui filtre par nom, muscle ou code (sans tenir compte des accents ni des majuscules ; chaque mot doit figurer). Un appui sur un exercice passe à l'étape 2. Le lien retour ferme la fenêtre.
  2. **← nom de l'exercice** : son illustration animée, ses muscles, le volet **Exécution**, et deux champs facultatifs : **Objectif** (entier de 1 à 999 ; vide, l'objectif est libre) et **Consigne** (140 caractères au plus ; vide, la consigne du catalogue s'applique et sert d'indication dans le champ). **Valider** ajoute l'exercice en fin de circuit (ou enregistre ses réglages s'il est modifié) et ferme la fenêtre. Le lien retour revient au catalogue, recherche conservée (ou ferme la fenêtre en modification).
  
  Échap et le bouton retour du téléphone reviennent à l'étape précédente. Un même exercice peut figurer plusieurs fois. Seuls les exercices du catalogue peuvent être ajoutés ; un exercice hors catalogue d'un circuit importé est conservé avec son nom.
- **Enregistrer** vérifie la saisie et liste toutes les erreurs, en signalant les champs concernés. Le circuit enregistré respecte le format de la section [4](#4-format-json-dun-circuit).
  - Création : l'identifiant est tiré du nom (minuscules sans accents, tirets), suffixé de `-2`, `-3`… s'il est déjà pris, y compris par un circuit supprimé dont l'historique est conservé. Le circuit se place dans l'ordre de l'accueil après les autres, par nom.
  - Modification : l'identifiant ne change pas, l'historique est conservé. Les séances passées ne sont pas modifiées ; une séance en cours garde la liste d'exercices de son démarrage et prend le nouveau nom.
  - Puis retour à l'onglet **Circuits**, avec un message de confirmation.

---

## 3. Règles de la séance

### 3.1 Déroulement

1. Au démarrage, la séance enregistre l'heure de début et une copie de la liste des exercices du circuit. Une modification ultérieure du circuit n'affecte pas la séance.
2. Le premier exercice s'affiche.
3. L'utilisateur saisit le nombre de répétitions réalisées et valide.
4. L'exercice suivant s'affiche.
5. Après validation du dernier exercice, le compteur de tours augmente de 1 et la séance reprend au premier exercice.
6. La séance continue jusqu'à ce que l'utilisateur y mette fin.

### 3.2 Saisie des répétitions

| Règle | Valeur |
|---|---|
| Type | Entier |
| Minimum | 0 (exercice non réalisé ; la série est tout de même enregistrée) |
| Maximum | 999 |
| Valeur proposée au 1er tour | L'objectif `targetReps` de l'exercice, sinon la dernière série de cet exercice lors de la séance précédente sur le même circuit, sinon 0 |
| Valeur proposée aux tours suivants | La série du tour précédent pour ce même exercice |

- Les boutons **−** et **+** modifient la valeur de 1. Un appui maintenu répète l'action.
- Un champ vide ou une valeur hors limites désactive **Valider**.
- Une série validée ne peut pas être modifiée en v1.

### 3.3 Comptage des tours

- Un tour est compté lorsque tous les exercices du circuit ont été validés pour ce passage.
- Un tour entamé mais non terminé à la fin de la séance n'est pas compté. Ses séries validées sont conservées et entrent dans les totaux de répétitions.
- Un même exercice peut figurer plusieurs fois dans un circuit. Chaque occurrence est identifiée par sa position dans la liste.

### 3.4 Temps passé

- Le temps est calculé à partir d'horodatages (`Date.now()`), jamais en additionnant des ticks de minuteur. L'affichage se met à jour chaque seconde, mais la valeur reste exacte si l'application passe en arrière-plan ou si l'écran se verrouille.
- Durée d'une séance = heure de fin − heure de début − temps d'interruption (voir [3.5](#35-interruption-et-reprise)).
- Il n'y a pas de bouton pause en v1.
- Pendant la séance, l'application demande le maintien de l'écran allumé (API Screen Wake Lock). Le verrou est redemandé lorsque l'application revient au premier plan. Si l'API est absente ou refusée, la séance fonctionne normalement, sans message.

### 3.5 Interruption et reprise

L'état de la séance est enregistré à chaque validation et au démarrage. Aucune série validée n'est perdue si l'application est fermée, rechargée ou tuée par le système.

À l'ouverture de l'application, si une séance en cours existe, une fenêtre propose :

| Choix | Effet |
|---|---|
| **Reprendre** | Retour à l'exercice en attente. Le temps écoulé entre la dernière activité et la reprise est ajouté au temps d'interruption, donc exclu de la durée. |
| **Terminer et enregistrer** | La séance est close avec comme heure de fin celle de la dernière validation. |
| **Supprimer** | La séance et ses séries sont supprimées, après confirmation. |

Ce mécanisme s'applique lorsque l'application a été relancée. Un simple passage en arrière-plan suivi d'un retour ne déclenche pas la fenêtre et n'ajoute pas de temps d'interruption.

### 3.6 Fin de séance

- **Terminer la séance** demande confirmation.
- Si aucune série n'a été validée, la séance est supprimée sans être enregistrée et l'utilisateur revient au détail du circuit.
- Sinon, la séance est enregistrée et le récapitulatif s'affiche.
- La séance est rattachée au jour local de son heure de début, y compris si elle se termine après minuit.

---

## 4. Format JSON d'un circuit

Ce format sert à l'import, au partage, à la sauvegarde et aux circuits livrés avec l'application. Un fichier contient un seul circuit.

### 4.1 Champs du circuit

| Champ | Type | Obligatoire | Contraintes |
|---|---|---|---|
| `schemaVersion` | entier | oui | Vaut `1` |
| `id` | chaîne | oui | 1 à 64 caractères : minuscules, chiffres et tirets ; commence par une lettre ou un chiffre (`^[a-z0-9][a-z0-9-]{0,63}$`) |
| `name` | chaîne | oui | 1 à 60 caractères |
| `description` | chaîne | non | 200 caractères au plus |
| `exercises` | tableau | oui | 1 à 50 éléments |

### 4.2 Champs d'un exercice

| Champ | Type | Obligatoire | Contraintes |
|---|---|---|---|
| `exerciseId` | chaîne | oui | Même format que `id`. Référence un exercice du catalogue (voir [6.4](#64-liste-des-exercices)) ou désigne un exercice personnalisé |
| `name` | chaîne | si l'`exerciseId` est absent du catalogue | 1 à 60 caractères. S'il est fourni pour un exercice du catalogue, il remplace le nom affiché |
| `targetReps` | entier | non | 1 à 999. Objectif indicatif, jamais bloquant |
| `note` | chaîne | non | 140 caractères au plus. Remplace la consigne affichée pendant la séance |

Un exercice personnalisé (absent du catalogue) est affiché avec une illustration générique fixe. Un circuit ne peut pas fournir sa propre illustration.

Les champs inconnus sont ignorés sans erreur.

### 4.3 Validation

- Taille maximale du contenu : 100 Ko.
- Tout le texte d'un circuit est affiché comme du texte brut, jamais interprété comme du HTML.
- La validation relève toutes les erreurs en une passe.

| Cas | Message |
|---|---|
| Contenu non analysable | « Ce fichier n'est pas un JSON valide. » |
| Contenu trop volumineux | « Ce fichier dépasse la taille maximale de 100 Ko. » |
| La racine n'est pas un objet | « Le fichier doit contenir un seul circuit. » |
| `schemaVersion` absent ou différent de 1 | « Version de format non prise en charge. » |
| Champ obligatoire absent | « Le champ "{champ}" est obligatoire. » |
| Type ou format incorrect | « Le champ "{champ}" est invalide : {contrainte attendue}. » |
| `exercises` vide ou trop long | « Un circuit doit contenir entre 1 et 50 exercices. » |
| Exercice inconnu sans `name` | « L'exercice n°{n} ("{exerciseId}") est inconnu : ajoutez un champ "name". » |

### 4.4 Exemple complet

Ce fichier est livré avec l'application sous `playlists/exemple.json` et sert à l'action **Charger le circuit d'exemple**.

```json
{
  "schemaVersion": 1,
  "id": "routine-maison",
  "name": "Routine maison",
  "description": "Cinq exercices à enchaîner en circuit, au poids du corps, à la kettlebell et au hand gripper.",
  "exercises": [
    { "exerciseId": "pompes", "targetReps": 15 },
    { "exerciseId": "abdominaux", "targetReps": 20 },
    { "exerciseId": "abdominaux-lateraux", "targetReps": 20 },
    { "exerciseId": "kettlebell-swing", "targetReps": 15, "note": "Kettlebell de 12 kg" },
    { "exerciseId": "hand-gripper", "targetReps": 30, "note": "Par main" }
  ]
}
```

### 4.5 JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Circuit BodyBox",
  "type": "object",
  "required": ["schemaVersion", "id", "name", "exercises"],
  "properties": {
    "schemaVersion": { "const": 1 },
    "id": { "type": "string", "pattern": "^[a-z0-9][a-z0-9-]{0,63}$" },
    "name": { "type": "string", "minLength": 1, "maxLength": 60 },
    "description": { "type": "string", "maxLength": 200 },
    "exercises": {
      "type": "array",
      "minItems": 1,
      "maxItems": 50,
      "items": {
        "type": "object",
        "required": ["exerciseId"],
        "properties": {
          "exerciseId": { "type": "string", "pattern": "^[a-z0-9][a-z0-9-]{0,63}$" },
          "name": { "type": "string", "minLength": 1, "maxLength": 60 },
          "targetReps": { "type": "integer", "minimum": 1, "maximum": 999 },
          "note": { "type": "string", "maxLength": 140 }
        }
      }
    }
  }
}
```

Le schéma ne peut pas exprimer la règle « `name` obligatoire si l'exercice est absent du catalogue » : elle est vérifiée par le code. L'application embarque son propre validateur, sans bibliothèque externe.

### 4.6 Circuits par niveau

Trois circuits complets sont fournis dans `playlists/` et pré-chargés au lancement tant qu'aucun historique n'existe (ni circuit, même supprimé, ni séance). Le pré-chargement n'a lieu qu'une fois (clé `starterPlaylistsSeeded` dans `meta`) : supprimer ensuite ces circuits ne les fait pas revenir, sauf après **Effacer toutes les données**. Chacun enchaîne poussée, tirage, jambes, abdominaux et dos, avec des exercices du catalogue dont la difficulté suit les progressions du livre d'exercices.

| Fichier | Nom | Contenu |
|---|---|---|
| `niveau-1-debutant.json` | Niveau 1 · Débutant | 7 exercices : pompes sur support de 45 cm, tirage sous barre basse, squat assisté en petite flexion, extensions triceps au mur, relevé de buste, inclinaisons du buste, relevés latéraux |
| `niveau-2-intermediaire.json` | Niveau 2 · Intermédiaire | 8 exercices : pompes, tirage pieds avancés, squat sur une jambe cuisse parallèle, dips en demi-amplitude, fente latérale, extensions triceps à la table, relevé de buste avec rotation, extensions lombaires |
| `niveau-3-avance.json` | Niveau 3 · Avancé | 9 exercices : pompes pieds sur meuble, tractions à la barre fixe, squat complet sur une jambe, dips, pompes piquées, relevé de genoux suspendu, sauts verticaux, pompes sur un bras, extensions lombaires |

Les exercices de maintien (chaise contre le mur, squat écarté tenu…) n'y figurent pas : la v1 ne saisit que des répétitions. Un test vérifie que tous les fichiers de `playlists/` sont valides et n'utilisent que des exercices du catalogue.

---

## 5. Données et persistance

### 5.1 Stockage

Toutes les données sont stockées dans une base IndexedDB nommée `bodybox`. Ce nom, antérieur au renommage de l'application, est conservé pour ne pas perdre les données existantes.

| Store | Clé | Contenu | Index |
|---|---|---|---|
| `playlists` | `id` | Circuits | — |
| `sessions` | `id` | Séances terminées | `playlistId`, `day`, `[playlistId, day]` |
| `meta` | `key` | Séance en cours (`activeSession`), réglages (`settings`), date de la dernière sauvegarde (`lastBackupAt`), pré-chargement des circuits par niveau effectué (`starterPlaylistsSeeded`) | — |

`localStorage` n'est pas utilisé pour les données de l'utilisateur.

### 5.2 Structures

**Circuit enregistré** : le circuit au format de la section [4](#4-format-json-dun-circuit), complété par :

| Champ | Type | Description |
|---|---|---|
| `importedAt` | entier | Horodatage de l'import, du chargement d'un circuit livré ou de la création dans l'éditeur (ms) ; inchangé par une modification |
| `deletedAt` | entier ou `null` | Renseigné si le circuit a été supprimé en conservant son historique |

**Séance** (`sessions`, et `activeSession` dans `meta`) :

| Champ | Type | Description |
|---|---|---|
| `id` | chaîne | Identifiant unique (`crypto.randomUUID()`) |
| `playlistId` | chaîne | Circuit réalisé |
| `playlistName` | chaîne | Nom du circuit au démarrage |
| `exercises` | tableau | Copie de la liste des exercices au démarrage (`exerciseId`, `name`, `targetReps`) |
| `day` | chaîne | Jour local du début, au format `YYYY-MM-DD` |
| `startedAt` | entier | Horodatage de début (ms) |
| `endedAt` | entier ou `null` | Horodatage de fin ; `null` tant que la séance est en cours |
| `lastActivityAt` | entier | Horodatage de la dernière validation |
| `pausedMs` | entier | Temps d'interruption cumulé |
| `durationMs` | entier | `endedAt − startedAt − pausedMs`, calculé à la clôture |
| `loopsCompleted` | entier | Nombre de tours complets |
| `entries` | tableau | Séries validées |

**Série** (élément de `entries`) :

| Champ | Type | Description |
|---|---|---|
| `loopIndex` | entier | Numéro de tour, à partir de 0 |
| `position` | entier | Position de l'exercice dans le circuit, à partir de 0 |
| `exerciseId` | chaîne | Exercice concerné |
| `reps` | entier | Répétitions déclarées |
| `validatedAt` | entier | Horodatage de la validation (ms) |

**Réglages** : `theme` (`"dark"`, `"light"` ou `"system"`) ; `playlistOrder`, liste des identifiants de circuits dans l'ordre d'affichage (facultatif, les circuits absents se placent après, par nom).

### 5.3 Évolution du schéma

La version de la base IndexedDB commence à 1. Tout changement de structure passe par une migration dans `onupgradeneeded`, qui préserve les données existantes.

### 5.4 Sauvegarde et restauration

- **Exporter** produit un fichier `body-box-sauvegarde-YYYY-MM-DD.json` contenant `{ "backupVersion": 1, "exportedAt", "playlists", "sessions", "settings" }`.
- **Restaurer** valide le fichier, puis demande confirmation avant de remplacer l'ensemble des données. La séance en cours, s'il y en a une, est supprimée.
- La date de la dernière sauvegarde (export ou restauration) est conservée dans `meta` (clé `lastBackupAt`). Au lancement, hors séance en cours, si des données existent et qu'aucune sauvegarde n'a été faite depuis 14 jours (ou depuis la donnée la plus ancienne s'il n'y en a jamais eu), une fenêtre le rappelle : **Exporter maintenant** télécharge immédiatement le fichier, **Plus tard** la ferme. Le rappel revient à chaque lancement tant qu'aucune sauvegarde n'est faite.
- Au premier démarrage d'une séance, l'application demande le stockage persistant (`navigator.storage.persist()`). Un refus n'empêche rien.

---

## 6. Catalogue d'exercices et motion design

### 6.1 Principes

Chaque exercice est illustré par une animation courte, jouée en boucle, qui montre le mouvement de façon immédiatement lisible sur un petit écran. Le style est celui d'un pictogramme animé : un personnage fait de traits épais et d'aplats, sans visage ni détail.

| Principe | Règle |
|---|---|
| Lisibilité | Un seul personnage, vu de profil sauf mention contraire, sur un sol figuré par un filet |
| Monochrome | Une seule couleur, héritée du thème (voir [8](#8-direction-artistique)) |
| Boucle | La dernière image rejoint la première sans à-coup |
| Rythme | Le cycle reproduit le tempo réel de l'exercice, avec un court temps d'arrêt aux positions extrêmes |
| Accélérations | Courbes d'accélération douces (`ease-in-out`) ; pas de mouvement linéaire |

### 6.2 Contraintes techniques

| Sujet | Règle |
|---|---|
| Format | Un fichier SVG par exercice : `assets/exercises/{id}.svg` |
| Cadre | `viewBox="0 0 240 240"`, sans `width` ni `height` fixes |
| Tracé | Membres en traits de 10 unités à extrémités arrondies ; tête en cercle plein de rayon 14 ; sol en filet de 2 unités |
| Couleur | `stroke` et `fill` en `currentColor` uniquement ; aucune couleur écrite en dur |
| Animation | CSS `@keyframes` dans une balise `<style>` du SVG, portant uniquement sur `transform` et `opacity` |
| Articulations | Chaque segment mobile est un groupe `<g>` dont `transform-origin` est placé sur l'articulation, avec `transform-box: view-box` |
| Nommage | Classes et noms de keyframes préfixés par l'identifiant de l'exercice (ex. `pompes-bras`), pour éviter les collisions une fois le SVG intégré à la page |
| Interdits | JavaScript, image bitmap, police, ressource externe |
| Poids | 10 Ko au plus par fichier |
| Accessibilité | `role="img"` et un `<title>` portant le nom de l'exercice |
| Temps | Attributs `data-cycle` (durée d'un cycle, en secondes) et `data-key-time` (instant de la position clé, en fraction du cycle) sur la racine `<svg>` |

**Intégration dans la page.** Le SVG est chargé par `fetch` puis inséré dans le DOM, et non affiché par une balise `<img>` : c'est la condition pour qu'il hérite de `currentColor` et des réglages de mouvement. Seuls les fichiers livrés avec l'application sont insérés de cette manière.

**Mouvement réduit.** Si `prefers-reduced-motion: reduce` est actif, l'animation est arrêtée sur la position clé la plus parlante de l'exercice, donnée par `data-key-time`.

**Vignettes.** Les listes affichent le même SVG, animation arrêtée sur la position clé.

**Illustration générique.** Le fichier `assets/exercises/generique.svg` (personnage debout, fixe) sert aux exercices personnalisés.

### 6.3 Modèle d'un exercice

Les exercices et les circuits sont décrits séparément :

- le **catalogue** (`js/exercises.js`) décrit chaque exercice une fois pour toutes : ce qu'il est et comment l'exécuter ;
- un **circuit** (voir [4](#4-format-json-dun-circuit)) ne fait que choisir des exercices du catalogue par leur identifiant, les ordonner et leur fixer un objectif. Il peut aussi déclarer un exercice personnalisé, absent du catalogue, par un simple nom.

| Champ | Obligatoire | Rôle |
|---|---|---|
| `id` | oui | Identifiant référencé par les circuits et l'historique des séances ; même format que l'`id` d'un circuit. Il ne change jamais. |
| `code` | non | Repère de l'exercice dans le livre d'exercices dont est tiré le catalogue (ex. `A1`) |
| `name` | oui | Nom affiché, 60 caractères au plus |
| `instruction` | oui | Consigne courte affichée pendant la séance, 80 caractères au plus |
| `description` | oui | Exécution détaillée (installation, mouvement, respiration, vigilance, progression), 500 caractères au plus ; affichée dans le détail d'un circuit |
| `muscles` | oui | Muscles travaillés, séparés par des virgules |

L'illustration d'un exercice est `assets/exercises/{id}.svg` ; sa durée de cycle et sa position clé sont portées par le SVG (voir [6.2](#62-contraintes-techniques)).

Dans un circuit, `name` remplace le nom affiché et `note` remplace la consigne ; la description et les muscles viennent toujours du catalogue.

### 6.4 Liste des exercices

Le catalogue compte 92 exercices. Le code renvoie au livre d'exercices dont ils sont tirés ; les exercices sans code n'y figurent pas : ce sont ceux d'origine et les exercices à la kettlebell.

| Code | Identifiant | Nom | Muscles |
|---|---|---|---|
| A | `pompes` | Pompes | Pectoraux, triceps, épaules |
| A1 | `pompes-chaises` | Pompes entre chaises | Pectoraux, triceps, épaules |
| A2 | `pompes-chaises-pieds-meuble` | Pompes entre chaises, pieds sur meuble | Pectoraux, épaules, triceps |
| A3 | `pompes-mains-support-45cm` | Pompes mains sur support de 45 cm | Milieu de la poitrine, triceps |
| A4 | `pompes-mains-support-35cm` | Pompes mains sur support de 35 cm | Milieu de la poitrine, triceps |
| A5 | `pompes-mains-support-25cm` | Pompes mains sur support de 25 cm | Milieu de la poitrine, triceps |
| A6 | `pompes-mains-pieds-sureleves` | Pompes mains et pieds surélevés | Milieu de la poitrine, triceps |
| A7 | `pompes-chaises-ecart-epaules` | Pompes entre chaises, écart des épaules | Pectoraux, triceps, épaules |
| A8 | `pompes-chaises-pieds-au-sol` | Pompes entre chaises, pieds au sol | Pectoraux (partie basse) |
| A9 | `pompes-serrees-pieds-chaise` | Pompes serrées, pieds sur chaise | Triceps, pectoraux (partie centrale), épaules |
| A10 | `pompes-circulaires-chaises` | Pompes circulaires entre chaises | Épaules, pectoraux, triceps |
| A11 | `pompes-circulaires-inversees-chaises` | Pompes circulaires inversées | Épaules, pectoraux, triceps |
| A12 | `pompes-pieds-meuble-mains-serrees` | Pompes pieds sur meuble, mains serrées | Pectoraux (partie centrale), triceps, épaules |
| B | `dips-chaises` | Dips entre deux chaises | Pectoraux (partie latérale haute), épaules, triceps |
| B1 | `dips-chaises-demi-amplitude` | Dips, demi-amplitude | Pectoraux (partie latérale haute), épaules, triceps |
| B2 | `dips-chaises-mi-amplitude` | Dips, mi-amplitude rapide | Pectoraux, épaules |
| C | `tractions-supination` | Tractions en supination | Milieu du dos, biceps |
| C1 | `tractions-supination-moitie-haute` | Tractions, moitié haute | Milieu du dos, biceps |
| C2 | `tractions-supination-mi-amplitude` | Tractions, mi-amplitude rapide | Milieu du dos, biceps |
| C3 | `tractions-supination-deux-tiers` | Tractions, deux tiers d’amplitude | Milieu du dos, biceps |
| C4 | `tractions-horizontales-jambes-repliees` | Tractions horizontales, jambes repliées | Épaisseur du dos, biceps |
| C5 | `tractions-horizontales-pieds-avances` | Tractions horizontales, pieds avancés | Épaisseur du dos, biceps |
| C6 | `tractions-horizontales-pieds-sureleves` | Tractions horizontales, supination, pieds hauts | Épaisseur du dos, biceps |
| C7 | `tractions-horizontales-pronation` | Tractions horizontales, pronation, genoux pliés | Épaisseur du haut du dos |
| C8 | `tractions-horizontales-pronation-pieds-avances` | Tractions horizontales, pronation, pieds devant | Épaisseur du haut du dos |
| C9 | `tractions-horizontales-pronation-pieds-sureleves` | Tractions horizontales, pronation, pieds hauts | Épaisseur du haut du dos |
| D | `dips-dos-chaise-pieds-sureleves` | Dips dos à la chaise, pieds surélevés | Triceps |
| E | `squat-une-jambe-assiste-petite-flexion` | Squat une jambe, petite flexion | Cuisses, fessiers |
| E1 | `squat-une-jambe-assiste-cuisse-parallele` | Squat une jambe, cuisse parallèle | Cuisses, fessiers |
| E2 | `squat-une-jambe-assiste-flexion-complete` | Squat une jambe, flexion complète | Cuisses, fessiers |
| E3 | `squat-une-jambe-assiste-rebonds` | Squat une jambe en rebonds | Cuisses, fessiers |
| E4 | `fente-laterale-alternee` | Fente latérale alternée | Cuisses, fessiers |
| E5 | `fente-laterale-un-cote` | Fente latérale, un côté par série | Cuisses, fessiers |
| E6 | `squat-complet-pieds-serres` | Squat complet pieds serrés | Cuisses, fessiers |
| E7 | `squat-une-jambe-dos-au-mur` | Squat sur une jambe dos au mur | Cuisses, fessiers |
| F | `sauts-verticaux-flexion` | Sauts verticaux avec flexion | Cuisses, mollets |
| F1 | `chaise-contre-mur` | Chaise contre le mur | Cuisses, mollets |
| F2 | `squat-ecarte-maintien` | Squat écarté tenu | Cuisses, mollets |
| F3 | `chaise-contre-mur-une-jambe` | Chaise contre le mur sur une jambe | Cuisses, mollets |
| G | `crunch-jambes-relevees` | Crunch jambes relevées | Abdominaux partie haute |
| H | `releve-genoux-suspendu` | Relevé de genoux suspendu | Abdominaux partie basse |
| I | `tractions-nuque-petite-amplitude` | Tractions nuque, petite amplitude | Largeur du dos |
| I1 | `tractions-nuque-mi-amplitude` | Tractions nuque, demi-amplitude | Largeur du dos |
| I2 | `tractions-nuque-amplitude-complete` | Tractions nuque, amplitude complète | Largeur du dos |
| I3 | `tractions-pronation-prise-epaules` | Tractions pronation, prise épaules | Dos, bras |
| I4 | `tractions-prise-large-menton` | Tractions prise large, menton | Largeur du dos |
| I5 | `tractions-prise-neutre-serree` | Tractions prise neutre serrée | Dos, bras |
| I6 | `tractions-horizontales-prise-neutre` | Tractions horizontales, prise neutre | Épaisseur du dos |
| I7 | `tractions-nuque-deux-tiers` | Tractions nuque, deux tiers d’amplitude | Largeur du dos |
| I8 | `tractions-horizontales-prise-large` | Tractions horizontales, prise large | Épaisseur du haut du dos |
| J | `pompes-piquees-chaises` | Pompes piquées pieds surélevés | Épaules, partie supérieure des pectoraux |
| J1 | `pompes-piquees-chaises-mains-serrees` | Pompes piquées mains rapprochées | Épaules, partie supérieure des pectoraux |
| J2 | `pompes-piquees-chaises-poings` | Pompes piquées sur les poings | Épaules, partie supérieure des pectoraux |
| J3 | `pompes-piquees-chaises-poings-serres` | Pompes piquées poings rapprochés | Épaules, partie supérieure des pectoraux |
| K | `extensions-triceps-avant-bras-sol` | Extensions triceps sur les avant-bras | Triceps |
| K1 | `extensions-triceps-table` | Extensions triceps à la table | Triceps |
| K2 | `extensions-triceps-mur-chaise` | Extensions triceps mur puis chaise | Triceps |
| K3 | `extensions-triceps-barre-chaises` | Extensions triceps barre entre chaises | Triceps |
| L | `pompes-rotation-alternee` | Pompes avec rotation alternée | Pectoraux, épaules, triceps |
| M | `extensions-lombaires-support` | Extensions lombaires sur support | Bas du dos |
| M1 | `inclinaisons-buste-bras-tendus` | Inclinaisons du buste bras tendus | Bas du dos |
| N | `flexions-laterales-support` | Flexions latérales sur support | Obliques |
| N1 | `releves-lateraux-sol` | Relevés latéraux au sol | Obliques |
| O | `releve-buste-rotation` | Relevé de buste avec rotation | Abdominaux, obliques |
| P | `releve-buste` | Relevé de buste | Abdominaux |
| Q | `pompes-un-bras-chaise` | Pompes sur un bras sur une chaise | Épaules, triceps, pectoraux (partie latérale haute) |
| Q1 | `pompes-un-bras-support-bas` | Pompes sur un bras, support de 25 cm | Épaules, triceps, pectoraux (partie latérale haute) |
| Q2 | `pompes-un-bras-sol` | Pompes sur un bras au sol | Épaules, triceps, pectoraux (partie latérale haute) |
| R | `haussements-epaules-appui` | Haussements d’épaules en appui | Trapèzes, cou |
| S | `flexion-cou-allonge-banc` | Flexion du cou, allongé sur un banc | Cou |
| T | `rotations-buste-assis-sol-baton` | Rotations du buste assis au sol, bâton | Obliques, abdominaux |
| U | `charrue-enroulement-dos` | Charrue (enroulement du dos) | Abdominaux, souplesse de la colonne vertébrale |
| V | `essuie-glace-jambes` | Essuie-glace, jambes presque tendues | Muscles de la taille, souplesse de la colonne vertébrale |
| W | `mollet-une-jambe-sur-cale` | Mollet sur une jambe, sur une cale | Mollets |
| X | `rotations-buste-tabouret-baton` | Rotations du buste sur tabouret, bâton | Muscles de la taille, souplesse de la colonne vertébrale |
| Y | `rotation-tete-allonge-cote` | Rotation de la tête, allongé sur le côté | Cou |
| Z | `pont-arriere-roue` | Pont arrière (roue) | Souplesse de la colonne vertébrale |
| — | `abdominaux` | Crunch | Grand droit de l’abdomen |
| — | `abdominaux-lateraux` | Crunch croisé | Obliques, grand droit de l’abdomen |
| — | `kettlebell-swing` | Kettlebell swing | Fessiers, ischio-jambiers, lombaires, sangle abdominale |
| — | `kettlebell-goblet-squat` | Goblet squat | Quadriceps, fessiers, adducteurs, sangle abdominale |
| — | `kettlebell-clean-press` | Clean & press | Épaules, triceps, fessiers, ischio-jambiers, sangle abdominale |
| — | `kettlebell-rowing` | Rowing penché à un bras | Grand dorsal, milieu du dos, biceps, arrière des épaules |
| — | `kettlebell-fente-arriere` | Fente arrière goblet | Quadriceps, fessiers, ischio-jambiers |
| — | `kettlebell-sumo-high-pull` | Sumo deadlift high pull | Fessiers, ischio-jambiers, trapèzes, épaules |
| — | `kettlebell-thruster` | Thruster goblet | Quadriceps, fessiers, épaules, triceps |
| — | `kettlebell-crunch-bras-tendus` | Crunch kettlebell bras tendus | Grand droit de l’abdomen, obliques |
| — | `kettlebell-souleve-de-terre` | Soulevé de terre | Fessiers, ischio-jambiers, lombaires, avant-bras |
| — | `kettlebell-pont-fessier` | Pont fessier | Fessiers, ischio-jambiers, lombaires |
| — | `kettlebell-floor-press` | Développé au sol | Pectoraux, triceps, avant des épaules |
| — | `kettlebell-developpe-militaire` | Développé militaire | Épaules, triceps, haut du dos, sangle abdominale |
| — | `hand-gripper` | Hand gripper | Fléchisseurs des doigts, avant-bras |

### 6.5 Fiches d'animation

Les illustrations du catalogue, hors exercices d'origine (voir [6.6](#66-fiches-des-exercices-dorigine)), sont produites par le générateur de `tools/motion/` à partir d'une fiche par exercice, `tools/motion/specs/{id}.js`. La fiche décrit le squelette (de profil ou de face), les poses clés par les angles des segments, les appuis fixes (mains ou pieds posés), le décor et la chronologie ; le générateur en tire un SVG conforme à la section [6.2](#62-contraintes-techniques) et une planche de contrôle. La fiche est la source de l'animation : on corrige la fiche, jamais le SVG produit. Le mode d'emploi est dans `tools/motion/README.md`.

Les règles de la section [6.1](#61-principes) s'appliquent : un cycle au tempo réel, un arrêt aux positions extrêmes, des courbes douces, une boucle sans saut. Le côté éloigné d'un membre, quand il doit apparaître, est dessiné à 45 % d'opacité.

### 6.6 Fiches des exercices d'origine

Ces cinq exercices, livrés avec la première version, ont été dessinés à la main. Leurs fiches restent la référence de leur animation.

#### Pompes — `pompes`

| | |
|---|---|
| Consigne | « Corps gainé, poitrine près du sol. » |
| Muscles | Pectoraux, triceps, deltoïdes antérieurs |
| Vue | Profil, tête à droite |
| Durée du cycle | 2,4 s |
| Position clé | Position haute, bras tendus |

| Temps | Mouvement |
|---|---|
| 0 → 45 % | Descente : les coudes fléchissent vers l'arrière, le corps s'abaisse en restant rectiligne |
| 45 → 55 % | Arrêt en position basse, poitrine au ras du sol |
| 55 → 95 % | Remontée jusqu'à l'extension des bras |
| 95 → 100 % | Arrêt en position haute |

Éléments animés : le bloc tête-tronc-jambes pivote autour des pointes de pieds ; le bras et l'avant-bras pivotent autour de l'épaule et du coude ; les mains restent fixes au sol.

#### Crunch — `abdominaux`

| | |
|---|---|
| Consigne | « Enroulez le buste, bas du dos au sol. » |
| Muscles | Grand droit de l'abdomen |
| Vue | Profil, allongé sur le dos, genoux fléchis, pieds à plat |
| Durée du cycle | 2,2 s |
| Position clé | Buste relevé |

| Temps | Mouvement |
|---|---|
| 0 → 40 % | Montée : le buste et la tête se relèvent d'environ 35° |
| 40 → 50 % | Arrêt en position haute |
| 50 → 95 % | Retour contrôlé au sol |
| 95 → 100 % | Arrêt en position basse |

Éléments animés : le bloc tête-buste-bras pivote autour du bassin ; les mains restent aux tempes ; les jambes sont fixes.

#### Crunch croisé — `abdominaux-lateraux`

| | |
|---|---|
| Consigne | « Coude vers le genou opposé, en alternant. » |
| Muscles | Obliques, grand droit de l'abdomen |
| Vue | Trois quarts, allongé sur le dos, genoux relevés |
| Durée du cycle | 3,2 s (un cycle = un côté puis l'autre) |
| Position clé | Coude droit au contact du genou gauche |

| Temps | Mouvement |
|---|---|
| 0 → 20 % | Le buste se relève en rotation ; le coude droit va vers le genou gauche, qui se rapproche |
| 20 → 28 % | Arrêt au contact |
| 28 → 50 % | Retour à la position de départ |
| 50 → 70 % | Même mouvement de l'autre côté : coude gauche vers genou droit |
| 70 → 78 % | Arrêt au contact |
| 78 → 100 % | Retour à la position de départ |

Éléments animés : le buste pivote autour du bassin ; les deux bras et les deux jambes sont animés séparément. Le membre placé à l'arrière-plan est dessiné avec une opacité de 45 %, pour distinguer les deux côtés sans recourir à une couleur.

#### Kettlebell swing — `kettlebell-swing`

| | |
|---|---|
| Consigne | « Extension explosive des hanches, dos gainé. » |
| Muscles | Fessiers, ischio-jambiers, lombaires, sangle abdominale |
| Vue | Profil, debout, pieds écartés |
| Durée du cycle | 1,8 s |
| Position clé | Position haute, kettlebell à hauteur d'épaules |

| Temps | Mouvement |
|---|---|
| 0 → 40 % | Descente : le buste s'incline à 45°, les hanches reculent, les genoux fléchissent légèrement, la kettlebell passe entre les jambes |
| 40 → 45 % | Arrêt bref en position basse |
| 45 → 80 % | Extension explosive des hanches ; le buste se redresse ; les bras tendus montent à l'horizontale |
| 80 → 100 % | Flottement en position haute, puis amorce de la descente |

Éléments animés : le buste pivote autour des hanches ; les cuisses et les tibias pivotent autour des hanches et des genoux ; les bras tendus pivotent autour des épaules et entraînent la kettlebell. La remontée est plus rapide que la descente.

#### Hand gripper — `hand-gripper`

| | |
|---|---|
| Consigne | « Serrez à fond, relâchez lentement. » |
| Muscles | Fléchisseurs des doigts, avant-bras |
| Vue | Gros plan sur une main tenant la pince, avant-bras entrant par le bas du cadre |
| Durée du cycle | 1,6 s |
| Position clé | Pince fermée |

| Temps | Mouvement |
|---|---|
| 0 → 35 % | Fermeture : les doigts se replient, les deux poignées se rejoignent |
| 35 → 50 % | Arrêt, pince fermée |
| 50 → 95 % | Ouverture lente |
| 95 → 100 % | Arrêt, pince ouverte |

Éléments animés : les deux poignées pivotent autour du ressort, de 30° d'écart à 5° ; les quatre doigts, dessinés en un seul bloc, accompagnent la poignée mobile ; le pouce et la paume restent fixes.

### 6.7 Ajouter un exercice

Les données du catalogue sont dans `js/exercises.js`, la logique (chemin des illustrations, résolution d'un exercice de circuit) dans `js/catalog.js`. Ajouter un exercice consiste à :

1. écrire sa fiche `tools/motion/specs/{id}.js` et générer son SVG (`node tools/motion/build.js {id} --preview`) ;
2. ajouter son entrée dans `js/exercises.js` ;
3. ajouter le SVG à la liste de pré-cache du service worker et changer la version du cache.

Un test (`tests/catalog.test.js`) vérifie la cohérence de l'ensemble : identifiants uniques, champs renseignés, illustrations conformes et pré-cachées, fiches rattachées à un exercice.

---

## 7. Espace scoring

Le scoring est affiché sur l'accueil, sans écran dédié (voir [2.2](#22-accueil)) :

- la grille de complétion porte sur tous les circuits confondus ;
- le scoring détaillé, dépliable sous la grille, porte sur tous les circuits (par défaut) ou sur un seul, choisi par un sélecteur.

### 7.1 Grille de complétion

Grille inspirée du graphique de contributions de GitHub : une case par jour.

| Sujet | Règle |
|---|---|
| Disposition | Une colonne par semaine, 7 lignes, lundi en haut |
| Période | Les 53 dernières semaines, la semaine en cours étant la dernière colonne |
| Défilement | Horizontal ; à l'ouverture, la grille est calée sur la semaine en cours |
| Repères | Initiales des mois au-dessus des colonnes ; `L`, `M`, `V` à gauche des lignes 1, 3 et 5 |
| Jours futurs | Cases non dessinées |
| Jour courant | Case entourée d'un filet |
| Taille | Cases carrées de 14 px, espacées de 3 px |

**Intensité.** Chaque case prend l'un des 5 niveaux selon le nombre de tours complets réalisés ce jour-là, tous circuits et toutes séances confondus.

| Niveau | Condition |
|---|---|
| 0 | Aucune séance |
| 1 | Au moins une séance, moins de 2 tours complets |
| 2 | 2 tours |
| 3 | 3 ou 4 tours |
| 4 | 5 tours ou plus |

Les seuils sont regroupés dans une constante unique du module de scoring. Une légende « Moins ▢▢▢▢▢ Plus » figure sous la grille. Le rendu des niveaux est défini en [8.5](#85-grille-de-scoring).

**Détail d'un jour.** Le détail est replié à l'ouverture. Un appui sur une case le déroule sous la grille : la date et, pour chaque séance du jour : nom du circuit, heure de début, durée, tours et répétitions totales, avec un lien vers le récapitulatif. Un second appui sur la même case le replie. Un jour sans séance affiche « Aucune séance ».

### 7.2 Indicateurs

| Indicateur | Calcul |
|---|---|
| Jours consécutifs | Nombre de jours consécutifs avec au moins une séance, en remontant depuis aujourd'hui ; si aujourd'hui est sans séance, depuis hier |
| Record de jours consécutifs | Plus longue suite de jours consécutifs avec séance |
| Séances | Nombre total de séances |
| Tours | Nombre total de tours complets |
| Temps cumulé | Somme des durées |
| Records | Pour chaque exercice, la meilleure série et sa date |

### 7.3 Courbe de progression

- Un sélecteur choisit l'exercice, parmi ceux du circuit.
- Un second sélecteur choisit la mesure : **Volume du jour** (somme des répétitions de la journée, par défaut) ou **Meilleure série** (meilleure série de la journée).
- Abscisse : les jours avec séance, sur les 30, 90 ou 365 derniers jours. Ordonnée : répétitions, à partir de 0.
- Un point par jour avec séance, reliés par une ligne. Un appui sur un point affiche la date et la valeur.
- La courbe est dessinée en SVG par l'application, sans bibliothèque de graphiques.

### 7.4 États particuliers

| Cas | Affichage |
|---|---|
| Aucun circuit | L'accueil affiche son état vide, sans grille (voir [2.2](#22-accueil)) |
| Aucune séance (sur la sélection) | Grille vide, indicateurs à 0, message d'invitation à la place de la courbe |
| Un seul jour de séance | La courbe affiche un point isolé |

### 7.5 Accessibilité

L'intensité n'est jamais transmise par la seule teinte : chaque case porte un libellé lisible par un lecteur d'écran (ex. « Mardi 15 septembre 2026 : 3 tours, 2 séances ») et son détail est accessible par un appui.

---

## 8. Direction artistique

### 8.1 Parti pris

L'application est **en noir et blanc**. Son identité repose sur deux ressorts : le **contraste** maximal entre le fond et le contenu, et les **écarts de taille typographique** entre la donnée principale et ce qui l'entoure. Aucune couleur décorative, aucune ombre, aucun dégradé, aucune icône illustrative. Les zones se séparent par des aplats, des filets et du vide.

### 8.2 Palette

Les couleurs sont définies par des variables CSS sur `:root`. Le thème sombre est le thème par défaut ; le thème clair en est l'inversion stricte.

| Variable | Rôle | Sombre | Clair |
|---|---|---|---|
| `--bg` | Fond | `#000000` | `#FFFFFF` |
| `--fg` | Texte et tracés principaux | `#FFFFFF` | `#000000` |
| `--fg-muted` | Libellés secondaires | `#A6A6A6` | `#555555` |
| `--line` | Filets, contours | `#333333` | `#D0D0D0` |
| `--surface` | Aplats secondaires | `#141414` | `#F2F2F2` |
| `--alert` | Erreurs et actions destructrices uniquement | `#FF3B30` | `#C4140A` |

`--alert` est la seule couleur de l'application. Elle ne sert jamais à décorer ni à signaler un succès.

Contraste minimal du texte sur son fond : 7:1 (niveau AAA) pour `--fg` et `--fg-muted`, dans les deux thèmes.

### 8.3 Typographie

Une seule famille : la police système (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`). Aucune police n'est téléchargée.

| Variable | Taille | Graisse | Usage |
|---|---|---|---|
| `--fs-giant` | `clamp(6rem, 34vw, 11rem)` | 900 | Nombre de répétitions en cours de saisie |
| `--fs-xl` | `3rem` | 900 | Chronomètre, chiffres du récapitulatif et des indicateurs |
| `--fs-l` | `1.75rem` | 800 | Nom de l'exercice, titres d'écran |
| `--fs-m` | `1.0625rem` | 400 | Texte courant, consignes |
| `--fs-s` | `0.75rem` | 600 | Libellés, en capitales, interlettrage `0.08em` |

- Le rapport entre un chiffre clé et son libellé est d'au moins 4 pour 1 : un très grand nombre, un très petit libellé en capitales.
- Seules deux familles de graisses coexistent sur un écran : très gras (800–900) et normal (400–600).
- Les chiffres sont à chasse fixe (`font-variant-numeric: tabular-nums`) pour que le chronomètre ne tremble pas.
- Les grands chiffres ont un interlignage serré (`line-height: 0.9`) et un interlettrage légèrement négatif.

### 8.4 Composants

| Composant | Règle |
|---|---|
| Bouton principal | Aplat `--fg`, texte `--bg`, pleine largeur, hauteur 64 px, angles droits, libellé en capitales |
| Bouton secondaire | Fond transparent, filet `--fg` de 2 px, texte `--fg` |
| Action destructrice | Texte `--alert`, sans aplat |
| État pressé | Inversion du fond et du texte |
| État désactivé | Texte et filet en `--line` |
| Focus clavier | Filet `--fg` de 3 px, décalé de 3 px |
| Listes | Lignes séparées par un filet `--line` ; pas de cartes |
| Onglets | En-têtes de pivot façon Metro : libellés en texte, en capitales, alignés à gauche sur leur ligne de base, sans cadre ni fond ; onglet actif en `--fg`, taille `--fs-l`, gras ; onglets inactifs en `--fg-muted`, taille `--fs-m`, maigre |
| Boutons icônes | Icônes au trait en `--fg`, zone d'appui de 48 px : engrenage (Réglages) à gauche du titre de l'accueil, **+** (Ajouter un circuit) au bout de la ligne « Circuits », flèche sortant d'une boîte (Partager) sur chaque ligne de **Réglages › Circuits** ; chacun porte un libellé accessible |
| Flèche de dépliage | Pointe de flèche au trait, étirée sur 80 % de la largeur, sans cadre ; vers le haut une fois dépliée, le changement de sens se faisant par fondu enchaîné |
| Fenêtres de confirmation | Aplat `--bg` plein écran ou ancré en bas, encadré d'un filet `--fg` |

Les transitions d'interface sont brèves (150 ms au plus) et supprimées si `prefers-reduced-motion` est actif. Seules exceptions : les arrivées en cascade du détail d'un circuit et de l'accueil au retour (voir [2.4](#24-détail-dun-circuit)), 350 ms par élément avec une décélération très marquée, décalées de 45 ms ; elles sont elles aussi supprimées en mouvement réduit.

### 8.5 Grille de scoring

Les 5 niveaux sont des niveaux de gris, du fond vers le contraste maximal.

| Niveau | Sombre | Clair |
|---|---|---|
| 0 | `#1A1A1A` | `#EBEBEB` |
| 1 | `#4D4D4D` | `#B3B3B3` |
| 2 | `#808080` | `#808080` |
| 3 | `#BFBFBF` | `#404040` |
| 4 | `#FFFFFF` | `#000000` |

### 8.6 Illustrations

Les animations d'exercice sont dessinées en `--fg` sur `--bg`, sans cadre ni fond propre. Elles occupent toute la largeur disponible et au moins 35 % de la hauteur de l'écran de séance.

---

## 9. Exigences PWA et techniques

### 9.1 Socle technique

| Sujet | Choix |
|---|---|
| Langages | HTML, CSS, JavaScript (modules ES) |
| Outillage | Aucune étape de build, aucun framework, aucune dépendance à l'exécution |
| Chargement | Les fichiers sources sont servis tels quels |
| Hébergement | Statique, en HTTPS (par exemple GitHub Pages) |
| Chemins | Tous relatifs, pour que l'application fonctionne depuis un sous-répertoire |

### 9.2 Arborescence

```
index.html
manifest.webmanifest
sw.js
css/
  tokens.css        variables : couleurs, typographie, espacements
  base.css          styles communs et composants
  screens.css       styles propres aux écrans
js/
  app.js            démarrage, enregistrement du service worker
  router.js         routage par fragment d'URL
  db.js             accès IndexedDB
  exercises.js      catalogue des exercices (données)
  catalog.js        registre des exercices (logique)
  playlist-import.js  analyse, validation et sérialisation du JSON
  starter-playlists.js  circuits livrés : exemple et pré-chargement des niveaux
  session.js        logique de séance, chronomètre, reprise
  scoring.js        agrégats, grille, courbe
  completion-grid.js  affichage de la grille de l'accueil
  scoring-details.js  indicateurs, records et courbe du scoring détaillé
  playlist-order.js ordre d'affichage et renommage des circuits
  playlist-editor.js  brouillon, validation et identifiant de l'éditeur de circuit
  backup.js         export et restauration
  screens/          un module par écran
assets/
  exercises/        un SVG par exercice, plus generique.svg
  icons/            icônes de l'application
playlists/
  exemple.json
tools/
  serve.js          serveur local
  motion/           générateur des illustrations (hors production)
```

La logique de séance, de validation et de scoring est écrite en fonctions pures, séparées de l'affichage, pour pouvoir être testée sans navigateur.

### 9.3 Manifeste

| Champ | Valeur |
|---|---|
| `name` / `short_name` | `BodyBox` |
| `lang` | `fr` |
| `start_url` | `./` |
| `scope` | `./` |
| `display` | `standalone` |
| `orientation` | `portrait` |
| `background_color` / `theme_color` | `#000000` |
| `icons` | 192 px et 512 px, plus une version `maskable` de 512 px |

L'icône est monochrome : les lettres « BB » en blanc sur fond noir.

`index.html` contient en complément les balises propres à iOS : `apple-touch-icon`, et `viewport` avec `viewport-fit=cover`.

### 9.4 Service worker et hors-ligne

- À l'installation, le service worker met en cache tous les fichiers de l'application : pages, styles, scripts, SVG, icônes, circuit d'exemple.
- Les requêtes sont servies depuis le cache en priorité, le réseau ne servant qu'en secours.
- Le nom du cache porte un numéro de version (`bodybox-v{n}`, préfixe hérité de l'ancien nom et conservé pour nettoyer les anciens caches). Toute livraison incrémente ce numéro ; les anciens caches sont supprimés à l'activation.
- Lorsqu'une nouvelle version est prête, un bandeau « Mise à jour disponible » propose **Recharger**. Le bandeau n'apparaît jamais pendant une séance : il attend le retour à un autre écran.
- Après la première visite, toutes les fonctions sont disponibles sans connexion.

### 9.5 Compatibilité

| Plateforme | Cible |
|---|---|
| Android | Chrome, deux dernières versions majeures |
| iOS | Safari, iOS 16.4 et ultérieur |

Particularités iOS à prendre en compte :

- L'installation se fait par le menu Partager, « Sur l'écran d'accueil ». Le bouton **Installer** de l'accueil ouvre une aide adaptée (voir [2.2](#22-accueil)).
- Safari peut effacer les données d'un site non installé après plusieurs semaines sans visite. L'écran Réglages recommande l'installation et l'export régulier.

---

## 10. Exigences non fonctionnelles

### 10.1 Ergonomie mobile

- Largeur de référence : 360 à 430 px, en portrait.
- Toutes les actions de la séance sont atteignables au pouce, dans la moitié basse de l'écran.
- Zones tactiles de 48 × 48 px au minimum ; 64 px de haut pour les actions de la séance.
- Respect des zones sûres (`env(safe-area-inset-*)`).
- Le zoom par double appui et la sélection de texte sont désactivés sur les boutons de saisie, pour permettre des appuis rapides.
- Le champ de saisie utilise `inputmode="numeric"`.

### 10.2 Performance

| Mesure | Cible |
|---|---|
| Poids total de l'application, hors icônes et illustrations d'exercices | 300 Ko au plus, non compressé |
| Illustrations d'exercices | 10 Ko au plus chacune ; seules celles des circuits enregistrés sont préchargées en mémoire au démarrage |
| Affichage du premier écran, application installée | Moins de 1 s sur un téléphone de milieu de gamme |
| Réaction à un appui | Moins de 100 ms |
| Fluidité des animations | 60 images par seconde |
| Affichage du scoring avec 1 000 séances | Moins de 500 ms |

### 10.3 Accessibilité

- Contrastes conformes à la section [8.2](#82-palette).
- Tous les éléments interactifs sont de vrais boutons ou liens, avec un libellé accessible.
- L'ordre de tabulation suit l'ordre visuel ; le focus est déplacé sur le titre à chaque changement d'écran.
- Le changement d'exercice est annoncé aux lecteurs d'écran (`aria-live="polite"`).
- Respect de `prefers-reduced-motion`.
- L'interface reste utilisable avec une taille de texte système augmentée de 30 %.

### 10.4 Confidentialité et sécurité

- Aucune donnée ne quitte l'appareil. Aucun outil de mesure d'audience, aucune ressource tierce.
- Une politique de sécurité de contenu (`Content-Security-Policy`) limite le chargement aux ressources de l'application.
- Le contenu importé ou restauré est traité comme du texte (`textContent`), jamais inséré comme HTML.

### 10.5 Langue

Interface en français. Dates au format local français, semaines commençant le lundi. Les textes sont regroupés dans un module unique, pour permettre une traduction ultérieure.

---

## 11. Critères d'acceptation

### 11.1 Circuits

| N° | Étant donné | Quand | Alors |
|---|---|---|---|
| A1 | L'exemple de la section 4.4 | je l'importe par fichier | le circuit apparaît dans la liste avec 5 exercices |
| A2 | Le même contenu | je le colle dans la zone de texte | le résultat est identique à A1 |
| A3 | Un texte qui n'est pas du JSON | j'importe | le message « Ce fichier n'est pas un JSON valide. » s'affiche et rien n'est enregistré |
| A4 | Un JSON sans `name` et avec un `targetReps` à 0 | j'importe | les deux erreurs sont listées ensemble |
| A5 | Un exercice `burpees` sans `name` | j'importe | l'erreur signale l'exercice inconnu et son rang |
| A6 | Un exercice `burpees` avec `name` | j'importe | le circuit est accepté ; l'exercice utilise l'illustration générique |
| A7 | Un circuit déjà importé, avec des séances | je réimporte le même `id` et je confirme | le circuit est remplacé et l'historique est conservé |
| A8 | Un `name` contenant `<b>test</b>` | j'importe | le texte s'affiche tel quel, balises visibles |
| A9 | Une installation neuve | j'ouvre l'application | les trois circuits par niveau sont dans la liste ; si je les supprime tous, ils ne reviennent pas au lancement suivant |
| A10 | Un circuit dans **Réglages › Circuits** | je touche son icône de partage et l'envoie à une application | celle-ci reçoit un JSON qui, réimporté, redonne le même circuit |

### 11.2 Séance

| N° | Étant donné | Quand | Alors |
|---|---|---|---|
| B1 | Un circuit de 5 exercices | je démarre | le 1er exercice s'affiche avec son animation, tour 1, chronomètre à 00:00 |
| B2 | Une séance en cours | je valide une série | l'exercice suivant s'affiche |
| B3 | Le dernier exercice du tour | je valide | le compteur de tours augmente de 1 et le 1er exercice s'affiche |
| B4 | 12 répétitions saisies au tour 1 pour un exercice | j'arrive sur cet exercice au tour 2 | la valeur proposée est 12 |
| B5 | Une séance en cours | je saisis 0 et je valide | la série est acceptée |
| B6 | Une séance en cours | je vide le champ | **Valider** est désactivé |
| B7 | 2 tours complets et 3 exercices validés sur 5 | je termine | le récapitulatif indique 2 tours et compte les répétitions des 13 séries |
| B8 | Une séance démarrée il y a 5 min | je mets l'application en arrière-plan 2 min puis je reviens | le chronomètre indique environ 7 min |
| B9 | Une séance en cours, 3 séries validées | je ferme l'application et je la rouvre 1 h plus tard, puis je choisis **Reprendre** | je retrouve le 4e exercice ; l'heure d'absence n'est pas comptée dans la durée |
| B10 | Une séance sans aucune série validée | je termine | aucune séance n'est enregistrée |
| B11 | Une séance commencée à 23 h 50 et terminée à 0 h 20 | je consulte le scoring | la séance est rattachée au jour de son début |

### 11.3 Scoring

| N° | Étant donné | Quand | Alors |
|---|---|---|---|
| C1 | Une séance de 3 tours aujourd'hui | j'ouvre l'accueil | la case du jour est au niveau 3 et entourée d'un filet |
| C2 | Deux séances le même jour, de 2 et 3 tours, sur un ou deux circuits | j'ouvre l'accueil | la case est au niveau 4 (5 tours) |
| C3 | Des séances sur deux circuits | je change de circuit dans le sélecteur du scoring détaillé | les indicateurs, les records et la courbe se mettent à jour ; la grille reste tous circuits confondus |
| C4 | Des séances lundi, mardi et mercredi ; aujourd'hui jeudi, sans séance | je consulte les indicateurs | les jours consécutifs valent 3 |
| C5 | La même situation, aujourd'hui vendredi | je consulte les indicateurs | les jours consécutifs valent 0 et le record de jours consécutifs vaut 3 |
| C6 | Une case avec séances | j'appuie dessus | le détail du jour s'affiche sous la grille |
| C7 | Le thème clair | j'ouvre l'accueil | les niveaux suivent la colonne « Clair » de la section 8.5 |

### 11.4 PWA

| N° | Étant donné | Quand | Alors |
|---|---|---|---|
| D1 | Une première visite en ligne | j'installe l'application | elle s'ouvre en plein écran, sans barre de navigateur |
| D2 | L'application installée | je coupe le réseau et je déroule une séance complète | tout fonctionne, animations comprises |
| D3 | Une nouvelle version publiée | j'ouvre l'application hors séance | le bandeau de mise à jour apparaît ; **Recharger** applique la nouvelle version sans perte de données |
| D4 | Des circuits et des séances | j'exporte, j'efface tout, puis je restaure | toutes les données sont retrouvées à l'identique |
| D5 | L'application servie depuis `https://exemple.org/body-box/` | je l'utilise | toutes les ressources se chargent |

### 11.5 Design et animations

| N° | Vérification |
|---|---|
| E1 | Aucune couleur autre que les valeurs de la section 8.2 et 8.5 n'apparaît dans les feuilles de style ni dans les SVG |
| E2 | Chaque SVG d'exercice pèse 10 Ko au plus et n'utilise que `currentColor` |
| E3 | Chaque animation boucle sans saut visible entre la dernière et la première image |
| E4 | Avec le mouvement réduit activé, chaque illustration est fixe sur sa position clé |
| E5 | Le changement de thème inverse l'interface et les illustrations, sans rechargement |
| E6 | Le nombre de répétitions est lisible à 1,5 m de l'écran |

### 11.6 Tests automatisés

Les fonctions pures font l'objet de tests unitaires, exécutables avec le lanceur de tests intégré à Node.js (`node --test`), sans dépendance :

- validation du JSON : un test par ligne du tableau de la section [4.3](#43-validation) ;
- séance : progression, passage de tour, valeur proposée, calcul de la durée avec interruption ;
- scoring : niveaux d'intensité, jours consécutifs, agrégats par jour, changement de jour à minuit ;
- catalogue : cohérence des données, des illustrations, du pré-cache et des fiches d'animation.

---

## 12. Jalons et évolutions

### 12.1 Jalons

| Lot | Contenu | Résultat vérifiable |
|---|---|---|
| 1. Socle | Arborescence, routeur, variables de design, composants, manifeste, service worker | L'application s'installe et s'ouvre hors-ligne |
| 2. Circuits | IndexedDB, import et validation, liste, détail, suppression, partage | Critères A1 à A10 |
| 3. Séance | Déroulement, saisie, tours, chronomètre, reprise, récapitulatif | Critères B1 à B11 |
| 4. Animations | Le catalogue, ses SVG, l'illustration générique, le registre, le mouvement réduit | Critères E2 à E4 |
| 5. Scoring | Grille, détail d'un jour, indicateurs, courbe | Critères C1 à C7 |
| 6. Finitions | Réglages, sauvegarde, mise à jour, accessibilité, performance | Critères D1 à D5, E1, E5, E6 |

Le lot 4 est indépendant des lots 2 et 3 et peut être mené en parallèle.

### 12.2 Évolutions envisagées après la v1

- Minuteur de récupération entre les exercices.
- Création d'exercices personnalisés dans l'éditeur de circuit.
- Saisie de la charge utilisée.
- Correction de la dernière série validée.
- Exercices chronométrés (gainage), saisis en secondes.
- Écran de consultation du catalogue d'exercices.
