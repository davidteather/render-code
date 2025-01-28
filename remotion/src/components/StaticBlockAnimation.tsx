// CodeBlockAnimation.tsx
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, Sequence, spring } from 'remotion';
import { CodeBlock } from './CodeBlock';
import { diffChars } from 'diff';

const TRANSITION_DURATION = 30;

const CodeBlockAnimation: React.FC<{ markdown: any }> = ({ markdown }) => {
  const frame = useCurrentFrame();
  const allCodeBlocks = markdown.sections.flatMap((s: any) => s.codeBlocks);

  const { blocks, totalFrames } = useMemo(() => {
    let currentFrame = 0;
    const blocks = allCodeBlocks.map((block: any, index: number) => {
      const prevCode = index > 0 ? allCodeBlocks[index - 1].content : '';
      const changes = diffChars(prevCode, block.content);
      const addedChars = changes.filter(c => c.added).reduce((a,c) => a + c.value.length, 0);
      
      const duration = Math.max(
        Math.round(addedChars * 0.5), // Only animate new characters
        30
      );

      const start = currentFrame;
      currentFrame += duration + TRANSITION_DURATION;

      return { ...block, prevCode, start, duration, addedChars };
    });

    return { blocks, totalFrames: currentFrame };
  }, [allCodeBlocks]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#1e1e1e' }}>
      {blocks.map((block: any, index: number) => {
        const progress = spring({
          frame: frame - block.start,
          fps: 30,
          durationInFrames: block.duration,
          config: { damping: 100 },
        });

        const isActive = frame >= block.start && frame < block.start + block.duration;

        return (
          <Sequence key={index} from={block.start} durationInFrames={block.duration + TRANSITION_DURATION}>
            <CodeBlock
              oldCode={block.prevCode}
              newCode={block.content}
              language={block.language}
              progress={progress}
              isActive={isActive}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export default CodeBlockAnimation;