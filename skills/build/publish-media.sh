#!/usr/bin/env bash
# Publish PR proof media to the orphan `pr-media` branch, so screenshots and GIFs
# never reach main.
#
#   publish-media.sh <p<n>-slug> <file>...
#
# Prints one Markdown image line per file, pointing at the pushed blob. Check that they
# render in the PR; if not, use the relative form ../blob/pr-media/<path>?raw=true.
set -euo pipefail
dir="${1:?folder, e.g. p19-answer-export}"; shift
[ "$#" -gt 0 ] || { echo "no files given" >&2; exit 2; }
for f in "$@"; do [ -f "$f" ] || { echo "not a file: $f" >&2; exit 2; }; done
branch=pr-media
repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
tmp="$(mktemp -d "${TMPDIR:-/tmp}/pr-media.XXXXXX")"
trap 'git worktree remove --force "$tmp" >/dev/null 2>&1 || true; rm -rf "$tmp"' EXIT

git fetch -q origin "$branch" 2>/dev/null || true
if git rev-parse -q --verify "origin/$branch" >/dev/null; then
  git worktree add -q --detach "$tmp" "origin/$branch"
  git -C "$tmp" switch -q -C "$branch"
else
  git worktree add -q --detach "$tmp"
  git -C "$tmp" switch -q --orphan "$branch"
  git -C "$tmp" rm -rq --cached . >/dev/null 2>&1 || true
  find "$tmp" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
fi

mkdir -p "$tmp/$dir"
for f in "$@"; do cp "$f" "$tmp/$dir/"; done
git -C "$tmp" add "$dir"
git -C "$tmp" commit -q -m "media: $dir" || true
git -C "$tmp" push -q origin "HEAD:$branch"

for f in "$@"; do
  name="$(basename "$f")"
  echo "![${name%.*}](https://github.com/$repo/blob/$branch/$dir/$name?raw=true)"
done
