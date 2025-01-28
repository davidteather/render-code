import React, { useEffect, useState } from 'react';
import { useVideoConfig, useCurrentFrame, staticFile } from 'remotion';
import { parseMarkdown } from './markdownParser/parseMarkdown';
import CodeBlockAnimation from './components/CodeBlockAnimation';
import { ParsedMarkdown } from './models';

export const MyComposition = () => {
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const [markdownData, setMarkdownData] = useState<ParsedMarkdown | null>(null);

  if (process.env.MARKDOWN_FILE === undefined) {
    throw new Error('Please set the MARKDOWN_FILE environment variable.');
  }

  const inputFilePath = staticFile(process.env.MARKDOWN_FILE || ''); // Adjust the path as needed for your file.

  // Fetch and parse markdown data on component mount
  useEffect(() => {
    async function main() {
      try {
        const parsedData = await parseMarkdown(inputFilePath);
        setMarkdownData(parsedData);
        console.log('Parsed Markdown:', parsedData);
      } catch (err) {
        console.error('Error parsing markdown:', err);
      }
    }

    main();
  }, [inputFilePath]);

  // Return early if markdown data hasn't been loaded yet
  if (!markdownData) {
    return null; // You can also render a loading state here
  }

  return (
    <div style={{ width, height, backgroundColor: '#282c34', color: 'white' }}>
      <CodeBlockAnimation markdown={markdownData} />
    </div>
  );
};
