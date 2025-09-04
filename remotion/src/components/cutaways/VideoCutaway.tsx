import React from 'react';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig, spring, Video } from 'remotion';
import { THEME } from '../../config';

export type VideoCutawayProps = {
  src: string;
  title?: string;
  start?: number; // seconds
  end?: number;   // seconds
  width?: number;
  height?: number;
  muted?: boolean;
};

export const VideoCutaway: React.FC<VideoCutawayProps> = ({ src, title, start, end, width, height, muted }) => {
  const resolved = staticFile(src.replace(/^\//, ''));
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({ frame, fps, durationInFrames: 18, config: { damping: 200 } });

  const startFrom = Math.max(0, Math.floor((start ?? 0) * fps));
  // Only set endAt when an explicit end is provided to avoid ending a frame early
  const endAt = typeof end === 'number' ? Math.max(startFrom + 1, Math.floor(end * fps)) : undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.stageBackground, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {title && (
          <div style={{ color: '#bbb', fontSize: '1.2rem' }}>{title}</div>
        )}
        <Video
          src={resolved}
          muted={muted ?? true}
          startFrom={startFrom}
          {...(endAt ? { endAt } : {})}
          style={{
            maxWidth: width ? `${width}px` : '92%',
            maxHeight: height ? `${height}px` : '92%',
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


