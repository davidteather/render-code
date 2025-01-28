import { diffChars } from 'diff';

const TRANSITION_DURATION = 30;
const instantChanges = false;

export type CodeBlockMetadata = {
  content: string;
  language: string;
  start: number;
  duration: number;
  addedChars: number;
};

export function computeCodeBlockMetadata(allCodeBlocks: any[]): {
  blocks: CodeBlockMetadata[];
  totalFrames: number;
  maxLineLengthGlobal: number;
  maxLineCountGlobal: number;
} {
  let currentFrame = 0;
  const blocks = allCodeBlocks.map((block: any, index: number) => {
    const prevCode = index > 0 ? allCodeBlocks[index - 1].content : '';
    const changes = diffChars(prevCode, block.content);
    const addedChars = changes
      .filter(c => c.added)
      .reduce((a, c) => a + c.value.length, 0);

    const duration = instantChanges
      ? 0.000001
      : Math.max(Math.round(addedChars * 0.3), 20);

    const start = currentFrame;
    currentFrame += duration + TRANSITION_DURATION;

    return {
      content: block.content,
      language: block.language,
      start,
      duration,
      addedChars
    };
  });

  let maxLineLengthGlobal = 0;
  let maxLineCountGlobal = 0;
  allCodeBlocks.forEach((block: any) => {
    const lines = block.content.split('\n');
    const lineCount = lines.length;
    const lineLengths = lines.map((line: any) => line.length);
    const blockMaxLineLength = Math.max(...lineLengths);
    maxLineLengthGlobal = Math.max(maxLineLengthGlobal, blockMaxLineLength);
    maxLineCountGlobal = Math.max(maxLineCountGlobal, lineCount);
  });

  return { blocks, totalFrames: currentFrame, maxLineLengthGlobal, maxLineCountGlobal };
}
