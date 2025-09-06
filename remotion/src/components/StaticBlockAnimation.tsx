import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const StaticBlockAnimation: React.FC<{ totalFrames: number }> = ({ totalFrames: _totalFrames }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div>{frame}</div>
    </AbsoluteFill>
  );
};