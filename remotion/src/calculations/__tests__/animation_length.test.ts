import { describe, it, expect } from 'vitest';
import { computeCodeBlockMetadata } from '../../calculations/animation_length';

describe('computeCodeBlockMetadata', () => {
  it('computes increasing starts and positive durations', () => {
    const blocks = [
      { language: 'js', content: 'a' },
      { language: 'js', content: 'ab' },
      { language: 'js', content: 'abc' },
    ];
    const { blocks: meta, totalFrames } = computeCodeBlockMetadata(blocks, 1, 30);
    expect(meta.length).toBe(3);
    expect(meta[0].start).toBe(0);
    expect(meta[0].duration).toBeGreaterThan(0);
    expect(meta[1].start).toBeGreaterThan(meta[0].start);
    expect(totalFrames).toBeGreaterThan(meta[2].start);
  });
});


