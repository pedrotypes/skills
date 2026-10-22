#!/usr/bin/env bash
# Usage: show.sh <file.md>
# Renders a Markdown file with glow in a Herdr pane to the right of the caller's pane.
# Reuses this tab's pane labelled "glow" when there is one; otherwise splits a new one
# without taking focus.
set -euo pipefail

die() { echo "show-markdown: $*" >&2; exit 1; }

[ "${HERDR_ENV:-}" = 1 ] || die "not inside Herdr"
[ $# -eq 1 ] || die "usage: show.sh <file.md>"
[ -f "$1" ] || die "no such file: $1"
file="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"

if glow --version >/dev/null 2>&1; then
  glow=glow
elif command -v mise >/dev/null; then
  glow="mise x glow@latest -- glow"
else
  die "glow is not installed: https://github.com/charmbracelet/glow#installation"
fi

pane=$(herdr pane list --workspace "${HERDR_PANE_ID%%:*}" |
  jq -r --arg tab "${HERDR_TAB_ID:-}" '[.result.panes[] | select(.tab_id == $tab and .label == "glow")][0].pane_id // empty')

if [ -n "$pane" ]; then
  # Quit the pager, then clear anything left on the shell's input line.
  herdr pane send-keys "$pane" q ctrl+u >/dev/null
else
  pane=$(herdr pane split "$HERDR_PANE_ID" --direction right --no-focus --cwd "$(dirname "$file")" | jq -r '.result.pane.pane_id')
  herdr pane rename "$pane" glow >/dev/null
fi

quoted="'${file//\'/\'\\\'\'}'"
herdr pane run "$pane" "clear; $glow -p -w \$((\$(tput cols)-2)) $quoted" >/dev/null
echo "$pane"
