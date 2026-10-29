"""Write the rules listed in rules.lock from a semgrep-rules checkout to one config file.

Usage: select-rules.py <semgrep-rules checkout> <rules.lock> <output.yaml>

Registry rule IDs are the rule file path with dots plus the rule's own id. The
registry lowercases some path segments, so paths are matched case-insensitively.
"""

import sys
from pathlib import Path

from ruamel.yaml import YAML

checkout, lock, output = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])

wanted = {}
for line in lock.read_text().splitlines():
    fields = line.split()
    if len(fields) == 2 and fields[0] == "rule":
        wanted[fields[1].lower()] = fields[1]

files = {}
for path in checkout.rglob("*.y*ml"):
    if path.suffix in (".yaml", ".yml"):
        files[str(path.relative_to(checkout).with_suffix("")).lower()] = path

yaml = YAML(typ="safe")
rules, found = [], set()
for stem in sorted({rule_id.rsplit(".", 1)[0].replace(".", "/") for rule_id in wanted}):
    path = files.get(stem)
    if path is None:
        continue
    for rule in yaml.load(path.read_text()).get("rules", []):
        rule_id = f"{stem.replace('/', '.')}.{rule['id']}".lower()
        if rule_id in wanted and rule_id not in found:
            rule["id"] = wanted[rule_id]
            rules.append(rule)
            found.add(rule_id)

missing = sorted(wanted[rule_id] for rule_id in wanted.keys() - found)
if missing:
    sys.exit("Rules not found at the pinned commit:\n  " + "\n  ".join(missing))

with output.open("w") as handle:
    YAML().dump({"rules": rules}, handle)
print(f"Selected {len(rules)} rules")
