// Détail d'une playlist (spécification, section 2.4).

import { h, backTitle } from '../dom.js';
import { T, formatDayMedium } from '../strings.js';
import { resolveExercise } from '../catalog.js';
import { getPlaylist, getActiveSession, saveActiveSession, getSessionsByPlaylist } from '../db.js';
import { createSession, exerciseRecords, loopsRecord } from '../session.js';
import { illustration } from '../ui.js';
import { navigate } from '../router.js';
import { enterFrom, leaveTo } from '../motion.js';

/** « RECORD · 12 sept. 2026 », puis une ligne par valeur. */
function recordBlock(day, lines) {
  return h(
    'span',
    { class: 'record-block' },
    h('span', { class: 'row-meta' }, h('strong', {}, T.detail.record), ` · ${formatDayMedium(day)}`),
    lines.map((line) => h('span', { class: 'row-meta' }, line)),
  );
}

async function startSession(playlist) {
  const session = createSession(playlist, Date.now(), crypto.randomUUID());
  await saveActiveSession(session);
  // Stockage persistant : demandé au démarrage d'une séance ; un refus n'empêche rien.
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* sans effet */
  }
  navigate('/session');
}

/**
 * Retour à l'accueil par le lien du titre : le circuit file vers la droite en cascade,
 * le titre touché en dernier, puis l'accueil arrive par la gauche.
 */
async function goBack(e, root, parts) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  if (root.inert) return;
  root.inert = true;
  await leaveTo('right', parts, e.currentTarget.closest('h1'));
  // Écran déjà quitté autrement (bouton retour du navigateur pendant la sortie) : rien à faire.
  if (root.isConnected) navigate('/playlists');
}

export async function render(root, [id]) {
  const [playlist, active, sessions] = await Promise.all([getPlaylist(id), getActiveSession(), getSessionsByPlaylist(id)]);

  if (!playlist || playlist.deletedAt) {
    root.append(h('header', { class: 'screen-head' }, backTitle(T.detail.notFound, T.common.home)));
    return;
  }

  const busyElsewhere = active && active.playlistId !== playlist.id;
  const resumable = active && active.playlistId === playlist.id;
  const records = exerciseRecords(sessions);
  const loops = loopsRecord(sessions);

  const header = h(
    'header',
    { class: 'screen-head' },
    backTitle(playlist.name, T.common.home),
    playlist.description && h('p', { class: 'lead' }, playlist.description),
    loops && recordBlock(loops.day, [T.detail.recordLoops(loops.loops)]),
  );
  const list = h(
    'ol',
    { class: 'list exercise-list', role: 'list' },
    playlist.exercises.map((item, i) => {
      const ex = resolveExercise(item);
      const rec = records.get(item.exerciseId);
      return h(
        'li',
        { class: 'exercise-row' },
        illustration(ex.illustration, { still: true, className: 'thumb' }),
        h(
          'span',
          { class: 'exercise-row-text' },
          h('span', { class: 'row-index' }, String(i + 1).padStart(2, '0')),
          h('span', { class: 'row-title' }, ex.name),
          ex.targetReps != null && h('span', { class: 'row-meta' }, T.detail.target(ex.targetReps)),
          rec && recordBlock(rec.day, [T.detail.recordLoops(rec.bestLoops), T.detail.recordTotal(rec.bestTotal)]),
          (ex.description || ex.muscles) &&
            h(
              'details',
              { class: 'exercise-more' },
              h('summary', { class: 'row-meta' }, T.detail.howTo),
              ex.muscles && h('p', { class: 'exercise-muscles' }, ex.muscles),
              ex.description && h('p', {}, ex.description),
            ),
        ),
      );
    }),
  );
  root.append(header, list);

  const actions = h('div', { class: 'screen-actions stack' });
  if (busyElsewhere) {
    actions.append(
      h('p', { class: 'notice', role: 'status' }, T.detail.busy, ' ', h('a', { href: '#/session' }, T.detail.busyLink)),
    );
  }
  actions.append(
    h(
      'button',
      {
        type: 'button',
        class: 'btn btn-primary',
        disabled: Boolean(busyElsewhere),
        onclick: async (e) => {
          e.currentTarget.disabled = true;
          if (resumable) navigate('/session');
          else await startSession(playlist);
        },
      },
      resumable ? T.detail.resume : T.detail.start,
    ),
  );
  root.append(actions);

  // Arrivée en cascade, de haut en bas : titre, description, record, chaque exercice, puis les actions.
  const parts = [...header.children, ...list.children, actions];
  enterFrom('right', parts);
  header.querySelector('a.back').addEventListener('click', (e) => goBack(e, root, parts));
}
