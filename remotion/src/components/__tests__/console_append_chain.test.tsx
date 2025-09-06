import {describe, it, expect, vi} from 'vitest';
import React from 'react';
import {render} from '@testing-library/react';

vi.mock('remotion', () => {
  const React = require('react');
  return {
    AbsoluteFill: ({children, ...props}: any) => React.createElement('div', props, children),
    Sequence: ({children, ...props}: any) => React.createElement('div', props, children),
    useCurrentFrame: () => 120,
    useVideoConfig: () => ({ fps: 60 }),
    spring: ({ frame, durationInFrames }: any) => Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames || 1))),
    staticFile: (p: string) => p,
  };
});

import CodeBlockAnimation from '../CodeBlockAnimation';

describe('console append chain grouping', () => {
  it('groups consecutive appended consoles into one sequence', () => {
    const markdown = {
      sections: [{
        title: 's',
        blocks: [
          { type: 'cutaway-console', title: 'UNIX session', append: true, content: 'pwd\n~', start: 0, duration: 30 },
          { type: 'cutaway-console', title: 'UNIX session', append: true, content: 'ls -la\n.', start: 30, duration: 30 },
          { type: 'cutaway-console', title: 'UNIX session', append: true, content: 'cd projects', start: 60, duration: 30 },
        ]
      }]
    };
    render(<CodeBlockAnimation markdown={markdown as any} />);
    const text = document.body.textContent || '';
    expect(text).toContain('pwd');
    expect(text).toContain('ls -la');
    expect(text).toContain('cd projects');
  });
});


