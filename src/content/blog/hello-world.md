---
title: "Hello World: Moving from Substack to a Custom Blog"
description: "Why I decided to leave Substack and build my own blog with Astro — complete with a terminal-inspired dark theme, markdown support, and full creative control."
pubDate: 2026-02-25
tags: ["meta", "astro", "web"]
---

## Why move?

Substack is great for getting started, but eventually you want more control. Specifically:

- **Full design control** — I wanted a terminal/hacker aesthetic that matches my [talks site](https://slides.kaya.sk)
- **Markdown-first** — Write in my editor, commit to git, deploy automatically
- **No platform lock-in** — My content lives in markdown files I own
- **Performance** — Static HTML, no JavaScript frameworks shipping to the client

## The stack

This blog is built with [Astro](https://astro.build/), a modern static site generator that treats content as first-class:

```typescript
// Content collections make blog posts type-safe
const posts = await getCollection("blog");
const sorted = posts.sort(
  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
);
```

The theme is hand-crafted CSS with a dark terminal aesthetic — monospace fonts, scanline overlays, matrix rain, and glowing cyan accents.

## What's next

I'll be writing about:

- **.NET and C#** — deep dives into the runtime, patterns, and performance
- **AI and agents** — building with LLMs, Semantic Kernel, MCP, and agentic patterns
- **Developer tooling** — the tools and workflows that make us productive

Stay tuned via the [RSS feed](/rss.xml).
