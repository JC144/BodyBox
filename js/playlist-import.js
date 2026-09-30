// Analyse et validation d'une playlist JSON (spécification, section 4).
// Fonctions pures : aucun accès au DOM ni au stockage.

import { T } from './strings.js';

export const MAX_BYTES = 100 * 1024;
export const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

const V = T.validation;

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Taille en octets UTF-8 d'un texte. */
export function byteLength(text) {
  return new TextEncoder().encode(text).length;
}

/**
 * Valide le texte d'une playlist.
 * @param {string} text contenu brut
 * @param {Set<string>} catalogIds identifiants des exercices du catalogue
 * @returns {{ ok: true, playlist: object } | { ok: false, errors: {field: string|null, message: string}[] }}
 */
export function parsePlaylist(text, catalogIds) {
  if (byteLength(text) > MAX_BYTES) {
    return { ok: false, errors: [{ field: null, message: V.tooLarge }] };
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, errors: [{ field: null, message: V.invalidJson }] };
  }
  return validatePlaylist(data, catalogIds);
}

/** Texte JSON d'un circuit enregistré, au format de la section 4 : sans les champs propres au stockage. */
export function serializePlaylist(playlist) {
  const { importedAt, deletedAt, ...data } = playlist;
  return `${JSON.stringify(data, null, 2)}\n`;
}

/**
 * Valide un objet playlist déjà analysé et relève toutes les erreurs en une passe.
 * En cas de succès, renvoie une copie ne contenant que les champs connus.
 */
export function validatePlaylist(data, catalogIds) {
  const errors = [];
  const err = (field, message) => errors.push({ field, message });

  if (!isPlainObject(data)) {
    return { ok: false, errors: [{ field: null, message: V.notObject }] };
  }

  if (data.schemaVersion !== 1) err('schemaVersion', V.schemaVersion);

  checkString(data, 'id', 'id', { required: true, pattern: ID_PATTERN, constraint: V.c.id }, err);
  checkString(data, 'name', 'name', { required: true, min: 1, max: 60 }, err);
  checkString(data, 'description', 'description', { required: false, min: 0, max: 200 }, err);

  const exercises = [];
  if (data.exercises === undefined) {
    err('exercises', V.required('exercises'));
  } else if (!Array.isArray(data.exercises)) {
    err('exercises', V.invalid('exercises', V.c.array));
  } else if (data.exercises.length < 1 || data.exercises.length > 50) {
    err('exercises', V.exercisesCount);
  } else {
    data.exercises.forEach((item, i) => {
      const path = `exercises[${i}]`;
      if (!isPlainObject(item)) {
        err(path, V.invalid(path, V.c.object));
        return;
      }
      const before = errors.length;
      const idOk = checkString(item, 'exerciseId', `${path}.exerciseId`, { required: true, pattern: ID_PATTERN, constraint: V.c.id }, err);
      const hasName = item.name !== undefined;
      checkString(item, 'name', `${path}.name`, { required: false, min: 1, max: 60 }, err);
      if (item.targetReps !== undefined && !(Number.isInteger(item.targetReps) && item.targetReps >= 1 && item.targetReps <= 999)) {
        err(`${path}.targetReps`, V.invalid(`${path}.targetReps`, V.c.reps));
      }
      checkString(item, 'note', `${path}.note`, { required: false, min: 0, max: 140 }, err);
      if (idOk && !hasName && !catalogIds.has(item.exerciseId)) {
        err(`${path}.name`, V.unknownExercise(i + 1, item.exerciseId));
      }
      if (errors.length === before) {
        const clean = { exerciseId: item.exerciseId };
        if (hasName) clean.name = item.name;
        if (item.targetReps !== undefined) clean.targetReps = item.targetReps;
        if (item.note !== undefined) clean.note = item.note;
        exercises.push(clean);
      }
    });
  }

  if (errors.length > 0) return { ok: false, errors };

  const playlist = { schemaVersion: 1, id: data.id, name: data.name };
  if (data.description !== undefined) playlist.description = data.description;
  playlist.exercises = exercises;
  return { ok: true, playlist };
}

/** Vérifie un champ texte ; renvoie true s'il est présent et valide. */
function checkString(obj, key, path, rule, err) {
  const value = obj[key];
  if (value === undefined) {
    if (rule.required) err(path, V.required(path));
    return false;
  }
  const constraint = rule.constraint || V.c.text(rule.min, rule.max);
  if (typeof value !== 'string') {
    err(path, V.invalid(path, constraint));
    return false;
  }
  if (rule.pattern) {
    if (!rule.pattern.test(value)) {
      err(path, V.invalid(path, constraint));
      return false;
    }
    return true;
  }
  const len = [...value].length;
  if (len < rule.min || len > rule.max) {
    err(path, V.invalid(path, constraint));
    return false;
  }
  return true;
}
