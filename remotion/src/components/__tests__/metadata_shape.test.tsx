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
      // Validate metadata structure without asserting exact numbers
      const meta = JSON.parse(content);
      expect(Array.isArray(meta.blocks)).toBe(true);
      expect(typeof meta.fps).toBe('number');
      expect(typeof meta.totalFrames).toBe('number');
      expect(Array.isArray(meta.perBlockHighlightHoldFrames)).toBe(true);
      expect(Array.isArray(meta.perBlockTailFrames)).toBe(true);
      return null;
    },
  };
});

import CodeBlockAnimation from '../CodeBlockAnimation';

describe('CodeBlockAnimation metadata emission', () => {
  it('emits metadata.json with expected top-level keys', () => {
    const markdown = {
      sections: [{
        title: 's',
        blocks: [
          { type: 'code', language: 'js', content: 'a' },
          { type: 'cutaway-image', src: '/assets/prem1.png' },
        ],
      }],
    };
    render(<CodeBlockAnimation markdown={markdown as any} />);
  });
});


