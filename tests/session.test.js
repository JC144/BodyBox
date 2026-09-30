import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSession, currentStep, validateStep, suggestedReps, isValidReps, elapsedMs,
  resumeSession, finishSession, finishAtLastActivity, summarizeSession, totalReps, exerciseRecords, loopsRecord,
} from '../js/session.js';

const MIN = 60000;
const T0 = new Date(2026, 8, 15, 18, 0, 0).getTime();

const playlist = {
  id: 'routine',
  name: 'Routine',
  exercises: [
    { exerciseId: 'pompes', targetReps: 15 },
    { exerciseId: 'abdominaux' },
    { exerciseId: 'burpees', name: 'Burpees' },
    { exerciseId: 'kettlebell-swing', targetReps: 15, note: '12 kg' },
    { exerciseId: 'hand-gripper' },
  ],
};

let seq = 0;
const start = (now = T0) => createSession(playlist, now, `id-${seq++}`);

function run(session, repsList, stepMs = 30000) {
  let s = session;
  let t = s.lastActivityAt;
  for (const r of repsList) {
    t += stepMs;
    s = validateStep(s, r, t);
  }
  return s;
}

test('démarrage : 1er exercice, boucle 1, chronomètre à 0 (B1)', () => {
  const s = start();
  assert.deepEqual(currentStep(s), { loopIndex: 0, position: 0 });
  assert.equal(s.loopsCompleted, 0);
  assert.equal(elapsedMs(s, T0), 0);
  assert.equal(s.day, '2026-09-15');
  assert.equal(s.endedAt, null);
});

test('la séance copie la liste des exercices', () => {
  const p = structuredClone(playlist);
  const s = createSession(p, T0, 'x');
  p.exercises.pop();
  assert.equal(s.exercises.length, 5);
  assert.equal(s.exercises[3].note, '12 kg');
});

test('progression et passage de boucle (B2, B3)', () => {
  let s = run(start(), [10, 11]);
  assert.deepEqual(currentStep(s), { loopIndex: 0, position: 2 });
  s = run(s, [12, 13, 14]);
  assert.deepEqual(currentStep(s), { loopIndex: 1, position: 0 });
  assert.equal(s.loopsCompleted, 1);
  assert.equal(s.entries[4].exerciseId, 'hand-gripper');
});

test('valeur proposée : objectif, séance précédente, puis 0', () => {
  const prev = run(start(T0 - 86400000), [9, 22, 7, 16, 31]);
  let s = start();
  assert.equal(suggestedReps(s, prev), 15); // objectif
  s = run(s, [10]);
  assert.equal(suggestedReps(s, prev), 22); // séance précédente
  assert.equal(suggestedReps(s, null), 0); // rien
});

test('valeur proposée aux boucles suivantes = saisie de la boucle précédente (B4)', () => {
  let s = run(start(), [12, 20, 5, 15, 30]);
  assert.equal(suggestedReps(s), 12);
  s = run(s, [12]);
  assert.equal(suggestedReps(s), 20);
});

test('saisie : 0 accepté, vide ou hors limites refusé (B5, B6)', () => {
  assert.equal(isValidReps(0), true);
  assert.equal(isValidReps('0'), true);
  assert.equal(isValidReps(999), true);
  assert.equal(isValidReps(''), false);
  assert.equal(isValidReps('1000'), false);
  assert.equal(isValidReps(-1), false);
  assert.equal(isValidReps(2.5), false);
  assert.equal(isValidReps('12a'), false);
  const s = run(start(), [0]);
  assert.equal(s.entries[0].reps, 0);
  assert.throws(() => validateStep(s, 1000, T0));
});

test('boucle entamée non comptée, saisies conservées (B7)', () => {
  const reps = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1, 2, 3];
  const s = finishSession(run(start(), reps), T0 + 20 * MIN);
  const sum = summarizeSession(s);
  assert.equal(sum.loopsCompleted, 2);
  assert.equal(sum.totalReps, 106);
  assert.equal(totalReps(s), 106);
  assert.equal(sum.loopCount, 3);
  assert.deepEqual(sum.rows[3].perLoop, [10, 10, null]);
});

test('le temps est calculé par horodatage, arrière-plan compris (B8)', () => {
  const s = start();
  assert.equal(elapsedMs(s, T0 + 7 * MIN), 7 * MIN);
});

test('reprise après relance : l’absence est exclue de la durée (B9)', () => {
  let s = run(start(), [10, 10, 10], MIN); // dernière validation à T0 + 3 min
  s = resumeSession(s, T0 + 63 * MIN);
  assert.equal(s.pausedMs, 60 * MIN);
  assert.deepEqual(currentStep(s), { loopIndex: 0, position: 3 });
  assert.equal(elapsedMs(s, T0 + 63 * MIN), 3 * MIN);
  s = validateStep(s, 10, T0 + 64 * MIN);
  const done = finishSession(s, T0 + 64 * MIN);
  assert.equal(done.durationMs, 4 * MIN);
});

test('terminer et enregistrer : fin = dernière validation', () => {
  const s = run(start(), [10, 10], MIN);
  const done = finishAtLastActivity(s);
  assert.equal(done.endedAt, T0 + 2 * MIN);
  assert.equal(done.durationMs, 2 * MIN);
});

test('terminer et enregistrer après une reprise sans nouvelle saisie', () => {
  let s = run(start(), [10, 10], MIN); // dernière validation à T0 + 2 min
  s = resumeSession(s, T0 + 62 * MIN); // relance 1 h plus tard, puis nouvelle fermeture
  s = resumeSession(s, T0 + 63 * MIN);
  const done = finishAtLastActivity(s);
  assert.equal(done.endedAt, T0 + 2 * MIN);
  assert.equal(done.durationMs, 2 * MIN);
  // Avec une saisie après la reprise, l'absence reste exclue.
  let t = resumeSession(run(start(), [10, 10], MIN), T0 + 62 * MIN);
  t = validateStep(t, 5, T0 + 63 * MIN);
  assert.equal(finishAtLastActivity(t).durationMs, 3 * MIN);
});

test('séance à cheval sur minuit rattachée au jour de début (B11)', () => {
  const t = new Date(2026, 8, 15, 23, 50).getTime();
  let s = createSession(playlist, t, 'n');
  s = run(s, [1, 2, 3], 10 * MIN);
  s = finishSession(s, t + 30 * MIN);
  assert.equal(s.day, '2026-09-15');
  assert.equal(s.durationMs, 30 * MIN);
});

test('records : meilleure saisie supérieure à toutes les saisies antérieures', () => {
  const prev = finishSession(run(start(T0 - 86400000), [15, 20, 5, 15, 30]), T0 - 86400000 + 10 * MIN);
  const cur = finishSession(run(start(), [16, 20, 4, 15, 31, 12]), T0 + 10 * MIN);
  const sum = summarizeSession(cur, [prev]);
  assert.deepEqual(sum.rows.map((r) => r.record), [true, false, false, false, true]);
  // Sans historique, pas de mention « Record ».
  assert.equal(summarizeSession(cur, []).rows.some((r) => r.record), false);
});

test('records par exercice : plus de boucles, meilleur total sur une séance et jour du dernier record', () => {
  const a = finishSession(run(start(T0 - 86400000), [15, 20, 5, 15, 30, 18, 10]), T0 - 86400000 + 10 * MIN);
  const b = finishSession(run(start(), [16, 12, 4, 15, 31]), T0 + 10 * MIN);
  // Ordre indifférent : les séances sont parcourues chronologiquement.
  const rec = exerciseRecords([b, a]);
  assert.deepEqual(rec.get('pompes'), { bestLoops: 2, bestTotal: 33, day: a.day });
  assert.deepEqual(rec.get('abdominaux'), { bestLoops: 2, bestTotal: 30, day: a.day });
  // Égalité (1 boucle, 15) : le record reste daté de la première séance.
  assert.deepEqual(rec.get('kettlebell-swing'), { bestLoops: 1, bestTotal: 15, day: a.day });
  assert.deepEqual(rec.get('hand-gripper'), { bestLoops: 1, bestTotal: 31, day: b.day });
  assert.equal(exerciseRecords([]).size, 0);
});

test('record de boucles de la playlist', () => {
  const a = finishSession(run(start(T0 - 86400000), [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]), T0 - 86400000 + 10 * MIN);
  const b = finishSession(run(start(), [1, 1, 1, 1, 1, 1]), T0 + 10 * MIN);
  assert.deepEqual(loopsRecord([b, a]), { loops: 2, day: a.day });
  assert.equal(loopsRecord([finishSession(run(start(), [1, 1]), T0 + MIN)]), null);
});
