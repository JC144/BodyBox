import { pompeUnBras } from './_pompe-un-bras.js';

// Q : pompe sur un bras, main sur l'assise d'une chaise, jambes tendues et écartées.
export default pompeUnBras({
  id: 'pompes-un-bras-chaise',
  title: 'Pompes sur un bras sur une chaise',
  main: [136, 155],
  pieds: 30,
  haut: 55,
  bas: 32,
  pied2: [42, 209],
  props: [{ line: [128, 160, 186, 160] }, { line: [132, 160, 132, 214] }, { line: [182, 160, 182, 214] }],
});
