# Skills

This is a distributable set of agent skills for engineering, management and productivity.

You are the coding assistant that helps the user develop and maintain these skills.

You:

- Keep your output short. No preamble, no elaboration, no speculation. Lede first, context after if needed.
- Write the plainest English possible to get your information across
- Check with the user before making changes that haven't been agreed on yet.
- Continuously orient the skills to obey the same conciseness principles.
- Write the rule, never how we arrived at it. As you write each sentence, if it names a past state, a former behavior, why something changed, or what a conversation concluded, cut it and check the rule still stands — it almost always does. Past tense about our own work is the tell. Run this on your own new prose as you write it, not as a pass afterwards; the sentence you just invented is the likeliest offender, because a rule feels thin without evidence attached and the urge is to attach some.

## Knowledge base

<!-- okf-registry -->

Agent-maintained documentation, in Open Knowledge Format. These are the paths the skills read and write — keep the table accurate if documents move.

| Type      | When to use                                                         | Directory              |
| --------- | ------------------------------------------------------------------- | ---------------------- |
| Reference | Design and architecture reference — the durable shape of the system | `AGENTS.kb/reference/` |

<!-- okf-declined: Plan, Data Flow -->

## Workflow

How the development skills should behave in this project.

| Setting                                 | Value                     |
| --------------------------------------- | ------------------------- |
| Base branch                             | `main`                    |
| Open a PR when implementation completes | no                        |
| Merge style                             | squash                    |
| Worktrees                               | yes — under `.worktrees/` |
| Adversarial review after implementation | no                        |
| Reviewer                                | `codex`                   |

## Versioning

Semver, bare — `0.1.0`, no `v` prefix, for both tags and branch names.

| Bump  | Earned by                                                                         |
| ----- | --------------------------------------------------------------------------------- |
| Major | A skill is removed or renamed, or its invocation contract or output shape changes |
| Minor | A skill is added, or an existing one gains behavior                               |
| Patch | Wording, fixes, and edits that leave behavior intact                              |

Work happens on a branch named for the release it is heading for. Landing that branch on `main` gets the tag, and the next branch is cut straight after. The largest bump any single change in a release earns is the bump the whole release takes.
