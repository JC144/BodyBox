// Exercice Y : allongé sur le côté droit, un coussin épais sous les côtes, le bras du dessous
// étendu sur le sol dans le prolongement du corps. On tourne lentement la tête vers le plafond,
// aussi loin que possible sans forcer, puis on la ramène en la tournant légèrement vers le sol.
//
// Vue de face, tête à gauche. La rotation de la tête se fait autour de l'axe du cou, qui est dans
// le plan de l'image : elle est figurée par un petit ergot (le nez) qui balaie la tête, caché
// derrière le cou quand le visage est tourné vers nous, dressé quand il regarde le plafond.
// Seul l'ergot bouge.
const skeleton = [
  { name: 'cuisse', parent: null, length: 40 },
  { name: 'tibia', parent: 'cuisse', length: 40 },
  { name: 'tronc', parent: null, length: 60 },
  { name: 'bras', parent: 'tronc', length: 32 },
  { name: 'avant-bras', parent: 'bras', length: 32 },
  { name: 'cou', parent: 'tronc', length: 12 },
  { name: 'tete', parent: 'cou', length: 12, kind: 'head' },
  { name: 'nez', parent: 'tete', length: 21, width: 8 },
];
const pose = (nez) => ({
  angles: { cuisse: 3, tibia: 0, tronc: 193.5, bras: 139, 'avant-bras': 180, cou: 178, tete: 178, nez },
  pin: { point: 'tronc', at: [86, 188] },
});

export default {
  id: 'rotation-tete-allonge-cote',
  title: 'Rotation de la tête, allongé sur le côté',
  cycle: 4,
  keyTime: 0.52,
  skeleton,
  ground: 214,
  props: [{ rect: [102, 196, 34, 16], w: 3 }], // coussin sous les côtes
  poses: { sol: pose(40), plafond: pose(-100) },
  timeline: [[0, 'sol'], [0.1, 'sol'], [0.45, 'plafond'], [0.6, 'plafond'], [1, 'sol']],
};
