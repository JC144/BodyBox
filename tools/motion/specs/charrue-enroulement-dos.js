import { profil } from '../rig.js';

// Exercice U : allongé sur le dos, jambes presque tendues au-dessus du ventre, bras au sol.
// On enroule la colonne pour faire passer les pieds par-dessus la tête (charrue), puis on revient
// lentement. Les épaules, la tête et les bras restent au sol (épaules épinglées).
const EPAULES = [138, 209];
const pose = (a) => ({ angles: a, pin: { point: 'tronc', at: EPAULES } });
const commun = { tete: -22, bras: 180, 'avant-bras': 180 };

export default {
  id: 'charrue-enroulement-dos',
  title: 'Charrue (enroulement du dos)',
  cycle: 4,
  keyTime: 0.5,
  skeleton: profil(),
  ground: 214,
  poses: {
    // Bassin au sol, jambes à la verticale, légèrement fléchies.
    depart: pose({ ...commun, tronc: 0, cuisse: -96, tibia: -80, pied: 0 }),
    // Bassin décollé, jambes au-dessus du visage.
    milieu: pose({ ...commun, tronc: 40, cuisse: -46, tibia: -34, pied: 40 }),
    // Charrue : dos enroulé, bassin au-dessus des épaules, pointes de pieds vers le sol derrière la tête.
    charrue: pose({ ...commun, tronc: 80, cuisse: 12, tibia: 26, pied: 75 }),
  },
  timeline: [
    [0, 'depart'], [0.08, 'depart'], [0.26, 'milieu'], [0.44, 'charrue'], [0.56, 'charrue'],
    [0.74, 'milieu'], [0.92, 'depart'], [1, 'depart'],
  ],
};
