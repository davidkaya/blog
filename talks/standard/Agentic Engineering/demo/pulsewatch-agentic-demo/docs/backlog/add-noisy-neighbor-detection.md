# Backlog: add noisy neighbor detection

## Goal

When checkout-web p95 latency is high but order creation remains healthy, PulseWatch should recommend
`watch-cache-rollout` instead of the generic `watch` action.

## Constraints

- Do not change incident fixture data.
- Keep the MCP server as a thin adapter; implement behavior in `src/`.
- Add or update tests.

## Grounding

- `data/incidents.json` contains `INC-1043`, a checkout-web latency incident.
- `docs/runbooks/checkout-web.md` explains cache hit rate and order creation checks.
- Existing risk logic lives in `src/severity.mjs`.

## Done

- `INC-1043` receives `watch-cache-rollout`.
- Existing escalation behavior for `INC-1042` and resolved incidents stays unchanged.
- `npm test` passes.

## Demo prompt

```text
/implement-backlog-item docs/backlog/add-noisy-neighbor-detection.md
```
