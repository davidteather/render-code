import React from 'react';
import { AbsoluteFill, Sequence, spring, useVideoConfig } from 'remotion';
import { CodeBlockRenderer } from '../renderers/CodeBlockRenderer';
import { CutawayRenderer } from '../renderers/CutawayRenderer';
import { LayoutSplitMetadata } from '../../calculations/animation_length';
import { RENDER_FLAGS } from '../../config';

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
  const panes: any[] = Array.isArray(block.panes) ? block.panes : [];
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
              {(pane.blocks as any[]).map((inner: any, ii: number) => {
                const s = inner.start ?? 0;
                const next = (pane.blocks as any[])[ii + 1];
                const layoutLocalDuration = sequenceDuration;
                const seqDur = Math.max(1, (next ? (next.start ?? 0) - s : (layoutLocalDuration - s)));
                const paneLocalFrom = s;
                return (
                  <Sequence key={`p${pIdx}-ib${ii}`} from={paneLocalFrom} durationInFrames={seqDur}>
                    {(() => {
                      if (inner.type === 'code') {
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
                          <CodeBlockRenderer
                            oldCode={prevCode}
                            newCode={inner.content}
                            language={inner.language}
                            progress={inner.typeFillin === false ? 1 : progInner}
                            isActive={inner.highlight === false ? false : activeInnerFlag}
                            fileName={inner.title}
                            maxLineLength={maxLineLengthGlobal}
                            maxLineCount={maxLineCountGlobal}
                          />
                        );
                      }
                      return (
                        <CutawayRenderer
                          {...(inner as any)}
                          isActive={true}
                          {...(inner.type === 'cutaway-console' ? {
                            durationFrames: inner.duration,
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


