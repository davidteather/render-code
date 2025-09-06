import {describe, it, expect, vi} from 'vitest';
import React from 'react';
import {render, screen} from '@testing-library/react';

vi.mock('remotion', () => {
  const React = require('react');
  return {
    AbsoluteFill: ({children, ...props}: any) => React.createElement('div', props, children),
    Sequence: ({children, ...props}: any) => React.createElement('div', props, children),
    useCurrentFrame: () => 60,
    useVideoConfig: () => ({ fps: 60 }),
    spring: ({ frame, durationInFrames }: any) => Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames || 1))),
    staticFile: (p: string) => p,
    Artifact: () => null,
  };
});

import CodeBlockAnimation from '../CodeBlockAnimation';

describe('layout grid sizing', () => {
  it('interprets sizes as 12-grid when <= 12', () => {
    const markdown = {
      sections: [{
        title: 's',
        blocks: [{
          type: 'layout-split', direction: 'row', start: 0, duration: 120, sizes: [8, 4], panes: [
            { blocks: [{ type: 'cutaway-image', src: '/assets/p1.png', start: 0, duration: 120 }] },
            { blocks: [{ type: 'cutaway-image', src: '/assets/p2.png', start: 0, duration: 120 }] },
          ]
        }]
      }]
    };
    render(<CodeBlockAnimation markdown={markdown as any} />);
    const pane0 = screen.getByTestId('pane-0') as HTMLDivElement;
    const pane1 = screen.getByTestId('pane-1') as HTMLDivElement;
    expect(pane0.style.flex).toContain('8');
    expect(pane1.style.flex).toContain('4');
  });
});


