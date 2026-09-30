// Module partagé (ignoré par build.js) : personnage allongé sur le côté, vu de face (plan frontal
// = plan de l'écran), jambes vers la gauche, tête vers la droite. Sert aux flexions latérales du buste
// (N sur support, N1 au sol). Côté « -g » : dessus (vers le haut) ; côté « -d » : dessous.
import { face } from '../rig.js';

export const squelette = () => face({ lengths: { epaule: 8, hanche: 6 } });

/** Angles pour un buste orienté à `t` degrés (0 = horizontal vers la droite, négatif = relevé). */
export const angles = (t, jambes = 180) => ({
  'hanche-g': -90, 'hanche-d': 90,
  'cuisse-g': jambes, 'tibia-g': jambes, 'cuisse-d': jambes, 'tibia-d': jambes,
  tronc: t, tete: t,
  'epaule-g': t - 90, 'epaule-d': t + 90,
  // Main du dessus derrière la tête, coude ouvert ; bras du dessous replié contre le buste (confondu avec lui).
  'bras-g': t - 50, 'avant-bras-g': t + 155,
  'bras-d': t + 182, 'avant-bras-d': t + 2,
});
