// Module partagé (non construit : le nom commence par « _ ») : squat sur une jambe en se tenant à un
// cadre de porte ou à un poteau (exercices E à E3). Vue de profil, face au montant (à droite).
// La jambe d'appui est au premier plan ; la jambe libre, tenue devant sans toucher le sol, est
// dessinée à l'arrière-plan (45 %). Les mains restent posées sur le montant.

import { profil } from '../rig.js';

const G = 214;
const CHEVILLE = [118, 209];
const MAINS = [177, 114];
export const POLE = 183;

// Squelette de profil avec deux jambes mais un seul bras (les deux mains font le même geste).
const skeleton = profil({ double: true }).filter((s) => !s.name.endsWith('-2') || !s.name.includes('bras'));

/**
 * Pose : angles de la jambe d'appui (cuisse, tibia), du tronc, et de la jambe libre [cuisse, tibia, pied].
 */
export function pose(cuisse, tibia, tronc, libre) {
  return {
    angles: { cuisse, tibia, pied: 0, tronc, tete: (tronc - 90) / 2, 'cuisse-2': libre[0], 'tibia-2': libre[1], 'pied-2': libre[2] },
    pin: { point: 'tibia', at: CHEVILLE },
    ik: [{ chain: ['bras', 'avant-bras'], target: MAINS, bend: 1 }],
  };
}

export const DEBOUT = pose(89, 91, -76, [66, 80, -10]);

export function squat({ id, title, cycle, keyTime, poses, timeline }) {
  return {
    id,
    title,
    cycle,
    keyTime,
    skeleton,
    ground: G,
    // Montant du cadre de porte (ou poteau), en arrière-plan.
    props: [{ line: [POLE, 24, POLE, G], w: 6, opacity: 0.45 }],
    poses,
    // Deux images intermédiaires par transition suffisent (mains sur un montant vertical) et allègent le SVG.
    timeline: timeline.map(([t, n, o]) => [t, n, { samples: 2, ...o }]),
  };
}
