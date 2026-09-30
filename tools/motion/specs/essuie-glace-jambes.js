// Exercice V : « essuie-glace ». Allongé sur le dos, bras écartés au sol, jambes presque tendues
// à la verticale ; on les descend d'un côté puis de l'autre sans creuser les reins.
// Vue depuis les pieds (le balancement latéral ne se lit ni de profil ni de dessus) : bras
// étendus sur le sol de part et d'autre, tête posée au sol derrière le bassin, jambes serrées
// qui pivotent ensemble autour du bassin comme un essuie-glace.
const P = [120, 186];
const J = 7; // demi-écart des jambes

const skeleton = [
  { name: 'hanche-g', parent: null, length: J },
  { name: 'cuisse-g', parent: 'hanche-g', length: 42 },
  { name: 'tibia-g', parent: 'cuisse-g', length: 40 },
  { name: 'hanche-d', parent: null, length: J },
  { name: 'cuisse-d', parent: 'hanche-d', length: 42 },
  { name: 'tibia-d', parent: 'cuisse-d', length: 40 },
];
const pose = (t) => ({
  angles: { 'hanche-g': 180 + t, 'cuisse-g': -90 + t, 'tibia-g': -90 + t, 'hanche-d': t, 'cuisse-d': -90 + t, 'tibia-d': -90 + t },
  root: P,
});

export default {
  id: 'essuie-glace-jambes',
  title: 'Essuie-glace, jambes presque tendues',
  cycle: 4,
  keyTime: 0.05,
  skeleton,
  ground: 214,
  props: [
    // Tête posée au sol, bras en croix sur le sol.
    { circle: [120, 199, 14], fill: true },
    { line: [34, 208, 206, 208], w: 10 },
  ],
  poses: { gauche: pose(-58), droite: pose(58) },
  timeline: [[0, 'gauche'], [0.1, 'gauche'], [0.5, 'droite'], [0.6, 'droite'], [1, 'gauche']],
};
