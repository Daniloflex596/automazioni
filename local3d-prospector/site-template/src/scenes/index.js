// Registro scene per template. Oggi la scena "bar" (pub) è quella portata al vero standard;
// street food / etnico / barbiere la riusano ri-tematizzata finché non si autora una scena dedicata
// (coerente col piano: prima UN template eccellente, poi il secondo dopo le prime vendite).
import BarScene from './BarScene.jsx';

const REGISTRY = {
  pub: BarScene,
  streetfood: BarScene,
  ethnic: BarScene,
  barber: BarScene,
};

export function sceneFor(template) {
  return REGISTRY[template] || BarScene;
}
