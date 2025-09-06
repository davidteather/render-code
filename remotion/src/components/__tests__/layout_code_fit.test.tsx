import {describe, it, expect, vi} from 'vitest';
import React from 'react';
import {render, screen} from '@testing-library/react';

vi.mock('remotion', () => {
  const React = require('react');
  return {
    AbsoluteFill: ({children, ...props}: any) => React.createElement('div', props, children),
    Sequence: ({children, ...props}: any) => React.createElement('div', props, children),
    useCurrentFrame: () => 40,
    useVideoConfig: () => ({ fps: 60, width: 1920, height: 1080 }),
    spring: ({ frame, durationInFrames }: any) => Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames || 1))),
    staticFile: (p: string) => p,
    Artifact: () => null,
  };
});

import CodeBlockAnimation from '../CodeBlockAnimation';

describe('layout code fit', () => {
  it('code container should flex to 100% width within pane and not overflow', () => {
    const markdown = {
      sections: [{
        title: 's',
        blocks: [{
          type: 'layout-split', direction: 'row', start: 0, duration: 120, sizes: [6, 6], panes: [
            { blocks: [{ type: 'cutaway-image', src: '/assets/p1.png', start: 0, duration: 120 }] },
            { blocks: [{ type: 'code', language: 'ts', content: 'const x = 1;\n'.repeat(50), title: 'big.ts', start: 0, duration: 120 }] },
          ]
        }]
      }]
    };
    render(<CodeBlockAnimation markdown={markdown as any} />);
    const codeContainer = screen.getByTestId('code-container') as HTMLDivElement;
    expect(codeContainer.style.width).toBe('100%');
  });
});


