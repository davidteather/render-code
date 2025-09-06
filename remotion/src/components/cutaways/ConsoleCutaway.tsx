import React, { useEffect, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { ANIMATION, LAYOUT, THEME, COMPOSITION_PREVIEW } from '../../config';
import { buildPrompt } from '../helpers/consoleHistory';

export type ConsoleCutawayProps = {
  content: string;
  title?: string;
  durationFrames?: number;
  prompt?: string;
  cwd?: string;
  prefix?: string;
  commandLines?: number;
  commandCps?: number;
  outputCps?: number;
  enterDelay?: number;
  showPrompt?: boolean;
  frameOverride?: number;
  maxHeightPx?: number;
  maxWidthPx?: number;
  maxHeight?: string;
  maxWidth?: string;
  historyContent?: string;
  segments?: Array<{ command: string; output?: string; enterDelay?: number }>;
};

export const ConsoleCutaway: React.FC<ConsoleCutawayProps> = ({ content, title, durationFrames: _durationFrames, prompt, cwd, prefix, commandLines, commandCps, outputCps, enterDelay, showPrompt, frameOverride, maxHeightPx, maxWidthPx, maxHeight, maxWidth, historyContent, segments }) => {
  const globalFrame = useCurrentFrame();
  const frame = Math.max(0, (typeof frameOverride === 'number' ? frameOverride : globalFrame));
  const { fps, width: compW, height: compH } = useVideoConfig();
  const appear = spring({ frame, fps, durationInFrames: 18, config: { damping: 200 } });
  const scrollRef = useRef<HTMLDivElement>(null);
  const appended = Boolean(historyContent && historyContent.length > 0);

  const lines = content.split('\n');
  const numCmdLines = Math.max(1, commandLines ?? 1);
  const singleCommand = lines.slice(0, numCmdLines).join('\n');
  const singleOutput = lines.slice(numCmdLines).join('\n');

  const cmdCharsPerSec = commandCps ?? ANIMATION.consoleCommandCharsPerSecond;
  const outCharsPerSec = outputCps ?? ANIMATION.consoleOutputCharsPerSecond;
  const enterDelaySec = enterDelay ?? ANIMATION.consoleEnterDelaySeconds;

  const timeline = (() => {
    if (!segments || segments.length === 0) {
      return [{ command: singleCommand, output: singleOutput, enter: enterDelaySec }];
    }
    return segments.map((s) => ({ command: s.command, output: s.output ?? '', enter: typeof s.enterDelay === 'number' ? s.enterDelay : enterDelaySec }));
  })();

  const segFrames = timeline.map((seg) => {
    const cmdFrames = Math.max(1, Math.ceil((seg.command.length / Math.max(1, cmdCharsPerSec)) * fps));
    const enterFrames = Math.max(0, Math.ceil(seg.enter * fps));
    const outFrames = Math.ceil(((seg.output?.length ?? 0) / Math.max(1, outCharsPerSec)) * fps);
    return { cmdFrames, enterFrames, outFrames, total: cmdFrames + enterFrames + outFrames };
  });

  let visibleCommand = '';
  let visibleOutput = '';
  let printedHistory = '';
  let f = frame;
  for (let i = 0; i < timeline.length; i++) {
    const seg = timeline[i];
    const fr = segFrames[i];
    if (i < timeline.length - 1 && f >= fr.total) {
      // whole segment is already done; add fully to printedHistory and continue
      if (showPrompt ?? true) {
        printedHistory += (printedHistory ? '\n' : '') + `${buildPrompt(cwd, prompt, prefix)} ${seg.command}`;
      } else {
        printedHistory += (printedHistory ? '\n' : '') + seg.command;
      }
      if (seg.output) printedHistory += (seg.output ? `\n${seg.output}` : '');
      f -= fr.total;
      continue;
    }
    // Active segment
    const cmdFramesTotal = fr.cmdFrames;
    const enterDelayFrames = fr.enterFrames;
    const outputCharsPerFrame = outCharsPerSec / fps;
    if (f <= cmdFramesTotal) {
      const cmdCount = Math.min(seg.command.length, Math.floor((f / cmdFramesTotal) * seg.command.length));
      visibleCommand = seg.command.slice(0, cmdCount);
    } else if (f <= cmdFramesTotal + enterDelayFrames) {
      visibleCommand = seg.command;
    } else {
      visibleCommand = seg.command;
      const outFrames = f - cmdFramesTotal - enterDelayFrames;
      const outCount = Math.min(seg.output.length, Math.floor(outFrames * outputCharsPerFrame));
      visibleOutput = seg.output.slice(0, outCount);
    }
    break;
  }
  // Auto-scroll to bottom as content grows
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [frame, historyContent, printedHistory, visibleCommand, visibleOutput]);

  const baseW = (COMPOSITION_PREVIEW.width as number) || 1920;
  const baseH = (COMPOSITION_PREVIEW.height as number) || 1080;
  const scaleX = compW / baseW;
  const scaleY = compH / baseH;
  const scaledMaxWidthPx = typeof maxWidthPx === 'number'
    ? Math.round(maxWidthPx * scaleX)
    : (LAYOUT.consoleMaxWidthPx ? Math.round(LAYOUT.consoleMaxWidthPx * scaleX) : undefined);
  const scaledMaxHeightPx = typeof maxHeightPx === 'number' ? Math.round(maxHeightPx * scaleY) : undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.stageBackground, justifyContent: 'center', alignItems: 'center' }}>
      <div ref={scrollRef} style={{
        fontFamily: THEME.codeFontFamily,
        backgroundColor: THEME.codeBackground,
        borderRadius: `${THEME.codeBorderRadiusPx + 4}px`,
        boxShadow: appended ? 'none' : '0 12px 40px rgba(0,0,0,0.35)',
        width: '92%',
        maxWidth: typeof maxWidth === 'string' ? maxWidth : (scaledMaxWidthPx ? `${scaledMaxWidthPx}px` : '100%'),
        overflow: 'hidden',
        maxHeight: typeof maxHeight === 'string' ? maxHeight : (scaledMaxHeightPx ? `${scaledMaxHeightPx}px` : undefined),
        transform: appended ? 'none' : `scale(${0.96 + appear * 0.04})`,
        opacity: appended ? 1 : appear
      }}>
        {title && !appended && (
          <div style={{
            padding: '12px 20px',
            backgroundColor: THEME.filenameBarBackground,
            borderBottom: `1px solid ${THEME.filenameBarBorderColor}`,
            color: THEME.filenameBarTextColor,
            fontSize: '0.9em',
          }}>{title}</div>
        )}
        <pre style={{ margin: 0, padding: `${LAYOUT.codePaddingPx}px`, color: THEME.codeTextColor, whiteSpace: 'pre-wrap', fontSize: (compW >= 3840 && compH >= 2160) ? '2.2rem' : '1.9rem', lineHeight: 1.5, boxSizing: 'border-box', width: '100%' }}>
{(historyContent ? historyContent.split('\n') : []).map((ln, i) => {
  const idxDollar = ln.indexOf(' $ ');
  const idxPercent = ln.indexOf(' % ');
  const idx = idxDollar >= 0 ? idxDollar : idxPercent;
  if (idx >= 0) {
    const p = ln.slice(0, idx + 2);
    const rest = ln.slice(idx + 3);
    return (<React.Fragment key={`hc-${i}`}><span style={{color:'#9cdcfe'}}>{p}</span>{' '}{rest}{'\n'}</React.Fragment>);
  }
  return (<React.Fragment key={`hc-${i}`}>{ln}{'\n'}</React.Fragment>);
})}
{(printedHistory ? printedHistory.split('\n') : []).map((ln, i) => {
  const idxDollar = ln.indexOf(' $ ');
  const idxPercent = ln.indexOf(' % ');
  const idx = idxDollar >= 0 ? idxDollar : idxPercent;
  if (idx >= 0) {
    const p = ln.slice(0, idx + 2);
    const rest = ln.slice(idx + 3);
    return (<React.Fragment key={`ph-${i}`}><span style={{color:'#9cdcfe'}}>{p}</span>{' '}{rest}{'\n'}</React.Fragment>);
  }
  return (<React.Fragment key={`ph-${i}`}>{ln}{'\n'}</React.Fragment>);
})}
{(showPrompt ?? true) ? (
  <>
    <span style={{color:'#9cdcfe'}}>{buildPrompt(cwd, prompt, prefix)}</span>{' '}
  </>
) : null}{visibleCommand}
{visibleOutput && ('\n' + visibleOutput)}
        </pre>
      </div>
    </AbsoluteFill>
  );
};

export default ConsoleCutaway;


