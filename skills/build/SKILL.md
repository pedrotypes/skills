---
name: build
description: Take something new from idea to one merge-ready pull request (or a guarded local merge in a repo without a remote). Small, clear changes take a short path. Real work gets a PRD the user signs off, then thin slices that fresh builder agents build test-first and prove on a running stack; each slice gets one host-appropriate review, is fixed once and folded into the feature branch, and the feature ships as one short what-why-evidence PR, babysat to merge-ready. Use whenever the user wants to build something, change behaviour or solve a problem — "let's build…", "I want…", "we need…", "solve…", "can we make it so…" — or to resume or land work in a `.worktrees/` feature.
---

# Build

The user owns the problem, the taste and the veto. You own everything else: what the code, the docs, an experiment or a second opinion can answer, you answer. Treat the user as a busy CPTO. Stop for them only when a decision is truly theirs, lead with it, and link the rest.

```mermaid
flowchart LR
  Z{Small and clear?} -->|yes| SP[Short path] --> L
  Z -->|no| U[Understand] --> D[PRD: user signs off] --> R[Map and plan slices]
  subgraph each slice, in parallel where it can
    B[Build and prove] --> V[One review] --> FX[One round of fixes] --> FI[Fold in]
  end
  R --> B
  FI --> A[Rerun all evidence] --> L[One PR, babysit to merge-ready] --> H[Hand to the user]
```

**Before anything:** read `.agents/project.md`, the manifest ([manifest.md](../setup/manifest.md)); run `/setup` if it's missing. *Plans*, *Verify* and the like below mean its lines. Read [Host compatibility](orchestrate.md#host-compatibility) for skill paths, invocation, agent roles and helpers. If a `.worktrees/p<n>-*` worktree holds a PRD for this, resume at the first step not done.

- **Codes carry names** wherever a person reads them: "P92 (reusable rockets) S3 (landing legs)", never "P92 S3".
- **Progress notes:** at each change of stage, one line on what finished and what's next.
- **Tickets:** while you work on a ticket, whether someone else filed it or you did, assign it to the user and move it through the tracker's workflow as the work moves.
- **A second opinion** follows the host mapping in [orchestrate.md](orchestrate.md#host-compatibility).

## 0. Size it

Read the *Routing* file and the docs it names for the area, the ticket if there is one, and enough code to size it. Take the full workflow when the request and docs leave behaviour open, there's more than one approach the user would care about, it touches auth, data, migrations, infrastructure or CI, or it spans components or about 150 lines. Otherwise take the short path. When unsure, ask in one question, your recommendation first.

**The short path:** a worktree `<Worktrees>/<slug>` on `fix/<slug>` or `chore/<slug>`, *Install*, and `.build/` kept out of git. A failing test, the fix, a commit. Update the doc it affects, run *Verify* and the *Extra checks* that apply, review once and fix as §4 says (folder `.build/review/`, the request in place of a PRD), and ship as §5 says. A blocker that needs a design decision means switching to the full workflow.

## 1. Understand and agree the PRD

Read the *Routing* docs, the *Plans index*, other worktrees' PRDs and the ticket with its comments. Ask code questions of an `Explore` subagent. Reproduce, measure, spike when a choice turns on a fact, and compare real alternatives including the smallest. Put your understanding and draft questions to a second opinion, settle what it settles, then ask the user only what only they can say, in batches, recommendation first.

A technical directive from the user beats a standard: say in a sentence what the standard protects, follow the directive, and quote it in the PRD under **Your directives**.

**Worktree.** Plan number: one above the highest anywhere, in any branch's *Plans* history or another worktree. Create `<Worktrees>/p<n>-<slug>` on `feat/p<n>-<slug>` from the up-to-date base branch, with the ticket ID after the number when there is one. Copy `.env`, *Install*, exclude `.build/`.

**The PRD**, `<Plans>p<n>-<slug>/prd.md`, follows [`prd-format.md`](prd-format.md). Its `Done when` scenarios (`P<n>-S<k> <name>`) are the goals, the test names and the proof checklist. Commit it with the index entry and get the user's sign-off as that file says. That's their one stop.

## 2. Map and plan

A documentarian subagent maps the code into `.build/research.md`, with [`research.md`](research.md) as its prompt. Plan from it into `.build/plan.md`:

```markdown
# P<n> <Name>: plan
## Decisions
| Choice | Rejected | Why |
## Standards changes
Exact new wording, as blockquotes. Only when there are some.
## Slice 1: <name>
- Depends on: none, or slices
- Serves: P<n>-S1 (<name>)
- Proof: how each scenario is shown working, or why only tests can
### Step 1: <name>
- Scope: files and areas · Done when: what's true after
## Changed during implementation
```

**A slice** is the smallest set of steps after which the feature branch still works. It cuts through every layer its scenarios need, serves one to three of them, and stays under about 400 changed lines. The first slice proves the riskiest part. Slices sharing no dependency run in parallel; shared types or migrations go in an earlier slice. When nothing smaller can work, it's one slice. Steps run in order and are numbered across the plan.

**Feasibility.** Put the PRD, map and plan to a second opinion and settle what it raises. Go back to the user only if a scenario or directive would change.

## 3. Build and prove

You orchestrate; a fresh builder (Opus 5.5 in Claude Code, Codex under Codex) takes each slice in its own worktree, as [`orchestrate.md`](orchestrate.md) says. Builders follow the *Routing* file, the *Standards* and these rules:

1. **Red.** Tests for the step's scenarios, named by scenario id, seen failing for the right reason. Include the failure modes that apply, and the abuse case at a trust boundary.
2. **Green.** The least code that passes.
3. **Prove it.** For a scenario its user can reach: start the *Isolated stack* (`N=<plan>_<slice>`, a free port), do it as the user would, and check where the result lands (rows, jobs, logs). Save that as a script, `.build/proof/<scenario id>-<name>.<ext>` in the feature worktree, that reads `BASE_URL` from the environment and writes its captures to `.build/proof/out/`: text for requests, responses and rows; desktop and phone screenshots for UI, and a clip where an interaction matters. Stop the stack and run its *Cleanup*.
4. **Commit**, naming the scenario: `P19-S3: refuse a second vote while one is in flight`.

When reality disagrees with the plan, decide by the PRD and log it under `Changed during implementation`; escalate only when a scenario or directive would change. Every bug, from anyone, gets a failing test first. A behaviour change includes its *Reference docs* or *Data flows* update. Problems left unfixed go to the tracker's backlog (search first; what, where, evidence, proposed fix), or into the hand-off without a tracker.

**Rerun the evidence** once the slice's steps have landed: start its stack on the slice head and rerun every proof script its code can run. One that fails, or captures something other than its scenario says, goes back to the builder. No review until it reruns.

## 4. Review once, fix once, fold in

Write `.build/review/<slice>/brief.md`: what the slice does, the paths of the PRD, the plan and `.build/proof/`, its scenarios, and the user's deliberate choices. The prompt is [`review.md`](review.md); change it there, not in a brief. Commit first: a review reads a commit in a clean worktree. Start the reviewers the host mapping names, in parallel and fresh, each read-only with `review.md`, the brief, its finding-id prefix and the slice's diff from where it left the feature branch. Findings follow [`findings.schema.json`](findings.schema.json). A reviewer still running after an hour has failed; say so. Record the commit they read in `.build/review/<slice>/review.sha`. If the slice's worktree changed during the review, it didn't read that commit: review again. Otherwise a slice gets one review.

One subagent then handles every finding once:

- **P1, P2:** confirmed ones get a regression test, the fix, and a commit naming the finding, with everything that refers to the change updated. Otherwise cite what disproves it, the PRD or standard that decided it, or the finding it duplicates. Weak evidence gets better evidence.
- **P3s and cuts:** take the small ones in files the slice touches; backlog the rest.
- A fix that would change agreed behaviour goes to the user.

Run *Verify*, rerun the evidence, then **fold in**: merge the slice into the feature branch and run *Verify* there. No second review, and no waiting for the user between slices. Dependent slices start from the feature branch.

When every slice is in, start the stack (`N=<plan>`) on the feature head and rerun every proof script. Its captures are the PR's evidence.

## 5. Ship

With *Landing* `local merge`, run "Nothing ships red", then follow [local-merge.md](local-merge.md) instead of the rest.

**Nothing ships red.** Merge the up-to-date base branch in (never rebase a pushed branch), run *Verify* and the *Extra checks* that apply. A failure is a bug, not a retry.

**The record.** `.build/proof/README.md` lists each capture under its scenario with one line on what it shows, at the commit it was taken. `.build/proof/review.md` lists each slice's findings and what happened to them. Turn clips into GIFs with the manifest's *ffmpeg*, small and sharp enough to read in a PR. Publish the proof page (`README.md`), the review report, the plan, the code map and every capture to `p<n>-<slug>/` on the *Proof media branch*, never the base branch. The PR links that proof page.

**The PR**, readable in a minute. Title in the repo's commit style with the ticket ID. Body: **What** (two lines), **Why** (two lines, ticket and PRD links), **Evidence** (two to four embedded captures, each under its scenario, then anything the user must decide, then the proof page link), and the *PR footer*. Every link absolute; images are `https://github.com/<repo>/blob/<Proof media branch>/p<n>-<slug>/<file>?raw=true`.

**Babysit to merge-ready:** checks green at the head, threads settled, the current base branch merged in. Agents never merge. Watch in the background; fixes go to subagents.

- A failing or flaky check is a bug.
- A review comment: if right, regression test, fix, reply with the commit; if wrong, reply with the evidence; if it changes agreed behaviour, ask the user. Resolve a bot's thread once settled; leave a person's for them.
- A requested bot review missing after 30 minutes: carry on and say so.
- After any code change, rerun the evidence and update the PR and proof page.

**Hand it over:** the link, what needs the user first, one line on what it does and what the proof showed. Stop the stack (`.build/pids`). Suggest `/retro` if the build was harder than it should have been.

**After the merge**, if asked to clean up: confirm the PR merged at your head, kill `.build/pids`, run *Cleanup* for each `N`, fast-forward the base branch, remove the worktrees, and delete the feature and slice branches.
