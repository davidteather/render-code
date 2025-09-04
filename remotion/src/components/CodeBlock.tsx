import React, { useMemo } from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { diffChars } from 'diff';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import './prism-config';
import 'prismjs/components/prism-python';

interface CodeBlockProps {
  oldCode: string;
  newCode: string;
  language: string;
  progress: number;
  isActive: boolean;

  // style option props
  fileName?: string;
  isStatic?: boolean;
  maxLineLength?: number;
  maxLineCount?: number;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  oldCode,
  newCode,
  language,
  progress,
  isActive,
  fileName,
  isStatic = false,
  maxLineLength,
  maxLineCount,
}) => {
  const { width } = useVideoConfig();
  const isMobile = width < 768;

  const highlightedCode = useMemo(() => {
    // During tail frames (not active), show the final code without diff highlight
    if (!isActive) {
      return Prism.highlight(newCode, Prism.languages[language], language);
    }

    const changes = diffChars(oldCode, newCode);
    const visibleArray = oldCode.split(''); // Start with old code as an array
    let currentPosition = 0;
    let newInsertions = 0;
    let addedCharacters = 0;
    
    // Count total added characters for proper progress scaling
    for (const part of changes) {
      if (part.added) {
        addedCharacters += part.value.length;
      }
    }

    const targetAdditions = Math.floor(progress * addedCharacters);
    let addedSoFar = 0;
  
    for (const part of changes) {
      if (part.removed) {
        continue;
      }
      
      const isAddition = part.added;
      const content = part.value;
      
      if (isAddition) {
        const visibleLength = Math.min(content.length, targetAdditions - addedSoFar);
        if (visibleLength <= 0) break;

        const wrappedContent = `KEYDIFFMATCHKEY${content.slice(0, visibleLength)}KEYDIFFMATCHENDKEY`;
        visibleArray.splice(currentPosition + newInsertions, 0, ...wrappedContent);
        newInsertions += wrappedContent.length;
        addedSoFar += visibleLength;
      }
      
      currentPosition += content.length;
    }
  
    const visibleCode = visibleArray.join('');
  
    // Highlight with Prism
    const highlighted = Prism.highlight(visibleCode, Prism.languages[language], language);
  
    return highlighted.replace(/KEYDIFFMATCHKEY/g, '<span class="diff-added">')
                      .replace(/KEYDIFFMATCHENDKEY/g, '</span>');
  }, [oldCode, newCode, language, progress, isActive]);

  const staticStyles = useMemo(() => {
    if (!isStatic) return {};

    const containerWidth = `${(maxLineLength || 1) + 4}ch`;
    const lineHeight = 1.5;
    const verticalPadding = 40;
    const fileNameHeight = fileName ? 44 : 0;
    const lineHeightPx = parseInt(isMobile ? '1.6rem' : '2rem', 10) * lineHeight;

    return {
      width: containerWidth,
      maxWidth: containerWidth,
      minHeight: `${((maxLineCount || 1) * lineHeightPx + verticalPadding + fileNameHeight) / 16}rem`
    };
  }, [isStatic, maxLineLength, maxLineCount, fileName, isMobile]);

  const codeStyles = {
    fontSize: isMobile ? '1.6rem' : '2rem',
    maxWidth: isMobile ? '90%' : '80ch',
    ...(isStatic && { 
      overflow: 'hidden auto',
      minWidth: staticStyles.width 
    })
  };

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        fontFamily: '"Fira Code", monospace',
        backgroundColor: '#2d2d2d',
        borderRadius: '8px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        transform: `scale(${isMobile ? 0.8 : 1})`,
        ...codeStyles,
        ...staticStyles
      }}>
        {fileName && (<div style={{
          padding: '12px 20px',
          backgroundColor: '#252526',
          borderBottom: '1px solid #404040',
          color: '#888',
          fontSize: '0.9em',
        }}>
          {fileName}
        </div>)}
        
        <pre className={`language-${language}`} style={{
          margin: 0,
          padding: '20px',
          overflow: 'hidden',
        }}>
          <code
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            style={{
              color: '#d4d4d4',
              whiteSpace: 'pre-wrap',
              display: 'block',
            }}
          />
        </pre>
      </div>
    </AbsoluteFill>
  );
};
