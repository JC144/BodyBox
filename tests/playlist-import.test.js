import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsePlaylist, validatePlaylist, serializePlaylist } from '../js/playlist-import.js';
import { CATALOG_IDS } from '../js/catalog.js';

const example = readFileSync(new URL('../playlists/exemple.json', import.meta.url), 'utf8');
const base = () => JSON.parse(example);
const messages = (res) => res.errors.map((e) => e.message);

test("l'exemple livré est valide et contient 5 exercices", () => {
  const res = parsePlaylist(example, CATALOG_IDS);
  assert.equal(res.ok, true);
  assert.equal(res.playlist.id, 'routine-maison');
  assert.equal(res.playlist.exercises.length, 5);
});

test('contenu non analysable', () => {
  const res = parsePlaylist('pas du json', CATALOG_IDS);
  assert.deepEqual(messages(res), ["Ce fichier n'est pas un JSON valide."]);
});

test('contenu trop volumineux', () => {
  const big = JSON.stringify({ ...base(), description: 'x'.repeat(101 * 1024) });
  const res = parsePlaylist(big, CATALOG_IDS);
  assert.deepEqual(messages(res), ['Ce fichier dépasse la taille maximale de 100 Ko.']);
});

test("la racine n'est pas un objet", () => {
  for (const text of ['[]', '[{"schemaVersion":1}]', '42', 'null', '"texte"']) {
    const res = parsePlaylist(text, CATALOG_IDS);
    assert.deepEqual(messages(res), ['Le fichier doit contenir un seul circuit.'], text);
  }
});

test('schemaVersion absent ou différent de 1', () => {
  const a = base();
  delete a.schemaVersion;
  assert.deepEqual(messages(validatePlaylist(a, CATALOG_IDS)), ['Version de format non prise en charge.']);
  assert.deepEqual(messages(validatePlaylist({ ...base(), schemaVersion: 2 }, CATALOG_IDS)), ['Version de format non prise en charge.']);
});

test('champ obligatoire absent', () => {
  const p = base();
  delete p.id;
  delete p.exercises;
  assert.deepEqual(messages(validatePlaylist(p, CATALOG_IDS)), [
    'Le champ "id" est obligatoire.',
    'Le champ "exercises" est obligatoire.',
  ]);
  const q = base();
  delete q.exercises[1].exerciseId;
  assert.deepEqual(messages(validatePlaylist(q, CATALOG_IDS)), ['Le champ "exercises[1].exerciseId" est obligatoire.']);
});

test('type ou format incorrect', () => {
  const p = { ...base(), id: 'Routine Maison', name: 42, description: 'x'.repeat(201) };
  const res = validatePlaylist(p, CATALOG_IDS);
  assert.equal(res.ok, false);
  assert.deepEqual(res.errors.map((e) => e.field), ['id', 'name', 'description']);
  assert.match(res.errors[0].message, /^Le champ "id" est invalide : /);
  assert.match(res.errors[1].message, /^Le champ "name" est invalide : texte de 1 à 60 caractères\.$/);
  const q = base();
  q.exercises[3].note = 'n'.repeat(141);
  q.exercises[0].targetReps = 1.5;
  assert.deepEqual(validatePlaylist(q, CATALOG_IDS).errors.map((e) => e.field), ['exercises[0].targetReps', 'exercises[3].note']);
});

test('exercises vide ou trop long', () => {
  const msg = ['Un circuit doit contenir entre 1 et 50 exercices.'];
  assert.deepEqual(messages(validatePlaylist({ ...base(), exercises: [] }, CATALOG_IDS)), msg);
  const many = Array.from({ length: 51 }, () => ({ exerciseId: 'pompes' }));
  assert.deepEqual(messages(validatePlaylist({ ...base(), exercises: many }, CATALOG_IDS)), msg);
  assert.equal(validatePlaylist({ ...base(), exercises: many.slice(0, 50) }, CATALOG_IDS).ok, true);
});

test('exercice inconnu sans name (A5)', () => {
  const p = base();
  p.exercises.splice(2, 0, { exerciseId: 'burpees' });
  assert.deepEqual(messages(validatePlaylist(p, CATALOG_IDS)), [
    'L\'exercice n°3 ("burpees") est inconnu : ajoutez un champ "name".',
  ]);
});

test('exercice inconnu avec name accepté (A6)', () => {
  const p = base();
  p.exercises.push({ exerciseId: 'burpees', name: 'Burpees' });
  const res = validatePlaylist(p, CATALOG_IDS);
  assert.equal(res.ok, true);
  assert.equal(res.playlist.exercises[5].name, 'Burpees');
});

test('toutes les erreurs sont relevées en une passe (A4)', () => {
  const p = base();
  delete p.name;
  p.exercises[0].targetReps = 0;
  assert.deepEqual(messages(validatePlaylist(p, CATALOG_IDS)), [
    'Le champ "name" est obligatoire.',
    'Le champ "exercises[0].targetReps" est invalide : nombre entier de 1 à 999.',
  ]);
});

test('les champs inconnus sont ignorés et retirés', () => {
  const p = { ...base(), auteur: 'moi' };
  p.exercises[0].couleur = 'rouge';
  const res = validatePlaylist(p, CATALOG_IDS);
  assert.equal(res.ok, true);
  assert.equal('auteur' in res.playlist, false);
  assert.equal('couleur' in res.playlist.exercises[0], false);
});

test('le texte HTML est conservé tel quel (A8)', () => {
  const res = validatePlaylist({ ...base(), name: '<b>test</b>' }, CATALOG_IDS);
  assert.equal(res.ok, true);
  assert.equal(res.playlist.name, '<b>test</b>');
});

test('le JSON partagé d’un circuit enregistré se réimporte à l’identique, sans les champs de stockage', () => {
  const { playlist } = parsePlaylist(example, CATALOG_IDS);
  const text = serializePlaylist({ ...playlist, importedAt: 1, deletedAt: null });
  assert.equal(text.includes('importedAt'), false);
  assert.equal(text.includes('deletedAt'), false);
  assert.deepEqual(parsePlaylist(text, CATALOG_IDS).playlist, playlist);
});
