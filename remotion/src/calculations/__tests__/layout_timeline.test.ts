import {describe, it, expect} from 'vitest';
import {computeMixedBlocksTimeline} from '../animation_length';

describe('layout timeline', () => {
  it('layout-split duration equals max of pane timelines', () => {
    const allBlocks = [
      {
        type: 'layout-split',
        direction: 'row',
        gap: 24,
        panes: [
          { blocks: [{ type: 'cutaway-image', src: '/a.png', start: 0, durationSeconds: 1.0 }] },
          { blocks: [{ type: 'cutaway-image', src: '/b.png', start: 0, durationSeconds: 2.5 }] },
        ],
      },
    ] as any[];
    const {blocks, totalFrames} = computeMixedBlocksTimeline(allBlocks, 60);
    const layout = blocks[0] as any;
    expect(layout.type).toBe('layout-split');
    // Layout duration includes pane transitions (~0.67s => ~40f)
    // 2.5s * 60 = 150f + ~40f transition ≈ 190f
    expect(Math.abs(layout.duration - 190)).toBeLessThanOrEqual(2);
    expect(totalFrames).toBeGreaterThanOrEqual(layout.duration);
  });
});


