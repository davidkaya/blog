import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { basename, dirname, join } from "path";

export const TALKS_DIR = "talks";

/** Recursively find all presentation.md files under a directory. */
export function findPresentations(dir = TALKS_DIR) {
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

/** Slugify a directory name: lowercase, replace non-alphanum with hyphens. */
export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function discoverTalks(talksDir = TALKS_DIR) {
  return findPresentations(talksDir).map((src) => {
    const talkDir = dirname(src);
    const title = basename(talkDir);
    const metaPath = join(talkDir, "meta.json");
    const meta = existsSync(metaPath)
      ? JSON.parse(readFileSync(metaPath, "utf-8"))
      : {};
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
}
