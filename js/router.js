// Routage par fragment d'URL (#/…), sans rechargement de page.

const listeners = new Set();
let routes = [];
let fallback = '/playlists';
let current = null;
let previous = null;

/**
 * @param {{pattern: RegExp, name: string}[]} table
 * @param {string} defaultPath route utilisée pour un fragment inconnu
 */
export function startRouter(table, defaultPath) {
  routes = table;
  fallback = defaultPath;
  window.addEventListener('hashchange', resolve);
  resolve();
}

export function onRoute(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function currentRoute() {
  return current;
}

/** Route affichée avant la route courante (null au lancement). */
export function previousRoute() {
  return previous;
}

/** Change d'écran. `replace` remplace l'entrée d'historique courante. */
export function navigate(path, { replace = false } = {}) {
  const hash = `#${path}`;
  if (location.hash === hash) {
    resolve();
  } else if (replace) {
    location.replace(hash);
  } else {
    location.hash = hash;
  }
}

/** Construit un chemin en encodant ses paramètres. */
export function path(...segments) {
  return `/${segments.map((s) => encodeURIComponent(s)).join('/')}`;
}

function resolve() {
  const p = location.hash.replace(/^#/, '');
  for (const r of routes) {
    const m = p.match(r.pattern);
    if (m) {
      previous = current;
      current = { name: r.name, params: m.slice(1).map((x) => (x === undefined ? undefined : decodeURIComponent(x))), path: p };
      for (const fn of listeners) fn(current);
      return;
    }
  }
  location.replace(`#${fallback}`);
}
