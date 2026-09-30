// Installation sur l'écran d'accueil : invite du navigateur (Android, Chrome, Edge) ou aide pas à pas (iOS).

/** Invite mise de côté par le navigateur (`beforeinstallprompt`) ; elle ne sert qu'une fois. */
let deferredPrompt = null;
const listeners = new Set();

function notify() {
  for (const fn of listeners) fn();
}

/** iPhone, iPad ou iPod ; les iPad récents se présentent comme un Mac tactile. */
export function isIosDevice(userAgent, maxTouchPoints = 0) {
  return /iPhone|iPad|iPod/.test(userAgent) || (userAgent.includes('Macintosh') && maxTouchPoints > 1);
}

/** Vrai quand l'application est ouverte depuis l'écran d'accueil (déjà installée). */
export function isStandalone() {
  return navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
}

/**
 * Mode d'installation disponible : `prompt` (invite du navigateur), `ios` (aide pas à pas)
 * ou null (déjà installée, ou navigateur sans installation possible).
 */
export function installMode() {
  if (isStandalone()) return null;
  if (deferredPrompt) return 'prompt';
  if (isIosDevice(navigator.userAgent, navigator.maxTouchPoints)) return 'ios';
  return null;
}

/** Appelle `fn` quand le mode d'installation peut avoir changé ; renvoie la fonction de désabonnement. */
export function onInstallChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Ouvre l'invite du navigateur ; renvoie true si l'installation est acceptée. */
export async function promptInstall() {
  const event = deferredPrompt;
  if (!event) return false;
  deferredPrompt = null;
  event.prompt();
  const { outcome } = await event.userChoice;
  notify();
  return outcome === 'accepted';
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Pas de bandeau du navigateur : le bouton Installer de l'accueil le remplace.
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}
