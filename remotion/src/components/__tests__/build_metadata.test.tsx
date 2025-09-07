import {describe, it, expect, vi} from 'vitest';
import React from 'react';
import {render} from '@testing-library/react';

vi.mock('remotion', () => {
  const React = require('react');
  return {
    AbsoluteFill: ({children, ...props}: any) => React.createElement('div', props, children),
    Sequence: ({children, ...props}: any) => React.createElement('div', props, children),
    useCurrentFrame: () => 0,
    useVideoConfig: () => ({ fps: 60 }),
    spring: ({ frame, durationInFrames }: any) => Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames || 1))),
    staticFile: (p: string) => p,
    Artifact: ({ content }: any) => {
      const meta = JSON.parse(content);
      expect(Array.isArray(meta.cutPoints)).toBe(true);
      // Sorted and unique
      const sorted = [...meta.cutPoints].sort((a: number, b: number) => a - b);
      expect(meta.cutPoints).toEqual(sorted);
      // Must include 0 and totalFrames
      expect(meta.cutPoints[0]).toBe(0);
      expect(meta.cutPoints[meta.cutPoints.length - 1]).toBe(meta.totalFrames);
      // There should be a mid-cut after the first block's highlight
      const firstStart = 0;
      const firstDur = 10; // see markdown below
      const minMid = firstStart + firstDur + 1; // at least 1 frame hold
      const hasMid = meta.cutPoints.some((cp: number) => cp >= minMid && cp < meta.totalFrames);
      expect(hasMid).toBe(true);
      return null;
    },
  };
});

import CodeBlockAnimation from '../CodeBlockAnimation';

describe('buildMetadata cutPoints', () => {
  it('includes start, endOfHighlight, and end per code block', () => {
    const markdown = {
      sections: [{
        title: 's',
        blocks: [
          { type: 'code', language: 'js', content: 'a', duration: 10, start: 0 },
          { type: 'code', language: 'js', content: 'ab', duration: 10, start: 40 },
        ],
      }],
    };
    render(<CodeBlockAnimation markdown={markdown as any} />);
  });
});
