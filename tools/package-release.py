"""Build a new ZIP from reviewed paths, excluding Git and browser data."""
import argparse
import json
import zipfile
from pathlib import Path
from release_lib import ROOT, INVENTORY, selected, sha, inspect

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True)
args = parser.parse_args()
output = Path(args.output).resolve()
if output.exists():
    raise SystemExit('Output already exists; choose a new file.')
names = selected()
errors = inspect(names)
if errors:
    raise SystemExit('\n'.join(errors))
manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
inventory = {'release': manifest['version_name'], 'chromeVersion': manifest['version'],
             'files': {name: sha(ROOT / name) for name in names},
             'note': 'This inventory excludes itself. No browser records are included.'}
(ROOT / INVENTORY).write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, 'x', compression=zipfile.ZIP_DEFLATED) as archive:
    for name in names + [INVENTORY]:
        item = zipfile.ZipInfo('KanColle-YPS-Nozaki/' + name, date_time=(2026, 1, 1, 0, 0, 0))
        item.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(item, (ROOT / name).read_bytes())
print(f'Created {output.name}: {len(names) + 1} files; SHA256 {sha(output)}')
