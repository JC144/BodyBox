import { face, FACE_DEBOUT } from '../rig.js';

// Exercice R, vue de face (comme la photo) : en appui bras tendus sur les dossiers de deux
// chaises, pieds décollés du sol. Haussées, les épaules montent vers les oreilles et le corps
// descend entre les bras ; abaissées, le corps remonte. Les deux mains restent fixes : l'angle
// des bras est recalculé pour chaque pose (bras tendus de l'épaule à la main).
const DX = 34; // demi-écart des mains
const H = 118; // hauteur des mains
const deg = (r) => (r * 180) / Math.PI;
const pose = (e) => {
  const s = 16 * Math.cos((e * Math.PI) / 180); // demi-carrure projetée
  const dx = DX - s;
  const a = deg(Math.atan2(Math.sqrt(64 * 64 - dx * dx), dx)); // bras droit (côté droit de l'écran)
  return {
    angles: {
      ...FACE_DEBOUT,
      'cuisse-g': 91, 'cuisse-d': 89, 'tibia-g': 90, 'tibia-d': 90,
      'epaule-g': 180 + e, 'epaule-d': -e,
      'bras-g': 180 - a, 'avant-bras-g': 180 - a, 'bras-d': a, 'avant-bras-d': a,
    },
    pin: { point: 'avant-bras-g', at: [120 - DX, H] },
  };
};

// Chaise vue de profil : dossier (montant) côté personnage, assise vers l'extérieur.
const chaise = (x, s) => [
  { line: [x, H + 7, x, 214] },
  { line: [x, 166, x + s * 38, 166] },
  { line: [x + s * 36, 166, x + s * 36, 214] },
];

export default {
  id: 'haussements-epaules-appui',
  title: "Haussements d'épaules en appui",
  cycle: 3.2,
  keyTime: 0.47,
  skeleton: face({ pieds: true, lengths: { cuisse: 36, tibia: 36, tronc: 54 } }),
  ground: 214,
  props: [...chaise(120 - DX, -1), ...chaise(120 + DX, 1)],
  poses: { hausse: pose(40), abaisse: pose(-10) },
  timeline: [[0, 'hausse'], [0.4, 'abaisse'], [0.55, 'abaisse'], [0.93, 'hausse'], [1, 'hausse']],
};
