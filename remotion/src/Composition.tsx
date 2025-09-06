import React, { useEffect, useState } from 'react';
import { useVideoConfig, staticFile } from 'remotion';
import { parseMarkdown } from './markdownParser/parseMarkdown';
import CodeBlockAnimation from './components/CodeBlockAnimation';
import { ParsedMarkdown } from './models';
import { COMPOSITION, UserSettings, loadUserSettings } from './config';

type MyCompProps = { markdownFile?: string; userSettings?: UserSettings };

export const MyComposition: React.FC<MyCompProps> = ({ markdownFile, userSettings }) => {
  const { width, height } = useVideoConfig();

  const [markdownData, setMarkdownData] = useState<ParsedMarkdown | null>(null);
  const [parseError, setParseError] = useState<unknown | null>(null);

  const inputFilePath = staticFile(markdownFile || 'input.md');

  useEffect(() => {
    async function main() {
      try {
        const parsedData = await parseMarkdown(inputFilePath);
        setMarkdownData(parsedData);
      } catch (err) {
        console.error('Error parsing markdown:', err);
        setParseError(err);
      }
    }

    main();
  }, [inputFilePath]);

  if (parseError) {
    throw parseError instanceof Error ? parseError : new Error(String(parseError));
  }
  if (!markdownData) {
    return null;
  }

  const merged = loadUserSettings(userSettings);

  return (
    <div style={{ width, height, backgroundColor: merged.composition.backgroundColor || COMPOSITION.backgroundColor, color: 'white' }}>
      <CodeBlockAnimation markdown={markdownData} themeOverride={merged.theme} />
    </div>
  );
};
