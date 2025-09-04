import { diffChars } from 'diff';
import { ANIMATION } from '../config';

const instantChanges = ANIMATION.instantChanges;

export type CodeBlockMetadata = {
  content: string;
  language: string;
  start: number; // start frame of typing phase
  duration: number; // duration in frames of typing phase
  addedChars: number; // number of newly added characters in this block vs previous
};

export type AnimationPhases = {
  typingStart: number; // == start
  typingDuration: number; // == duration
  highlightHold: number; // frames to keep highlight after typing
  nonHighlightTail: number; // frames after highlight to show the static state
};

export function computeCodeBlockMetadata(allCodeBlocks: any[], fpsScale: number = 1, fps: number = 30): {
  blocks: CodeBlockMetadata[];
  totalFrames: number;
  maxLineLengthGlobal: number;
  maxLineCountGlobal: number;
} {
  let currentFrame = 0;
  const SMALL_CHARS_FAST_THRESHOLD = ANIMATION.smallCharsFastThreshold;

  const blocks = allCodeBlocks.map((block: any, index: number) => {
    const prevCode = index > 0 ? allCodeBlocks[index - 1].content : '';
    const changes = diffChars(prevCode, block.content);
    const addedChars = changes
      .filter(c => c.added)
      .reduce((a, c) => a + c.value.length, 0);

    let durationSeconds: number;
    if (instantChanges) {
      durationSeconds = 0.000001;
    } else {
      if (addedChars <= SMALL_CHARS_FAST_THRESHOLD) {
        durationSeconds = Math.max(
          ANIMATION.minDurationSmallSnippetSeconds,
          addedChars * ANIMATION.smallSnippetSecondsPerChar
        );
      } else {
        durationSeconds = Math.max(
          addedChars * ANIMATION.largeSnippetSecondsPerChar,
          ANIMATION.minDurationLargeSnippetSeconds
        );
      }
    }

    const start = currentFrame;
    // Multiplier semantics: <1 speeds up, >1 slows down
    const m = ANIMATION.timingMultiplier || 1;
    const factor = m > 0 ? m : 1; // m=0.3 → 30% time (faster), m=2 → 200% time (slower)
    const scaledDuration = Math.round(durationSeconds * factor * fps);
    const scaledTransition = Math.round(ANIMATION.transitionSeconds * factor * fps);
    currentFrame += scaledDuration + scaledTransition;

    return {
      content: block.content,
      language: block.language,
      start,
      duration: scaledDuration,
      addedChars
    };
  });

  let maxLineLengthGlobal = 0;
  let maxLineCountGlobal = 0;
  allCodeBlocks.forEach((block: any) => {
    const lines = block.content.split('\n');
    const lineCount = lines.length;
    const lineLengths = lines.map((line: any) => line.length);
    const blockMaxLineLength = Math.max(...lineLengths);
    maxLineLengthGlobal = Math.max(maxLineLengthGlobal, blockMaxLineLength);
    maxLineCountGlobal = Math.max(maxLineCountGlobal, lineCount);
  });

  return { blocks, totalFrames: currentFrame, maxLineLengthGlobal, maxLineCountGlobal };
}
