import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  slugify, uniqueId, draftFromPlaylist, draftItem, parseTarget, checkItem, buildPlaylist, sameDraft, searchCatalog, MAX_EXERCISES,
} from '../js/playlist-editor.js';
import { validatePlaylist, ID_PATTERN } from '../js/playlist-import.js';
import { CATALOG, CATALOG_IDS } from '../js/catalog.js';

const example = JSON.parse(readFileSync(new URL('../playlists/exemple.json', import.meta.url), 'utf8'));
const fields = (res) => res.errors.map((e) => e.field);

test('identifiant tiré du nom : minuscules, sans accents, tirets', () => {
  assert.equal(slugify('Haut du corps'), 'haut-du-corps');
  assert.equal(slugify('  Épaules & Dos — niveau 2 '), 'epaules-dos-niveau-2');
  assert.equal(slugify('💪💪'), 'circuit');
  assert.equal(slugify(''), 'circuit');
  const long = slugify('a'.repeat(100));
  assert.match(long, ID_PATTERN);
  assert.ok(long.length <= 60);
});

test('identifiant unique : suffixe numérique si déjà pris', () => {
  assert.equal(uniqueId('abdos', []), 'abdos');
  assert.equal(uniqueId('abdos', ['abdos']), 'abdos-2');
  assert.equal(uniqueId('abdos', ['abdos', 'abdos-2', 'abdos-3']), 'abdos-4');
});

test('objectif : vide, entier de 1 à 999, sinon invalide', () => {
  assert.equal(parseTarget(''), null);
  assert.equal(parseTarget('  '), null);
  assert.equal(parseTarget('15'), 15);
  assert.equal(parseTarget(' 999 '), 999);
  for (const bad of ['0', '1000', '-3', '2.5', 'dix', '1e2']) assert.ok(Number.isNaN(parseTarget(bad)), bad);
});

test('réglages d’un exercice : objectif et consigne vérifiés, champs vides omis', () => {
  assert.deepEqual(checkItem({ exerciseId: 'pompes', targetReps: '', note: '  ' }), { ok: true, exercise: { exerciseId: 'pompes' } });
  assert.deepEqual(checkItem({ exerciseId: 'pompes', targetReps: ' 15 ', note: ' Lentement ' }), {
    ok: true,
    exercise: { exerciseId: 'pompes', targetReps: 15, note: 'Lentement' },
  });
  const res = checkItem({ exerciseId: 'pompes', targetReps: '0', note: 'x'.repeat(141) });
  assert.equal(res.ok, false);
  assert.deepEqual(res.errors.map((e) => e.field), ['targetReps', 'note']);
  assert.match(res.errors[0].message, /^L’objectif/);
});

test('aller-retour : un circuit repasse à l’identique par le brouillon', () => {
  const res = buildPlaylist(draftFromPlaylist(example), example.id);
  assert.equal(res.ok, true);
  assert.deepEqual(res.playlist, example);
});

test('le circuit construit respecte le format d’import', () => {
  const draft = draftFromPlaylist();
  draft.name = '  Haut du corps ';
  draft.exercises.push(draftItem({ exerciseId: 'pompes' }), { ...draftItem({ exerciseId: 'dips-chaises' }), targetReps: '12', note: ' Lentement ' });
  const res = buildPlaylist(draft, 'haut-du-corps');
  assert.equal(res.ok, true);
  assert.deepEqual(res.playlist, {
    schemaVersion: 1,
    id: 'haut-du-corps',
    name: 'Haut du corps',
    exercises: [{ exerciseId: 'pompes' }, { exerciseId: 'dips-chaises', targetReps: 12, note: 'Lentement' }],
  });
  assert.equal(validatePlaylist(res.playlist, CATALOG_IDS).ok, true);
});

test('le nom propre à un exercice hors catalogue est conservé', () => {
  const p = { ...example, exercises: [{ exerciseId: 'gainage-maison', name: 'Gainage', targetReps: 30 }] };
  const res = buildPlaylist(draftFromPlaylist(p), p.id);
  assert.deepEqual(res.playlist.exercises, [{ exerciseId: 'gainage-maison', name: 'Gainage', targetReps: 30 }]);
  assert.equal(validatePlaylist(res.playlist, CATALOG_IDS).ok, true);
});

test('toutes les erreurs sont relevées, avec le numéro de l’exercice', () => {
  const draft = draftFromPlaylist(example);
  draft.name = '   ';
  draft.description = 'x'.repeat(201);
  draft.exercises[1].targetReps = '0';
  draft.exercises[3].note = 'x'.repeat(141);
  const res = buildPlaylist(draft, 'x');
  assert.equal(res.ok, false);
  assert.deepEqual(fields(res), ['name', 'description', 'targetReps', 'note']);
  assert.deepEqual(res.errors.filter((e) => e.index !== undefined).map((e) => e.index), [1, 3]);
  assert.equal(res.errors[2].message, 'Exercice n°2 : l’objectif doit être un nombre entier de 1 à 999, ou rester vide.');
});

test('un circuit compte de 1 à 50 exercices', () => {
  const empty = { ...draftFromPlaylist(example), exercises: [] };
  assert.deepEqual(fields(buildPlaylist(empty, 'x')), ['exercises']);
  const full = { ...draftFromPlaylist(example), exercises: Array.from({ length: MAX_EXERCISES }, () => draftItem({ exerciseId: 'pompes' })) };
  assert.equal(buildPlaylist(full, 'x').ok, true);
  full.exercises.push(draftItem({ exerciseId: 'pompes' }));
  assert.deepEqual(fields(buildPlaylist(full, 'x')), ['exercises']);
});

test('une description vide est omise', () => {
  const draft = { ...draftFromPlaylist(example), description: '  ' };
  assert.equal('description' in buildPlaylist(draft, 'x').playlist, false);
});

test('détection des modifications', () => {
  const a = draftFromPlaylist(example);
  const b = structuredClone(a);
  assert.equal(sameDraft(a, b), true);
  b.exercises[0].targetReps = '16';
  assert.equal(sameDraft(a, b), false);
});

test('recherche dans le catalogue : sans accents, par nom, muscle ou code, tous les mots', () => {
  assert.equal(searchCatalog(CATALOG, '').length, CATALOG.length);
  const ids = (q) => searchCatalog(CATALOG, q).map((e) => e.id);
  assert.ok(ids('POMPES').includes('pompes'));
  assert.ok(ids('pectoraux').includes('pompes'));
  assert.ok(ids('epaules').length > 0);
  assert.deepEqual(ids('épaules'), ids('epaules'));
  assert.ok(ids('pompes chaises').every((id) => id.includes('chaises')));
  assert.deepEqual(ids('zzz introuvable'), []);
});
