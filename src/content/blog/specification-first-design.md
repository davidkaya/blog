---
title: "Specification-first API design"
description: "Creating an application which provides REST API is nowadays a very easy task. But can we do better with a specification-first approach?"
pubDate: 2019-02-01
tags: ["API", "OpenAPI", "REST"]
---

Creating an application which provides REST API is nowadays a very easy task. There are countless of languages with frameworks that make this task very easy. Always when you decide to add new resources or update some resources in your API you probably just open the implementation of the application, make changes to the source code, write some tests and then you put your application to production.

This can bring multiple issues:

- If you are part of a team or multiple teams then there might be some standard how the APIs should look like. You update the implementation, create a pull request. When reviewers notice that you did not follow the standard, you might end-up having to change a lot of code.
- You have no automated way of validating your API implementation against documentation.
- You have to manually update all your client libraries.
- You have to manually update documentation.

You can see that there is a lot of manual steps in your development process. These steps are steps which bring a lot of boilerplate code and a lot of repetitive work. What will specification-first approach change on this process? Will it help?

What does specification-first design actually mean? It means that before you start changing the implementation of your API, you first design it using some standard that is human and machine readable. Can we achieve something similar to the following diagram?

As you can see whole development process starts by making change to some _document_ that describes your API in a standardized way. Once you create a pull request with a proposal with your change then you can iterate over your proposal a lot faster than you would be able to iterate over the actual implementation. When your proposal is approved and merged, you can start working on the actual implementation. Since the specification is machine readable, you can validate your API implementation with tests that are being automatically generated from the specification. Your API clients and documentation are also generated automatically. With this approach you save a lot of time by removing required manual steps and you make the API review process far more friendly because no-one has to actually go through your code just to review your API proposal.

But this proposed process uses some _standard_ to describe the API. Is there some standard that can be used to implement the proposed process?

## OpenAPI

I tried to describe what OpenAPI means using my own words however I think the official [OpenAPI Specification](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md) describes it the best:

> The OpenAPI Specification (OAS) defines a standard, language-agnostic interface to RESTful APIs which allows both humans and computers to discover and understand the capabilities of the service without access to source code, documentation, or through network traffic inspection. When properly defined, a consumer can understand and interact with the remote service with a minimal amount of implementation logic.

OpenAPI, formerly known as [Swagger](https://swagger.io/), is a community-driven open specification within the [OpenAPI Initiative](https://www.openapis.org/). It is a standard that allows you to describe your API either in JSON Schema or YAML. There are a lot of tools that can consume OpenAPI specification to generate documentation, clients, tests, mock server, etc. You can see a lot of tools at [OpenAPI.Tools](https://openapi.tools/).

OpenAPI and tools that support OpenAPI can help you implement specification-first design in your project. Using these tools will help you to increase your productivity and you can start focusing on problems that are actually important and not on boilerplate code and repetitive coding.

I will show you how to incorporate OpenAPI in your continuous integration, how to generate documentation, clients, tests, mock servers, etc. in follow-up posts.
