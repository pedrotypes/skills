#!/usr/bin/env bash
# SessionStart hook: at most once a day, tell the session when GitHub has a newer commit of these
# skills than the one installed, so Claude can offer the update. Whatever it prints joins the
# session's context. It never fails the session: every problem means silence.
repo=pedrotypes/skills

# A marketplace install lives in .../<plugin>/<12-character commit>/. Anything else is a working copy.
installed=$(basename "${CLAUDE_PLUGIN_ROOT:-}")
[[ $installed =~ ^[0-9a-f]{12}$ ]] || exit 0

data=${CLAUDE_PLUGIN_DATA:-${TMPDIR:-/tmp}/pedrotypes-skills}
mkdir -p "$data" 2>/dev/null || exit 0
stamp=$data/last-check
[[ -n $(find "$stamp" -mmin -1440 2>/dev/null) ]] && exit 0
touch "$stamp"

latest=$(curl -fsS --max-time 2 -H 'Accept: application/vnd.github.sha' \
  "https://api.github.com/repos/$repo/commits/main" 2>/dev/null) || exit 0
[[ $latest =~ ^[0-9a-f]{40}$ ]] || exit 0
[[ $latest == "$installed"* ]] && exit 0

cat <<MSG
An update to the pedrotypes skills is available: installed ${installed}, latest ${latest:0:12}.
What changed: https://github.com/$repo/compare/${installed}...${latest:0:12}
Tell the user once, in one line, and offer to update. If they agree, run
\`claude plugin marketplace update pedrotypes && claude plugin update skills@pedrotypes\`,
then ask them to run /reload-plugins.
MSG
