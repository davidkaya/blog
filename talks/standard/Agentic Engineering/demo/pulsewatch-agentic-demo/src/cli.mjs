#!/usr/bin/env node

import { buildIncidentBrief, formatBriefMarkdown } from "./brief.mjs";
import { listIncidents } from "./incidentStore.mjs";
import { summarizeRisk } from "./severity.mjs";

async function printSummary() {
  const incidents = await listIncidents();

  for (const incident of incidents) {
    const risk = summarizeRisk(incident);
    console.log(`${incident.id} ${incident.severity} ${incident.status} ${incident.service} -> ${risk.action}`);
  }
}

async function printBrief(incidentId) {
  const brief = await buildIncidentBrief(incidentId);
  console.log(formatBriefMarkdown(brief));
}

async function main() {
  const [command = "summary", argument] = process.argv.slice(2);

  if (command === "summary") {
    await printSummary();
    return;
  }

  if (command === "brief") {
    if (!argument) {
      throw new Error("Usage: node src/cli.mjs brief <incident-id>");
    }

    await printBrief(argument);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
