---
name: incident-briefing
description: "Use when creating PulseWatch incident briefs, customer status updates, postmortems, or on-call handoff notes from incident data, MCP tools, and runbooks."
argument-hint: "Incident id, for example INC-1042"
---

# Incident Briefing

Use this skill to turn PulseWatch incident context into a concise, evidence-backed update.

## Procedure

1. Gather incident context from the PulseWatch MCP server:
   - `list_active_incidents` when the incident id is unknown
   - `get_incident_context` for the selected incident
   - `lookup_runbook` for the affected service
2. Read [severity policy](./references/severity-policy.md) before recommending escalation.
3. Draft the update with [customer update template](./assets/customer-update-template.md).
4. Separate confirmed facts from assumptions.
5. If writing a status update file, place it under `docs/status-updates/` and run
   `npm run check:brief`.

## Rules

- Do not invent root cause, customer count, mitigation status, or next-update timing.
- Prefer "we are investigating" over unsupported certainty.
- Name the validation command that should be run before publishing.
- Ask before changing incident fixtures, runbooks, or hook policy.
