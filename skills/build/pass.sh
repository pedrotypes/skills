#!/usr/bin/env bash
# Sonnet's review of a slice: a read-only Sonnet 5.5 agent at medium effort over the whole diff,
# on the same prompt as Codex. One review per slice.
#
#   pass.sh <worktree> <brief.md> <out-dir> [<base ref>]
#
# The diff runs from the merge base with <base ref> (a slice's feature branch), or else with the
# base branch.
#
# Writes <out-dir>/sonnet.json and sonnet.sha, and prints the findings and the blocker count.
# Run it as a background command and wait for the completion notification.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
wt="${1:?worktree}"; brief="${2:?brief}"; out="${3:?out dir}"; ref="${4:-}"
cd "$wt" || exit 1
mkdir -p "$out"
json="$out/sonnet.json"
if [ -e "$json" ]; then
  echo "sonnet: already reviewed; a slice gets one review" >&2; exit 1
fi
if [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
  echo "sonnet: commit or discard your changes first; the review reads a commit" >&2; exit 1
fi
base=$("$here/merge-base.sh" $ref) || exit 1
# It runs in the real worktree, so it gets no shell at all, only the read tools, and reads the
# diff from a file. The branch's own .claude settings don't load, so its hooks can't run either.
sha=$(git rev-parse HEAD)
git diff "$base" HEAD > "$out/sonnet.diff" || exit 1
{ cat "$here/review.md" "$brief" || exit 1
  printf '\n**Target, set by pass.sh:** Sonnet'"'"'s review; ids are `S-<n>`. The diff is in `%s`, from the merge base %s to %s. You have no shell: read the diff and the files with Read, Grep and Glob.\n' "$out/sonnet.diff" "$base" "$sha"
} > "$out/sonnet.prompt.md" || exit 1
timeout --kill-after=30s 30m claude -p --model claude-sonnet-5-5 --effort medium \
  --output-format json --strict-mcp-config --json-schema "$(cat "$here/findings.schema.json")" \
  --tools Read Grep Glob --setting-sources user \
  < "$out/sonnet.prompt.md" > "$out/sonnet.raw.json" 2> "$out/sonnet.log"
rc=$?
# Whatever slipped past those limits, a review that changed the worktree didn't read the commit
# it names, so its findings aren't published.
if [ "$(git rev-parse HEAD)" != "$sha" ] || [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
  echo "sonnet: the worktree changed during the review; inspect it with git status, then rerun" >&2; exit 1
fi
python3 - "$out" "$rc" <<'PY' || { echo "sonnet failed (exit $rc); last lines of $out/sonnet.log:"; tail -n 15 "$out/sonnet.log"; exit 1; }
import json, sys
out, rc = sys.argv[1], int(sys.argv[2])
raw = json.load(open(f"{out}/sonnet.raw.json"))
result = raw.get("structured_output")
if rc != 0 or raw.get("is_error") or not isinstance(result, dict):
    sys.exit(1)
json.dump(result, open(f"{out}/sonnet.json", "w"), indent=2)
PY
printf '%s\n' "$sha" > "$out/sonnet.sha"
python3 "$here/findings.py" sonnet "$json"
