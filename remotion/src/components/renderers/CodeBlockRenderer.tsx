import React from 'react';
import { CodeBlock } from '../CodeBlock';
import { CodeBlockRendererProps } from '../../types/components';

export const CodeBlockRenderer: React.FC<CodeBlockRendererProps> = ({
  oldCode,
  newCode,
  language,
  progress,
  isActive,
  fileName,
  maxLineLength,
  maxLineCount,
}) => {
  return (
    <CodeBlock
      oldCode={oldCode}
      newCode={newCode}
      language={language}
      progress={progress}
      isActive={isActive}
      fileName={fileName}
      isStatic={true}
      maxLineLength={maxLineLength}
      maxLineCount={maxLineCount}
    />
  );
};

export default CodeBlockRenderer;


