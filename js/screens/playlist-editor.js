// Éditeur de circuit (spécification, section 2.9) : création (#/editor) et modification (#/editor/{id}),
// à partir des exercices du catalogue. Ouvert depuis l'onglet Circuits des Réglages.
//
// L'ajout d'un exercice se fait en deux étapes, dans une fenêtre plein écran : choix dans le
// catalogue, puis objectif et consigne. Glissée vers la gauche, une ligne découvre « Modifier »
// (qui rouvre la seconde étape) et « Retirer ».

import { h, backTitle, plusIcon, pencilIcon, trashIcon } from '../dom.js';
import { T } from '../strings.js';
import { CATALOG, CATALOG_IDS, getCatalogEntry, resolveExercise } from '../catalog.js';
import { getPlaylist, getPlaylists, updatePlaylist } from '../db.js';
import { validatePlaylist } from '../playlist-import.js';
import { moveId, NAME_MAX } from '../playlist-order.js';
import {
  draftFromPlaylist, draftItem, buildPlaylist, checkItem, sameDraft, searchCatalog, slugify, uniqueId,
  MAX_EXERCISES, DESCRIPTION_MAX, NOTE_MAX,
} from '../playlist-editor.js';
import { confirmAction, illustration, swipeRow, toast } from '../ui.js';
import { navigate } from '../router.js';

const E = T.editor;
const BACK = '#/settings/playlists';

/** Titre de la fenêtre, servant de lien retour, comme le titre des écrans : « ← Titre ». */
function sheetTitle(id, text, destination, onBack) {
  return h(
    'h2',
    { class: 'back-title sheet-title', id, tabindex: '-1' },
    h(
      'button',
      { type: 'button', class: 'back', onclick: onBack },
      h('span', { 'aria-hidden': 'true' }, '←'),
      h('span', { class: 'visually-hidden' }, `${destination} : `),
      text,
    ),
  );
}

/** Marque les champs en erreur et place le focus sur le premier. */
function flagFields(fields) {
  fields.forEach((el) => el?.setAttribute('aria-invalid', 'true'));
  fields.find(Boolean)?.focus();
}

function errorList(box, errors, title = null) {
  box.replaceChildren();
  if (!errors.length) return;
  box.append(title && h('p', { class: 'errors-title' }, title), h('ul', {}, errors.map((e) => h('li', {}, e.message))));
}

export async function render(root, [id] = []) {
  const existing = id ? await getPlaylist(id) : null;
  if (id && (!existing || existing.deletedAt)) {
    root.append(h('header', { class: 'screen-head' }, backTitle(E.notFound, E.back, BACK)));
    return;
  }

  const draft = draftFromPlaylist(existing);
  const initial = structuredClone(draft);
  // Clé stable de chaque ligne, pour retrouver l'élément à focaliser après un nouvel affichage.
  const keys = new WeakMap();
  let nextKey = 0;
  const keyOf = (item) => {
    if (!keys.has(item)) keys.set(item, String(nextKey++));
    return keys.get(item);
  };
  let saved = false;
  const isDirty = () => !saved && !sameDraft(draft, initial);

  // ---------- Champs du circuit ----------

  const nameInput = h('input', {
    type: 'text', id: 'editor-name', class: 'input', value: draft.name, maxlength: NAME_MAX, autocomplete: 'off',
    oninput: () => { draft.name = nameInput.value; },
  });
  const descriptionInput = h('input', {
    type: 'text', id: 'editor-description', class: 'input', value: draft.description, maxlength: DESCRIPTION_MAX, autocomplete: 'off',
    oninput: () => { draft.description = descriptionInput.value; },
  });

  // ---------- Liste des exercices ----------

  const list = h('ol', { class: 'list editor-list', role: 'list' });
  const addButton = h(
    'button',
    { type: 'button', class: 'icon-btn icon-btn--end', 'aria-label': E.add, title: E.add, onclick: () => openWizard() },
    plusIcon(),
  );
  const help = h('p', { class: 'muted panel-help editor-help' }, E.swipeHelp);
  const fullNote = h('p', { class: 'muted editor-full', hidden: true }, E.full);
  const errorBox = h('div', { class: 'errors', role: 'alert' });

  /** Réaffiche la liste ; `focus` : { key, action } de l'élément à focaliser ensuite. */
  function renderList(focus = null) {
    // Les erreurs affichées citent des numéros d'exercice, périmés dès que la liste change.
    if (errorBox.hasChildNodes()) showErrors([]);
    const n = draft.exercises.length;
    addButton.disabled = n >= MAX_EXERCISES;
    fullNote.hidden = n < MAX_EXERCISES;
    help.hidden = n === 0;
    list.replaceChildren(
      ...(n === 0 ? [h('li', { class: 'editor-empty muted' }, E.none)] : draft.exercises.map((item, i) => row(item, i, n))),
    );
    if (!focus) return;
    const find = (action) => list.querySelector(`[data-key="${focus.key}"][data-action="${action}"]`);
    const target = find(focus.action);
    const el = target && !target.disabled ? target : find({ up: 'down', down: 'up' }[focus.action]) || find('row');
    (el || addButton).focus();
    if (focus.action === 'row') el?.scrollIntoView({ block: 'nearest' });
  }

  function row(item, i, n) {
    const ex = resolveExercise(item);
    const key = keyOf(item);
    const move = (delta, action) => {
      draft.exercises = moveId(draft.exercises, item, delta);
      renderList({ key, action });
    };
    const moveButton = (action, text, label, disabled, delta) =>
      h(
        'button',
        {
          type: 'button', class: 'btn btn-secondary btn-small btn-square', 'data-key': key, 'data-action': action,
          'aria-label': label, disabled, onclick: () => move(delta, action),
        },
        text,
      );
    const li = h(
      'li',
      { class: 'swipe-row' },
      h(
        'div',
        { class: 'swipe-content editor-row', 'data-key': key, 'data-action': 'row', tabindex: '-1' },
        illustration(ex.illustration, { still: true, className: 'thumb' }),
        h(
          'span',
          { class: 'exercise-row-text' },
          h('span', { class: 'row-index' }, String(i + 1).padStart(2, '0')),
          h('span', { class: 'row-title' }, ex.name),
          item.targetReps && h('span', { class: 'row-meta' }, T.detail.target(item.targetReps)),
          item.note && h('span', { class: 'editor-note' }, item.note),
        ),
        h(
          'span',
          { class: 'editor-move' },
          moveButton('up', '↑', E.moveUp(ex.name), i === 0, -1),
          moveButton('down', '↓', E.moveDown(ex.name), i === n - 1, 1),
        ),
      ),
      h(
        'div',
        { class: 'swipe-actions' },
        h(
          'button',
          { type: 'button', class: 'swipe-action swipe-edit', 'aria-label': E.edit(ex.name), title: E.edit(ex.name), onclick: () => openWizard(item) },
          pencilIcon(),
        ),
        h(
          'button',
          {
            type: 'button', class: 'swipe-action swipe-delete', 'aria-label': E.remove(ex.name), title: E.remove(ex.name),
            onclick: () => {
              const next = draft.exercises[i + 1] ?? draft.exercises[i - 1];
              draft.exercises = draft.exercises.filter((x) => x !== item);
              renderList(next ? { key: keyOf(next), action: 'row' } : { key: '', action: '' });
              toast(E.removed(ex.name));
            },
          },
          trashIcon(),
        ),
      ),
    );
    swipeRow(li);
    return li;
  }

  // ---------- Ajout et modification d'un exercice : fenêtre en deux étapes ----------

  /** Sans argument : ajout (catalogue, puis réglages). Avec un exercice du brouillon : ses réglages. */
  function openWizard(editing = null) {
    const titleId = 'sheet-title';
    const page = h('div', { class: 'sheet-page' });
    const dialog = h('dialog', { class: 'sheet', 'aria-labelledby': titleId }, page);
    let query = '';
    let back = () => finish();

    function finish(focus = null) {
      if (dialog.open) dialog.close();
      dialog.remove();
      if (focus) renderList(focus);
      else (editing ? list.querySelector(`.swipe-content[data-key="${keyOf(editing)}"]`) : addButton)?.focus();
    }

    // Échap et le retour du téléphone ramènent à l'étape précédente.
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      back();
    });
    dialog.addEventListener('close', () => dialog.remove());

    function showCatalog(lastId = null) {
      back = () => finish();
      const search = h('input', {
        type: 'search', id: 'picker-search', class: 'input', value: query, autocomplete: 'off', enterkeyhint: 'search',
        oninput: () => {
          query = search.value;
          filter();
        },
      });
      const results = h('p', { class: 'row-meta picker-results', 'aria-live': 'polite' });
      const items = CATALOG.map((entry) =>
        h(
          'li',
          { 'data-id': entry.id },
          h(
            'button',
            { type: 'button', class: 'picker-item', onclick: () => showItem(draftItem({ exerciseId: entry.id })) },
            illustration(entry, { still: true, className: 'thumb' }),
            h('span', { class: 'picker-text' }, h('span', { class: 'row-title' }, entry.name), h('span', { class: 'row-meta' }, entry.muscles)),
          ),
        ),
      );
      function filter() {
        const found = new Set(searchCatalog(CATALOG, query).map((e) => e.id));
        for (const li of items) li.hidden = !found.has(li.dataset.id);
        results.textContent = E.picker.results(found.size);
      }
      page.replaceChildren(
        h('header', { class: 'screen-head' }, sheetTitle(titleId, E.picker.title, E.picker.back, () => back())),
        h('div', { class: 'field' }, h('label', { class: 'label', for: 'picker-search' }, E.picker.search), search),
        results,
        h('ul', { class: 'list picker-list', role: 'list' }, items),
      );
      filter();
      page.scrollTop = 0;
      const last = lastId && items.find((li) => li.dataset.id === lastId && !li.hidden);
      if (last) {
        last.scrollIntoView({ block: 'center' });
        last.querySelector('button').focus();
      } else {
        search.focus();
      }
    }

    function showItem(item) {
      const adding = !editing;
      back = adding ? () => showCatalog(item.exerciseId) : () => finish();
      const ex = resolveExercise({ exerciseId: item.exerciseId, name: item.name });
      const base = getCatalogEntry(item.exerciseId);
      const target = h('input', {
        type: 'text', id: 'item-target', class: 'input', value: item.targetReps, inputmode: 'numeric', maxlength: 3,
        placeholder: E.item.targetPlaceholder, autocomplete: 'off', enterkeyhint: 'done',
      });
      const note = h('input', {
        type: 'text', id: 'item-note', class: 'input', value: item.note, maxlength: NOTE_MAX,
        placeholder: base?.instruction ?? '', autocomplete: 'off', enterkeyhint: 'done',
      });
      const errors = h('div', { class: 'errors', role: 'alert' });
      const form = h(
        'form',
        {
          class: 'stack',
          novalidate: true,
          onsubmit: (e) => {
            e.preventDefault();
            target.removeAttribute('aria-invalid');
            note.removeAttribute('aria-invalid');
            const values = { targetReps: target.value.trim(), note: note.value.trim() };
            const res = checkItem({ ...item, ...values });
            if (!res.ok) {
              errorList(errors, res.errors);
              flagFields(res.errors.map((x) => (x.field === 'targetReps' ? target : note)));
              return;
            }
            Object.assign(item, values);
            if (adding) {
              draft.exercises.push(item);
              toast(E.item.added(ex.name));
            }
            finish({ key: keyOf(item), action: 'row' });
          },
        },
        h('div', { class: 'field item-target' }, h('label', { class: 'label', for: 'item-target' }, E.item.target), target),
        h('div', { class: 'field' }, h('label', { class: 'label', for: 'item-note' }, E.item.note), note),
        errors,
        h('div', { class: 'screen-actions' }, h('button', { type: 'submit', class: 'btn btn-primary' }, E.item.validate)),
      );
      page.replaceChildren(
        h(
          'header',
          { class: 'screen-head' },
          sheetTitle(titleId, ex.name, adding ? E.item.backToCatalog : E.item.backToCircuit, () => back()),
        ),
        h('div', { class: 'item-illu' }, illustration(ex.illustration, { label: ex.name })),
        ex.muscles && h('p', { class: 'exercise-muscles' }, ex.muscles),
        ex.description &&
          h('details', { class: 'exercise-more' }, h('summary', { class: 'row-meta' }, E.item.howTo), h('p', {}, ex.description)),
        form,
      );
      page.scrollTop = 0;
      page.querySelector('h2').focus();
    }

    document.body.append(dialog);
    dialog.showModal();
    if (editing) showItem(editing);
    else showCatalog();
  }

  // ---------- Enregistrement ----------

  function showErrors(errors) {
    root.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    errorList(errorBox, errors, errors.length ? E.errorsTitle(errors.length) : null);
    if (!errors.length) return;
    const fields = errors.map((e) => (e.field === 'name' ? nameInput : e.field === 'description' ? descriptionInput : null));
    if (fields.some(Boolean)) flagFields(fields);
    else if (errors.some((e) => e.field === 'exercises')) addButton.focus();
  }

  async function save() {
    const playlistId = existing
      ? existing.id
      : uniqueId(slugify(draft.name), (await getPlaylists()).map((p) => p.id));
    const res = buildPlaylist(draft, playlistId);
    if (!res.ok) return showErrors(res.errors);
    // Filet de sécurité : le circuit enregistré respecte le format d'import (section 4).
    const check = validatePlaylist(res.playlist, CATALOG_IDS);
    if (!check.ok) return showErrors(check.errors);
    showErrors([]);

    let playlist;
    if (existing) {
      playlist = { ...existing, ...res.playlist };
      if (res.playlist.description === undefined) delete playlist.description;
    } else {
      playlist = { ...res.playlist, importedAt: Date.now(), deletedAt: null };
    }
    await updatePlaylist(playlist);
    saved = true;
    toast(existing ? E.saved : E.created);
    navigate('/settings/playlists');
  }

  const submit = h('button', { type: 'submit', class: 'btn btn-primary' }, E.save);
  const form = h(
    'form',
    {
      class: 'stack',
      novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault();
        submit.disabled = true;
        try {
          await save();
        } finally {
          submit.disabled = false;
        }
      },
    },
    h('div', { class: 'field' }, h('label', { class: 'label', for: 'editor-name' }, E.name), nameInput),
    h('div', { class: 'field' }, h('label', { class: 'label', for: 'editor-description' }, E.description), descriptionInput),
    h(
      'section',
      { class: 'section editor-section' },
      h('div', { class: 'section-head' }, h('h2', { class: 'section-title' }, E.exercises), addButton),
      help,
      list,
      fullNote,
    ),
    existing && h('p', { class: 'muted' }, E.historyNote),
    errorBox,
    h('div', { class: 'screen-actions' }, submit),
  );

  // Le lien retour demande confirmation si des modifications n'ont pas été enregistrées.
  const head = h('header', { class: 'screen-head' }, backTitle(existing ? E.titleEdit : E.titleNew, E.back, BACK));
  head.querySelector('a').addEventListener('click', async (e) => {
    e.preventDefault();
    if (isDirty()) {
      const ok = await confirmAction({ title: E.discardTitle, message: E.discardText, confirmLabel: E.discardConfirm, danger: true });
      if (!ok) return;
    }
    saved = true;
    navigate('/settings/playlists');
  });
  root.append(head, form);
  renderList();

  // Fermeture ou rechargement de la page avec des modifications non enregistrées.
  const onBeforeUnload = (e) => {
    if (isDirty()) e.preventDefault();
  };
  window.addEventListener('beforeunload', onBeforeUnload);
  return () => {
    window.removeEventListener('beforeunload', onBeforeUnload);
    document.querySelectorAll('dialog.sheet').forEach((d) => d.remove());
  };
}
