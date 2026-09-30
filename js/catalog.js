// Registre des exercices livrés avec l'application (spécification, section 6.4).
//
// Les données des exercices sont dans exercises.js. Pour ajouter un exercice :
//   1. créer sa fiche tools/motion/specs/{id}.js et générer assets/exercises/{id}.svg ;
//   2. ajouter son entrée dans exercises.js ;
//   3. ajouter le SVG à la liste de pré-cache de sw.js et incrémenter la version du cache.
//
// La durée du cycle d'animation et l'instant de la position clé (sur laquelle l'illustration est
// figée : vignettes, mouvement réduit) sont portés par le SVG lui-même (data-cycle, data-key-time).

import { EXERCISES } from './exercises.js';

export const svgPath = (id) => `assets/exercises/${id}.svg`;

export const CATALOG = EXERCISES.map((e) => ({ ...e, svg: svgPath(e.id) }));

export const GENERIC = {
  id: 'generique',
  name: 'Exercice',
  instruction: '',
  description: '',
  muscles: '',
  svg: 'assets/exercises/generique.svg',
};

const byId = new Map(CATALOG.map((e) => [e.id, e]));

export const CATALOG_IDS = new Set(byId.keys());

export function getCatalogEntry(id) {
  return byId.get(id) || null;
}

/**
 * Exercice tel qu'affiché : nom (celui du circuit s'il est fourni), consigne (la note du circuit
 * si elle est fournie), description et muscles du catalogue, objectif et illustration.
 */
export function resolveExercise(item) {
  const entry = byId.get(item.exerciseId);
  const base = entry || GENERIC;
  return {
    exerciseId: item.exerciseId,
    name: item.name || (entry ? entry.name : item.exerciseId),
    instruction: item.note || base.instruction,
    description: base.description,
    muscles: base.muscles,
    targetReps: item.targetReps ?? null,
    illustration: base,
  };
}
