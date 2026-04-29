---
description: "Use when drafting customer incident updates, postmortems, or status page copy for PulseWatch incidents."
applyTo: "docs/status-updates/**/*.md"
---

# Status Copy Instructions

- Be specific about confirmed impact, current status, and next update.
- Do not claim a root cause unless an incident event or runbook explicitly confirms it.
- Avoid blame, certainty theater, and phrases such as "guarantee" or "no users are affected".
- Use this structure:
  - `## Summary`
  - `## Impact`
  - `## Current status`
  - `## Next update`
- Run `npm run check:brief` after editing customer-facing status updates.
