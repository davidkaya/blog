---
title: "Agentic Engineering: Building Software With Agents, Not Just Prompts"
description: "Agentic engineering is the discipline of designing goals, context, tools, guardrails, and verification around AI agents so their work is reliable."
pubDate: "2026-04-29"
tags: ["AI", "engineering", "agents"]
---

AI coding agents are moving beyond autocomplete.

They can inspect repositories, edit multiple files, run builds, open branches, create pull requests, call tools through protocols like MCP, and keep working asynchronously in local or cloud environments. The interesting question is no longer only, "Can the model write code?" It is becoming, "Can our engineering system make agentic work reliable enough to trust?"

That is what I mean by **agentic engineering**.

I recently turned this idea into a talk called [Agentic Engineering](/slides/agentic/). The talk is not about writing cleverer prompts. Prompting is part of the story, but it is the smallest part. The bigger shift is that we are now designing systems where agents can explore, decide, act, validate, and hand work back to humans with evidence.

If we give an agent a vague goal, random context, dangerous tools, and no way to check its work, we should not be surprised when the result is unreliable. That is not only a model problem. It is a system design problem.

## The claim

Agentic engineering is the discipline of designing the system around the agent.

Not this:

- let the model do whatever
- vibe until it works
- replace engineers with bots

But this:

- clear goals
- curated context
- scoped tools
- sandboxed workspaces
- quality gates
- observable traces
- human decision points
- feedback loops

The engineer's job does not disappear. It moves up a level. Instead of typing every implementation detail, we design workflows where an agent can make progress safely, where a human can understand what happened, and where the team can improve the system over time.

That distinction matters because agents introduce a different kind of failure.

When a normal script fails, it usually fails where you wrote it. When an agent fails, it may fail because it had the wrong context, misunderstood a tool, optimized the wrong success criterion, skipped verification, or made an assumption that never became visible to the reviewer.

The output is not just code. The output is a trace of decisions.

## Vibe coding is useful, but it is not enough

Vibe coding is real, and it is useful. It is a great way to prototype, explore an idea, or get unstuck. The problem starts when we use the same style for production work.

In vibe coding, the input is often a prompt. The context is whatever happens to be in the chat. Validation is "looks right." If the result is wrong, we reprompt.

Agentic engineering is stricter. The input is a spec plus constraints. Context is engineered. Validation is tests, reviews, telemetry, screenshots, security scans, or some other evidence. Memory lives in artifacts and traces, not only in a chat transcript.

Most importantly, the human role is not to accept plausible output. The human still owns the decision.

Agents are already good at bounded coding tasks, repository exploration, test-driven bug fixes, mechanical refactors, documentation updates, migrations, and review passes with clear criteria. They still struggle when the hard part is vague product judgment, hidden business context, long-horizon consistency, ambiguous ownership, or cross-system side effects.

So the adoption strategy should start where agents are strong: bounded, inspectable, verifiable work.

## Context is now an engineering surface

Prompt engineering asks:

```text
How do I phrase this request?
```

Context engineering asks:

```text
What does the agent need to know, when, in what form,
with what tools, and with what feedback?
```

That second question has much more leverage.

A mediocre prompt with excellent grounding, clear constraints, and a verifier can outperform a clever prompt with chaotic context. The prompt is just one packet in a larger system.

For serious work, I like to define a small context contract before the agent starts:

```yaml
goal: what outcome matters?
constraints: what must not change?
grounding: what sources are authoritative?
done: what evidence proves completion?
escalation: when should the agent stop and ask?
```

This contract can live in an issue template, agent instructions, a skill, or a custom agent profile. It does not need to be heavy. Even a short version prevents the agent from inventing the rules as it goes.

Good context also has provenance. A user requirement is not the same as a codebase fact. A codebase fact is not the same as an inferred assumption. A model opinion is not the same as external documentation.

When those get mixed together, guesses become requirements by accident.

That is why I prefer artifacts over chat sludge:

- product intent belongs in an issue brief or PRD
- technical target belongs in a spec
- architecture belongs in a design doc or diagram
- implementation belongs in a file-level plan
- validation belongs in a test matrix
- learning belongs in a retrospective or rubric

More context is not automatically better. Giant instruction files, stale architecture notes, vague "follow best practices" rules, and hidden requirements in human memory can all make the system worse. The right question is not, "Can I add this to context?" It is, "Does this context earn its place?"

## Start simple and earn autonomy

The best guidance I have seen across serious agent systems is surprisingly consistent: use the simplest system that meets the reliability target.

Often the order looks like this:

1. One strong model call
2. Retrieval or examples
3. Tool use
4. Fixed workflow
5. Agent loop
6. Multi-agent system

In that order.

There is a temptation to jump straight to autonomous multi-agent systems because they sound impressive. But many reliable systems are much simpler. Sometimes one strong model call is enough. Sometimes you add retrieval. Sometimes a fixed workflow beats full autonomy because the steps are known and the gates are clear.

Workflows are underrated. A prompt chain can draft, gate, expand, and finalize. A routing workflow can classify work into bug, feature, docs, or security paths. An evaluator-optimizer loop can implement, test, review, fix, and test again.

Use workflows when the steps are known, quality criteria are clear, intermediate checks improve output, and routing can be tested. Save dynamic autonomy for the parts where the path really cannot be known upfront.

Multi-agent systems are especially easy to overuse.

The common failure mode is distributed unshared context: Agent A makes one assumption, Agent B makes the opposite assumption, and Agent C tries to merge both. By the time the human sees the result, the conflict is embedded in the work.

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

The stronger version creates a feedback loop. The agent has to reproduce the problem, make the change, run a targeted check, and then run a broader check. The reviewer gets evidence instead of a plausible diff.

This pattern applies beyond tests. A verifier can be a screenshot, linter, typecheck, build, security scan, benchmark, telemetry query, or review checklist. The important thing is that completion is proven by evidence, not asserted by the agent.

Quality gates should block, escalate, or explicitly record risk. A gate that only produces vibes is decoration.

Useful gates include:

- spec completeness
- architecture or threat review
- test coverage matrix
- lint, typecheck, and build
- code review
- security scan
- rollout metrics
- retrospective score

This is where agentic engineering starts to look like normal engineering again: clear criteria, automated checks where possible, human judgment where necessary, and explicit ownership of exceptions.

## Design the runtime, not only the prompt

Agents need room to act. They also need boundaries.

That means branches, worktrees, sandboxes, controlled network access, scoped credentials, reproducible dependencies, and clear cleanup rules. The agent should be able to make progress without writing into shared state or using credentials it does not need.

The runtime answers practical questions:

- Who owns the loop?
- Where does state live?
- Where is the trace?
- Which tools can be called?
- Which operations need human approval?
- What happens after failure or interruption?

Tool design matters here too. A model sees tools through their interface: name, description, schema, inputs, outputs, and errors. Good tools are small, typed, well documented, hard to misuse, explicit about side effects, and noisy when they fail.

Two standards matter right now:

```text
MCP = agent -> tool/context
A2A = agent -> agent
```

MCP is the connector shape between an agent and tools or context. A2A is emerging for agent-to-agent collaboration. Protocols do not remove the need for engineering judgment, but they make it easier to build systems where tools, context, and agents are not one-off integrations every time.

Safety has to be layered. Instructions matter, but instructions are not enough. Add policy, permissions, sandboxing, tool constraints, validation, human review, and audit logs. Put guardrails outside the model, not only inside the prompt.

## No trace, no trust

Agentic systems need observability.

When an agent produces an output, you should be able to reconstruct what it read, what it decided, which tools it called, what failed, what was retried, where a human intervened, what it cost, and whether the result actually improved anything after it shipped.

That sounds like distributed systems because it is close to distributed systems. We would not run a serious distributed system with no logs, traces, or metrics. Agentic systems need the same mindset.

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

The useful move is to fix the pipeline, not only the one output. If the agent repeatedly misses tests, improve the verifier. If it drifts in scope, improve constraints. If it fabricates paths, improve repository exploration. If reviews are shallow, change the review rubric.

The teams that get good at this will not be the teams with the longest prompts. They will be the teams with the best learning loop.

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

I would avoid starting with ambiguous product strategy, risky authentication changes, broad rewrites, multi-repo releases, or compliance-sensitive automation. Not because agents can never help with difficult work, but because early adoption should build trust. Start where the feedback loop is short and the failure cost is controlled.

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

## What humans still own

The optimistic version of this shift is not that engineers become less important. It is that engineering judgment becomes more important.

Agents can reduce the time we spend typing boilerplate, searching manually, making routine edits, and writing first drafts. But humans still need to define intent, design context, shape tools, set gates, review evidence, make trade-offs, and improve the system.

Some things should stay accountable to humans:

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

## The core lesson

Agentic engineering is not about trusting agents more.

It is about building systems where agents can be useful without requiring blind trust.

That means context engineering is a main leverage point. Workflows beat autonomy until autonomy is needed. Multi-agent systems need shared decisions. Verification is the difference between a demo and a production workflow. The best teams improve the pipeline, not just the prompt.

The practical question I keep coming back to is simple:

**What would you let an agent ship?**

Pick one task in your own work that you might delegate tomorrow. Then ask what context the agent would need, what tools it should have, what boundaries you would put around it, and what evidence you would require before accepting the result.

That is where agentic engineering starts: with the next task, the next instruction, the next test, and the next review where you ask for evidence instead of just a plausible diff.

## References

- [Agentic Engineering slides](/slides/agentic/) — the talk this post is based on
- [Model Context Protocol](https://modelcontextprotocol.io/) — an open standard for connecting agents to tools, systems, and context
- [Agent2Agent Protocol](https://github.com/google-a2a/A2A) — an open protocol for agent-to-agent communication and coordination
- [Anthropic: Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — practical patterns for workflows, agents, tools, and multi-agent systems
- [NVIDIA OpenShell](https://docs.nvidia.com/openshell/latest/about/overview.html) — a sandboxed runtime for autonomous agents with policy-based filesystem and network controls
