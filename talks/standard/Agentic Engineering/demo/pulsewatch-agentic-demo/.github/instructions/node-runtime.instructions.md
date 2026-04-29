---
description: "Use when editing PulseWatch Node.js source, CLI commands, tests, or the local MCP server. Covers deterministic runtime and validation rules."
applyTo: ["src/**/*.mjs", "mcp-server/**/*.mjs", "test/**/*.mjs", "scripts/**/*.mjs"]
---

# Node Runtime Instructions

- Use only Node.js built-in modules unless the task explicitly asks for a dependency.
- Keep `mcp-server/index.mjs` as an adapter over functions in `src/`; do not duplicate business
  logic in the MCP layer.
- For new behavior, add or update `node:test` coverage.
- For user-visible command failures, throw clear errors and let the CLI set a non-zero exit code.
- Do not write to fixture files from runtime code.
