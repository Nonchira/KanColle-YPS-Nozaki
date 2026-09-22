"""Read-only comparison; never merges or writes into either source tree."""
import hashlib
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
upstream = Path(sys.argv[1]).resolve() if len(sys.argv) == 2 else None
if upstream is None or not (upstream / 'manifest.json').is_file():
    raise SystemExit('Usage: python Update/inspect-upstream.py <upstream-folder>')
baseline = json.loads((root / 'Update/baseline.json').read_text(encoding='utf-8'))
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None

report = []
for name, base_hash in baseline['files'].items():
    if digest(root / 'Update/baseline' / name) != base_hash:
        raise SystemExit('Baseline hash mismatch: ' + name)
    current, incoming = digest(root / name), digest(upstream / name)
    status = ('same-as-current' if current == incoming else
              'upstream-unchanged' if incoming == base_hash else
              'upstream-only-change' if current == base_hash else 'review-both-changed')
    report.append({'path': name, 'status': status})
files = json.loads((root / 'Update/release-files.json').read_text(encoding='utf-8'))['files']
for name in files:
    if name.startswith(('Update/', 'docs/', 'tools/', 'test/', 'compass/tests/')) or Path(name).suffix not in {'.js', '.html', '.css', '.json', '.png'} or name == 'provenance.json':
        continue
    if name in baseline['files'] or not (upstream / name).is_file():
        continue
    if digest(root / name) != digest(upstream / name):
        report.append({'path': name, 'status': 'review-added-name-collision'})
print(json.dumps({'mode': 'read-only', 'files': report,
                  'note': 'New upstream-only files and semantic changes require manual review.'}, ensure_ascii=False, indent=2))
