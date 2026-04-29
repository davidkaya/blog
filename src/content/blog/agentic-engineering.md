---
title: "Agentic Engineering: Building Reliable Software With AI Agents"
description: "Agentic engineering is the discipline of designing goals, context, tools, guardrails, and verification around AI agents so their work is reliable."
pubDate: "2026-04-29"
tags: ["AI", "engineering", "agents"]
---

AI coding agents now do much more than autocomplete. They can inspect repositories, edit multiple files, run builds, create branches and pull requests, call tools through protocols like MCP, and keep working asynchronously in local or cloud environments.

The engineering challenge is making that work reliable enough to trust. I call the discipline around that challenge agentic engineering.

I recently turned the idea into a talk called [Agentic Engineering](/slides/agentic/). Prompting is part of the story, but the system around the prompt matters more. We need to design how agents explore, decide, act, validate, and hand work back to humans with evidence.

Give an agent a vague goal, random context, dangerous tools, and no way to check its work, and the result will be unreliable. Better model output alone will not fix a badly designed system.

## Design the system around the agent

Agentic engineering combines:

- clear goals
- curated context
- scoped tools
- sandboxed workspaces
- quality gates
- observable traces
- human decision points
- feedback loops

The engineer's job moves up a level. Instead of typing every implementation detail, we design workflows where an agent can make progress safely, a human can understand what happened, and the team can improve the system over time.

When a normal script fails, it usually fails where you wrote it. When an agent fails, it may fail because it had the wrong context, misunderstood a tool, optimized the wrong success criterion, skipped verification, or made an assumption that never became visible to the reviewer.

Code is only part of the output. The decision trace matters too.

## Vibe coding has limits

Vibe coding is useful for prototyping, exploring an idea, or getting unstuck. Problems start when we use the same style for production work.

A vibe-coding session often starts with a prompt, uses whatever context happens to be in the chat, and treats "looks right" as validation. If the result is wrong, we reprompt.

Production work needs a specification and constraints. Context should be selected deliberately. Tests, reviews, telemetry, screenshots, security scans, or other evidence should prove that the work is complete. Durable memory belongs in artifacts and traces rather than only in a chat transcript.

The human still owns the decision and should not accept output merely because it looks plausible.

Agents are already good at bounded coding tasks, repository exploration, test-driven bug fixes, mechanical refactors, documentation updates, migrations, and review passes with clear criteria. They still struggle when the hard part is vague product judgment, hidden business context, long-horizon consistency, ambiguous ownership, or cross-system side effects.

Adoption should start with bounded, inspectable, and verifiable work.

## Context is an engineering surface

Prompt engineering focuses on the wording of a request:

```text
How do I phrase this request?
```

Context engineering covers the wider system:

```text
What does the agent need to know, when, in what form,
with what tools, and with what feedback?
```

A mediocre prompt with excellent grounding, clear constraints, and a verifier can outperform a clever prompt surrounded by chaotic context. The prompt is one part of a larger system.

For serious work, I like to define a small context contract before the agent starts:

```yaml
goal: what outcome matters?
constraints: what must not change?
grounding: what sources are authoritative?
done: what evidence proves completion?
escalation: when should the agent stop and ask?
```

This contract can live in an issue template, agent instructions, a skill, or a custom agent profile. It does not need to be heavy. Even a short version prevents the agent from inventing rules as it goes.

Good context also has provenance. User requirements, codebase facts, inferred assumptions, model opinions, and external documentation each carry different authority.

Mix them together, and guesses become requirements by accident. I prefer to keep durable context in artifacts instead of chat sludge:

- product intent belongs in an issue brief or PRD
- technical target belongs in a spec
- architecture belongs in a design doc or diagram
- implementation belongs in a file-level plan
- validation belongs in a test matrix
- learning belongs in a retrospective or rubric

More context can make the system worse. Giant instruction files, stale architecture notes, vague "follow best practices" rules, and hidden requirements in human memory all add noise. Before adding context, ask whether it earns its place.

## Earn autonomy

My default progression is:

1. One strong model call
2. Retrieval or examples
3. Tool use
4. Fixed workflow
5. Agent loop
6. Multi-agent system

Start at the top and add complexity only when the simpler approach cannot meet the reliability target. One strong model call may be enough. The next task may need retrieval. A fixed workflow often beats full autonomy when the steps are known and the gates are clear.

Workflows are underrated. A prompt chain can draft, gate, expand, and finalize. A routing workflow can classify work into bug, feature, docs, or security paths. An evaluator-optimizer loop can implement, test, review, fix, and test again.

Use workflows when the steps are known, quality criteria are clear, intermediate checks improve output, and routing can be tested. Save dynamic autonomy for the parts where the path really cannot be known upfront.

Multi-agent systems are easy to overuse. A common failure mode is distributed, unshared context: Agent A makes one assumption, Agent B makes the opposite assumption, and Agent C tries to merge both. By the time a human sees the result, the conflict is embedded in the work.

Safer uses for multiple agents include independent research, bounded specialist tasks, review from different perspectives, and generating options. Be much more careful with parallel code edits, architecture decisions, and shared mutable state.

## Give the agent a verifier

One of the simplest improvements is to give the agent a way to check its own work.

Weak instruction:

```text
fix the bug
```

Stronger instruction:

```text
write a failing test that reproduces the bug,
fix the root cause, run the targeted test,
then run the package test suite
```

The stronger version creates a feedback loop. The agent has to reproduce the problem, make the change, run a targeted check, and then run a broader check. The reviewer gets evidence rather than a plausible diff.

A verifier can also be a screenshot, linter, typecheck, build, security scan, benchmark, telemetry query, or review checklist. Require evidence of completion instead of relying on the agent's claim.

Quality gates should block, escalate, or record risk explicitly. A gate that only produces vibes is decoration.

Useful gates include:

- spec completeness
- architecture or threat review
- test coverage matrix
- lint, typecheck, and build
- code review
- security scan
- rollout metrics
- retrospective score

This is normal engineering: clear criteria, automated checks where possible, human judgment where necessary, and explicit ownership of exceptions.

## Design the runtime boundaries

Agents need room to act within clear boundaries.

That means branches, worktrees, sandboxes, controlled network access, scoped credentials, reproducible dependencies, and clear cleanup rules. The agent should be able to make progress without writing into shared state or using credentials it does not need.

The runtime answers practical questions:

- Who owns the loop?
- Where does state live?
- Where is the trace?
- Which tools can be called?
- Which operations need human approval?
- What happens after failure or interruption?

Tool design matters here too. A model sees tools through their interface: name, description, schema, inputs, outputs, and errors. Good tools are small, typed, well documented, hard to misuse, explicit about side effects, and noisy when they fail.

Two current standards cover different connections:

```text
MCP = agent -> tool/context
A2A = agent -> agent
```

MCP connects an agent to tools or context. A2A is emerging for agent-to-agent collaboration. These protocols make it easier to connect tools, context, and agents without building a one-off integration every time, but engineers still have to design the system around them.

Safety has to be layered. Instructions are one layer; policy, permissions, sandboxing, tool constraints, validation, human review, and audit logs provide the rest. Put guardrails around the model as well as in the prompt.

## Make the work observable

Agentic systems need observability.

When an agent produces an output, you should be able to reconstruct what it read, what it decided, which tools it called, what failed, what it retried, where a human intervened, what it cost, and whether the result improved anything after it shipped.

Agentic systems resemble distributed systems. We would not run a serious distributed system without logs, traces, or metrics. Agents need the same visibility.

Traditional CI asks:

```text
does this code still work?
```

Agent evals ask:

```text
does this agent workflow still produce good work?
```

You can score runs on accuracy, completeness, evidence, maintainability, acceleration, and safety. You can also track practical outcomes:

- cycle time to reviewed pull request
- defect rate after merge
- review iterations
- human interruption rate
- cost per accepted change
- tasks with reproducible evidence

Fix recurring failures in the pipeline. If the agent repeatedly misses tests, improve the verifier. If it drifts in scope, improve the constraints. If it fabricates paths, improve repository exploration. If reviews are shallow, change the review rubric.

## A practical adoption playbook

If I were introducing agentic engineering to a team, I would start with tasks that are bounded and verifiable:

- documentation updates
- test generation for known behavior
- small bug fixes with repro steps
- mechanical migrations
- dependency update pull requests
- codebase explanations
- issue triage
- review checklists

I would avoid starting with ambiguous product strategy, risky authentication changes, broad rewrites, multi-repo releases, or compliance-sensitive automation. Agents may help with those tasks later. Early adoption should build trust where the feedback loop is short and the cost of failure is controlled.

Then I would improve task intake. Every serious task should include something like this:

```yaml
goal: ...
non_goals: ...
authoritative_sources: [...]
constraints: [...]
validation: [...]
human_checkpoints: [...]
```

Use persistent instructions for repo commands, style rules, and known gotchas. Use skills for repeatable procedures, templates, scripts, and examples. Use custom agents for narrow roles with explicit tools and escalation rules.

Do not put everything into one giant memory. Load the right knowledge at the right time.

## Humans still own the outcome

Engineering judgment becomes more important as agents take on more work.

Agents can reduce the time we spend typing boilerplate, searching manually, making routine edits, and writing first drafts. Humans still need to define intent, design context, shape tools, set gates, review evidence, make trade-offs, and improve the system.

Humans should remain accountable for:

- product strategy
- user empathy
- security posture
- architecture trade-offs
- irreversible operations
- legal and compliance decisions
- incident command
- final ownership of shipped code

Agents can provide options and evidence. They should not become the accountability sink.

If something goes wrong in production, "the agent decided" is not an acceptable root cause. The team decided to use the agent, the team accepted the output, and the team owns the result.

## Start with one task

Pick one task in your own work that you might delegate tomorrow. Decide what context the agent needs, which tools it should have, where it must stop, and what evidence you will require before accepting the result.

## References

- [Agentic Engineering slides](/slides/agentic/): the talk this post is based on
- [Model Context Protocol](https://modelcontextprotocol.io/): an open standard for connecting agents to tools, systems, and context
- [Agent2Agent Protocol](https://github.com/google-a2a/A2A): an open protocol for agent-to-agent communication and coordination
- [Anthropic: Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents): practical patterns for workflows, agents, tools, and multi-agent systems
- [NVIDIA OpenShell](https://docs.nvidia.com/openshell/latest/about/overview.html): a sandboxed runtime for autonomous agents with policy-based filesystem and network controls
