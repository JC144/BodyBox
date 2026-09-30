// A12 — Mains à 40 cm d'écart sur deux chaises côte à côte (dessinées comme un banc), pieds sur un
// meuble de 1 m à 1,10 m : pompe déclinée, la poitrine vient au contact des assises.
import { pompe, tabouret, caisse, appui } from './_pompes.js';

const sol = 204;
const yP = appui(105, sol);
const y = appui(45, sol);
const yS = y - 5;
const P = [38, yP];
const xS = P[0] + Math.sqrt(140 ** 2 - (yS - yP) ** 2);
const H = [Math.round(xS - 12), y];

export default pompe({
  id: 'pompes-pieds-meuble-mains-serrees',
  title: 'Pompes pieds sur meuble, mains serrées',
  P,
  H,
  haut: { bras: 63.5 },
  bas: { y: yS },
  sol,
  props: [...caisse(14, 46, 105, sol), ...tabouret(H[0] - 34, H[0] + 6, 45, sol)],
});
