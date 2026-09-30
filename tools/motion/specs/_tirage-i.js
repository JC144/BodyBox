import { profil } from '../rig.js';

// Tractions horizontales (tirage) sous une barre posée sur deux dossiers de chaise (I6, I8, technique de C4).
// Profil, allongé sur le dos, tête à droite. La barre, vue en bout, est un disque posé sur le
// dossier de la chaise du fond (dessinée estompée, en 3 traits). Les mains
// restent sur la barre (IK) ; le corps, gainé, pivote autour des talons (jambes tendues) ou des
// genoux (pieds à plat, genoux fléchis). En position haute, la barre touche le bas des pectoraux.

const rad = (d) => (d * Math.PI) / 180;
const SOL = 214;

/** Position de la barre pour que la poitrine la touche quand le buste fait l'angle `a` (pivot, distance pivot → épaules). */
function barre(pivot, dist, a) {
  const u = [Math.cos(rad(a)), Math.sin(rad(a))];
  const n = [Math.sin(rad(a)), -Math.cos(rad(a))]; // normale côté ventre (vers le haut)
  const e = [pivot[0] + dist * u[0], pivot[1] + dist * u[1]];
  const poitrine = [e[0] - 16 * u[0], e[1] - 16 * u[1]];
  return [poitrine[0] + 10 * n[0], poitrine[1] + 10 * n[1]];
}

function chaise([bx, by]) {
  // Chaise du fond, de profil et estompée : dossier sous la barre, assise vers la tête.
  const o = { w: 3, opacity: 0.5 };
  const assise = SOL - 46;
  return [
    { line: [bx, by, bx, SOL], ...o }, { line: [bx, assise, bx + 42, assise], ...o }, { line: [bx + 42, assise, bx + 42, SOL], ...o },
  ];
}

/**
 * genoux : false → jambes tendues, talons au sol (pivot aux chevilles) ;
 *          true  → pieds à plat, genoux fléchis à ~90° (pivot aux genoux, tibias fixes).
 * haut, bas : angle du buste (degrés, négatif = épaules plus hautes que le pivot) ; « bas » est
 *   calculé s'il manque (bras presque tendus).
 */
export function tirage({ id, title, genoux, haut, bas, cycle = 2.8 }) {
  const cheville = genoux ? [58, SOL - 5] : [34, SOL - 7];
  const genou = [cheville[0], cheville[1] - 40];
  const pivot = genoux ? genou : cheville;
  const dist = genoux ? 100 : 140;
  const B = barre(pivot, dist, haut);
  // Position basse par défaut : bras presque tendus (épaules à 62 de la barre).
  if (bas === undefined) {
    bas = haut;
    const ep = (a) => [pivot[0] + dist * Math.cos(rad(a)), pivot[1] + dist * Math.sin(rad(a))];
    while (Math.hypot(ep(bas)[0] - B[0], ep(bas)[1] - B[1]) < 62) bas += 0.5;
  }
  const pose = (a) => ({
    angles: genoux
      ? { cuisse: 180 + a, tibia: 90, pied: 180, tronc: a, tete: a - 4 }
      : { cuisse: 180 + a, tibia: 180 + a, pied: a - 95, tronc: a, tete: a - 4 },
    pin: { point: 'tibia', at: cheville },
    ik: [{ chain: ['bras', 'avant-bras'], target: B, bend: -1 }],
  });
  return {
    id,
    title,
    cycle,
    keyTime: 0.45,
    skeleton: profil(),
    ground: SOL,
    props: [...chaise(B), { circle: [B[0], B[1], 8], fill: true }],
    poses: { bas: pose(bas), haut: pose(haut) },
    timeline: [[0, 'bas'], [0.4, 'haut'], [0.52, 'haut'], [0.94, 'bas'], [1, 'bas']],
  };
}
