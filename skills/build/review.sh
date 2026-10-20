#!/usr/bin/env bash
# One review of a slice: Sonnet 5.5 and Codex gpt-6.1-sol, both read-only at medium effort, in
# parallel on the same commit, with review.md and the brief. Without codex, Sonnet reviews alone.
#
#   review.sh <worktree> <brief.md> <out-dir> [<base ref>]
#
# The diff runs from the merge base with <base ref> (a slice's feature branch), or else with the
# base branch. Writes sonnet.json and codex.json (shaped by findings.schema.json), and the commit
# and base it read as review.sha and review.base. Prints every finding and the blocker count.
# Run it as a background command and wait for the completion notification.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
wt="${1:?worktree}"; brief="${2:?brief}"; out="${3:?out dir}"; ref="${4:-}"
cd "$wt" || exit 1
mkdir -p "$out"
if [ -e "$out/review.sha" ]; then
  echo "already reviewed; a slice gets one review" >&2; exit 1
fi
if [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
  echo "commit or discard your changes first; the review reads a commit" >&2; exit 1
fi
base=$("$here/merge-base.sh" $ref) || exit 1
sha=$(git rev-parse HEAD)
rm -f "$out"/sonnet.* "$out"/codex.*
git diff "$base" "$sha" > "$out/review.diff" || exit 1
target() { printf '\n**Target, set by review.sh:** %s; ids are `%s-<n>`. The diff from the merge base %s to %s is in `%s`.\n' "$1" "$2" "$base" "$sha" "$out/review.diff"; }

# Sonnet runs in the real worktree, so it gets only the read tools and no shell. The branch's
# own .claude settings don't load, so its hooks can't run either.
{ cat "$here/review.md" "$brief"; target "Sonnet's review" S
  echo 'You have no shell: read the diff and the files with Read, Grep and Glob.'; } > "$out/sonnet.prompt.md"
timeout --kill-after=30s 30m claude -p --model claude-sonnet-5-5 --effort medium \
  --output-format json --strict-mcp-config --json-schema "$(cat "$here/findings.schema.json")" \
  --tools Read Grep Glob --setting-sources user \
  < "$out/sonnet.prompt.md" > "$out/sonnet.raw.json" 2> "$out/sonnet.log" &
sonnet=$!
if command -v codex >/dev/null; then
  { cat "$here/review.md" "$brief"; target "Codex's review" C; } > "$out/codex.prompt.md"
  timeout --kill-after=30s 60m codex exec -m "${CODEX_REVIEW_MODEL:-gpt-6.1-sol}" -c model_reasoning_effort=medium \
    --disable multi_agent --skip-git-repo-check --output-schema "$here/findings.schema.json" \
    -o "$out/codex.json" -s read-only -C "$wt" - < "$out/codex.prompt.md" > "$out/codex.log" 2>&1 &
  codex=$!
fi
wait "$sonnet"; sonnet_rc=$?
codex_rc=0; [ -n "${codex:-}" ] && { wait "$codex"; codex_rc=$?; }

# A review that changed the worktree didn't read the commit it names, so nothing is published.
if [ "$(git rev-parse HEAD)" != "$sha" ] || [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
  echo "the worktree changed during the review; inspect it with git status, then rerun" >&2; exit 1
fi
python3 - "$out" "$sonnet_rc" "$codex_rc" "${codex:+codex}" <<'PY' || exit 1
import json, sys
out, sonnet_rc, codex_rc, has_codex = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
def fail(who, rc):
    tail = open(f"{out}/{who}.log").read().splitlines()[-15:]
    sys.exit(f"{who} failed (exit {rc}); last lines of {out}/{who}.log:\n" + "\n".join(tail))
raw = json.load(open(f"{out}/sonnet.raw.json"))
if sonnet_rc or raw.get("is_error") or not isinstance(raw.get("structured_output"), dict): fail("sonnet", sonnet_rc)
json.dump(raw["structured_output"], open(f"{out}/sonnet.json", "w"), indent=2)
reviews = {"sonnet": raw["structured_output"]}
if has_codex:
    try: reviews["codex"] = json.load(open(f"{out}/codex.json"))
    except (OSError, ValueError): fail("codex", codex_rc)
    if codex_rc: fail("codex", codex_rc)
blockers = 0
for who, r in reviews.items():
    for f in r["findings"]:
        print(f"{f['id']} {f['severity']} {f['category']} {f['file']}:{f['line']} - {f['title']}")
        blockers += f["severity"] in ("P1", "P2")
    print(f"{who}: {r['summary']}")
print(f"blockers={blockers}")
PY
printf '%s\n' "$base" > "$out/review.base"
printf '%s\n' "$sha" > "$out/review.sha"
