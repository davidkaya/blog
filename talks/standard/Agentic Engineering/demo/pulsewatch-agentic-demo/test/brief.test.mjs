import assert from "node:assert/strict";
import test from "node:test";
import { buildIncidentBrief, formatBriefMarkdown } from "../src/brief.mjs";

test("builds a structured incident brief from fixtures", async () => {
  const brief = await buildIncidentBrief("INC-1042");

  assert.equal(brief.id, "INC-1042");
  assert.equal(brief.service, "payments-api");
  assert.equal(brief.riskAction, "page-service-owner");
  assert.ok(brief.timeline.length >= 3);
  assert.ok(brief.runbookExcerpt.length > 0);
});

test("formats incident brief markdown with required sections", async () => {
  const brief = await buildIncidentBrief("INC-1042");
  const markdown = formatBriefMarkdown(brief);

  assert.match(markdown, /^# INC-1042/m);
  assert.match(markdown, /^## Summary/m);
  assert.match(markdown, /^## Impact/m);
  assert.match(markdown, /^## Current status/m);
  assert.match(markdown, /^## Timeline/m);
});
