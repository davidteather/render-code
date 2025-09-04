export interface MarkdownFrontmatter {
  theme: string;
}

export interface CodeBlock {
  language: string;
  content: string;
}

export type BlockType = 'code' | 'cutaway-image' | 'cutaway-video' | 'cutaway-console';

export interface BaseBlock {
  type: BlockType;
}

export interface TypedCodeBlock extends BaseBlock {
  type: 'code';
  language: string;
  content: string;
  filePath?: string; // optional path parsed from lang:path/file.ext
}

export type ParsedBlock = TypedCodeBlock; // extend later with cutaways

export interface ParsedMarkdown {
  frontmatter: MarkdownFrontmatter;
  sections: {
    title: string;
    codeBlocks: CodeBlock[];
  }[];
}
