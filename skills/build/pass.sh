#!/usr/bin/env bash
# The Claude passes, each a read-only Sonnet 5.5 agent over the whole change:
#   cuts        the simplifier: assumes the change is bloated and reports cuts and cleanups, at
#               medium effort. It runs beside the code review and QA, and the agent applies its cuts.
#   review <n>  the second reviewer beside Codex round <n>, on the same prompt: xhigh effort in
#               round 1, which reads the whole change, and high after.
#               It writes round-<n>.sonnet.json, which joins that round in the blocker ledger.
#
#   pass.sh cuts <worktree> <brief.md> <out-dir>
#   pass.sh review <worktree> <brief.md> <out-dir> <round>
#
# Prints the findings, and for a review round the ledger's blocker count. Run it as a background
# command and wait for the completion notification.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
kind="${1:?pass}"; wt="${2:?worktree}"; brief="${3:?brief}"; out="${4:?out dir}"
case "$kind" in
cuts) effort=medium; prompt="$here/review-cuts.md"; name=cuts; pass="the cuts pass; ids are \`C-<n>\`" ;;
review)
  round="${5:?round}"
  case "$round" in [1-3]) ;; *) echo "review round $round: the review stops at three rounds; fix what's still open without another round" >&2; exit 1 ;; esac
  if [ "$round" = 1 ]; then effort=xhigh; else effort=high; fi
  prompt="$here/review-code.md"; name="round-$round.sonnet"; pass="Sonnet's review, round $round; ids are \`S$round-<n>\`" ;;
*) echo "pass.sh: the pass is cuts or review, not $kind" >&2; exit 2 ;;
esac
cd "$wt" || exit 1
mkdir -p "$out"
json="$out/$name.json"
if [ "$kind" = review ] && [ -e "$json" ]; then
  echo "review round $round: already done; review later code in the next round" >&2; exit 1
fi
if [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
  echo "$kind: commit or discard your changes first; the pass reads a commit" >&2; exit 1
fi
base=$("$here/merge-base.sh") || exit 1
rm -f "$json"
# It runs in the real worktree, so it gets no shell at all, only the read tools, and reads the
# diff from a file. The branch's own .claude settings don't load, so its hooks can't run either.
sha=$(git rev-parse HEAD)
git diff "$base" HEAD > "$out/$name.diff" || exit 1
{ cat "$here/review-rules.md" "$prompt" "$brief" || exit 1
  printf '\n**Target, set by pass.sh:** %s. The diff is in `%s`, from the merge base %s to %s. You have no shell: read the diff and the files with Read, Grep and Glob.\n' "$pass" "$out/$name.diff" "$base" "$sha"
} > "$out/$name.prompt.md" || exit 1
timeout --kill-after=30s 30m claude -p --model claude-sonnet-5-5 --effort "$effort" \
  --output-format json --strict-mcp-config --json-schema "$(cat "$here/findings.schema.json")" \
  --tools Read Grep Glob --setting-sources user \
  < "$out/$name.prompt.md" > "$out/$name.raw.json" 2> "$out/$name.log"
rc=$?
# Whatever slipped past those limits, a pass that changed the worktree didn't read the commit it
# names, so its findings aren't published.
if [ "$(git rev-parse HEAD)" != "$sha" ] || [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
  echo "$kind: the worktree changed during the pass; inspect it with git status, then rerun" >&2; exit 1
fi
python3 - "$out" "$rc" "$name" <<'PY' || { echo "$kind failed (exit $rc); last lines of $out/$name.log:"; tail -n 15 "$out/$name.log"; exit 1; }
import json, sys
out, rc, name = sys.argv[1], int(sys.argv[2]), sys.argv[3]
raw = json.load(open(f"{out}/{name}.raw.json"))
result = raw.get("structured_output")
if rc != 0 or raw.get("is_error") or not isinstance(result, dict):
    sys.exit(1)
json.dump(result, open(f"{out}/{name}.json", "w"), indent=2)
print(f"{name}: {len(result['findings'])} (${raw.get('total_cost_usd', 0):.2f})")
for f in result["findings"]:
    print(f"{f['id']} {f['severity']} {f['category']} {f['file']}:{f['line']} - {f['title']}")
print(result["summary"])
PY
if [ "$kind" = review ]; then
  printf '%s\n' "$sha" > "$out/$name.sha"
  python3 "$here/blockers.py" "$out" "$json"
fi
