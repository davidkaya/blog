---
title: "Understanding Middleware in ASP.NET Core"
description: "A practical guide to the ASP.NET Core request pipeline — how middleware works, how to write your own, and the ordering mistakes that trip everyone up."
pubDate: 2026-02-15
tags: [".NET", "C#", "ASP.NET Core"]
---

## The mental model

Think of middleware as **layers of an onion**. Each request passes through every layer on the way in, and each response passes through every layer on the way out:

```
Request  →  [Auth]  →  [Logging]  →  [Routing]  →  Endpoint
Response ←  [Auth]  ←  [Logging]  ←  [Routing]  ←  Endpoint
```

Each middleware component can:

1. **Do work** before calling the next component
2. **Call the next component** (or short-circuit)
3. **Do work** after the next component returns

## Writing custom middleware

Here's the simplest possible middleware:

```csharp
app.Use(async (context, next) =>
{
    // Work BEFORE the next middleware
    var stopwatch = Stopwatch.StartNew();

    await next(context);

    // Work AFTER the next middleware
    stopwatch.Stop();
    context.Response.Headers["X-Response-Time"] =
        $"{stopwatch.ElapsedMilliseconds}ms";
});
```

For reusable middleware, create a class:

```csharp
/// <summary>
/// Adds response timing headers to every request.
/// Demonstrates: the before/after pattern in middleware.
/// </summary>
public class TimingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();

        await next(context);  // ← this calls the next middleware

        stopwatch.Stop();
        context.Response.Headers["X-Response-Time"] =
            $"{stopwatch.ElapsedMilliseconds}ms";
    }
}
```

## The ordering trap

⚠️ **Middleware order matters.** This is the #1 source of bugs:

```csharp
// ❌ Wrong — CORS headers won't be set for auth failures
app.UseAuthentication();
app.UseCors();

// ✅ Correct — CORS runs first, before auth can reject
app.UseCors();
app.UseAuthentication();
```

The recommended order for ASP.NET Core middleware:

1. Exception handling
2. HSTS
3. HTTPS redirection
4. Static files
5. CORS
6. Authentication
7. Authorization
8. Routing / endpoints

## Key takeaways

| # | Takeaway |
|---|----------|
| 1 | Middleware forms a pipeline — request goes in, response comes out |
| 2 | Each middleware can do work before AND after `next()` |
| 3 | Order matters — always follow the recommended sequence |
| 4 | Use `app.Use()` for inline, classes for reusable middleware |
| 5 | Forgetting to call `next()` short-circuits the pipeline |

For a live-coded demo of all these concepts, check out my [Middlewares in ASP.NET Core talk](https://slides.kaya.sk/middlewares/).
