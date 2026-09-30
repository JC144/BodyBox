// Indicateurs, records et courbe de progression (spécification, sections 7.2 et 7.3),
// affichés dans le scoring détaillé de l'accueil.

import { h, label } from './dom.js';
import { T, formatDayMedium, formatDayShort, formatClock, formatNumber } from './strings.js';
import { getCatalogEntry, resolveExercise } from './catalog.js';
import { addDays } from './dates.js';
import { indicators, progressSeries, chartPoints, RANGES } from './scoring.js';
import { sortPlaylists } from './playlist-order.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, String(v));
  for (const c of children) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

function figure(value, caption) {
  return h('div', { class: 'figure' }, h('span', { class: 'figure-value' }, value), label(caption));
}

export function selectField(id, text, options, value, onchange) {
  return h(
    'div',
    { class: 'field' },
    h('label', { for: id, class: 'label' }, text),
    h(
      'select',
      { id, class: 'select', onchange: (e) => onchange(e.target.value) },
      options.map((o) => h('option', { value: o.value, selected: o.value === value }, o.label)),
    ),
  );
}

/** Playlists sélectionnables : actives dans l'ordre choisi, puis supprimées dont l'historique est conservé. */
export function selectablePlaylists(playlists, sessions, order) {
  const withHistory = new Set(sessions.map((x) => x.playlistId));
  return [
    ...sortPlaylists(playlists.filter((p) => !p.deletedAt), order),
    ...sortPlaylists(playlists.filter((p) => p.deletedAt && withHistory.has(p.id))),
  ];
}

export const playlistLabel = (p) => (p.deletedAt ? `${p.name} (${T.common.deleted})` : p.name);

/** Exercices des playlists données, sans doublon, dans l'ordre. */
export function exerciseIdsOf(playlists) {
  return [...new Set(playlists.flatMap((p) => p.exercises.map((e) => e.exerciseId)))];
}

/** Nom d'un exercice : playlists actuelles, puis copies des séances, puis catalogue. */
export function exerciseNamer(playlists, sessions) {
  const names = new Map();
  for (const x of sessions) for (const e of x.exercises) if (!names.has(e.exerciseId)) names.set(e.exerciseId, resolveExercise(e).name);
  for (const p of playlists) for (const e of p.exercises) names.set(e.exerciseId, resolveExercise(e).name);
  return (id) => names.get(id) || getCatalogEntry(id)?.name || id;
}

// ---------- Indicateurs ----------

export function renderIndicators(root, sessions, today, nameOf) {
  const ind = indicators(sessions, today);
  const records = [...ind.records.values()].sort((a, b) => nameOf(a.exerciseId).localeCompare(nameOf(b.exerciseId), 'fr'));
  root.append(
    h(
      'section',
      { class: 'section' },
      h(
        'div',
        { class: 'figures figures--2' },
        figure(String(ind.currentStreak), T.scoring.streak),
        figure(String(ind.bestStreak), T.scoring.bestStreak),
        figure(formatNumber(ind.sessions), T.scoring.sessions),
        figure(formatNumber(ind.loops), T.scoring.loops),
        figure(formatClock(ind.durationMs), T.scoring.time),
      ),
      h('h2', { class: 'section-title' }, T.scoring.records),
      records.length === 0
        ? h('p', { class: 'muted' }, T.scoring.noRecords)
        : h(
            'ul',
            { class: 'list', role: 'list' },
            records.map((r) =>
              h(
                'li',
                { class: 'record' },
                h('span', { class: 'record-name' }, nameOf(r.exerciseId), h('span', { class: 'row-meta' }, formatDayMedium(r.day))),
                h('span', { class: 'record-value' }, String(r.reps)),
              ),
            ),
          ),
    ),
  );
}

// ---------- Courbe de progression ----------

/**
 * @param {string[]} exerciseIds exercices proposés dans le sélecteur, dans l'ordre
 * @param {string} emptyText message affiché tant qu'aucune séance n'existe
 */
export function renderProgress(root, exerciseIds, sessions, today, nameOf, emptyText) {
  const section = h('section', { class: 'section' }, h('h2', { class: 'section-title' }, T.scoring.progress));
  root.append(section);
  if (sessions.length === 0 || exerciseIds.length === 0) {
    section.append(h('p', { class: 'muted' }, emptyText));
    return;
  }

  const state = { exerciseId: exerciseIds[0], measure: 'total', range: 30 };
  const chartBox = h('div', { class: 'chart' });
  const output = h('p', { class: 'chart-output', 'aria-live': 'polite' });

  section.append(
    h(
      'div',
      { class: 'controls' },
      selectField('chart-exercise', T.scoring.exercise, exerciseIds.map((id) => ({ value: id, label: nameOf(id) })), state.exerciseId, (v) => {
        state.exerciseId = v;
        draw();
      }),
      selectField(
        'chart-measure',
        T.scoring.measure,
        [
          { value: 'total', label: T.scoring.measureTotal },
          { value: 'best', label: T.scoring.measureBest },
        ],
        state.measure,
        (v) => {
          state.measure = v;
          draw();
        },
      ),
      selectField('chart-range', T.scoring.range, RANGES.map((n) => ({ value: String(n), label: T.scoring.rangeDays(n) })), String(state.range), (v) => {
        state.range = Number(v);
        draw();
      }),
    ),
    chartBox,
    output,
  );

  function draw() {
    output.textContent = '';
    const series = progressSeries(sessions, state.exerciseId, state.measure, state.range, today);
    if (series.length === 0) {
      chartBox.replaceChildren(h('p', { class: 'muted chart-empty' }, T.scoring.emptyRange));
      return;
    }
    const width = Math.max(280, Math.round(chartBox.clientWidth || root.clientWidth || 340));
    const height = 200;
    const pad = { padLeft: 36, padRight: 14, padTop: 14, padBottom: 26 };
    const { points, scale } = chartPoints(series, { width, height, ...pad, rangeDays: state.range, today });

    const svg = s('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'group', 'aria-label': T.scoring.chartLabel(nameOf(state.exerciseId)) });
    const axis = s('g', { class: 'chart-axis', 'aria-hidden': 'true' });
    for (let v = 0; v <= scale.max; v += scale.step) {
      const y = pad.padTop + (height - pad.padTop - pad.padBottom) * (1 - v / scale.max);
      axis.append(
        s('line', { x1: pad.padLeft, x2: width - pad.padRight, y1: y, y2: y, class: v === 0 ? 'chart-base' : 'chart-grid' }),
        s('text', { x: pad.padLeft - 8, y: y + 4, 'text-anchor': 'end' }, String(v)),
      );
    }
    const from = addDays(today, -(state.range - 1));
    axis.append(
      s('text', { x: pad.padLeft, y: height - 6, 'text-anchor': 'start' }, formatDayShort(from)),
      s('text', { x: width - pad.padRight, y: height - 6, 'text-anchor': 'end' }, formatDayShort(today)),
    );
    svg.append(axis);

    if (points.length > 1) {
      svg.append(s('polyline', { class: 'chart-line', points: points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') }));
    }
    let selected = null;
    for (const p of points) {
      const dot = s('circle', { class: 'chart-dot', cx: p.x, cy: p.y, r: 4.5 });
      const text = T.scoring.point(formatDayMedium(p.day), p.value);
      const hit = s('circle', { class: 'chart-hit', cx: p.x, cy: p.y, r: 16, tabindex: 0, role: 'button', 'aria-label': text });
      const pick = () => {
        selected?.classList.remove('chart-dot--on');
        selected = dot;
        dot.classList.add('chart-dot--on');
        output.textContent = text;
      };
      hit.addEventListener('click', pick);
      hit.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick();
        }
      });
      svg.append(dot, hit);
    }
    chartBox.replaceChildren(svg);
  }
  draw();
}
