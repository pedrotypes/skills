# The PRD

The PRD is the what and why, written for the user. Its one job: they read it and recognise their own thinking. Write for a busy CPTO who has three minutes: show before you tell, put what they must check first, and fold everything else away.

**It's rendered, not written twice.** `prd.md` is the source, and `prd.html` beside it is the page:

```bash
node "$S/render-prd.mjs" --tokens <Tokens> <Plans>p<n>-<slug>/prd.md > <Plans>p<n>-<slug>/prd.html
```

Leave out `--tokens` when the manifest has no *Tokens* line: the page then uses its own neutral palette.

The page is committed in the plan folder, so anyone can open it in a browser, years from now, without a Claude account. It loads Mermaid from a pinned CDN to draw its diagrams. Render it again in the same commit as every PRD change. `--check <Plans>`, with the same `--tokens`, exits non-zero and names each page that no longer matches its PRD. §6 runs it before shipping. What the renderer needs:

- **The title**: `# P<n> <Name>`.
- **`## What you said`**: one bullet per point, `<their words, quoted, with the source> → <your reading>`. Quote only what they actually wrote or said. A decision you only have secondhand is a paraphrase, labelled as one, with no quotation marks. A made-up quote breaks the one thing this section exists to do.
- **`## Where I might be wrong`**: one bullet per assumption, `**<Claim>.** <detail>. **If not:** <what changes>`. Two to four of them, and only ones that would change what gets built, not how.
- **`## Done when`**: `**P<n>-S<k> <short name>**: <behaviour>`. The page shows the name beside the id.
- **`## Solution`**: the text before the first `###` is the page's "How it works". Draw it with a `mermaid` fence (a state, sequence or flow diagram). The `###` subsections (`Your directives`), `Out of scope` and `Open questions` fold into the record. A section that's empty or says "None." is left out.

## Mockups

UI changes get one hand-written fragment, `mockups.html`, in the plan folder. The renderer picks it up on its own. It's the only HTML you write. Show every state that matters, including the failure, with realistic example data labelled as examples. Use the classes from [`prd.css`](prd.css), and write no CSS of your own:

```html
<div class="frames">
  <div class="frame"><span class="micro">Caption: the state shown</span>
    <div class="ui"><h3>Installer handbook</h3><small>confluence · active</small>
      <div class="btns"><span class="btn pressed">Synchronize</span><span class="btn">Edit labels</span><span class="btn quiet">Delete source</span></div>
      <p class="note">Synchronization queued.</p>   <!-- .note.alert for a refusal -->
    </div></div>
</div>
```

Tables go inside `.frame > .table`, and mark what the change adds with `class="new"` on its cells. For backend work, skip the fragment: the request and response go into the Solution as a fenced block.

## Reviewing it

Publish the committed `prd.html` as a private artifact, so the user can comment on any line, and put the link under the title: `PRD: <url>`. Republish the same file after each render, so the link stays the same. Comments reach you through `ArtifactComments`. Answer each one, change the PRD, render again, commit and republish.
