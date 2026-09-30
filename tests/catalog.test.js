import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { EXERCISES } from '../js/exercises.js';
import { CATALOG, GENERIC, resolveExercise } from '../js/catalog.js';
import { ID_PATTERN } from '../js/playlist-import.js';
import { check } from '../tools/motion/rig.js';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('identifiants valides et uniques', () => {
  const seen = new Set();
  for (const e of EXERCISES) {
    assert.match(e.id, ID_PATTERN, e.id);
    assert.ok(!seen.has(e.id), `identifiant en double : ${e.id}`);
    seen.add(e.id);
  }
});

test('codes du livre uniques', () => {
  const codes = EXERCISES.filter((e) => e.code).map((e) => e.code);
  assert.equal(new Set(codes).size, codes.length);
});

test('champs texte présents et de longueur raisonnable', () => {
  for (const e of EXERCISES) {
    const len = (s) => [...s].length;
    assert.ok(len(e.name) >= 1 && len(e.name) <= 60, `${e.id} : name`);
    assert.ok(len(e.instruction) >= 1 && len(e.instruction) <= 80, `${e.id} : instruction`);
    assert.ok(len(e.description) >= 1 && len(e.description) <= 500, `${e.id} : description`);
    assert.ok(len(e.muscles) >= 1, `${e.id} : muscles`);
  }
});

test('chaque exercice a une illustration conforme (section 6.2)', () => {
  for (const e of [...CATALOG, GENERIC]) {
    const url = new URL(e.svg, root);
    assert.ok(existsSync(url), `${e.svg} absent`);
    if (e === GENERIC) continue;
    assert.deepEqual(check(readFileSync(url, 'utf8'), e.id), [], e.svg);
  }
});

test('le service worker pré-cache le catalogue et chaque illustration', () => {
  const sw = read('sw.js');
  assert.ok(sw.includes("'js/exercises.js'"));
  for (const e of [...CATALOG, GENERIC]) assert.ok(sw.includes(`'${e.svg}'`), `${e.svg} absent de PRECACHE`);
});

test('chaque fiche d’animation correspond à un exercice du catalogue', () => {
  const ids = new Set(EXERCISES.map((e) => e.id));
  const specs = readdirSync(new URL('tools/motion/specs/', root)).filter((f) => f.endsWith('.js') && !f.startsWith('_'));
  for (const f of specs) assert.ok(ids.has(f.replace(/\.js$/, '')), `fiche sans exercice : ${f}`);
});

test('resolveExercise expose la description et les muscles du catalogue', () => {
  const ex = resolveExercise({ exerciseId: 'pompes', note: 'Lentement' });
  assert.equal(ex.instruction, 'Lentement');
  assert.ok(ex.description.length > 0);
  assert.ok(ex.muscles.length > 0);
  const custom = resolveExercise({ exerciseId: 'burpees', name: 'Burpees' });
  assert.equal(custom.illustration, GENERIC);
  assert.equal(custom.description, '');
});

test('les circuits fournis sont valides et n’utilisent que des exercices du catalogue', async () => {
  const { parsePlaylist } = await import('../js/playlist-import.js');
  const { CATALOG_IDS } = await import('../js/catalog.js');
  const files = readdirSync(new URL('playlists/', root)).filter((f) => f.endsWith('.json'));
  assert.ok(files.length >= 4);
  for (const f of files) {
    const res = parsePlaylist(read(`playlists/${f}`), CATALOG_IDS);
    assert.ok(res.ok, `${f} : ${JSON.stringify(res.errors)}`);
    // exemple.json (id routine-maison) précède cette convention et sert à « Charger le circuit d’exemple ».
    if (f !== 'exemple.json') assert.equal(`${res.playlist.id}.json`, f, `${f} : l’id doit être le nom du fichier`);
    for (const e of res.playlist.exercises) assert.ok(CATALOG_IDS.has(e.exerciseId), `${f} : ${e.exerciseId} absent du catalogue`);
  }
});

test('les circuits pré-chargés sont les circuits par niveau livrés', async () => {
  const { STARTER_FILES, EXAMPLE_FILE } = await import('../js/starter-playlists.js');
  const levels = readdirSync(new URL('playlists/', root)).filter((f) => f.startsWith('niveau-')).map((f) => `playlists/${f}`);
  assert.deepEqual([...STARTER_FILES].sort(), levels.sort());
  assert.ok(existsSync(new URL(EXAMPLE_FILE, root)));
  // Tous doivent être pré-cachés pour fonctionner hors-ligne.
  const sw = read('sw.js');
  for (const f of [...STARTER_FILES, EXAMPLE_FILE]) assert.ok(sw.includes(`'${f}'`), `${f} absent de PRECACHE`);
});
