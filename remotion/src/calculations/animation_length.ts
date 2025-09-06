import { diffChars } from 'diff';
import { ANIMATION } from '../config';
import { ParsedBlock, TypedCodeBlock, CutawayConsoleBlock, CutawayGifBlock, CutawayImageBlock, CutawayVideoBlock, LayoutSplitBlock, CutawayType } from '../models';

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
  | ({ type: 'cutaway-gif'; src: string; title?: string; width?: number; height?: number } & { start: number; duration: number; addedChars: 0 })
  | ({ type: 'cutaway-video'; src: string; title?: string; startSec?: number; endSec?: number; width?: number; height?: number; muted?: boolean } & { start: number; duration: number; addedChars: 0 })
  | ({ type: 'cutaway-console'; content: string; title?: string; prompt?: string; commandLines?: number; commandCps?: number; outputCps?: number; enterDelay?: number; showPrompt?: boolean; cwd?: string; prefix?: string; maxHeightPx?: number; append?: boolean } & { start: number; duration: number; addedChars: 0 });

export type LayoutSplitPaneMetadata = {
  blocks: Array<CodeBlockMetadata | CutawayBlockMetadata>;
  totalFrames: number;
};

export type LayoutSplitMetadata = {
  type: 'layout-split';
  direction: 'row' | 'column';
  gap?: number;
  sizes?: number[];
  panes: LayoutSplitPaneMetadata[];
  start: number;
  duration: number;
  addedChars: 0;
};

export type AnimationPhases = {
  typingStart: number; // == start
  typingDuration: number; // == duration
  highlightHold: number; // frames to keep highlight after typing
  nonHighlightTail: number; // frames after highlight to show the static state
};

export function computeMixedBlocksTimeline(allBlocks: ParsedBlock[], fps: number = 30, options?: { instantChangesOverride?: boolean }): {
  blocks: Array<CodeBlockMetadata | CutawayBlockMetadata | LayoutSplitMetadata>;
  totalFrames: number;
  maxLineLengthGlobal: number;
  maxLineCountGlobal: number;
} {
  let currentFrame = 0;
  const SMALL_CHARS_FAST_THRESHOLD = ANIMATION.smallCharsFastThreshold;
  const m = ANIMATION.timingMultiplier || 1;
  const factor = m > 0 ? m : 1;
  let transitionFrames = ANIMATION.disableTransitions ? 0 : Math.round(ANIMATION.transitionSeconds * factor * fps);
  const defaultCutawaySeconds = 1.5; // legacy fallback; specific types have better defaults

  // Track previous code content for diffs across only code blocks
  let previousCodeContent = '';
  let previousTitle: string | undefined = undefined;

  const blocks = allBlocks.map((block) => {
    // Reduce or remove transition when chaining console cutaways for smoother back-to-back
    const isConsole = block.type === CutawayType.Console;
    const isAppendedConsole = isConsole && (block.append === true);
    const localTransitionFrames = isAppendedConsole
      ? 0
      : (isConsole ? Math.round((ANIMATION.transitionSeconds * 0.35) * factor * fps) : transitionFrames);
    if (block.type === 'code') {
      const codeBlock = block as TypedCodeBlock;
      const prevCode = previousCodeContent;
      // Reset baseline if title changed or explicit startFromBlank flag present
      const effectiveStartBlank = codeBlock.startFromBlank === true || (codeBlock.title && codeBlock.title !== previousTitle);
      const baseline = effectiveStartBlank ? '' : prevCode;
      const changes = diffChars(baseline, codeBlock.content);
      const addedChars = changes.filter((c) => c.added).reduce((a, c) => a + c.value.length, 0);

      let durationSeconds: number;
      if (options?.instantChangesOverride ?? instantChanges) {
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

      const preRoll = Math.max(0, ANIMATION.codePreRollFrames || 0);
      const start = currentFrame + preRoll;
      const scaledDuration = Math.round(durationSeconds * factor * fps);
      currentFrame += preRoll + scaledDuration + transitionFrames;
      previousCodeContent = codeBlock.content;
      previousTitle = codeBlock.title;

      const out: CodeBlockMetadata = {
        type: 'code',
        content: codeBlock.content,
        language: codeBlock.language || 'plaintext',
        title: codeBlock.title,
        highlight: typeof codeBlock.highlight === 'boolean' ? codeBlock.highlight : undefined,
        typeFillin: typeof codeBlock.typeFillin === 'boolean' ? codeBlock.typeFillin : undefined,
        startFromBlank: effectiveStartBlank ? true : undefined,
        start,
        duration: scaledDuration,
        addedChars,
      };
      return out;
    }

    // Layout split: compute nested pane timelines and take max duration
    if (block.type === 'layout-split') {
      const layout = block as LayoutSplitBlock;
      const start = currentFrame;
      const panes: LayoutSplitPaneMetadata[] = [];
      let maxPaneFrames = 0;
      const paneArray: Array<{ blocks: ParsedBlock[] }> = Array.isArray(layout.panes) ? layout.panes : [];
      for (const pane of paneArray) {
        const inner = computeMixedBlocksTimeline(Array.isArray(pane.blocks) ? pane.blocks : [], fps);
        panes.push({ blocks: inner.blocks as Array<CodeBlockMetadata | CutawayBlockMetadata>, totalFrames: inner.totalFrames });
        // Use pane totalFrames (includes transitions) so layout persists until inner transitions finish
        maxPaneFrames = Math.max(maxPaneFrames, inner.totalFrames);
      }
      // Persist layout on screen for the longest inner pane timeline
      const duration = maxPaneFrames;
      currentFrame += duration + transitionFrames;
      const out: LayoutSplitMetadata = {
        type: 'layout-split',
        direction: (layout.direction === 'column' ? 'column' : 'row'),
        gap: typeof layout.gap === 'number' ? layout.gap : undefined,
        sizes: Array.isArray(layout.sizes) ? layout.sizes : undefined,
        panes,
        start,
        duration,
        addedChars: 0,
      };
      return out;
    }

    // Cutaways
    const start = currentFrame;
    let seconds = (block as CutawayImageBlock | CutawayGifBlock | CutawayVideoBlock | CutawayConsoleBlock).durationSeconds ?? defaultCutawaySeconds;

    // Dynamic duration for console based on content length and configured speeds
    if (block.type === 'cutaway-console' && ((block as CutawayConsoleBlock).durationSeconds === undefined || (block as CutawayConsoleBlock).durationSeconds === null)) {
      const consoleBlock = block as CutawayConsoleBlock;
      const rawContent = String(consoleBlock.content || '');
      const lines = rawContent.split('\n');
      const commandLines = Math.max(1, (consoleBlock.commandLines as number | undefined) ?? 1);
      const command = lines.slice(0, commandLines).join('\n');
      const output = lines.slice(commandLines).join('\n');

      const commandCps = (consoleBlock.commandCps as number | undefined) ?? ANIMATION.consoleCommandCharsPerSecond;
      const outputCps = (consoleBlock.outputCps as number | undefined) ?? ANIMATION.consoleOutputCharsPerSecond;
      const enterDelay = (consoleBlock.enterDelay as number | undefined) ?? ANIMATION.consoleEnterDelaySeconds;

      const cmdSeconds = command.length > 0 ? command.length / Math.max(1, commandCps) : 0;
      const outSeconds = output.length > 0 ? output.length / Math.max(1, outputCps) : 0;
      // If there is no output, add a small tail to hang on the typed command
      const commandOnlyTail = output.length === 0 ? ANIMATION.consoleCommandOnlyTailSeconds : 0;
      const globalTail = (consoleBlock.append === true) ? 0 : (ANIMATION.consoleGlobalTailSeconds || 0);
      // Small floor so an empty output still shows briefly
      const minVisibleSeconds = 0.4;
      seconds = Math.max(minVisibleSeconds, cmdSeconds + enterDelay + outSeconds + commandOnlyTail + globalTail);
    }

    // Type-specific defaults if not explicitly provided
    if (block.type === CutawayType.Image && ((block as CutawayImageBlock).durationSeconds === undefined || (block as CutawayImageBlock).durationSeconds === null)) {
      seconds = ANIMATION.imageDefaultSeconds;
    }
    if (block.type === CutawayType.Gif && ((block as CutawayGifBlock).durationSeconds === undefined || (block as CutawayGifBlock).durationSeconds === null)) {
      seconds = ANIMATION.imageDefaultSeconds;
    }
    if (block.type === CutawayType.Video && ((block as CutawayVideoBlock).durationSeconds === undefined || (block as CutawayVideoBlock).durationSeconds === null)) {
      const videoBlock = block as CutawayVideoBlock;
      if (typeof videoBlock.start === 'number' && typeof videoBlock.end === 'number' && videoBlock.end > videoBlock.start) {
        seconds = videoBlock.end - videoBlock.start;
      } else if (videoBlock.playToEnd === true) {
        seconds = ANIMATION.videoPlayToEndFallbackSeconds;
      } else {
        seconds = ANIMATION.videoDefaultSeconds;
      }
    }

    const duration = Math.round(seconds * factor * fps);
    currentFrame += duration + localTransitionFrames;

    if (block.type === CutawayType.Image) {
      const imageBlock = block as CutawayImageBlock;
      const out: CutawayBlockMetadata = {
        type: 'cutaway-image',
        src: String(imageBlock.src || ''),
        title: imageBlock.title,
        width: typeof imageBlock.width === 'number' ? imageBlock.width : undefined,
        height: typeof imageBlock.height === 'number' ? imageBlock.height : undefined,
        start,
        duration,
        addedChars: 0,
      };
      return out;
    }

    if (block.type === CutawayType.Gif) {
      const gifBlock = block as CutawayGifBlock;
      const out: CutawayBlockMetadata = {
        type: 'cutaway-gif',
        src: String(gifBlock.src || ''),
        title: gifBlock.title,
        width: typeof gifBlock.width === 'number' ? gifBlock.width : undefined,
        height: typeof gifBlock.height === 'number' ? gifBlock.height : undefined,
        start,
        duration,
        addedChars: 0,
      };
      return out;
    }

    if (block.type === CutawayType.Video) {
      const videoBlock = block as CutawayVideoBlock;
      const out: CutawayBlockMetadata = {
        type: 'cutaway-video',
        src: String(videoBlock.src || ''),
        title: videoBlock.title,
        startSec: typeof videoBlock.start === 'number' ? videoBlock.start : undefined,
        endSec: typeof videoBlock.end === 'number' ? videoBlock.end : undefined,
        width: typeof videoBlock.width === 'number' ? videoBlock.width : undefined,
        height: typeof videoBlock.height === 'number' ? videoBlock.height : undefined,
        muted: videoBlock.muted === true,
        start,
        duration,
        addedChars: 0,
      };
      return out;
    }

    // console
    const consoleBlock = block as CutawayConsoleBlock;
    const out: CutawayBlockMetadata = {
      type: 'cutaway-console',
      content: String(consoleBlock.content || ''),
      title: consoleBlock.title,
      prompt: consoleBlock.prompt,
      commandLines: consoleBlock.commandLines,
      commandCps: consoleBlock.commandCps,
      outputCps: consoleBlock.outputCps,
      enterDelay: consoleBlock.enterDelay,
      showPrompt: consoleBlock.showPrompt,
      cwd: consoleBlock.cwd,
      prefix: consoleBlock.prefix,
      maxHeightPx: consoleBlock.maxHeightPx,
      append: consoleBlock.append === true,
      start,
      duration,
      addedChars: 0,
    };
    return out;
  });

  // Compute global sizing based on code blocks only
  let maxLineLengthGlobal = 0;
  let maxLineCountGlobal = 0;
  allBlocks.forEach((block) => {
    if (block.type !== 'code') return;
    const codeBlock = block as TypedCodeBlock;
    const lines = String(codeBlock.content || '').split('\n');
    const lineCount = lines.length;
    const lineLengths = lines.map((line) => line.length);
    const blockMaxLineLength = Math.max(...lineLengths, 0);
    maxLineLengthGlobal = Math.max(maxLineLengthGlobal, blockMaxLineLength);
    maxLineCountGlobal = Math.max(maxLineCountGlobal, lineCount);
  });

  return { blocks, totalFrames: currentFrame, maxLineLengthGlobal, maxLineCountGlobal };
}
