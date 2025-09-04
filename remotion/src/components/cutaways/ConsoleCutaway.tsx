import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { ANIMATION, LAYOUT, THEME } from '../../config';

export type ConsoleCutawayProps = {
  content: string;
  title?: string;
  /** Duration of the active sequence portion in frames (typing spans this). */
  durationFrames?: number;
  prompt?: string;
  commandLines?: number;
  commandCps?: number;
  outputCps?: number;
  enterDelay?: number;
  showPrompt?: boolean;
  /** If provided, use this as the local frame (relative to sequence start). */
  frameOverride?: number;
};

export const ConsoleCutaway: React.FC<ConsoleCutawayProps> = ({ content, title, durationFrames, prompt, commandLines, commandCps, outputCps, enterDelay, showPrompt, frameOverride }) => {
  const globalFrame = useCurrentFrame();
  const frame = Math.max(0, (typeof frameOverride === 'number' ? frameOverride : globalFrame));
  const { fps } = useVideoConfig();
  const appear = spring({ frame, fps, durationInFrames: 18, config: { damping: 200 } });

  // Split into first line (command) and the rest (output)
  const lines = content.split('\n');
  const numCmdLines = Math.max(1, commandLines ?? 1);
  const command = lines.slice(0, numCmdLines).join('\n');
  const output = lines.slice(numCmdLines).join('\n');

  const cmdCharsPerSec = commandCps ?? ANIMATION.consoleCommandCharsPerSecond;
  const outCharsPerSec = outputCps ?? ANIMATION.consoleOutputCharsPerSecond;
  const enterDelaySec = enterDelay ?? ANIMATION.consoleEnterDelaySeconds;

  const cmdFramesTotal = Math.max(1, Math.ceil((command.length / Math.max(1, cmdCharsPerSec)) * fps));
  const enterDelayFrames = Math.max(0, Math.ceil(enterDelaySec * fps));
  const outputCharsPerFrame = outCharsPerSec / fps;

  let visibleCommand = '';
  let visibleOutput = '';
  if (frame <= cmdFramesTotal) {
    const cmdCount = Math.min(command.length, Math.floor((frame / cmdFramesTotal) * command.length));
    visibleCommand = command.slice(0, cmdCount);
  } else if (frame <= cmdFramesTotal + enterDelayFrames) {
    visibleCommand = command; // wait for Enter
  } else {
    visibleCommand = command;
    const outFrames = frame - cmdFramesTotal - enterDelayFrames;
    const outCount = Math.min(output.length, Math.floor(outFrames * outputCharsPerFrame));
    visibleOutput = output.slice(0, outCount);
  }
  return (
    <AbsoluteFill style={{ backgroundColor: THEME.stageBackground, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        fontFamily: THEME.codeFontFamily,
        backgroundColor: THEME.codeBackground,
        borderRadius: `${THEME.codeBorderRadiusPx + 4}px`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
        width: '80%',
        maxWidth: '100ch',
        overflow: 'hidden',
        transform: `scale(${0.96 + appear * 0.04})`,
        opacity: appear
      }}>
        {title && (
          <div style={{
            padding: '12px 20px',
            backgroundColor: THEME.filenameBarBackground,
            borderBottom: `1px solid ${THEME.filenameBarBorderColor}`,
            color: THEME.filenameBarTextColor,
            fontSize: '0.9em',
          }}>{title}</div>
        )}
        <pre style={{ margin: 0, padding: `${LAYOUT.codePaddingPx}px`, color: THEME.codeTextColor, whiteSpace: 'pre-wrap', fontSize: '1.9rem', lineHeight: 1.45 }}>
{(showPrompt ?? true) ? (<><span style={{color:'#9cdcfe'}}>{prompt ?? '$'}</span> </>) : null}{visibleCommand}
{visibleOutput && ('\n' + visibleOutput)}
        </pre>
      </div>
    </AbsoluteFill>
  );
};

export default ConsoleCutaway;


