import { profil } from '../rig.js';

// Allongé sur le dos, tête à gauche, genoux fléchis, pieds à plat. Le buste s'enroule jusqu'aux
// cuisses, puis redescend sans que les épaules reposent au sol.
const jambes = { cuisse: -55, tibia: 55, pied: 0 };
// Mains derrière la nuque : le bras part vers le ventre, l'avant-bras revient derrière la tête.
export const buste = (t, { bras = 35, tete = 0 } = {}) => ({ tronc: t, tete: t + tete, bras: t + bras, 'avant-bras': t - 130 });

export const BAS = { angles: { ...jambes, ...buste(190) }, root: [124, 167] };
export const HAUT = { angles: { ...jambes, ...buste(292, { tete: 25 }) }, root: [124, 167] };

export default {
  id: 'releve-buste',
  title: 'Relevé de buste',
  cycle: 2.6,
  keyTime: 0.45,
  skeleton: profil(),
  ground: 172,
  poses: { bas: BAS, haut: HAUT },
  timeline: [[0, 'bas'], [0.4, 'haut'], [0.5, 'haut'], [0.92, 'bas'], [1, 'bas']],
};
