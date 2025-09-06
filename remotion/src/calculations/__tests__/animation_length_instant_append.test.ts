import {describe, it, expect} from 'vitest';
import {computeMixedBlocksTimeline} from '../../calculations/animation_length';

describe('timeline options and console append transitions', () => {
  it('instantChangesOverride yields near-zero durations for typing', () => {
    const blocks = [
      { type: 'code', language: 'js', content: 'abcdef' },
      { type: 'code', language: 'js', content: 'abcdefgh' },
    ];
    const {blocks: meta} = computeMixedBlocksTimeline(blocks as any, 60, { instantChangesOverride: true });
    expect((meta[0] as any).duration).toBeLessThanOrEqual(1);
    expect((meta[1] as any).duration).toBeLessThanOrEqual(1);
  });

  it('console append chain reduces transition frames between consecutive consoles', () => {
    const blocks = [
      { type: 'cutaway-console', content: 'echo 1' },
      { type: 'cutaway-console', content: 'echo 2', append: true },
      { type: 'cutaway-console', content: 'echo 3', append: true },
    ];
    const {blocks: meta} = computeMixedBlocksTimeline(blocks as any, 30);
    const b0 = meta[0] as any;
    const b1 = meta[1] as any;
    const b2 = meta[2] as any;
    // Starts should equal previous start+duration plus small or zero transition for appended consoles
    expect(b1.start - (b0.start + b0.duration)).toBeLessThanOrEqual(8); // small inter-gap (<= 8 frames)
    expect(b2.start - (b1.start + b1.duration)).toBeLessThanOrEqual(8);
  });
});


