// Construction du DOM. Tout texte est inséré comme texte (nœuds texte), jamais comme HTML.

/**
 * h('button', { class: 'btn', onclick: fn, 'aria-label': '…' }, 'Libellé', autreNoeud)
 * - les propriétés `on…` deviennent des écouteurs ;
 * - `class`, `for`, `aria-*`, `data-*`, etc. deviennent des attributs ;
 * - `false`, `null` et `undefined` sont ignorés (attributs comme enfants).
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === false || value == null) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2), value);
    } else if (key === 'value' || key === 'checked' || key === 'disabled' || key === 'selected') {
      el[key] = value;
    } else {
      el.setAttribute(key, value === true ? '' : String(value));
    }
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === false || child == null) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function clear(el) {
  el.replaceChildren();
  return el;
}

/** Titre d'écran, cible du focus lors d'un changement d'écran. */
export function screenTitle(text, extra = {}) {
  return h('h1', { class: 'screen-title', tabindex: '-1', ...extra }, text);
}

/**
 * Titre d'écran servant aussi de lien retour (vers l'accueil par défaut) : « ← Titre ».
 * `homeLabel` n'est lu que par les lecteurs d'écran, pour annoncer la destination.
 */
export function backTitle(text, homeLabel, href = '#/playlists') {
  return h(
    'h1',
    { class: 'back-title', tabindex: '-1' },
    h(
      'a',
      { href, class: 'back' },
      h('span', { 'aria-hidden': 'true' }, '←'),
      h('span', { class: 'visually-hidden' }, `${homeLabel} : `),
      text,
    ),
  );
}

/** Libellé en petites capitales au-dessus d'une valeur. */
export function label(text, extra = {}) {
  return h('span', { class: 'label', ...extra }, text);
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Élément SVG ; `attrs` devient des attributs, `children` des éléments enfants. */
function svgEl(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...children);
  return el;
}

/** Icône au trait, en currentColor et décorative (le libellé est porté par le bouton). */
function icon(attrs, ...children) {
  return svgEl(
    'svg',
    {
      viewBox: '0 0 24 24', width: '28', height: '28', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.25',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false', ...attrs,
    },
    ...children,
  );
}

/** Engrenage (bouton Réglages). */
export function gearIcon() {
  return icon(
    {},
    svgEl('circle', { cx: '12', cy: '12', r: '3' }),
    svgEl('path', {
      d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    }),
  );
}

/** Plus (bouton Importer). */
export function plusIcon() {
  return icon({}, svgEl('path', { d: 'M12 4v16M4 12h16' }));
}

/** Flèche qui descend dans un plateau (installer). */
export function installIcon() {
  return icon({ width: '20', height: '20' }, svgEl('path', { d: 'M12 3v12M7 10l5 5 5-5M5 19h14' }));
}

/** Crayon (modifier). */
export function pencilIcon() {
  return icon({ width: '24', height: '24' }, svgEl('path', { d: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4' }));
}

/** Boîte d'où sort une flèche (partager). */
export function shareIcon() {
  return icon({ width: '24', height: '24' }, svgEl('path', { d: 'M12 15V3M7 8l5-5 5 5M5 12v8h14v-8' }));
}

/** Corbeille (supprimer). */
export function trashIcon() {
  return icon(
    { width: '24', height: '24' },
    svgEl('path', { d: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6' }),
  );
}

/**
 * Pointe de flèche étirée sur la largeur de son conteneur : vers le bas (`chevron-down`)
 * et vers le haut (`chevron-up`), superposées ; la feuille de style n'en montre qu'une.
 */
export function chevronIcon() {
  return icon(
    { viewBox: '0 0 100 12', width: '100%', height: '16', preserveAspectRatio: 'none', 'stroke-width': '2.5' },
    svgEl('polyline', { class: 'chevron-down', points: '2,2 50,10 98,2', 'vector-effect': 'non-scaling-stroke' }),
    svgEl('polyline', { class: 'chevron-up', points: '2,10 50,2 98,10', 'vector-effect': 'non-scaling-stroke' }),
  );
}
