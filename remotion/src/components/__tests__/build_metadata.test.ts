import {describe, it, expect} from 'vitest';
import {buildMetadata} from '../metadata/buildMetadata';

describe('buildMetadata', () => {
  it('returns a stable, serializable metadata object', () => {
    const payload = buildMetadata({
      blocks: [
        { type: 'cutaway-image', src: '/a', start: 0, duration: 30, addedChars: 0 },
      ] as any,
      totalFrames: 120,
      maxLineLengthGlobal: 80,
      maxLineCountGlobal: 20,
      fps: 60,
      extraFramesPerBlock: 15,
      trimSafetyFrames: 6,
      perBlockHighlightHoldFrames: [0],
      perBlockTailFrames: [0],
    });
    const s = JSON.stringify(payload);
    const parsed = JSON.parse(s);
    expect(parsed.totalFrames).toBe(120);
    expect(parsed.fps).toBe(60);
    expect(Array.isArray(parsed.blocks)).toBe(true);
  });
});


