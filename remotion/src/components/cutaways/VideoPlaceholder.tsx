import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../../config';

export type VideoPlaceholderProps = {
  src?: string;
  title?: string;
};

export const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({ src, title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({ frame, fps, durationInFrames: 18, config: { damping: 200 } });
  const fileLabel = title || (src ? src.split('/').pop() || src : 'video');
  return (
    <AbsoluteFill style={{ backgroundColor: THEME.stageBackground, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        backgroundColor: THEME.codeBackground,
        borderRadius: `${THEME.codeBorderRadiusPx + 4}px`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
        padding: '28px 38px',
        color: THEME.codeTextColor,
        transform: `scale(${0.96 + appear * 0.04})`,
        opacity: appear,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.2rem', color: '#bbb', marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: '2rem' }}>{`${fileLabel} skipped due to preview`}</div>
      </div>
    </AbsoluteFill>
  );
};

export default VideoPlaceholder;



