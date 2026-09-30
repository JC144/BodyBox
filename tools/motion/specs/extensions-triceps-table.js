import { extensionsTriceps } from './_extensions-triceps.js';

// K1 : mains au bord d'une table d'environ 1 m, pieds à environ 1,30 m, flexion complète des bras.
export default extensionsTriceps({
  id: 'extensions-triceps-table',
  title: 'Extensions triceps à la table',
  pieds: [30, 209],
  mains: [158, 111],
  haut: [-61, -42],
  bas: [-32, 30],
  props: [{ line: [156, 114, 228, 114] }, { line: [198, 114, 198, 214] }, { line: [222, 114, 222, 214] }],
});
