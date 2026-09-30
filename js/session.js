// Logique de séance (spécification, section 3), en fonctions pures.
// Les objets séance ne sont jamais modifiés : chaque opération renvoie une nouvelle séance.

import { dayKey } from './dates.js';

export const REPS_MIN = 0;
export const REPS_MAX = 999;

/**
 * Crée une séance à partir d'une playlist. La liste d'exercices est copiée :
 * une modification ultérieure de la playlist n'affecte pas la séance.
 */
export function createSession(playlist, now, id) {
  return {
    id,
    playlistId: playlist.id,
    playlistName: playlist.name,
    exercises: playlist.exercises.map((e) => {
      const copy = { exerciseId: e.exerciseId, name: e.name ?? null, targetReps: e.targetReps ?? null };
      if (e.note) copy.note = e.note;
      return copy;
    }),
    day: dayKey(now),
    startedAt: now,
    endedAt: null,
    lastActivityAt: now,
    pausedMs: 0,
    durationMs: 0,
    loopsCompleted: 0,
    entries: [],
  };
}

/** Étape en attente : numéro de boucle (à partir de 0) et position dans la playlist. */
export function currentStep(session) {
  const n = session.exercises.length;
  const done = session.entries.length;
  return { loopIndex: Math.floor(done / n), position: done % n };
}

/** Une saisie est valide si c'est un entier entre 0 et 999. */
export function isValidReps(value) {
  if (typeof value === 'string') {
    if (!/^\d{1,3}$/.test(value.trim())) return false;
    value = Number(value.trim());
  }
  return Number.isInteger(value) && value >= REPS_MIN && value <= REPS_MAX;
}

export function clampReps(value) {
  return Math.min(REPS_MAX, Math.max(REPS_MIN, Math.round(value) || 0));
}

/**
 * Valeur proposée pour l'étape en attente.
 * - 1re boucle : objectif de l'exercice, sinon dernière saisie de cet exercice lors de la séance
 *   précédente sur la même playlist, sinon 0.
 * - Boucles suivantes : saisie de la boucle précédente pour la même position.
 */
export function suggestedReps(session, previousSession = null) {
  const { loopIndex, position } = currentStep(session);
  const exercise = session.exercises[position];
  if (loopIndex > 0) {
    const prev = session.entries.find((e) => e.loopIndex === loopIndex - 1 && e.position === position);
    if (prev) return prev.reps;
  }
  if (exercise.targetReps != null) return exercise.targetReps;
  if (previousSession) {
    const entries = previousSession.entries;
    const samePosition = findLast(entries, (e) => e.position === position && e.exerciseId === exercise.exerciseId);
    if (samePosition) return samePosition.reps;
    const sameExercise = findLast(entries, (e) => e.exerciseId === exercise.exerciseId);
    if (sameExercise) return sameExercise.reps;
  }
  return 0;
}

function findLast(arr, pred) {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) return arr[i];
  return undefined;
}

/** Enregistre la saisie de l'étape en attente et passe à la suivante. */
export function validateStep(session, reps, now) {
  if (!isValidReps(reps)) throw new RangeError(`Saisie invalide : ${reps}`);
  const { loopIndex, position } = currentStep(session);
  const entry = {
    loopIndex,
    position,
    exerciseId: session.exercises[position].exerciseId,
    reps: Number(reps),
    validatedAt: now,
  };
  const entries = [...session.entries, entry];
  return {
    ...session,
    entries,
    lastActivityAt: now,
    loopsCompleted: Math.floor(entries.length / session.exercises.length),
  };
}

/** Temps écoulé affiché par le chronomètre, calculé à partir des horodatages. */
export function elapsedMs(session, now) {
  const end = session.endedAt ?? now;
  return Math.max(0, end - session.startedAt - session.pausedMs);
}

/**
 * Reprise après relance de l'application : le temps écoulé depuis la dernière activité
 * est ajouté au temps d'interruption.
 */
export function resumeSession(session, now) {
  const gap = Math.max(0, now - session.lastActivityAt);
  return { ...session, pausedMs: session.pausedMs + gap, lastActivityAt: now };
}

/** Clôture de la séance. */
export function finishSession(session, endedAt) {
  const end = Math.max(endedAt, session.startedAt);
  return {
    ...session,
    endedAt: end,
    durationMs: Math.max(0, end - session.startedAt - session.pausedMs),
    loopsCompleted: Math.floor(session.entries.length / session.exercises.length),
  };
}

/** « Terminer et enregistrer » depuis la fenêtre de reprise : fin = dernière validation. */
export function finishAtLastActivity(session) {
  const last = session.entries.length ? session.entries[session.entries.length - 1].validatedAt : session.startedAt;
  // Une reprise postérieure à la dernière validation a ajouté une interruption qui tombe après
  // l'heure de fin : elle ne fait pas partie de la séance.
  const lateGap = Math.max(0, session.lastActivityAt - last);
  return finishSession({ ...session, pausedMs: Math.max(0, session.pausedMs - lateGap) }, last);
}

export function hasEntries(session) {
  return session.entries.length > 0;
}

export function totalReps(session) {
  return session.entries.reduce((sum, e) => sum + e.reps, 0);
}

/**
 * Récapitulatif : une ligne par position de la playlist, avec les répétitions de chaque boucle,
 * le total et la mention « Record » lorsque la meilleure saisie de la ligne dépasse toutes les
 * saisies antérieures de cet exercice sur la même playlist.
 * @param session séance terminée
 * @param priorSessions séances antérieures de la même playlist
 */
export function summarizeSession(session, priorSessions = []) {
  const loopCount = session.entries.reduce((max, e) => Math.max(max, e.loopIndex + 1), 0);
  const priorBest = new Map();
  for (const s of priorSessions) {
    if (s.id === session.id || s.startedAt >= session.startedAt) continue;
    for (const e of s.entries) {
      priorBest.set(e.exerciseId, Math.max(priorBest.get(e.exerciseId) ?? -1, e.reps));
    }
  }
  const rows = session.exercises.map((exercise, position) => {
    const perLoop = Array.from({ length: loopCount }, () => null);
    for (const e of session.entries) if (e.position === position) perLoop[e.loopIndex] = e.reps;
    const done = perLoop.filter((v) => v !== null);
    const best = done.length ? Math.max(...done) : null;
    const prior = priorBest.get(exercise.exerciseId);
    return {
      position,
      exercise,
      perLoop,
      total: done.reduce((a, b) => a + b, 0),
      best,
      record: best !== null && best > 0 && prior !== undefined && best > prior,
    };
  });
  return {
    durationMs: session.durationMs,
    loopsCompleted: session.loopsCompleted,
    totalReps: totalReps(session),
    loopCount,
    rows,
  };
}

const byStart = (sessions) => [...sessions].sort((a, b) => a.startedAt - b.startedAt);

/**
 * Records par exercice sur un ensemble de séances (détail d'une playlist) :
 * plus grand nombre de boucles de l'exercice et plus grand total de l'exercice sur une séance.
 * `day` est le jour du record le plus récent des deux ; à égalité, la première séance l'emporte.
 * Les exercices jamais saisis sont absents du résultat.
 * @returns {Map<string, { bestLoops: number, bestTotal: number, day: string }>}
 */
export function exerciseRecords(sessions) {
  const records = new Map();
  for (const s of byStart(sessions)) {
    const perSession = new Map();
    for (const e of s.entries) {
      const t = perSession.get(e.exerciseId) ?? { loops: 0, total: 0 };
      perSession.set(e.exerciseId, { loops: t.loops + 1, total: t.total + e.reps });
    }
    for (const [exerciseId, { loops, total }] of perSession) {
      const r = records.get(exerciseId);
      if (!r) records.set(exerciseId, { bestLoops: loops, bestTotal: total, day: s.day });
      else if (loops > r.bestLoops || total > r.bestTotal) {
        records.set(exerciseId, { bestLoops: Math.max(r.bestLoops, loops), bestTotal: Math.max(r.bestTotal, total), day: s.day });
      }
    }
  }
  return records;
}

/** Plus grand nombre de boucles complètes sur une séance, avec son jour ; `null` sans boucle complète. */
export function loopsRecord(sessions) {
  let best = null;
  for (const s of byStart(sessions)) {
    if (s.loopsCompleted > 0 && (!best || s.loopsCompleted > best.loops)) best = { loops: s.loopsCompleted, day: s.day };
  }
  return best;
}
