import { readFileSync } from 'fs';
import { parseMarkdownString } from '../src/markdownParser/parseMarkdown';

const mdPath = process.argv[2] || 'public/input.md';
const content = readFileSync(mdPath, 'utf-8');
const parsed = parseMarkdownString(content);
const summary = parsed.sections.flatMap((s) => s.blocks.map((b: any) => b.type));
console.log(JSON.stringify(summary));


