// Réglages (stockés dans IndexedDB, clé `settings` du store `meta`) et application du thème.

import { getMeta, setMeta } from './db.js';

export const DEFAULT_SETTINGS = { theme: 'dark' };

let cached = null;

export async function loadSettings() {
  cached = { ...DEFAULT_SETTINGS, ...((await getMeta('settings')) || {}) };
  return cached;
}

export function getSettings() {
  return cached || { ...DEFAULT_SETTINGS };
}

export async function saveSettings(patch) {
  cached = { ...getSettings(), ...patch };
  await setMeta('settings', cached);
  return cached;
}

const darkQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;

/** Applique le thème : `dark`, `light` ou `system` (suit le réglage de l'appareil). */
export function applyTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  const dark = theme === 'dark' || (theme === 'system' && (!darkQuery || darkQuery.matches));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000000' : '#FFFFFF');
}

darkQuery?.addEventListener('change', () => {
  if (getSettings().theme === 'system') applyTheme('system');
});
