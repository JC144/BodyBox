// Éditeur de circuit (spécification, section 2.9), en fonctions pures : brouillon, validation,
// identifiant d'un nouveau circuit et recherche dans le catalogue.

import { T } from './strings.js';
import { cleanName } from './playlist-order.js';

export const MAX_EXERCISES = 50;
export const DESCRIPTION_MAX = 200;
export const NOTE_MAX = 140;
const ID_MAX = 64;

const E = T.editor.errors;
const length = (s) => [...s].length;

/** Texte sans accents ni majuscules, pour la recherche et les identifiants. */
function fold(text) {
  return String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Identifiant tiré d'un nom : « Haut du corps » → « haut-du-corps ». */
export function slugify(name) {
  const slug = fold(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug.slice(0, ID_MAX - 4).replace(/-+$/, '') || 'circuit';
}

/** Premier identifiant libre parmi `base`, `base-2`, `base-3`… */
export function uniqueId(base, taken) {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) if (!used.has(`${base}-${n}`)) return `${base}-${n}`;
}

/** Brouillon modifiable : les champs de saisie sont des textes. */
export function draftFromPlaylist(playlist = null) {
  return {
    name: playlist?.name ?? '',
    description: playlist?.description ?? '',
    exercises: (playlist?.exercises ?? []).map(draftItem),
  };
}

/** Exercice du brouillon ; le nom propre au circuit, s'il existe, est conservé tel quel. */
export function draftItem(item) {
  const d = { exerciseId: item.exerciseId, targetReps: item.targetReps != null ? String(item.targetReps) : '', note: item.note ?? '' };
  if (item.name !== undefined) d.name = item.name;
  return d;
}

/** Objectif saisi : vide → null, entier de 1 à 999 → nombre, sinon NaN. */
export function parseTarget(text) {
  const t = String(text ?? '').trim();
  if (t === '') return null;
  if (!/^\d{1,3}$/.test(t)) return NaN;
  const n = Number(t);
  return n >= 1 ? n : NaN;
}

/**
 * Vérifie l'objectif et la consigne d'un exercice du brouillon (étape « réglage » de l'ajout).
 * @returns {{ ok: true, exercise: object } | { ok: false, errors: {field: string, message: string}[] }}
 *          `exercise` : l'exercice tel qu'enregistré dans le circuit.
 */
export function checkItem(item) {
  const errors = [];
  const exercise = { exerciseId: item.exerciseId };
  if (item.name !== undefined) exercise.name = item.name;
  const target = parseTarget(item.targetReps);
  if (Number.isNaN(target)) errors.push({ field: 'targetReps', message: E.target });
  else if (target !== null) exercise.targetReps = target;
  const note = String(item.note ?? '').trim();
  if (length(note) > NOTE_MAX) errors.push({ field: 'note', message: E.note });
  else if (note) exercise.note = note;
  return errors.length ? { ok: false, errors } : { ok: true, exercise };
}

/**
 * Construit le circuit à enregistrer à partir du brouillon.
 * @returns {{ ok: true, playlist: object } | { ok: false, errors: {field: string, index?: number, message: string}[] }}
 */
export function buildPlaylist(draft, id) {
  const errors = [];
  const name = cleanName(draft.name);
  if (name === null) errors.push({ field: 'name', message: E.name });
  const description = String(draft.description ?? '').trim();
  if (length(description) > DESCRIPTION_MAX) errors.push({ field: 'description', message: E.description });

  if (draft.exercises.length === 0) errors.push({ field: 'exercises', message: E.empty });
  if (draft.exercises.length > MAX_EXERCISES) errors.push({ field: 'exercises', message: E.tooMany });

  const exercises = draft.exercises.map((item, index) => {
    const res = checkItem(item);
    if (res.ok) return res.exercise;
    for (const e of res.errors) errors.push({ ...e, index, message: E.item(index + 1, e.message) });
    return null;
  });

  if (errors.length) return { ok: false, errors };
  const playlist = { schemaVersion: 1, id, name };
  if (description) playlist.description = description;
  playlist.exercises = exercises;
  return { ok: true, playlist };
}

/** Deux brouillons décrivent-ils le même circuit ? (sert à détecter les modifications non enregistrées) */
export function sameDraft(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Exercices du catalogue correspondant à la recherche : chaque mot doit figurer dans le nom,
 * les muscles ou le code, sans tenir compte des accents ni des majuscules.
 */
export function searchCatalog(catalog, query) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...catalog];
  return catalog.filter((e) => {
    const text = fold(`${e.name} ${e.muscles} ${e.code ?? ''}`);
    return words.every((w) => text.includes(w));
  });
}
