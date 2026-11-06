#!/usr/bin/env python3
"""Run every safety registration once in four independent Node test processes."""
from pathlib import Path
from collections import Counter
import hashlib
import json
import subprocess
import time
import os

root = Path(__file__).resolve().parent
source = (root / 'safety.test.mjs').read_text()
original = (root.parent / 'CLEANUP-r12-tests/safety.test.mjs').read_text()
import_line = "import { test } from 'node:test';"

def names(text):
    catalog = root / 'catalog.mjs'
    catalog.write_text(text.replace(import_line, "const catalog = []; const test = name => catalog.push(name); process.once('beforeExit', () => process.stdout.write(JSON.stringify(catalog)));", 1))
    try:
        return json.loads(subprocess.check_output(['node', str(catalog)], text=True))
    finally:
        catalog.unlink()

expected, previous = names(source), names(original)
assert len(previous) == 4036
assert all(Counter(expected)[name] == count for name, count in Counter(previous).items())
assert len(expected) == len(set(expected))
(root / 'test-manifest.json').write_text(json.dumps(expected, indent=2) + '\n')
parts = []
for i in range(4):
    adapter = f"import {{ test as nodeTest }} from 'node:test';\nlet registration = 0;\nconst test = (name, ...args) => {{ if (registration++ % 4 === {i}) return nodeTest(name, ...args); }};"
    part = root / f'part-{i}.test.mjs'
    part.write_text(source.replace(import_line, adapter, 1))
    parts.append(str(part))

env = dict(os.environ, GIT_CONFIG_GLOBAL='/dev/null', GIT_CONFIG_NOSYSTEM='1', FACTORY_CONFIG='')
full_count = len(expected)
pattern = os.environ.get('CLEANUP_TEST_PATTERN')
if pattern:
    import re
    expected = [name for name in expected if re.search(pattern, name)]
frozen = {name:hashlib.sha256((root/name).read_bytes()).hexdigest() for name in ['cleanup.original.mjs','cleanup.mjs','safety.test.mjs']}
started = time.monotonic()
with (root / 'results.tap').open('w') as log:
    result = subprocess.run(['node', '--test', '--test-concurrency=4', *([f'--test-name-pattern={pattern}'] if pattern else []), *parts], env=env, stdout=log, stderr=subprocess.STDOUT)
lines = (root / 'results.tap').read_text().splitlines()
actual = [line.split(' - ', 1)[1] for line in lines if line.startswith(('ok ', 'not ok '))]
assert Counter(actual) == Counter(expected), 'every unchanged test registration must run exactly once'
failed = sum(line.startswith('not ok ') for line in lines)
summary = dict(exit_code=result.returncode, tests=len(actual), passed=len(actual)-failed, failed=failed, previous=len(previous), added=full_count-len(previous), pattern=pattern, seconds=round(time.monotonic()-started, 3), hashes={name:hashlib.sha256((root/name).read_bytes()).hexdigest() for name in ['cleanup.original.mjs','cleanup.mjs','safety.test.mjs']})
(root / 'results-summary.json').write_text(json.dumps(summary, indent=2)+'\n')
assert summary['hashes'] == frozen, 'candidate and tests must remain frozen during execution'
print(json.dumps(summary, indent=2), flush=True)
raise SystemExit(result.returncode)
