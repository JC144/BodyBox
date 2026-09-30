// Générateur d'illustrations animées (spécification, section 6.2).
//
// Un personnage est un arbre de segments rigides. Chaque pose donne l'angle ABSOLU de chaque
// segment, en degrés, dans le repère de l'écran (y vers le bas) :
//     0 = vers la droite, 90 = vers le bas, 180 (ou -180) = vers la gauche, -90 = vers le haut.
// Un angle croissant tourne donc dans le sens des aiguilles d'une montre.
//
// Le SVG produit dessine le personnage dans la première pose de la chronologie et anime chaque
// segment par une rotation autour de son articulation (groupes imbriqués, transform-origin en
// coordonnées du viewBox), plus une translation de l'ensemble si la racine se déplace.

export const LIMB = 10;
export const HEAD_R = 14;
export const PROP = 4;
export const FAR = 0.45;

/** Longueurs par défaut (unités du viewBox de 240). Debout, la tête culmine ~178 au-dessus du sol. */
export const L = { cuisse: 40, tibia: 40, pied: 14, tronc: 60, tete: 24, bras: 32, avantBras: 32, epaule: 16, hanche: 8 };

/**
 * Squelette de profil. Racine : le bassin.
 * Segments : cuisse, tibia, pied ; tronc, tete ; bras, avant-bras.
 * Avec `double: true`, un second jeu de membres (suffixe -2) dessiné à 45 % d'opacité
 * figure le côté éloigné. `pieds: false` supprime les pieds.
 */
export function profil({ double = false, pieds = true, lengths = {} } = {}) {
  const l = { ...L, ...lengths };
  const segs = [];
  const jambe = (s, op) => {
    segs.push({ name: `cuisse${s}`, parent: null, length: l.cuisse, opacity: op });
    segs.push({ name: `tibia${s}`, parent: `cuisse${s}`, length: l.tibia, opacity: op });
    if (pieds) segs.push({ name: `pied${s}`, parent: `tibia${s}`, length: l.pied, opacity: op });
  };
  const bras = (s, op) => {
    segs.push({ name: `bras${s}`, parent: 'tronc', length: l.bras, opacity: op });
    segs.push({ name: `avant-bras${s}`, parent: `bras${s}`, length: l.avantBras, opacity: op });
  };
  if (double) jambe('-2', FAR);
  jambe('', 1);
  segs.push({ name: 'tronc', parent: null, length: l.tronc });
  segs.push({ name: 'tete', parent: 'tronc', length: l.tete, kind: 'head' });
  if (double) bras('-2', FAR);
  bras('', 1);
  return segs;
}

/**
 * Squelette de face. Racine : le milieu du bassin.
 * Segments : hanche-g/-d (demi-bassin), cuisse-g/-d, tibia-g/-d, pied-g/-d (si `pieds`) ;
 * tronc, tete, epaule-g/-d (demi-carrure), bras-g/-d, avant-bras-g/-d.
 * « g » est le côté gauche DE L'ÉCRAN.
 */
export function face({ pieds = false, lengths = {} } = {}) {
  const l = { ...L, ...lengths };
  const segs = [];
  for (const s of ['-g', '-d']) {
    segs.push({ name: `hanche${s}`, parent: null, length: l.hanche });
    segs.push({ name: `cuisse${s}`, parent: `hanche${s}`, length: l.cuisse });
    segs.push({ name: `tibia${s}`, parent: `cuisse${s}`, length: l.tibia });
    if (pieds) segs.push({ name: `pied${s}`, parent: `tibia${s}`, length: l.pied });
  }
  segs.push({ name: 'tronc', parent: null, length: l.tronc });
  segs.push({ name: 'tete', parent: 'tronc', length: l.tete, kind: 'head' });
  for (const s of ['-g', '-d']) {
    segs.push({ name: `epaule${s}`, parent: 'tronc', length: l.epaule });
    segs.push({ name: `bras${s}`, parent: `epaule${s}`, length: l.bras });
    segs.push({ name: `avant-bras${s}`, parent: `bras${s}`, length: l.avantBras });
  }
  return segs;
}

/** Angles d'une pose de face « debout, bras le long du corps » (à compléter ou surcharger). */
export const FACE_DEBOUT = {
  'hanche-g': 180, 'hanche-d': 0, 'cuisse-g': 92, 'cuisse-d': 88, 'tibia-g': 90, 'tibia-d': 90,
  'pied-g': 180, 'pied-d': 0,
  tronc: -90, tete: -90, 'epaule-g': 180, 'epaule-d': 0,
  'bras-g': 96, 'bras-d': 84, 'avant-bras-g': 92, 'avant-bras-d': 88,
};

// ——— Géométrie ———

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const lerp = (a, b, u) => a + (b - a) * u;
const lerp2 = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];

function index(skeleton) {
  const byName = new Map();
  for (const s of skeleton) {
    if (byName.has(s.name)) throw new Error(`segment en double : ${s.name}`);
    if (s.parent && !byName.has(s.parent)) throw new Error(`segment ${s.name} : parent inconnu ou déclaré après (${s.parent})`);
    byName.set(s.name, s);
  }
  return byName;
}

/** Positions des extrémités de chaque segment, racine en `root`. */
function fk(skeleton, angles, root) {
  const start = {};
  const end = {};
  for (const s of skeleton) {
    const a = angles[s.name];
    if (a === undefined || Number.isNaN(a)) throw new Error(`angle manquant pour le segment « ${s.name} »`);
    const p = s.parent ? end[s.parent] : root;
    start[s.name] = p;
    end[s.name] = [p[0] + s.length * Math.cos(rad(a)), p[1] + s.length * Math.sin(rad(a))];
  }
  return { start, end };
}

/** Point nommé : « root », le nom d'un segment (son extrémité) ou « nom@0.5 » (fraction du segment). */
function point(skel, pts, root, name) {
  if (name === 'root') return root;
  const [seg, frac] = name.split('@');
  if (!pts.end[seg]) throw new Error(`point inconnu : ${name}`);
  if (frac === undefined) return pts.end[seg];
  return lerp2(pts.start[seg], pts.end[seg], Number(frac));
}

/** IK à deux segments : angles absolus de a et b pour que l'extrémité de b atteigne `target`. */
function ik2(S, target, l1, l2, bend) {
  const dx = target[0] - S[0];
  const dy = target[1] - S[1];
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1e-6), l1 + l2 - 1e-6);
  const base = Math.atan2(dy, dx);
  const alpha = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const a1 = base + (bend >= 0 ? alpha : -alpha);
  const J = [S[0] + l1 * Math.cos(a1), S[1] + l1 * Math.sin(a1)];
  const a2 = Math.atan2(target[1] - J[1], target[0] - J[0]);
  return [deg(a1), deg(a2)];
}

/**
 * Résout une pose : { angles, root? , pin?: { point, at: [x, y] }, ik?: [{ chain: [a, b], target: [x, y], bend: 1|-1 }] }.
 * `pin` place la racine de sorte que le point nommé tombe en `at` (il ne doit pas dépendre d'une chaîne IK).
 * `bend: 1` fait tourner le premier segment dans le sens horaire par rapport à la droite articulation→cible.
 */
export function solvePose(skeleton, pose) {
  const byName = index(skeleton);
  const angles = { ...pose.angles };
  for (const k of pose.ik || []) for (const n of k.chain) if (angles[n] === undefined) angles[n] = 0;
  for (const n of Object.keys(angles)) if (!byName.has(n)) throw new Error(`angle donné pour un segment inconnu : ${n}`);
  let root;
  if (pose.root) root = pose.root;
  else if (pose.pin) {
    const p = point(skeleton, fk(skeleton, angles, [0, 0]), [0, 0], pose.pin.point);
    root = [pose.pin.at[0] - p[0], pose.pin.at[1] - p[1]];
  } else throw new Error('une pose doit avoir « root » ou « pin »');
  let pts = fk(skeleton, angles, root);
  for (const k of pose.ik || []) {
    const [a, b] = k.chain.map((n) => byName.get(n));
    if (!a || !b || b.parent !== a.name) throw new Error(`chaîne IK invalide : ${k.chain.join(' → ')}`);
    [angles[a.name], angles[b.name]] = ik2(pts.start[a.name], k.target, a.length, b.length, k.bend ?? 1);
    pts = fk(skeleton, angles, root);
  }
  return { root, angles, pts };
}

/** Pose intermédiaire entre deux poses (u de 0 à 1) : interpole les consignes, puis résout. */
function interpolate(skeleton, p0, p1, s0, s1, u) {
  const ikNames = new Set();
  const ik = [];
  for (const k0 of p0.ik || []) {
    const k1 = (p1.ik || []).find((k) => k.chain.join() === k0.chain.join());
    if (k1) {
      ik.push({ chain: k0.chain, target: lerp2(k0.target, k1.target, u), bend: k0.bend ?? 1 });
      k0.chain.forEach((n) => ikNames.add(n));
    }
  }
  const angles = {};
  for (const n of Object.keys(s0.angles)) {
    if (!ikNames.has(n)) angles[n] = lerp(s0.angles[n], s1.angles[n], u);
  }
  const pose = { angles, ik };
  if (p0.pin && p1.pin && p0.pin.point === p1.pin.point) pose.pin = { point: p0.pin.point, at: lerp2(p0.pin.at, p1.pin.at, u) };
  else pose.root = lerp2(s0.root, s1.root, u);
  return solvePose(skeleton, pose);
}

// ——— Chronologie ———

function bezier(x1, y1, x2, y2) {
  return (x) => {
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const t = (lo + hi) / 2;
      const bx = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
      if (bx < x) lo = t; else hi = t;
    }
    const t = (lo + hi) / 2;
    return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  };
}
const EASES = { 'in-out': bezier(0.42, 0, 0.58, 1), in: bezier(0.42, 0, 1, 1), out: bezier(0, 0, 0.58, 1), linear: (x) => x };

/**
 * Échantillons { t, state, tf } de la chronologie.
 * timeline : [[t, 'pose', { ease?, samples? }?], …], t de 0 à 1, première et dernière pose identiques.
 * Transition « in-out » par défaut : une image au milieu (ease-in puis ease-out), comme les SVG d'origine.
 * Autres courbes, ou `samples` > 1 : n images intermédiaires, interpolation linéaire entre elles.
 */
function sample(spec, solved) {
  const tl = spec.timeline;
  if (tl[0][0] !== 0 || tl[tl.length - 1][0] !== 1) throw new Error('la chronologie doit aller de 0 à 1');
  if (tl[0][1] !== tl[tl.length - 1][1]) throw new Error('la chronologie doit finir sur sa pose de départ (boucle)');
  const out = [];
  for (let i = 0; i < tl.length - 1; i++) {
    const [t0, n0, opt = {}] = tl[i];
    const [t1, n1] = tl[i + 1];
    if (!(t1 > t0)) throw new Error(`chronologie non croissante à ${t0}`);
    for (const n of [n0, n1]) if (!solved[n]) throw new Error(`pose inconnue : ${n}`);
    if (n0 === n1) {
      out.push({ t: t0, state: solved[n0], tf: null });
      continue;
    }
    const ease = opt.ease || 'in-out';
    // Avec une IK, les images intermédiaires limitent la dérive des extrémités fixées.
    const usesIk = (spec.poses[n0].ik || []).length > 0 || (spec.poses[n1].ik || []).length > 0;
    const samples = opt.samples ?? (ease === 'in-out' && !usesIk ? 1 : 3);
    const mid = (u) => interpolate(spec.skeleton, spec.poses[n0], spec.poses[n1], solved[n0], solved[n1], u);
    if (ease === 'in-out' && samples === 1) {
      out.push({ t: t0, state: solved[n0], tf: 'ease-in' });
      out.push({ t: (t0 + t1) / 2, state: mid(0.5), tf: 'ease-out' });
    } else {
      const f = EASES[ease];
      if (!f) throw new Error(`courbe inconnue : ${ease}`);
      out.push({ t: t0, state: solved[n0], tf: 'linear' });
      for (let k = 1; k <= samples; k++) {
        const x = k / (samples + 1);
        out.push({ t: t0 + (t1 - t0) * x, state: mid(f(x)), tf: 'linear' });
      }
    }
  }
  out.push({ t: 1, state: solved[tl[tl.length - 1][1]], tf: null });
  return out;
}

// ——— Export SVG ———

const num = (v) => {
  const r = Math.round(v * 10) / 10;
  return Object.is(r, -0) ? '0' : String(r);
};
const pct = (t) => `${Math.round(t * 10000) / 100}%`;

/** Élément de décor : { line: [x1, y1, x2, y2] } | { rect: [x, y, w, h] } | { circle: [cx, cy, r] } | { path: 'd' } ; options w, fill, opacity. */
function propEl(p, map = (x, y) => [x, y]) {
  const attrs = [];
  if (p.fill) attrs.push('fill="currentColor"', p.w ? '' : 'stroke="none"');
  attrs.push(`stroke-width="${p.w ?? PROP}"`);
  if (p.opacity) attrs.push(`opacity="${p.opacity}"`);
  const a = attrs.filter(Boolean).join(' ');
  if (p.line) {
    const [x1, y1] = map(p.line[0], p.line[1]);
    const [x2, y2] = map(p.line[2], p.line[3]);
    return `<line x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" ${a}/>`;
  }
  if (p.circle) {
    const [cx, cy] = map(p.circle[0], p.circle[1]);
    return `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(p.circle[2])}" ${a}/>`;
  }
  if (p.rect) {
    if (p.local) throw new Error('rect non pris en charge sur un segment : utiliser path ou line');
    const [x, y, w, h] = p.rect;
    return `<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" ${a}/>`;
  }
  if (p.path) return `<path d="${p.path}" ${a}/>`;
  if (p.polyline) {
    const pts = [];
    for (let i = 0; i < p.polyline.length; i += 2) pts.push(map(p.polyline[i], p.polyline[i + 1]).map(num).join(','));
    return `<polyline points="${pts.join(' ')}" ${a}/>`;
  }
  throw new Error(`élément de décor inconnu : ${JSON.stringify(p)}`);
}

/**
 * Construit le SVG d'un exercice.
 * spec : { id, title, cycle, keyTime, skeleton, poses, timeline, ground?, props?, attach?, front? }
 *  - ground : y du sol (filet de 14 à 226), ou [x1, x2, y] ;
 *  - props : décor fixe (chaise, mur…), dessiné derrière le personnage ; `front` : décor devant ;
 *  - attach : { segment: [éléments] } décor lié à un segment, en coordonnées locales
 *    (x le long du segment depuis son articulation, y perpendiculaire, vers la droite du segment).
 */
export function build(spec) {
  const { id, skeleton } = spec;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`identifiant invalide : ${id}`);
  index(skeleton);
  const solved = {};
  for (const [n, p] of Object.entries(spec.poses)) {
    try {
      solved[n] = solvePose(skeleton, p);
    } catch (e) {
      throw new Error(`pose « ${n} » : ${e.message}`);
    }
  }
  const frames = sample(spec, solved);
  const rest = frames[0].state;

  // Rotation relative de chaque segment à chaque image, angles déroulés pour rester continus.
  const rel = {};
  for (const s of skeleton) {
    let prev = null;
    rel[s.name] = frames.map((f) => {
      let v = f.state.angles[s.name] - rest.angles[s.name];
      if (s.parent) v -= f.state.angles[s.parent] - rest.angles[s.parent];
      if (prev !== null) while (v - prev > 180) v -= 360;
      if (prev !== null) while (v - prev < -180) v += 360;
      prev = v;
      return v;
    });
  }
  const animated = new Set(skeleton.filter((s) => rel[s.name].some((v) => Math.abs(v) > 0.05)).map((s) => s.name));
  const moves = frames.map((f) => [f.state.root[0] - rest.root[0], f.state.root[1] - rest.root[1]]);
  const rootMoves = moves.some(([x, y]) => Math.abs(x) > 0.05 || Math.abs(y) > 0.05);

  // Propriétés communes à tous les groupes animés dans une classe `{id}-j` ; la courbe la plus
  // fréquente sert de courbe par défaut, les autres sont précisées image par image.
  const counts = new Map();
  for (const f of frames) if (f.tf && f.t < 1) counts.set(f.tf, (counts.get(f.tf) || 0) + 1);
  const defaultTf = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] || 'ease-in-out';
  const css = [`.${id}-j{transform-box:view-box;animation:${spec.cycle}s ${defaultTf} infinite}`];
  const anim = (cls, values, origin) => {
    const head = origin ? `transform-origin:${num(origin[0])}px ${num(origin[1])}px;` : '';
    css.push(`.${cls}{${head}animation-name:${cls}}`);
    const groups = new Map();
    frames.forEach((f, i) => {
      const tf = f.tf && f.tf !== defaultTf && f.t < 1 ? `;animation-timing-function:${f.tf}` : '';
      const key = `{transform:${values[i]}${tf}}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(pct(f.t));
    });
    css.push(`@keyframes ${cls}{${[...groups].map(([k, ps]) => ps.join(',') + k).join('')}}`);
  };
  if (rootMoves) anim(`${id}-root`, moves.map(([x, y]) => `translate(${num(x)}px,${num(y)}px)`));
  for (const s of skeleton) {
    if (animated.has(s.name)) anim(`${id}-${s.name}`, rel[s.name].map((v) => `rotate(${num(v)}deg)`), rest.pts.start[s.name]);
  }

  const children = new Map();
  for (const s of skeleton) {
    const k = s.parent || '';
    if (!children.has(k)) children.set(k, []);
    children.get(k).push(s);
  }
  const attach = spec.attach || {};
  const draw = (s) => {
    const a = rest.pts.start[s.name];
    const b = rest.pts.end[s.name];
    const op = s.opacity && s.opacity < 1 ? ` opacity="${s.opacity}"` : '';
    let out = '';
    if (s.kind === 'head') out += `<circle cx="${num(b[0])}" cy="${num(b[1])}" r="${HEAD_R}" fill="currentColor" stroke="none"${op}/>`;
    else if (s.kind !== 'none') {
      const w = s.width && s.width !== LIMB ? ` stroke-width="${s.width}"` : '';
      out += `<line x1="${num(a[0])}" y1="${num(a[1])}" x2="${num(b[0])}" y2="${num(b[1])}"${w}${op}/>`;
    }
    if (attach[s.name]) {
      const ang = rad(rest.angles[s.name]);
      const map = (x, y) => [a[0] + x * Math.cos(ang) - y * Math.sin(ang), a[1] + x * Math.sin(ang) + y * Math.cos(ang)];
      for (const p of attach[s.name]) out += propEl({ ...p, local: true }, map);
    }
    for (const c of children.get(s.name) || []) out += draw(c);
    return animated.has(s.name) ? `<g class="${id}-j ${id}-${s.name}">${out}</g>` : out;
  };
  let figure = (children.get('') || []).map(draw).join('');
  if (rootMoves) figure = `<g class="${id}-j ${id}-root">${figure}</g>`;

  let ground = '';
  if (spec.ground !== undefined) {
    const [x1, x2, y] = Array.isArray(spec.ground) ? spec.ground : [14, 226, spec.ground];
    ground = `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke-width="2"/>`;
  }
  const props = (spec.props || []).map((p) => propEl(p)).join('');
  const front = (spec.front || []).map((p) => propEl(p)).join('');
  const title = String(spec.title).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const style = css.length > 1 ? `<style>${css.join('')}</style>` : '';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" data-cycle="${spec.cycle}" data-key-time="${spec.keyTime}">` +
    `<title>${title}</title>${style}` +
    `<g fill="none" stroke="currentColor" stroke-width="${LIMB}" stroke-linecap="round" stroke-linejoin="round">` +
    `${ground}${props}${figure}${front}</g></svg>`;
  return svg;
}

/** Contrôles de la section 6.2 sur un SVG produit (ou existant). Renvoie la liste des problèmes. */
export function check(svg, id) {
  const problems = [];
  const bytes = Buffer.byteLength(svg);
  if (bytes > 10 * 1024) problems.push(`poids ${bytes} o > 10 Ko`);
  if (!svg.includes('viewBox="0 0 240 240"')) problems.push('viewBox manquant');
  if (/\s(width|height)="/.test(svg.replace(/<rect[^>]*>/g, ''))) problems.push('width/height fixe');
  if (/#[0-9a-f]{3,6}\b|rgb\(|hsl\(/i.test(svg)) problems.push('couleur écrite en dur');
  const colors = [...svg.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1]).filter((c) => c !== 'none' && c !== 'currentColor');
  if (colors.length) problems.push(`couleurs non autorisées : ${[...new Set(colors)].join(', ')}`);
  if (/<script|<image|href=/i.test(svg)) problems.push('script, image ou ressource externe');
  if (!/role="img"/.test(svg) || !/<title>[^<]+<\/title>/.test(svg)) problems.push('role="img" ou <title> manquant');
  if (!/data-cycle="[\d.]+"/.test(svg) || !/data-key-time="[\d.]+"/.test(svg)) problems.push('data-cycle ou data-key-time manquant');
  for (const m of svg.matchAll(/\.([a-z0-9-]+)\{/g)) if (!m[1].startsWith(`${id}-`)) problems.push(`classe non préfixée : ${m[1]}`);
  for (const m of svg.matchAll(/@keyframes ([a-z0-9-]+)/g)) if (!m[1].startsWith(`${id}-`)) problems.push(`keyframes non préfixées : ${m[1]}`);
  return problems;
}
