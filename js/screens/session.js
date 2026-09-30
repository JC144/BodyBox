// Séance en cours (spécification, sections 2.5 et 3).

import { h } from '../dom.js';
import { T, formatClock } from '../strings.js';
import { resolveExercise } from '../catalog.js';
import { getActiveSession, saveActiveSession, clearActiveSession, commitSession, getSessionsByPlaylist } from '../db.js';
import {
  currentStep, suggestedReps, validateStep, isValidReps, clampReps, elapsedMs, finishSession, hasEntries,
} from '../session.js';
import { latestSession } from '../scoring.js';
import { illustration, openDialog } from '../ui.js';
import { navigate, path } from '../router.js';

/** Bouton − / + : un appui modifie la valeur de 1, un appui maintenu répète l'action. */
function holdToRepeat(button, step) {
  let delay = null;
  let repeat = null;
  let fromPointer = false;
  const stop = () => {
    clearTimeout(delay);
    clearInterval(repeat);
    delay = repeat = null;
  };
  button.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    fromPointer = true;
    step();
    delay = setTimeout(() => {
      repeat = setInterval(step, 70);
    }, 400);
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) button.addEventListener(type, stop);
  // Clavier et technologies d'assistance : un clic sans pointeur.
  button.addEventListener('click', () => {
    if (fromPointer) fromPointer = false;
    else step();
  });
  button.addEventListener('contextmenu', (e) => e.preventDefault());
  return stop;
}

export async function render(root) {
  let session = await getActiveSession();
  if (!session) {
    navigate('/playlists', { replace: true });
    return;
  }
  const past = await getSessionsByPlaylist(session.playlistId);
  const previous = latestSession(past.filter((s) => s.id !== session.id));

  let saving = Promise.resolve();
  let finishing = false;
  const persist = () => {
    const snapshot = session;
    saving = saving.then(() => saveActiveSession(snapshot)).catch(() => {});
    return saving;
  };

  // ---------- Éléments ----------

  const clock = h('span', { class: 'clock', role: 'timer', 'aria-label': 'Temps écoulé' }, '00:00');
  const loopValue = h('span', { class: 'bar-value' });
  const posValue = h('span', { class: 'bar-value' });
  const illuSlot = h('div', { class: 'session-illu' });
  const title = h('h1', { class: 'screen-title session-name', tabindex: '-1' });
  const instruction = h('p', { class: 'session-instruction' });
  const target = h('p', { class: 'label session-target' });
  const live = h('p', { class: 'visually-hidden', 'aria-live': 'polite' });

  const input = h('input', {
    type: 'text',
    inputmode: 'numeric',
    pattern: '[0-9]*',
    maxlength: '3',
    autocomplete: 'off',
    enterkeyhint: 'done',
    class: 'reps-input',
    'aria-label': T.session.repsLabel,
    oninput: () => {
      const digits = input.value.replace(/\D/g, '').slice(0, 3);
      if (digits !== input.value) input.value = digits;
      refreshInput();
    },
  });

  const change = (delta) => {
    const base = input.value === '' ? 0 : Number(input.value);
    input.value = String(clampReps(base + delta));
    refreshInput();
  };
  const minus = h('button', { type: 'button', class: 'reps-btn', 'aria-label': T.session.minus }, '−');
  const plus = h('button', { type: 'button', class: 'reps-btn', 'aria-label': T.session.plus }, '+');
  const stopMinus = holdToRepeat(minus, () => change(-1));
  const stopPlus = holdToRepeat(plus, () => change(1));

  const validateBtn = h('button', { type: 'submit', class: 'btn btn-primary btn-session' }, T.session.validate);
  const finishBtn = h(
    'button',
    { type: 'button', class: 'btn btn-secondary btn-finish', onclick: () => askFinish() },
    T.session.finish,
  );

  const form = h(
    'form',
    {
      class: 'session-form',
      novalidate: true,
      onsubmit: (e) => {
        e.preventDefault();
        validate();
      },
    },
    h('div', { class: 'reps' }, minus, input, plus),
    validateBtn,
  );

  root.append(
    h(
      'div',
      { class: 'session' },
      h(
        'div',
        { class: 'session-bar' },
        clock,
        h('span', { class: 'bar-stat' }, h('span', { class: 'label' }, T.session.loop), loopValue),
        h('span', { class: 'bar-stat' }, h('span', { class: 'label' }, T.session.exercise), posValue),
      ),
      illuSlot,
      h('div', { class: 'session-exercise' }, title, instruction, target),
      form,
      finishBtn,
      live,
    ),
  );

  // ---------- Affichage ----------

  function refreshInput() {
    validateBtn.disabled = !isValidReps(input.value);
    input.classList.toggle('reps-input--long', input.value.length >= 3);
  }

  let shownStep = null;
  function showStep({ announce }) {
    const { loopIndex, position } = currentStep(session);
    const total = session.exercises.length;
    const ex = resolveExercise(session.exercises[position]);
    const key = `${loopIndex}:${position}`;
    if (key === shownStep) return;
    shownStep = key;
    loopValue.textContent = String(loopIndex + 1);
    posValue.textContent = `${position + 1}/${total}`;
    title.textContent = ex.name;
    instruction.textContent = ex.instruction;
    instruction.hidden = !ex.instruction;
    target.textContent = ex.targetReps != null ? T.session.target(ex.targetReps) : '';
    target.hidden = ex.targetReps == null;
    illuSlot.replaceChildren(illustration(ex.illustration, { label: ex.name }));
    input.value = String(suggestedReps(session, previous));
    refreshInput();
    if (announce) live.textContent = T.session.announce(ex.name, loopIndex + 1, position + 1, total);
  }

  function tick() {
    const text = formatClock(elapsedMs(session, Date.now()));
    if (clock.textContent !== text) clock.textContent = text;
  }

  async function validate() {
    if (finishing || !isValidReps(input.value)) return;
    session = validateStep(session, Number(input.value), Date.now());
    if (document.activeElement === input) input.blur();
    showStep({ announce: true });
    tick();
    await persist();
  }

  // ---------- Fin de séance ----------

  async function askFinish() {
    if (finishing) return;
    const empty = !hasEntries(session);
    const { value } = await openDialog({
      title: T.session.finishTitle,
      message: empty ? T.session.finishTextEmpty : T.session.finishText,
      actions: [
        { label: T.session.finishConfirm, value: 'finish', kind: 'primary' },
        { label: T.session.keepGoing, value: 'continue', kind: 'secondary' },
      ],
    });
    if (value !== 'finish' || finishing) return;
    finishing = true;
    await saving;
    if (empty) {
      await clearActiveSession();
      navigate(path('playlists', session.playlistId), { replace: true });
    } else {
      const done = finishSession(session, Date.now());
      await commitSession(done);
      navigate(path('sessions', done.id), { replace: true });
    }
  }

  // Le bouton retour du téléphone déclenche la même confirmation que « Terminer la séance ».
  history.pushState({ muscuGuard: true }, '');
  const onPopState = () => {
    if (finishing) return;
    history.pushState({ muscuGuard: true }, '');
    askFinish();
  };
  window.addEventListener('popstate', onPopState);

  // ---------- Écran allumé ----------

  let wakeLock = null;
  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator && document.visibilityState === 'visible' && !wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {
          wakeLock = null;
        });
      }
    } catch {
      wakeLock = null; // API refusée : la séance fonctionne normalement.
    }
  }
  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      requestWakeLock();
      tick();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  requestWakeLock();

  showStep({ announce: false });
  tick();
  const timer = setInterval(tick, 250);

  return () => {
    clearInterval(timer);
    stopMinus();
    stopPlus();
    window.removeEventListener('popstate', onPopState);
    document.removeEventListener('visibilitychange', onVisibility);
    wakeLock?.release().catch(() => {});
    document.querySelectorAll('dialog.dialog').forEach((d) => d.remove());
  };
}
