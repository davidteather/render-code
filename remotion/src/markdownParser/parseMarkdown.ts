import { unified } from 'unified';
import remarkParse from 'remark-parse';
import matter from 'gray-matter';
import { MarkdownFrontmatter, ParsedMarkdown, CodeBlock, TypedCodeBlock } from '../models';

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
 * Parses markdown content from a string (Node-friendly; no fetch required).
 */
export function parseMarkdownString(markdownContent: string): ParsedMarkdown {
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
        // Support lang:path/to/file.ext pattern for future multi-file projects
        const langRaw: string = node.lang || 'plaintext';
        let language = langRaw;
        let filePath: string | undefined;
        const colonIdx = langRaw.indexOf(':');
        if (colonIdx > 0) {
          language = langRaw.slice(0, colonIdx);
          filePath = langRaw.slice(colonIdx + 1);
        }

        currentSection.codeBlocks.push({
          language,
          content: node.value,
          // @ts-ignore retain for future extension
          filePath,
        } as TypedCodeBlock as unknown as CodeBlock);
      }
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}
