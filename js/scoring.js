// Agrégats du scoring (spécification, section 7), en fonctions pures.

import { addDays, diffDays, startOfWeek } from './dates.js';

/**
 * Seuils d'intensité de la grille, en boucles complètes du jour.
 * Niveau 1 : au moins une séance (quel que soit le nombre de boucles).
 */
export const LEVEL_THRESHOLDS = [
  { level: 4, minLoops: 5 },
  { level: 3, minLoops: 3 },
  { level: 2, minLoops: 2 },
];

export const GRID_WEEKS = 53;
export const RANGES = [30, 90, 365];

export function levelFor(sessionCount, loops) {
  if (sessionCount === 0) return 0;
  for (const t of LEVEL_THRESHOLDS) if (loops >= t.minLoops) return t.level;
  return 1;
}

/** Regroupe les séances par jour : { sessions, loops, reps, durationMs }. */
export function aggregateByDay(sessions) {
  const days = new Map();
  for (const s of sessions) {
    let d = days.get(s.day);
    if (!d) {
      d = { day: s.day, sessions: [], loops: 0, reps: 0, durationMs: 0 };
      days.set(s.day, d);
    }
    d.sessions.push(s);
    d.loops += s.loopsCompleted;
    d.durationMs += s.durationMs;
    for (const e of s.entries) d.reps += e.reps;
  }
  for (const d of days.values()) d.sessions.sort((a, b) => a.startedAt - b.startedAt);
  return days;
}

/**
 * Série en cours : jours consécutifs avec séance en remontant depuis aujourd'hui,
 * ou depuis hier si aujourd'hui est sans séance.
 */
export function currentStreak(daySet, today) {
  let day = daySet.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (daySet.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/** Plus longue suite de jours consécutifs avec séance. */
export function bestStreak(daySet) {
  const days = [...daySet].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of days) {
    run = prev !== null && diffDays(prev, d) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

/** Indicateurs globaux d'une playlist. */
export function indicators(sessions, today) {
  const daySet = new Set(sessions.map((s) => s.day));
  const records = new Map();
  for (const s of sessions) {
    for (const e of s.entries) {
      const r = records.get(e.exerciseId);
      if (!r || e.reps > r.reps || (e.reps === r.reps && s.day < r.day)) {
        records.set(e.exerciseId, { exerciseId: e.exerciseId, reps: e.reps, day: s.day });
      }
    }
  }
  return {
    currentStreak: currentStreak(daySet, today),
    bestStreak: bestStreak(daySet),
    sessions: sessions.length,
    loops: sessions.reduce((n, s) => n + s.loopsCompleted, 0),
    durationMs: sessions.reduce((n, s) => n + s.durationMs, 0),
    records,
  };
}

/**
 * Grille de complétion : GRID_WEEKS colonnes (semaines, la dernière est la semaine en cours),
 * 7 cases par colonne, lundi en premier. Les jours futurs sont marqués `future`.
 */
export function buildGrid(byDay, today, weeks = GRID_WEEKS) {
  const firstMonday = addDays(startOfWeek(today), -7 * (weeks - 1));
  const columns = [];
  for (let w = 0; w < weeks; w++) {
    const monday = addDays(firstMonday, 7 * w);
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(monday, i);
      const agg = byDay.get(day);
      const sessionCount = agg ? agg.sessions.length : 0;
      const loops = agg ? agg.loops : 0;
      cells.push({
        day,
        future: day > today,
        today: day === today,
        sessions: sessionCount,
        loops,
        level: levelFor(sessionCount, loops),
      });
    }
    // Repère de mois : sur la colonne contenant le 1er du mois.
    const monthStart = cells.find((c) => c.day.endsWith('-01'));
    columns.push({ monday, cells, monthStart: w === 0 ? cells[0].day : monthStart ? monthStart.day : null });
  }
  return columns;
}

/**
 * Série de la courbe de progression : un point par jour avec au moins une saisie de l'exercice,
 * sur les `rangeDays` derniers jours (aujourd'hui compris).
 * @param measure 'total' (somme du jour) ou 'best' (plus haute saisie du jour)
 */
export function progressSeries(sessions, exerciseId, measure, rangeDays, today) {
  const from = addDays(today, -(rangeDays - 1));
  const byDay = new Map();
  for (const s of sessions) {
    if (s.day < from || s.day > today) continue;
    for (const e of s.entries) {
      if (e.exerciseId !== exerciseId) continue;
      const cur = byDay.get(s.day);
      if (measure === 'best') byDay.set(s.day, cur === undefined ? e.reps : Math.max(cur, e.reps));
      else byDay.set(s.day, (cur ?? 0) + e.reps);
    }
  }
  return [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([day, value]) => ({ day, value }));
}

/** Graduation de l'axe des ordonnées : maximum « rond » et pas des graduations, à partir de 0. */
export function niceScale(maxValue, ticks = 4) {
  if (maxValue <= 0) return { max: ticks, step: 1 };
  const raw = maxValue / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const s = Math.max(1, step);
  return { max: Math.ceil(maxValue / s) * s, step: s };
}

/**
 * Coordonnées des points de la courbe. Abscisse proportionnelle au temps sur la période,
 * ordonnée proportionnelle aux répétitions à partir de 0.
 */
export function chartPoints(series, { width, height, padLeft, padRight, padTop, padBottom, rangeDays, today }) {
  const scale = niceScale(series.reduce((m, p) => Math.max(m, p.value), 0));
  const from = addDays(today, -(rangeDays - 1));
  const span = Math.max(1, rangeDays - 1);
  const w = width - padLeft - padRight;
  const h = height - padTop - padBottom;
  const points = series.map((p) => ({
    ...p,
    x: padLeft + (diffDays(from, p.day) / span) * w,
    y: padTop + h - (p.value / scale.max) * h,
  }));
  return { points, scale };
}

/** Séance la plus récente (pour présélectionner la playlist du scoring). */
export function latestSession(sessions) {
  let latest = null;
  for (const s of sessions) if (!latest || s.startedAt > latest.startedAt) latest = s;
  return latest;
}
