// Caricamento configurazione. Un solo punto di verità per targeting/prezzi/limiti.
import { join } from 'node:path';
import { paths, readJSON } from './util.mjs';

let _cfg = null;
export function config() {
  if (!_cfg) _cfg = readJSON(join(paths.config, 'targeting.json'));
  return _cfg;
}

export function schema() {
  return readJSON(join(paths.config, 'business.schema.json'));
}
