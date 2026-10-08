# The HTML page

One self-contained HTML file. The diagrams carry the weight and the prose stays sparse. If a diagram needs a paragraph to be understood, redraw it.

## Fast to write

You write the content and the diagrams, not the styling.

- **Styling**: paste [`../build/picture.css`](../build/picture.css) into the page's `<style>`. Append the *Tokens* file's custom properties as render-picture.mjs does, so it looks like the product. It already has both appearances, hairlines, micro-labels (`.micro`), badges (`.chip`), tables and collapsible `<details>`. Write no CSS beyond a few lines of layout.
- **Diagrams**: `<pre class="mermaid">` blocks, drawn by the same pinned Mermaid `<script>` pair that `render-picture.mjs` puts at the end of the page, so the report opens anywhere. Use `flowchart` with a `subgraph` per module, dashed links (`-.->`) for seams, and `classDef leak stroke:#f60439` for leaks. Hand-draw SVG only for a picture Mermaid can't express, such as a mass diagram.

## Structure

- **Header**: the repo, the date, the scope (the area, the plan, or the churn window), and a one-line legend: hairline box = module, dashed line = seam, crimson arrow = leakage, heavy box = deep module.
- **The verdict line**, straight under the header: how many candidates at each strength, or "Nothing above Speculative: the code is in good shape here."
- **One `<article>` per candidate**, strongest first:
  - Title naming the deepening ("Fold run scheduling into the run queue").
  - Badge row: the dependency category and the strength. **Strong**: the deletion test passes clearly and the friction shows up in recent commits. **Worth exploring**: plausible, but the payoff depends on where the code goes next. **Speculative**: included for completeness.
  - Files, as a mono list.
  - Before / after diagram, the centrepiece.
  - Friction: one sentence, citing the commits or the call sites that show it.
  - Change: one sentence.
  - Wins: up to four bullets of six words or fewer, in vocabulary terms ("locality: retry rules in one module").
  - Tests: which ones get simpler, which ones go away.
  - If it reopens a `Considered and rejected` entry or a plan decision, a one-line note saying which and why the friction has changed.
- **Top recommendation**: the candidate's name, linked to its card, and two sentences on why it goes first.

## Diagram patterns

Pick the one that shows the problem. Vary them across the page.

- **Boxes and arrows**: modules as boxes, calls as arrows, leaks as crimson arrows across a dashed seam. After: one heavy box with the absorbed modules faded inside.
- **Cross-section**: horizontal bands for the rings a call passes through (`http` → `application` → `adapters`). Before: thin bands that each do nothing. After: one thick band.
- **Mass diagram**: per module, one bar for interface and one for implementation. Shallow: the bars are nearly equal. Deep: a short interface bar over a tall implementation bar.
- **Call fan-out**: one concept's callers, each repeating the same steps. After: the steps inside one module, one arrow per caller.

Keep each diagram under about 320px tall.
