# The picture

The picture is the plan written for the user. Its one job: they read it and recognise their own thinking. Write for a PM who has three minutes and a short attention span: show before you tell, put what they must check first, and fold everything else away.

**It's rendered, not written.** The plan's Markdown is the single source. Don't write the content twice.

```bash
node "$S/render-picture.mjs" --tokens <Tokens> <Plans>P<n>-<slug>.md > <Plans>P<n>-<slug>.html
```

Leave out `--tokens` when the manifest has no *Tokens* line: the picture then uses its own neutral palette.

The picture is committed beside its plan, so anyone can open it in a browser, years from now, without a Claude account. It loads Mermaid from a pinned CDN to draw its diagrams. Render it again in the same commit as every plan change. `--check <Plans>`, with the same `--tokens`, exits non-zero and names each picture that no longer matches its plan. §7 runs it before shipping. What it needs from the plan:

- **`## What you said`**: one bullet per point, `<their words, quoted, with the source> → <your reading>`. Quote only what they actually wrote or said. A decision you only have secondhand is a paraphrase, labelled as one, with no quotation marks. A made-up quote breaks the one thing this section exists to do.
- **`## Where I might be wrong`**: one bullet per assumption, `**<Claim>.** <detail>. **If not:** <what changes>`. Two to four of them, and only ones that would change what gets built, not how.
- **`## Done when`**: `**P<n>-ScenarioN**: <behaviour>`.
- **`## Solution`**: the text before the first `###` is the picture's "How it works". Draw it with a `mermaid` fence (a state, sequence or flow diagram), which the artifact viewer renders natively. The `###` subsections (`Your directives`, `My decisions`) and the remaining sections fold into the record. A section that's empty or says "None." is left out.

## Mockups

UI changes get one hand-written fragment, `<Plans>P<n>-<slug>.mockups.html`, committed beside the plan. The renderer picks it up on its own. It's the only HTML you write. Show every state that matters, including the failure, with realistic example data labelled as examples. Use the classes from [`picture.css`](picture.css), and write no CSS of your own:

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

For the user's review, also publish the committed file as a private artifact, so they can comment on any line, and put the link under the plan's title: `Picture: <url>`. Republish the same file after each render, so the link stays the same. Comments reach you through `ArtifactComments`. Answer each one, change the plan, render again, commit and republish.
