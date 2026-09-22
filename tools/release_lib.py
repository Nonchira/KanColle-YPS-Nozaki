"""Portable, allowlisted distribution helpers. Standard library only."""
import hashlib
import json
import re
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parent.parent
INVENTORY = 'Update/release-files.json'

def selected():
    names = json.loads((ROOT / 'tools/release-list.json').read_text(encoding='utf-8'))
    if len(names) != len(set(names)):
        raise ValueError('Duplicate distribution path')
    for name in names:
        parts = PurePosixPath(name).parts
        if not parts or '..' in parts or ':' in name or '\\' in name or name.startswith('/'):
            raise ValueError('Unsafe distribution path: ' + name)
        p = ROOT
        for part in parts:
            p = p / part
            if p.is_symlink():
                raise ValueError('Symlink is not permitted: ' + name)
        if not p.is_file():
            raise ValueError('Missing distribution file: ' + name)
    return names

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def inspect(names):
    chosen = set(names) | {INVENTORY}
    errors = []
    def reference(base, value):
        if re.match(r'^(?:[a-z]+:|//|#)', value, re.I):
            return
        value = value.split('#')[0].split('?')[0]
        if not value:
            return
        path = (ROOT / base).parent / value
        try:
            rel = path.resolve().relative_to(ROOT).as_posix()
        except ValueError:
            errors.append('Reference outside distribution: ' + base)
            return
        if rel not in chosen:
            errors.append('Missing reference: ' + base + ' -> ' + rel)
    for name in names:
        p = ROOT / name
        if p.suffix.lower() not in {'.js', '.cjs', '.json', '.html', '.css', '.md', '.py', '.patch', '.txt'}:
            continue
        text = p.read_text(encoding='utf-8-sig')
        # Literal machine drive paths; protocol URLs are excluded by the prefix boundary.
        if re.search(r'(?<![A-Za-z])[A-Za-z]:[\\/]', text) or re.search(r'/(?:Users|home)/[^\s/]+/', text):
            errors.append('Machine path: ' + name)
        if re.search(r'-----BEGIN [A-Z ]*PRIVATE KEY-----', text):
            errors.append('Private key marker: ' + name)
        if re.search(r'gh[pousr]_[A-Za-z0-9]{20,}|sk-proj-[A-Za-z0-9_-]{20,}', text):
            errors.append('Credential marker: ' + name)
        if '/baseline/' in name or name.endswith('.patch'):
            continue
        if p.suffix == '.html':
            for value in re.findall(r'(?:src|href)=["\']([^"\']+)["\']', text):
                reference(name, value)
        if p.suffix == '.js':
            for value in re.findall(r'(?:from\s*|import\s*\()["\'](\.[^"\']+)["\']', text):
                reference(name, value)
        if p.suffix == '.md':
            for value in re.findall(r'\]\(([^\s)]+)\)', text):
                reference(name, value)
    manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
    refs = [manifest['devtools_page'], manifest['background']['service_worker'], *manifest['icons'].values()]
    for block in manifest['content_scripts']:
        refs.extend(block.get('js', []) + block.get('css', []))
    for ref in refs:
        if ref not in chosen:
            errors.append('Missing manifest reference: ' + ref)
    return errors
