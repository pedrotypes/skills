# The blocker ledger, used by codex.sh, qa.sh and pass.sh: python3 blockers.py <dir> <round file>.
# A round is round-<n>.json plus any second reviewer's round-<n>.<who>.json. A P1 or P2 stays open
# from the round that found it until a later round marks it fixed or accepted; one marked partly or
# not fixed reopens it, and one marked so in two rounds is stuck, however many passes say so in a round. Prints the open count, the stuck
# ones and the round summary.
import json, sys, re, os, collections
out, d = sys.argv[1], json.load(open(sys.argv[2]))
files = sorted((int(m.group(1)), f) for f in os.listdir(out) if (m := re.fullmatch(r"round-(\d+)(\.(?!raw\.|pending\.)[a-z]+)?\.json", f)))
open_ids, known, misses = set(), set(), collections.Counter()
for n in range(1, max((n for n, _ in files), default=0) + 1):
    rounds = []
    for name in (f for m, f in files if m == n):
        r = json.load(open(os.path.join(out, name)))
        # A malformed round is an error, never zero blockers.
        if not (isinstance(r, dict) and isinstance(r.get("findings"), list) and isinstance(r.get("previous"), list)
                and all(isinstance(f, dict) and isinstance(f.get("id"), str) and f.get("severity") in ("P1", "P2", "P3", "P4") for f in r["findings"])
                and all(isinstance(p, dict) and isinstance(p.get("id"), str) and p.get("status") in ("fixed", "accepted", "partly", "not fixed") for p in r["previous"])):
            sys.exit(f"{name} in {out} doesn't have valid findings and previous statuses")
        rounds.append(r)
    missed = set()
    for r in rounds:
        for p in r["previous"]:
            if p["status"] in ("fixed", "accepted"): open_ids.discard(p["id"])
            elif p["id"] in known: open_ids.add(p["id"]); missed.add(p["id"])
    misses.update(missed)
    for r in rounds:
        for f in r["findings"]:
            if f["severity"] in ("P1", "P2"): open_ids.add(f["id"]); known.add(f["id"])
open_ids = sorted(open_ids)
stuck = sorted(i for i in open_ids if misses[i] >= 2)
c = collections.Counter(f["severity"] for f in d["findings"])
print(f"round {d['round']}: blockers={len(open_ids)} (this round P1={c.get('P1',0)} P2={c.get('P2',0)} P3={c.get('P3',0)} P4={c.get('P4',0)})"
      + (f"; open: {' '.join(open_ids)}" if open_ids else "") + (f"; stuck: {' '.join(stuck)}" if stuck else ""))
print(d["summary"])
