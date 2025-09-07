---
theme: dark
---

# Render Code

:::cutaway type=gif src="/assets/demo.gif" title="Make code videos from Markdown" width=1500 duration=2.8
:::

:::cutaway type=image src="/assets/prem1.png" title="Diffs animate. Consoles type. Layouts split." width=1600 duration=2.4
:::

```ts {title="index.ts" start_from_blank=true}
export const hello = (name: string) => `Hi, ${name}!`;
```

```ts {title="index.ts"}
export const hello = (name: string) => `Hello, ${name}!`;
```

:::cutaway type=console title="Render now" commandLines=1 commandCps=16 outputCps=480 enterDelay=0.1 prompt="➜ render-code %" showPrompt=true
python main.py render examples/trailor.md
> Writing 4K/60 composition…
:::

:::cutaway type=video src="/assets/demo.mp4" title="B-roll" start=1 end=3 muted=true
:::

:::layout direction=row gap=20 sizes="50,50"
:::pane title="Before"
:::cutaway type=image src="/assets/prem2.png" title="Before"
:::
:::pane title="Code"
```ts {title="feature.ts"}
document.documentElement.classList.toggle('dark', true);
```
:::
:::

:::cutaway type=image src="/assets/prem3.png" title="Try it: python main.py render examples/trailor.md" width=1300 duration=2.5
:::


