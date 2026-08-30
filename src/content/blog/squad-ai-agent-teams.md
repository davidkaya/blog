---
title: "Squad: An AI Development Team That Lives in Your Repository"
description: "Squad turns GitHub Copilot into a team of persistent specialists, with routing, memory, decisions, and logs stored beside your code."
pubDate: "2026-08-30"
tags: ["AI", "agents", "GitHub Copilot"]
---

Most multi-agent demos hide what happens to agent decisions after the demo ends.

[Squad](https://github.com/bradygaster/squad) stores the answer in Git.

Squad is an open-source, experimental framework built around GitHub Copilot. You describe the work, and a coordinator routes it to specialists such as a frontend developer, backend developer, tester, lead, or documentation writer. Each agent gets its own context, charter, and project memory.

## Your AI team is a folder

Running `squad init` creates a `.squad/` directory in your repository:

```text
.squad/
├── team.md
├── routing.md
├── decisions.md
├── agents/
│   └── {name}/
│       ├── charter.md
│       └── history.md
├── skills/
└── log/
```

The roster, responsibilities, shared decisions, personal agent histories, and session logs are plain files. You can read them, edit them, diff them, and review changes in a pull request. Anyone who clones the repository can pick up the same team with the same accumulated context.

I like this model because agent behavior stops being hidden configuration. If the coordinator routes security work to the wrong specialist, inspect `routing.md`. If an old decision keeps influencing new work, inspect `decisions.md`. The state is beside the code it affects.

It also means `.squad/` deserves the same care as any other repository data. Agent memory can contain project details you did not intend to preserve. Squad includes commands for context cleanup and email scrubbing, but I would still review the folder before committing it.

## Separate contexts, shared decisions

Each specialist runs in its own context and reads only its own history plus the team's shared decisions. A background agent called Scribe merges proposed decisions into the shared record.

Giving one model five role prompts can produce five labels on the same reasoning. Squad gives each specialist a separate context window and leaves coordination to the coordinator.

The memory system has a few thoughtful details:

- Personal histories are summarized when they grow beyond roughly 12 KB.
- Older decisions move to an archive instead of consuming context forever.
- Reusable techniques can become skills shared by the whole team.
- `squad nap` compresses, prunes, and archives accumulated context.

Yes, the AI team has a nap command. More agent tools need honest names for garbage collection.

## Parallel work with a paper trail

The coordinator checks dependencies and launches independent work in parallel. A feature could send API work to a backend agent, UI work to a frontend agent, and test planning to a tester at the same time. Dependent work stays sequential, and the concurrency limit can be adjusted when cost matters.

Squad records decisions, orchestration activity, and session history so the human reviewer can reconstruct what happened. Parallel agents without shared records tend to produce conflicting assumptions. Squad makes the shared record part of the design.

## Ralph watches the backlog

Squad also includes Ralph, a work monitor for GitHub issues and pull requests. Ralph reads the team's routing rules, triages issues, watches CI and review status, and can dispatch Copilot sessions for actionable work.

The cautious mode is:

```bash
squad watch
```

That polls for work and performs triage. Adding `--execute` lets Ralph start agent sessions and move work through the queue.

I would not point alpha software at a production backlog with execution enabled on day one. Triage-only mode on a small repository is a much better way to see whether the routing rules match how the team really works.

## Trying it

The shortest setup from the project README is:

```bash
npm install -g @bradygaster/squad-cli
squad init --preset default
copilot --agent squad --yolo
```

The README uses `--yolo` because Squad makes many tool calls. That removes repeated approval prompts, so I would start in a disposable repository or a tightly controlled worktree and inspect the generated files first.

Squad is still alpha software, and its commands and behavior may change. It treats agent rosters, routing, memory, and decisions as repository artifacts rather than invisible state inside a chat product.

If I were testing it today, I would give a small team one bounded feature, keep execution manual, and review how `.squad/` changes after each session. The quality of those files will tell you more than a flashy multi-agent demo.

## References

- [Squad repository and quick start](https://github.com/bradygaster/squad)
- [Memory and knowledge](https://github.com/bradygaster/squad/blob/dev/docs/src/content/docs/concepts/memory-and-knowledge.md)
- [Parallel work and models](https://github.com/bradygaster/squad/blob/dev/docs/src/content/docs/concepts/parallel-work.md)
- [Ralph work monitor](https://github.com/bradygaster/squad/blob/dev/docs/src/content/docs/features/ralph.md)
