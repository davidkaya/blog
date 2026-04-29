# PulseWatch Agentic Demo

PulseWatch is a small incident briefing project for the Agentic Engineering talk. It is designed to
show how an agent improves when it has a context contract, project instructions, file-specific
instructions, reusable prompts, a skill, a custom reviewer agent, hooks, tests, and a local MCP
server.

Open this folder directly in VS Code:

```powershell
code "talks\standard\Agentic Engineering\demo\pulsewatch-agentic-demo"
```

## What to show

| Surface | File or command | What it demonstrates |
| --- | --- | --- |
| Project instructions | `.github/copilot-instructions.md` | Always-on context contract and quality gates |
| File instructions | `.github/instructions/*.instructions.md` | Scoped guidance for Node code and status copy |
| Skill | `.github/skills/incident-briefing/SKILL.md` | On-demand incident briefing workflow with assets |
| Prompt | `.github/prompts/triage-incident.prompt.md` | Repeatable slash-command task |
| Custom agent | `.github/agents/reliability-reviewer.agent.md` | Read-only review role with narrow tools |
| Hook | `.github/hooks/protect-demo-fixtures.json` | Deterministic guardrail for fixture edits |
| MCP | `.vscode/mcp.json`, `mcp-server/index.mjs` | Local tools and resources exposed to the agent |

## Commands

No package install is required for the core demo.

```powershell
npm test
npm run demo:summary
npm run demo:brief
npm run check:brief
npm run mcp
```

## Suggested walkthrough

1. Show the context contract in `.github/copilot-instructions.md`.
2. Show `.vscode/mcp.json`, then ask the agent to list active incidents with the PulseWatch MCP
   tools.
3. Run `/triage-incident INC-1042` and point out the skill, runbook, and MCP grounding.
4. Ask the agent to implement `docs/backlog/add-noisy-neighbor-detection.md` with
   `/implement-backlog-item`.
5. Ask the Reliability Reviewer custom agent to review the change.
6. Show the hook policy that protects fixture edits unless the prompt explicitly allows them.

## Good live prompts

```text
Use the PulseWatch MCP tools to list active incidents and tell me which one needs escalation.
```

```text
/triage-incident INC-1042
```

```text
/implement-backlog-item docs/backlog/add-noisy-neighbor-detection.md
```

```text
Use the Reliability Reviewer agent to review the current changes.
```
