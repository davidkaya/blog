---
title: "(Un)structured logging in .NET"
description: "What is structured logging and why should you care?"
pubDate: 2023-07-23
tags: [".NET", "C#", "logging"]
---

Developers frequently encounter logging when creating and launching ASP.NET Core applications. Upon launching such an application, a console with log messages appears. However, is it possible to extract more information from the logs?

To begin, let's create a basic logger from scratch. Consider the following program:

```csharp
var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
var logger = loggerFactory.CreateLogger("DemoLogger");
```

This code snippet configures a logger factory and creates a logger with category name "DemoLogger". Messages logged by this logger will be printed to the console. So if we call

```csharp
logger.LogInformation("Hello, World!");
```

the following text will be printed in the console:

```
info: DemoLogger[0]
      Hello, World!
```

Congratulations, you have just logged your first unstructured log! However, why is it unstructured? Let's consider the following example:

```csharp
var target = "World";
logger.LogInformation($"Hello, {target}! Sending greetings from the planet World!");
```

What do you see in the console when you run this code? The same thing as before. Now imagine that you are accepting the **target** which you want to greet via an API. You receive a request to greet Mars. Now you see the following:

```
info: DemoLogger[0]
      Hello, World! Sending greetings from the planet World!
info: DemoLogger[0]
      Hello, Mars! Sending greetings from the planet World!
```

Now you start receiving thousands of greeting requests and you would like to filter only those that greet World. You can't simply search for World in your favorite log browser because both of those messages contain the word World. Or let's say you want to see all the log messages that greet the target. You could use a simple Regex, right? However, with every operation that we want to do, we introduce a new way of filtering these unstructured logs. Let's give them some structure!

## Message templates

How can we structure our logs? We can do that using [message templates](https://messagetemplates.org/)! A message template is a structured pattern that includes named placeholders for our data. For example:

```
"Hello, {target}! Sending greeting from the planet World!"
```

You might say that it is the same thing as we had before, isn't it? It isn't. This string does not have a string interpolation operator `$`. That is very important. ASP.NET Core logging supports message templates and to use them, you just provide values for your placeholders as extra parameters to the logging method

```csharp
logger.LogInformation("Hello, {target}! Sending greeting from the planet World!", "World");
```

When we run our program again, we see the following output:

```
info: DemoLogger[0]
      Hello, World! Sending greeting from the planet World!
```

There isn't any difference, is there? That's because we configured our logger by calling `builder.AddConsole()`, which prints our log messages with prerendered placeholders.

## JSON console output

Let's replace `builder.AddConsole()` with

```csharp
builder.AddJsonConsole(o => o.JsonWriterOptions = new JsonWriterOptions
{
    Indented = true
});
```

When we run our program again, we see the following output

```json
{
  "EventId": 0,
  "LogLevel": "Information",
  "Category": "DemoLogger",
  "Message": "Hello, World! Sending greeting from the planet World!",
  "State": {
    "Message": "Hello, World! Sending greeting from the planet World!",
    "target": "World",
    "{OriginalFormat}": "Hello, {target}! Sending greeting from the planet World!"
  }
}
```

As you can see, the JSON contains multiple additional fields not visible before. It contains the prerendered message, the message template without replaced placeholders, and most importantly, it contains our target as a separate field. Now you can filter your logs easily with any tool that allows processing JSON files.

## The real benefit

The benefit of structured logging **is not** that we got the log message in JSON. JSON is just a way how we rendered the message. It could have been XML, YAML, or any other format. The benefit of structured logging is that our log messages carry their state/context separately, which means we can execute operations on the state itself separately, without having to parse the rendered log messages.

```json
// Unstructured logging output
{
  "EventId": 0,
  "LogLevel": "Information",
  "Category": "DemoLogger",
  "Message": "Hello, World! Sending greeting from the planet World!",
  "State": {
    "Message": "Hello, World! Sending greeting from the planet World!",
    "{OriginalFormat}": "Hello, World! Sending greeting from the planet World!"
  }
}

// Structured logging output
{
  "EventId": 0,
  "LogLevel": "Information",
  "Category": "DemoLogger",
  "Message": "Hello, World! Sending greeting from the planet World!",
  "State": {
    "Message": "Hello, World! Sending greeting from the planet World!",
    "target": "World",
    "{OriginalFormat}": "Hello, {target}! Sending greeting from the planet World!"
  }
}
```

The first example is using string interpolation, the second example is using structured logging with message template and value for placeholder provided as a separate argument.

If you have a large application that already sends logs to an external tool like Seq, Graylog, Grafana with Loki, or any other that supports structured logs, then by making a fairly simple change, you can get a lot of value. Even if you don't send logs to those tools, there are tools that support manual import of log files!

With structured logs, you can perform advanced operations like aggregations, time series, projections, render various graphs, etc.
