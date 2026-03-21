---
title: NVIDIA OpenShell
---

# NVIDIA OpenShell

### The sandbox AI agents should have had from day one

---

## Why this matters now

Modern agents can already:

- read your repo
- run shell commands
- install packages
- call external APIs
- carry credentials
- keep working long after you stop watching

Great for productivity.

Terrifying for blast radius.

---

## The core tension

For long-running agents, you usually want all three:

1. **Capability**
2. **Autonomy**
3. **Safety**

Most setups let you have only **two**.

If the agent is useful and autonomous, but unconstrained, you are trusting a very confident shell script with your secrets.

---

## OpenShell in one sentence

**OpenShell is an open-source runtime that lets agents run in isolated sandboxes with policy-enforced control over files, network access, processes, and inference routing.**

The big design move:

- put guardrails **outside** the agent
- make them **kernel- and runtime-enforced**
- keep policies **reviewable and updateable**

Think:

> the browser tab model, but for agents

---

## What sits in the middle

```mermaid
flowchart LR
    Agent["Agent<br/>Claude / Codex / Copilot / OpenClaw"] --> Sandbox["Sandbox"]
    Sandbox --> Proxy["Sandbox Proxy"]
    Proxy --> Policy["Policy Engine"]
    Proxy --> Inference["Privacy Router"]
    Policy --> External["Approved APIs"]
    Inference --> Models["Approved model backends"]
```

Core components:

- **Gateway**
- **Sandbox**
- **Policy Engine**
- **Privacy Router**

---

## Why this is more than container theater

OpenShell combines:

- **Landlock** for filesystem restrictions
- **seccomp** for dangerous syscall filtering
- **unprivileged identities** for agent processes
- **minimal outbound access** by default
- **REST method/path rules** for selected endpoints

It is not just:

> "please behave nicely, dear agent"

---

## The policy model is the clever bit

Static at sandbox creation:

- `filesystem_policy`
- `landlock`
- `process`

Hot-reloadable while running:

- `network_policies`

That means:

- disk boundaries stay stable
- network permissions can evolve as the agent hits denials
- policy becomes a real workflow, not a one-time guess

---

## What ships today

Supported / documented agent paths include:

- Claude Code
- Codex
- GitHub Copilot CLI
- OpenCode
- OpenClaw
- Ollama

Deployment modes:

- local
- remote over SSH
- cloud-style gateway registration

Extras:

- GPU passthrough exists, but is **experimental**

---

## Reality check

The README is blunt:

- **alpha software**
- effectively **single-player mode** today
- Docker is required
- Windows support is **experimental** via WSL 2 + Docker Desktop

Also fun:

- the control plane runs as **K3s inside a single Docker container**

This is real infrastructure, not a toy SDK.

---

## Why I think it matters

The interesting story is **not**:

> NVIDIA made another AI thing.

The interesting story is:

> somebody is building the control plane for autonomous agents.

If agents are going to touch real systems, the missing piece is not more swagger.

It is a trustworthy runtime boundary.

---

## Sources

- docs.nvidia.com/openshell/latest/
- github.com/NVIDIA/OpenShell
- developer.nvidia.com/blog/run-autonomous-self-evolving-agents-more-safely-with-nvidia-openshell/
