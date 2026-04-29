---
description: "Implement a small PulseWatch backlog item with tests and a concise evidence summary."
argument-hint: "Path to backlog item, for example docs/backlog/add-noisy-neighbor-detection.md"
agent: "agent"
tools: ["read", "search", "edit", "execute"]
---

Implement the PulseWatch backlog item referenced by the argument.

Follow the workspace instructions and the backlog file as the source of truth. Keep the change small
and deterministic.

Before finishing:

- add or update `node:test` coverage
- run `npm test`
- run `npm run demo:brief` if incident brief output changes
- summarize the behavior change and the evidence used
