---
title: "How to avoid breaking changes in your REST API with OpenAPI"
description: "One of the challenges that you might encounter when you have an application which provides REST API is avoiding doing breaking changes when you update your API."
pubDate: 2019-02-03
tags: ["API", "OpenAPI", "REST"]
---

One of the challenges that you might encounter when you have an application which provides REST API is avoiding doing breaking changes when you update your API.

Introducing a breaking change in your REST API can possibly break thousands of clients that are consuming it. In an environment where you do **not** have control over clients, meaning you can't update them whenever you need, breaking change becomes really expensive and you might end up losing users.

Stating that your API is backward compatible gives your API consumers some confidence. It is not even that hard to achieve backward compatibility and there are multiple solutions that might help you achieving such API. I will focus on OpenAPI and I will try to show you how you can incorporate OpenAPI with some tools to avoid introducing breaking change in your API.

If you do not know what OpenAPI is you can read more about it in my post [Specification-first API design](/blog/specification-first-design).

Let's imagine that we have a REST API for Pet Store with an OpenAPI specification. It contains single resource which returns list of pets. There are no required parameters.

Now we will add a required path parameter to the resource. This change to the API is a breaking change. This means that after this change all clients that do not send the required parameter will stop working because server requires it. If you follow specification-first API design, the breaking change might be detected by your reviewers in the _design_ phase. However this expects that your reviewers will never miss such breaking change. Can we somehow detect this breaking change automatically?

Microsoft has an open source CLI tool to detect breaking changes between two OpenAPI specifications called [`openapi-diff`](https://github.com/Azure/openapi-diff) (as of 3.2.2019, it supports only OpenAPI 2.0). It is written in Javascript. You can install it by calling (it will be installed globally)

```bash
npm install -g oad@0.1.13
```

This takes two specifications, you will have to create a copy of the old one and then compare it with the new one. Following is an output of `openapi-diff` tool given the above Pet Store specifications

```
$ oad compare petstore.old.yaml petstore.new.yaml
{
  "id": "1001",
  "code": "NoVersionChange",
  "message": "The versions have not changed.",
  "jsonref": "#",
  "json-path": "#",
  "type": "Info"
}
{
  "id": "1010",
  "code": "AddingRequiredParameter",
  "message": "The required parameter 'name' was added in the new version.",
  "jsonref": "#/paths/~1pets/get/name",
  "json-path": "#/paths/pets/get/name",
  "type": "Error"
}
```

You can see that the tool printed 2 messages. The first one has `NoVersionChange` code and the second one has `AddingRequiredParameter` code.

- `NoVersionChange` code is only warning, it does not mean that it is a breaking change, hence the `Info` type. It just informs you that you haven't changed the `version` property in your specification (both are equal to `1.0.0`).
- `AddingRequiredParameter` has an `Error` type. This shows you that your new specification contains a breaking change. It also gives you a JSON ref to the resource where the breaking change occurred.

If you have your specification connected to your continuous integration, you can create a build breaker which will help you to detect breaking changes, based on the output of `openapi-diff`, early in design phase. This will help you to mitigate introducing breaking changes because you would not be able to merge your proposal when the build failed.

As I mentioned above, `openapi-diff` requires 2 specification files. If you have your specification versioned using Git then you would not have access to both old and new specification files by default. However there is an easy way to get the content of the file from different branch. If you want to get the content of `petstore.yaml` from `master` you can call following command

```bash
$ git show master:petstore.yaml
```

Your whole script could look like

```bash
$ git show master:petstore.yaml > petstore.old.yaml
$ oad compare petstore.old.yaml petstore.yaml
```

OpenAPI is a very helpful standard that makes API design a very enjoyable process. If you want to mitigate breaking changes, you can combine OpenAPI with [`openapi-diff`](https://github.com/Azure/openapi-diff) tool and integrate it to your continuous integration to detect the breaking change early in the design phase.
