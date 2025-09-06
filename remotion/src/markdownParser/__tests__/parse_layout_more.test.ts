import {describe, it, expect} from 'vitest';
import {parseMarkdownString} from '../parseMarkdown';

describe('parseMarkdown - more layout coverage', () => {
  it('supports sizes and gap attributes', () => {
    const md = [
      ':::layout direction=row gap=12 sizes=60,40',
      ':::pane title="Left"',
      ':::cutaway type=image src="/assets/prem1.png"',
      ':::',
      ':::',
      ':::pane title="Right"',
      ':::cutaway type=image src="/assets/prem2.png"',
      ':::',
      ':::',
      ':::'
    ].join('\n');
    const parsed = parseMarkdownString(md);
    const layout = parsed.sections[0].blocks[0] as any;
    expect(layout.type).toBe('layout-split');
    expect(layout.gap).toBe(12);
    expect(layout.sizes).toEqual([60, 40]);
    expect(layout.panes.length).toBe(2);
  });

  it('parses gif and console inside panes', () => {
    const md = [
      ':::layout direction=column',
      ':::pane',
      ':::cutaway type=gif src="/assets/demo.gif"',
      ':::',
      ':::',
      ':::pane',
      ':::cutaway type=console title="Term"',
      'echo hello',
      ':::',
      ':::',
      ':::'
    ].join('\n');
    const parsed = parseMarkdownString(md);
    const layout = parsed.sections[0].blocks[0] as any;
    expect(layout.type).toBe('layout-split');
    expect(layout.direction).toBe('column');
    expect(layout.panes.length).toBe(2);
    expect(layout.panes[0].blocks[0].type).toBe('cutaway-gif');
    expect(layout.panes[1].blocks[0].type).toBe('cutaway-console');
  });
});


