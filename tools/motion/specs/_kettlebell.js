// Module partagé (ignoré par build.js) : kettlebell tenue en main.
// La kettlebell est un segment invisible `kb`, enfant de l'avant-bras, qui part de la main ; son
// angle absolu, donné pose par pose, oriente la cloche (90 : pendue sous la main, -90 : au-dessus).
// L'anse et la cloche lui sont attachées.

export const avecKettlebell = (skeleton, main = 'avant-bras') => [...skeleton, { name: 'kb', parent: main, length: 19, kind: 'none' }];

export const KETTLEBELL = { kb: [{ circle: [6, 0, 6], w: 4 }, { circle: [19, 0, 11], fill: true }] };

// Personnage réduit à 85 % : bras tendus au-dessus de la tête, il doit tenir dans le cadre.
export const REDUIT = { cuisse: 34, tibia: 34, pied: 12, tronc: 51, tete: 21, bras: 27, avantBras: 27 };

// Prise goblet : kettlebell tenue par les cornes contre la poitrine, coudes sous la cloche.
// Les bras suivent l'inclinaison du buste ; la cloche reste pendue sous les mains.
export const goblet = (tronc) => ({ bras: tronc + 160, 'avant-bras': tronc + 20, kb: 90 });
