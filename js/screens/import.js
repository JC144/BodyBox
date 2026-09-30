// Écran d'import d'une playlist (spécification, section 2.3).

import { h, backTitle, label } from '../dom.js';
import { T } from '../strings.js';
import { parsePlaylist, MAX_BYTES } from '../playlist-import.js';
import { CATALOG_IDS } from '../catalog.js';
import { getPlaylist, putPlaylist } from '../db.js';
import { openDialog } from '../ui.js';
import { navigate, path } from '../router.js';

/**
 * Enregistre une playlist validée. Si une playlist active porte le même identifiant,
 * demande confirmation. Le remplacement conserve l'historique (les séances ne sont pas touchées).
 * @returns {Promise<boolean>} true si la playlist a été enregistrée
 */
export async function savePlaylist(playlist) {
  const existing = await getPlaylist(playlist.id);
  if (existing && !existing.deletedAt) {
    const { value } = await openDialog({
      title: T.import.conflictTitle,
      message: T.import.conflictText(existing.name),
      actions: [
        { label: T.import.replace, value: 'replace', kind: 'primary' },
        { label: T.common.cancel, value: 'cancel', kind: 'secondary' },
      ],
    });
    if (value !== 'replace') return false;
  }
  await putPlaylist({ ...playlist, importedAt: Date.now(), deletedAt: null });
  return true;
}

/** Valide un texte puis l'enregistre ; renvoie la liste d'erreurs éventuelle. */
export async function importText(text) {
  const res = parsePlaylist(text, CATALOG_IDS);
  if (!res.ok) return { errors: res.errors };
  const saved = await savePlaylist(res.playlist);
  if (saved) navigate(path('playlists', res.playlist.id));
  return { errors: [] };
}

export function render(root) {
  let fileText = null;
  let fileError = null;

  const fileName = h('p', { class: 'muted', 'aria-live': 'polite' });
  const fileInput = h('input', {
    type: 'file',
    accept: '.json,application/json',
    class: 'visually-hidden',
    id: 'import-file',
    onchange: async () => {
      const file = fileInput.files[0];
      fileText = null;
      fileError = null;
      if (!file) return;
      fileName.textContent = T.import.fileChosen(file.name);
      textarea.value = '';
      if (file.size > MAX_BYTES) fileError = T.validation.tooLarge;
      else fileText = await file.text();
      showErrors([]);
    },
  });

  const textarea = h('textarea', {
    id: 'import-text',
    class: 'textarea',
    rows: '8',
    spellcheck: 'false',
    autocapitalize: 'off',
    autocomplete: 'off',
    placeholder: T.import.textPlaceholder,
    oninput: () => {
      if (textarea.value && (fileText !== null || fileError)) {
        fileText = null;
        fileError = null;
        fileInput.value = '';
        fileName.textContent = '';
      }
    },
  });

  const errorBox = h('div', { class: 'errors', role: 'alert' });

  function showErrors(errors, summary = true) {
    errorBox.replaceChildren();
    if (!errors.length) return;
    errorBox.append(
      summary ? h('p', { class: 'errors-title' }, T.import.errorsTitle(errors.length)) : null,
      h('ul', {}, errors.map((e) => h('li', {}, e.message))),
    );
  }

  const submit = h(
    'button',
    {
      type: 'submit',
      class: 'btn btn-primary',
    },
    T.import.submit,
  );

  const form = h(
    'form',
    {
      class: 'stack',
      novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault();
        if (fileError) return showErrors([{ field: null, message: fileError }]);
        const text = fileText ?? textarea.value;
        if (!text.trim()) return showErrors([{ field: null, message: T.import.empty }], false);
        submit.disabled = true;
        try {
          const { errors } = await importText(text);
          showErrors(errors);
        } finally {
          submit.disabled = false;
        }
      },
    },
    h(
      'div',
      { class: 'field' },
      label(T.import.fileLabel),
      fileInput,
      h('label', { for: 'import-file', class: 'btn btn-secondary' }, T.import.fileButton),
      fileName,
    ),
    h('div', { class: 'field' }, h('label', { for: 'import-text', class: 'label' }, T.import.textLabel), textarea),
    errorBox,
    submit,
  );

  root.append(
    h('header', { class: 'screen-head' }, backTitle(T.import.title, T.common.home)),
    form,
  );
}
