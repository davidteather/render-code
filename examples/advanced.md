---
theme: dark
---

# Multi-file and Cutaways Demo

```python {title="app.py"}
print("Hello")
```

```python {title="app.py"}
print("Hello, world!")
```

```ts {title="src/index.ts"}
export const add = (a: number, b: number) => a + b;
```

```ts {title="src/index.ts" start_from_blank=true}
// should start from blank and get typed out
export const sub = (a: number, b: number) => a - b;
```

```ts {title="src/index.ts" highlight=false type_fillin=false}
export const mul = (a: number, b: number) => a * b;

// this shouldnt get typed in at all
export const div = (a: number, b: number) => a / b;
```

:::cutaway type=image src="/assets/prem1.png" title="Architecture Overview" width=1600
:::

:::cutaway type=console title="Run tests (custom prompt and speeds)" prompt="(venv) ➜ app %" commandLines=1 commandCps=10 outputCps=400 enterDelay=0.15 showPrompt=true
pnpm test
> PASS src/index.test.ts
:::

:::cutaway type=video src="/assets/demo.mp4" title="Demo Clip" start=2 end=7 muted=true
:::

```python {title="app.py"}
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("Remotion"))
```

:::cutaway type=video src="/assets/demo.mp4" title="Full Demo Clip" muted=true
:::

```go {title="src/index.go"}
package main
```

```go {title="src/index.go"}
package main

func main() {
    fmt.Println("Hello, World!")
}
```

:::cutaway type=video src="/assets/demo.mp4" title="Full Demo Clip" muted=true playToEnd=true
:::



## Console Cutaway Tests

:::cutaway type=console title="Default behavior (prompt $, 1 command line)"
Default prompt and speeds; output reveals quickly after Enter.
echo "hi"
hi
:::

:::cutaway type=console title="Custom prompt, hide prompt" prompt="user@host:~$" showPrompt=false
Prompt hidden; should type command without prefix.
ls -1
file.txt
:::

:::cutaway type=console title="Two command lines (multiline command)" commandLines=2
Second line is part of the command; output appears after both are typed.
python - <<'PY'
print('ok')
PY
ok
:::

:::cutaway type=console title="Very fast output, slower typing" commandCps=6 outputCps=800 enterDelay=0.1
Typing should be noticeably slower; output almost instant.
grep -R "todo" src/
src/a.ts: // TODO: refactor
src/b.ts: // TODO: add tests
:::

:::cutaway type=console title="Long enter delay" enterDelay=0.8
Noticeable pause between typing and output.
uname -a
Darwin host.local 24.6.0 x86_64
:::

:::cutaway type=console title="Empty output (command only)"
Only the typed command; no output should follow.
echo done
:::


