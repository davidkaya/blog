---
title: "How to avoid breaking changes in your REST API with OpenAPI"
description: "Use OpenAPI and automated specification comparisons to catch breaking REST API changes before they reach production."
pubDate: 2019-02-03
tags: ["API", "OpenAPI", "REST"]
---

Updating a REST API without breaking its clients can be difficult.

A breaking change can stop thousands of clients from working. When you do **not** control those clients, you cannot update them whenever the API changes. Fixing the damage becomes expensive, and you may lose users.

Promising backward compatibility gives API consumers confidence. OpenAPI and automated checks can help you keep that promise by catching breaking changes during design.

If you do not know what OpenAPI is, you can read more about it in my post [Specification-first API design](/blog/specification-first-design).

Imagine a Pet Store REST API with an OpenAPI specification. It has a single resource that returns a list of pets, with no required parameters.

Now add a required path parameter. Existing clients do not send it, so they will stop working when the server begins requiring it. With specification-first design, reviewers may catch the problem during the _design_ phase. An automated check removes the need to rely on every reviewer noticing every breaking change.

Microsoft has an open-source CLI tool called [`openapi-diff`](https://github.com/Azure/openapi-diff) that compares two OpenAPI specifications. As of 3 February 2019, it supports only OpenAPI 2.0. The tool is written in JavaScript and can be installed globally:

```bash
npm install -g oad@0.1.13
```

The tool takes an old and a new specification. Given the Pet Store change above, `openapi-diff` produces this output:

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

The tool reports two results:

- `NoVersionChange` is informational rather than a breaking change. It tells you that both specifications still have the version `1.0.0`.
- `AddingRequiredParameter` has the type `Error`. It identifies the breaking change and provides a JSON reference to the affected resource.

You can run this comparison in continuous integration and fail the build when `openapi-diff` reports an error. A proposal containing a breaking change then cannot be merged until someone fixes it.

`openapi-diff` needs both versions of the specification. If the file is stored in Git, you can extract the version from another branch. This command reads `petstore.yaml` from `master`:

```bash
$ git show master:petstore.yaml
```

The complete comparison script can be as short as:

```bash
$ git show master:petstore.yaml > petstore.old.yaml
$ oad compare petstore.old.yaml petstore.yaml
```

Run this check for every specification pull request to catch breaking changes while the API is still being designed.
