// Écran d'accueil : choix de la playlist, puis grille de régularité (spécification, section 2.2).

import { h, screenTitle, gearIcon, plusIcon, chevronIcon, installIcon } from '../dom.js';
import { T, formatDayMedium } from '../strings.js';
import { getPlaylists, getSessions, getActiveSession } from '../db.js';
import { getSettings } from '../settings.js';
import { installMode, onInstallChange, promptInstall } from '../install.js';
import { sortPlaylists } from '../playlist-order.js';
import { loadBundledPlaylist, EXAMPLE_FILE } from '../starter-playlists.js';
import { aggregateByDay } from '../scoring.js';
import { dayKey } from '../dates.js';
import { renderGrid } from '../completion-grid.js';
import {
  selectField, selectablePlaylists, playlistLabel, exerciseIdsOf, exerciseNamer, renderIndicators, renderProgress,
} from '../scoring-details.js';
import { toast, openDialog } from '../ui.js';
import { navigate, path } from '../router.js';

// Scoring détaillé : déplié ou non, et playlist choisie ('' = toutes), conservés le temps de l'utilisation.
const detailed = { open: false, playlistId: '' };

/** Aide pas à pas : iOS n'offre pas d'invite d'installation aux sites. */
function showIosInstallHelp() {
  return openDialog({
    title: T.install.iosTitle,
    message: T.install.iosText,
    steps: T.install.iosSteps,
    note: T.install.iosData,
    actions: [{ label: T.install.ok, value: 'ok', kind: 'primary' }],
  });
}

/** Bouton Installer, en haut à droite, visible tant que l'application peut être installée. */
function installButton() {
  const button = h(
    'button',
    {
      type: 'button',
      class: 'btn btn-secondary btn-small install-btn',
      'aria-label': T.install.label,
      onclick: async () => {
        if (installMode() === 'ios') await showIosInstallHelp();
        else await promptInstall();
      },
    },
    installIcon(),
    T.install.button,
  );
  const refresh = () => {
    button.hidden = !installMode();
  };
  refresh();
  return { button, stop: onInstallChange(refresh) };
}

export async function render(root) {
  const [playlists, sessions, active] = await Promise.all([getPlaylists(), getSessions(), getActiveSession()]);
  const settings = getSettings();
  const visible = sortPlaylists(playlists.filter((p) => !p.deletedAt), settings.playlistOrder);

  const lastDay = new Map();
  for (const s of sessions) if ((lastDay.get(s.playlistId) ?? '') < s.day) lastDay.set(s.playlistId, s.day);

  const install = installButton();
  root.append(
    h(
      'header',
      { class: 'screen-head home-head' },
      h('a', { href: '#/settings', class: 'icon-btn', 'aria-label': T.playlists.settings, title: T.playlists.settings }, gearIcon()),
      screenTitle(T.appName),
      install.button,
    ),
  );

  if (active) {
    root.append(
      h(
        'div',
        { class: 'banner' },
        h('p', {}, h('strong', {}, T.playlists.activeBanner), h('br'), active.playlistName),
        h('a', { href: '#/session', class: 'btn btn-secondary btn-small' }, T.playlists.resume),
      ),
    );
  }

  if (visible.length === 0) {
    root.append(
      h(
        'section',
        { class: 'empty stack' },
        h('h2', { class: 'empty-title' }, T.playlists.emptyTitle),
        h('p', { class: 'muted' }, T.playlists.emptyText),
        h('a', { href: '#/editor', class: 'btn btn-primary' }, T.settings.create),
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-secondary',
            onclick: async (e) => {
              const btn = e.currentTarget;
              btn.disabled = true;
              try {
                const playlist = await loadBundledPlaylist(EXAMPLE_FILE);
                navigate(path('playlists', playlist.id));
              } catch {
                toast(T.playlists.exampleError);
              } finally {
                btn.disabled = false;
              }
            },
          },
          T.playlists.loadExample,
        ),
      ),
    );
    return install.stop;
  }

  root.append(
    h(
      'div',
      { class: 'section-head' },
      h('h2', { class: 'section-title' }, T.playlists.title),
      h('a', { href: '#/settings/playlists', class: 'icon-btn icon-btn--end', 'aria-label': T.playlists.add, title: T.playlists.add }, plusIcon()),
    ),
    h(
      'ul',
      { class: 'list', role: 'list' },
      visible.map((p) => {
        const n = p.exercises.length;
        const day = lastDay.get(p.id);
        return h(
          'li',
          {},
          h(
            'a',
            { href: `#${path('playlists', p.id)}`, class: 'row' },
            h('span', { class: 'row-title' }, p.name),
            h(
              'span',
              { class: 'row-meta' },
              `${n} ${T.common.exercises(n)} · `,
              day ? `${T.playlists.lastSession} : ${formatDayMedium(day)}` : T.playlists.never,
            ),
          ),
        );
      }),
    ),
  );

  // Grille de régularité, toutes playlists confondues.
  const today = dayKey(Date.now());
  const names = new Map(playlists.map((p) => [p.id, p.name]));
  const gridSection = h('section', { class: 'section' }, h('h2', { class: 'section-title' }, T.playlists.scoringTitle));
  root.append(gridSection);
  renderGrid(gridSection, aggregateByDay(sessions), today, {
    playlistName: (x) => names.get(x.playlistId) ?? x.playlistName,
  });
  renderDetailedScoring(gridSection, playlists, sessions, today);
  return install.stop;
}

/** Flèche qui déplie, sous la grille, les indicateurs et la courbe de progression. */
function renderDetailedScoring(root, playlists, allSessions, today) {
  const selectable = selectablePlaylists(playlists, allSessions, getSettings().playlistOrder);
  if (!selectable.some((p) => p.id === detailed.playlistId)) detailed.playlistId = '';
  const panel = h('div', { class: 'scoring-details', id: 'scoring-details', hidden: true });
  const toggle = h(
    'button',
    {
      type: 'button',
      class: 'scoring-toggle',
      'aria-label': T.playlists.detailedScoring,
      title: T.playlists.detailedScoring,
      'aria-expanded': 'false',
      'aria-controls': 'scoring-details',
      onclick: () => setOpen(!detailed.open),
    },
    chevronIcon(),
  );

  function draw() {
    const id = detailed.playlistId;
    const chosen = id ? selectable.filter((p) => p.id === id) : selectable;
    const sessions = id ? allSessions.filter((x) => x.playlistId === id) : allSessions;
    const content = h('div', {});
    panel.replaceChildren(
      selectField(
        'details-playlist',
        T.scoring.playlist,
        [{ value: '', label: T.scoring.allPlaylists }, ...selectable.map((p) => ({ value: p.id, label: playlistLabel(p) }))],
        id,
        (value) => {
          detailed.playlistId = value;
          draw();
          panel.querySelector('#details-playlist')?.focus();
        },
      ),
      content,
    );
    const nameOf = exerciseNamer(chosen, sessions);
    renderIndicators(content, sessions, today, nameOf);
    renderProgress(content, exerciseIdsOf(chosen), sessions, today, nameOf, id ? T.scoring.emptyInvite : T.scoring.emptyInviteAll);
  }

  function setOpen(open) {
    detailed.open = open;
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    // Contenu construit une fois visible, pour que la courbe prenne la largeur disponible.
    if (open && !panel.hasChildNodes()) draw();
  }

  root.append(toggle, panel);
  setOpen(detailed.open);
}
