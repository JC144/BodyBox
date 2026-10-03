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
    h('button', { type: 'button', role: 'tab', id: `tab-${t.key}`, class: 'tab', 'aria-controls': `settings-${t.key}`, onclick: () => switchTo(t.key) }, t.label()),
  );

  let currentKey = current;
  let anim = null;

  function animate(el, frames, duration, easing) {
    anim?.cancel();
    anim = el.animate(frames, { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration, easing });
    return anim.finished.then(
      () => true,
      () => false,
    );
  }

  function markTab(key, focus = false) {
    currentKey = key;
    TABS.forEach((t, i) => {
      const on = t.key === key;
      buttons[i].setAttribute('aria-selected', String(on));
      buttons[i].tabIndex = on ? 0 : -1;
      if (on && focus) buttons[i].focus();
    });
    // L'onglet est reflété dans l'adresse sans relancer le routage.
    history.replaceState(history.state, '', key === 'general' ? '#/settings' : `#/settings/${key}`);
  }

  function showPanel(key) {
    for (const [k, panel] of panels) {
      panel.hidden = k !== key;
      panel.style.opacity = '';
      panel.style.transform = '';
    }
  }

  /**
   * Passage d'un onglet à l'autre, au clic, au clavier ou au glissé : les en-têtes échangent
   * leur taille (transition CSS) pendant que la page courante s'efface du côté opposé à
   * l'onglet visé, puis la nouvelle page arrive de ce côté.
   * @param start état de départ de la page courante (là où le doigt l'a laissée)
   */
  async function switchTo(key, focus = false, start = { opacity: 1, transform: 'none' }) {
    if (key === currentKey) return;
    // Un passage en cours s'achève d'un coup.
    anim?.cancel();
    showPanel(currentKey);
    const from = panels.get(currentKey);
    const dir = TABS.findIndex((t) => t.key === key) > TABS.findIndex((t) => t.key === currentKey) ? -1 : 1;
    markTab(key, focus);
    from.style.opacity = '0';
    const out = { opacity: 0, transform: `translateX(${dir * from.offsetWidth * 0.2}px)` };
    if (!(await animate(from, [start, out], 120, 'ease-in'))) return;
    showPanel(key);
    animate(panels.get(key), [{ opacity: 0, transform: `translateX(${-dir * 40}px)` }, { opacity: 1, transform: 'none' }], 200, 'ease-out');
  }

  const tablist = h('div', { class: 'tabs', role: 'tablist', 'aria-label': T.settings.title }, buttons);
  tablist.addEventListener('keydown', (e) => {
    const i = buttons.indexOf(document.activeElement);
    if (i < 0) return;
    const next = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: TABS.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    switchTo(TABS[(next + TABS.length) % TABS.length].key, true);
  });

  root.append(
    h('header', { class: 'screen-head' }, backTitle(T.settings.title, T.common.home)),
    tablist,
    ...panels.values(),
  );
  // L'onglet est choisi avant tout chargement : l'écran est déjà affiché
  // et ne doit pas montrer les deux panneaux ni des onglets inactifs.
  markTab(current);
  showPanel(current);

  stopSwipe?.();
  const swipe = new AbortController();
  stopSwipe = () => swipe.abort();
  swipeTabs(document.getElementById('main'), swipe.signal, {
    index: () => TABS.findIndex((t) => t.key === currentKey),
    count: TABS.length,
    panel: (i) => panels.get(TABS[i].key),
    buttons,
    tablist,
    animate,
    busy: () => anim?.playState === 'running',
    switchTo: (i, start) => switchTo(TABS[i].key, false, start),
  });

  renderGeneral(panels.get('general'), () => {
    root.replaceChildren();
    render(root, ['general']);
  });
  await renderPlaylists(panels.get('playlists'));
  return () => stopSwipe?.();
}

// ---------- Glissé horizontal entre les onglets ----------

// Écoute du glissé de l'affichage en cours (l'écran se réaffiche après une restauration).
let stopSwipe = null;

const SLOP = 10; // px parcourus avant de choisir entre défilement vertical et changement d'onglet
const FOLLOW = 0.3; // part du déplacement du doigt suivie par la page qui s'efface
const EDGE = 0.1; // résistance quand il n'y a pas d'onglet de ce côté
const FLICK = 0.4; // px/ms : un geste vif suffit à changer d'onglet

/**
 * Le doigt qui glisse horizontalement efface la page courante et échange la taille des
 * en-têtes ; au lâcher, l'onglet voisin s'affiche si le geste est assez marqué (la moitié
 * du fondu, ou un geste vif), sinon tout revient en place. Un geste d'abord vertical reste
 * un défilement : la zone n'autorise que le défilement vertical au navigateur (CSS), qui
 * annule le pointeur dès qu'il fait défiler la page.
 */
function swipeTabs(area, signal, o) {
  let drag = null;
  let swallowClickUntil = 0;
  const on = (type, fn, capture = false) => area.addEventListener(type, fn, { signal, capture });

  const setGrow = (values) => o.buttons.forEach((b, k) => b.style.setProperty('--grow', String(values[k] ?? 0)));

  function update(dx) {
    const from = o.index();
    const to = dx < 0 ? from + 1 : from - 1;
    const exists = to >= 0 && to < o.count;
    const p = exists ? Math.min(1, Math.abs(dx) / (area.clientWidth * 0.5)) : 0;
    const panel = o.panel(from);
    Object.assign(drag, { from, to: exists ? to : null, p });
    panel.style.opacity = String(1 - p);
    panel.style.transform = `translateX(${dx * (exists ? FOLLOW : EDGE)}px)`;
    setGrow({ [from]: 1 - p, ...(exists && { [to]: p }) });
  }

  function finish(d, commit) {
    const panel = o.panel(d.from);
    const start = { opacity: panel.style.opacity, transform: panel.style.transform };
    o.tablist.classList.remove('tabs--dragging');
    o.buttons.forEach((b) => b.style.removeProperty('--grow'));

    // Le passage repart de là où le doigt a laissé la page et les en-têtes.
    if (commit) {
      o.switchTo(d.to, start);
      return;
    }
    panel.style.opacity = '';
    panel.style.transform = '';
    o.animate(panel, [start, { opacity: 1, transform: 'none' }], 150, 'ease-out');
  }

  on('pointerdown', (e) => {
    // Le geste est réservé au doigt (et au stylet) : à la souris, glisser sélectionne du texte.
    if (e.pointerType === 'mouse' || !e.isPrimary || o.busy()) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, active: false, dx: 0, samples: [] };
  });

  on('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.active) {
      // Mouvement plutôt vertical : c'est un défilement de la page.
      if (Math.abs(dy) > SLOP && Math.abs(dy) > Math.abs(dx)) {
        drag = null;
        return;
      }
      if (Math.abs(dx) < SLOP) return;
      drag.active = true;
      drag.x += Math.sign(dx) * SLOP;
      area.setPointerCapture(e.pointerId);
      o.tablist.classList.add('tabs--dragging');
    }
    drag.dx = e.clientX - drag.x;
    drag.samples.push({ x: e.clientX, t: e.timeStamp });
    while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > 100) drag.samples.shift();
    update(drag.dx);
  });

  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!d.active) return;
    swallowClickUntil = e.timeStamp + 400;
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const v = (last.x - first.x) / (last.t - first.t || 1);
    const flick = Math.abs(v) > FLICK && Math.sign(v) === Math.sign(d.dx);
    finish(d, e.type === 'pointerup' && d.to !== null && (d.p >= 0.5 || flick));
  };
  on('pointerup', end);
  on('pointercancel', end);

  // Le lâcher d'un glissé ne déclenche pas le bouton qui se trouvait sous le doigt.
  on(
    'click',
    (e) => {
      if (e.timeStamp > swallowClickUntil) return;
      swallowClickUntil = 0;
      e.preventDefault();
      e.stopPropagation();
    },
    true,
  );
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
