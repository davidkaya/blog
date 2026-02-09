---
title: "Deploying Blazor WebAssembly to Azure Static Web App"
description: "In this post I will show you how to build a web application in Blazor and deploy it automatically with each commit into Azure."
pubDate: 2020-12-08
tags: [".NET", "Blazor", "Azure"]
---

In this post I will show you how to build a web application in Blazor and deploy it automatically with each commit into Azure. But first, let me tell you how I actually got into Azure Static Web App :)

We had some discussions about Spaces vs Tabs in the work and I decided to check whether I could buy some domain, which would show my preference. I soon found out that [spacesovertabs.xyz](https://www.spacesovertabs.xyz) is actually available so I bought it.

So, I had the domain, the next step was to actually create some content. What kind of an engineer would I be if I did not over-engineer it. Why over-engineer?

Well, I decided to use React. Manually deploying a production build of a React app would be boring, right? There goes Azure Static Web App with continuous deployment using Github Actions.

I bough the domain using GoDaddy. Of course, GoDaddy has its own DNS, but how could I leave a website with literally one sentence (there might be some easter eggs, but psst!), with a default DNS, right? And that brings Cloudflare.

So what did I end up with? React app which is being deployed with every commit to main branch to an Azure Static Web App which has Cloudflare in front of it. All of it because of one sentence, cool, isn't it?

But still nothing about Blazor WebAssembly in my story. Well I actually found out that Azure Static Web App supports Blazor by accident. When you are creating your Web App, you have to select what technology your website is written in and I noticed Blazor there :) I also had to give that a go!

But enough of the introduction, let's get started.

## Prerequisites

- [Free Azure Account](https://azure.microsoft.com/en-us/free/)
- [Free GitHub Account](https://github.com/join)
- [.NET 5 installed](https://dotnet.microsoft.com/download/dotnet/5.0)

## Creating the Blazor application

We will start with the web application itself. I will not dive into Blazor in this tutorial, so today, we will be creating only the default Blazor web application that is part of the template.

How do we start? Well, it is quite straightforward. If you are not familiar with `dotnet` CLI, this might be new for you.

`dotnet` CLI contains quite a few of default project templates that generate projects for you. If you want to create a new project, you just have to call `dotnet new` with some arguments.

Since we are talking about Blazor WebAssembly today, we will call

```bash
dotnet new blazorwasm -n MyFirstBlazorApp
```

That command will generate a following structure

```
MyFirstBlazorApp
├── App.razor
├── MyFirstBlazorApp.csproj
├── Pages
├── Program.cs
├── Properties
├── Shared
├── _Imports.razor
├── obj
└── wwwroot
```

Now, when you run `dotnet run` in your `MyFirstBlazorApp` directory, you should have a locally running web application. Yay! Just navigate to the URL that it prints in the command line.

## Pushing to GitHub

Sign into your GitHub account and [create a new repository](https://github.com/new) called `MyFirstBlazorApp`. Now, you have a repository where you can push your code to.

We will start by creating a `.gitignore` file so we don't push files which should not be in the repository. `dotnet` CLI will save us again! Just call the following command and everything will be done for you

```bash
dotnet new gitignore
```

Now we can push source code for our Blazor App into our repository

```bash
git init
git remote add origin YOUR_GIT_REPOSITORY_ADDRESS
git add .
git commit -m "My first commit"
git push origin main
```

That's all, now our Blazor web application is ready to be deployed.

## Creating the Azure Static Web App

Sign into your Azure account and search for `Static Web Apps` in the Azure portal and tap on the `Add` button (or click on this [link](https://portal.azure.com/#create/Microsoft.StaticApp)). Now we have to fill some values

- **Resource group** - create a resource group in which your application will be created. Resource groups is a way to group related resources in Azure.
- **Name** - this will be the name of your `Static Web App`. So let's call it `MyFirstBlazorApp`.
- **Region** - select a region which is close to you.
- **GitHub Account** - Sign in with your GitHub account. This is required so it can link your repository with the `Static Web App`.
- **Organization** - Select your personal organization - `davidkaya` in my case.
- **Repository** - Select the repository that we created in the previous section, so `MyFirstBlazorApp`.
- **Branch** - Select the branch which should be used for deployment. It will be `main` in the most of the cases.
- **Build Presets** - Select `Blazor`.
- **App location** - Change to `/`.

Once you filled in everything click on `Review + Create` and then `Create`. After a few moments, Azure will create your `Static Web App` service for you.

Azure does not only create a `Static Web App` but it also does some important things in the background. Specifically it creates a workflow in GitHub Actions which will deploy your application on every commit to Azure. If you want to see how the workflow is configured, navigate to `.github/workflows` folder in your repository. It contains a definition of the workflow. This file is pushed into your repository by Azure.

Once Azure creates the workflow in Github Actions, it will also trigger the first deployment. You can watch the status of the workflow in the `Actions` tab in your repository. Once the workflow finishes, you can open Azure and search and open `MyFirstBlazorApp`. On the right side, you will see a URL. Open the URL and you will see your Blazor application! Congrats.

## Summary

So what have we gone through today? We created a default Blazor Web Application from the template that `dotnet` CLI contains. Then we pushed the application into a GitHub repository. In the last part we created a `Azure Static Web App` service and connected it with our repository. Thanks to this, Azure created a workflow in our repository which is deploying the application into Azure.

In the future I will show you how you can use your custom domain which uses Cloudflare DNS to target your `Azure Static Web App`.
