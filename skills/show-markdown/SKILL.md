---
name: show-markdown
description: Show the user a Markdown file rendered by glow in a Herdr pane to the right of the current one. Use whenever the user asks to show, open, view, display or read a .md file ("show me the PRD", "open the plan", "let me see the README"), inside Herdr.
---

# Show Markdown

Run, with the file's path:

```bash
"${CLAUDE_SKILL_DIR}/show.sh" <file.md>
```

It renders the file in this tab's pane labelled `glow`, or splits a new one to the right without taking focus. It prints the pane's id.

- The file isn't Markdown: say so and show it some other way.
- It exits with "not inside Herdr": print the file's path instead.
- It exits with "glow is not installed": pass on the install link it prints.
- After you change a file the user is viewing, run it again to re-render.

Tell the user it's open on the right, in one line. In the pane, space and `b` page, `/` searches, `q` quits.
