import { ANIMATION } from '../config';

export type PhaseTimings = {
  highlightHold: number;
  nonHighlightTail: number;
  lastBlockCombinedTail: number;
};

export function computeTailFrames(addedChars: number, fps: number): number {
  const m = ANIMATION.timingMultiplier || 1;
  const factor = m > 0 ? m : 1;
  const minHold = Math.round(ANIMATION.tailHoldMinSeconds * factor * fps);
  const maxHold = Math.round(ANIMATION.tailHoldMaxSeconds * factor * fps);
  const scaled = Math.round(
    (ANIMATION.tailHoldScaleBaseSeconds + addedChars * ANIMATION.tailHoldScaleSecondsPerChar) * factor * fps
  );
  return Math.max(minHold, Math.min(maxHold, scaled));
}

export function computePerBlockHolds(blockAddedChars: number[], fps: number): { highlight: number[]; tail: number[] } {
  const base = blockAddedChars.map((ac) => Math.round(computeTailFrames(ac, fps) * 1.3));
  return { highlight: base, tail: base };
}

export function computeAdjustedHighlightHold(
  starts: number[], durations: number[], highlightHolds: number[], tailHolds: number[]
): number[] {
  return highlightHolds.map((hold, i) => {
    const nextStart = starts[i + 1];
    if (nextStart == null) return hold;
    const interBlockGap = Math.max(0, nextStart - (starts[i] + durations[i]));
    const combined = hold + tailHolds[i];
    if (combined >= interBlockGap) return hold;
    const deficit = interBlockGap - combined;
    return hold + deficit;
  });
}


