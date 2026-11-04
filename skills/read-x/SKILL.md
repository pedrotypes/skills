---
name: read-x
description: Read a post, thread or long-form article on X (x.com or twitter.com) without a login, through fxtwitter's public API. Use whenever the user shares an x.com or twitter.com link or asks what a post says.
---

# Read X

x.com needs a login; `https://api.fxtwitter.com/status/<id>` doesn't. It returns the post as JSON under `tweet`:

- `text`, `author`, `created_at`. A quoted post is in `quote`, a parent post's id in `replying_to_status`.
- A long-form article is in `article`: `title`, and the body as `content.blocks[].text`.

If the response has no `tweet`, or the article body is empty, say you couldn't read it. Never fill in the content from the link or memory.
