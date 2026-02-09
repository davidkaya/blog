---
title: "What should you, as a developer, install once you get a MacBook?"
description: "More developers around me have started getting MacBooks, so I compiled a list of the tools that make my work easier."
pubDate: 2020-05-05
tags: ["macOS", "tools", "productivity"]
---

More developers around me, both friends and colleagues, have started getting MacBooks (finally). They keep asking me questions such as:

- Which macOS tools make me more productive?
- Are there tools for managing multiple versions of an SDK?
- What did you use to open that application?
- What is the easiest way to install tools on macOS?
- What was that shiny terminal that you had open?

These answers are easy to find when you know the exact name of the tool you need. The harder part is discovering tools you do not know exist, because you do not know what to search for.

I decided to compile a list of tools that make my life easier. This is a personal list, so not every tool will make everyone else's life easier.

I will not cover every tool in detail. If people ask, I can write separate posts about individual tools.

## Terminal

Developers spend a lot of time in the terminal. I prefer using something other than the default Terminal app, so that is where this list starts.

[iTerm2](https://iterm2.com/) is an open-source terminal written in Objective-C. It is the original Terminal on steroids. iTerm2 supports many features, all listed on its [website](https://iterm2.com/features.html). The ones I care about most are customization, split panes, autocomplete, and triggers.

## Package Manager

When installing a command-line tool or an app on macOS, you will often find a `brew install [your command line tool]` command in its documentation. That command comes from **Homebrew**.

[Homebrew](https://brew.sh/) is a package manager for macOS. I consider it a must-have for everyone using macOS.

## Z Shell

The Z shell, usually called Zsh, is a Unix shell with useful features for interactive work:

- Automatic **cd**: Type the name of a directory to move into it.
- Spelling correction
- Path expansion: `/e/s/c` expands to `/etc/ssl/certs`.
- Plugin and theme support

With Homebrew, installation takes one command:

```bash
brew install zsh
```

## Oh My Zsh

If you use Zsh, Oh My Zsh is a must. It manages your Zsh configuration and supports hundreds of plugins and themes. Install it with:

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

For more details, visit the Oh My Zsh [GitHub page](https://github.com/ohmyzsh/ohmyzsh).

## Visual Studio Code

Visual Studio Code is Microsoft's [open-source](https://github.com/microsoft/vscode) code editor, with built-in IntelliSense, debugging, Git integration, and an extension marketplace. You can use VS Code for almost any programming language or as a normal text editor. I wrote this blog post in VS Code using Markdown.

## Alfred

[Alfred](https://www.alfredapp.com/) is a productivity app for macOS. If you only use Spotlight (`CMD + Space`), you do not know what you are missing. Alfred is an advanced Spotlight: it improves search, runs custom workflows, keeps your clipboard history, and can execute shell commands directly.

To unlock everything, you need a paid license. It is worth every penny.
