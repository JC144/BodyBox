// A2 — Mains très écartées sur deux chaises, pieds sur un meuble d'environ 1 m : pompe déclinée,
// la tête et le buste plongent entre les chaises.
import { pompe, chaise, caisse, appui } from './_pompes.js';

const sol = 204;
const P = [38, appui(100, sol)];
const y = appui(45, sol);

export default pompe({
  id: 'pompes-chaises-pieds-meuble',
  title: 'Pompes entre chaises, pieds sur meuble',
  P,
  H: [152, y],
  haut: { bras: 63.5 },
  bas: { y: y + 6 },
  sol,
  props: [...caisse(14, 46, 100, sol), ...chaise(134, 178, 45, null, sol)],
});
