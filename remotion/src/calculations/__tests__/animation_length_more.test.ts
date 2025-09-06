import {describe, it, expect} from 'vitest';
import {computeMixedBlocksTimeline} from '../../calculations/animation_length';

describe('computeMixedBlocksTimeline - additional cases', () => {
  it('resets diff when title changes or startFromBlank=true', () => {
    const blocks = [
      { type: 'code', language: 'js', title: 'a.js', content: 'abc' },
      { type: 'code', language: 'js', title: 'b.js', content: 'abc' }, // title change => baseline reset
      { type: 'code', language: 'js', title: 'b.js', content: 'abcd', startFromBlank: true },
    ];
    const {blocks: meta} = computeMixedBlocksTimeline(blocks as any, 60);
    const c0 = meta[0] as any;
    const c1 = meta[1] as any;
    const c2 = meta[2] as any;
    expect(c0.addedChars).toBeGreaterThanOrEqual(3);
    expect(c1.addedChars).toBeGreaterThanOrEqual(3);
    expect(c2.addedChars).toBeGreaterThanOrEqual(4);
  });

  it('assigns durations for cutaways with defaults', () => {
    const blocks = [
      { type: 'cutaway-image', src: '/x' },
      { type: 'cutaway-gif', src: '/g' },
      { type: 'cutaway-video', src: '/v' },
      { type: 'cutaway-console', content: 'echo hi\n' },
    ];
    const {blocks: meta, totalFrames} = computeMixedBlocksTimeline(blocks as any, 30);
    expect(meta.length).toBe(4);
    for (const b of meta as any[]) {
      expect(b.duration).toBeGreaterThan(0);
    }
    expect(totalFrames).toBeGreaterThan(0);
  });

  it('computes layout duration as max of inner panes', () => {
    const blocks = [
      { type: 'layout-split', direction: 'row', panes: [
        { blocks: [{ type: 'cutaway-image', src: '/a', durationSeconds: 1 }] },
        { blocks: [{ type: 'cutaway-image', src: '/b', durationSeconds: 3 }] },
      ]}
    ];
    const {blocks: meta} = computeMixedBlocksTimeline(blocks as any, 30);
    const layout = meta[0] as any;
    expect(layout.duration).toBeGreaterThanOrEqual(90); // 3s @ 30fps
  });
});


