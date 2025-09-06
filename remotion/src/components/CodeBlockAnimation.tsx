
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

// Holds are computed in calculations/animation_phases.ts

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

type CodeBlockAnimationProps = {
  markdown: { sections: Array<{ title: string; blocks: any[] }> };
  themeOverride?: ThemeConfig;
};

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

  return (
    <>
    {frame === 0 && (
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
        // Special handling: group consecutive appended consoles with same title into one sequence
        if ((block as any).type === 'cutaway-console' && (block as any).append === true) {
          let end = index;
          for (let j = index + 1; j < blocks.length; j++) {
            const nb = blocks[j] as any;
            if (nb.type === 'cutaway-console' && nb.append === true && nb.title === (block as any).title) {
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
              isActive={block.type === 'cutaway-video' ? (localFrame < activeDuration) : isActive}
              {...(block.type === 'cutaway-console' ? {
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
