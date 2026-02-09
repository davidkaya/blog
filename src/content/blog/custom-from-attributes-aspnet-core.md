---
title: "Custom From* attributes for controller action methods in ASP.NET Core"
description: "Implementing custom From* attributes for controller action methods in ASP.NET Core."
pubDate: 2021-01-05
tags: [".NET", "C#", "ASP.NET Core"]
---

Recently I was going through some controllers and noticed a lot of code that was reading claims from `ClaimsPrinciple`. If you ever worked with claims in ASP.NET Core then code like `User.FindFirst(...)` might be familiar. All that the method does is that it will find the first claim that matches the type you want. You might have also noticed that, if you wanted to unit test some method in the controller that uses claims, it actually requires a quite a few extra lines of code to achieve that. You have to create `ClaimsPrincipal`, `ClaimsIdentity` and `Claim`s and then set everything on the `HttpContext` of your `ControllerContext`.

I stopped for a second and said to myself: "It would be nice if I could just get the required claim as a method parameter". And then I realized that it might not be that hard to actually achieve that! Let's see what we have to do to implement a custom `[FromClaim]` attribute.

## Creating a BindingSource

We will start by creating a [`BindingSource`](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.modelbinding.bindingsource?view=aspnetcore-5.0) for our source of data. This is needed when we want to bind our claim to the parameter of our controller action method.

```csharp
public static class ClaimBindingSource
{
    public static readonly BindingSource Claim = new(
        "Claim",
        "BindingSource_Claim",
        isGreedy: false,
        isFromRequest: true);
}
```

We will use the `BindingSource` that we have created in the following steps.

## Creating the value provider

The next very important step is to create the value provider. The value provider is the class where the actual claims will be read from the `ClaimsPrincipal`. We will base our new `ClaimValueProvider` on the [`BindingSourceValueProvider`](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.modelbinding.bindingsourcevalueprovider?view=aspnetcore-5.0) since we want to bind our claims to parameters in our controller action methods.

```csharp
public class ClaimValueProvider : BindingSourceValueProvider
{
    private readonly ClaimsPrincipal _claimsPrincipal;

    public ClaimValueProvider(BindingSource bindingSource, ClaimsPrincipal claimsPrincipal) : base(bindingSource)
    {
        _claimsPrincipal = claimsPrincipal;
    }

    public override bool ContainsPrefix(string prefix)
        => _claimsPrincipal.HasClaim(claim => claim.Type == prefix);

    public override ValueProviderResult GetValue(string key)
    {
        var claimValue = _claimsPrincipal.FindFirstValue(key);
        return claimValue != null ? new ValueProviderResult(claimValue) : ValueProviderResult.None;
    }
}
```

In our `ClaimValueProvider` we will need a `BindingSource` which will be the one we created for claims and a `ClaimsPrincipal` from which we will read the required claim.

In the `ContainsPrefix(...)` method, we will check whether the required claim is available.

In the `GetValue(...)` method, we will return the first claim that matches the required claim type.

This is all we need to do in the value provider. As you can see, you can easily unit test this class, since it does only a couple of small things.

## Creating the value provider factory

Now when we have implemented the `ClaimValueProvider`, we will need something that will create it with correct `BindingSource` and `ClaimsPrincipal`. This will be done by implementing a new `IValueProviderFactory` which we will call `ClaimValueProviderFactory`.

```csharp
public class ClaimValueProviderFactory : IValueProviderFactory
{
    public Task CreateValueProviderAsync(ValueProviderFactoryContext context)
    {
        context.ValueProviders.Add(new ClaimValueProvider(ClaimBindingSource.Claim, context.ActionContext.HttpContext.User));
        return Task.CompletedTask;
    }
}
```

We will pass our claim-specific `BindingSource` and also pass the `ClaimsPrincipal` from the `HttpContext` that is available in the `ValueProviderFactoryContext` which we get.

Once you have your provider created, you have to also add it into the available value providers in the `ValueProviderFactoryContext`.

## Registering the factory

The last step is to hook up our `ClaimValueProviderFactory` into available value provider factories which ASP.NET Core uses. You can do that in the `AddControllers[WithViews](...)` method in `ConfigureServices(...)`.

```csharp
public void ConfigureServices(IServiceCollection services)
{
    // ...
    services.AddControllersWithViews(options => options.ValueProviderFactories.Add(new ClaimValueProviderFactory()));
    // ...
}
```

## Creating the FromClaim attribute

So far we have implemented all the logic that will extract the claim from the `ClaimsPrincipal` and hooked up everything in ASP.NET Core. What is missing is our `[FromClaim]` attribute itself.

Our attribute will implement two interfaces:

1. `IBindingSourceMetadata` - this will specify which binding source will be used for binding
2. `IModelNameProvider` - this will specify the model name, this is the `key` that we will get in the value provider as a parameter

We will also add a constructor which receives a claim type, so we have to specify the claim type when we use it in our controller action method, e.g. `[FromClaim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name")]`.

```csharp
[AttributeUsage(AttributeTargets.Parameter)]
public class FromClaimAttribute : Attribute, IBindingSourceMetadata, IModelNameProvider
{
    public BindingSource BindingSource => ClaimBindingSource.Claim;

    public FromClaimAttribute(string type)
    {
        Name = type;
    }

    public string Name { get; }
}
```

## Usage

Now when we have everything implemented, we can easily use our new attribute in the controller action method.

```csharp
public IActionResult Index([FromClaim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name")] string name)
{
    return View();
}
```
