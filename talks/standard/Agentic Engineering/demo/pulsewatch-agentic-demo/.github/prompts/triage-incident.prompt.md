---
description: "Triage a PulseWatch incident using MCP context, runbooks, and the incident briefing skill."
argument-hint: "Incident id, for example INC-1042"
agent: "agent"
tools: ["pulsewatch/*", "read", "search"]
---

Triage the PulseWatch incident identified by the argument.

Use the PulseWatch MCP tools first:

1. Call `list_active_incidents` if the incident id is missing or ambiguous.
2. Call `get_incident_context` for the selected incident.
3. Call `lookup_runbook` for the affected service if the context needs operational guidance.

Then produce:

- confirmed facts
- assumptions, clearly labeled
- recommended next action
- customer-facing draft update
- validation or follow-up needed before publishing
