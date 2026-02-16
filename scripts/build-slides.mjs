#!/usr/bin/env node

/**
 * Builds reveal.js slides from source markdown in talks/.
 * Auto-discovers talks by scanning for presentation.md files.
 * Outputs deduplicated static files to public/slides/ and a manifest (talks.json).
 *
 * To add a new talk:
 *   1. Create a folder under talks/ with presentation.md
 *   2. Add a meta.json with { "slug": "my-talk", "tag": "Topic" }
 *   3. Run `bun run build` — it's picked up automatically
 */

import { execSync } from "child_process";
import {
  existsSync,
  cpSync,
  rmSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from "fs";
import { join, dirname, basename } from "path";

const TALKS_DIR = "talks";
const OUT_DIR = join("public", "slides");
const TMP_DIR = ".slides-tmp";
const SHARED_DIRS = ["dist", "plugin", "css", "_assets"];
const SHARED_PREFIXES = [
  "dist/",
  "plugin/",
  "css/",
  "_assets/",
  "favicon.ico",
  "mermaid/",
];

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function patchHtml(filePath) {
  let content = readFileSync(filePath, "utf-8");
  for (const prefix of SHARED_PREFIXES) {
    content = content.replaceAll(`"./${prefix}`, `"../${prefix}`);
  }
  writeFileSync(filePath, content);
}

/** Recursively find all presentation.md files under a directory */
function findPresentations(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findPresentations(full));
    } else if (entry === "presentation.md") {
      results.push(full);
    }
  }
  return results;
}

/** Slugify a directory name: lowercase, replace non-alphanum with hyphens */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Discover talks
const presentations = findPresentations(TALKS_DIR);
const talks = presentations.map((src) => {
  const talkDir = dirname(src);
  const title = basename(talkDir);
  const metaPath = join(talkDir, "meta.json");
  const meta = existsSync(metaPath)
    ? JSON.parse(readFileSync(metaPath, "utf-8"))
    : {};
  // Extract category from path: talks/<category>/<Talk Name>/presentation.md
  const relPath = src.replace(/\\/g, "/");
  const parts = relPath.split("/");
  const category = parts.length >= 3 ? parts[1] : "other";
  return {
    slug: meta.slug || slugify(title),
    tag: meta.tag || "",
    category,
    title,
    src,
  };
});

console.log(`Found ${talks.length} talk(s): ${talks.map((t) => t.slug).join(", ")}`);

// Clean
if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

// Build each talk with reveal-md (run from talks/ so reveal-md.json is found)
for (const talk of talks) {
  const dest = join("..", TMP_DIR, talk.slug);
  const src = talk.src.replace(/^talks[\\/]/, "");
  run(`cd talks && bunx reveal-md "${src}" --static "${dest}"`);
}

// Copy shared assets from first talk to root
const first = join(TMP_DIR, talks[0].slug);
for (const dir of SHARED_DIRS) {
  const src = join(first, dir);
  if (existsSync(src)) {
    cpSync(src, join(OUT_DIR, dir), { recursive: true });
  }
}
if (existsSync(join(first, "favicon.ico"))) {
  cpSync(join(first, "favicon.ico"), join(OUT_DIR, "favicon.ico"));
}

// Copy unique files per talk + patch paths
for (const talk of talks) {
  const src = join(TMP_DIR, talk.slug);
  const dest = join(OUT_DIR, talk.slug);
  mkdirSync(dest, { recursive: true });

  for (const file of ["index.html", "presentation.html"]) {
    const srcFile = join(src, file);
    if (existsSync(srcFile)) {
      cpSync(srcFile, join(dest, file));
      patchHtml(join(dest, file));
    }
  }
}

// Write manifest for Astro pages
const manifest = talks.map((t) => ({
  title: t.title,
  slug: t.slug,
  tag: t.tag,
  category: t.category,
  url: `/slides/${t.slug}/`,
}));
writeFileSync(join(OUT_DIR, "talks.json"), JSON.stringify(manifest, null, 2));

// Clean up
rmSync(TMP_DIR, { recursive: true });
console.log(`✓ Slides built and deduplicated in ${OUT_DIR}`);
