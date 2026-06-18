"""Caricamento della configurazione e risoluzione dei path di progetto."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

# Root del progetto = cartella che contiene config.yaml (genitore di src/).
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "config.yaml"


@dataclass
class Config:
    """Wrapper leggero attorno al dizionario di config.yaml.

    Espone l'accesso a chiavi annidate e risolve i path relativi rispetto
    alla root del progetto.
    """

    data: dict[str, Any]
    root: Path = PROJECT_ROOT

    def get(self, *keys: str, default: Any = None) -> Any:
        node: Any = self.data
        for key in keys:
            if not isinstance(node, dict) or key not in node:
                return default
            node = node[key]
        return node

    def path(self, *keys: str) -> Path:
        """Risolve un path dichiarato nella sezione `paths` (o un letterale)."""
        value = self.get(*keys)
        if value is None:
            raise KeyError(f"Path non trovato in config: {keys}")
        return (self.root / value).resolve()

    @property
    def defect_classes(self) -> list[str]:
        return list(self.get("defect_classes", default=[]))


def load_config(path: str | Path | None = None) -> Config:
    """Carica config.yaml (o un file indicato) e ritorna un oggetto Config."""
    cfg_path = Path(path) if path else CONFIG_PATH
    with open(cfg_path, "r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    return Config(data=data)
