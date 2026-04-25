# Copilot Instructions for the Blog Repository

This repository is a personal blog and portfolio site built with [Astro](https://astro.build). It
includes blog posts, talk slides (reveal.js), and a terminal-themed design with dark/light mode
support. Follow these instructions when helping with the site.

---

## ⚠️ General Rules

> **IMPORTANT — you MUST follow these rules for every task, no exceptions.**

- **Always commit your changes before marking a task as complete.** Never leave uncommitted work. If
  a task produces file changes, `git add` and `git commit` before calling `task_complete`.
- **Always use [Conventional Commits](https://www.conventionalcommits.org/)** — every commit message
  **must** start with a type prefix (e.g., `feat:`, `fix:`, `docs:`). See the
  [Git Commits](#git-commits) section for the full specification. **Never** create a commit without
  a conventional commit prefix.
- **Always run `bun run build`** after making changes to verify nothing is broken before committing.

---

## Repository Structure

```
blog/
├── src/
│   ├── components/        ← Astro components (Header, Footer, MatrixRain, etc.)
│   ├── content/
│   │   └── blog/          ← Blog posts (Markdown/MDX files)
│   ├── layouts/
│   │   ├── BaseLayout.astro   ← Shared page shell (html/head/body/header/footer)
│   │   └── BlogPost.astro     ← Blog post layout (extends BaseLayout)
│   ├── pages/             ← Route pages (index, blog/, talks, about)
│   ├── styles/
│   │   └── global.css     ← All CSS variables, shared styles, dark/light themes
│   ├── consts.ts          ← Site-wide constants (title, description, author)
│   └── content.config.ts  ← Content collection schema (blog posts)
├── talks/                 ← Talk source files (presentation markdown + config)
│   ├── .reveal/           ← reveal-md theme customization (CSS, templates)
│   ├── reveal-md.json     ← reveal-md global configuration
│   ├── lightning/          ← Short talks (5–15 min)
│   └── standard/           ← Full-length talks (30–45 min)
├── scripts/
│   └── build-slides.mjs   ← Auto-discovers talks, builds slides, outputs manifest
├── public/                ← Static assets (copied as-is to dist/)
│   └── slides/            ← ⚠️ GENERATED — gitignored, built from talks/ source
├── astro.config.mjs       ← Astro config (site URL, MDX, sitemap, Shiki themes)
└── package.json           ← Scripts: dev, build (slides + astro), preview
```

---

## Tooling

| Tool                                             | Purpose                                        |
| ------------------------------------------------ | ---------------------------------------------- |
| [Astro](https://astro.build)                     | Static site generator                          |
| [reveal-md](https://github.com/webpro/reveal-md) | Builds reveal.js slides from Markdown          |
| [bun](https://bun.sh)                            | Package manager & runtime — use `bun install`, `bun run` |

### Key Commands

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `bun run dev`       | Start Astro dev server (no slides build)       |
| `bun run build`     | Build slides from source + build Astro site    |
| `bun run build:slides` | Build only the slides                       |
| `bun run preview`   | Preview the built site locally                 |

---

## Blog Posts

Blog posts live in `src/content/blog/` as Markdown (`.md`) or MDX (`.mdx`) files. Astro
auto-discovers them — no registration needed.

### Adding a New Post

Create a file in `src/content/blog/<slug>.md`. The filename becomes the URL slug
(`/blog/<slug>`).

### Frontmatter

Every post **must** include this frontmatter:

```yaml
---
title: "Post Title"
description: "A short description for SEO and post cards"
pubDate: "YYYY-MM-DD"
tags: ["tag1", "tag2"]
---
```

| Field         | Required | Description                                |
| ------------- | -------- | ------------------------------------------ |
| `title`       | ✅       | Post title                                 |
| `description` | ✅       | Short description (shown on cards and SEO) |
| `pubDate`     | ✅       | Publication date (ISO format)              |
| `updatedDate` | ❌       | Last updated date                          |
| `tags`        | ✅       | Array of topic tags                        |

### Content Schema

Defined in `src/content.config.ts`:

```typescript
z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
});
```

---

## Talks & Slides

Talk source files live in `talks/`. Slides are **built from source** during `bun run build` — the
generated `public/slides/` directory is gitignored and never committed.

### Adding a New Talk

1. **Create the talk folder** under the appropriate category:
   ```
   talks/<category>/<Talk Name>/
     presentation.md    ← Slide content (Markdown for reveal-md)
     meta.json          ← Metadata: { "slug": "my-talk", "tag": "Topic" }
     abstract.md        ← Talk abstract for CFPs, event pages, and reuse
   ```

2. **That's it.** The build script (`scripts/build-slides.mjs`) auto-discovers all
   `presentation.md` files, reads `meta.json` for metadata, builds the slides, and generates a
   `public/slides/talks.json` manifest. The talks page and home page read from this manifest
   automatically. `abstract.md` is source content for submissions and event pages; it is kept beside
   the presentation even though the build script does not consume it.

### Talk Categories

| Folder       | Description                              | Typical duration |
| ------------ | ---------------------------------------- | ---------------- |
| `lightning/` | Lightning talks — short, focused, punchy | 5–15 minutes     |
| `standard/`  | Standard talks — deeper, more thorough   | 30–45 minutes    |

### meta.json

Each talk directory **must** include a `meta.json`:

```json
{
  "slug": "my-talk",
  "tag": "Topic"
}
```

| Field  | Purpose                                               |
| ------ | ----------------------------------------------------- |
| `slug` | URL slug (used for `/slides/<slug>/`)                 |
| `tag`  | Topic badge shown on the talks page (e.g., "AI", "C#", ".NET") |

If `meta.json` is missing, the slug is auto-generated from the directory name (slugified).

### abstract.md

Every new talk directory **must** include an `abstract.md` file beside `presentation.md` and
`meta.json`. Use it for the CFP/event-page abstract and keep it aligned with the presentation.

Recommended format:

```markdown
# Talk Title

One to three concise paragraphs describing the talk, target audience, and what attendees will learn.
```

### Presentation Format

Presentations use [reveal-md](https://github.com/webpro/reveal-md) — same conventions as the talks
repo:

- YAML frontmatter with `title` field
- `---` separators between slides
- Fenced code blocks with language identifiers
- Mermaid diagrams via `<div class="mermaid">` tags
- Presenter notes via `Note:` keyword at the end of each slide

Global reveal-md config is in `talks/reveal-md.json`. Custom CSS and templates are in
`talks/.reveal/`.

### Build Pipeline

The `scripts/build-slides.mjs` script:

1. Scans `talks/` recursively for `presentation.md` files
2. Reads `meta.json` from each talk directory for slug and tag
3. Builds each talk with `reveal-md --static`
4. Deduplicates shared reveal.js assets (dist/, plugin/, css/) to `public/slides/` root
5. Patches HTML paths in each talk to reference shared assets via `../`
6. Outputs `public/slides/talks.json` manifest consumed by Astro pages

---

## Theming & Design

The site uses a terminal/hacker aesthetic with a matrix rain background, scanline overlay, and
monospace typography.

### Dark/Light Mode

- **CSS variables** for both themes are defined in `src/styles/global.css`
- Dark theme is the default (`:root` variables)
- Light theme activates via `[data-theme="light"]` on the `<html>` element
- Theme toggle (☀️/🌙) is in `Header.astro`
- Theme preference is persisted in `localStorage` and initialized before paint via an inline script
  in `BaseHead.astro` to prevent flash

### Key CSS Variables

Theme-aware variables (change between dark/light):
`--bg-deep`, `--bg-card`, `--bg-surface`, `--border`, `--text`, `--text-bright`, `--text-muted`,
`--accent-cyan`, `--accent-green`, `--accent-yellow`, `--accent-red`, `--tag-bg`, `--tag-border`,
`--matrix-bg`, `--matrix-fg`

### Shared Styles in global.css

The following utility classes are defined globally (do **not** redeclare in component styles):
- Terminal helpers: `.boot`, `.prompt`, `.cursor`, `.highlight`, `.muted`, `@keyframes blink`
- Section layout: `.section`, `.section-header`, `.icon`

### Code Syntax Highlighting

Astro uses Shiki with dual themes (`github-dark` / `github-light`). The `defaultColor` is `"dark"`.
Light mode switching is handled via CSS in `global.css`:
```css
[data-theme="light"] .astro-code span { color: var(--shiki-light) !important; }
```

### MatrixRain Component

The `MatrixRain.astro` canvas is `position: fixed` with `pointer-events: none` (critical — without
this, it intercepts all clicks). It reads `--matrix-bg` and `--matrix-fg` CSS variables for
theme-aware colors.

---

## Layouts

### BaseLayout.astro

Shared page shell used by all pages. Provides: `<!doctype html>`, `<head>` with `<BaseHead>`,
`<body>` with `<MatrixRain>`, `<Header>`, `<main>`, `<Footer>`.

Props: `title` (string), `description` (string).

All pages should use `<BaseLayout>` — do **not** duplicate the html/body/header/footer boilerplate.

### BlogPost.astro

Extends `BaseLayout` for blog post pages. Adds post header (title, date, tags), back link, and
prose styling.

---

## Pages

| Route    | File                    | Description                                 |
| -------- | ----------------------- | ------------------------------------------- |
| `/`      | `src/pages/index.astro` | Home — terminal boot, ASCII art, recent posts, talks |
| `/blog`  | `src/pages/blog/index.astro` | All posts listing                      |
| `/blog/<slug>` | `src/pages/blog/[...slug].astro` | Individual blog post          |
| `/talks` | `src/pages/talks.astro` | Slide decks + speaking history log          |
| `/about` | `src/pages/about.astro` | About page with external links              |
| `/rss.xml` | `src/pages/rss.xml.js` | RSS feed                                  |

### Talks Page Structure

- **Slide Decks** — grid of cards auto-populated from `public/slides/talks.json` manifest
- **Speaking Log** — compact monospace log of past talks (hardcoded in `talks.astro`)
- **CTA** — speaking invitation callout

### Home Page

- **Terminal boot sequence** — shows article count + talk count
- **ASCII art** — "BLOG .kaya.sk" figlet
- **Recent posts** — 5 most recent
- **Talks** — auto-populated from `public/slides/talks.json` manifest

---

## Important Technical Notes

- **Astro static output** — the site uses `output: "static"`. `Astro.redirect()` doesn't work; use
  meta-refresh for redirects if needed.
- **Astro scoped CSS + data-theme** — Astro scopes component CSS with `data-astro-cid-*` attributes.
  Selectors targeting `[data-theme]` on the root element must use `:global()` to prevent incorrect
  scoping (e.g., `:global([data-theme="light"]) .my-class`).
- **Slides are gitignored** — `public/slides/` is generated during build from `talks/` source.
  Never commit built slides. Always run `bun run build` to regenerate.
- **Site URL** is `https://kaya.sk` (configured in `astro.config.mjs`).
- **Dual licensing** — code is GPLv3 (`LICENSE`), content (blog posts + presentations) is CC BY 4.0
  (`LICENSE-CONTENT`). Do not mix licenses or add license headers to individual files.

---

## Step-by-Step Guides

### How to Add a New Blog Post

1. Create `src/content/blog/<slug>.md` where `<slug>` becomes the URL (e.g., `my-new-post.md` →
   `/blog/my-new-post`)
2. Add the required frontmatter:
   ```yaml
   ---
   title: "Post Title"
   description: "A short description for SEO and post cards"
   pubDate: "YYYY-MM-DD"
   tags: ["tag1", "tag2"]
   ---
   ```
3. Write the post content in Markdown below the frontmatter
4. Run `bun run build` to verify it compiles
5. Commit: `git add . && git commit -m "feat(blog): add post on <topic>"`

The post is **automatically** added to:
- The blog listing page (`/blog`)
- The home page (if it's one of the 5 most recent)
- The RSS feed (`/rss.xml`)
- The sitemap

No other files need to be modified.

### How to Add a New Presentation (with slides)

1. Choose the category: `lightning/` (5–15 min) or `standard/` (30–45 min)
2. Create the folder: `talks/<category>/<Talk Name>/`
3. Create `presentation.md` with reveal-md slide content:
   ```yaml
   ---
   title: Talk Title
   ---
   ```
   Use `---` to separate slides. See existing presentations for examples.
4. Create `meta.json`:
   ```json
   {
     "slug": "my-talk",
     "tag": "Topic"
   }
   ```
5. Create `abstract.md` in the same folder with the talk title and a concise CFP/event-page
   abstract.
6. Run `bun run build` to verify slides build correctly
7. Commit: `git add . && git commit -m "feat(talks): add <talk-name> presentation"`

The slides are **automatically** added to:
- The talks page (`/talks`) as a slide deck card
- The home page talks section
- Available at `/slides/<slug>/`

No other files need to be modified. The build script discovers talks, builds slides, and generates
the manifest that the pages consume.

### How to Add a Past Talk (speaking log entry, no slides)

1. Open `src/pages/talks.astro`
2. Add an entry to the `speakingLog` array (keep chronological order, newest first):
   ```js
   { date: "YYYY-MM", title: "Talk Title", venue: "Event Name", url: "https://..." },
   ```
   - `date`: Year and month in `YYYY-MM` format
   - `title`: The talk title
   - `venue`: Where you gave it (conference name, university, etc.)
   - `url`: Optional — link to event page. Omit the field entirely for talks without a link.
3. Run `bun run build` to verify
4. Commit: `git add . && git commit -m "feat(talks): add <talk-name> to speaking log"`

---

## Git Commits

All commits **must** follow the [Conventional Commits](https://www.conventionalcommits.org/)
specification.

### Format

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Allowed Types

| Type       | When to use                                        |
| ---------- | -------------------------------------------------- |
| `feat`     | A new post, talk, page, or feature                 |
| `fix`      | Bug fix (broken layout, incorrect content, etc.)   |
| `docs`     | Documentation-only changes (README, instructions)  |
| `style`    | Formatting, whitespace, CSS-only changes           |
| `refactor` | Code restructuring without behavior change         |
| `chore`    | Maintenance tasks, CI, tooling, dependencies       |

### Rules

- **Commits must be atomic** — each commit should contain exactly one logical change
- **Type is required** — never commit without a type prefix
- **Use lowercase** for type and description
- **Use imperative mood** in the description (e.g., "add", not "added" or "adds")
- **Scope is optional** but encouraged — use the relevant area (e.g., `feat(blog): add new post`,
  `feat(talks): add kubernetes talk`, `fix(theme): correct light mode contrast`)

### Examples

```
feat(blog): add post on structured logging in .NET
feat(talks): add agentic engineering presentation
fix(theme): correct code block colors in light mode
refactor: extract shared layout into BaseLayout
chore: update astro to v5.18
docs: update copilot instructions with talks pipeline
```
