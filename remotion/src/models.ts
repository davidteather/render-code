export interface MarkdownFrontmatter {
  theme: string;
}

export interface CodeBlock {
  language: string;
  content: string;
}

export interface ParsedMarkdown {
  frontmatter: MarkdownFrontmatter;
  sections: {
    title: string;
    codeBlocks: CodeBlock[];
  }[];
}
