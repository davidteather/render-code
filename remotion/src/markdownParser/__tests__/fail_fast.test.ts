import {describe, it, expect} from 'vitest';
import {parseMarkdownString} from '../parseMarkdown';

describe('parser fail-fast on warnings', () => {
  const orig = process.env.SKIP_WARNINGS;
  it('throws when warnings exist and SKIP_WARNINGS not set', () => {
    delete process.env.SKIP_WARNINGS;
    const md = [
      '::::cutaway type=image src="/assets/prem1.png"',
      ':::'
    ].join('\n');
    expect(() => parseMarkdownString(md)).toThrowError(/fail-fast/);
  });
  it('does not throw when SKIP_WARNINGS=1', () => {
    process.env.SKIP_WARNINGS = '1';
    const md = [
      '::::cutaway type=image src="/assets/prem1.png"',
      ':::'
    ].join('\n');
    expect(() => parseMarkdownString(md)).not.toThrow();
    if (orig) process.env.SKIP_WARNINGS = orig; else delete process.env.SKIP_WARNINGS;
  });
});


