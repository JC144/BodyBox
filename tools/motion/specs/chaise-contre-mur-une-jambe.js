import { profil, solvePose } from '../rig.js';
import { decor, buste, X, CHEVILLE, HAUT, ASSIS } from './_chaise-murale.js';

// F3 : chaise contre le mur sur une jambe, la cheville de l'autre posée sur le genou d'appui.
// La jambe croisée part vers le spectateur : ses segments sont raccourcis (vue en raccourci)
// et elle est dessinée par-dessus la jambe d'appui.
const skeleton = profil({ double: true })
  .filter((s) => !/^(avant-)?bras-2$/.test(s.name))
  .map((s) => ({ ...s, ...({ 'cuisse-2': { length: 30 }, 'tibia-2': { length: 24 }, 'pied-2': { length: 12 } }[s.name] || {}) }))
  .map((s) => (s.opacity ? { ...s, opacity: 1 } : s));
// La jambe croisée (-2) doit être dessinée après la jambe d'appui : on la déplace après le tibia d'appui.
const croisee = skeleton.filter((s) => /-2$/.test(s.name));
const ordre = skeleton.filter((s) => !/-2$/.test(s.name));
ordre.splice(ordre.findIndex((s) => s.name === 'pied') + 1, 0, ...croisee);

const appui = { chain: ['cuisse', 'tibia'], target: CHEVILLE, bend: -1 };
const angles = { ...buste, 'pied-2': -8 };

// Cheville croisée posée sur le genou d'appui (calculé pour chaque hauteur de bassin), mains sur la jambe croisée.
// En haut, la glissade part moins haut qu'en F1 : la jambe d'appui est déjà fléchie.
const pose = (y) => {
  const genou = solvePose(ordre, { root: [X, y], angles: { ...angles, 'cuisse-2': 0, 'tibia-2': 0, bras: 0, 'avant-bras': 0 }, ik: [appui] }).pts.end.cuisse;
  return {
    root: [X, y], angles,
    ik: [appui, { chain: ['cuisse-2', 'tibia-2'], target: [genou[0] + 2, genou[1] - 10], bend: -1 }, { chain: ['bras', 'avant-bras'], target: [genou[0] - 4, genou[1] - 20], bend: -1 }],
  };
};

export default {
  id: 'chaise-contre-mur-une-jambe',
  title: 'Chaise contre le mur sur une jambe',
  cycle: 4.4,
  keyTime: 0.5,
  skeleton: ordre,
  ...decor,
  poses: {
    debout: pose(HAUT + 12),
    assis: pose(ASSIS),
  },
  timeline: [[0, 'debout'], [0.22, 'assis'], [0.8, 'assis'], [0.96, 'debout'], [1, 'debout']],
};
