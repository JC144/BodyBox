// Module partagé des pompes (famille A du livre) : décor schématique et poses calculées.
// Les fichiers commençant par « _ » ne sont pas des fiches : build.js les ignore.
//
// Échelle : 1 unité ≈ 1 cm. Personnage de profil, tête à droite, corps gainé des pointes de pieds
// (bout du tibia, squelette sans pieds) aux épaules : jambes 80 + tronc 60 = 140.
// P : appui des pieds ; H : appui des mains (5 unités au-dessus de la surface, demi-trait).

import { profil } from '../rig.js';

export const SOL = 214;
const JAMBES = 80;
const TRONC = 60;
const CORPS = JAMBES + TRONC;
const R = 180 / Math.PI;
// Angle ramené dans [-90, 270[ : jambes vers la gauche (~180), tronc vers la droite (~0), sans
// saut de ±360 entre deux poses (l'interpolation est linéaire).
const angle = (p, q) => ((((Math.atan2(q[1] - p[1], q[0] - p[0]) * R + 90) % 360) + 360) % 360) - 90;

/** y d'une main ou d'un pied posé sur une surface de hauteur h (cm) au-dessus du sol. */
export const appui = (h, sol = SOL) => sol - h - 5;

// ——— Décor ———

/** Chaise de profil en 4 traits : assise de x1 à x2 à hauteur h, dossier à gauche ('g') ou à droite ('d'). */
export function chaise(x1, x2, h = 45, dossier = 'd', sol = SOL) {
  const y = sol - h;
  const out = [{ line: [x1, y, x2, y] }, { line: [x1 + 4, y, x1 + 4, sol] }, { line: [x2 - 4, y, x2 - 4, sol] }];
  if (dossier === 'g') out.push({ line: [x1 + 4, y, x1, y - 44] });
  if (dossier === 'd') out.push({ line: [x2 - 4, y, x2, y - 44] });
  return out;
}

/** Tabouret ou banc : assise et deux pieds. */
export const tabouret = (x1, x2, h = 45, sol = SOL) => chaise(x1, x2, h, null, sol);

/** Support plein (caisse, marche, brique, meuble) : un rectangle posé au sol. */
export const caisse = (x1, x2, h, sol = SOL) => [{ rect: [x1, sol - h, x2 - x1, h] }];

// ——— Géométrie ———

/** Intersection de deux cercles ; `haut` : le point le plus haut à l'écran, sinon le plus bas. */
export function inter(c1, r1, c2, r2, haut = true) {
  const dx = c2[0] - c1[0];
  const dy = c2[1] - c1[1];
  const d = Math.hypot(dx, dy);
  if (d > r1 + r2 || d < Math.abs(r1 - r2)) throw new Error(`appui hors d'atteinte (distance ${d.toFixed(1)})`);
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const m = [c1[0] + (a * dx) / d, c1[1] + (a * dy) / d];
  const p = [m[0] + (h * dy) / d, m[1] - (h * dx) / d];
  const q = [m[0] - (h * dy) / d, m[1] + (h * dx) / d];
  return p[1] < q[1] === haut ? p : q;
}

/**
 * Pose de pompe, pieds en P, mains en H.
 *  - `bras` : distance épaule-main (62 ≈ bras tendus) ; ou `y` : hauteur des épaules (corps droit) ;
 *  - `sous` : avec `bras`, prend l'épaule la plus basse des deux solutions ;
 *  - `hanches` : élévation des jambes en degrés (hanches hors de l'alignement, pour les pompes
 *    circulaires) ; sans elle, le corps reste droit ;
 *  - `epaules` : position imposée des épaules, hanches cassées vers le haut (carpé).
 */
export function pose(P, H, { bras, y, sous = false, hanches, epaules, tete = 0, bend = 1 }) {
  let S;
  let hip;
  if (epaules) {
    S = epaules;
    hip = inter(P, JAMBES, S, TRONC, true);
  } else if (hanches === undefined) {
    if (y !== undefined) {
      const dy = P[1] - y;
      S = [P[0] + Math.sqrt(CORPS * CORPS - dy * dy), y];
    } else S = inter(P, CORPS, H, bras, !sous);
    hip = [P[0] + ((S[0] - P[0]) * JAMBES) / CORPS, P[1] + ((S[1] - P[1]) * JAMBES) / CORPS];
  } else {
    hip = [P[0] + JAMBES * Math.cos(hanches / R), P[1] - JAMBES * Math.sin(hanches / R)];
    S = inter(hip, TRONC, H, bras, !sous);
  }
  const reach = Math.hypot(S[0] - H[0], S[1] - H[1]);
  if (reach > 63.9) throw new Error(`main hors d'atteinte (${reach.toFixed(1)})`);
  const jambe = angle(hip, P);
  const tronc = angle(hip, S);
  return {
    angles: { cuisse: jambe, tibia: jambe, tronc, tete: tronc + tete },
    pin: { point: 'tibia', at: P },
    ik: [{ chain: ['bras', 'avant-bras'], target: H, bend }],
  };
}

/** Chronologie d'une pompe : descente, arrêt en bas, remontée, arrêt en haut. */
export const POMPE = [[0, 'haut'], [0.45, 'bas'], [0.55, 'bas'], [0.95, 'haut'], [1, 'haut']];

/**
 * Fiche complète d'une pompe à corps droit.
 * { id, title, P, H, haut?: {…options de pose}, bas: {…}, bend?, props, front?, sol?, cycle?, keyTime? }
 * `bend: -1` quand les épaules passent sous le niveau des mains en restant derrière elles
 * (pompes entre deux chaises) : le coude reste en haut et en arrière.
 */
export function pompe({ id, title, P, H, haut = { bras: 62 }, bas, bend = 1, props = [], front = [], sol = SOL, cycle = 2.6, keyTime = 0.5 }) {
  return {
    id,
    title,
    cycle,
    keyTime,
    skeleton: profil({ pieds: false }),
    ground: sol,
    props,
    front,
    poses: { haut: pose(P, H, { bend, ...haut }), bas: pose(P, H, { bend, ...bas }) },
    timeline: POMPE,
  };
}

/**
 * Pompes mains sur un support plein de hauteur `mains` (cm), pieds au sol ou sur un support de
 * hauteur `pieds` : la poitrine descend jusqu'à toucher le support des mains (A3 à A6, A9).
 *  - `appuiPieds` : décor sous les pieds, 'caisse' (défaut) ou 'chaise' ;
 *  - `x` : position des pieds ; `dx` : écart horizontal pieds-mains (sinon déduit de `avance`) ;
 *  - en bas, épaules `marge` au-dessus des mains et `avance` devant elles : coude en arrière et
 *    en haut, poitrine (derrière les épaules) au contact du support.
 */
export function pompeSupport({ id, title, mains, pieds = 0, appuiPieds = 'caisse', sol = SOL, x = 36, dx, avance = 12, marge = 12, cycle = 2.4, keyTime = 0.5 }) {
  const yP = appui(pieds, sol);
  const yH = appui(mains, sol);
  const yS = yH - marge;
  // Épaules en bas : corps droit, poitrine sur le support, épaules un peu devant les mains.
  const xS = x + Math.sqrt(CORPS * CORPS - (yP - yS) ** 2);
  const H = [dx === undefined ? Math.round(xS - avance) : x + dx, yH];
  const P = [x, yP];
  const props = [];
  if (pieds > 0) props.push(...(appuiPieds === 'chaise' ? chaise(x - 22, x + 18, pieds, 'g', sol) : caisse(x - 12, x + 12, pieds, sol)));
  // Support des mains : il commence sous la poitrine, un peu derrière les mains.
  const x1 = H[0] - 12;
  props.push(...(mains >= 30 ? tabouret(x1, x1 + 40, mains, sol) : caisse(x1, x1 + 30, mains, sol)));
  return pompe({ id, title, P, H, haut: { bras: 63.5 }, bas: { y: yS }, props, sol, cycle, keyTime });
}

/**
 * Pompes circulaires (A10, A11) : position de A7, les épaules décrivent un cercle — hanches hautes
 * bras tendus (carpé), corps droit bras tendus (planche), corps droit poitrine entre les chaises
 * (bas), hanches hautes bras fléchis, tête vers les mains (fléchi).
 * `sens` : 1 pour carpé → planche → bas → fléchi (A10), -1 pour l'ordre inverse (A11).
 */
export function pompeCirculaire({ id, title, sens = 1, sol = 200, cycle = 3.6, keyTime }) {
  const y = appui(45, sol);
  const P = [34, y];
  const H = [160, y];
  const poses = {
    // Épaules en arrière des mains, bras tendus, hanches hautes.
    carpe: pose(P, H, { epaules: [H[0] - 22, H[1] - 59] }),
    planche: pose(P, H, { bras: 63.5 }),
    bas: pose(P, H, { y: y + 2 }),
    // Épaules basses, juste derrière les mains, coudes en arrière, tête vers les mains.
    flechi: pose(P, H, { epaules: [H[0] - 2, H[1] - 38] }),
  };
  const ordre = sens > 0 ? ['planche', 'bas', 'flechi'] : ['flechi', 'bas', 'planche'];
  const timeline = [
    [0, 'carpe'],
    [0.06, 'carpe', { ease: 'in', samples: 2 }],
    [0.3, ordre[0], { ease: 'out', samples: 2 }],
    [0.5, ordre[1]],
    [0.56, ordre[1], { ease: 'in', samples: 2 }],
    [0.8, ordre[2], { ease: 'out', samples: 2 }],
    [1, 'carpe'],
  ];
  return {
    id,
    title,
    cycle,
    keyTime,
    skeleton: profil({ pieds: false }),
    ground: sol,
    props: [...chaise(12, 56, 45, 'g', sol), ...chaise(142, 186, 45, null, sol)],
    poses,
    timeline,
  };
}
