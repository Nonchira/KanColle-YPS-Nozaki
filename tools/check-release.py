"""Verify reviewed distribution files, references and inventory hashes."""
import json
from release_lib import ROOT, INVENTORY, selected, inspect, sha

names = selected()
errors = inspect(names)
data = json.loads((ROOT / INVENTORY).read_text(encoding='utf-8'))
if set(data['files']) != set(names):
    errors.append('Inventory and distribution list differ')
for name in names:
    if data['files'].get(name) != sha(ROOT / name):
        errors.append('Hash mismatch: ' + name)
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {len(names)} files, references, privacy patterns and hashes')
