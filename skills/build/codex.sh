#!/usr/bin/env bash
# Codex as a second model: read-only, no sub-agents. consult uses gpt-6-astra at medium effort,
# and review uses gpt-6.1-sol at medium effort.
#
#   codex.sh consult <worktree> <brief.md> <answer.md>
#   codex.sh review  <worktree> <brief.md> <out-dir> [<base ref>]
#
# consult writes Codex's free-text answer to <answer.md>.
# review reviews a slice once, with review.md and <brief.md>, beside Sonnet's pass.sh. It writes
# <out-dir>/codex.json (shaped by findings.schema.json) and prints the findings and the blocker count.
# The diff runs from the merge base with <base ref> (a slice's feature branch), or else with the
# base branch.
#
# Run it as a background command and wait for the completion notification. A review can
# take many minutes, and polling it wastes the caller's context.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
mode="${1:?mode}"; wt="${2:?worktree}"; brief="${3:?brief}"
if [ "$mode" = review ]; then model="${CODEX_REVIEW_MODEL:-gpt-6.1-sol}"; effort="${CODEX_EFFORT:-medium}"
else model="${CODEX_MODEL:-gpt-6-astra}"; effort="${CODEX_EFFORT:-medium}"; fi
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
  out="${4:?out dir}"; ref="${5:-}"
  mkdir -p "$out"
  json="$out/codex.json"; log="$out/codex.log"; pending="$out/codex.pending.json"
  # A slice gets one review, on one commit. It records the commit (codex.sha) and the merge base
  # its diff started from (codex.base). A failed review leaves no codex.json, so it can be retried.
  if [ -e "$json" ]; then
    echo "codex: already reviewed; a slice gets one review" >&2; exit 1
  fi
  if [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
    echo "codex: commit or discard your changes first; the review reads a commit" >&2; exit 1
  fi
  base=$("$here/merge-base.sh" $ref) || exit 1
  sha=$(git rev-parse HEAD)
  rm -f "$pending" "$out/codex.sha" "$out/codex.base"
  # The target comes from the commits this review records, not from the brief, so the receipt and
  # the review can't disagree.
  { cat "$here/review.md" "$brief" || exit 1
    printf '\n**Target, set by codex.sh:** Codex'"'"'s review; ids are `C-<n>`. The change is `git diff %s %s`.\n' "$base" "$sha"
  } > "$out/codex.prompt.md" || exit 1
  timeout --kill-after=30s 60m codex exec "${common[@]}" --output-schema "$here/findings.schema.json" -o "$pending" \
    -s read-only -C "$wt" - < "$out/codex.prompt.md" > "$log" 2>&1
  rc=$?
  if [ "$rc" -ne 0 ] || ! python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$pending" 2>/dev/null; then
    rm -f "$pending"
    echo "codex failed (exit $rc); last lines of $log:"; tail -n 15 "$log"; exit 1
  fi
  if [ "$(git rev-parse HEAD)" != "$sha" ]; then
    rm -f "$pending"
    echo "codex: HEAD moved during the review; rerun it" >&2; exit 1
  fi
  printf '%s\n' "$base" > "$out/codex.base"
  printf '%s\n' "$sha" > "$out/codex.sha"
  mv "$pending" "$json"
  python3 "$here/findings.py" codex "$json"
  ;;
*) echo "usage: codex.sh consult|review ..." >&2; exit 2 ;;
esac
