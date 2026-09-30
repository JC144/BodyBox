// A7 — Comme A1, mains écartées de la largeur des épaules sur deux chaises, pieds sur une
// troisième. De profil, l'écart des mains ne se voit pas : même mouvement que A1, buste un peu
// moins bas (poitrine au niveau des assises).
import { pompe, chaise, appui } from './_pompes.js';

const sol = 200;
const y = appui(45, sol);

export default pompe({
  id: 'pompes-chaises-ecart-epaules',
  title: 'Pompes entre chaises, écart des épaules',
  P: [34, y],
  H: [160, y],
  bas: { y: y - 2 },
  sol,
  keyTime: 0.975,
  props: [...chaise(12, 56, 45, 'g', sol), ...chaise(142, 186, 45, null, sol)],
});
