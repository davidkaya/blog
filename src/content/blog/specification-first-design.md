---
title: "Specification-first API design"
description: "Building a REST API is easy. A specification-first approach makes it easier to review, validate, document, and generate clients for that API."
pubDate: 2019-02-01
tags: ["API", "OpenAPI", "REST"]
---

Building an application that provides a REST API is easy today. Countless languages and frameworks support it. When you add or update an API resource, the usual process is to open the application, change the source code, write tests, and deploy it.

This process creates several problems:

- Your team or organization may have standards for how APIs should look. If reviewers spot a problem only after you implement the change, you may have to rewrite a lot of code.
- You have no automated way to validate the implementation against its documentation.
- You have to update client libraries manually.
- You have to update documentation manually.

These manual steps add boilerplate and repetitive work. A specification-first approach moves API design ahead of implementation.

Before changing the application, you describe the API with a standard that both people and machines can read. The development process begins with that document instead of the source code.

You submit the proposed specification in a pull request and iterate on it before writing the implementation. Reviewing a document is faster than reviewing completed code only to discover that the API design needs to change. Once the proposal is approved and merged, implementation can begin.

Because the specification is machine-readable, tools can generate tests that validate the implementation. They can also generate API clients and documentation. Reviewers can focus on the proposed API instead of reading implementation code to work out what changed.

## OpenAPI

I could describe OpenAPI in my own words, but the official [OpenAPI Specification](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md) says it best:

> The OpenAPI Specification (OAS) defines a standard, language-agnostic interface to RESTful APIs which allows both humans and computers to discover and understand the capabilities of the service without access to source code, documentation, or through network traffic inspection. When properly defined, a consumer can understand and interact with the remote service with a minimal amount of implementation logic.

OpenAPI, formerly known as [Swagger](https://swagger.io/), is a community-driven specification within the [OpenAPI Initiative](https://www.openapis.org/). You can describe an API in JSON or YAML. Tools can then read the specification and generate documentation, clients, tests, mock servers, and more. [OpenAPI.Tools](https://openapi.tools/) lists many of the available tools.

OpenAPI provides the common format needed for specification-first design. Its tooling reduces the time spent keeping documentation, tests, clients, and implementation in sync by hand.

In follow-up posts, I will show how to use OpenAPI in continuous integration and generate documentation, clients, tests, and mock servers.
