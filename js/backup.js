// Export et restauration des données (spécification, section 5.4).
// Les fonctions de construction et de validation sont pures ; l'accès au stockage est dans db.js.

import { dayKey, diffDays } from './dates.js';
import { validatePlaylist } from './playlist-import.js';
import { CATALOG_IDS } from './catalog.js';

export const BACKUP_VERSION = 1;
const THEMES = ['dark', 'light', 'system'];

/** Nombre de jours sans sauvegarde au-delà duquel un rappel s'affiche au lancement. */
export const BACKUP_REMINDER_DAYS = 14;

/**
 * Indique si le rappel de sauvegarde doit s'afficher. Sans aucune sauvegarde, le délai part de la
 * donnée la plus ancienne ; sans aucune donnée, il n'y a rien à sauvegarder.
 */
export function isBackupDue({ playlists, sessions }, lastBackupAt, now) {
  const stamps = [...playlists.map((p) => p.importedAt), ...sessions.map((s) => s.endedAt)].filter(
    (t) => Number.isInteger(t) && t > 0,
  );
  const since = lastBackupAt ?? (stamps.length ? Math.min(...stamps) : null);
  if (since === null || playlists.length + sessions.length === 0) return false;
  return diffDays(dayKey(since), dayKey(now)) >= BACKUP_REMINDER_DAYS;
}

export function buildBackup({ playlists, sessions, settings }, now) {
  return {
    backupVersion: BACKUP_VERSION,
    exportedAt: now,
    playlists,
    sessions,
    settings,
  };
}

export function backupFileName(now) {
  return `body-box-sauvegarde-${dayKey(now)}.json`;
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isInt = (v) => Number.isInteger(v);

function isValidSession(s) {
  return (
    isObj(s) &&
    typeof s.id === 'string' && s.id.length > 0 &&
    typeof s.playlistId === 'string' &&
    typeof s.playlistName === 'string' &&
    Array.isArray(s.exercises) && s.exercises.length > 0 &&
    s.exercises.every((e) => isObj(e) && typeof e.exerciseId === 'string') &&
    typeof s.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.day) &&
    isInt(s.startedAt) && isInt(s.endedAt) &&
    isInt(s.pausedMs) && isInt(s.durationMs) && isInt(s.loopsCompleted) &&
    Array.isArray(s.entries) &&
    s.entries.every(
      (e) => isObj(e) && isInt(e.loopIndex) && isInt(e.position) && typeof e.exerciseId === 'string' &&
        isInt(e.reps) && e.reps >= 0 && e.reps <= 999 && isInt(e.validatedAt),
    )
  );
}

/**
 * Valide le contenu d'une sauvegarde. Renvoie les données normalisées, ou null si invalide.
 */
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObj(data) || data.backupVersion !== BACKUP_VERSION) return null;
  if (!Array.isArray(data.playlists) || !Array.isArray(data.sessions)) return null;

  const playlists = [];
  for (const p of data.playlists) {
    if (!isObj(p)) return null;
    const res = validatePlaylist(p, CATALOG_IDS);
    if (!res.ok) return null;
    playlists.push({
      ...res.playlist,
      importedAt: isInt(p.importedAt) ? p.importedAt : 0,
      deletedAt: isInt(p.deletedAt) ? p.deletedAt : null,
    });
  }
  if (!data.sessions.every(isValidSession)) return null;

  const settings = { ...(isObj(data.settings) ? data.settings : {}) };
  if (!THEMES.includes(settings.theme)) settings.theme = 'dark';
  if (settings.playlistOrder !== undefined && !(Array.isArray(settings.playlistOrder) && settings.playlistOrder.every((id) => typeof id === 'string'))) {
    delete settings.playlistOrder;
  }

  return { playlists, sessions: data.sessions, settings };
}
