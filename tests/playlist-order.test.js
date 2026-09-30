import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortPlaylists, moveId, cleanName } from '../js/playlist-order.js';

const p = (id, name) => ({ id, name });

test('sans ordre enregistré, les playlists sont triées par nom', () => {
  const list = [p('c', 'Cardio'), p('a', 'Abdos'), p('b', 'Bras')];
  assert.deepEqual(sortPlaylists(list).map((x) => x.id), ['a', 'b', 'c']);
});

test('l’ordre choisi prime ; les playlists inconnues suivent, par nom', () => {
  const list = [p('a', 'Abdos'), p('b', 'Bras'), p('c', 'Cardio'), p('d', 'Dos')];
  assert.deepEqual(sortPlaylists(list, ['c', 'a']).map((x) => x.id), ['c', 'a', 'b', 'd']);
});

test('les identifiants obsolètes de l’ordre sont ignorés', () => {
  const list = [p('a', 'Abdos'), p('b', 'Bras')];
  assert.deepEqual(sortPlaylists(list, ['zz', 'b', 'a']).map((x) => x.id), ['b', 'a']);
});

test('le tri ne modifie pas la liste d’origine', () => {
  const list = [p('b', 'Bras'), p('a', 'Abdos')];
  sortPlaylists(list);
  assert.deepEqual(list.map((x) => x.id), ['b', 'a']);
});

test('déplacement vers le haut et vers le bas', () => {
  assert.deepEqual(moveId(['a', 'b', 'c'], 'c', -1), ['a', 'c', 'b']);
  assert.deepEqual(moveId(['a', 'b', 'c'], 'a', 1), ['b', 'a', 'c']);
});

test('déplacement hors bornes ou identifiant inconnu : liste inchangée', () => {
  assert.deepEqual(moveId(['a', 'b'], 'a', -1), ['a', 'b']);
  assert.deepEqual(moveId(['a', 'b'], 'b', 1), ['a', 'b']);
  assert.deepEqual(moveId(['a', 'b'], 'x', 1), ['a', 'b']);
});

test('nom de playlist : espaces retirés, 1 à 60 caractères', () => {
  assert.equal(cleanName('  Haut du corps '), 'Haut du corps');
  assert.equal(cleanName('   '), null);
  assert.equal(cleanName(''), null);
  assert.equal(cleanName('x'.repeat(60)), 'x'.repeat(60));
  assert.equal(cleanName('x'.repeat(61)), null);
  assert.equal(cleanName('💪'.repeat(60)), '💪'.repeat(60));
});
