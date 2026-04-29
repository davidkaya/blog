# PulseWatch Agent Guidelines

PulseWatch is a small incident briefing demo for the Agentic Engineering talk. Treat it like a
production reliability tool even though the data is local fixture data.

## Context contract

- Goal: help an on-call engineer turn incident signals into a concise, evidence-backed update.
- Constraints: do not invent customer impact, root cause, owners, or timelines.
- Grounding: use `data/incidents.json`, `data/events.json`, service runbooks, tests, and MCP tool
  results as authoritative sources.
- Done: code changes pass `npm test`; customer-facing copy passes `npm run check:brief` when a
  status update is created.
- Escalation: ask before changing incident fixture data, runbooks, or hook policy.

## Build and test

- No install is required for the core demo; it uses Node.js built-ins.
- Run `npm test` after code changes.
- Run `npm run demo:brief` when changing incident brief formatting.
- Run `npm run check:brief` when changing files under `docs/status-updates/`.

## Engineering style

- Keep code dependency-free unless the demo explicitly needs a dependency.
- Prefer small pure functions in `src/` and keep the MCP server as a thin adapter.
- Fail loudly with clear errors when an incident id, service, or resource is unknown.
- Preserve the local, deterministic nature of the demo; do not call external services.
