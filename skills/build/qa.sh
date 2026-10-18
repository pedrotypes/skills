#!/usr/bin/env bash
# The QA round: Claude Opus 5.5 at medium effort tests the running change like a professional QA.
# It knows the plan, checks the change works, then tries to break it, watching the logs and the
# database. It runs before the cuts pass and the Codex review, and repeats until a round passes.
#
#   qa.sh <worktree> <brief.md> <out-dir> <round> [ux]
#
# Writes <out-dir>/round-<n>.json (shaped by findings.schema.json) and prints the blocker count,
# the findings and the summary. With `ux`, it runs the UI/UX pass instead, with review-ux.md, after
# QA round 1 only: it writes round-1.ux.json, which joins round 1 in the blocker ledger. The isolated stack must already be up. Run it as a background
# command and wait for the completion notification.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
wt="${1:?worktree}"; brief="${2:?brief}"; out="${3:?out dir}"; round="${4:?round}"; mode="${5:-qa}"
cd "$wt" || exit 1
mkdir -p "$out"
case "$mode" in
qa) name="round-$round"; prompt="$here/review-qa.md"
  case "$round" in [1-6]) ;; *) echo "QA round $round: QA stops at six rounds; what's still open goes to the user" >&2; exit 1 ;; esac ;;
ux) name="round-$round.ux"; prompt="$here/review-ux.md"
  [ "$round" = 1 ] || { echo "the UI/UX pass runs after QA round 1 only" >&2; exit 1; } ;;
*) echo "qa.sh: the mode is ux or nothing, not $mode" >&2; exit 2 ;;
esac
json="$out/$name.json"
if [ -e "$json" ]; then
  echo "QA round $round: already done; test later code in the next round" >&2; exit 1
fi
if [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
  echo "QA round $round: commit or discard your changes first; a round tests a commit" >&2; exit 1
fi
base=$("$here/merge-base.sh") || exit 1
sha=$(git rev-parse HEAD)
[ "$mode" = qa ] && rm -f "$out/round-$round.sha" "$out/round-$round.base"
{ cat "$prompt" "$brief" || exit 1
  printf '\n**Target, set by qa.sh:** QA round %s of the change `git diff %s %s`. Write your scripts and notes under `.build/qa/`.\n' "$round" "$base" "$sha"
} > "$out/$name.prompt.md" || exit 1
# It needs a shell to drive the stack, so instead of withholding tools, the result is thrown away
# if the round touched anything git tracks or left files outside the ignored .build/.
timeout --kill-after=30s 60m claude -p --model "${QA_MODEL:-claude-opus-5-5}" --effort "${QA_EFFORT:-medium}" \
  --output-format json --strict-mcp-config --json-schema "$(cat "$here/findings.schema.json")" \
  --tools Bash Read Grep Glob Write --allowedTools Bash Read Grep Glob Write --permission-mode dontAsk \
  --setting-sources user \
  < "$out/$name.prompt.md" > "$out/$name.raw.json" 2> "$out/$name.log"
rc=$?
if [ "$(git rev-parse HEAD)" != "$sha" ] || [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
  echo "QA round $round: the QA changed tracked files or left files outside .build/; inspect git status, then rerun" >&2; exit 1
fi
python3 - "$out" "$rc" "$round" "$name" <<'PY' || { echo "QA round $round failed (exit $rc); last lines of $out/$name.log:"; tail -n 15 "$out/$name.log"; exit 1; }
import json, sys
out, rc, n, name = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
raw = json.load(open(f"{out}/{name}.raw.json"))
result = raw.get("structured_output")
if rc != 0 or raw.get("is_error") or not isinstance(result, dict) or result.get("round") != n:
    sys.exit(1)
json.dump(result, open(f"{out}/{name}.json", "w"), indent=2)
for f in result["findings"]:
    print(f"{f['id']} {f['severity']} {f['category']} {f['file']}:{f['line']} - {f['title']}")
PY
if [ "$mode" = qa ]; then
  printf '%s\n' "$base" > "$out/round-$round.base"
  printf '%s\n' "$sha" > "$out/round-$round.sha"
fi
python3 "$here/blockers.py" "$out" "$json"
