import React, { useEffect, useState } from 'react';
import { useVideoConfig, useCurrentFrame, staticFile } from 'remotion';
import { parseMarkdown } from './markdownParser/parseMarkdown';
import CodeBlockAnimation from './components/CodeBlockAnimation';
import { ParsedMarkdown } from './models';
import { COMPOSITION, ENV, THEME } from './config';

export const MyComposition = () => {
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const [markdownData, setMarkdownData] = useState<ParsedMarkdown | null>(null);

  if (ENV.requireMarkdownEnv && process.env[ENV.markdownEnvVar] === undefined) {
    throw new Error(`Please set the ${ENV.markdownEnvVar} environment variable.`);
  }

  const inputFilePath = staticFile(process.env[ENV.markdownEnvVar] || ENV.defaultMarkdownFile);

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
    <div style={{ width, height, backgroundColor: COMPOSITION.backgroundColor, color: 'white' }}>
      <CodeBlockAnimation markdown={markdownData} />
    </div>
  );
};
