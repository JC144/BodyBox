// Module partagé (non construit : le nom commence par « _ ») : tractions horizontales (rowing inversé) sous une barre
// posée sur deux dossiers de chaise (exercices C4 à C9). Vue de profil, pieds à gauche, tête à droite.
// La barre, vue en bout, est un disque ; la chaise qui la porte est dessinée en arrière-plan.
//
// jambes : 'flechies' (pieds à plat au sol, genoux hauts), 'tendues' (talons au sol),
//          'surelevees' (talons sur un tabouret de 45 cm).
// La prise (supination ou pronation) ne se voit pas de profil : seule la position des jambes change.

import { profil } from '../rig.js';

const G = 214;
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** Intersection des cercles (C1, r1) et (C2, r2) : le point le plus bas (y le plus grand). */
function inter(C1, r1, C2, r2) {
  const dx = C2[0] - C1[0], dy = C2[1] - C1[1];
  const d = Math.hypot(dx, dy);
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const mx = C1[0] + (a * dx) / d, my = C1[1] + (a * dy) / d;
  const p = [mx + (h * dy) / d, my - (h * dx) / d];
  const q = [mx - (h * dy) / d, my + (h * dx) / d];
  return p[1] > q[1] ? p : q;
}
/** Angle de la direction C → P. */
const dir = (C, P) => deg(Math.atan2(P[1] - C[1], P[0] - C[0]));

// Hauteur de la barre et des chevilles ; la cheville est placée de sorte que la poitrine touche la
// barre en haut du mouvement.
const REGLAGES = {
  flechies: { bar: [160, 132], ankleY: 209, tibia: { bas: 102, haut: 92 } },
  tendues: { bar: [168, 136], ankleY: 208 },
  surelevees: { bar: [168, 126], ankleY: 163 },
};

export function tractionsHorizontales({ id, title, jambes }) {
  const R = REGLAGES[jambes];
  const B = R.bar;
  const Lc = jambes === 'flechies' ? 100 : 140; // du pivot (genou ou cheville) aux épaules
  const reach = Math.hypot(Lc - 10, 12);
  const pivotY = jambes === 'flechies' ? R.ankleY - 40 * Math.sin(rad(R.tibia.haut)) : R.ankleY;
  let ax = B[0] - Math.sqrt(reach * reach - (pivotY - B[1]) ** 2);
  if (jambes === 'flechies') ax += 40 * Math.cos(rad(R.tibia.haut));
  const A = [Math.round(ax), R.ankleY];
  // Bras tendus (épaule à 62 de la barre) ; en haut, poitrine (10 sous l'épaule) à 12 de la barre.
  const pose = (haut) => {
    let pivot, tib;
    if (jambes === 'flechies') {
      tib = haut ? R.tibia.haut : R.tibia.bas;
      pivot = [A[0] - 40 * Math.cos(rad(tib)), A[1] - 40 * Math.sin(rad(tib))];
    } else pivot = A;
    const P = haut ? inter(pivot, Lc - 10, B, 12) : inter(pivot, Lc, B, 63);
    const a = dir(pivot, P);
    const angles = { cuisse: a + 180, tronc: a, tete: a };
    if (jambes === 'flechies') Object.assign(angles, { tibia: tib, pied: 180 });
    else Object.assign(angles, { tibia: a + 180, pied: a - 90 });
    return { angles, pin: { point: 'tibia', at: A }, ik: [{ chain: ['bras', 'avant-bras'], target: B, bend: -1 }] };
  };

  const [bx, by] = B;
  const props = [
    // Chaise en arrière-plan : dossier incliné portant la barre, pied arrière, assise, pied avant.
    { polyline: [bx, by, bx + 8, 170, bx + 8, G], opacity: 0.45 },
    { polyline: [bx + 8, 170, bx + 40, 170, bx + 40, G], opacity: 0.45 },
  ];
  if (jambes === 'surelevees') {
    // Tabouret de 45 cm sous les talons.
    props.push({ line: [14, 170, 46, 170] }, { line: [20, 170, 16, G] }, { line: [40, 170, 44, G] });
  }
  return {
    id,
    title,
    cycle: 2.6,
    keyTime: 0.45,
    skeleton: profil(),
    ground: G,
    props,
    front: [{ circle: [bx, by, 7], fill: true }],
    poses: { bas: pose(false), haut: pose(true) },
    timeline: [[0, 'bas'], [0.4, 'haut'], [0.5, 'haut'], [0.92, 'bas'], [1, 'bas']],
  };
}
