#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: node scripts/check-brief.mjs <brief.md>");
  process.exit(1);
}

const markdown = await readFile(filePath, "utf8");
const requiredHeadings = ["## Summary", "## Impact", "## Current status", "## Next update"];
const forbiddenPhrases = ["guarantee", "root cause is", "no users are affected"];

const missingHeadings = requiredHeadings.filter((heading) => !markdown.includes(heading));
const usedForbiddenPhrases = forbiddenPhrases.filter((phrase) => markdown.toLowerCase().includes(phrase));

if (missingHeadings.length > 0 || usedForbiddenPhrases.length > 0) {
  if (missingHeadings.length > 0) {
    console.error(`Missing headings: ${missingHeadings.join(", ")}`);
  }

  if (usedForbiddenPhrases.length > 0) {
    console.error(`Avoid unsupported phrases: ${usedForbiddenPhrases.join(", ")}`);
  }

  process.exit(1);
}

console.log(`Brief check passed: ${filePath}`);
