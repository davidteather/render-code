import {describe, it, expect} from 'vitest';
import {parseMarkdownString} from '../parseMarkdown';

describe('parser warnings for unclosed fences', () => {
  it('throws when unclosed code fence and SKIP_WARNINGS not set', () => {
    delete (process as any).env.SKIP_WARNINGS;
    const md = '```js\nconst x = 1;';
    expect(() => parseMarkdownString(md)).toThrowError(/fail-fast/);
  });

  it('does not throw when SKIP_WARNINGS=1', () => {
    (process as any).env.SKIP_WARNINGS = '1';
    const md = '```js\nconst x = 1;';
    expect(() => parseMarkdownString(md)).not.toThrow();
    delete (process as any).env.SKIP_WARNINGS;
  });
});


