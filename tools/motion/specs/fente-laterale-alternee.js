import { fente } from './_fente-laterale.js';

// E4 : fente latérale, une jambe puis l'autre dans le même cycle.
export default {
  id: 'fente-laterale-alternee',
  title: 'Fente latérale alternée',
  cycle: 4.8,
  keyTime: 0.25,
  ...fente,
  timeline: [
    [0, 'debout', { samples: 2 }], [0.2, 'droite'], [0.3, 'droite', { samples: 2 }], [0.48, 'debout'], [0.52, 'debout', { samples: 2 }],
    [0.7, 'gauche'], [0.8, 'gauche', { samples: 2 }], [0.98, 'debout'], [1, 'debout'],
  ],
};
