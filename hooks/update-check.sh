#!/usr/bin/env bash
# SessionStart hook: offer newer published versions at most once a day.
# Legacy hash installs compare commits. Every problem means silence.
repo=pedrotypes/skills

# Marketplace cache directories use a release version or a legacy commit prefix.
installed=$(basename "${CLAUDE_PLUGIN_ROOT:-}")
semver='^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'
[[ $installed =~ $semver || $installed =~ ^[0-9a-f]{12}$ ]] || exit 0

data=${CLAUDE_PLUGIN_DATA:-${TMPDIR:-/tmp}/pedrotypes-skills}
mkdir -p "$data" 2>/dev/null || exit 0
stamp=$data/last-check
[[ -n $(find "$stamp" -mmin -1440 2>/dev/null) ]] && exit 0
touch "$stamp"

if [[ $installed =~ $semver ]]; then
  manifest=$(curl -fsS --max-time 2 \
    "https://raw.githubusercontent.com/$repo/main/.claude-plugin/plugin.json" 2>/dev/null) || exit 0
  latest=$(printf '%s' "$manifest" | python3 -c '
import json, re, sys
try:
    version = json.load(sys.stdin)["version"]
    if not isinstance(version, str) or not re.fullmatch(r"(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)", version):
        sys.exit(1)
    if tuple(map(int, version.split("."))) <= tuple(map(int, sys.argv[1].split("."))):
        sys.exit(1)
    print(version)
except (ValueError, KeyError, TypeError):
    sys.exit(1)
' "$installed" 2>/dev/null) || exit 0
  from=v$installed
  to=v$latest
else
  latest=$(curl -fsS --max-time 2 -H 'Accept: application/vnd.github.sha' \
    "https://api.github.com/repos/$repo/commits/main" 2>/dev/null) || exit 0
  [[ $latest =~ ^[0-9a-f]{40}$ ]] || exit 0
  [[ $latest == "$installed"* ]] && exit 0
  latest=${latest:0:12}
  from=$installed
  to=$latest
fi

cat <<MSG
An update to the pedrotypes skills is available: installed ${installed}, latest ${latest}.
What changed: https://github.com/$repo/compare/${from}...${to}
Tell the user once, in one line, and offer to update. If they agree, run
\`claude plugin marketplace update pedrotypes && claude plugin update skills@pedrotypes\`,
then ask them to run /reload-plugins.
MSG
