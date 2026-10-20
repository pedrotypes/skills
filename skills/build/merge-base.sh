#!/usr/bin/env bash
# Prints the merge base of HEAD with the base branch: the manifest's "Base branch" (default main).
# With an origin, it fetches that branch first and uses origin's copy, so the base is current.
# Without one (a repo that lands work by local merge), it uses the local branch.
#   merge-base.sh [<ref>]   with a ref (a slice's feature branch), the merge base with that ref.
set -u
if [ -n "${1:-}" ]; then git merge-base "$1" HEAD; exit; fi
base=$(sed -n 's/^- Base branch:[[:space:]]*//p' .agents/project.md 2>/dev/null | head -1)
base=${base:-main}
if git remote get-url origin >/dev/null 2>&1; then
  git fetch --no-tags --quiet origin "+refs/heads/$base:refs/remotes/origin/$base" || exit 1
  git merge-base "origin/$base" HEAD
else
  git merge-base "$base" HEAD
fi
