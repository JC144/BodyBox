// Service worker : pré-cache de toute l'application, réponses depuis le cache en priorité.
// Toute livraison incrémente CACHE_VERSION (et APP_VERSION dans js/version.js).

const CACHE_VERSION = 27;
const CACHE_NAME = `bodybox-v${CACHE_VERSION}`;

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/tokens.css',
  'css/base.css',
  'css/screens.css',
  'js/app.js',
  'js/router.js',
  'js/db.js',
  'js/exercises.js',
  'js/catalog.js',
  'js/playlist-import.js',
  'js/starter-playlists.js',
  'js/session.js',
  'js/scoring.js',
  'js/completion-grid.js',
  'js/scoring-details.js',
  'js/playlist-order.js',
  'js/playlist-editor.js',
  'js/backup.js',
  'js/dates.js',
  'js/dom.js',
  'js/install.js',
  'js/motion.js',
  'js/settings.js',
  'js/strings.js',
  'js/ui.js',
  'js/version.js',
  'js/screens/playlists.js',
  'js/screens/import.js',
  'js/screens/playlist-detail.js',
  'js/screens/session.js',
  'js/screens/summary.js',
  'js/screens/settings.js',
  'js/screens/playlist-editor.js',
  'assets/exercises/pompes.svg',
  'assets/exercises/pompes-chaises.svg',
  'assets/exercises/pompes-chaises-pieds-meuble.svg',
  'assets/exercises/pompes-mains-support-45cm.svg',
  'assets/exercises/pompes-mains-support-35cm.svg',
  'assets/exercises/pompes-mains-support-25cm.svg',
  'assets/exercises/pompes-mains-pieds-sureleves.svg',
  'assets/exercises/pompes-chaises-ecart-epaules.svg',
  'assets/exercises/pompes-chaises-pieds-au-sol.svg',
  'assets/exercises/pompes-serrees-pieds-chaise.svg',
  'assets/exercises/pompes-circulaires-chaises.svg',
  'assets/exercises/pompes-circulaires-inversees-chaises.svg',
  'assets/exercises/pompes-pieds-meuble-mains-serrees.svg',
  'assets/exercises/dips-chaises.svg',
  'assets/exercises/dips-chaises-demi-amplitude.svg',
  'assets/exercises/dips-chaises-mi-amplitude.svg',
  'assets/exercises/tractions-supination.svg',
  'assets/exercises/tractions-supination-moitie-haute.svg',
  'assets/exercises/tractions-supination-mi-amplitude.svg',
  'assets/exercises/tractions-supination-deux-tiers.svg',
  'assets/exercises/tractions-horizontales-jambes-repliees.svg',
  'assets/exercises/tractions-horizontales-pieds-avances.svg',
  'assets/exercises/tractions-horizontales-pieds-sureleves.svg',
  'assets/exercises/tractions-horizontales-pronation.svg',
  'assets/exercises/tractions-horizontales-pronation-pieds-avances.svg',
  'assets/exercises/tractions-horizontales-pronation-pieds-sureleves.svg',
  'assets/exercises/dips-dos-chaise-pieds-sureleves.svg',
  'assets/exercises/squat-une-jambe-assiste-petite-flexion.svg',
  'assets/exercises/squat-une-jambe-assiste-cuisse-parallele.svg',
  'assets/exercises/squat-une-jambe-assiste-flexion-complete.svg',
  'assets/exercises/squat-une-jambe-assiste-rebonds.svg',
  'assets/exercises/fente-laterale-alternee.svg',
  'assets/exercises/fente-laterale-un-cote.svg',
  'assets/exercises/squat-complet-pieds-serres.svg',
  'assets/exercises/squat-une-jambe-dos-au-mur.svg',
  'assets/exercises/sauts-verticaux-flexion.svg',
  'assets/exercises/chaise-contre-mur.svg',
  'assets/exercises/squat-ecarte-maintien.svg',
  'assets/exercises/chaise-contre-mur-une-jambe.svg',
  'assets/exercises/crunch-jambes-relevees.svg',
  'assets/exercises/releve-genoux-suspendu.svg',
  'assets/exercises/tractions-nuque-petite-amplitude.svg',
  'assets/exercises/tractions-nuque-mi-amplitude.svg',
  'assets/exercises/tractions-nuque-amplitude-complete.svg',
  'assets/exercises/tractions-pronation-prise-epaules.svg',
  'assets/exercises/tractions-prise-large-menton.svg',
  'assets/exercises/tractions-prise-neutre-serree.svg',
  'assets/exercises/tractions-horizontales-prise-neutre.svg',
  'assets/exercises/tractions-nuque-deux-tiers.svg',
  'assets/exercises/tractions-horizontales-prise-large.svg',
  'assets/exercises/pompes-piquees-chaises.svg',
  'assets/exercises/pompes-piquees-chaises-mains-serrees.svg',
  'assets/exercises/pompes-piquees-chaises-poings.svg',
  'assets/exercises/pompes-piquees-chaises-poings-serres.svg',
  'assets/exercises/extensions-triceps-avant-bras-sol.svg',
  'assets/exercises/extensions-triceps-table.svg',
  'assets/exercises/extensions-triceps-mur-chaise.svg',
  'assets/exercises/extensions-triceps-barre-chaises.svg',
  'assets/exercises/pompes-rotation-alternee.svg',
  'assets/exercises/extensions-lombaires-support.svg',
  'assets/exercises/inclinaisons-buste-bras-tendus.svg',
  'assets/exercises/flexions-laterales-support.svg',
  'assets/exercises/releves-lateraux-sol.svg',
  'assets/exercises/releve-buste-rotation.svg',
  'assets/exercises/releve-buste.svg',
  'assets/exercises/pompes-un-bras-chaise.svg',
  'assets/exercises/pompes-un-bras-support-bas.svg',
  'assets/exercises/pompes-un-bras-sol.svg',
  'assets/exercises/haussements-epaules-appui.svg',
  'assets/exercises/flexion-cou-allonge-banc.svg',
  'assets/exercises/rotations-buste-assis-sol-baton.svg',
  'assets/exercises/charrue-enroulement-dos.svg',
  'assets/exercises/essuie-glace-jambes.svg',
  'assets/exercises/mollet-une-jambe-sur-cale.svg',
  'assets/exercises/rotations-buste-tabouret-baton.svg',
  'assets/exercises/rotation-tete-allonge-cote.svg',
  'assets/exercises/pont-arriere-roue.svg',
  'assets/exercises/abdominaux.svg',
  'assets/exercises/abdominaux-lateraux.svg',
  'assets/exercises/kettlebell-swing.svg',
  'assets/exercises/kettlebell-goblet-squat.svg',
  'assets/exercises/kettlebell-clean-press.svg',
  'assets/exercises/kettlebell-rowing.svg',
  'assets/exercises/kettlebell-fente-arriere.svg',
  'assets/exercises/kettlebell-sumo-high-pull.svg',
  'assets/exercises/kettlebell-thruster.svg',
  'assets/exercises/kettlebell-crunch-bras-tendus.svg',
  'assets/exercises/kettlebell-souleve-de-terre.svg',
  'assets/exercises/kettlebell-pont-fessier.svg',
  'assets/exercises/kettlebell-floor-press.svg',
  'assets/exercises/kettlebell-developpe-militaire.svg',
  'assets/exercises/hand-gripper.svg',
  'assets/exercises/generique.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
  'assets/icons/apple-touch-icon.png',
  'playlists/exemple.json',
  'playlists/niveau-1-debutant.json',
  'playlists/niveau-2-intermediaire.json',
  'playlists/niveau-3-avance.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })))),
  );
  // Pas de skipWaiting automatique : la page propose « Recharger » quand une version est prête.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('bodybox-v') && k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      // Navigation inconnue du cache : page de l'application (le routage se fait par le fragment).
      if (request.mode === 'navigate') {
        const page = await cache.match('./');
        if (page) return page;
      }
      return fetch(request);
    })(),
  );
});
