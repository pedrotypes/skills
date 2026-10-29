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
    T[Main tests, red] --> B[Build and prove] --> V[One review] --> FX[One round of fixes] --> FI[Fold in]
  end
  R --> T
  FI --> A[Rerun all evidence] --> AU[Independent audit] --> L[One PR, babysit to merge-ready] --> H[Hand to the user]
```

**Before anything:** read `.agents/project.md`, the manifest ([manifest.md](../setup/manifest.md)); run `/setup` if it's missing. *Plans*, *Verify* and the like below mean its lines. Read [Host compatibility](orchestrate.md#host-compatibility) for skill paths, invocation, agent roles and reviewers. If a `.worktrees/p<n>-*` worktree holds a PRD for this, resume at the first step without its marker: the PRD's `Signed off` date, the ledger's headings, each slice's main-test commit, its `review.sha`, its `Reran` lines, its fold-in, and the audit's summary at the top of the ledger naming the head. A step without its marker isn't done.

- **Codes carry names** wherever a person reads them: "P92 (reusable rockets) S3 (landing legs)", never "P92 S3".
- **Progress notes:** at each change of stage, one line on what finished and what's next. Write more only for a decision the user must make; the detail stays in files.
- **Tickets:** while you work on a ticket, whether someone else filed it or you did, assign it to the user and move it through the tracker's workflow as the work moves.
- **A second opinion** follows the host mapping in [orchestrate.md](orchestrate.md#host-compatibility).

## 0. Size it

Read the *Routing* file and the docs it names for the area, the ticket if there is one, and enough code to size it. Take the full workflow when the request and docs leave behaviour open, there's more than one approach the user would care about, it touches auth, data, migrations, infrastructure or CI, or it spans components or about 150 lines. Otherwise take the short path. When unsure, ask in one question, your recommendation first.

**The short path:** a worktree `<Worktrees>/<slug>` on `fix/<slug>` or `chore/<slug>`, *Install*, and `.build/` kept out of git. A failing test, the fix, a commit. Update the doc it affects, run *Verify* and the *Extra checks* that apply, review once and fix as §4 says (folder `.build/review/`, the request and the test in place of a PRD and a ledger), and ship as §5 says. Its evidence is the test's first failure line with its commit, *Verify* green at the head, and the review's outcome. There's no ledger and no audit, and the PR's **Evidence** gives these instead and says so. A blocker that needs a design decision means switching to the full workflow.

## 1. Understand and agree the PRD

Read the *Routing* docs, the *Plans index*, other worktrees' PRDs and the ticket with its comments. Ask code questions of an `Explore` subagent. Reproduce, measure, spike when a choice turns on a fact, and compare real alternatives including the smallest. Put your understanding and draft questions to a second opinion, and settle what it settles. Then interview the user about what only they can say, in batches, recommendation first, until you share one understanding: they recognise their own thinking in your summary, and no open question would change what gets built. Stop short of that and the build proves the wrong thing.

A technical directive from the user beats a standard: say in a sentence what the standard protects, follow the directive, and quote it in the PRD under **Your directives**.

**Worktree.** Plan number: one above the highest anywhere, in any branch's *Plans* history or another worktree. Create `<Worktrees>/p<n>-<slug>` on `feat/p<n>-<slug>` from the up-to-date base branch, with the ticket ID after the number when there is one. Copy `.env`, *Install*, exclude `.build/`.

**The PRD**, `<Plans>p<n>-<slug>/prd.md`, follows [`prd-format.md`](prd-format.md). Its `Done when` scenarios (`P<n>-S<k> <name>`) are the goals, the test names and the proof checklist. Its **Test seams** say, for each scenario, where the test drives the code, what it checks, and its **Proof**: what will convince the user it holds, chosen for the kind of work. Propose them, and change them with the user until you both agree that this proof would convince them. The builders and the audit are held to it. Commit it with the index entry and get the user's sign-off as that file says. That's their one stop.

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
### Step 1: <name>
- Scope: files and areas · Done when: what's true after
## Changed during implementation
```

**A slice** is the smallest set of steps after which the feature branch still works. It cuts through every layer its scenarios need, serves one to three of them, and stays under about 400 changed lines. The first slice proves the riskiest part. Slices sharing no dependency run in parallel; shared types or migrations go in an earlier slice. When nothing smaller can work, it's one slice. Steps run in order and are numbered across the plan.

**Feasibility.** Put the PRD, map and plan to a second opinion and settle what it raises. Go back to the user only if a scenario, a seam or a directive would change.

**The main tests.** You write them yourself: for each scenario, the tests at its agreed seam, named by scenario id, including its failure paths. They are the main tests, not all of them; builders add tests only for what the main tests can't reach (§3). When a slice's worktree is created, write its main tests there, run them, and see each do what its Proof says: fail for the right reason where the behaviour is new (it's missing, not a typo), or pass now and fail when you break the behaviour on purpose where it must not change. Commit them before the builder starts, `P19: main tests for S3 and S4`, and note that commit in the plan. Every commit that touches a main test file has a subject starting `P<n>: main tests`. Before the first slice starts, commit the ledger, `<Plans>p<n>-<slug>/ledger.md`, on the feature branch with one heading per scenario, so slices fill in different parts of it.

## 3. Build and prove

You orchestrate; a fresh builder (Opus 5.5 in Claude Code, Codex under Codex) takes each slice in its own worktree, as [`orchestrate.md`](orchestrate.md) says. Builders follow the *Routing* file, the *Standards* and these rules:

1. **Red.** First run the slice's main tests for this step and see each do what its Proof says before any code changes: fail where the behaviour is new, pass where it must be preserved. Then add a test only for a rule the main tests can't reach cheaply, such as a parsing, timing or permission edge, and the abuse case at a trust boundary. Test each behaviour once, at the lowest tier that sees it whole: one test of a rule, not one per input or variant; not a rule a main test or another layer already proves; nothing that only pins copy, constants, defaults or which calls were made. See each fail before writing the code it tests. Never change a main test to make it pass: if one is wrong, report it.
2. **Green.** The least code that passes.
3. **Prove it** the way the scenario's Proof says. When that needs the running system, start the *Isolated stack* (`N=<plan>_<slice>`, a free port), do it as the user would, and check where the result lands (rows, jobs, logs). A proof is a command or a browser spec that exits non-zero when the scenario doesn't hold. It saves its captures in `.build/proof/out/<scenario id>/` in the feature worktree: text for requests, responses and rows, desktop and phone screenshots for UI, and a clip where an interaction matters. Commit a browser spec with the step. Stop the stack and run its *Cleanup*.
4. **Ledger.** Fill in the scenario's entry in the ledger, so anyone can rerun the proof from it. Record the exact commands, with `$BASE_URL` for the stack, and environment variables by name, never their values, local paths or ports:

   ```markdown
   ## P19-S3 refuse a second vote while one is in flight
   - Tests: `<file>` › `<name>`, first failed with `<failure line>`; at `<commit>`
   - Stack: started with `<variable names>`; <state it needs, e.g. the switch on>. Or `none`, when the Proof needs no running system
   - Proof: `<command>` exits 0; it checks <what>; captures `out/<scenario id>/<file>`, …
   - Reran: `<commit>` exit `<code>`
   ```
5. **Commit** the step and its ledger entry, naming the scenario: `P19-S3: refuse a second vote while one is in flight`.

Builders run the *Unit tests* for the code they change after every step, plus the type check, and the *Integration tests* for a boundary only when a step changes it. Never *Verify*, a package's suite or the whole suite: those are for integrating work, and *Verify* catches what a narrow run misses. *Verify* runs on the feature branch (§4): before a dependent slice starts from it, and on the feature head before the audit. A failure goes back to the builder of the slice it implicates as a failing test; rerun what failed until it passes, then *Verify* once more.

When reality disagrees with the plan, decide by the PRD and log it under `Changed during implementation`; escalate only when a scenario or directive would change. Every bug, from anyone, gets a failing test first. A behaviour change includes its *Reference docs* or *Data flows* update. Problems left unfixed go to the tracker's backlog (search first; what, where, evidence, proposed fix), or into the hand-off without a tracker.

**Rerun the evidence** once the slice's steps have landed: run every ledger proof on the slice head, starting its stack only for those that need it. A proof passes when it exits 0 and its captures show what its scenario says; one that doesn't goes back to the builder. No review until it reruns. Each rerun adds a `Reran` line to the ledger, committed. Evidence is at a head when that head differs from its `Reran` commit only by commits that touch the ledger, so rerun only when code changed since.

## 4. Review once, fix once, fold in

Before the review, check the main tests are as you wrote them: every commit in `git log <main-test commit>..HEAD -- <main test files>` has a subject starting `P<n>: main tests`. Any other is a finding. A builder who finds a main test wrong reports it, and you change it yourself, in such a commit.

Write `.build/review/<slice>/brief.md`: what the slice does, the paths of the PRD, the plan, the ledger and `.build/proof/out/`, its scenarios, and the user's deliberate choices. The prompt is [`review.md`](review.md); change it there, not in a brief. Commit first: a review reads a commit in a clean worktree. Start the reviewers the host mapping names, in parallel and fresh, each read-only with `review.md`, the brief, its finding-id prefix and the slice's diff from where it left the feature branch. Findings follow [`findings.schema.json`](findings.schema.json). A reviewer still running after an hour has failed; say so. A reviewer that couldn't read its diff, brief or files hasn't reviewed: run it again with access, never count it. Record the commit they read in `.build/review/<slice>/review.sha`. If the slice's worktree changed during the review, it didn't read that commit: review again. Otherwise a slice gets one review.

One subagent then handles every finding once:

- **P1, P2:** confirmed ones get a regression test, the fix, and a commit naming the finding, with everything that refers to the change updated. Otherwise cite what disproves it, the PRD or standard that decided it, or the finding it duplicates. Weak evidence gets better evidence. A dismissal goes back to the reviewer that raised the finding, with its citation: a subagent reviewer by message, Codex in a new read-only run. It stands only if the reviewer withdraws the finding, or you read the cited text and it says so.
- **P3s and cuts:** take the small ones in files the slice touches; backlog the rest.
- A fix that would change agreed behaviour goes to the user.

If the fixes changed code, rerun the evidence. If the feature branch moved since the slice left it, merge it into the slice, so the fold-in fast-forwards. Then **fold in**: fast-forward the feature branch to the slice. No second review, and no waiting for the user between slices. Independent slices fold in one after another with no *Verify* of their own. Dependent slices start from the feature branch once *Verify* is green there.

When every slice is in, merge the up-to-date base branch into the feature branch (never rebase a pushed branch), and make *Verify* and the *Extra checks* that apply green there.

**The audit.** A fresh subagent that built and planned none of it (Opus in Claude Code, Codex under Codex), with [`audit.md`](audit.md) as its prompt. It reruns every ledger proof on the feature head itself (`N=<plan>`), checks each scenario against its Proof in the PRD, and writes its verdicts in the ledger and on the proof page; you commit its ledger writes as `P<n>: audit`. Its captures are the PR's evidence. A scenario it doesn't call **Proven** goes back to a builder for a failing test or better evidence; then the audit runs again on the new head, scoped as "Nothing ships red" says. Its verdict is what the user reads, so don't ship around it.

## 5. Ship

With *Landing* `local merge`, run "Nothing ships red", then follow [local-merge.md](local-merge.md) instead of the rest.

**Nothing ships red.** The head the audit judged is the head that ships, up to commits that touch only the ledger and clean base-branch merges. After a change to the feature's own code (a CI fix, a review comment), make *Verify* and the *Extra checks* that apply green, then audit again, scoped to the change: a fresh auditor audits every scenario the change adds, or could affect judging by its diff since the audited head, and keeps the other verdicts. When unsure whether a scenario is affected, include it. A base-branch merge is clean when it needs no conflict resolution and the base's new commits touch none of the files the feature changes; it needs only the PR's checks green at the new head (*Verify* with *Landing* `local merge`), and the PR names the head the audit judged. Any other base-branch merge counts as a change to the feature's code. A failure is a bug, not a retry.

**The record.** `.build/proof/README.md` is the audit's proof page. `.build/proof/review.md` lists each slice's findings and what happened to them. Turn clips into GIFs with the manifest's *ffmpeg*, small and sharp enough to read in a PR. Publish the proof page, the review report, the plan, the code map and every capture to `p<n>-<slug>/` on the *Proof media branch*, never the base branch, keeping each capture's `out/<scenario id>/` path: the proof page links captures by it. The PR links that proof page.

**The PR**, readable in a minute. Title in the repo's commit style with the ticket ID. Body: **What** (two lines), **Why** (two lines, ticket and PRD links), **Evidence** (the audit's summary, with the commit it judged and who audited, two to four embedded captures, each under its scenario, then anything the user must decide, then the proof page link), and the *PR footer*. Every link absolute; images are `https://github.com/<repo>/blob/<Proof media branch>/p<n>-<slug>/out/<scenario id>/<file>?raw=true`.

**Babysit to merge-ready:** checks green at the head, the audit at the head (up to ledger-only commits), threads settled, and no conflict with the base branch. Merge the base branch in only when the PR conflicts with it or the host requires an up-to-date branch: each merge restarts the checks. Agents never merge. Fixes go to subagents.

**Waiting on something outside the session** (CI, a deploy, a bot review, a merge): don't build a watcher that reports back. Schedule a check every 10 minutes. At each one, look with a plain status command, act on what you see, and keep the schedule until nothing is pending. After any merge, the base branch's own checks are pending too.

- A failing or flaky check is a bug.
- A review comment: if right, regression test, fix, reply with the commit; if wrong, reply with the evidence; if it changes agreed behaviour, ask the user. Resolve a bot's thread once settled; leave a person's for them.
- A requested bot review missing after 30 minutes: carry on and say so.
- After any change to the head, follow "Nothing ships red", then update the PR, and the proof page when the audit ran again.

**Hand it over:** the link, what needs the user first, one line on what it does and the audit's verdict. Stop the stack (`.build/pids`). Suggest `/retro` if the build was harder than it should have been.

**After the merge**, if asked to clean up: confirm the PR merged at your head, kill `.build/pids`, run *Cleanup* for each `N`, fast-forward the base branch, remove the worktrees, and delete the feature and slice branches.
