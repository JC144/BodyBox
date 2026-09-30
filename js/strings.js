// Tous les textes de l'interface, regroupés pour une traduction ultérieure.

export const LOCALE = 'fr-FR';

export const T = {
  appName: 'BodyBox',

  common: {
    cancel: 'Annuler',
    confirm: 'Confirmer',
    back: 'Retour',
    delete: 'Supprimer',
    close: 'Fermer',
    home: 'Accueil',
    reps: (n) => (n > 1 ? 'répétitions' : 'répétition'),
    loops: (n) => (n > 1 ? 'tours' : 'tour'),
    sessions: (n) => (n > 1 ? 'séances' : 'séance'),
    exercises: (n) => (n > 1 ? 'exercices' : 'exercice'),
    days: (n) => (n > 1 ? 'jours' : 'jour'),
    deleted: 'supprimé',
  },

  playlists: {
    title: 'Circuits',
    settings: 'Réglages',
    scoringTitle: 'Historique',
    detailedScoring: 'Historique détaillé',
    import: 'Importer un circuit',
    add: 'Ajouter un circuit',
    emptyTitle: 'Aucun circuit',
    emptyText: 'Créez un circuit pour commencer, ou essayez le circuit d’exemple.',
    loadExample: 'Charger le circuit d’exemple',
    lastSession: 'Dernière séance',
    never: 'Jamais réalisé',
    activeBanner: 'Une séance est en cours',
    resume: 'Reprendre',
    exampleError: 'Le circuit d’exemple n’a pas pu être chargé.',
  },

  install: {
    button: 'Installer',
    label: 'Installer l’application',
    iosTitle: 'Installer BodyBox',
    iosText: 'Sur iPhone et iPad, l’installation se fait depuis le menu Partager du navigateur :',
    iosSteps: [
      'Touchez le bouton Partager (un carré d’où sort une flèche vers le haut), dans la barre du navigateur. S’il n’apparaît pas, touchez d’abord « … ».',
      'Faites défiler les options et choisissez « Sur l’écran d’accueil ».',
      'Touchez « Ajouter ». BodyBox s’ouvre ensuite depuis son icône, en plein écran et hors connexion.',
    ],
    iosData: 'L’application installée ne reprend pas les données de ce navigateur : si vous avez déjà des séances, exportez-les d’abord (Réglages › Exporter mes données), puis restaurez la sauvegarde dans l’application installée.',
    ok: 'Compris',
  },

  import: {
    title: 'Importer',
    fileLabel: 'Depuis un fichier',
    fileButton: 'Choisir un fichier .json',
    fileChosen: (name) => `Fichier choisi : ${name}`,
    textLabel: 'Ou coller le contenu JSON',
    textPlaceholder: '{ "schemaVersion": 1, … }',
    submit: 'Importer',
    empty: 'Choisissez un fichier ou collez un contenu JSON.',
    errorsTitle: (n) => (n > 1 ? `${n} erreurs détectées. Rien n’a été enregistré.` : '1 erreur détectée. Rien n’a été enregistré.'),
    conflictTitle: 'Circuit déjà présent',
    conflictText: (name) => `Un circuit avec le même identifiant existe déjà (« ${name} »). Le remplacer ? L’historique des séances est conservé.`,
    replace: 'Remplacer',
  },

  validation: {
    invalidJson: 'Ce fichier n\'est pas un JSON valide.',
    tooLarge: 'Ce fichier dépasse la taille maximale de 100 Ko.',
    notObject: 'Le fichier doit contenir un seul circuit.',
    schemaVersion: 'Version de format non prise en charge.',
    required: (field) => `Le champ "${field}" est obligatoire.`,
    invalid: (field, constraint) => `Le champ "${field}" est invalide : ${constraint}.`,
    exercisesCount: 'Un circuit doit contenir entre 1 et 50 exercices.',
    unknownExercise: (n, id) => `L'exercice n°${n} ("${id}") est inconnu : ajoutez un champ "name".`,
    c: {
      id: 'minuscules, chiffres et tirets, de 1 à 64 caractères, commençant par une lettre ou un chiffre',
      text: (min, max) => (min > 0 ? `texte de ${min} à ${max} caractères` : `texte de ${max} caractères au plus`),
      array: 'liste attendue',
      object: 'objet attendu',
      reps: 'nombre entier de 1 à 999',
    },
  },

  detail: {
    start: 'Démarrer',
    resume: 'Reprendre la séance',
    target: (n) => `Objectif : ${n}`,
    howTo: 'Exécution',
    record: 'Record',
    recordLoops: (n) => `${n} ${n > 1 ? 'tours' : 'tour'}`,
    recordTotal: (n) => `${n} rép. sur la séance`,
    busy: 'Une séance est en cours sur un autre circuit. Reprenez-la ou terminez-la avant d’en démarrer une nouvelle.',
    busyLink: 'Aller à la séance en cours',
    notFound: 'Ce circuit n’existe pas.',
  },

  session: {
    loop: 'Tour',
    exercise: 'Exercice',
    target: (n) => `Objectif ${n}`,
    repsLabel: 'Répétitions',
    minus: 'Retirer une répétition',
    plus: 'Ajouter une répétition',
    validate: 'Valider',
    finish: 'Terminer la séance',
    finishTitle: 'Terminer la séance ?',
    finishText: 'La séance sera enregistrée et vous verrez son récapitulatif.',
    finishTextEmpty: 'Aucune série n’a été validée : la séance ne sera pas enregistrée.',
    finishConfirm: 'Terminer',
    keepGoing: 'Reprendre',
    announce: (name, loop, pos, total) => `${name}, tour ${loop}, exercice ${pos} sur ${total}`,
    resumeTitle: 'Séance en cours',
    resumeText: (name, n) => `Une séance sur « ${name} » n’a pas été terminée (${n} ${n > 1 ? 'séries validées' : 'série validée'}).`,
    resumeResume: 'Reprendre',
    resumeSave: 'Terminer et enregistrer',
    resumeDelete: 'Supprimer',
    deleteTitle: 'Supprimer la séance ?',
    deleteText: 'La séance et ses séries seront définitivement supprimées.',
  },

  summary: {
    title: 'Récapitulatif',
    duration: 'Durée',
    loops: 'Tours',
    reps: 'Répétitions',
    exercise: 'Exercice',
    loopShort: (n) => `T${n}`,
    total: 'Total',
    record: 'Record',
    backToPlaylists: 'Retour à l’accueil',
    notFound: 'Cette séance n’existe pas.',
  },

  scoring: {
    playlist: 'Circuit',
    less: 'Moins',
    more: 'Plus',
    dayLabels: ['L', '', 'M', '', 'V', '', ''],
    noSession: 'Aucune séance',
    cellLabel: (date, loops, sessions) =>
      sessions === 0
        ? `${date} : aucune séance`
        : `${date} : ${loops} ${loops > 1 ? 'tours' : 'tour'}, ${sessions} ${sessions > 1 ? 'séances' : 'séance'}`,
    sessionLine: (start, duration, loops, reps) =>
      `${start} · ${duration} · ${loops} ${loops > 1 ? 'tours' : 'tour'} · ${reps} rép.`,
    openSummary: 'Voir le récapitulatif',
    gridLabel: 'Grille de régularité',
    streak: 'Jours consécutifs',
    bestStreak: 'Record de jours consécutifs',
    sessions: 'Séances',
    loops: 'Tours',
    time: 'Temps cumulé',
    records: 'Records',
    noRecords: 'Pas encore de record.',
    progress: 'Progression',
    exercise: 'Exercice',
    measure: 'Mesure',
    measureTotal: 'Volume du jour',
    measureBest: 'Meilleure série',
    range: 'Période',
    rangeDays: (n) => `${n} jours`,
    emptyInvite: 'Démarrez une première séance sur ce circuit pour voir votre progression ici.',
    emptyInviteAll: 'Démarrez une première séance pour voir votre progression ici.',
    allPlaylists: 'Tous les circuits',
    emptyRange: 'Aucune série de cet exercice sur la période.',
    point: (date, value) => `${date} : ${value} ${value > 1 ? 'répétitions' : 'répétition'}`,
    chartLabel: (name) => `Courbe de progression : ${name}`,
  },

  settings: {
    title: 'Réglages',
    tabGeneral: 'Général',
    tabPlaylists: 'Circuits',
    theme: 'Thème',
    themeDark: 'Sombre',
    themeLight: 'Clair',
    themeSystem: 'Système',
    data: 'Données',
    export: 'Exporter mes données',
    restore: 'Restaurer une sauvegarde',
    restoreTitle: 'Restaurer cette sauvegarde ?',
    restoreText: (p, s) => `Toutes les données actuelles seront remplacées par la sauvegarde (${p} ${p > 1 ? 'circuits' : 'circuit'}, ${s} ${s > 1 ? 'séances' : 'séance'}). La séance en cours, s’il y en a une, sera supprimée.`,
    restoreConfirm: 'Remplacer mes données',
    restoreDone: 'Sauvegarde restaurée.',
    restoreInvalid: 'Ce fichier n’est pas une sauvegarde BodyBox valide.',
    exportDone: 'Sauvegarde exportée.',
    backupDueTitle: 'Pensez à sauvegarder',
    backupDueText: (never) =>
      `${never ? 'Vous n’avez encore jamais exporté vos données.' : 'Votre dernière sauvegarde date de plus de deux semaines.'} Exportez-les pour ne pas les perdre si l’appareil ou le navigateur les efface.`,
    backupDueExport: 'Exporter maintenant',
    backupDueLater: 'Plus tard',
    erase: 'Effacer toutes les données',
    eraseTitle: 'Effacer toutes les données ?',
    eraseText: 'Circuits, séances et réglages seront supprimés de cet appareil.',
    eraseTitle2: 'Vraiment tout effacer ?',
    eraseText2: 'Cette action est définitive. Pensez à exporter vos données avant.',
    eraseConfirm: 'Effacer',
    eraseConfirm2: 'Oui, tout effacer',
    eraseDone: 'Toutes les données ont été effacées.',
    about: 'Application',
    version: 'Version',
    storage: 'Stockage persistant',
    storageYes: 'Accordé',
    storageNo: 'Non accordé',
    storageUnknown: 'Indisponible',
    playlistsEmpty: 'Aucun circuit pour l’instant.',
    playlistsHelp: 'L’ordre choisi ici est celui de l’écran d’accueil.',
    moveUp: (name) => `Monter « ${name} »`,
    moveDown: (name) => `Descendre « ${name} »`,
    rename: 'Renommer',
    renameLabel: (name) => `Renommer « ${name} »`,
    renameTitle: 'Renommer le circuit',
    renameField: 'Nom (60 caractères au plus)',
    renameConfirm: 'Enregistrer',
    renameDone: 'Circuit renommé.',
    deleteLabel: (name) => `Supprimer « ${name} »`,
    deleteTitle: 'Supprimer le circuit ?',
    deleteText: 'Le circuit sera retiré de la liste.',
    deleteHistory: 'Supprimer aussi l’historique des séances',
    deleteDone: 'Circuit supprimé.',
    edit: 'Modifier',
    editLabel: (name) => `Modifier les exercices de « ${name} »`,
    shareLabel: (name) => `Partager « ${name} »`,
    shareDownloaded: 'Circuit enregistré dans les téléchargements.',
    shareError: 'Le circuit n’a pas pu être partagé.',
    create: 'Nouveau circuit',
    advice: 'Conseil : installez l’application sur l’écran d’accueil et exportez régulièrement vos données. Sur iPhone, Safari peut effacer les données d’un site non installé après plusieurs semaines sans visite.',
  },

  editor: {
    titleNew: 'Nouveau circuit',
    titleEdit: 'Modifier le circuit',
    back: 'Réglages',
    name: 'Nom (60 caractères au plus)',
    description: 'Description (facultative, 200 caractères au plus)',
    exercises: 'Exercices',
    add: 'Ajouter un exercice',
    none: 'Aucun exercice. Touchez + pour en ajouter un.',
    swipeHelp: 'Faites glisser un exercice vers la gauche pour le modifier ou le retirer.',
    moveUp: (name) => `Monter « ${name} »`,
    moveDown: (name) => `Descendre « ${name} »`,
    edit: (name) => `Modifier « ${name} »`,
    remove: (name) => `Retirer « ${name} »`,
    removed: (name) => `« ${name} » retiré.`,
    full: 'Le circuit compte déjà 50 exercices.',
    save: 'Enregistrer',
    saved: 'Circuit enregistré.',
    created: 'Circuit créé.',
    discardTitle: 'Abandonner les modifications ?',
    discardText: 'Les changements apportés au circuit ne seront pas enregistrés.',
    discardConfirm: 'Abandonner',
    historyNote: 'Les séances passées ne sont pas modifiées. Une séance en cours garde la liste d’exercices de son démarrage.',
    notFound: 'Ce circuit n’existe pas.',
    errorsTitle: (n) => (n > 1 ? `${n} points à corriger :` : '1 point à corriger :'),
    errors: {
      name: 'Donnez un nom au circuit (1 à 60 caractères).',
      description: 'La description dépasse 200 caractères.',
      empty: 'Ajoutez au moins un exercice.',
      tooMany: 'Un circuit compte 50 exercices au plus.',
      target: 'L’objectif doit être un nombre entier de 1 à 999, ou rester vide.',
      note: 'La consigne dépasse 140 caractères.',
      item: (n, message) => `Exercice n°${n} : ${message.charAt(0).toLowerCase()}${message.slice(1)}`,
    },
    picker: {
      title: 'Ajouter un exercice',
      back: 'Circuit',
      search: 'Rechercher (nom, muscle)',
      results: (n) => (n > 1 ? `${n} exercices` : n === 1 ? '1 exercice' : 'Aucun exercice trouvé'),
    },
    item: {
      backToCatalog: 'Catalogue',
      backToCircuit: 'Circuit',
      target: 'Objectif (facultatif)',
      targetPlaceholder: 'Libre',
      note: 'Consigne (facultative)',
      howTo: 'Exécution',
      validate: 'Valider',
      added: (name) => `« ${name} » ajouté.`,
    },
  },

  update: {
    available: 'Mise à jour disponible',
    reload: 'Recharger',
  },
};

// ---------- Formatage (dates locales françaises, semaines commençant le lundi) ----------

const pad = (n) => String(n).padStart(2, '0');

/** Chronomètre : mm:ss, puis h:mm:ss au-delà d'une heure. */
export function formatClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Durée lisible : « 42 min », « 1 h 05 », « 35 s ». */
export function formatDuration(ms) {
  const totalMin = Math.floor(Math.max(0, ms) / 60000);
  if (totalMin === 0) return `${Math.floor(Math.max(0, ms) / 1000)} s`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} h ${pad(m)}` : `${m} min`;
}

function dayToDate(day) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** « Mardi 15 septembre 2026 » à partir de « 2026-09-15 ». */
export function formatDayLong(day) {
  return capitalize(new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dayToDate(day)));
}

/** « 15 sept. » */
export function formatDayShort(day) {
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' }).format(dayToDate(day));
}

/** « 15 sept. 2026 » */
export function formatDayMedium(day) {
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }).format(dayToDate(day));
}

/** « 18:42 » */
export function formatTime(ts) {
  return new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
}

/** Initiale du mois (« J », « F », « M »…) pour les repères de la grille. */
export function monthInitial(day) {
  return new Intl.DateTimeFormat(LOCALE, { month: 'narrow' }).format(dayToDate(day)).toUpperCase();
}

export function formatNumber(n) {
  return new Intl.NumberFormat(LOCALE).format(n);
}
