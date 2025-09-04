import React, { useMemo } from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { diffChars } from 'diff';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import './prism-config';
import 'prismjs/components/prism-python';
import { LAYOUT, THEME } from '../config';

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
  const { width, height } = useVideoConfig();
  const isMobile = width < LAYOUT.mobileBreakpointPx;
  const is4k = width >= 3840 && height >= 2160;

  const highlightedCode = useMemo(() => {
    // During tail frames (not active), show the final code without diff highlight
    if (!isActive) {
      return Prism.highlight(newCode, Prism.languages[language], language);
    }

    const changes = diffChars(oldCode, newCode);
    let totalAdded = 0;
    for (const part of changes) {
      if (part.added) totalAdded += part.value.length;
    }

    const targetAdditions = Math.floor(progress * totalAdded);
    let addedSoFar = 0;

    const renderedParts: string[] = [];
    for (const part of changes) {
      if (part.removed) {
        // Removed segments are not present in the new code
        continue;
      }

      if (part.added) {
        const remaining = targetAdditions - addedSoFar;
        if (remaining <= 0) {
          // Not yet typed; skip entirely so it appears later
          continue;
        }
        const visibleLen = Math.min(part.value.length, remaining);
        if (visibleLen > 0) {
          renderedParts.push(
            `KEYDIFFMATCHKEY${part.value.slice(0, visibleLen)}KEYDIFFMATCHENDKEY`
          );
          addedSoFar += visibleLen;
        }
        continue;
      }

      // Unchanged text remains visible throughout
      renderedParts.push(part.value);
    }

    const visibleCode = renderedParts.join("");

    // Highlight with Prism, then apply diff wrappers
    const highlighted = Prism.highlight(visibleCode, Prism.languages[language], language);

    return highlighted
      .replace(/KEYDIFFMATCHKEY/g, '<span class="diff-added">')
      .replace(/KEYDIFFMATCHENDKEY/g, '</span>');
  }, [oldCode, newCode, language, progress, isActive]);

  const staticStyles = useMemo(() => {
    if (!isStatic) return {};

    const containerWidth = `${(maxLineLength || 1) + 4}ch`;
    const lineHeight = LAYOUT.staticLineHeightMultiplier;
    const verticalPadding = LAYOUT.staticVerticalPaddingPx;
    const fileNameHeight = fileName ? LAYOUT.filenameBarHeightPx : 0;
    const fontSize = isMobile
      ? LAYOUT.codeFontSizeMobile
      : (is4k ? LAYOUT.codeFontSizeDesktop4k : LAYOUT.codeFontSizeDesktop);
    const numericFontSizePx = parseFloat(fontSize) * 16; // rem -> px
    const lineHeightPx = numericFontSizePx * lineHeight;

    return {
      width: containerWidth,
      maxWidth: containerWidth,
      minHeight: `${((maxLineCount || 1) * lineHeightPx + verticalPadding + fileNameHeight) / 16}rem`
    };
  }, [isStatic, maxLineLength, maxLineCount, fileName, isMobile]);

  const codeStyles = {
    fontSize: isMobile
      ? LAYOUT.codeFontSizeMobile
      : (is4k ? LAYOUT.codeFontSizeDesktop4k : LAYOUT.codeFontSizeDesktop),
    maxWidth: isMobile
      ? LAYOUT.codeMaxWidthMobile
      : (is4k ? LAYOUT.codeMaxWidthDesktop4k : LAYOUT.codeMaxWidthDesktop),
    ...(isStatic && { 
      overflow: 'hidden auto',
      minWidth: staticStyles.width 
    })
  };

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        fontFamily: THEME.codeFontFamily,
        backgroundColor: THEME.codeBackground,
        borderRadius: `${THEME.codeBorderRadiusPx}px`,
        boxShadow: THEME.codeShadow,
        overflow: 'hidden',
        transform: `scale(${isMobile ? 0.8 : 1})`,
        ...codeStyles,
        ...staticStyles
      }}>
        {fileName && (<div style={{
          padding: '12px 20px',
          backgroundColor: THEME.filenameBarBackground,
          borderBottom: `1px solid ${THEME.filenameBarBorderColor}`,
          color: THEME.filenameBarTextColor,
          fontSize: '0.9em',
        }}>
          {fileName}
        </div>)}
        
        <pre className={`language-${language}`} style={{
          margin: 0,
          padding: `${LAYOUT.codePaddingPx}px`,
          overflow: 'hidden',
        }}>
          <code
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            style={{
              color: THEME.codeTextColor,
              whiteSpace: 'pre-wrap',
              display: 'block',
            }}
          />
        </pre>
      </div>
    </AbsoluteFill>
  );
};
