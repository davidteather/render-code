
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence, spring, Artifact } from 'remotion';
import { CodeBlock } from './CodeBlock';
import { computeMixedBlocksTimeline } from '../calculations/animation_length';
import { ANIMATION, THEME } from '../config';
import { ImageCutaway } from './cutaways/ImageCutaway';
import { VideoCutaway } from './cutaways/VideoCutaway';
import { ConsoleCutaway } from './cutaways/ConsoleCutaway';
import { computePerBlockHolds, computeAdjustedHighlightHold } from '../calculations/animation_phases';

// Holds are computed in calculations/animation_phases.ts

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const CodeBlockAnimation: React.FC<{ markdown: any }> = ({ markdown }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const allBlocks = markdown.sections.flatMap((s: any) => s.blocks);

  const { blocks, totalFrames, maxLineLengthGlobal, maxLineCountGlobal } = useMemo(
    () => computeMixedBlocksTimeline(allBlocks, fps),
    [allBlocks, fps]
  );

  // Base holds using extracted helpers (zero for non-code to avoid trim overhang)
  const addedChars = blocks.map((b) => (b.type === 'code' ? b.addedChars : 0));
  const rawHolds = computePerBlockHolds(addedChars, fps);
  const perBlockHighlightHoldFrames = rawHolds.highlight.map((h, i) => (blocks[i].type === 'code' ? h : 0));
  const perBlockTailFrames = rawHolds.tail.map((t, i) => (blocks[i].type === 'code' ? t : 0));
  const starts = blocks.map((b) => b.start);
  const durations = blocks.map((b) => b.duration);
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
    {frame === 0 && (<Artifact filename="metadata.json" content={JSON.stringify(
        {
          blocks,
          totalFrames,
          maxLineLengthGlobal,
          maxLineCountGlobal,
          fps,
          extraFramesPerBlock: lastBlockCombinedTail,
          trimSafetyFrames: Math.round(ANIMATION.trimSafetySeconds * fps),
          perBlockHighlightHoldFrames: adjustedHighlightHold,
          perBlockTailFrames
        }
    )} />)}
    <AbsoluteFill style={{ backgroundColor: THEME.stageBackground }}>
      {blocks.map((block: any, index: number) => {
        const localFrame = frame - block.start;
        const activeDuration = block.duration;
        const isCode = block.type === 'code';
        const highlightHold = isCode ? ((block.highlight === false ? 0 : (adjustedHighlightHold[index] ?? 20))) : 0;
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

        const isActive = (block.highlight === false)
          ? false
          : (localFrame >= 0 && localFrame < phaseEndHighlight);

        if (block.type === 'code') {
          const prev = blocks[index - 1];
          let prevCode = '';
          if (!block.startFromBlank && prev && prev.type === 'code' && prev.title === block.title) {
            prevCode = prev.content;
          }
          return (
            <Sequence key={index} from={block.start} durationInFrames={sequenceDuration}>
              <CodeBlock
                oldCode={prevCode}
                newCode={block.content}
                language={block.language}
                progress={progress}
                isActive={isActive}
                fileName={block.title}
                isStatic={true}
                maxLineLength={maxLineLengthGlobal}
                maxLineCount={maxLineCountGlobal}
              />
            </Sequence>
          );
        }

        // Cutaways render without typing/highlight logic
        return (
          <Sequence key={index} from={block.start} durationInFrames={sequenceDuration}>
            {block.type === 'cutaway-image' && (
              <ImageCutaway src={block.src} title={block.title} width={block.width} height={block.height} />
            )}
            {block.type === 'cutaway-video' && (
              <VideoCutaway src={block.src} title={block.title} start={block.startSec} end={block.endSec} width={block.width} height={block.height} muted={block.muted} />
            )}
            {block.type === 'cutaway-console' && (
              <ConsoleCutaway
                content={block.content}
                title={block.title}
                durationFrames={activeDuration}
                prompt={block.prompt}
                commandLines={block.commandLines}
                commandCps={block.commandCps}
                outputCps={block.outputCps}
                enterDelay={block.enterDelay}
                showPrompt={block.showPrompt}
              />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
    </>
  );
};

export default CodeBlockAnimation;
