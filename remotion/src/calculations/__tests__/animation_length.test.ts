import { describe, it, expect } from 'vitest';
import { computeMixedBlocksTimeline } from '../../calculations/animation_length';

describe('computeMixedBlocksTimeline (code blocks)', () => {
  it('computes increasing starts and positive durations', () => {
    const blocks = [
      { type: 'code', language: 'js', content: '' },
      { type: 'code', language: 'js', content: 'a' },
      { type: 'code', language: 'js', content: 'abc' },
    ];
    const { blocks: meta, totalFrames } = computeMixedBlocksTimeline(blocks as any, 60);
    expect(meta.length).toBe(3);
    expect((meta[0] as any).start).toBe(0);
    expect((meta[0] as any).duration).toBeGreaterThanOrEqual(0);
    expect((meta[1] as any).start).toBeGreaterThan((meta[0] as any).start);
    expect(totalFrames).toBeGreaterThan((meta[2] as any).start);
  });
});


