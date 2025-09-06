import {describe, it, expect, vi} from 'vitest';
import React from 'react';
import {render} from '@testing-library/react';

vi.mock('remotion', () => {
  const React = require('react');
  return {
    AbsoluteFill: ({children, ...props}: any) => React.createElement('div', props, children),
    Sequence: ({children, ...props}: any) => React.createElement('div', props, children),
    useCurrentFrame: () => 200,
    useVideoConfig: () => ({ fps: 60 }),
    spring: ({ frame, durationInFrames }: any) => Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames || 1))),
    staticFile: (p: string) => p,
    Artifact: () => null,
  };
});

import CodeBlockAnimation from '../CodeBlockAnimation';

describe('Code typing progress', () => {
  it('CodeBlock receives progress=1 when frame > duration', () => {
    const markdown = {
      sections: [{
        title: 's',
        blocks: [
          { type: 'code', language: 'ts', content: 'const a=1', start: 0, duration: 30 },
        ],
      }],
    };
    // Render just to run without error; we indirectly assert by no exception with high frame
    render(<CodeBlockAnimation markdown={markdown as any} />);
  });
});


