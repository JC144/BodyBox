import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  levelFor, aggregateByDay, currentStreak, bestStreak, indicators, buildGrid,
  progressSeries, niceScale, chartPoints, latestSession, GRID_WEEKS,
} from '../js/scoring.js';
import { dayKey, addDays, weekdayMon0 } from '../js/dates.js';
import { createSession, validateStep, finishSession } from '../js/session.js';

const playlist = { id: 'p', name: 'P', exercises: [{ exerciseId: 'pompes' }, { exerciseId: 'abdominaux' }] };

let seq = 0;
function makeSession(day, loops, reps = [10, 20], hour = 18) {
  const [y, m, d] = day.split('-').map(Number);
  const t0 = new Date(y, m - 1, d, hour, 0).getTime();
  let s = createSession(playlist, t0, `s${seq++}`);
  let t = t0;
  for (let i = 0; i < loops; i++) for (const r of reps) s = validateStep(s, r, (t += 60000));
  return finishSession(s, t);
}

test("niveaux d'intensité", () => {
  assert.equal(levelFor(0, 0), 0);
  assert.equal(levelFor(1, 0), 1);
  assert.equal(levelFor(1, 1), 1);
  assert.equal(levelFor(1, 2), 2);
  assert.equal(levelFor(1, 3), 3);
  assert.equal(levelFor(2, 4), 3);
  assert.equal(levelFor(1, 5), 4);
  assert.equal(levelFor(3, 12), 4);
});

test('agrégat par jour : deux séances de 2 et 3 boucles → niveau 4 (C2)', () => {
  const byDay = aggregateByDay([makeSession('2026-09-29', 2, [1, 1], 9), makeSession('2026-09-29', 3, [1, 1], 19)]);
  const d = byDay.get('2026-09-29');
  assert.equal(d.sessions.length, 2);
  assert.equal(d.loops, 5);
  assert.equal(d.reps, 10);
  assert.equal(levelFor(d.sessions.length, d.loops), 4);
});

test('série en cours depuis hier si aujourd’hui est vide (C4)', () => {
  // Lundi 21, mardi 22, mercredi 23 septembre 2026 ; aujourd'hui jeudi 24.
  const days = new Set(['2026-09-21', '2026-09-22', '2026-09-23']);
  assert.equal(currentStreak(days, '2026-09-24'), 3);
  assert.equal(currentStreak(days, '2026-09-23'), 3);
});

test('série rompue et meilleure série (C5)', () => {
  const days = new Set(['2026-09-21', '2026-09-22', '2026-09-23']);
  assert.equal(currentStreak(days, '2026-09-25'), 0);
  assert.equal(bestStreak(days), 3);
  assert.equal(bestStreak(new Set(['2026-01-01', '2026-01-03', '2026-01-04'])), 2);
  assert.equal(bestStreak(new Set()), 0);
  // Changement d'heure (29 mars 2026) : les jours restent consécutifs.
  assert.equal(bestStreak(new Set(['2026-03-28', '2026-03-29', '2026-03-30'])), 3);
  assert.equal(bestStreak(new Set(['2026-10-24', '2026-10-25', '2026-10-26'])), 3);
});

test('changement de jour à minuit', () => {
  const beforeMidnight = new Date(2026, 8, 15, 23, 59, 59).getTime();
  assert.equal(dayKey(beforeMidnight), '2026-09-15');
  assert.equal(dayKey(beforeMidnight + 1000), '2026-09-16');
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
});

test('indicateurs', () => {
  const sessions = [
    makeSession('2026-09-21', 2, [10, 20]),
    makeSession('2026-09-22', 1, [25, 20]),
    makeSession('2026-09-22', 1, [12, 30]),
  ];
  const ind = indicators(sessions, '2026-09-22');
  assert.equal(ind.currentStreak, 2);
  assert.equal(ind.bestStreak, 2);
  assert.equal(ind.sessions, 3);
  assert.equal(ind.loops, 4);
  assert.equal(ind.durationMs, 8 * 60000);
  assert.deepEqual(ind.records.get('pompes'), { exerciseId: 'pompes', reps: 25, day: '2026-09-22' });
  assert.deepEqual(ind.records.get('abdominaux'), { exerciseId: 'abdominaux', reps: 30, day: '2026-09-22' });
  const empty = indicators([], '2026-09-22');
  assert.equal(empty.sessions + empty.loops + empty.currentStreak + empty.bestStreak, 0);
});

test('grille : 53 semaines, lundi en haut, semaine en cours en dernier, futur marqué (C1)', () => {
  const today = '2026-09-24'; // jeudi
  const byDay = aggregateByDay([makeSession(today, 3)]);
  const grid = buildGrid(byDay, today);
  assert.equal(grid.length, GRID_WEEKS);
  for (const col of grid) {
    assert.equal(col.cells.length, 7);
    assert.equal(weekdayMon0(col.cells[0].day), 0);
  }
  const last = grid[GRID_WEEKS - 1];
  assert.equal(last.monday, '2026-09-21');
  const cell = last.cells[3];
  assert.equal(cell.day, today);
  assert.equal(cell.today, true);
  assert.equal(cell.level, 3);
  assert.deepEqual(last.cells.map((c) => c.future), [false, false, false, false, true, true, true]);
});

test('courbe de progression : total du jour ou meilleure saisie, sur la période', () => {
  const sessions = [
    makeSession('2026-09-01', 2, [10, 20]),
    makeSession('2026-09-20', 2, [12, 20], 8),
    makeSession('2026-09-20', 1, [15, 20], 19),
    makeSession('2025-01-01', 1, [99, 20]),
  ];
  assert.deepEqual(progressSeries(sessions, 'pompes', 'total', 30, '2026-09-29'), [
    { day: '2026-09-01', value: 20 },
    { day: '2026-09-20', value: 39 },
  ]);
  assert.deepEqual(progressSeries(sessions, 'pompes', 'best', 30, '2026-09-29'), [
    { day: '2026-09-01', value: 10 },
    { day: '2026-09-20', value: 15 },
  ]);
  assert.equal(progressSeries(sessions, 'pompes', 'total', 365, '2026-09-29').length, 2);
  assert.equal(progressSeries(sessions, 'burpees', 'total', 365, '2026-09-29').length, 0);
});

test('échelle et points de la courbe', () => {
  assert.deepEqual(niceScale(0), { max: 4, step: 1 });
  assert.deepEqual(niceScale(37), { max: 40, step: 10 });
  assert.deepEqual(niceScale(3), { max: 3, step: 1 });
  const { points } = chartPoints([{ day: '2026-09-29', value: 10 }], {
    width: 300, height: 200, padLeft: 30, padRight: 10, padTop: 10, padBottom: 20, rangeDays: 30, today: '2026-09-29',
  });
  assert.equal(points.length, 1);
  assert.equal(points[0].x, 290);
});

test('séance la plus récente', () => {
  const a = makeSession('2026-09-01', 1);
  const b = makeSession('2026-09-10', 1);
  assert.equal(latestSession([b, a]).id, b.id);
  assert.equal(latestSession([]), null);
});
