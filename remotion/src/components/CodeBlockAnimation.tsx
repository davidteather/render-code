
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence, spring, Artifact } from 'remotion';
import { CodeBlock } from './CodeBlock';
import { computeCodeBlockMetadata } from '../calculations/animation_length';
import { ANIMATION, THEME } from '../config';
import { computePerBlockHolds, computeAdjustedHighlightHold } from '../calculations/animation_phases';

// Holds are computed in calculations/animation_phases.ts

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const CodeBlockAnimation: React.FC<{ markdown: any }> = ({ markdown }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const allCodeBlocks = markdown.sections.flatMap((s: any) => s.codeBlocks);

  const { blocks, totalFrames, maxLineLengthGlobal, maxLineCountGlobal } = useMemo(
    () => computeCodeBlockMetadata(allCodeBlocks, 1, fps),
    [allCodeBlocks, fps]
  );

  // Base holds using extracted helpers
  const addedChars = blocks.map((b) => b.addedChars);
  const { highlight: perBlockHighlightHoldFrames, tail: perBlockTailFrames } = computePerBlockHolds(addedChars, fps);
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
        const highlightHold = adjustedHighlightHold[index] ?? 20;
        const nonHighlightTail = perBlockTailFrames[index] ?? 20;

        const phaseEndHighlight = activeDuration + highlightHold;
        const sequenceDuration = activeDuration + highlightHold + nonHighlightTail;

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

        const isActive = localFrame >= 0 && localFrame < phaseEndHighlight;

        return (
          <Sequence key={index} from={block.start} durationInFrames={sequenceDuration}>
            <CodeBlock
              oldCode={index > 0 ? blocks[index - 1].content : ''}
              newCode={block.content}
              language={block.language}
              progress={progress}
              isActive={isActive}
              fileName='test.py'
              isStatic={true}
              maxLineLength={maxLineLengthGlobal}
              maxLineCount={maxLineCountGlobal}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
    </>
  );
};

export default CodeBlockAnimation;
