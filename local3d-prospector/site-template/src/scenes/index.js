// Registro scene per template. Oggi la scena "bar" (pub) è quella portata al vero standard;
// street food / etnico / barbiere la riusano ri-tematizzata finché non si autora una scena dedicata
// (coerente col piano: prima UN template eccellente, poi il secondo dopo le prime vendite).
import BarScene from './BarScene.jsx';
import StreetFoodScene from './StreetFoodScene.jsx';

const REGISTRY = {
  pub: BarScene,
  streetfood: StreetFoodScene,
  ethnic: BarScene,   // riusa il pub ri-tematizzato finché non ha una scena dedicata
  barber: BarScene,
};

export function sceneFor(template) {
  return REGISTRY[template] || BarScene;
}
