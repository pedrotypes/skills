#!/usr/bin/env bash
# Symlink every skill in this repo into the skill directories that non-plugin
# harnesses read. Claude Code should use the plugin install instead (see README);
# this is for opencode and any harness that scans ~/.agents/skills.
#
# Re-run after adding a skill. `git pull` alone is enough to update existing ones.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
targets=("$HOME/.agents/skills")

# Opt in to ~/.claude/skills with --claude (only if you are NOT using the plugin).
if [[ "${1:-}" == "--claude" ]]; then
  targets+=("$HOME/.claude/skills")
fi

while IFS= read -r skill_md; do
  skill_dir="$(dirname "$skill_md")"
  name="$(basename "$skill_dir")"
  for target in "${targets[@]}"; do
    mkdir -p "$target"
    link="$target/$name"
    if [[ -e "$link" && ! -L "$link" ]]; then
      echo "skip $link (exists and is not a symlink)" >&2
      continue
    fi
    ln -sfn "$skill_dir" "$link"
    echo "linked $link -> $skill_dir"
  done
done < <(find "$repo_root/skills" -name SKILL.md -not -path '*/node_modules/*')
