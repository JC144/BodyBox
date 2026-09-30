// Module partagé (ignoré par build.js) : chaise contre un mur, exercices F1 et F3.
// Dos plaqué au mur (à gauche), on glisse jusqu'aux cuisses parallèles au sol, puis on tient.
export const MUR = 56;
export const X = MUR + 8; // x du tronc, dos contre le mur
export const CHEVILLE = [X + 40, 209]; // tibia vertical en position assise
export const HAUT = 141; // y du bassin, en haut de la glissade
export const ASSIS = 169; // y du bassin, cuisses horizontales
export const decor = { ground: 214, props: [{ line: [MUR, 24, MUR, 214] }] };
// Tronc vertical contre le mur, tête en appui.
export const buste = { pied: 0, tronc: -90, tete: -72 };
