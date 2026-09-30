// Composants d'interface partagés : fenêtres de confirmation, messages, illustrations.

import { h } from './dom.js';
import { T } from './strings.js';

// ---------- Fenêtres de confirmation ----------

/**
 * Ouvre une fenêtre modale ancrée en bas de l'écran.
 * @param {object} o
 * @param {string} o.title
 * @param {string} [o.message]
 * @param {string[]} [o.steps] étapes numérotées, sous le message
 * @param {string} [o.note] paragraphe complémentaire, sous les étapes
 * @param {{label: string, value: string, kind?: 'primary'|'secondary'|'danger'}[]} o.actions
 *        de haut en bas ; la dernière est la plus proche du pouce.
 * @param {string} [o.checkbox] libellé d'une case à cocher facultative (décochée par défaut)
 * @param {{label: string, value?: string, maxLength?: number, isValid?: (text: string) => boolean}} [o.input]
 *        champ texte facultatif ; tant que `isValid` est faux, l'action principale est désactivée.
 *        Entrée déclenche l'action principale.
 * @param {boolean} [o.dismissible=true] Échap / retour ferment la fenêtre (valeur null)
 * @returns {Promise<{value: string|null, checked: boolean, text: string}>}
 */
export function openDialog({ title, message, steps, note, actions, checkbox, input, dismissible = true }) {
  return new Promise((resolve) => {
    const titleId = `dlg-${Math.random().toString(36).slice(2)}`;
    let box = null;
    let field = null;
    const dialog = h(
      'dialog',
      { class: 'dialog', 'aria-labelledby': titleId },
      h('h2', { class: 'dialog-title', id: titleId }, title),
      message && h('p', { class: 'dialog-text' }, message),
      steps && h('ol', { class: 'dialog-steps' }, steps.map((s) => h('li', {}, s))),
      note && h('p', { class: 'dialog-text muted' }, note),
      checkbox &&
        h('label', { class: 'check' }, (box = h('input', { type: 'checkbox' })), h('span', {}, checkbox)),
      input &&
        h(
          'div',
          { class: 'field dialog-field' },
          h('label', { class: 'label', for: `${titleId}-input` }, input.label),
          (field = h('input', {
            type: 'text',
            id: `${titleId}-input`,
            class: 'input',
            value: input.value ?? '',
            maxlength: input.maxLength,
            autocomplete: 'off',
            enterkeyhint: 'done',
          })),
        ),
      h(
        'div',
        { class: 'dialog-actions' },
        actions.map((a) =>
          h('button', { type: 'button', class: `btn btn-${a.kind || 'secondary'}`, onclick: () => done(a.value) }, a.label),
        ),
      ),
    );
    let settled = false;
    function done(value) {
      if (settled) return;
      settled = true;
      const checked = box ? box.checked : false;
      const text = field ? field.value : '';
      dialog.close();
      dialog.remove();
      resolve({ value, checked, text });
    }
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      if (dismissible) done(null);
    });
    document.body.append(dialog);
    dialog.showModal();
    const buttons = [...dialog.querySelectorAll('.dialog-actions button')];
    if (field) {
      const primaryIndex = actions.findIndex((a) => a.kind === 'primary');
      const primary = buttons[primaryIndex];
      const refresh = () => {
        if (primary) primary.disabled = input.isValid ? !input.isValid(field.value) : false;
      };
      field.addEventListener('input', refresh);
      field.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || e.isComposing) return;
        e.preventDefault();
        if (primary && !primary.disabled) done(actions[primaryIndex].value);
      });
      refresh();
      field.focus();
      field.select();
      return;
    }
    // Focus sur l'action la moins engageante (la première non destructive).
    const safe = buttons.find((b, i) => actions[i].kind !== 'danger' && actions[i].kind !== 'primary') || buttons[0];
    safe?.focus();
  });
}

/** Confirmation simple : renvoie true si l'action est confirmée. */
export async function confirmAction({ title, message, confirmLabel, danger = false, cancelLabel = T.common.cancel }) {
  const { value } = await openDialog({
    title,
    message,
    actions: [
      { label: confirmLabel, value: 'ok', kind: danger ? 'danger' : 'primary' },
      { label: cancelLabel, value: 'cancel', kind: 'secondary' },
    ],
  });
  return value === 'ok';
}

// ---------- Lignes à glisser ----------

/** Ligne actuellement ouverte : une seule à la fois. */
let openSwipe = null;

function closeOpenSwipe(except = null) {
  if (openSwipe && openSwipe.row !== except) openSwipe.close();
}

/**
 * Ligne qui, glissée vers la gauche, découvre ses actions (`.swipe-actions`, placées sous le
 * contenu `.swipe-content`). Relâchée au-delà de la moitié, elle reste ouverte ; un appui sur
 * le contenu ou ailleurs la referme. Le focus clavier sur une action l'ouvre aussi.
 */
export function swipeRow(row) {
  const content = row.querySelector('.swipe-content');
  const actions = row.querySelector('.swipe-actions');
  let offset = 0;
  let start = null;
  let dragging = false;
  let swallowClick = false;

  const set = (x, animate) => {
    offset = x;
    content.style.transition = animate ? '' : 'none';
    content.style.transform = x ? `translateX(${x}px)` : '';
    row.classList.toggle('swipe-open', x !== 0);
  };
  const self = {
    row,
    close() {
      if (openSwipe === self) openSwipe = null;
      set(0, true);
    },
  };
  const open = () => {
    closeOpenSwipe(row);
    openSwipe = self;
    set(-actions.offsetWidth, true);
  };

  content.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    start = { x: e.clientX, y: e.clientY, offset, id: e.pointerId };
    dragging = false;
    swallowClick = false;
  });
  content.addEventListener('pointermove', (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!dragging) {
      // Mouvement plutôt vertical : c'est un défilement de la page.
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) start = null;
      if (!start || Math.abs(dx) < 10) return;
      dragging = true;
      content.setPointerCapture(e.pointerId);
      closeOpenSwipe(row);
    }
    set(Math.min(0, Math.max(-actions.offsetWidth, start.offset + dx)), false);
  });
  const end = (e) => {
    if (!start || e.pointerId !== start.id) return;
    start = null;
    if (!dragging) return;
    swallowClick = true;
    if (offset < -actions.offsetWidth / 2) open();
    else self.close();
  };
  content.addEventListener('pointerup', end);
  content.addEventListener('pointercancel', end);
  // Après un glissement, ou sur une ligne ouverte, l'appui ne déclenche pas le bouton touché.
  content.addEventListener(
    'click',
    (e) => {
      if (!swallowClick && offset === 0) return;
      e.preventDefault();
      e.stopPropagation();
      if (!swallowClick) self.close();
      swallowClick = false;
    },
    true,
  );
  actions.addEventListener('focusin', () => {
    if (offset === 0) open();
  });
  row.addEventListener('focusout', (e) => {
    if (!row.contains(e.relatedTarget) && openSwipe === self) self.close();
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (openSwipe && !openSwipe.row.contains(e.target)) openSwipe.close();
    },
    true,
  );
}

// ---------- Messages éphémères ----------

let toastTimer = null;

export function toast(text) {
  const region = document.getElementById('toast');
  if (!region) return;
  region.textContent = text;
  region.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    region.hidden = true;
    region.textContent = '';
  }, 3500);
}

// ---------- Illustrations d'exercice ----------

const svgCache = new Map();

/** Charge un SVG livré avec l'application et renvoie son texte (mis en cache). */
function loadSvg(path) {
  if (!svgCache.has(path)) {
    svgCache.set(
      path,
      fetch(path).then((r) => {
        if (!r.ok) throw new Error(`${path} : ${r.status}`);
        return r.text();
      }),
    );
    svgCache.get(path).catch(() => svgCache.delete(path));
  }
  return svgCache.get(path);
}

/** Précharge des illustrations, pour un affichage immédiat (le hors-ligne est assuré par le service worker). */
export function preloadIllustrations(entries) {
  for (const e of entries) loadSvg(e.svg).catch(() => {});
}

/**
 * Conteneur d'illustration. Le SVG est inséré dans le DOM (et non via <img>) pour hériter de
 * currentColor et des réglages de mouvement. Seuls les fichiers du catalogue sont chargés.
 * @param entry entrée du catalogue (ou GENERIC)
 * @param {object} o
 * @param {boolean} [o.still] animation figée sur la position clé (vignettes)
 * @param {string} [o.label] libellé accessible ; sans libellé, l'illustration est décorative
 */
export function illustration(entry, { still = false, label = null, className = '' } = {}) {
  const box = h('div', { class: `illu ${still ? 'illu--still' : ''} ${className}`.trim() });
  if (!label) box.setAttribute('aria-hidden', 'true');
  loadSvg(entry.svg)
    .then((text) => {
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      const svg = doc.documentElement;
      if (svg.nodeName !== 'svg' || doc.querySelector('parsererror')) return;
      // Position clé : instant data-key-time (fraction) d'un cycle de data-cycle secondes.
      const cycle = Number(svg.getAttribute('data-cycle')) || 0;
      const keyTime = Number(svg.getAttribute('data-key-time')) || 0;
      box.style.setProperty('--key-delay', `${-(keyTime * cycle).toFixed(3)}s`);
      const node = document.importNode(svg, true);
      node.setAttribute('focusable', 'false');
      if (label) {
        node.setAttribute('role', 'img');
        node.setAttribute('aria-label', label);
        const title = node.querySelector('title');
        if (title) title.textContent = label;
      } else {
        node.querySelector('title')?.remove();
      }
      box.replaceChildren(node);
    })
    .catch(() => {});
  return box;
}
