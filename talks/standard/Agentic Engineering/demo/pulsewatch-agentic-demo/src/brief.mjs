import { getIncident, getIncidentEvents, getRunbook } from "./incidentStore.mjs";
import { summarizeRisk } from "./severity.mjs";

function statusSentence(status) {
  switch (status) {
    case "investigating":
      return "We are investigating the cause and will share confirmed updates as we learn more.";
    case "mitigating":
      return "We have identified a likely cause and are applying mitigation.";
    case "resolved":
      return "The incident is resolved and we are monitoring for recurrence.";
    default:
      return `Current state is ${status}.`;
  }
}

function runbookExcerpt(runbook) {
  return runbook
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.replace(/^-+\s*/, ""))
    .filter((line) => line && !line.startsWith("#"))
    .slice(0, 3);
}

function customerUpdate(incident) {
  const nextUpdate =
    incident.nextUpdateDueMinutes > 0
      ? `We will provide the next update within ${incident.nextUpdateDueMinutes} minutes.`
      : "No further customer updates are planned unless the incident reopens.";

  return [
    `We are responding to ${incident.title.toLowerCase()} affecting ${incident.service}.`,
    `Impact: ${incident.impact}`,
    `Current status: ${statusSentence(incident.status)}`,
    `Next update: ${nextUpdate}`
  ];
}

export async function buildIncidentBrief(incidentId) {
  const incident = await getIncident(incidentId);
  if (!incident) {
    throw new Error(`Unknown incident: ${incidentId}`);
  }

  const [events, runbook] = await Promise.all([getIncidentEvents(incidentId), getRunbook(incident.service)]);
  const risk = summarizeRisk(incident);

  return {
    id: incident.id,
    title: incident.title,
    service: incident.service,
    severity: incident.severity,
    status: incident.status,
    owner: incident.owner,
    impact: incident.impact,
    riskAction: risk.action,
    riskReasons: risk.reasons,
    customerUpdate: customerUpdate(incident),
    timeline: events,
    runbookExcerpt: runbookExcerpt(runbook)
  };
}

export function formatBriefMarkdown(brief) {
  const timeline = brief.timeline
    .map((event) => `- ${event.time} - ${event.type}: ${event.description}`)
    .join("\n");
  const reasons = brief.riskReasons.map((reason) => `- ${reason}`).join("\n");
  const runbook = brief.runbookExcerpt.map((line) => `- ${line}`).join("\n");

  return `# ${brief.id}: ${brief.title}

## Summary

- Service: ${brief.service}
- Severity: ${brief.severity}
- Status: ${brief.status}
- Owner: ${brief.owner}
- Recommended action: ${brief.riskAction}

## Impact

${brief.impact}

## Current status

${brief.customerUpdate.join("\n\n")}

## Evidence

${reasons}

## Timeline

${timeline}

## Runbook hints

${runbook}
`;
}
