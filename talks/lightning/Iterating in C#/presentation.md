---
title: Iterating in C#
---

# Iterating in C#

## Agenda

1. Why We Care
2. The `for` Loop
3. The `foreach` Loop
4. `foreach` with `ref` / `ref readonly`
5. `while` and Manual Enumerator
6. LINQ Iteration
7. Parallel Iteration
8. Async Iteration (`await foreach`)
9. High-Performance: `Span<T>`
10. Mutating While Iterating
11. Bonus: Custom Iterators
12. Key Takeaways

---

## 1. Why We Care

We loop all the time:

- Arrays, Lists, Dictionaries
- Database results
- Streams
- Network packets

C# gives us many tools:

- `for`
- `foreach`
- `while`
- `do { } while`
- `ref foreach`
- LINQ
- `Parallel.ForEach`
- `IEnumerator`
- `await foreach`
- `Span` / `Memory`

---

## 2. The `for` Loop

```csharp
var numbers = new List<int> { 10, 20, 30, 40 };

for (int i = 0; i < numbers.Count; i++)
{
    Console.WriteLine(numbers[i]);
}
```

✅ **Pros**

- Full control over index
- Works for mutation and indexed access
- Very fast for arrays and `List<T>`

⚠️ **Cons**

- Easy off-by-one bugs
- Not valid for non-indexable types
- Slightly noisier for simple reads

💡 **Use when:**  

You need the index or modify elements in place.

---

## 3. The `foreach` Loop

```csharp
foreach (var n in numbers)
{
    Console.WriteLine(n);
}
```

✅ **Pros**

- Clean and idiomatic
- Works on anything `IEnumerable`
- Safe and readable

---

### `foreach` — Under the hood

```csharp
using (var e = numbers.GetEnumerator())
{
    while (e.MoveNext())
    {
        var n = e.Current;
        Console.WriteLine(n);
    }
}
```

⚠️ **Cons**

- Can't modify collection while iterating
- Minor overhead for enumerator allocation (on non-arrays)

💡 **Use when:**  

You just need to read elements.

---

## 4. `foreach` with `ref` / `ref readonly`

```csharp
Span<int> data = stackalloc int[] { 1, 2, 3, 4 };

foreach (ref int x in data)
{
    x *= 2;
}
```

or:

```csharp
foreach (ref readonly var x in bigStructSpan)
{
    Console.WriteLine(x);
}
```

✅ **Pros**

- Avoids copying large structs
- Enables in-place mutation
- Used in performance-critical code

💡 **Use when:**  

Working with `Span<T>` or performance-critical structs.

---

## 5. `while` and Manual Enumerator

```csharp
var e = numbers.GetEnumerator();


while (e.MoveNext())
{
    Console.WriteLine(e.Current);
}
```

✅ **Pros**

- Full control of enumeration lifecycle
- Useful for custom enumerators

⚠️ **Cons**

- Verbose
- Usually unnecessary (compiler does this for you)

💡 **Use when:**  

You need custom control or dual enumeration.

---

## 6. LINQ Iteration

```csharp
var doubled =
    numbers
        .Where(n => n > 10)
        .Select(n => n * 2);

foreach (var x in doubled)
    Console.WriteLine(x);
```

🧠 **Lazy evaluation**

- Work happens only when you consume (`foreach`, `.ToList()`, etc.)
- Powerful for composability

⚠️ **Pitfalls**

- Iterator allocations
- Can enumerate multiple times

✅ **Fix**

```csharp
var cached = big.ToList();
```

💡 **Use when:**  

Expressing intent matters more than raw speed.

---

## 7. Parallel Iteration

```csharp
var urls = new[] { "https://a", "https://b", "https://c" };

Parallel.ForEach(urls, url =>
{
    Console.WriteLine($"Downloading {url}");
});

```

✅ **Pros**

- Parallelizes CPU-bound loops
- Simple API

⚠️ **Cons**

- No order guarantee
- Thread-safety required
- Not for async I/O

💡 **Use when:**  

Each item can be processed independently.

---

## 8. Async Iteration (`await foreach`)

```csharp
await foreach (var line in ReadLinesAsync("data.txt"))
{
    Console.WriteLine(line);
}

async IAsyncEnumerable<string> ReadLinesAsync(string path)
{
    using var reader = File.OpenText(path);
    while (!reader.EndOfStream)
        yield return await reader.ReadLineAsync();
}
```

✅ **Pros**

- Stream results as they arrive
- No full buffering

💡 **Use when:**  

Working with streaming data or slow I/O.

---

## 9. High-Performance: `Span<T>`

```csharp
ReadOnlySpan<byte> bytes = File.ReadAllBytes("data.bin");

foreach (var b in bytes)
{
    // process byte
}
```

✅ **Pros**

- Array-like performance
- Zero allocations
- Safe access to memory

💡 **Use when:**  

Performance and memory control matter.

---

## 10. Mutating While Iterating

❌ **Will throw**

```csharp
foreach (var x in list)
{
    if (ShouldRemove(x))
        list.Remove(x);
}

```

✅ **Fix 1 — backward for loop**

```csharp
for (int i = list.Count - 1; i >= 0; i--)
    if (ShouldRemove(list[i]))
        list.RemoveAt(i);

```

✅ **Fix 2 — LINQ**

```csharp
list = list.Where(x => !ShouldRemove(x)).ToList();
```

---

## 11. Bonus: Custom Iterators

```csharp

static IEnumerable<int> CountUpTo(int max)
{
    for (int i = 1; i <= max; i++)
        yield return i;
}

foreach (var x in CountUpTo(3))
    Console.WriteLine(x);

```

💡 **`yield return`**

- Builds a lazy sequence
- No manual collection creation

---

## 12. Key Takeaways

| #   | Takeaway                                                                                     |
| --- | -------------------------------------------------------------------------------------------- |
| 1   | `foreach` is the idiomatic default — use it unless you have a reason not to                  |
| 2   | Use `for` when you need the index or must mutate elements in place                           |
| 3   | LINQ is expressive and lazy — but beware of multiple enumeration and allocations             |
| 4   | `Parallel.ForEach` is for CPU-bound work — not async I/O                                     |
| 5   | `await foreach` streams async results without buffering everything in memory                 |
| 6   | `ref foreach` with `Span<T>` avoids copies and allocations in hot paths                      |
| 7   | Never mutate a collection while iterating with `foreach` — use a backward `for` loop or LINQ |
| 8   | `yield return` lets you build custom lazy sequences with minimal code                        |

---

## Resources

- [Iteration statements - C# reference](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/iteration-statements)
- [IAsyncEnumerable\<T\> - Microsoft Docs](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.iasyncenumerable-1)
- [Span\<T\> - Microsoft Docs](https://learn.microsoft.com/en-us/dotnet/api/system.span-1)
- [Parallel.ForEach - Microsoft Docs](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.parallel.foreach)
- [Demo project](demo/IterationDemo/)
