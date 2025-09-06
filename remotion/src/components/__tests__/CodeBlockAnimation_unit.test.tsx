import {describe, it, expect, vi} from 'vitest';
import React from 'react';
import {render, screen} from '@testing-library/react';

vi.mock('remotion', () => {
  const React = require('react');
  return {
    AbsoluteFill: ({children, ...props}: any) => React.createElement('div', props, children),
    Sequence: ({children, ...props}: any) => React.createElement('div', props, children),
    useCurrentFrame: () => 30,
    useVideoConfig: () => ({ fps: 60 }),
    spring: ({ frame, durationInFrames }: any) => Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames || 1))),
    staticFile: (p: string) => p,
    Artifact: () => null,
  };
});

import CodeBlockAnimation from '../CodeBlockAnimation';

describe('CodeBlockAnimation unit', () => {
  it('renders an image cutaway block', () => {
    const markdown = {
      sections: [{ title: 's', blocks: [{ type: 'cutaway-image', src: '/assets/prem1.png', start: 0, duration: 90 }] }]
    };
    render(<CodeBlockAnimation markdown={markdown as any} />);
    // layout-split is not present
    expect(screen.queryByTestId('layout-split')).toBeNull();
  });

  it('renders a layout-split with two panes', () => {
    const markdown = {
      sections: [{
        title: 's',
        blocks: [{
          type: 'layout-split', direction: 'row', start: 0, duration: 120, panes: [
            { blocks: [{ type: 'cutaway-image', src: '/assets/p1.png', start: 0, duration: 120 }] },
            { blocks: [{ type: 'cutaway-image', src: '/assets/p2.png', start: 0, duration: 120 }] },
          ]
        }]
      }]
    };
    render(<CodeBlockAnimation markdown={markdown as any} />);
    expect(screen.getByTestId('layout-split')).toBeTruthy();
    expect(screen.getByTestId('pane-0')).toBeTruthy();
    expect(screen.getByTestId('pane-1')).toBeTruthy();
  });
});


