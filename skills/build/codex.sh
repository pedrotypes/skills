#!/usr/bin/env bash
# Codex as a second model: read-only at medium effort, no sub-agents. consult uses
# gpt-6-astra and review uses gpt-6.1-sol.
#
#   codex.sh consult <worktree> <brief.md> <answer.md>
#   codex.sh review  <worktree> <brief.md> <out-dir> <round>
#
# consult writes Codex's free-text answer to <answer.md>.
# review runs a fresh session per round with review-rules.md, review-bugs.md and <brief.md>,
# writes <out-dir>/round-<n>.json (shaped by findings.schema.json) and prints only the counts
# and summary. The cuts pass runs before it, in cuts.sh.
#
# Run it as a background command and wait for the completion notification. A round can
# take many minutes, and polling it wastes the caller's context.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
effort="${CODEX_EFFORT:-medium}"
mode="${1:?mode}"; wt="${2:?worktree}"; brief="${3:?brief}"
if [ "$mode" = review ]; then model="${CODEX_REVIEW_MODEL:-gpt-6.1-sol}"; else model="${CODEX_MODEL:-gpt-6-astra}"; fi
common=(-m "$model" -c model_reasoning_effort="$effort" --disable multi_agent --skip-git-repo-check)

cd "$wt" || exit 1

case "$mode" in
consult)
  answer="${4:?answer file}"; log="$answer.log"
  timeout --kill-after=30s 30m codex exec "${common[@]}" -s read-only -C "$wt" \
    -o "$answer" - < "$brief" > "$log" 2>&1
  rc=$?
  if [ "$rc" -ne 0 ] || [ ! -s "$answer" ]; then
    echo "consult failed (exit $rc); last lines of $log:"; tail -n 15 "$log"; exit 1
  fi
  echo "consult done: $answer"
  ;;
review)
  out="${4:?out dir}"; round="${5:?round}"
  mkdir -p "$out"
  json="$out/round-$round.json"; log="$out/round-$round.log"; pending="$out/round-$round.pending.json"
  # Each round records the commit it reviewed (round-<n>.sha) and the merge base its diff started
  # from (round-<n>.base). Uncommitted changes would make the review cover something no commit
  # holds. The review is two rounds; changes after round 2 go to the user.
  case "$round" in 1|2) ;; *) echo "round $round: the review has two rounds; later changes go to the user" >&2; exit 1 ;; esac
  # Rerunning a finished round would replace its findings with a review of later code. A failed
  # round leaves no round-<n>.json, so it can still be retried.
  if [ -e "$json" ]; then
    echo "round $round: already done; later changes go to the user" >&2; exit 1
  fi
  if [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
    echo "round $round: commit or discard your changes first; a round reviews a commit" >&2; exit 1
  fi
  base=$("$here/merge-base.sh") || exit 1
  sha=$(git rev-parse HEAD)
  # A retried round must never leave an earlier result labelled with this commit: drop the
  # round first, and publish its result and commits together only once it succeeds.
  rm -f "$json" "$pending" "$out/round-$round.sha" "$out/round-$round.base"
  # Every round is a fresh session over the whole diff. The prompts live in this skill; the
  # brief only adds the plan, choices and earlier blockers. The target comes from the commits
  # this round records, not from the brief, so the receipt and the review can't disagree.
  { cat "$here/review-rules.md" "$here/review-bugs.md" "$brief" || exit 1
    printf '\n**Target, set by codex.sh:** `git diff %s %s`.\n' "$base" "$sha"
  } > "$out/round-$round.prompt.md" || exit 1
  timeout --kill-after=30s 60m codex exec "${common[@]}" --output-schema "$here/findings.schema.json" -o "$pending" \
    -s read-only -C "$wt" - < "$out/round-$round.prompt.md" > "$log" 2>&1
  rc=$?
  if [ "$rc" -ne 0 ] || ! python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$pending" 2>/dev/null; then
    rm -f "$pending"
    echo "round $round failed (exit $rc); last lines of $log:"; tail -n 15 "$log"; exit 1
  fi
  if [ "$(git rev-parse HEAD)" != "$sha" ]; then
    rm -f "$pending"
    echo "round $round: HEAD moved during the review; rerun the round" >&2; exit 1
  fi
  # The result names its own round, and a mismatch would make the evidence contradict itself.
  if ! python3 -c 'import json,sys; sys.exit(json.load(open(sys.argv[1])).get("round") != int(sys.argv[2]))' "$pending" "$round"; then
    rm -f "$pending"
    echo "round $round: the reviewer reported a different round; rerun the round" >&2; exit 1
  fi
  printf '%s\n' "$base" > "$out/round-$round.base"
  printf '%s\n' "$sha" > "$out/round-$round.sha"
  mv "$pending" "$json"
  python3 "$here/blockers.py" "$out" "$json"
  ;;
*) echo "usage: codex.sh consult|review ..." >&2; exit 2 ;;
esac
