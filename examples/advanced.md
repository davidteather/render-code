---
theme: dark
---

# Multi-file and Cutaways Demo

:::cutaway type=gif src="/assets/demo.gif" title="Intro GIF" width=1200
:::

:::note
This is a note block that should be ignored by the renderer.
It's useful for adding comments to the markdown that won't appear in the video.
:::

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

:::cutaway type=video src="/assets/demo.mp4" title="Full Demo Clip REAL" muted=true playToEnd=true
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

## UNIX Walkthrough (chained consoles)

:::cutaway type=console title="UNIX session" cwd="~" append=true maxHeightPx=700
pwd
~
:::

:::cutaway type=console title="UNIX session" cwd="~" append=true maxHeightPx=700
ls -la
total 0
drwxr-xr-x   7 demo   staff   224 Jan  1 00:00 .
drwxr-xr-x@ 12 demo   staff   384 Jan  1 00:00 ..
drwxr-xr-x   3 demo   staff    96 Jan  1 00:00 bin
drwxr-xr-x   3 demo   staff    96 Jan  1 00:00 projects
:::

:::cutaway type=console title="UNIX session" cwd="~" append=true maxHeightPx=700
cd projects
:::

:::cutaway type=console title="UNIX session" cwd="projects" append=true maxHeightPx=700
tree -L 1
.
├── app
└── notes
:::

:::cutaway type=console title="UNIX session" cwd="projects" append=true maxHeightPx=700
cat notes/readme.txt
Welcome to the sample project.
:::

:::cutaway type=console title="UNIX session" cwd="projects" append=true maxHeightPx=700
# Long output to verify scrolling
python - <<'PY'
for i in range(1, 121):
    print(i)
PY
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
:::



## Split Layout Demos

:::layout direction=row gap=24 sizes="40,60"
:::pane title="Current Site (image)"
:::cutaway type=image src="/assets/prem2.png" title="Website before"
:::
:::
:::pane title="Code changes"
```ts {title="src/feature.ts"}
export function toggleDarkMode(enabled: boolean) {
  document.documentElement.classList.toggle('dark', enabled);
}
```
```ts {title="src/feature.ts"}
export function toggleDarkMode(enabled: boolean) {
  const root = document.documentElement;
  root.classList.toggle('dark', enabled);
  localStorage.setItem('theme', enabled ? 'dark' : 'light');
}
```
:::
:::

:::layout direction=column gap=16 sizes="50,50"
:::pane title="Funny Image"
:::cutaway type=image src="/assets/prem3.png" title="Vibes" width=900
:::
:::
:::pane title="Terminal"
:::cutaway type=console title="Build & Start" commandLines=1 cwd="app"
pnpm build
pnpm start
:::
:::
:::


