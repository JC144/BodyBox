// Grille de complétion (spécification, section 7.1), affichée sur l'accueil.

import { h } from './dom.js';
import { T, formatDayLong, formatTime, formatDuration, monthInitial } from './strings.js';
import { buildGrid } from './scoring.js';
import { path } from './router.js';

let gridCount = 0;

/**
 * Ajoute la grille à `root` (déjà présent dans le document, pour caler le défilement).
 * Un appui sur une case déroule le détail du jour sous la grille ; un second appui le replie.
 * @param {Map} byDay agrégats par jour (aggregateByDay)
 * @param {string} today
 * @param {object} [o]
 * @param {(session: object) => string} [o.playlistName] affiche la playlist de chaque séance
 */
export function renderGrid(root, byDay, today, { playlistName = null } = {}) {
  const columns = buildGrid(byDay, today);
  const detailId = `day-detail-${++gridCount}`;
  const detail = h('div', { class: 'day-detail', id: detailId, 'aria-live': 'polite', hidden: true });
  let selectedCell = null;

  function collapse() {
    selectedCell?.classList.remove('cell--selected');
    selectedCell?.setAttribute('aria-expanded', 'false');
    selectedCell = null;
    detail.hidden = true;
    detail.replaceChildren();
  }

  function toggleDay(day, cellEl) {
    if (selectedCell === cellEl) {
      collapse();
      return;
    }
    collapse();
    selectedCell = cellEl;
    cellEl.classList.add('cell--selected');
    cellEl.setAttribute('aria-expanded', 'true');
    const agg = byDay.get(day);
    detail.hidden = false;
    detail.replaceChildren(
      h('h3', { class: 'detail-title' }, formatDayLong(day)),
      !agg
        ? h('p', { class: 'muted' }, T.scoring.noSession)
        : h(
            'ul',
            { class: 'list', role: 'list' },
            agg.sessions.map((x) => {
              const reps = x.entries.reduce((n, e) => n + e.reps, 0);
              const line = T.scoring.sessionLine(formatTime(x.startedAt), formatDuration(x.durationMs), x.loopsCompleted, reps);
              const name = playlistName ? playlistName(x) : null;
              return h(
                'li',
                {},
                h(
                  'a',
                  { href: `#${path('sessions', x.id)}`, class: 'row', 'aria-label': `${T.scoring.openSummary} : ${name ? `${name}, ` : ''}${line}` },
                  name && h('span', { class: 'row-title' }, name),
                  h('span', { class: name ? 'row-text' : 'row-title' }, line),
                  h('span', { class: 'row-meta' }, `${T.scoring.openSummary} →`),
                ),
              );
            }),
          ),
    );
  }

  const cells = [];
  const grid = h('div', { class: 'grid', role: 'group', 'aria-label': T.scoring.gridLabel });
  const months = h('div', { class: 'grid-months', 'aria-hidden': 'true' });
  let lastMonth = null;
  for (const col of columns) {
    const month = col.monthStart ? col.monthStart.slice(0, 7) : null;
    const show = month && month !== lastMonth;
    if (show) lastMonth = month;
    months.append(h('span', {}, show ? monthInitial(col.monthStart) : ''));
    for (const c of col.cells) {
      if (c.future) {
        grid.append(h('span', { class: 'cell cell--future', 'aria-hidden': 'true' }));
        continue;
      }
      const btn = h('button', {
        type: 'button',
        class: `cell lvl-${c.level}${c.today ? ' cell--today' : ''}`,
        'aria-label': T.scoring.cellLabel(formatDayLong(c.day), c.loops, c.sessions),
        'aria-expanded': 'false',
        'aria-controls': detailId,
        tabindex: c.today ? '0' : '-1',
        'data-day': c.day,
      });
      btn.addEventListener('click', () => toggleDay(c.day, btn));
      cells.push(btn);
      grid.append(btn);
    }
  }

  // Navigation au clavier dans la grille : un seul arrêt de tabulation, flèches pour se déplacer.
  grid.addEventListener('keydown', (e) => {
    const i = cells.indexOf(document.activeElement);
    if (i < 0) return;
    const delta = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }[e.key];
    if (!delta) return;
    const next = cells[i + delta];
    if (!next) return;
    e.preventDefault();
    cells[i].tabIndex = -1;
    next.tabIndex = 0;
    next.focus();
  });

  const scroller = h(
    'div',
    { class: 'grid-scroll' },
    h(
      'div',
      { class: 'grid-inner' },
      h('span', { class: 'grid-corner' }),
      months,
      h('div', { class: 'grid-days', 'aria-hidden': 'true' }, T.scoring.dayLabels.map((d) => h('span', {}, d))),
      grid,
    ),
  );

  root.append(
    scroller,
    h(
      'div',
      { class: 'legend', 'aria-hidden': 'true' },
      h('span', {}, T.scoring.less),
      [0, 1, 2, 3, 4].map((l) => h('span', { class: `cell lvl-${l}` })),
      h('span', {}, T.scoring.more),
    ),
    detail,
  );
  scroller.scrollLeft = scroller.scrollWidth;
}
