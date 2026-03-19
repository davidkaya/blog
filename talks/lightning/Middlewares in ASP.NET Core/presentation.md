---
title: Middlewares in ASP.NET Core
---

# Middlewares in ASP.NET Core

## Agenda

1. What is Middleware?
2. How the Request Pipeline Works
3. The Three Delegates: `Use`, `Run`, `Map`
4. Built-in Middlewares
5. Writing Custom Middleware (Inline & Class-based)
6. Middleware Ordering – Why It Matters
7. Short-Circuiting the Pipeline
8. Branching the Pipeline (`Map`, `MapWhen`, `UseWhen`)
9. Middleware vs Filters – When to Use What
10. Real-World Patterns (with code)
11. Common Pitfalls & Best Practices
12. Demo & Q&A

---

## 1. What is Middleware?

- Every HTTP request in ASP.NET Core flows through a **chain of middleware components**
- Each middleware component can:
  - ✅ **Execute logic** before the next component runs
  - ✅ **Call the next** component in the chain (or choose **not to**)
  - ✅ **Execute logic** after the next component has completed
- Middleware is the **first and last** code to touch every request
- It's how ASP.NET Core implements **cross-cutting concerns**: logging, auth, error handling, CORS,
  caching

### The Mental Model

Think of middleware like **layers of an onion** — the request travels inward through each layer,
hits the endpoint, and the response travels back outward through the same layers in reverse:

<div class="mermaid">
flowchart LR
    Req([Request]) --> EH["Exception<br>Handler"]
    EH --> Https["HTTPS<br>Redirection"]
    Https --> AuthN["Authentication"]
    AuthN --> AuthZ["Authorization"]
    AuthZ --> Endpoint["Your<br>Endpoint"]
    Endpoint -.-> AuthZ
    AuthZ -.-> AuthN
    AuthN -.-> Https
    Https -.-> EH
    EH -. "final response" .-> Res([Response])
</div>

---

## 2. How the Request Pipeline Works

When an HTTP request arrives, ASP.NET Core:

1. Creates an `HttpContext` containing the `Request` and `Response`
2. Passes it to the **first middleware** in the pipeline
3. Each middleware calls `next()` to pass control to the next one
4. When the innermost middleware (or endpoint) completes, control unwinds **back through each
   middleware in reverse order**
5. The final response is sent to the client

### The Core Abstraction: `RequestDelegate`

```csharp
// This is the fundamental building block – a function that takes
// an HttpContext and returns a Task
public delegate Task RequestDelegate(HttpContext context);
```

Every middleware is ultimately a function that receives an `HttpContext` and a reference to the
**next** `RequestDelegate` in the chain.

---

## 3. The Three Delegates: `Use`, `Run`, `Map`

These are the three fundamental ways to add middleware:

### `Use()` — Pass-through middleware

Runs logic, then **optionally** calls `next()` to continue the pipeline.

```csharp
app.Use(async (context, next) =>
{
    // Before the next middleware
    Console.WriteLine("Before");

    await next(context);  // Call the next middleware

    // After the next middleware
    Console.WriteLine("After");
});
```

### `Run()` — Terminal middleware

**Never calls `next()`** — it ends the pipeline. Anything registered after `Run()` is never reached.

```csharp
app.Run(async context =>
{
    await context.Response.WriteAsync("Pipeline ends here. Nothing else runs.");
});
```

---

### `Map()` — Branch the pipeline

Creates a **separate pipeline branch** based on the request path. The branch does **not** rejoin the
main pipeline.

```csharp
app.Map("/health", branch =>
{
    branch.Run(async context =>
        await context.Response.WriteAsync("OK"));
});
```

### Summary Table

| Method      | Calls `next()`? | Rejoins pipeline? | Use case                  |
| ----------- | :-------------: | :---------------: | ------------------------- |
| `Use()`     |     ✅ Yes      |      ✅ Yes       | Cross-cutting logic       |
| `Run()`     |      ❌ No      |  N/A (terminal)   | Final response generation |
| `Map()`     |     Depends     |       ❌ No       | Path-based branching      |
| `UseWhen()` |     ✅ Yes      |      ✅ Yes       | Conditional middleware    |
| `MapWhen()` |     Depends     |       ❌ No       | Condition-based branching |

---

## 4. Built-in Middlewares

ASP.NET Core ships with many middlewares out of the box:

| Middleware               | Purpose                        | When it short-circuits               |
| ------------------------ | ------------------------------ | ------------------------------------ |
| `UseExceptionHandler`    | Global error handling          | When an exception is thrown          |
| `UseHsts`                | HTTP Strict Transport Security | Never (adds header only)             |
| `UseHttpsRedirection`    | Redirect HTTP → HTTPS          | When request is HTTP                 |
| `UseStaticFiles`         | Serve static files (wwwroot)   | When file exists on disk             |
| `UseRouting`             | Match URL to endpoints         | Never (sets metadata)                |
| `UseCors`                | Cross-Origin Resource Sharing  | On preflight OPTIONS requests        |
| `UseAuthentication`      | Identify the user              | Never (sets `User` on context)       |
| `UseAuthorization`       | Check permissions              | When user lacks required permissions |
| `UseResponseCaching`     | Cache responses                | When a valid cached response exists  |
| `UseRateLimiter`         | Rate limiting (.NET 7+)        | When rate limit is exceeded          |
| `UseOutputCache`         | Output caching (.NET 7+)       | When a cached output exists          |
| `UseResponseCompression` | Gzip/Brotli compression        | Never (wraps response stream)        |

> 💡 **Key insight**: Some middleware short-circuits (stops the pipeline early), while others just
> add behavior and always call `next()`.

---

## 5. Writing Custom Middleware

### 5a. Inline Middleware (Quick & Simple)

Best for prototyping or one-off logic. Defined directly in `Program.cs`:

```csharp
app.Use(async (context, next) =>
{
    Console.WriteLine($">> Request: {context.Request.Method} {context.Request.Path}");
    var stopwatch = Stopwatch.StartNew();

    await next(context);

    stopwatch.Stop();
    Console.WriteLine($"<< Response: {context.Response.StatusCode} in {stopwatch.ElapsedMilliseconds}ms");
});
```

---

### 5b. Class-based Middleware (Production-ready)

The convention-based approach. **This is what you should use in production:**

```csharp
public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestTimingMiddleware> _logger;

    public RequestTimingMiddleware(RequestDelegate next, ILogger<RequestTimingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        await _next(context);
        stopwatch.Stop();
        _logger.LogInformation("{Method} {Path} completed in {Elapsed}ms",
            context.Request.Method, context.Request.Path, stopwatch.ElapsedMilliseconds);
    }
}

// Extension method for clean registration
public static class RequestTimingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestTiming(this IApplicationBuilder builder)
        => builder.UseMiddleware<RequestTimingMiddleware>();
}
```

---

### 5b. Convention Rules

| Rule               | Detail                                                   |
| ------------------ | -------------------------------------------------------- |
| Constructor        | First param must be `RequestDelegate`                    |
| Method name        | Must be `InvokeAsync` or `Invoke`                        |
| Return type        | Must return `Task`                                       |
| First method param | Must be `HttpContext`                                    |
| Lifetime           | **Singleton** — created once, shared across all requests |
| Scoped services    | Inject via `InvokeAsync` parameters, **not** constructor |

---

### 5c. `IMiddleware` Interface (Factory-based)

Activated **per request** — supports scoped lifetime:

```csharp
public class ScopedMiddleware : IMiddleware
{
    private readonly IScopedService _service;  // Scoped DI is safe here!

    public ScopedMiddleware(IScopedService service) => _service = service;

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        _service.DoWork();
        await next(context);
    }
}

// Must register in DI:
builder.Services.AddTransient<ScopedMiddleware>();
```

### When to Use Which?

| Approach         | Lifetime    | DI Support                                              | Best for                              |
| ---------------- | ----------- | ------------------------------------------------------- | ------------------------------------- |
| Inline `Use()`   | N/A         | Captured closures                                       | Prototyping, one-liners               |
| Convention class | Singleton   | Constructor (singleton) + `InvokeAsync` params (scoped) | Most production middleware            |
| `IMiddleware`    | Per-request | Full constructor injection                              | Middleware that needs scoped services |

---

## 6. Middleware Ordering – Why It Matters

The **order you add middleware is the order they execute**. Getting it wrong causes subtle (and
not-so-subtle) bugs.

### Recommended Order

<div class="mermaid">
flowchart TB
    subgraph Platform["Platform & transport"]
        direction LR
        A["1. Exception<br>Handler"] --> B["2. HSTS"] --> C["3. HTTPS<br>Redirection"] --> D["4. Static Files"]
    end

    subgraph Pipeline["Request pipeline"]
        direction LR
        E["5. Routing"] --> F["6. CORS"] --> G["7. Authentication"] --> H["8. Authorization"]
    end

    subgraph App["Application behavior"]
        direction LR
        I["9. Rate<br>Limiter"] --> J["10. Response<br>Caching"] --> K["11. Custom<br>middlewares"] --> L["12. MapControllers<br>or MapEndpoints"]
    end

    D --> E
    H --> I
</div>

---

### Why This Order?

- **Exception handler first** → catches errors from ALL downstream middleware
- **Static files before routing** → avoids unnecessary auth checks for CSS/JS/images
- **Authentication before Authorization** → you must know _who_ the user is before checking _what_
  they can do
- **CORS between Routing and Auth** → preflight requests need CORS headers but shouldn't require
  auth

### ⚠️ Common Mistakes

```csharp
// ❌ WRONG: Authorization before Authentication
app.UseAuthorization();    // User not identified yet!
app.UseAuthentication();

// ❌ WRONG: Exception handler too late
app.UseAuthentication();
app.UseExceptionHandler(); // Won't catch auth errors!

// ❌ WRONG: Static files after auth
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();      // Now CSS requires login!
```

---

## 7. Short-Circuiting the Pipeline

A middleware **short-circuits** when it doesn't call `next()`. The request never reaches downstream
middleware or endpoints.

### When to Short-Circuit

- ❌ Request fails validation (bad API key, rate limit exceeded)
- ❌ Cached response available (no need to execute the endpoint)
- ❌ Health check endpoint (simple response, skip everything)

### Example: API Key Validation

```csharp
public async Task InvokeAsync(HttpContext context)
{
    if (!context.Request.Headers.TryGetValue("X-Api-Key", out var apiKey)
        || apiKey != _expectedKey)
    {
        context.Response.StatusCode = 401;
        await context.Response.WriteAsJsonAsync(new { error = "Invalid API key" });
        return;  // ⛔ Pipeline stops here — next() is never called
    }

    await _next(context);  // ✅ Valid key — continue the pipeline
}
```

---

### ⚠️ Important: Don't Write After `next()`

```csharp
// ❌ DANGEROUS: Response may already be started
await _next(context);
context.Response.Headers["X-Custom"] = "value";  // May throw!

// ✅ SAFE: Use OnStarting to modify headers
context.Response.OnStarting(() =>
{
    context.Response.Headers["X-Custom"] = "value";
    return Task.CompletedTask;
});
await _next(context);
```

---

## 8. Branching the Pipeline

### `Map` – Branch by path prefix (separate pipeline)

The branch is a **completely separate pipeline** — it does not rejoin the main pipeline:

```csharp
app.Map("/api", apiApp =>
{
    apiApp.UseAuthentication();
    apiApp.UseAuthorization();
    apiApp.Run(async context =>
        await context.Response.WriteAsync("API branch"));
});

// Requests to /api/* never reach middleware registered after this Map()
```

### `MapWhen` – Branch by any condition

```csharp
app.MapWhen(
    context => context.Request.Headers.ContainsKey("X-Custom-Header"),
    branch =>
    {
        branch.Run(async context =>
            await context.Response.WriteAsync("Custom header branch"));
    });
```

---

### `UseWhen` – Conditionally add middleware (rejoins pipeline!) ⭐

This is often what you actually want — add extra middleware only for certain requests, but **stay in
the main pipeline**:

```csharp
// Only validate API key for /secure/* routes
app.UseWhen(
    context => context.Request.Path.StartsWithSegments("/secure"),
    branch => branch.UseMiddleware<ApiKeyMiddleware>());

// All requests (including /secure/*) continue here
app.MapControllers();
```

### Decision Guide

<div class="mermaid">
flowchart TD
    Q{"Do you need a completely<br>separate pipeline?"}
    Q -- Yes --> M["Use Map<br>or MapWhen"]
    Q -- No --> U["Use<br>UseWhen"]
</div>

---

## 9. Middleware vs Filters – When to Use What

ASP.NET Core also has **Action Filters**, **Endpoint Filters**, etc. When should you use middleware
vs filters?

| Aspect         | Middleware                                                | Filters                                                        |
| -------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| Scope          | **All requests** (even non-endpoint)                      | Only matched endpoints                                         |
| Access to      | `HttpContext` only                                        | `HttpContext` + MVC context (ModelState, ActionArguments)      |
| Runs when      | Every request, always                                     | Only when an endpoint is matched                               |
| Best for       | Cross-cutting concerns (logging, CORS, auth, compression) | Endpoint-specific logic (validation, caching, transformations) |
| Pipeline level | Outer (HTTP pipeline)                                     | Inner (MVC/endpoint pipeline)                                  |

### Rule of Thumb

> **Use middleware** when the behavior should apply to **all requests** (or broad categories). **Use
> filters** when the behavior is tied to **specific endpoints or controllers**.

---

## 10. Real-World Patterns (with code)

### Pattern 1: Correlation ID for Distributed Tracing

Attach a unique ID to every request so you can trace it across microservices:

```csharp
public async Task InvokeAsync(HttpContext context)
{
    var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault()
                        ?? Guid.NewGuid().ToString();

    context.Items["CorrelationId"] = correlationId;
    context.Response.OnStarting(() =>
    {
        context.Response.Headers["X-Correlation-Id"] = correlationId;
        return Task.CompletedTask;
    });

    using (_logger.BeginScope(new Dictionary<string, object> { ["CorrelationId"] = correlationId }))
    {
        await _next(context);
    }
}
```

---

### Pattern 2: Global Exception Handling

Return consistent JSON error responses instead of default HTML error pages:

```csharp
public async Task InvokeAsync(HttpContext context)
{
    try
    {
        await _next(context);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Unhandled exception");

        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new
        {
            error = "Internal Server Error",
            message = ex.Message,  // Hide in production!
            traceId = Activity.Current?.Id ?? context.TraceIdentifier
        });
    }
}
```

---

### Pattern 3: Request/Response Logging

Log every request body and response for debugging or auditing:

```csharp
public async Task InvokeAsync(HttpContext context)
{
    // Enable buffering so we can read the request body multiple times
    context.Request.EnableBuffering();

    var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
    context.Request.Body.Position = 0;  // Reset for downstream middleware

    _logger.LogInformation("Request: {Method} {Path} Body: {Body}",
        context.Request.Method, context.Request.Path, requestBody);

    await _next(context);

    _logger.LogInformation("Response: {StatusCode}", context.Response.StatusCode);
}
```

---

### Pattern 4: Simple Rate Limiting (before .NET 7)

```csharp
// Using a ConcurrentDictionary to track request counts per IP
private static readonly ConcurrentDictionary<string, (int Count, DateTime Window)> _clients = new();

public async Task InvokeAsync(HttpContext context)
{
    var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    var now = DateTime.UtcNow;

    var entry = _clients.AddOrUpdate(ip,
        _ => (1, now.AddMinutes(1)),
        (_, existing) => existing.Window > now
            ? (existing.Count + 1, existing.Window)
            : (1, now.AddMinutes(1)));

    if (entry.Count > 100)
    {
        context.Response.StatusCode = 429;
        await context.Response.WriteAsync("Too many requests");
        return;
    }

    await _next(context);
}
```

---

## 11. Common Pitfalls & Best Practices

### ❌ Pitfalls

| Pitfall                                             | Why it's bad                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| Modifying `Response.Headers` after `next()`         | Response may already be sent — throws `InvalidOperationException`         |
| Injecting scoped services in middleware constructor | Middleware is singleton — scoped service becomes a **captive dependency** |
| Forgetting to call `next()`                         | Silently short-circuits the pipeline; downstream middleware never runs    |
| Calling `next()` after writing to response body     | May corrupt the response or throw                                         |
| Heavy logic in middleware                           | Runs on **every** request — use filters for endpoint-specific logic       |

---

### ✅ Best Practices

1. **Keep middleware focused** — one responsibility per middleware
2. **Use extension methods** — `app.UseMyMiddleware()` is cleaner than `app.UseMiddleware<T>()`
3. **Handle exceptions carefully** — don't let middleware exceptions crash the pipeline
4. **Use `IMiddleware`** when you need scoped DI
5. **Prefer `UseWhen` over `MapWhen`** when you want to rejoin the main pipeline
6. **Test your middleware** — it's just a class, inject a mock `RequestDelegate`
7. **Use `context.Response.OnStarting()`** to safely modify response headers
8. **Measure performance** — middleware runs on every request; keep it fast

### Testing a Middleware

```csharp
[Fact]
public async Task RequestTimingMiddleware_LogsElapsedTime()
{
    var logger = new FakeLogger<RequestTimingMiddleware>();
    var middleware = new RequestTimingMiddleware(
        next: (context) => Task.CompletedTask,  // Mock next delegate
        logger: logger);

    var context = new DefaultHttpContext();
    await middleware.InvokeAsync(context);

    Assert.Contains(logger.Messages, m => m.Contains("completed in"));
}
```

---

## 12. Key Takeaways

| #   | Takeaway                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------ |
| 1   | Middleware forms a **bidirectional pipeline** — request goes in, response comes out                          |
| 2   | **Order is everything** — exception handling first, auth before authz, static files before routing           |
| 3   | **`Use` / `Run` / `Map`** are the three fundamental building blocks                                          |
| 4   | **Short-circuiting** is powerful — use it for validation, caching, health checks                             |
| 5   | Use **convention-based classes** for production middleware (testable, injectable)                            |
| 6   | Use **`IMiddleware`** when you need per-request (scoped) DI                                                  |
| 7   | Use **`UseWhen`** (not `MapWhen`) when you want conditional middleware that rejoins the pipeline             |
| 8   | **Middleware ≠ Filters** — middleware is for cross-cutting concerns; filters are for endpoint-specific logic |
| 9   | Middleware is the backbone of **everything** in ASP.NET Core — even the framework features are middleware    |

---

## Resources

- 📖
  [ASP.NET Core Middleware Docs](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/)
- 📖
  [Write Custom Middleware](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/write)
- 📖
  [Middleware Ordering](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/#middleware-order)
- 📖
  [Filters in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/mvc/controllers/filters)
- 📦 [Demo Project → `./MiddlewareDemo`](./MiddlewareDemo/)
-
