import {describe, it, expect} from 'vitest';
import {buildMetadata} from '../metadata/buildMetadata';

describe('metadata versioning', () => {
  it('includes specVersion and generatorVersion', () => {
    const meta = buildMetadata({
      blocks: [] as any,
      totalFrames: 0,
      maxLineLengthGlobal: 0,
      maxLineCountGlobal: 0,
      fps: 60,
      extraFramesPerBlock: 0,
      trimSafetyFrames: 0,
      perBlockHighlightHoldFrames: [],
      perBlockTailFrames: [],
    });
    expect(meta.specVersion).toBeTypeOf('string');
    expect(meta.generatorVersion).toBeTypeOf('string');
  });
});


