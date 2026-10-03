// Transitions d'écran façon Metro : les éléments partent ou arrivent les uns après les autres.
// En avant (accueil → circuit), le contenu file vers la gauche ; au retour, vers la droite.

// Décélération très marquée, signature des animations Metro : l'élément arrive vite et se pose en douceur.
const EASE_OUT = 'cubic-bezier(0.1, 0.9, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.7, 0, 1, 0.5)';

const SIGN = { left: -1, right: 1 };

function reducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Arrivée : chaque élément glisse depuis le côté `side` ('left' ou 'right'), avec un léger
 * décalage sur le précédent. Au-delà du huitième, les éléments (hors écran le plus souvent)
 * arrivent avec le huitième.
 */
export function enterFrom(side, els) {
  if (reducedMotion()) return;
  els.filter(Boolean).forEach((el, i) => {
    el.animate([{ opacity: 0, transform: `translateX(${SIGN[side] * 64}px)` }, { opacity: 1, transform: 'none' }], {
      duration: 350,
      delay: Math.min(i, 8) * 45,
      easing: EASE_OUT,
      fill: 'backwards',
    });
  });
}

/**
 * Sortie : les éléments filent vers le côté `side`, de haut en bas ; `last` (l'élément touché)
 * part en dernier. Résolue une fois tous les éléments partis.
 */
export function leaveTo(side, els, last) {
  if (reducedMotion()) return Promise.resolve();
  const others = els.filter((el) => el && el !== last);
  const steps = [...others.map((el, i) => [el, Math.min(i, 4)]), [last, Math.min(others.length, 5)]];
  return Promise.all(
    steps.map(([el, step]) =>
      el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${SIGN[side] * 48}px)` }], {
        duration: 150,
        delay: step * 25,
        easing: EASE_IN,
        fill: 'forwards',
      }).finished,
    ),
  ).catch(() => {});
}
