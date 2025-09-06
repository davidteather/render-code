import React, { useEffect, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { ANIMATION, LAYOUT, THEME } from '../../config';

export type ConsoleCutawayProps = {
  content: string;
  title?: string;
  /** Duration of the active sequence portion in frames (typing spans this). */
  durationFrames?: number;
  prompt?: string;
  cwd?: string;
  prefix?: string;
  commandLines?: number;
  commandCps?: number;
  outputCps?: number;
  enterDelay?: number;
  showPrompt?: boolean;
  /** If provided, use this as the local frame (relative to sequence start). */
  frameOverride?: number;
  /** Optional maximum height in pixels to allow scrolling for long outputs. */
  maxHeightPx?: number;
  /** Optional maximum width override in pixels for the console container. */
  maxWidthPx?: number;
  /** Optional prior history to show above the current command/output. */
  historyContent?: string;
  /** Optional multiple segments for multi-command in one block. */
  segments?: Array<{ command: string; output?: string; enterDelay?: number }>;
};

export const ConsoleCutaway: React.FC<ConsoleCutawayProps> = ({ content, title, durationFrames, prompt, cwd, prefix, commandLines, commandCps, outputCps, enterDelay, showPrompt, frameOverride, maxHeightPx, historyContent, segments }) => {
  const globalFrame = useCurrentFrame();
  const frame = Math.max(0, (typeof frameOverride === 'number' ? frameOverride : globalFrame));
  const { fps } = useVideoConfig();
  const appear = spring({ frame, fps, durationInFrames: 18, config: { damping: 200 } });
  const scrollRef = useRef<HTMLDivElement>(null);
  const appended = Boolean(historyContent && historyContent.length > 0);

  // If segments provided, simulate sequential commands; else derive from content
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

  // Compute cumulative frames for each segment
  const segFrames = timeline.map((seg) => {
    const cmdFrames = Math.max(1, Math.ceil((seg.command.length / Math.max(1, cmdCharsPerSec)) * fps));
    const enterFrames = Math.max(0, Math.ceil(seg.enter * fps));
    const outFrames = Math.ceil(((seg.output?.length ?? 0) / Math.max(1, outCharsPerSec)) * fps);
    return { cmdFrames, enterFrames, outFrames, total: cmdFrames + enterFrames + outFrames };
  });
  const segOffsets = segFrames.reduce<number[]>((acc, cur, idx) => {
    const prev = acc[idx - 1] ?? 0;
    acc.push(prev + cur.total);
    return acc;
  }, []);

  let visibleCommand = '';
  let visibleOutput = '';
  let printedHistory = '';
  let f = frame;
  for (let i = 0; i < timeline.length; i++) {
    const seg = timeline[i];
    const fr = segFrames[i];
    if (i < timeline.length - 1 && f >= fr.total) {
      // whole segment is already done; add fully to printedHistory and continue
      printedHistory += (printedHistory ? '\n' : '') + ((showPrompt ?? true) ? `${prefix ? prefix : ((cwd ? `${cwd} ` : '') + (prompt ?? '$'))} ` : '') + seg.command;
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

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.stageBackground, justifyContent: 'center', alignItems: 'center' }}>
      <div ref={scrollRef} style={{
        fontFamily: THEME.codeFontFamily,
        backgroundColor: THEME.codeBackground,
        borderRadius: `${THEME.codeBorderRadiusPx + 4}px`,
        boxShadow: appended ? 'none' : '0 12px 40px rgba(0,0,0,0.35)',
        width: '92%',
        maxWidth: maxWidthPx ? `${maxWidthPx}px` : (LAYOUT.consoleMaxWidthPx ? `${LAYOUT.consoleMaxWidthPx}px` : '100%'),
        overflow: 'hidden',
        maxHeight: maxHeightPx ? `${maxHeightPx}px` : undefined,
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
        <pre style={{ margin: 0, padding: `${LAYOUT.codePaddingPx}px`, color: THEME.codeTextColor, whiteSpace: 'pre-wrap', fontSize: '1.9rem', lineHeight: 1.45, boxSizing: 'border-box', width: '100%' }}>
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
    <span style={{color:'#9cdcfe'}}>{prefix ? prefix : ((cwd ? `${cwd} ` : '') + (prompt ?? '$'))}</span>{' '}
  </>
) : null}{visibleCommand}
{visibleOutput && ('\n' + visibleOutput)}
        </pre>
      </div>
    </AbsoluteFill>
  );
};

export default ConsoleCutaway;


