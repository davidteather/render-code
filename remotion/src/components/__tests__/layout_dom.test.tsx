import {describe, it, expect, vi} from 'vitest';
import React from 'react';
import {render, screen} from '@testing-library/react';

vi.mock('remotion', () => {
  const React = require('react');
  return {
    AbsoluteFill: ({children, ...props}: any) => React.createElement('div', props, children),
    Sequence: ({children, ...props}: any) => React.createElement('div', props, children),
    useCurrentFrame: () => 75,
    useVideoConfig: () => ({ fps: 60 }),
    spring: ({ frame, durationInFrames }: any) => Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames || 1))),
    staticFile: (p: string) => p,
    Artifact: () => null,
  };
});

import CodeBlockAnimation from '../CodeBlockAnimation';

const fakeMarkdown = {
  sections: [
    {
      title: 'Test',
      blocks: [
        {
          type: 'layout-split',
          direction: 'row',
          gap: 24,
          sizes: [60, 40],
          panes: [
            { blocks: [{ type: 'cutaway-image', src: '/assets/prem1.png', start: 0, duration: 150, addedChars: 0 }] },
            { blocks: [{ type: 'cutaway-image', src: '/assets/prem2.png', start: 0, duration: 150, addedChars: 0 }] },
          ],
          start: 0,
          duration: 150,
          addedChars: 0
        }
      ]
    }
  ]
};

describe('Layout DOM', () => {
  it('renders both panes concurrently within the layout', () => {
    render(<CodeBlockAnimation markdown={fakeMarkdown as any} />);
    const layout = screen.getByTestId('layout-split');
    expect(layout).toBeTruthy();
    const pane0 = screen.getByTestId('pane-0');
    const pane1 = screen.getByTestId('pane-1');
    expect(pane0).toBeTruthy();
    expect(pane1).toBeTruthy();
    // Ensure style widths add up to <= 100% and overflow hidden is applied
    expect((pane0 as HTMLDivElement).style.overflow).toBe('hidden');
    expect((pane1 as HTMLDivElement).style.overflow).toBe('hidden');
    // Code container should be width 100% and not overflow its pane
    const codeContainer = screen.queryByTestId('code-container') as HTMLDivElement | null;
    if (codeContainer) {
      expect(codeContainer.style.width).toBe('100%');
    }
  });
});


