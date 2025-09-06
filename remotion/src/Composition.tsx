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

  // Fetch and parse markdown data on component mount
  useEffect(() => {
    async function main() {
      try {
        const parsedData = await parseMarkdown(inputFilePath);
        setMarkdownData(parsedData);
        console.log('Parsed Markdown:', parsedData);
      } catch (err) {
        console.error('Error parsing markdown:', err);
        setParseError(err);
      }
    }

    main();
  }, [inputFilePath]);

  // Fail fast on parse errors so the renderer exits with a non-zero status
  if (parseError) {
    throw parseError instanceof Error ? parseError : new Error(String(parseError));
  }
  // Return early if markdown data hasn't been loaded yet
  if (!markdownData) {
    return null; // Loading placeholder
  }

  const merged = loadUserSettings(userSettings);

  return (
    <div style={{ width, height, backgroundColor: merged.composition.backgroundColor || COMPOSITION.backgroundColor, color: 'white' }}>
      <CodeBlockAnimation markdown={markdownData} themeOverride={merged.theme} />
    </div>
  );
};
