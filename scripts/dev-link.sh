#!/usr/bin/env bash
# Load this repo into Claude Code as a live plugin, for development.
#
# A directory under ~/.claude/skills/ that contains .claude-plugin/plugin.json is
# loaded as a plugin (`<name>@skills-dir`) straight off disk — no install, no
# cache. Symlinking the repo there means edits are live: start a new session and
# the change is in. The namespace matches production, so `/pedrotypes-skills:feature`
# resolves exactly as it will for anyone who installs the published plugin.
#
# The marketplace install is unsuitable for this: it copies the repo into
# ~/.claude/plugins/cache/ keyed by HEAD's commit SHA, and `plugin update` is a
# no-op until that SHA changes — so uncommitted edits are invisible. It also
# takes precedence over this link, so uninstall it while developing.
#
# Usage:  scripts/dev-link.sh            link the repo
#         scripts/dev-link.sh --unlink   remove the link
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
manifest="$repo_root/.claude-plugin/plugin.json"

# The plugin's `name` is what Claude Code namespaces skills under, so the link
# is named after it. First "name" key in the manifest is the plugin's own.
plugin_name="$(grep -m1 '"name"' "$manifest" | sed 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')"
if [[ -z "$plugin_name" ]]; then
  echo "could not read plugin name from $manifest" >&2
  exit 1
fi

link="$HOME/.claude/skills/$plugin_name"

if [[ "${1:-}" == "--unlink" ]]; then
  if [[ -L "$link" ]]; then
    rm "$link"
    echo "unlinked $link"
  else
    echo "nothing to unlink at $link"
  fi
  exit 0
fi

if [[ -e "$link" && ! -L "$link" ]]; then
  echo "refusing to replace $link (exists and is not a symlink)" >&2
  exit 1
fi

mkdir -p "$(dirname "$link")"
ln -sfn "$repo_root" "$link"
echo "linked $link -> $repo_root"
echo "skills resolve as /$plugin_name:<skill> in new sessions"

# An installed plugin of the same name takes precedence, and this copy is then
# silently not loaded at all — so the link is inert until the install is gone.
if claude plugin list 2>/dev/null | grep -q '@pedrotypes'; then
  cat >&2 <<EOF

warning: an install from the 'pedrotypes' marketplace is active and claims the
name "$plugin_name", so THIS COPY WILL NOT LOAD. Remove the install first:

  claude plugin uninstall skills@pedrotypes
EOF
fi
