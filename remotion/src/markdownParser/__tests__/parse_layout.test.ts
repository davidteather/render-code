import {describe, it, expect} from 'vitest';
import {parseMarkdownString} from '../parseMarkdown';

const mdTwoPanes = [
  ':::layout direction=row gap=24 sizes="60,40"',
  ':::pane title="Left"',
  ':::cutaway type=image src="/assets/prem1.png" title="Left"',
  ':::',
  ':::',
  ':::pane title="Right"',
  ':::cutaway type=image src="/assets/prem2.png" title="Right"',
  ':::',
  ':::',
  ':::',
].join('\n');

const mdColumnTwoPanes = [
  ':::layout direction=column gap=16 sizes="50,50"',
  ':::pane title="Top"',
  ':::cutaway type=image src="/assets/prem2.png" title="Top"',
  ':::',
  ':::',
  ':::pane title="Bottom"',
  ':::cutaway type=console title="Demo" commandLines=1',
  'echo hi',
  'hi',
  ':::',
  ':::',
].join('\n');

describe('parseMarkdown layout-split', () => {
  it('parses two panes inside a layout', () => {
    const parsed = parseMarkdownString(mdTwoPanes);
    const blocks = parsed.sections.flatMap((s) => s.blocks as any[]);
    expect(blocks.length).toBeGreaterThan(0);
    const layout = blocks.find((b) => b.type === 'layout-split');
    expect(layout).toBeTruthy();
    expect(layout.direction).toBe('row');
    expect(Array.isArray(layout.panes)).toBe(true);
    expect(layout.panes.length).toBe(2);
    expect(layout.panes[0].blocks[0].type).toBe('cutaway-image');
    expect(layout.panes[1].blocks[0].type).toBe('cutaway-image');
  });

  it('parses column layout and preserves pane order', () => {
    const parsed = parseMarkdownString(mdColumnTwoPanes);
    const blocks = parsed.sections.flatMap((s) => s.blocks as any[]);
    const layout = blocks.find((b) => b.type === 'layout-split');
    expect(layout).toBeTruthy();
    expect(layout.direction).toBe('column');
    expect(layout.panes.length).toBe(2);
    expect(layout.panes[0].blocks[0].type).toBe('cutaway-image');
    expect(layout.panes[1].blocks[0].type).toBe('cutaway-console');
  });
});


