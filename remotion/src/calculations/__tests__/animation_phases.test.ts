import { describe, it, expect } from 'vitest';
import { computeTailFrames, computePerBlockHolds, computeAdjustedHighlightHold } from '../../calculations/animation_phases';

describe('animation phases', () => {
  it('computes tail frames within min/max bounds', () => {
    const fps = 30;
    const frames = computeTailFrames(10, fps);
    expect(frames).toBeGreaterThan(0);
  });

  it('adjusts highlight hold to cover inter-block gaps', () => {
    const fps = 30;
    const added = [10, 10];
    const { highlight, tail } = computePerBlockHolds(added, fps);
    const starts = [0, 500];
    const durations = [10, 10];
    const adjusted = computeAdjustedHighlightHold(starts, durations, highlight, tail);
    expect(adjusted[0]).toBeGreaterThanOrEqual(highlight[0]);
  });
});


