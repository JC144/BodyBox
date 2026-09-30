import { pompeUnBras } from './_pompe-un-bras.js';

// Q1 : pompe sur un bras, main sur un support de 25 cm, corps le plus droit possible.
export default pompeUnBras({
  id: 'pompes-un-bras-support-bas',
  title: 'Pompes sur un bras, support de 25 cm',
  main: [164, 181],
  pieds: 30,
  haut: 38,
  bas: 20,
  pied2: [88, 209],
  props: [{ rect: [150, 186, 36, 28] }],
});
