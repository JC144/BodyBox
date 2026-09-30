// Accès à la base IndexedDB « bodybox » (spécification, section 5).

const DB_NAME = 'bodybox';
const DB_VERSION = 1;

let dbPromise = null;

/**
 * Migrations successives : chaque étape part de la version précédente et préserve les données.
 * Pour une évolution de structure, incrémenter DB_VERSION et ajouter une étape.
 */
const MIGRATIONS = {
  1(db) {
    db.createObjectStore('playlists', { keyPath: 'id' });
    const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
    sessions.createIndex('playlistId', 'playlistId');
    sessions.createIndex('day', 'day');
    sessions.createIndex('playlistId_day', ['playlistId', 'day']);
    db.createObjectStore('meta', { keyPath: 'key' });
  },
};

export function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (event) => {
        const db = req.result;
        for (let v = event.oldVersion + 1; v <= DB_VERSION; v++) MIGRATIONS[v](db, req.transaction);
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('Base de données bloquée'));
    });
  }
  return dbPromise;
}

const promisify = (req) =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

/** Exécute `fn(stores)` dans une transaction et attend sa fin. */
async function tx(storeNames, mode, fn) {
  const db = await openDb();
  const names = Array.isArray(storeNames) ? storeNames : [storeNames];
  return new Promise((resolve, reject) => {
    const t = db.transaction(names, mode);
    const stores = Object.fromEntries(names.map((n) => [n, t.objectStore(n)]));
    let result;
    Promise.resolve(fn(stores, t)).then((r) => { result = r; }, (e) => { t.abort(); reject(e); });
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('Transaction annulée'));
  });
}

// ---------- Playlists ----------

export const getPlaylists = () => tx('playlists', 'readonly', (s) => promisify(s.playlists.getAll()));
export const getPlaylist = (id) => tx('playlists', 'readonly', (s) => promisify(s.playlists.get(id)));
export const putPlaylist = (p) => tx('playlists', 'readwrite', (s) => { s.playlists.put(p); });

/** La séance en cours sur la playlist `id`, s'il y en a une, prend le nom `name`. */
async function renameActiveSession(s, id, name) {
  const active = (await promisify(s.meta.get('activeSession')))?.value;
  if (active?.playlistId === id && active.playlistName !== name) {
    s.meta.put({ key: 'activeSession', value: { ...active, playlistName: name } });
  }
}

/** Renomme une playlist ; la séance en cours sur cette playlist prend aussi le nouveau nom. */
export function renamePlaylist(id, name) {
  return tx(['playlists', 'meta'], 'readwrite', async (s) => {
    const p = await promisify(s.playlists.get(id));
    if (p) s.playlists.put({ ...p, name });
    await renameActiveSession(s, id, name);
  });
}

/**
 * Enregistre une playlist créée ou modifiée dans l'éditeur. Une séance en cours sur cette playlist
 * prend le nouveau nom ; sa liste d'exercices, copiée au démarrage, reste inchangée.
 */
export function updatePlaylist(playlist) {
  return tx(['playlists', 'meta'], 'readwrite', async (s) => {
    s.playlists.put(playlist);
    await renameActiveSession(s, playlist.id, playlist.name);
  });
}

/** Supprime une playlist ; avec `withHistory`, supprime aussi ses séances, sinon la marque supprimée. */
export function deletePlaylist(id, withHistory, now) {
  return tx(['playlists', 'sessions'], 'readwrite', async (s) => {
    if (withHistory) {
      s.playlists.delete(id);
      const keys = await promisify(s.sessions.index('playlistId').getAllKeys(id));
      for (const k of keys) s.sessions.delete(k);
    } else {
      const p = await promisify(s.playlists.get(id));
      if (p) s.playlists.put({ ...p, deletedAt: now });
    }
  });
}

// ---------- Séances ----------

export const getSessions = () => tx('sessions', 'readonly', (s) => promisify(s.sessions.getAll()));
export const getSession = (id) => tx('sessions', 'readonly', (s) => promisify(s.sessions.get(id)));
export const getSessionsByPlaylist = (playlistId) =>
  tx('sessions', 'readonly', (s) => promisify(s.sessions.index('playlistId').getAll(playlistId)));

// ---------- Méta : séance en cours et réglages ----------

export const getMeta = (key) => tx('meta', 'readonly', async (s) => (await promisify(s.meta.get(key)))?.value);
export const setMeta = (key, value) => tx('meta', 'readwrite', (s) => { s.meta.put({ key, value }); });
export const deleteMeta = (key) => tx('meta', 'readwrite', (s) => { s.meta.delete(key); });

export const getActiveSession = () => getMeta('activeSession');
export const saveActiveSession = (session) => setMeta('activeSession', session);
export const clearActiveSession = () => deleteMeta('activeSession');

export const getLastBackupAt = () => getMeta('lastBackupAt');
export const setLastBackupAt = (ts) => setMeta('lastBackupAt', ts);

/** Clôt la séance en cours : l'enregistre dans l'historique et efface l'état en cours, atomiquement. */
export function commitSession(session) {
  return tx(['sessions', 'meta'], 'readwrite', (s) => {
    s.sessions.put(session);
    s.meta.delete('activeSession');
  });
}

// ---------- Sauvegarde ----------

export function exportAll() {
  return tx(['playlists', 'sessions', 'meta'], 'readonly', async (s) => ({
    playlists: await promisify(s.playlists.getAll()),
    sessions: await promisify(s.sessions.getAll()),
    settings: (await promisify(s.meta.get('settings')))?.value ?? {},
  }));
}

/** Remplace l'ensemble des données (restauration). La séance en cours est supprimée. */
export function replaceAll({ playlists, sessions, settings }) {
  return tx(['playlists', 'sessions', 'meta'], 'readwrite', (s) => {
    s.playlists.clear();
    s.sessions.clear();
    s.meta.clear();
    for (const p of playlists) s.playlists.put(p);
    for (const x of sessions) s.sessions.put(x);
    s.meta.put({ key: 'settings', value: settings });
  });
}

export function clearAll() {
  return tx(['playlists', 'sessions', 'meta'], 'readwrite', (s) => {
    s.playlists.clear();
    s.sessions.clear();
    s.meta.clear();
  });
}
