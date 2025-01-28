import { unified } from 'unified';
import remarkParse from 'remark-parse';
import matter from 'gray-matter';
import { MarkdownFrontmatter, ParsedMarkdown, CodeBlock } from '../models';

/**
 * Fetches the markdown file from the provided URL, parses it, and extracts frontmatter and code blocks.
 */
export async function parseMarkdown(url: string): Promise<ParsedMarkdown> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch markdown from ${url}`);
    }
    const markdownContent = await response.text();

    const { data: frontmatter, content } = matter(markdownContent);

    const parsedFrontmatter: MarkdownFrontmatter = {
      theme: frontmatter.theme || 'light',
    };

    const markdownAST = unified()
      .use(remarkParse)
      .parse(content);

    const sections = extractSectionsFromAST(markdownAST);

    return {
      frontmatter: parsedFrontmatter,
      sections: sections,
    };
  } catch (err) {
    console.error('Error fetching or parsing markdown:', err);
    throw err;
  }
}

/**
 * Extracts sections and code blocks from the markdown AST.
 */
function extractSectionsFromAST(ast: any): { title: string, codeBlocks: CodeBlock[] }[] {
  const sections: { title: string, codeBlocks: CodeBlock[] }[] = [];
  let currentSection: { title: string, codeBlocks: CodeBlock[] } | null = null;

  ast.children.forEach((node: any) => {
    if (node.type === 'heading' && node.depth === 1) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = { title: node.children[0].value, codeBlocks: [] };
    }

    if (node.type === 'code') {
      if (currentSection) {
        currentSection.codeBlocks.push({
          language: node.lang || 'plaintext',
          content: node.value,
        });
      }
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}
