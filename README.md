# kaya.sk

Personal blog and portfolio site built with [Astro](https://astro.build). Features blog posts, talk
slides (reveal.js), and a terminal-themed design with dark/light mode support.

🔗 **Live at [kaya.sk](https://kaya.sk)**

## Features

- 📝 Blog posts in Markdown/MDX with auto-discovery
- 🎤 Talk slides built from Markdown source via [reveal-md](https://github.com/webpro/reveal-md)
- 🌙 Dark/light mode with theme persistence
- 🖥️ Terminal/hacker aesthetic with matrix rain background
- 📡 RSS feed, sitemap, SEO-friendly
- ⚡ 100% static output

## Quick Start

```sh
bun install
bun run dev       # Start dev server at localhost:4321
bun run build     # Build slides + site to ./dist/
bun run preview   # Preview the built site
```

## Adding Content

### New Blog Post

Create `src/content/blog/<slug>.md`:

```markdown
---
title: "Your Title"
description: "A short description"
pubDate: "2026-02-25"
tags: ["dotnet", "csharp"]
---

Your content here...
```

The post appears automatically on the home page, blog listing, and RSS feed.

### New Presentation (with slides)

1. Create a folder: `talks/<category>/<Talk Name>/`
2. Add `presentation.md` (reveal-md Markdown slides)
3. Add `meta.json`:
   ```json
   {
     "slug": "my-talk",
     "tag": "Topic"
   }
   ```

Run `bun run build` — slides are auto-discovered, built, and shown on the talks page and home page.

### New Past Talk (no slides)

Add an entry to the `speakingLog` array in `src/pages/talks.astro`:

```js
{ date: "2026-01", title: "Talk Title", venue: "Event Name", url: "https://..." }
```

The `url` field is optional — omit it for talks without an external link.

## Project Structure

```
├── src/
│   ├── components/         # Astro components (Header, MatrixRain, etc.)
│   ├── content/blog/       # Blog posts (Markdown/MDX)
│   ├── layouts/            # BaseLayout, BlogPost
│   ├── pages/              # Routes: /, /blog, /talks, /about
│   ├── styles/global.css   # Theme variables, shared styles
│   └── consts.ts           # Site title, description, author
├── talks/                  # Presentation source (Markdown + reveal-md config)
├── scripts/                # Build scripts (slides pipeline)
├── public/                 # Static assets (slides/ and powerpoint/ are generated, gitignored)
└── astro.config.mjs        # Astro config
```

## Commands

| Command                | Action                                      |
| :--------------------- | :------------------------------------------ |
| `bun install`          | Install dependencies                        |
| `bun run dev`          | Start dev server at `localhost:4321`         |
| `bun run build`        | Build slides from source + build Astro site |
| `bun run build:slides` | Build only the reveal.js slides             |
| `bun run build:powerpoint` | Build PowerPoint decks into `public/powerpoint/` |
| `bun run preview`      | Preview built site locally                  |

## License

This project uses a dual license:

- **Code** (Astro components, layouts, styles, scripts, configuration) is licensed under the
  [GNU General Public License v3.0](LICENSE).
- **Content** (blog posts in `src/content/blog/`, presentations in `talks/`) is licensed under
  [Creative Commons Attribution 4.0 International](LICENSE-CONTENT) (CC BY 4.0).
