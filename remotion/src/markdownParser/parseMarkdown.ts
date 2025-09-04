import matter from 'gray-matter';
import { MarkdownFrontmatter, ParsedMarkdown, ParsedBlock } from '../models';

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

    return parseMarkdownString(markdownContent);
  } catch (err) {
    console.error('Error fetching or parsing markdown:', err);
    throw err;
  }
}

/**
 * Parses markdown content from a string (Node-friendly; no fetch required).
 */
export function parseMarkdownString(markdownContent: string): ParsedMarkdown {
  const { data: fm, content } = matter(markdownContent);

  const parsedFrontmatter: MarkdownFrontmatter = {
    theme: fm?.theme || 'light',
  };

  const sections = extractSectionsFromContent(content);

  return {
    frontmatter: parsedFrontmatter,
    sections,
  };
}

/**
 * Extracts sections and code blocks from the markdown AST.
 */
function extractSectionsFromContent(content: string): { title: string; blocks: ParsedBlock[] }[] {
  const lines = content.split(/\r?\n/);
  const sections: { title: string; blocks: ParsedBlock[] }[] = [];
  let currentSection: { title: string; blocks: ParsedBlock[] } | null = null;

  const ensureSection = () => {
    if (!currentSection) {
      currentSection = { title: 'Intro', blocks: [] };
    }
  };

  const parseInfoString = (info: string): { language: string; title?: string; flags: Record<string, any> } => {
    let language = 'plaintext';
    let title: string | undefined;
    const flags: Record<string, any> = {};
    const trimmed = (info || '').trim();
    if (!trimmed) return { language, flags };

    // Handle lang:{...} form
    const braceIdx = trimmed.indexOf('{');
    const before = braceIdx >= 0 ? trimmed.slice(0, braceIdx).trim() : trimmed;
    const attrsRaw = braceIdx >= 0 ? trimmed.slice(braceIdx) : '';

    if (before) {
      // Keep colon parsing for legacy, but map to title directly
      const colonIdx = before.indexOf(':');
      if (colonIdx > 0) {
        language = before.slice(0, colonIdx);
        const pathValue = before.slice(colonIdx + 1);
        const parts = pathValue.split('/');
        title = parts[parts.length - 1];
      } else {
        language = before;
      }
    }

    if (attrsRaw.startsWith('{')) {
      // Support quoted and unquoted values via the same parser used by directives
      const inner = attrsRaw.slice(1, attrsRaw.lastIndexOf('}'));
      const parsed = parseDirectiveAttrs(inner);
      if (typeof parsed['title'] === 'string') title = parsed['title'];
      if (typeof parsed['highlight'] === 'boolean') flags.highlight = parsed['highlight'];
      if (typeof parsed['type_fillin'] === 'boolean') flags.typeFillin = parsed['type_fillin'];
      if (typeof parsed['start_from_blank'] === 'boolean') flags.startFromBlank = parsed['start_from_blank'];
    }

    return { language, title, flags };
  };

  const parseDirectiveAttrs = (attrs: string): Record<string, any> => {
    const out: Record<string, any> = {};
    const regex = /(\w+)\s*=\s*("([^"]*)"|[^\s]+)/g; // key="value" or key=value
    let m: RegExpExecArray | null;
    while ((m = regex.exec(attrs)) !== null) {
      const key = m[1];
      const raw = m[3] ?? m[2];
      let value: any = raw;
      if (typeof value === 'string') {
        // try number
        if (/^\d+(\.\d+)?$/.test(value)) value = parseFloat(value);
        if (value === 'true') value = true;
        if (value === 'false') value = false;
      }
      out[key] = value;
    }
    return out;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Section heading
    if (line.startsWith('# ')) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: line.slice(2).trim(), blocks: [] };
      continue;
    }

    // Code fence start
    if (line.startsWith('```')) {
      ensureSection();
      const info = line.slice(3).trim();
      const { language, title, flags } = parseInfoString(info);
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      currentSection!.blocks.push({
        type: 'code',
        language,
        content: buf.join('\n'),
        title,
        highlight: typeof flags.highlight === 'boolean' ? flags.highlight : undefined,
        typeFillin: typeof flags.typeFillin === 'boolean' ? flags.typeFillin : undefined,
        startFromBlank: typeof flags.startFromBlank === 'boolean' ? flags.startFromBlank : undefined,
      });
      continue;
    }

    // Cutaway directive
    if (line.startsWith(':::cutaway')) {
      ensureSection();
      const attrsStr = line.replace(':::cutaway', '').trim();
      const attrs = parseDirectiveAttrs(attrsStr);
      const type = String(attrs.type || 'console');
      const title = attrs.title as string | undefined;
      const durationSeconds = typeof attrs.duration === 'number' ? attrs.duration : (attrs.durationSeconds as number | undefined);

      if (type === 'image') {
        currentSection!.blocks.push({
          type: 'cutaway-image',
          src: String(attrs.src || ''),
          width: typeof attrs.width === 'number' ? attrs.width : undefined,
          height: typeof attrs.height === 'number' ? attrs.height : undefined,
          alt: attrs.alt as string | undefined,
          title,
          durationSeconds,
        });
        continue;
      }

      if (type === 'video') {
        currentSection!.blocks.push({
          type: 'cutaway-video',
          src: String(attrs.src || ''),
          start: typeof attrs.start === 'number' ? attrs.start : undefined,
          end: typeof attrs.end === 'number' ? attrs.end : undefined,
          width: typeof attrs.width === 'number' ? attrs.width : undefined,
          height: typeof attrs.height === 'number' ? attrs.height : undefined,
          muted: attrs.muted === true,
          playToEnd: attrs.playToEnd === true,
          title,
          durationSeconds,
        });
        continue;
      }

      // console: read content until closing :::
      const buf: string[] = [];
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== ':::') {
        buf.push(lines[j]);
        j++;
      }
      currentSection!.blocks.push({
        type: 'cutaway-console',
        content: buf.join('\n'),
        title,
        durationSeconds,
        prompt: typeof attrs.prompt === 'string' ? attrs.prompt : undefined,
        commandLines: typeof attrs.commandLines === 'number' ? attrs.commandLines : undefined,
        commandCps: typeof attrs.commandCps === 'number' ? attrs.commandCps : undefined,
        outputCps: typeof attrs.outputCps === 'number' ? attrs.outputCps : undefined,
        enterDelay: typeof attrs.enterDelay === 'number' ? attrs.enterDelay : undefined,
        showPrompt: attrs.showPrompt === false ? false : (attrs.showPrompt === true ? true : undefined),
      });
      i = j; // skip to closing ::: line
      continue;
    }
  }

  if (currentSection) sections.push(currentSection);
  if (sections.length === 0) sections.push({ title: 'Intro', blocks: [] });
  return sections;
}
