import React from 'react';
import { AbsoluteFill, Sequence, spring } from 'remotion';
import { CodeBlockRenderer } from '../renderers/CodeBlockRenderer';
import { CutawayRenderer } from '../renderers/CutawayRenderer';
import { LayoutSplitMetadata } from '../../calculations/animation_length';
import { ParsedBlock, TypedCodeBlock, CutawayType } from '../../models';

type Props = {
  block: LayoutSplitMetadata;
  sequenceDuration: number;
  localFrame: number;
  fps: number;
  maxLineLengthGlobal: number;
  maxLineCountGlobal: number;
};

export const LayoutSplit: React.FC<Props> = ({
  block,
  sequenceDuration,
  localFrame,
  fps,
  maxLineLengthGlobal,
  maxLineCountGlobal,
}) => {
  const panes = Array.isArray(block.panes) ? block.panes : [];
  const dir: 'row' | 'column' = (block.direction === 'column' ? 'column' : 'row');
  const gapPx = typeof block.gap === 'number' ? block.gap : 24;
  const sizes: number[] | undefined = (Array.isArray(block.sizes) && block.sizes.length === panes.length) ? block.sizes : undefined;

  return (
    <Sequence from={block.start} durationInFrames={sequenceDuration}>
      <AbsoluteFill data-testid="layout-split" style={{ display: 'flex', flexDirection: dir, gap: `${gapPx}px`, padding: 24 }}>
        {panes.map((pane, pIdx) => {
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
              {pane.blocks.map((inner, ii: number) => {
                const s = (inner as { start?: number }).start ?? 0;
                const next = pane.blocks[ii + 1] as (ParsedBlock & { start?: number; duration?: number }) | undefined;
                const layoutLocalDuration = sequenceDuration;
                const seqDur = Math.max(1, (next ? ((next as any).start ?? 0) - s : (layoutLocalDuration - s)));
                const paneLocalFrom = s;
                return (
                  <Sequence key={`p${pIdx}-ib${ii}`} from={paneLocalFrom} durationInFrames={seqDur}>
                    {(() => {
                      if (inner.type === 'code') {
                        let prevCode = '';
                        const prev = pane.blocks[ii - 1] as (TypedCodeBlock & { duration?: number }) | undefined;
                        if (prev && prev.type === 'code' && prev.title === (inner as TypedCodeBlock).title && (inner as TypedCodeBlock).startFromBlank !== true) {
                          prevCode = prev.content;
                        }
                        const paneLocalFrame = Math.max(0, localFrame - s);
                        const durationInFrames = (inner as any).duration ?? 0;
                        const rawInner = spring({ frame: Math.min(paneLocalFrame, durationInFrames), fps, durationInFrames, config: { damping: 20, stiffness: 200, mass: 0.5 } });
                        const progInner = Math.max(0, Math.min(1, rawInner));
                        const activeInnerFlag = paneLocalFrame < durationInFrames;
                        return (
                          <CodeBlockRenderer
                            oldCode={prevCode}
                            newCode={(inner as TypedCodeBlock).content}
                            language={(inner as TypedCodeBlock).language}
                            progress={(inner as TypedCodeBlock).typeFillin === false ? 1 : progInner}
                            isActive={(inner as TypedCodeBlock).highlight === false ? false : activeInnerFlag}
                            fileName={(inner as TypedCodeBlock).title}
                            maxLineLength={maxLineLengthGlobal}
                            maxLineCount={maxLineCountGlobal}
                          />
                        );
                      }
                      return (
                        <CutawayRenderer
                          {...(inner as unknown as any)}
                          isActive={true}
                          {...(inner.type === CutawayType.Console ? {
                            durationFrames: (inner as any).duration,
                            frameOverride: Math.max(0, localFrame - s),
                          } : {})}
                        />
                      );
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
};

export default LayoutSplit;


