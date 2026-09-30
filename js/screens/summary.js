// Récapitulatif d'une séance (spécification, section 2.6).

import { h, screenTitle, label } from '../dom.js';
import { T, formatClock, formatDayLong, formatTime, formatNumber } from '../strings.js';
import { resolveExercise } from '../catalog.js';
import { getSession, getSessionsByPlaylist } from '../db.js';
import { summarizeSession } from '../session.js';

function figure(value, caption) {
  return h('div', { class: 'figure' }, h('span', { class: 'figure-value' }, value), label(caption));
}

export async function render(root, [id]) {
  const session = await getSession(id);
  if (!session) {
    root.append(
      h('header', { class: 'screen-head' }, screenTitle(T.summary.notFound)),
      h('a', { href: '#/playlists', class: 'btn btn-secondary' }, T.summary.backToPlaylists),
    );
    return;
  }
  const prior = await getSessionsByPlaylist(session.playlistId);
  const sum = summarizeSession(session, prior);

  root.append(
    h(
      'header',
      { class: 'screen-head' },
      h('p', { class: 'label' }, `${formatDayLong(session.day)} · ${formatTime(session.startedAt)}`),
      screenTitle(T.summary.title),
      h('p', { class: 'lead' }, session.playlistName),
    ),
    h(
      'div',
      { class: 'figures' },
      figure(formatClock(sum.durationMs), T.summary.duration),
      figure(String(sum.loopsCompleted), T.summary.loops),
      figure(formatNumber(sum.totalReps), T.summary.reps),
    ),
  );

  const loops = Array.from({ length: sum.loopCount }, (_, i) => i);
  root.append(
    h(
      'div',
      { class: 'table-wrap', role: 'region', 'aria-label': T.summary.title, tabindex: '0' },
      h(
        'table',
        { class: 'table' },
        h(
          'thead',
          {},
          h(
            'tr',
            {},
            h('th', { scope: 'col' }, T.summary.exercise),
            loops.map((i) => h('th', { scope: 'col', class: 'num', title: `${T.session.loop} ${i + 1}` }, T.summary.loopShort(i + 1))),
            h('th', { scope: 'col', class: 'num' }, T.summary.total),
          ),
        ),
        h(
          'tbody',
          {},
          sum.rows.map((row) =>
            h(
              'tr',
              {},
              h(
                'th',
                { scope: 'row' },
                resolveExercise(row.exercise).name,
                row.record && h('span', { class: 'badge' }, T.summary.record),
              ),
              loops.map((i) => h('td', { class: 'num' }, row.perLoop[i] == null ? '–' : String(row.perLoop[i]))),
              h('td', { class: 'num strong' }, String(row.total)),
            ),
          ),
        ),
      ),
    ),
    h(
      'div',
      { class: 'screen-actions stack' },
      h('a', { href: '#/playlists', class: 'btn btn-primary' }, T.summary.backToPlaylists),
    ),
  );
}
