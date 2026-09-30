import { profil } from '../rig.js';

// Relevé de buste avec rotation, alterné : en haut, un coude vient vers le genou opposé, puis
// l'autre au tour suivant. Le bras éloigné est dessiné à 45 % d'opacité.
const jambes = { cuisse: -55, tibia: 55, pied: 0 };
const buste = (t, { proche = 35, loin = 35, tete = 0 } = {}) => ({
  tronc: t,
  tete: t + tete,
  bras: t + proche,
  'avant-bras': t - 130 + (proche - 35),
  'bras-2': t + loin,
  'avant-bras-2': t - 130 + (loin - 35),
});
// Le profil double ajoute une jambe éloignée, confondue avec la jambe proche.
const deux = (a) => ({ ...a, 'cuisse-2': a.cuisse, 'tibia-2': a.tibia, 'pied-2': a.pied });
const pose = (b) => ({ angles: deux({ ...jambes, ...b }), root: [124, 167] });

export default {
  id: 'releve-buste-rotation',
  title: 'Relevé de buste avec rotation',
  cycle: 5.2,
  keyTime: 0.2,
  skeleton: profil({ double: true }),
  ground: 172,
  poses: {
    bas: pose(buste(190)),
    // Coude proche vers le genou : le bras proche plonge vers les cuisses, l'éloigné s'ouvre.
    procheHaut: pose(buste(288, { proche: 70, loin: 5, tete: 25 })),
    loinHaut: pose(buste(288, { proche: 5, loin: 70, tete: 25 })),
  },
  timeline: [
    [0, 'bas'], [0.2, 'procheHaut'], [0.25, 'procheHaut'], [0.46, 'bas'], [0.5, 'bas'],
    [0.7, 'loinHaut'], [0.75, 'loinHaut'], [0.96, 'bas'], [1, 'bas'],
  ],
};
