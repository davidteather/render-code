import {describe, it, expect} from 'vitest';
import {parseMarkdownString} from '../parseMarkdown';

describe('parseMarkdown - code fence flags and info string', () => {
  it('parses lang:{...} attributes into code block flags', () => {
    const md = [
      '```ts:{title="app.ts", highlight=false, type_fillin=false, start_from_blank=true}',
      'console.log(1)',
      '```',
    ].join('\n');
    const parsed = parseMarkdownString(md);
    const block = parsed.sections[0].blocks[0] as any;
    expect(block.type).toBe('code');
    expect(block.language).toBe('ts');
    expect(block.title).toBe('app.ts');
    expect(block.highlight).toBe(false);
    expect(block.typeFillin).toBe(false);
    expect(block.startFromBlank).toBe(true);
  });

  // Legacy lang:path syntax removed; ensure it no longer sets title implicitly
  it('does not infer title from legacy lang:path; requires explicit title attr', () => {
    const md = [
      '```js:src/index.js',
      'console.log(1)',
      '```',
    ].join('\n');
    // Allow deprecation warning without failing the test
    const orig = (process as any).env.SKIP_WARNINGS;
    (process as any).env.SKIP_WARNINGS = '1';
    const parsed = parseMarkdownString(md);
    if (orig) (process as any).env.SKIP_WARNINGS = orig; else delete (process as any).env.SKIP_WARNINGS;
    const block = parsed.sections[0].blocks[0] as any;
    expect(block.type).toBe('code');
    expect(block.language).toBe('js');
    expect(block.title).toBeUndefined();
  });

  it('parses console directive with boolean attributes', () => {
    const md = [
      ':::cutaway type=console showPrompt=false commandLines=2',
      'echo hello',
      'world',
      'output',
      ':::',
    ].join('\n');
    const parsed = parseMarkdownString(md);
    const block = parsed.sections[0].blocks[0] as any;
    expect(block.type).toBe('cutaway-console');
    expect(block.showPrompt).toBe(false);
    expect(block.commandLines).toBe(2);
  });
});


