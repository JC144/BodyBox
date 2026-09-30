import { extensionsTriceps } from './_extensions-triceps.js';

// K3 : comme K1, mais mains en supination sur une barre fixée entre les dossiers de deux chaises
// (vue de profil : barre en coupe, chaises estompées car le personnage passe entre elles).
const spec = extensionsTriceps({
  id: 'extensions-triceps-barre-chaises',
  title: 'Extensions triceps barre entre chaises',
  pieds: [20, 209],
  mains: [166, 144],
  haut: [-47.5, -30],
  bas: [-20, 35],
  props: [
    { line: [174, 214, 176, 120], opacity: 0.45 },
    { line: [174, 169, 220, 169], opacity: 0.45 },
    { line: [218, 169, 218, 214], opacity: 0.45 },
  ],
});
spec.front = [{ circle: [166, 144, 8], w: 3 }];
export default spec;
