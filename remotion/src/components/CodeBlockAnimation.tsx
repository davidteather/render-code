
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence, spring, Artifact } from 'remotion';
import { CodeBlock } from './CodeBlock';
import { computeMixedBlocksTimeline } from '../calculations/animation_length';
import { ANIMATION, THEME, RENDER_FLAGS } from '../config';
import { ImageCutaway, GifCutaway } from './cutaways/ImageCutaway';
import { VideoCutaway } from './cutaways/VideoCutaway';
import { VideoPlaceholder } from './cutaways/VideoPlaceholder';
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

        // Layout-split container (row/column panes)
        if (block.type === 'layout-split') {
          const panes: any[] = Array.isArray(block.panes) ? block.panes : [];
          const dir: 'row' | 'column' = (block.direction === 'column' ? 'column' : 'row');
          const gapPx = typeof block.gap === 'number' ? block.gap : 24;
          const sizes: number[] | undefined = (Array.isArray(block.sizes) && block.sizes.length === panes.length) ? block.sizes : undefined;
          return (
            <Sequence key={index} from={block.start} durationInFrames={sequenceDuration}>
              <AbsoluteFill data-testid="layout-split" style={{ display: 'flex', flexDirection: dir, gap: `${gapPx}px`, padding: 24 }}>
                {panes.map((pane, pIdx) => {
                  // Determine flex-grow weights instead of fixed widths to account for gap/padding
                  let weight: number;
                  if (sizes) {
                    const maxVal = Math.max(...sizes);
                    const allIntUnder12 = maxVal <= 12;
                    weight = allIntUnder12 ? Math.max(1, Math.min(12, Math.round(sizes[pIdx]))) : Math.max(1, sizes[pIdx]);
                  } else {
                    weight = 1;
                  }
                  const widthStyle = dir === 'row'
                    ? { flex: `${weight} 1 0%`, height: '100%', minWidth: 0 }
                    : { width: '100%', flex: `${weight} 1 0%`, minHeight: 0 };
                  return (
                    <div data-testid={`pane-${pIdx}`} key={`pane-${pIdx}`} style={{ position: 'relative', overflow: 'hidden', ...widthStyle }}>
                      {(pane.blocks as any[]).map((inner: any, ii: number) => {
                        const s = inner.start ?? 0;
                        const d = inner.duration ?? 1;
                        const next = (pane.blocks as any[])[ii + 1];
                        // Extend last inner block to fill the whole layout duration so both panes stay visible
                        const layoutLocalDuration = sequenceDuration;
                        const seqDur = Math.max(1, (next ? (next.start ?? 0) - s : (layoutLocalDuration - s)));
                        // Child Sequences are relative to the parent layout Sequence, so use 's' only
                        const paneLocalFrom = s;
                        return (
                          <Sequence key={`p${pIdx}-ib${ii}`} from={paneLocalFrom} durationInFrames={seqDur}>
                            {(() => {
                              if (inner.type === 'code') {
                                // prev code within pane
                                let prevCode = '';
                                const prev = (pane.blocks as any[])[ii - 1];
                                if (prev && prev.type === 'code' && prev.title === inner.title && inner.startFromBlank !== true) {
                                  prevCode = prev.content;
                                }
                                const paneLocalFrame = Math.max(0, localFrame - s);
                                const rawInner = spring({ frame: Math.min(paneLocalFrame, inner.duration ?? 0), fps, durationInFrames: inner.duration ?? 0, config: { damping: 20, stiffness: 200, mass: 0.5 } });
                                const progInner = Math.max(0, Math.min(1, rawInner));
                                const activeInnerFlag = paneLocalFrame < (inner.duration ?? 0);
                                return (
                                  <CodeBlock
                                    oldCode={prevCode}
                                    newCode={inner.content}
                                    language={inner.language}
                                    progress={inner.typeFillin === false ? 1 : progInner}
                                    isActive={inner.highlight === false ? false : activeInnerFlag}
                                    fileName={inner.title}
                                    isStatic={true}
                                    maxLineLength={maxLineLengthGlobal}
                                    maxLineCount={maxLineCountGlobal}
                                  />
                                );
                              }
                              if (inner.type === 'cutaway-image' && RENDER_FLAGS.showImageCutaways) {
                                return (<ImageCutaway src={inner.src} title={inner.title} width={inner.width} height={inner.height} isActive={true} />);
                              }
                              if (inner.type === 'cutaway-gif') {
                                return (<GifCutaway src={inner.src} title={inner.title} width={inner.width} height={inner.height} isActive={true} />);
                              }
                              if (inner.type === 'cutaway-video') {
                                return RENDER_FLAGS.showVideoCutaways ? (
                                  <VideoCutaway src={inner.src} title={inner.title} start={inner.startSec} end={inner.endSec} width={inner.width} height={inner.height} muted={inner.muted} />
                                ) : (
                                  <VideoPlaceholder src={inner.src} title={inner.title} />
                                );
                              }
                              if (inner.type === 'cutaway-console' && RENDER_FLAGS.showConsoleCutaways) {
                                const paneLocalFrame = Math.max(0, localFrame - s);
                                return (
                                  <ConsoleCutaway
                                    content={inner.content}
                                    title={inner.title}
                                    durationFrames={inner.duration}
                                    prompt={inner.prompt}
                                    commandLines={inner.commandLines}
                                    commandCps={inner.commandCps}
                                    outputCps={inner.outputCps}
                                    enterDelay={inner.enterDelay}
                                    showPrompt={inner.showPrompt}
                                    cwd={inner.cwd}
                                    prefix={inner.prefix}
                                    frameOverride={paneLocalFrame}
                                    maxHeightPx={inner.maxHeightPx}
                                    maxWidthPx={inner.maxWidthPx}
                                  />
                                );
                              }
                              return null;
                            })()}
                          </Sequence>
                        );
                      })}
                    </div>
                  );
                })}
              </AbsoluteFill>
            </Sequence>
          );
        }

        // Cutaways render without typing/highlight logic
        return (
          <Sequence key={index} from={block.start} durationInFrames={sequenceDuration}>
            {block.type === 'cutaway-image' && RENDER_FLAGS.showImageCutaways && (
              <ImageCutaway src={block.src} title={block.title} width={block.width} height={block.height} isActive={isActive} />
            )}
            {block.type === 'cutaway-gif' && (
              <GifCutaway src={block.src} title={block.title} width={block.width} height={block.height} isActive={isActive} />
            )}
            {block.type === 'cutaway-video' && (
              RENDER_FLAGS.showVideoCutaways && localFrame < activeDuration ? (
                <VideoCutaway src={block.src} title={block.title} start={block.startSec} end={block.endSec} width={block.width} height={block.height} muted={block.muted} />
              ) : (
                <VideoPlaceholder src={block.src} title={block.title} />
              )
            )}
            {block.type === 'cutaway-console' && RENDER_FLAGS.showConsoleCutaways && (
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
                cwd={block.cwd}
                prefix={block.prefix}
                frameOverride={localFrame}
                maxHeightPx={block.maxHeightPx}
                historyContent={(block.append && (() => {
                  // Accumulate prior console outputs within same title if append flag set,
                  // formatting each prior command with its prompt/cwd for terminal-like transcript
                  let history = '';
                  for (let k = 0; k < index; k++) {
                    const prev = blocks[k] as any;
                    if (prev.type === 'cutaway-console' && prev.title === block.title) {
                      const raw = String(prev.content || '');
                      const lines = raw.split('\n');
                      const cmdLines = Math.max(1, (prev.commandLines as number | undefined) ?? 1);
                      const command = lines.slice(0, cmdLines).join('\n');
                      const output = lines.slice(cmdLines).join('\n');
                      const promptLabel = ((): string => {
                        if (prev.prefix) return String(prev.prefix);
                        const basePrompt = String((prev.prompt ?? '$'));
                        if (prev.cwd) return `${prev.cwd} ${basePrompt}`;
                        return basePrompt;
                      })();
                      const transcript = `${promptLabel} ${command}` + (output ? `\n${output}` : '');
                      history += (history ? '\n' : '') + transcript;
                    }
                  }
                  return history;
                })()) || undefined}
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
