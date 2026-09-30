// Construit les illustrations animées à partir des fiches de tools/motion/specs/.
//
//   node tools/motion/build.js                 toutes les fiches
//   node tools/motion/build.js pompes-chaises  une ou plusieurs fiches
//   … --preview [--out dossier]                planche de contrôle PNG (Edge ou Chrome en mode headless)
//
// La planche montre l'animation réelle, figée à 12 instants du cycle, plus la position clé (cadre épais).

import { readdir, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build, check } from './rig.js';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const args = process.argv.slice(2);
const preview = args.includes('--preview');
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? resolve(args[outIdx + 1]) : join(tmpdir(), 'body-box-motion');
const ids = args.filter((a, i) => !a.startsWith('--') && (outIdx < 0 || i !== outIdx + 1)).map((a) => a.replace(/\.js$/, ''));

const BROWSERS = [
  process.env.BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

function sheet(svg, spec) {
  const times = Array.from({ length: 12 }, (_, i) => i / 12);
  const cells = [...times.map((t) => [t, false]), [spec.keyTime, true]]
    .map(([t, key], i) => {
      const delay = (-t * spec.cycle).toFixed(3);
      return (
        `<style>#f${i} *{animation-delay:${delay}s!important;animation-play-state:paused!important}</style>` +
        `<figure id="f${i}" class="${key ? 'key' : ''}">${svg}<figcaption>${key ? 'clé ' : ''}${Math.round(t * 1000) / 10} %</figcaption></figure>`
      );
    })
    .join('');
  return (
    `<!doctype html><meta charset="utf-8"><body style="margin:8px;background:#fff;color:#000;font:12px sans-serif">` +
    `<style>figure{display:inline-block;margin:4px;width:200px;border:1px solid #ccc;vertical-align:top}figure.key{border:3px solid #000}` +
    `figure svg{display:block;width:200px;height:200px}figcaption{text-align:center;padding:2px}</style>` +
    `<div style="font-weight:bold;padding:4px">${spec.id} — ${spec.cycle} s</div>${cells}</body>`
  );
}

async function shoot(html, png) {
  const browser = BROWSERS.find((b) => existsSync(b));
  if (!browser) throw new Error('aucun navigateur trouvé (variable BROWSER)');
  const file = png.replace(/\.png$/, '.html');
  await writeFile(file, html);
  // Profil jetable : plusieurs constructions peuvent tourner en parallèle.
  const profile = join(outDir, `profil-${process.pid}-${Date.now()}`);
  try {
    execFileSync(
      browser,
      ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${profile}`, '--window-size=1460,780', `--screenshot=${png}`, pathToFileURL(file).href],
      { stdio: 'ignore', timeout: 60000 },
    );
  } finally {
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

const specDir = join(here, 'specs');
const files = (await readdir(specDir)).filter((f) => f.endsWith('.js') && !f.startsWith('_') && (!ids.length || ids.includes(f.replace(/\.js$/, ''))));
if (ids.length && files.length !== ids.length) {
  const missing = ids.filter((id) => !files.includes(`${id}.js`));
  console.error(`fiche introuvable : ${missing.join(', ')}`);
  process.exitCode = 1;
}
if (preview) await mkdir(outDir, { recursive: true });

for (const f of files) {
  const id = f.replace(/\.js$/, '');
  try {
    const spec = (await import(pathToFileURL(join(specDir, f)).href + `?t=${Date.now()}`)).default;
    if (spec.id !== id) throw new Error(`l'id de la fiche (${spec.id}) doit être le nom du fichier`);
    const svg = build(spec);
    const problems = check(svg, id);
    await writeFile(join(repo, 'assets/exercises', `${id}.svg`), svg);
    let line = `${problems.length ? '✗' : '✓'} ${id}  ${Buffer.byteLength(svg)} o`;
    if (problems.length) {
      line += `  ${problems.join(' ; ')}`;
      process.exitCode = 1;
    }
    if (preview) {
      const png = join(outDir, `${id}.png`);
      await shoot(sheet(svg, spec), png);
      line += `\n  planche : ${png}`;
    }
    console.log(line);
  } catch (e) {
    console.error(`✗ ${id}  ${e.message}`);
    process.exitCode = 1;
  }
}
