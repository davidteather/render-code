import { diffChars } from 'diff';
import { ANIMATION } from '../config';

const instantChanges = ANIMATION.instantChanges;

export type CodeBlockMetadata = {
  type: 'code';
  content: string;
  language: string;
  title?: string;
  highlight?: boolean;
  typeFillin?: boolean;
  startFromBlank?: boolean;
  start: number; // start frame of typing phase
  duration: number; // duration in frames of typing phase
  addedChars: number; // number of newly added characters in this block vs previous
};

export type CutawayBlockMetadata =
  | ({ type: 'cutaway-image'; src: string; title?: string; width?: number; height?: number } & { start: number; duration: number; addedChars: 0 })
  | ({ type: 'cutaway-video'; src: string; title?: string; startSec?: number; endSec?: number; width?: number; height?: number; muted?: boolean } & { start: number; duration: number; addedChars: 0 })
  | ({ type: 'cutaway-console'; content: string; title?: string; prompt?: string; commandLines?: number; commandCps?: number; outputCps?: number; enterDelay?: number; showPrompt?: boolean } & { start: number; duration: number; addedChars: 0 });

export type AnimationPhases = {
  typingStart: number; // == start
  typingDuration: number; // == duration
  highlightHold: number; // frames to keep highlight after typing
  nonHighlightTail: number; // frames after highlight to show the static state
};

export function computeMixedBlocksTimeline(allBlocks: any[], fps: number = 30): {
  blocks: Array<CodeBlockMetadata | CutawayBlockMetadata>;
  totalFrames: number;
  maxLineLengthGlobal: number;
  maxLineCountGlobal: number;
} {
  let currentFrame = 0;
  const SMALL_CHARS_FAST_THRESHOLD = ANIMATION.smallCharsFastThreshold;
  const m = ANIMATION.timingMultiplier || 1;
  const factor = m > 0 ? m : 1;
  const transitionFrames = Math.round(ANIMATION.transitionSeconds * factor * fps);
  const defaultCutawaySeconds = 1.5; // legacy fallback; specific types have better defaults

  // Track previous code content for diffs across only code blocks
  let previousCodeContent = '';
  let previousTitle: string | undefined = undefined;

  const blocks = allBlocks.map((block: any) => {
    if (block.type === 'code') {
      const prevCode = previousCodeContent;
      // Reset baseline if title changed or explicit startFromBlank flag present
      const effectiveStartBlank = block.startFromBlank === true || (block.title && block.title !== previousTitle);
      const baseline = effectiveStartBlank ? '' : prevCode;
      const changes = diffChars(baseline, block.content);
      const addedChars = changes.filter((c) => c.added).reduce((a, c) => a + c.value.length, 0);

      let durationSeconds: number;
      if (instantChanges) {
        durationSeconds = 0.000001;
      } else if (addedChars <= SMALL_CHARS_FAST_THRESHOLD) {
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

      const start = currentFrame;
      const scaledDuration = Math.round(durationSeconds * factor * fps);
      currentFrame += scaledDuration + transitionFrames;
      previousCodeContent = block.content;
      previousTitle = block.title;

      const out: CodeBlockMetadata = {
        type: 'code',
        content: block.content,
        language: block.language || 'plaintext',
        title: block.title,
        highlight: typeof block.highlight === 'boolean' ? block.highlight : undefined,
        typeFillin: typeof block.typeFillin === 'boolean' ? block.typeFillin : undefined,
        startFromBlank: effectiveStartBlank ? true : undefined,
        start,
        duration: scaledDuration,
        addedChars,
      };
      return out;
    }

    // Cutaways
    const start = currentFrame;
    let seconds = (block.durationSeconds as number | undefined) ?? defaultCutawaySeconds;

    // Dynamic duration for console based on content length and configured speeds
    if (block.type === 'cutaway-console' && (block.durationSeconds === undefined || block.durationSeconds === null)) {
      const rawContent = String(block.content || '');
      const lines = rawContent.split('\n');
      const commandLines = Math.max(1, (block.commandLines as number | undefined) ?? 1);
      const command = lines.slice(0, commandLines).join('\n');
      const output = lines.slice(commandLines).join('\n');

      const commandCps = (block.commandCps as number | undefined) ?? ANIMATION.consoleCommandCharsPerSecond;
      const outputCps = (block.outputCps as number | undefined) ?? ANIMATION.consoleOutputCharsPerSecond;
      const enterDelay = (block.enterDelay as number | undefined) ?? ANIMATION.consoleEnterDelaySeconds;

      const cmdSeconds = command.length > 0 ? command.length / Math.max(1, commandCps) : 0;
      const outSeconds = output.length > 0 ? output.length / Math.max(1, outputCps) : 0;
      // Small floor so an empty output still shows briefly
      const minVisibleSeconds = 0.4;
      seconds = Math.max(minVisibleSeconds, cmdSeconds + enterDelay + outSeconds);
    }

    // Type-specific defaults if not explicitly provided
    if (block.type === 'cutaway-image' && (block.durationSeconds === undefined || block.durationSeconds === null)) {
      seconds = ANIMATION.imageDefaultSeconds;
    }
    if (block.type === 'cutaway-video' && (block.durationSeconds === undefined || block.durationSeconds === null)) {
      if (typeof block.start === 'number' && typeof block.end === 'number' && block.end > block.start) {
        seconds = block.end - block.start;
      } else if (block.playToEnd === true) {
        seconds = ANIMATION.videoPlayToEndFallbackSeconds;
      } else {
        seconds = ANIMATION.videoDefaultSeconds;
      }
    }

    const duration = Math.round(seconds * factor * fps);
    currentFrame += duration + transitionFrames;

    if (block.type === 'cutaway-image') {
      const out: CutawayBlockMetadata = {
        type: 'cutaway-image',
        src: String(block.src || ''),
        title: block.title,
        width: typeof block.width === 'number' ? block.width : undefined,
        height: typeof block.height === 'number' ? block.height : undefined,
        start,
        duration,
        addedChars: 0,
      } as any;
      return out;
    }

    if (block.type === 'cutaway-video') {
      const out: CutawayBlockMetadata = {
        type: 'cutaway-video',
        src: String(block.src || ''),
        title: block.title,
        startSec: typeof block.start === 'number' ? block.start : undefined,
        endSec: typeof block.end === 'number' ? block.end : undefined,
        width: typeof block.width === 'number' ? block.width : undefined,
        height: typeof block.height === 'number' ? block.height : undefined,
        muted: block.muted === true,
        start,
        duration,
        addedChars: 0,
      } as any;
      return out;
    }

    // console
    const out: CutawayBlockMetadata = {
      type: 'cutaway-console',
      content: String(block.content || ''),
      title: block.title,
      prompt: block.prompt,
      commandLines: block.commandLines,
      commandCps: block.commandCps,
      outputCps: block.outputCps,
      enterDelay: block.enterDelay,
      showPrompt: block.showPrompt,
      start,
      duration,
      addedChars: 0,
    } as any;
    return out;
  });

  // Compute global sizing based on code blocks only
  let maxLineLengthGlobal = 0;
  let maxLineCountGlobal = 0;
  allBlocks.forEach((block: any) => {
    if (block.type !== 'code') return;
    const lines = String(block.content || '').split('\n');
    const lineCount = lines.length;
    const lineLengths = lines.map((line: any) => line.length);
    const blockMaxLineLength = Math.max(...lineLengths, 0);
    maxLineLengthGlobal = Math.max(maxLineLengthGlobal, blockMaxLineLength);
    maxLineCountGlobal = Math.max(maxLineCountGlobal, lineCount);
  });

  return { blocks, totalFrames: currentFrame, maxLineLengthGlobal, maxLineCountGlobal };
}
