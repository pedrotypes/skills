#!/usr/bin/env bash
# A second opinion from Codex gpt-6-astra at medium effort: read-only, no sub-agents.
#
#   consult.sh <worktree> <brief.md> <answer.md>
#
# Writes Codex's free-text answer to <answer.md>. Run it as a background command and wait for
# the completion notification.
set -u
wt="${1:?worktree}"; brief="${2:?brief}"; answer="${3:?answer file}"
cd "$wt" || exit 1
timeout --kill-after=30s 30m codex exec -m "${CODEX_MODEL:-gpt-6-astra}" -c model_reasoning_effort=medium \
  --disable multi_agent --skip-git-repo-check -s read-only -C "$wt" -o "$answer" - < "$brief" > "$answer.log" 2>&1
rc=$?
if [ "$rc" -ne 0 ] || [ ! -s "$answer" ]; then
  echo "consult failed (exit $rc); last lines of $answer.log:"; tail -n 15 "$answer.log"; exit 1
fi
echo "consult done: $answer"
