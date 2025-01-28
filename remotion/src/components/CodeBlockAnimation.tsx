
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, Sequence, spring, Artifact } from 'remotion';
import { CodeBlock } from './CodeBlock';
import { computeCodeBlockMetadata } from '../calculations/animation_length';

const CodeBlockAnimation: React.FC<{ markdown: any }> = ({ markdown }) => {
  const frame = useCurrentFrame();
  const allCodeBlocks = markdown.sections.flatMap((s: any) => s.codeBlocks);

  const { blocks, totalFrames, maxLineLengthGlobal, maxLineCountGlobal } = useMemo(
    () => computeCodeBlockMetadata(allCodeBlocks),
    [allCodeBlocks]
  );

  const extraFramesPerBlock = 30;
  

  return (
    <>
    {frame === 0 && (<Artifact filename="metadata.json" content={JSON.stringify(
        { blocks, totalFrames, maxLineLengthGlobal, maxLineCountGlobal, extraFramesPerBlock }
    )} />)}
    <AbsoluteFill style={{ backgroundColor: '#1e1e1e' }}>
      {blocks.map((block: any, index: number) => {
        const progress = spring({
          frame: frame - block.start,
          fps: 30,
          durationInFrames: block.duration,
          config: { damping: 20, stiffness: 200, mass: 0.5 }
        });
        const isActive = frame >= block.start && frame < block.start + block.duration;

        return (
          <Sequence key={index} from={block.start} durationInFrames={block.duration + extraFramesPerBlock}>
            <CodeBlock
              oldCode={index > 0 ? blocks[index - 1].content : ''}
              newCode={block.content}
              language={block.language}
              progress={progress}
              isActive={isActive}
              fileName='test.py'
              isStatic={true}
              maxLineLength={maxLineLengthGlobal}
              maxLineCount={maxLineCountGlobal}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
    </>
  );
};

export default CodeBlockAnimation;
