import { fente } from './_fente-laterale.js';

// E5 : même fente latérale que E4, mais toute la série du même côté.
export default {
  id: 'fente-laterale-un-cote',
  title: 'Fente latérale, un côté par série',
  cycle: 2.6,
  keyTime: 0.5,
  ...fente,
  timeline: [[0, 'debout', { samples: 2 }], [0.4, 'droite'], [0.6, 'droite', { samples: 2 }], [0.96, 'debout'], [1, 'debout']],
};
