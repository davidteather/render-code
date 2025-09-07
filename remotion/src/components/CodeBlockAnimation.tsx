
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence, spring } from 'remotion';
// import { CodeBlock } from './CodeBlock';
import { computeMixedBlocksTimeline, CodeBlockMetadata, CutawayBlockMetadata, LayoutSplitMetadata } from '../calculations/animation_length';
import { ANIMATION, THEME, ThemeConfig } from '../config';
import { CutawayRenderer } from './renderers/CutawayRenderer';
import { CodeBlockRenderer } from './renderers/CodeBlockRenderer';
import { LayoutSplit } from './layouts/LayoutSplit';
import { computePerBlockHolds, computeAdjustedHighlightHold } from '../calculations/animation_phases';
import { MetadataArtifact } from './MetadataArtifact';
import { buildMetadata } from './metadata/buildMetadata';
import type { MetadataPayload } from '../types/components';
import { buildConsoleHistory } from './helpers/consoleHistory';
import { CutawayType } from '../models';

// Holds are computed in calculations/animation_phases.ts

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

type CodeBlockAnimationProps = {
  markdown: { sections: Array<{ title: string; blocks: any[] }> };
  themeOverride?: ThemeConfig;
};

// Global interval store used for post-process cutpoint generation
type IntervalCategory = 'highlighted' | 'covered';
type Interval = { start: number; end: number; category: IntervalCategory };
(globalThis as any).__RC_INTERVALS__ = (globalThis as any).__RC_INTERVALS__ || [] as Interval[];
(globalThis as any).__RC_LAST_CUT_DETAILS__ = (globalThis as any).__RC_LAST_CUT_DETAILS__ || [] as Array<{ start: number; endOfHighlight?: number; endOfBlock: number; sequenceDuration: number; isCode: boolean }>;

const CodeBlockAnimation: React.FC<CodeBlockAnimationProps> = ({ markdown, themeOverride }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const allBlocks = markdown.sections.flatMap((s) => s.blocks);

  const { blocks, totalFrames, maxLineLengthGlobal, maxLineCountGlobal } = useMemo(
    () => computeMixedBlocksTimeline(allBlocks as any, fps),
    [allBlocks, fps]
  );

  // Base holds using extracted helpers (zero for non-code to avoid trim overhang)
  const addedChars = blocks.map((b) => (b.type === 'code' ? (b as CodeBlockMetadata).addedChars : 0));
  const rawHolds = computePerBlockHolds(addedChars, fps);
  const perBlockHighlightHoldFrames = rawHolds.highlight.map((h, i) => (blocks[i].type === 'code' ? h : 0));
  const perBlockTailFrames = rawHolds.tail.map((t, i) => (blocks[i].type === 'code' ? t : 0));
  const starts = blocks.map((b) => (b as any).start);
  const durations = blocks.map((b) => (b as any).duration);
  const adjustedHighlightHold = computeAdjustedHighlightHold(starts, durations, perBlockHighlightHoldFrames, perBlockTailFrames);

  const lastBlockCombinedTail = (() => {
    const i = blocks.length - 1;
    if (i < 0) return 15;
    const m = ANIMATION.timingMultiplier || 1;
    const factor = m > 0 ? m : 1;
    return adjustedHighlightHold[i] + perBlockTailFrames[i] + Math.round(ANIMATION.lastBlockTailBonusSeconds * factor * fps);
  })();

  // Build and store intervals once (based on computed timeline, independent of current frame)
  useMemo(() => {
    const clamp = (v: number) => Math.max(0, Math.min(totalFrames, v));
    const intervals: Interval[] = [];
    const details: Array<{ start: number; endOfHighlight?: number; endOfBlock: number; sequenceDuration: number; isCode: boolean }> = [];

    // Helper function to recursively collect all blocks including nested ones in layouts
    const collectAllBlocks = (blockList: Array<CodeBlockMetadata | CutawayBlockMetadata | LayoutSplitMetadata>): Array<{block: CodeBlockMetadata | CutawayBlockMetadata, globalStart: number, globalDuration: number, blockIndex: number, isNested?: boolean}> => {
      const result: Array<{block: CodeBlockMetadata | CutawayBlockMetadata, globalStart: number, globalDuration: number, blockIndex: number, isNested?: boolean}> = [];
      
      blockList.forEach((b, i) => {
        if (b.type === 'layout-split') {
          const layoutBlock = b as LayoutSplitMetadata;
          
          // Recursively collect blocks from all panes
          layoutBlock.panes.forEach(pane => {
            pane.blocks.forEach((innerBlock: any) => {
              if (innerBlock.type === 'code' || Object.values(CutawayType).includes(innerBlock.type)) {
                // Calculate global timing for nested block
                const globalStart = b.start + (innerBlock.start || 0);
                const globalDuration = innerBlock.duration || 0;
                result.push({
                  block: innerBlock,
                  globalStart,
                  globalDuration,
                  blockIndex: i, // Reference to parent layout
                  isNested: true
                });
              }
            });
          });
        } else {
          // Regular top-level block
          result.push({
            block: b as CodeBlockMetadata | CutawayBlockMetadata,
            globalStart: b.start,
            globalDuration: b.duration,
            blockIndex: i,
            isNested: false
          });
        }
      });
      
      return result.sort((a, b) => a.globalStart - b.globalStart);
    };

    const allBlocks = collectAllBlocks(blocks);

    allBlocks.forEach(({block, globalStart, globalDuration, blockIndex, isNested}) => {
      const start = clamp(globalStart);
      const activeDuration = Math.max(1, globalDuration);
      const isCode = block.type === 'code';
      
      // For nested blocks, use their own timing; for top-level blocks, use original logic
      const hold = isCode && !isNested ? (adjustedHighlightHold[blockIndex] ?? 0) : 0;
      const tail = isCode && !isNested ? (perBlockTailFrames[blockIndex] ?? 0) : 0;
      const highlightEnabled = isCode && ((block as any).highlight !== false);
      
      // Calculate end timing
      let endOfBlock: number;
      if (isNested) {
        // For nested blocks, use their own duration
        endOfBlock = clamp(start + activeDuration);
      } else {
        // For top-level blocks, use original logic
        const nextTopLevel = blocks[blockIndex + 1] as any | undefined;
        const desiredDuration = activeDuration + hold + tail;
        const sequenceDuration = Math.max(1, (nextTopLevel ? nextTopLevel.start - globalStart : desiredDuration));
        endOfBlock = clamp(start + sequenceDuration);
      }

      let endOfHighlight: number | undefined = undefined;
      if (highlightEnabled) {
        const highlightEndRel = activeDuration + hold;
        const rawHighlightEnd = start + Math.min(highlightEndRel, endOfBlock - start);
        const safeHighlightEnd = Math.min(rawHighlightEnd, Math.max(start, endOfBlock - 1));
        endOfHighlight = clamp(safeHighlightEnd);
        if (endOfHighlight > start) {
          intervals.push({ start, end: endOfHighlight, category: 'highlighted' });
        }
        if (endOfBlock > endOfHighlight) {
          intervals.push({ start: endOfHighlight, end: endOfBlock, category: 'covered' });
        }
      } else {
        // Handle cutaway-specific cut points
        if (block.type === 'cutaway-video' && (block as any).startSec !== undefined && (block as any).endSec !== undefined) {
          // Video cutaways with start/end should create cut points at those positions
          const videoStartFrame = start + Math.round(((block as any).startSec || 0) * fps);
          const videoEndFrame = start + Math.round(((block as any).endSec || activeDuration / fps) * fps);
          const clampedVideoStart = clamp(videoStartFrame);
          const clampedVideoEnd = clamp(Math.min(videoEndFrame, endOfBlock));
          
          if (clampedVideoStart > start) {
            intervals.push({ start, end: clampedVideoStart, category: 'covered' });
          }
          if (clampedVideoEnd > clampedVideoStart) {
            intervals.push({ start: clampedVideoStart, end: clampedVideoEnd, category: 'highlighted' });
          }
          if (endOfBlock > clampedVideoEnd) {
            intervals.push({ start: clampedVideoEnd, end: endOfBlock, category: 'covered' });
          }
        } else {
          // Entire non-highlight block (including other cutaways/layouts) is covered
          intervals.push({ start, end: endOfBlock, category: 'covered' });
        }
      }

      details.push({ start, endOfHighlight, endOfBlock, sequenceDuration: endOfBlock - start, isCode });
    });

    // Also add top-level layout containers as covered intervals
    blocks.forEach((b, i) => {
      if (b.type === 'layout-split') {
        const start = clamp(b.start);
        const next = blocks[i + 1] as any | undefined;
        const desiredDuration = b.duration;
        const sequenceDuration = Math.max(1, (next ? next.start - b.start : desiredDuration));
        const endOfBlock = clamp(start + sequenceDuration);
        
        // Only add if not already covered by nested blocks
        const hasOverlap = intervals.some(iv => iv.start < endOfBlock && iv.end > start);
        if (!hasOverlap) {
          intervals.push({ start, end: endOfBlock, category: 'covered' });
        }
      }
    });

    (globalThis as any).__RC_INTERVALS__ = intervals;
    (globalThis as any).__RC_LAST_CUT_DETAILS__ = details;
  }, [blocks, adjustedHighlightHold, perBlockTailFrames, totalFrames]);

  return (
    <>
    {frame === totalFrames - 1 && (
      <MetadataArtifact payload={buildMetadata({
        blocks,
        totalFrames,
        maxLineLengthGlobal,
        maxLineCountGlobal,
        fps,
        extraFramesPerBlock: lastBlockCombinedTail,
        trimSafetyFrames: Math.round(ANIMATION.trimSafetySeconds * fps),
        perBlockHighlightHoldFrames: adjustedHighlightHold,
        perBlockTailFrames,
        cutPoints: (() => {
          const clamp = (v: number) => Math.max(0, Math.min(totalFrames, v));
          const intervals = ((globalThis as any).__RC_INTERVALS__ as Interval[]) || [];
          const cps: number[] = [];
          if (totalFrames > 0) cps.push(0);
          let currentCategory: IntervalCategory | undefined = undefined;
          let lastEnd = 0;
          for (const iv of intervals) {
            const s = clamp(iv.start);
            const e = clamp(iv.end);
            if (e <= s) continue;
            if (s > lastEnd || currentCategory !== iv.category) {
              if (cps[cps.length - 1] !== s) cps.push(s);
              currentCategory = iv.category;
            }
            lastEnd = e;
          }
          if (cps[cps.length - 1] !== totalFrames) cps.push(totalFrames);
          // Shift 1-frame segments one frame later by incrementing BOTH surrounding cuts by +1,
          // keeping first(0) and last(totalFrames) fixed
          for (let i = 0; i < cps.length - 1; i++) {
            const segLen = cps[i + 1] - cps[i];
            if (segLen === 1) {
              const isFirstBoundary = i === 0;
              const isLastBoundary = (i + 1) === (cps.length - 1);
              if (!isFirstBoundary && !isLastBoundary && cps[i + 1] < totalFrames) {
                cps[i] = cps[i] + 1;
                cps[i + 1] = cps[i + 1] + 1;
              } else if (isFirstBoundary && !isLastBoundary && cps[i + 1] < totalFrames) {
                // Keep 0, shift the end cut by +1
                cps[i + 1] = cps[i + 1] + 1;
              } else if (!isFirstBoundary && isLastBoundary && cps[i] > 0) {
                // Keep totalFrames, shift the start cut by +1 if possible
                cps[i] = cps[i] + 1;
              }
            }
          }
          // Normalize, dedupe, clamp
          const normalize = Array.from(new Set(cps.map((v) => Math.max(0, Math.min(totalFrames, v))))).sort((a, b) => a - b);
          if (normalize[0] !== 0) normalize.unshift(0);
          if (normalize[normalize.length - 1] !== totalFrames) normalize.push(totalFrames);
          return normalize;
        })(),
        cutDetails: ((globalThis as any).__RC_LAST_CUT_DETAILS__ as any[]),
      }) as MetadataPayload} />
    )}
    <AbsoluteFill style={{ backgroundColor: (themeOverride?.stageBackground ?? THEME.stageBackground) }}>
      {(() => {
        let skipUntil = -1;
        return blocks.map((block: CodeBlockMetadata | CutawayBlockMetadata | LayoutSplitMetadata, index: number) => {
          if (index <= skipUntil) return null;
        const localFrame = frame - block.start;
        const activeDuration = block.duration;
        const isCode = block.type === 'code';
        const highlightHold = isCode ? ((((block as CodeBlockMetadata).highlight === false) ? 0 : (adjustedHighlightHold[index] ?? 20))) : 0;
        const nonHighlightTail = isCode ? (perBlockTailFrames[index] ?? 20) : 0;

        const phaseEndHighlight = activeDuration + highlightHold;
        // End each sequence exactly when the next one begins to avoid gaps/overlaps
        const next = blocks[index + 1];
        const desiredDuration = activeDuration + highlightHold + nonHighlightTail;
        const sequenceDuration = Math.max(1, (next ? next.start - block.start : desiredDuration));

        const raw = spring({
          frame: Math.min(localFrame, activeDuration),
          fps,
          durationInFrames: activeDuration,
          config: { damping: 20, stiffness: 200, mass: 0.5 }
        });

        let progress = clamp01(raw);
        if (localFrame >= activeDuration) {
          progress = 1; // freeze at fully typed during and after highlight-hold
        }
        if (isCode && block.typeFillin === false) {
          progress = 1; // show full code immediately (no typing)
        }

        const isActive = isCode
          ? (((block as CodeBlockMetadata).highlight === false) ? false : (localFrame >= 0 && localFrame < phaseEndHighlight))
          : false;

        if (block.type === 'code') {
          const prev = blocks[index - 1];
          let prevCode = '';
          if (!block.startFromBlank && prev && prev.type === 'code' && (prev as CodeBlockMetadata).title === block.title) {
            prevCode = (prev as CodeBlockMetadata).content;
          }
          return (
            <Sequence key={index} from={block.start} durationInFrames={sequenceDuration}>
              <CodeBlockRenderer
                oldCode={prevCode}
                newCode={block.content}
                language={block.language}
                progress={progress}
                isActive={isActive}
                fileName={block.title}
                maxLineLength={maxLineLengthGlobal}
                maxLineCount={maxLineCountGlobal}
              />
            </Sequence>
          );
        }

        // Layout-split container (row/column panes)
        if (block.type === 'layout-split') {
          return (
            <LayoutSplit
              key={index}
              block={block}
              sequenceDuration={sequenceDuration}
              localFrame={localFrame}
              fps={fps}
              maxLineLengthGlobal={maxLineLengthGlobal}
              maxLineCountGlobal={maxLineCountGlobal}
            />
          );
        }

        // Cutaways render without typing/highlight logic
        // Group consecutive appended consoles with same title into one sequence
        if ((block as any).type === CutawayType.Console && (block as any).append === true) {
          let end = index;
          for (let j = index + 1; j < blocks.length; j++) {
            const nb = blocks[j] as any;
            if (nb.type === CutawayType.Console && nb.append === true && nb.title === (block as any).title) {
              end = j;
              continue;
            }
            break;
          }
          skipUntil = end;
          const nextAfterChain = blocks[end + 1] as any | undefined;
          const desiredDuration = (blocks[end] as any).start + (blocks[end] as any).duration - (block as any).start;
          const chainSeqDuration = Math.max(1, (nextAfterChain ? nextAfterChain.start - (block as any).start : desiredDuration));
          const segments = [] as Array<{ command: string; output?: string; enterDelay?: number; cwd?: string; prefix?: string; prompt?: string }>;
          for (let j = index; j <= end; j++) {
            const cb = blocks[j] as any;
            const raw = String(cb.content || '');
            const lines = raw.split('\n');
            const cmdLines = Math.max(1, (cb.commandLines as number | undefined) ?? 1);
            const command = lines.slice(0, cmdLines).join('\n');
            const output = lines.slice(cmdLines).join('\n');
            segments.push({ command, output, enterDelay: cb.enterDelay, cwd: cb.cwd, prefix: cb.prefix, prompt: cb.prompt });
          }
          return (
            <Sequence key={`chain-${index}`} from={(block as any).start} durationInFrames={chainSeqDuration}>
              <CutawayRenderer
                {...(block as any)}
                segments={segments}
                isActive={true}
              />
            </Sequence>
          );
        }

        return (
          <Sequence key={index} from={block.start} durationInFrames={sequenceDuration}>
            <CutawayRenderer
              {...(block as any)}
              isActive={block.type === CutawayType.Video ? (localFrame < activeDuration) : true}
              {...(block.type === CutawayType.Console ? {
                durationFrames: activeDuration,
                frameOverride: localFrame,
                historyContent: ((block as any).append ? buildConsoleHistory(blocks as any[], index, (block as any).title) : undefined),
              } : {})}
            />
          </Sequence>
        );
        });
      })()}
    </AbsoluteFill>
    </>
  );
};

export default CodeBlockAnimation;
