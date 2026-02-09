---
title: "Highlighting parts of UILabel in Xamarin"
description: "I was implementing a search in UITableViewController and received a task to also highlight the searched words in the results."
pubDate: 2018-03-01
tags: ["Xamarin", "iOS", "C#"]
---

I was implementing a search in `UITableViewController` and received a task to also highlight the searched words in the results. This is not a behaviour that is already implemented in the iOS components (`UILabel`) so I had to come up with my own solution. I will share this solution with you.

I implemented this behaviour through C# extensions. You may also use this implementation in your custom `UILabel` subclasses.

We will need the substring that should be highlighted and the color that will be use as a background. So the signature of the extension might look like this:

```csharp
public static void HighlightSubstring(this UILabel label, string substring, UIColor highlightColor)
```

For highlighting the substrings we will need their indexes. You will have to implement your own method for acquiring all indexes of the substring since the NSString's method will return only one occurrence of the substring. You can see the implementation in the next section.

We will look for the substring's indexes in `UILabel`'s Text property.

```csharp
var indexes = label.Text.AllIndexesOf(substring, StringComparison.OrdinalIgnoreCase);
```

Then we will have to initialize `NSMutableAttributedString` with the content of `UILabel`'s Text property.

```csharp
var attributedText = new NSMutableAttributedString(label.Text);
```

Now we will start with the actual highlighting process. We will go through the indexes and highlight all substrings. The NSRange will start at the index and will have the length of the substring.

```csharp
foreach (var index in indexes)
{
    var range = new NSRange(index, substring.Length);
    attributedText.SetAttributes(new UIStringAttributes{ BackgroundColor = highlightColor }, range);
}
```

The last part consists of assignment of the new attributed text into the UILabel's AttributedText property.

```csharp
label.AttributedText = attributedText;
```

So the result could look like this:

```csharp
public static void HighlightSubstring(this UILabel label, string substring)
{
    if (!label.RespondsToSelector(new Selector("setAttributedText:")))
        return;
    var indexes = label.Text.AllIndexesOf(substring, StringComparison.OrdinalIgnoreCase);
    var attributedText = new NSMutableAttributedString(label.Text);

    foreach(var index in indexes)
    {
        var range = new NSRange(index, substring.Length);
        attributedText.SetAttributes(new UIStringAttributes { BackgroundColor = highlightColor }, range);
    }

    label.AttributedText = attributedText;
}
```

You can get the indexes of substring in a string by creating a following string extension:

```csharp
public static List<int> AllIndexesOf(this string str, string value, StringComparison comparison)
{
    if (String.IsNullOrEmpty(value))
        throw new ArgumentException("the string to find may not be empty", "value");
    var indexes = new List<int>();
    for (int index = 0;; index += value.Length)
    {
        index = str.IndexOf(value, index, comparison);
        if (index == -1)
            return indexes;
        indexes.Add(index);
    }
}
```
