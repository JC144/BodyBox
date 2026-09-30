// Module partagé (non construit : le nom commence par « _ ») : extensions triceps au poids du corps,
// mains sur un appui fixe (table, barre), corps droit sur la pointe des pieds (K1, K3).
// Le corps gainé pivote autour des pieds ; les coudes fléchissent et la tête passe sous l'appui.
import { profil } from '../rig.js';

const corps = (a, tete = a) => ({ cuisse: 180 + a, tibia: 180 + a, tronc: a, tete });

/** `pieds` et `mains` : appuis fixes ; `haut` / `bas` : [angle du corps, angle de la tête]. */
export function extensionsTriceps({ id, title, pieds, mains, haut, bas, props, cycle = 2.8, bend = 1 }) {
  const pose = ([a, tete]) => ({
    angles: corps(a, tete),
    pin: { point: 'tibia', at: pieds },
    ik: [{ chain: ['bras', 'avant-bras'], target: mains, bend }],
  });
  return {
    id,
    title,
    cycle,
    keyTime: 0.5,
    skeleton: profil({ pieds: false }),
    ground: 214,
    props,
    poses: { haut: pose(haut), bas: pose(bas) },
    timeline: [[0, 'haut'], [0.45, 'bas'], [0.55, 'bas'], [0.95, 'haut'], [1, 'haut']],
  };
}
