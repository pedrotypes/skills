# Prints a review's findings and its blocker count: python3 findings.py <name> <review.json>.
import json, sys
name, d = sys.argv[1], json.load(open(sys.argv[2]))
for f in d["findings"]:
    print(f"{f['id']} {f['severity']} {f['category']} {f['file']}:{f['line']} - {f['title']}")
print(d["summary"])
print(f"{name}: blockers={sum(f['severity'] in ('P1', 'P2') for f in d['findings'])}")
