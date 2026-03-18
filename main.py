from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

_backend_file = Path(__file__).resolve().parent / "app backend" / "citiesnode.py"
_spec = spec_from_file_location("citiesnode", _backend_file)
if _spec is None or _spec.loader is None:
    raise RuntimeError(f"Unable to load backend module from {_backend_file}")

_module = module_from_spec(_spec)
_spec.loader.exec_module(_module)

app = _module.app
