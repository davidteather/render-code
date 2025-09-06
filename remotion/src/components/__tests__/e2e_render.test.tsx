import {describe, it, expect} from 'vitest';
import React from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import {Thumbnail} from '@remotion/player';
import {parseMarkdownString} from '../../markdownParser/parseMarkdown';
import CodeBlockAnimation from '../CodeBlockAnimation';

// E2E-ish: parse markdown -> pass to CodeBlockAnimation -> Thumbnail render
describe('E2E render: parser -> blocks -> remotion', () => {
  it('renders a row layout with two panes from markdown', async () => {
    const md = [
      ':::layout direction=row gap=12 sizes=60,40',
      ':::pane',
      ':::cutaway type=image src="/assets/prem1.png"',
      ':::',
      ':::',
      ':::pane',
      ':::cutaway type=gif src="/assets/demo.gif"',
      ':::',
      ':::',
      ':::'
    ].join('\n');
    const parsed = parseMarkdownString(md);
    render(
      <Thumbnail
        component={() => <CodeBlockAnimation markdown={parsed as any} />}
        compositionHeight={1080}
        compositionWidth={1920}
        durationInFrames={240}
        fps={60}
        frameToDisplay={60}
        inputProps={{}}
        style={{ opacity: 1 }}
      />
    );
    const layout = await waitFor(() => screen.getByTestId('layout-split'));
    expect(layout).toBeTruthy();
    expect(screen.getByTestId('pane-0')).toBeTruthy();
    expect(screen.getByTestId('pane-1')).toBeTruthy();
  });
});


