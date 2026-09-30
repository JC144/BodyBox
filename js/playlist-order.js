// Ordre d'affichage et renommage des playlists (spécification, section 2.8), en fonctions pures.

export const NAME_MAX = 60;

/**
 * Trie les playlists selon l'ordre choisi par l'utilisateur (liste d'identifiants).
 * Les playlists absentes de cet ordre (importées depuis) suivent, par nom.
 */
export function sortPlaylists(playlists, order = []) {
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...playlists].sort((a, b) => {
    const ra = rank.get(a.id) ?? Infinity;
    const rb = rank.get(b.id) ?? Infinity;
    if (ra !== rb) return ra < rb ? -1 : 1;
    return a.name.localeCompare(b.name, 'fr');
  });
}

/** Déplace `id` de `delta` positions dans `ids` ; renvoie une nouvelle liste (inchangée hors bornes). */
export function moveId(ids, id, delta) {
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ids.length) return [...ids];
  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}

/** Nom de playlist saisi : espaces de bord retirés, 1 à 60 caractères. Renvoie null si invalide. */
export function cleanName(text) {
  const name = String(text ?? '').trim();
  const len = [...name].length;
  return len >= 1 && len <= NAME_MAX ? name : null;
}
