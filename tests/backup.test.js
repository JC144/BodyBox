import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBackup, parseBackup, backupFileName, isBackupDue } from '../js/backup.js';
import { createSession, validateStep, finishSession } from '../js/session.js';

const playlist = {
  schemaVersion: 1,
  id: 'routine',
  name: 'Routine',
  exercises: [{ exerciseId: 'pompes', targetReps: 10 }, { exerciseId: 'burpees', name: 'Burpees' }],
  importedAt: 1,
  deletedAt: null,
};

function session() {
  const t = new Date(2026, 8, 15, 18).getTime();
  let s = createSession(playlist, t, 'a');
  s = validateStep(s, 10, t + 1000);
  s = validateStep(s, 8, t + 2000);
  return finishSession(s, t + 3000);
}

test('export puis restauration : données identiques (D4)', () => {
  const data = { playlists: [playlist], sessions: [session()], settings: { theme: 'light' } };
  const backup = buildBackup(data, Date.now());
  assert.equal(backup.backupVersion, 1);
  const restored = parseBackup(JSON.stringify(backup));
  assert.deepEqual(restored.playlists, data.playlists);
  assert.deepEqual(restored.sessions, data.sessions);
  assert.deepEqual(restored.settings, data.settings);
});

test('sauvegarde invalide refusée', () => {
  assert.equal(parseBackup('nope'), null);
  assert.equal(parseBackup('{"backupVersion":2,"playlists":[],"sessions":[]}'), null);
  assert.equal(parseBackup(JSON.stringify({ backupVersion: 1, playlists: [{ id: 'x' }], sessions: [] })), null);
  const bad = session();
  bad.entries[0].reps = -1;
  assert.equal(parseBackup(JSON.stringify({ backupVersion: 1, playlists: [], sessions: [bad] })), null);
});

test('nom du fichier de sauvegarde', () => {
  assert.equal(backupFileName(new Date(2026, 8, 29, 10).getTime()), 'body-box-sauvegarde-2026-09-29.json');
});

test('ordre des playlists : conservé s’il est valide, ignoré sinon', () => {
  const wrap = (settings) => JSON.stringify({ backupVersion: 1, playlists: [], sessions: [], settings });
  assert.deepEqual(parseBackup(wrap({ theme: 'dark', playlistOrder: ['b', 'a'] })).settings.playlistOrder, ['b', 'a']);
  assert.equal(parseBackup(wrap({ theme: 'dark', playlistOrder: 'b,a' })).settings.playlistOrder, undefined);
  assert.equal(parseBackup(wrap({ theme: 'dark', playlistOrder: [1, 2] })).settings.playlistOrder, undefined);
});

test('rappel de sauvegarde après 14 jours', () => {
  const day = (d) => new Date(2026, 8, d, 12).getTime();
  const data = { playlists: [{ ...playlist, importedAt: day(1) }], sessions: [] };
  assert.equal(isBackupDue(data, day(10), day(23)), false);
  assert.equal(isBackupDue(data, day(10), day(24)), true);
  // Jamais sauvegardé : le délai part de la donnée la plus ancienne.
  assert.equal(isBackupDue(data, undefined, day(14)), false);
  assert.equal(isBackupDue(data, undefined, day(15)), true);
  // Aucune donnée : rien à sauvegarder.
  assert.equal(isBackupDue({ playlists: [], sessions: [] }, day(1), day(30)), false);
});
