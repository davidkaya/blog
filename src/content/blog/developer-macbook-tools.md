---
title: "What should you, as a developer, install once you get a MacBook?"
description: "More and more developers around me started getting themselves a MacBook. I decided to compile a list of tools that make my life easier."
pubDate: 2020-05-05
tags: ["macOS", "tools", "productivity"]
---

More and more developers around me (friends or colleagues) started getting themselves a MacBook (finally). I started getting more and more questions like:

- What tools for macOS improve my effectivity?
- Are there tools to manage multiple versions of some SDKs?
- What is that tool that you used to open the application?
- How to effectively install tools on macOS?
- What was that shiny terminal that you had open?

I realized that it is actually not that easy to find all those answers without someone telling them to you. It might be easy to find an answer to your question if you specifically know what you are looking for, however often it happens that you might not even know that there are such tools, so you don't even search for them.

I decided to compile a list of tools that make my life easier. Disclaimer: I will mention tools that make my life easier, that does not necessarily mean that it will make the life of everyone easier.

I won't deep dive into individual tools. If there will be requests, I will write separate blog posts for individual tools.

## Terminal

Developers spend a lot of time in the Terminal. The default terminal with the default shell is not developer-friendly. We will start with the terminal itself.

[iTerm2](https://iterm2.com/) is an open-source terminal written in Objective-C. Basically it is like the original Terminal but on steroids. There is a lot of things that iTerm2 support, if you want to see all the feature check out following [website](https://iterm2.com/features.html). What I would highlight is: customizability, split panes, autocomplete and triggers.

## Package Manager

If you ever need to install a command line tool (or even an app) on macOS, you will for sure find a `brew install [your command line tool]` command in the installation guide for the tool you need. That is **homebrew**.

[Homebrew](https://brew.sh/) is a package manager for macOS. I would consider this a must-have for everyone using macOS.

## Z Shell

The Z shell is a unix shell that is built on top of **bash**. Why should you use it over bash?

- Automatic **cd** - you just have to type the name of the directory where you want to change directory to
- Spelling correction
- Path expansion: "/e/s/c" expands to "/etc/ssl/certs"
- Plugin and theme support

Installation is super simple (if you have Homebrew)

```bash
brew install zsh
```

## Oh My Zsh

If you use Z shell, Oh My Zsh is a must. It manages Zsh configuration and makes your life a lot easier. It supports hundreds of plugins and themes. Installation is again super easy, just run following command

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

If you want to know more about Oh My Zsh, visit their [Github page](https://github.com/ohmyzsh/ohmyzsh).

## Visual Studio Code

I think I don't have to introduce Visual Studio Code to anyone. It is Microsoft's [open source](https://github.com/microsoft/vscode) code editor. It has built-in IntelliSense, Debugging, Git and an extension marketplace. With VS Code, you can develop apps in literally any language you could think of. You can even use it as a normal text editor, even this blog post was written in VS Code in markdown.

## Alfred

[Alfred](https://www.alfredapp.com/) is a productivity app for macOS. If you use Spotlight in macOS (CMD + space), you don't know what you are missing. It is basically a advanced Spotlight. Alfred powers up your search, you can create your own workflows which are executed using your custom commands, keeps your clipboard history or you can even run shell commands directly from it.

To get everything out of Alfred, you need a paid license. However it is worth every penny.
