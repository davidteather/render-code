import {describe, it, expect} from 'vitest';
import {computeMixedBlocksTimeline} from '../animation_length';

describe('layout timeline more cases', () => {
  it('duration equals max pane durations with staggered inner starts', () => {
    const layoutBlock: any = {
      type: 'layout-split', direction: 'row', panes: [
        { blocks: [ { type: 'code', language: 'ts', content: 'a' }, { type: 'code', language: 'ts', content: 'ab' } ] },
        { blocks: [ { type: 'cutaway-console', content: 'echo hi', duration: 100 } ] }
      ]
    };
    const { blocks: meta } = computeMixedBlocksTimeline([layoutBlock], 60);
    const layout = meta[0] as any;
    expect(layout.type).toBe('layout-split');
    // Expected equals the max of pane totalFrames reported by metadata
    const paneDurations = layout.panes.map((p: any) => p.totalFrames);
    const expected = Math.max(...paneDurations);
    expect(layout.duration).toBe(expected);
  });
});


