export function buildConsoleHistory(blocks: any[], untilIndex: number, title: string | undefined): string {
  let history = '';
  for (let k = 0; k < untilIndex; k++) {
    const prev = blocks[k] as any;
    if (prev.type === 'cutaway-console' && prev.title === title) {
      const raw = String(prev.content || '');
      const lines = raw.split('\n');
      const cmdLines = Math.max(1, (prev.commandLines as number | undefined) ?? 1);
      const command = lines.slice(0, cmdLines).join('\n');
      const output = lines.slice(cmdLines).join('\n');
      const promptLabel = buildPrompt(prev.cwd, prev.prompt, prev.prefix);
      const transcript = `${promptLabel} ${command}` + (output ? `\n${output}` : '');
      history += (history ? '\n' : '') + transcript;
    }
  }
  return history;
}

export function buildPrompt(cwd?: string, prompt?: string, prefix?: string): string {
  if (prefix) return String(prefix);
  const basePrompt = String((prompt ?? '$'));
  if (cwd) return `${cwd} ${basePrompt}`;
  return basePrompt;
}


