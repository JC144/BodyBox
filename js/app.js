// Démarrage de l'application : thème, reprise d'une séance interrompue, routage, service worker.

import { T } from './strings.js';
import { GENERIC, resolveExercise } from './catalog.js';
import { getActiveSession, saveActiveSession, clearActiveSession, commitSession, getPlaylists, exportAll, getLastBackupAt } from './db.js';
import { isBackupDue } from './backup.js';
import { loadSettings, applyTheme } from './settings.js';
import { resumeSession, finishAtLastActivity, hasEntries } from './session.js';
import { seedStarterPlaylists } from './starter-playlists.js';
import { startRouter, onRoute, currentRoute, path } from './router.js';
import { openDialog, confirmAction, preloadIllustrations } from './ui.js';

import * as playlistsScreen from './screens/playlists.js';
import * as importScreen from './screens/import.js';
import * as detailScreen from './screens/playlist-detail.js';
import * as sessionScreen from './screens/session.js';
import * as summaryScreen from './screens/summary.js';
import * as settingsScreen from './screens/settings.js';
import * as editorScreen from './screens/playlist-editor.js';

const ROUTES = [
  { pattern: /^\/playlists$/, name: 'playlists', screen: playlistsScreen },
  { pattern: /^\/import$/, name: 'import', screen: importScreen },
  { pattern: /^\/playlists\/([^/]+)$/, name: 'playlist', screen: detailScreen },
  { pattern: /^\/session$/, name: 'session', screen: sessionScreen },
  { pattern: /^\/sessions\/([^/]+)$/, name: 'summary', screen: summaryScreen },
  { pattern: /^\/settings(?:\/(general|playlists))?$/, name: 'settings', screen: settingsScreen },
  { pattern: /^\/editor(?:\/([^/]+))?$/, name: 'editor', screen: editorScreen },
];
const byName = new Map(ROUTES.map((r) => [r.name, r]));

const main = document.getElementById('main');

// ---------- Affichage des écrans ----------

let cleanup = null;
let renderToken = 0;

async function show(route) {
  const token = ++renderToken;
  const def = byName.get(route.name);
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;

  document.body.dataset.route = route.name;

  const view = document.createElement('div');
  view.className = `screen screen-${route.name}`;
  main.replaceChildren(view);
  window.scrollTo(0, 0);

  try {
    const result = await def.screen.render(view, route.params);
    if (token !== renderToken) {
      if (typeof result === 'function') result();
      return;
    }
    cleanup = result;
  } catch (err) {
    console.error(err);
    view.replaceChildren(Object.assign(document.createElement('p'), { className: 'notice', textContent: String(err.message || err) }));
  }
  // Le focus est placé sur le titre à chaque changement d'écran.
  view.querySelector('h1')?.focus({ preventScroll: true });
  refreshUpdateBanner();
}

// ---------- Séance interrompue ----------

/** À l'ouverture, propose de reprendre, terminer ou supprimer une séance restée en cours. */
async function handleInterruptedSession() {
  const active = await getActiveSession();
  if (!active) return;
  for (;;) {
    const { value } = await openDialog({
      title: T.session.resumeTitle,
      message: T.session.resumeText(active.playlistName, active.entries.length),
      dismissible: false,
      actions: [
        { label: T.session.resumeResume, value: 'resume', kind: 'primary' },
        { label: T.session.resumeSave, value: 'save', kind: 'secondary' },
        { label: T.session.resumeDelete, value: 'delete', kind: 'danger' },
      ],
    });
    if (value === 'resume') {
      await saveActiveSession(resumeSession(active, Date.now()));
      location.replace('#/session');
      return;
    }
    if (value === 'save') {
      if (!hasEntries(active)) {
        await clearActiveSession();
        location.replace(`#${path('playlists', active.playlistId)}`);
      } else {
        const done = finishAtLastActivity(active);
        await commitSession(done);
        location.replace(`#${path('sessions', done.id)}`);
      }
      return;
    }
    if (value === 'delete') {
      const ok = await confirmAction({
        title: T.session.deleteTitle,
        message: T.session.deleteText,
        confirmLabel: T.common.delete,
        danger: true,
      });
      if (ok) {
        await clearActiveSession();
        if (location.hash.startsWith('#/session')) location.replace('#/playlists');
        return;
      }
    }
  }
}

// ---------- Rappel de sauvegarde ----------

/** Au lancement, hors séance en cours, rappelle d'exporter les données après deux semaines sans sauvegarde. */
async function remindBackup() {
  if (await getActiveSession()) return;
  const [data, lastBackupAt] = await Promise.all([exportAll(), getLastBackupAt()]);
  if (!isBackupDue(data, lastBackupAt, Date.now())) return;
  const { value } = await openDialog({
    title: T.settings.backupDueTitle,
    message: T.settings.backupDueText(lastBackupAt == null),
    actions: [
      { label: T.settings.backupDueExport, value: 'export', kind: 'primary' },
      { label: T.settings.backupDueLater, value: 'later', kind: 'secondary' },
    ],
  });
  if (value === 'export') await settingsScreen.exportBackup();
}

// ---------- Mises à jour (service worker) ----------

let waitingWorker = null;
let reloadRequested = false;
const updateBanner = document.getElementById('update-banner');

function refreshUpdateBanner() {
  const route = currentRoute();
  updateBanner.hidden = !waitingWorker || !route || route.name === 'session';
}

function setWaiting(worker) {
  waitingWorker = worker;
  refreshUpdateBanner();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadRequested) location.reload();
  });
  navigator.serviceWorker
    .register('sw.js')
    .then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) setWaiting(worker);
        });
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    })
    .catch(() => {});
  updateBanner.querySelector('button').addEventListener('click', () => {
    if (!waitingWorker) return;
    reloadRequested = true;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  });
}

// ---------- Démarrage ----------

async function boot() {
  const settings = await loadSettings().catch(() => ({ theme: 'dark' }));
  applyTheme(settings.theme);
  updateBanner.querySelector('span').textContent = T.update.available;
  updateBanner.querySelector('button').textContent = T.update.reload;

  await seedStarterPlaylists().catch(() => {});
  await handleInterruptedSession();

  onRoute(show);
  startRouter(ROUTES, '/playlists');
  registerServiceWorker();
  remindBackup().catch(() => {});
  // Seules les illustrations des circuits enregistrés sont préchargées : le catalogue en compte des dizaines.
  getPlaylists()
    .then((playlists) => {
      const items = playlists.filter((p) => !p.deletedAt).flatMap((p) => p.exercises);
      preloadIllustrations([GENERIC, ...new Set(items.map((e) => resolveExercise(e).illustration))]);
    })
    .catch(() => {});
}

boot();
