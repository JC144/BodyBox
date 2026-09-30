// A8 — Comme A7 (mains sur deux chaises, écart des épaules), pieds au sol : pompe inclinée,
// la poitrine descend entre les chaises.
import { pompe, chaise, appui } from './_pompes.js';

const sol = 200;
const y = appui(45, sol);

export default pompe({
  id: 'pompes-chaises-pieds-au-sol',
  title: 'Pompes entre chaises, pieds au sol',
  P: [38, appui(0, sol)],
  H: [158, y],
  haut: { bras: 63.5 },
  bas: { y: y + 4 },
  sol,
  props: chaise(140, 184, 45, null, sol),
});
