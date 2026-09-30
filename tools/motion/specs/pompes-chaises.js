// A1 — Mains sur deux chaises très écartées, pieds sur une troisième : le buste descend entre
// les chaises jusqu'au niveau des assises, coudes vers le haut (vue de profil d'un écart large).
// Chaise des mains sans dossier dessiné : la tête passe devant elle en position basse.
import { pompe, chaise, appui } from './_pompes.js';

const sol = 200;
const y = appui(45, sol);

export default pompe({
  id: 'pompes-chaises',
  title: 'Pompes entre chaises',
  P: [34, y],
  H: [160, y],
  bas: { y: y + 4 },
  sol,
  keyTime: 0.975,
  props: [...chaise(12, 56, 45, 'g', sol), ...chaise(142, 186, 45, null, sol)],
});
