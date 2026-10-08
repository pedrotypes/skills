#!/usr/bin/env bash
# The cuts pass: Claude Sonnet 5.5 at medium effort assumes the change is bloated and looks only
# for cuts and cleanups. It runs before the Codex review rounds, and it isn't review evidence:
# the agent applies the cuts and commits them, and the rounds review the result.
#
#   cuts.sh <worktree> <brief.md> <out-dir>
#
# Writes <out-dir>/cuts.json (shaped by findings.schema.json) and prints the cuts. Run it as a
# background command and wait for the completion notification.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
wt="${1:?worktree}"; brief="${2:?brief}"; out="${3:?out dir}"
cd "$wt" || exit 1
mkdir -p "$out"
if [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
  echo "cuts: commit or discard your changes first; the pass reads a commit" >&2; exit 1
fi
base=$("$here/merge-base.sh") || exit 1
rm -f "$out/cuts.json"
# It runs in the real worktree, so it gets no shell at all, only the read tools, and reads the
# diff from a file. The branch's own .claude settings don't load, so its hooks can't run either.
sha=$(git rev-parse HEAD)
git diff "$base" HEAD > "$out/cuts.diff" || exit 1
{ cat "$here/review-rules.md" "$here/review-cuts.md" "$brief" || exit 1
  printf '\n**Target, set by cuts.sh:** the diff in `%s`, from the merge base %s to %s. You have no shell: read the diff and the files with Read, Grep and Glob.\n' "$out/cuts.diff" "$base" "$sha"
} > "$out/cuts.prompt.md" || exit 1
timeout --kill-after=30s 30m claude -p --model claude-sonnet-5-5 --effort medium \
  --output-format json --strict-mcp-config --json-schema "$(cat "$here/findings.schema.json")" \
  --tools Read Grep Glob --setting-sources user \
  < "$out/cuts.prompt.md" > "$out/cuts.raw.json" 2> "$out/cuts.log"
rc=$?
# Whatever slipped past those limits, a pass that changed the worktree didn't read the commit it
# names, so its cuts aren't published.
if [ "$(git rev-parse HEAD)" != "$sha" ] || [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
  echo "cuts: the worktree changed during the pass; inspect it with git status, then rerun" >&2; exit 1
fi
python3 - "$out" "$rc" <<'PY' || { echo "cuts failed (exit $rc); last lines of $out/cuts.log:"; tail -n 15 "$out/cuts.log"; exit 1; }
import json, sys
out, rc = sys.argv[1], int(sys.argv[2])
raw = json.load(open(f"{out}/cuts.raw.json"))
result = raw.get("structured_output")
if rc != 0 or raw.get("is_error") or not isinstance(result, dict):
    sys.exit(1)
json.dump(result, open(f"{out}/cuts.json", "w"), indent=2)
print(f"cuts: {len(result['findings'])} (${raw.get('total_cost_usd', 0):.2f})")
for f in result["findings"]:
    print(f"{f['id']} {f['severity']} {f['category']} {f['file']}:{f['line']} - {f['title']}")
print(result["summary"])
PY
