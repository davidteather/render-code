import React from 'react';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig, spring, OffthreadVideo } from 'remotion';
import { THEME, COMPOSITION_PREVIEW } from '../../config';

export type VideoCutawayProps = {
  src: string;
  title?: string;
  start?: number; // seconds
  end?: number;   // seconds
  width?: number | string;
  height?: number | string;
  muted?: boolean;
};

export const VideoCutaway: React.FC<VideoCutawayProps> = ({ src, title, start, end, width, height, muted }) => {
  const resolved = staticFile(src.replace(/^\//, ''));
  const frame = useCurrentFrame();
  const { fps, width: compW, height: compH } = useVideoConfig();
  const appear = spring({ frame, fps, durationInFrames: 18, config: { damping: 200 } });

  const startFrom = Math.max(0, Math.floor((start ?? 0) * fps));
  // Only set endAt when an explicit end is provided to avoid ending a frame early
  const endAt = typeof end === 'number' ? Math.max(startFrom + 1, Math.floor(end * fps)) : undefined;

  // Scale pixel-specified sizes relative to preview baseline so 4K doesn't look tiny
  const baseW = (COMPOSITION_PREVIEW.width as number) || 1920;
  const baseH = (COMPOSITION_PREVIEW.height as number) || 1080;
  const scaleX = compW / baseW;
  const scaleY = compH / baseH;
  const scaledMaxWidth = typeof width === 'number' ? Math.round(width * scaleX) : undefined;
  const scaledMaxHeight = typeof height === 'number' ? Math.round(height * scaleY) : undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.stageBackground, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {title && (
          <div style={{ color: '#bbb', fontSize: '1.2rem' }}>{title}</div>
        )}
        <OffthreadVideo
          src={resolved}
          muted={muted ?? true}
          startFrom={startFrom}
          {...(endAt ? { endAt } : {})}
          style={{
            maxWidth: typeof width === 'string' ? width : (scaledMaxWidth ? `${scaledMaxWidth}px` : '92%'),
            maxHeight: typeof height === 'string' ? height : (scaledMaxHeight ? `${scaledMaxHeight}px` : '92%'),
            borderRadius: 12,
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            transform: `scale(${0.96 + appear * 0.04})`,
            opacity: appear
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default VideoCutaway;


