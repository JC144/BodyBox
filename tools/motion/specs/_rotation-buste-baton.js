// Rotations du buste avec un bâton derrière les épaules (exercices T et X), VUE DE DESSUS :
// une rotation autour de l'axe vertical ne se lit ni de profil ni de face. Le personnage
// regarde vers le bas de l'écran ; tête au centre, carrure et bâton pivotent autour du cou,
// bassin et jambes restent fixes.
//
// Les angles du haut du corps sont ceux du repos décalés de θ : rotation rigide autour du cou
// (une IK interpolerait les mains sur la corde de l'arc et plierait les coudes en cours de route).

const deg = (r) => (r * 180) / Math.PI;
const EP = 22; // demi-carrure
const BR = 27; // bras et avant-bras, raccourcis par la vue de dessus
const MAIN = [58, -7]; // main droite dans le repère des épaules (x vers la droite, y vers le bas)

/** Angles bras / avant-bras (côté droit de l'écran) pour poser la main sur le bâton, coude vers l'avant. */
function brasDroit(sens) {
  const dx = MAIN[0] - EP;
  const dy = MAIN[1];
  const d = Math.hypot(dx, dy);
  const base = Math.atan2(dy, dx);
  const alpha = Math.acos((d / 2) / BR);
  const a1 = base + sens * alpha; // 1 : coude vers le bas de l'écran (l'avant) ; -1 : vers l'arrière
  const J = [BR * Math.cos(a1), BR * Math.sin(a1)];
  return [deg(a1), deg(Math.atan2(dy - J[1], dx - J[0]))];
}

/**
 * @param o.id, o.title, o.cycle, o.amplitude (degrés de part et d'autre)
 * @param o.bassin [x, y] ; o.buste { length, angle } : du bassin au cou, vu de dessus
 * @param o.jambes { hanche, cuisse: [longueur, angle droit], tibia: [...], pied: [...] }
 *        (angles du côté droit de l'écran ; le côté gauche est symétrique)
 * @param o.props décor ; o.coudes : 'avant' (défaut) ou 'arriere' ; o.bassinVisible (défaut vrai)
 */
export function rotationBaton(o) {
  const j = o.jambes;
  const sym = (a) => 180 - a;
  const [B, AB] = brasDroit(o.coudes === 'arriere' ? -1 : 1);
  const hk = o.bassinVisible === false ? { kind: 'none' } : {};
  const skeleton = [
    { name: 'hanche-g', parent: null, length: j.hanche, ...hk },
    { name: 'cuisse-g', parent: 'hanche-g', length: j.cuisse[0] },
    { name: 'tibia-g', parent: 'cuisse-g', length: j.tibia[0] },
    { name: 'pied-g', parent: 'tibia-g', length: j.pied[0] },
    { name: 'hanche-d', parent: null, length: j.hanche, ...hk },
    { name: 'cuisse-d', parent: 'hanche-d', length: j.cuisse[0] },
    { name: 'tibia-d', parent: 'cuisse-d', length: j.tibia[0] },
    { name: 'pied-d', parent: 'tibia-d', length: j.pied[0] },
    { name: 'tronc', parent: null, length: o.buste.length, kind: o.buste.length < 8 ? 'none' : undefined },
    { name: 'epaule-g', parent: 'tronc', length: EP },
    { name: 'bras-g', parent: 'epaule-g', length: BR },
    { name: 'avant-bras-g', parent: 'bras-g', length: BR },
    { name: 'epaule-d', parent: 'tronc', length: EP },
    { name: 'bras-d', parent: 'epaule-d', length: BR },
    { name: 'avant-bras-d', parent: 'bras-d', length: BR },
    { name: 'tete', parent: 'tronc', length: 3, kind: 'head' },
  ];
  const pose = (t) => ({
    angles: {
      'hanche-g': 180, 'cuisse-g': sym(j.cuisse[1]), 'tibia-g': sym(j.tibia[1]), 'pied-g': sym(j.pied[1]),
      'hanche-d': 0, 'cuisse-d': j.cuisse[1], 'tibia-d': j.tibia[1], 'pied-d': j.pied[1],
      tronc: o.buste.angle, tete: 90,
      'epaule-g': 180 + t, 'bras-g': 180 - B + t, 'avant-bras-g': 180 - AB + t,
      'epaule-d': t, 'bras-d': B + t, 'avant-bras-d': AB + t,
    },
    root: o.bassin,
  });
  const a = o.amplitude;
  return {
    id: o.id,
    title: o.title,
    cycle: o.cycle,
    keyTime: 0.05,
    skeleton,
    props: o.props || [],
    // Bâton lié à l'épaule droite : x le long de la carrure depuis le cou, y vers l'avant.
    attach: { 'epaule-d': [{ line: [-76, MAIN[1], 76, MAIN[1]], w: 5 }] },
    poses: { droite: pose(a), gauche: pose(-a) },
    // Va-et-vient régulier, bref arrêt en fin de rotation de chaque côté.
    timeline: [[0, 'droite'], [0.1, 'droite'], [0.5, 'gauche'], [0.6, 'gauche'], [1, 'droite']],
  };
}
