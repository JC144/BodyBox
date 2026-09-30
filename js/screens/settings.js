// Réglages (spécification, section 2.8) : onglets « Général » et « Playlists ».
// L'éditeur de circuit (screens/playlist-editor.js) s'ouvre depuis l'onglet « Playlists ».

import { h, backTitle, shareIcon } from '../dom.js';
import { T } from '../strings.js';
import { APP_VERSION } from '../version.js';
import { getSettings, saveSettings, applyTheme, loadSettings } from '../settings.js';
import { exportAll, replaceAll, clearAll, getPlaylists, renamePlaylist, deletePlaylist, setLastBackupAt } from '../db.js';
import { buildBackup, backupFileName, parseBackup } from '../backup.js';
import { sortPlaylists, moveId, cleanName, NAME_MAX } from '../playlist-order.js';
import { serializePlaylist } from '../playlist-import.js';
import { seedStarterPlaylists } from '../starter-playlists.js';
import { confirmAction, openDialog, toast } from '../ui.js';
import { path } from '../router.js';

function downloadText(text, fileName) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: fileName, hidden: true });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function downloadJson(data, fileName) {
  downloadText(JSON.stringify(data, null, 2), fileName);
}

/**
 * Envoie le JSON d'un circuit à une autre application par le menu de partage du système :
 * en fichier si le navigateur le permet, sinon en texte ; à défaut, le fichier est téléchargé.
 */
async function sharePlaylist(p) {
  const text = serializePlaylist(p);
  const fileName = `${p.id}.json`;
  const file = new File([text], fileName, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: p.name });
    else if (navigator.share) await navigator.share({ title: p.name, text });
    else {
      downloadText(text, fileName);
      toast(T.settings.shareDownloaded);
    }
  } catch (err) {
    // Fermer le menu de partage sans choisir d'application n'est pas une erreur.
    if (err?.name !== 'AbortError') toast(T.settings.shareError);
  }
}

/** Exporte toutes les données dans un fichier et retient la date de cette sauvegarde. */
export async function exportBackup() {
  const now = Date.now();
  downloadJson(buildBackup(await exportAll(), now), backupFileName(now));
  await setLastBackupAt(now);
  toast(T.settings.exportDone);
}

async function storageState() {
  try {
    if (!navigator.storage?.persisted) return T.settings.storageUnknown;
    return (await navigator.storage.persisted()) ? T.settings.storageYes : T.settings.storageNo;
  } catch {
    return T.settings.storageUnknown;
  }
}

const TABS = [
  { key: 'general', label: () => T.settings.tabGeneral },
  { key: 'playlists', label: () => T.settings.tabPlaylists },
];

export async function render(root, [tab] = []) {
  const current = TABS.some((t) => t.key === tab) ? tab : 'general';
  const panels = new Map(
    TABS.map((t) => [
      t.key,
      h('div', { class: 'tab-panel', role: 'tabpanel', id: `settings-${t.key}`, 'aria-labelledby': `tab-${t.key}`, tabindex: '0' }),
    ]),
  );
  const buttons = TABS.map((t) =>
    h('button', { type: 'button', role: 'tab', id: `tab-${t.key}`, class: 'tab', 'aria-controls': `settings-${t.key}`, onclick: () => select(t.key) }, t.label()),
  );

  function select(key, focus = false) {
    TABS.forEach((t, i) => {
      const on = t.key === key;
      buttons[i].setAttribute('aria-selected', String(on));
      buttons[i].tabIndex = on ? 0 : -1;
      panels.get(t.key).hidden = !on;
      if (on && focus) buttons[i].focus();
    });
    // L'onglet est reflété dans l'adresse sans relancer le routage.
    history.replaceState(history.state, '', key === 'general' ? '#/settings' : `#/settings/${key}`);
  }

  const tablist = h('div', { class: 'tabs', role: 'tablist', 'aria-label': T.settings.title }, buttons);
  tablist.addEventListener('keydown', (e) => {
    const i = buttons.indexOf(document.activeElement);
    if (i < 0) return;
    const next = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: TABS.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(TABS[(next + TABS.length) % TABS.length].key, true);
  });

  root.append(
    h('header', { class: 'screen-head' }, backTitle(T.settings.title, T.common.home)),
    tablist,
    ...panels.values(),
  );
  // L'onglet est choisi avant tout chargement : l'écran est déjà affiché
  // et ne doit pas montrer les deux panneaux ni des onglets inactifs.
  select(current);
  renderGeneral(panels.get('general'), () => {
    root.replaceChildren();
    render(root, ['general']);
  });
  await renderPlaylists(panels.get('playlists'));
}

// ---------- Onglet Playlists : renommer, réordonner, modifier, créer, supprimer ----------

async function renderPlaylists(panel, focus = null) {
  const playlists = sortPlaylists((await getPlaylists()).filter((p) => !p.deletedAt), getSettings().playlistOrder);
  const ids = playlists.map((p) => p.id);
  panel.replaceChildren();

  if (playlists.length === 0) {
    panel.append(
      h(
        'div',
        { class: 'empty stack' },
        h('p', { class: 'muted' }, T.settings.playlistsEmpty),
        h('a', { href: '#/editor', class: 'btn btn-primary' }, T.settings.create),
        h('a', { href: '#/import', class: 'btn btn-secondary' }, T.playlists.import),
      ),
    );
    return;
  }

  const refresh = (id, action) => renderPlaylists(panel, { id, action });

  async function move(id, delta, action) {
    await saveSettings({ playlistOrder: moveId(ids, id, delta) });
    await refresh(id, action);
  }

  async function rename(p) {
    const { value, text } = await openDialog({
      title: T.settings.renameTitle,
      input: { label: T.settings.renameField, value: p.name, maxLength: NAME_MAX, isValid: (t) => cleanName(t) !== null },
      actions: [
        { label: T.settings.renameConfirm, value: 'save', kind: 'primary' },
        { label: T.common.cancel, value: 'cancel', kind: 'secondary' },
      ],
    });
    const name = cleanName(text);
    if (value === 'save' && name && name !== p.name) {
      await renamePlaylist(p.id, name);
      toast(T.settings.renameDone);
    }
    await refresh(p.id, 'rename');
  }

  async function remove(p) {
    const { value, checked } = await openDialog({
      title: T.settings.deleteTitle,
      message: T.settings.deleteText,
      checkbox: T.settings.deleteHistory,
      actions: [
        { label: T.common.delete, value: 'delete', kind: 'danger' },
        { label: T.common.cancel, value: 'cancel', kind: 'secondary' },
      ],
    });
    if (value !== 'delete') {
      await refresh(p.id, 'delete');
      return;
    }
    await deletePlaylist(p.id, checked, Date.now());
    await saveSettings({ playlistOrder: ids.filter((x) => x !== p.id) });
    toast(T.settings.deleteDone);
    const i = ids.indexOf(p.id);
    await refresh(ids[i + 1] ?? ids[i - 1], 'delete');
  }

  const button = (p, action, text, attrs) =>
    h('button', { type: 'button', class: 'btn btn-secondary btn-small', 'data-id': p.id, 'data-action': action, ...attrs }, text);

  panel.append(
    h('p', { class: 'muted panel-help' }, T.settings.playlistsHelp),
    h(
      'ul',
      { class: 'list', role: 'list' },
      playlists.map((p, i) => {
        const n = p.exercises.length;
        return h(
          'li',
          { class: 'manage-row' },
          h(
            'div',
            { class: 'manage-head' },
            h('span', { class: 'manage-text' }, h('span', { class: 'row-title' }, p.name), h('span', { class: 'row-meta' }, `${n} ${T.common.exercises(n)}`)),
            h(
              'button',
              {
                type: 'button',
                class: 'icon-btn icon-btn--end',
                'data-id': p.id,
                'data-action': 'share',
                'aria-label': T.settings.shareLabel(p.name),
                title: T.settings.shareLabel(p.name),
                onclick: () => sharePlaylist(p),
              },
              shareIcon(),
            ),
          ),
          h(
            'span',
            { class: 'manage-actions' },
            button(p, 'up', '↑', {
              class: 'btn btn-secondary btn-small btn-square',
              'aria-label': T.settings.moveUp(p.name),
              disabled: i === 0,
              onclick: () => move(p.id, -1, 'up'),
            }),
            button(p, 'down', '↓', {
              class: 'btn btn-secondary btn-small btn-square',
              'aria-label': T.settings.moveDown(p.name),
              disabled: i === playlists.length - 1,
              onclick: () => move(p.id, 1, 'down'),
            }),
            button(p, 'rename', T.settings.rename, { 'aria-label': T.settings.renameLabel(p.name), onclick: () => rename(p) }),
            h('a', { href: `#${path('editor', p.id)}`, class: 'btn btn-secondary btn-small', 'aria-label': T.settings.editLabel(p.name) }, T.settings.edit),
            button(p, 'delete', T.common.delete, {
              class: 'btn btn-danger btn-small',
              'aria-label': T.settings.deleteLabel(p.name),
              onclick: () => remove(p),
            }),
          ),
        );
      }),
    ),
    h(
      'div',
      { class: 'list-actions stack' },
      h('a', { href: '#/editor', class: 'btn btn-secondary' }, T.settings.create),
      h('a', { href: '#/import', class: 'btn btn-secondary' }, T.playlists.import),
    ),
  );

  // Après une action, le focus reste sur le bouton utilisé (ou sur un voisin s'il est désactivé).
  if (focus?.id) {
    const find = (action) => panel.querySelector(`[data-id="${CSS.escape(focus.id)}"][data-action="${action}"]`);
    const target = find(focus.action);
    const fallback = find({ up: 'down', down: 'up' }[focus.action]) || find('rename');
    (target && !target.disabled ? target : fallback)?.focus();
  }
}

// ---------- Onglet Général : thème, données, application ----------

function renderGeneral(panel, rerender) {
  const settings = getSettings();

  const themes = [
    ['dark', T.settings.themeDark],
    ['light', T.settings.themeLight],
    ['system', T.settings.themeSystem],
  ];
  const themeField = h(
    'fieldset',
    { class: 'segmented' },
    h('legend', { class: 'label' }, T.settings.theme),
    themes.map(([value, text]) =>
      h(
        'label',
        { class: 'segment' },
        h('input', {
          type: 'radio',
          name: 'theme',
          value,
          checked: settings.theme === value,
          onchange: async () => {
            applyTheme(value);
            await saveSettings({ theme: value });
          },
        }),
        h('span', {}, text),
      ),
    ),
  );

  const restoreInput = h('input', {
    type: 'file',
    accept: '.json,application/json',
    class: 'visually-hidden',
    id: 'restore-file',
    onchange: async () => {
      const file = restoreInput.files[0];
      restoreInput.value = '';
      if (!file) return;
      const data = parseBackup(await file.text());
      if (!data) {
        toast(T.settings.restoreInvalid);
        return;
      }
      const ok = await confirmAction({
        title: T.settings.restoreTitle,
        message: T.settings.restoreText(data.playlists.length, data.sessions.length),
        confirmLabel: T.settings.restoreConfirm,
        danger: true,
      });
      if (!ok) return;
      await replaceAll(data);
      // Les données en place sont celles d'une sauvegarde : le rappel repart de zéro.
      await setLastBackupAt(Date.now());
      applyTheme((await loadSettings()).theme);
      toast(T.settings.restoreDone);
      rerender();
    },
  });

  const storage = h('dd', {}, '…');
  storageState().then((text) => {
    storage.textContent = text;
  });

  panel.append(
    h('section', { class: 'section' }, themeField),
    h(
      'section',
      { class: 'section stack' },
      h('h2', { class: 'section-title' }, T.settings.data),
      h('p', { class: 'muted' }, T.settings.advice),
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-secondary',
          onclick: exportBackup,
        },
        T.settings.export,
      ),
      restoreInput,
      h('label', { for: 'restore-file', class: 'btn btn-secondary' }, T.settings.restore),
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-danger',
          onclick: async () => {
            const first = await confirmAction({
              title: T.settings.eraseTitle,
              message: T.settings.eraseText,
              confirmLabel: T.settings.eraseConfirm,
              danger: true,
            });
            if (!first) return;
            const second = await confirmAction({
              title: T.settings.eraseTitle2,
              message: T.settings.eraseText2,
              confirmLabel: T.settings.eraseConfirm2,
              danger: true,
            });
            if (!second) return;
            await clearAll();
            // Sans aucun historique, l'application repart comme au premier lancement.
            await seedStarterPlaylists().catch(() => {});
            applyTheme((await loadSettings()).theme);
            toast(T.settings.eraseDone);
            rerender();
          },
        },
        T.settings.erase,
      ),
    ),
    h(
      'section',
      { class: 'section' },
      h('h2', { class: 'section-title' }, T.settings.about),
      h(
        'dl',
        { class: 'facts' },
        h('div', {}, h('dt', {}, T.settings.version), h('dd', {}, APP_VERSION)),
        h('div', {}, h('dt', {}, T.settings.storage), storage),
      ),
    ),
  );
}
