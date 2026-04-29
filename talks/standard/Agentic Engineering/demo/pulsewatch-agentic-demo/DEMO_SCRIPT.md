# Agentic Engineering Demo Script

Use PulseWatch as the live demo after the talk introduces the agentic engineering stack. The arc is:
weak prompt, stronger context, scoped tools, reusable workflow, deterministic gates, review.

## Setup

Open this folder as the workspace so the `.github/` and `.vscode/` customizations are discovered:

```powershell
code "talks\standard\Agentic Engineering\demo\pulsewatch-agentic-demo"
```

Run the baseline:

```powershell
npm test
npm run demo:summary
```

## Walkthrough

### 1. Context contract

Open `.github/copilot-instructions.md`.

Say: "This is the difference between a prompt and an engineered context surface. The agent gets the
goal, constraints, grounding, done criteria, and escalation rules before it starts improvising."

### 2. MCP as tool and context boundary

Open `.vscode/mcp.json` and `mcp-server/index.mjs`.

Prompt:

```text
Use the PulseWatch MCP tools to list active incidents and tell me which one needs escalation.
```

Point out that MCP exposes typed capabilities instead of dumping every file into the prompt.

### 3. Skill for repeatable workflow

Open `.github/skills/incident-briefing/SKILL.md`.

Prompt:

```text
/triage-incident INC-1042
```

Show how the skill loads the severity policy and customer update template only when relevant.

### 4. Scoped instructions for artifacts

Open `.github/instructions/status-copy.instructions.md` and
`docs/status-updates/example-customer-update.md`.

Prompt:

```text
Create a status update for INC-1042 in docs/status-updates/inc-1042-update.md.
```

Run:

```powershell
npm run check:brief
```

### 5. Agent implements a small backlog item

Open `docs/backlog/add-noisy-neighbor-detection.md`.

Prompt:

```text
/implement-backlog-item docs/backlog/add-noisy-neighbor-detection.md
```

Point out that the backlog item has the same context contract shape as the talk: goal, constraints,
grounding, done, and a validation command.

### 6. Custom reviewer agent

Prompt:

```text
Use the Reliability Reviewer agent to review the current changes.
```

Point out the tool restriction: the reviewer can read and search, but it cannot edit.

### 7. Hook as deterministic policy

Open `.github/hooks/protect-demo-fixtures.json` and `scripts/hooks/protect-demo-fixtures.mjs`.

Say: "Instructions guide behavior. Hooks enforce behavior. If the agent tries to edit fixtures or
runbooks without explicit approval, this policy can deny the tool call."

## Close

Tie the demo back to the stack:

- intent: backlog item and incident id
- context: instructions, runbooks, fixture data
- agent runtime: chat session
- tools: MCP, file edits, tests
- workspace: this isolated demo folder
- gates: tests, brief checker, hook policy, reviewer agent
- learning loop: update skills and instructions when the workflow fails
