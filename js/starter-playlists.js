// Circuits livrés avec l'application : circuit d'exemple et circuits par niveau (spécification, sections 2.2 et 4.6).

import { parsePlaylist } from './playlist-import.js';
import { CATALOG_IDS } from './catalog.js';
import { getPlaylists, getSessions, putPlaylist, getMeta, setMeta } from './db.js';

export const EXAMPLE_FILE = 'playlists/exemple.json';
export const STARTER_FILES = [
  'playlists/niveau-1-debutant.json',
  'playlists/niveau-2-intermediaire.json',
  'playlists/niveau-3-avance.json',
];

const SEEDED_KEY = 'starterPlaylistsSeeded';

/** Télécharge, valide et enregistre un circuit livré avec l'application ; renvoie le circuit enregistré. */
export async function loadBundledPlaylist(file) {
  const res = await fetch(file);
  if (!res.ok) throw new Error(`${file} : ${res.status}`);
  const parsed = parsePlaylist(await res.text(), CATALOG_IDS);
  if (!parsed.ok) throw new Error(parsed.errors[0].message);
  const playlist = { ...parsed.playlist, importedAt: Date.now(), deletedAt: null };
  await putPlaylist(playlist);
  return playlist;
}

/**
 * Sans aucun historique (ni circuit, même supprimé, ni séance), pré-charge les circuits par niveau.
 * Une seule fois : les supprimer ensuite ne les fait pas revenir, sauf après « Effacer toutes les données ».
 */
export async function seedStarterPlaylists() {
  if (await getMeta(SEEDED_KEY)) return;
  const [playlists, sessions] = await Promise.all([getPlaylists(), getSessions()]);
  if (playlists.length === 0 && sessions.length === 0) await Promise.all(STARTER_FILES.map(loadBundledPlaylist));
  await setMeta(SEEDED_KEY, true);
}
