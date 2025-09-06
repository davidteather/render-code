import {describe, it, expect} from 'vitest';
import {buildConsoleHistory} from '../helpers/consoleHistory';

describe('buildConsoleHistory', () => {
  it('formats prior console commands with prompt/cwd', () => {
    const blocks = [
      { type: 'cutaway-console', title: 'Term', content: 'echo hi\nworld', commandLines: 1, prompt: '$', cwd: 'proj' },
      { type: 'cutaway-console', title: 'Other', content: 'ignored' },
    ];
    const out = buildConsoleHistory(blocks as any, 2, 'Term');
    expect(out).toContain('proj $ echo hi');
    expect(out).toContain('world');
  });
});


