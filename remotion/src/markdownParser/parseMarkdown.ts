import matter from 'gray-matter';
import { MarkdownFrontmatter, ParsedMarkdown, ParsedBlock, LayoutPane, CutawayType } from '../models';

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

  const { sections, warnings } = extractSectionsFromContent(content);
  const skip = typeof process !== 'undefined' && process.env && (process.env.SKIP_WARNINGS === '1');
  if (warnings.length && !skip) {
    throw new Error(`Markdown parser warnings (fail-fast): ${warnings.join(' | ')}`);
  }

  return {
    frontmatter: parsedFrontmatter,
    sections,
  };
}

/**
 * Extracts sections and code blocks from the markdown AST.
 */
function extractSectionsFromContent(content: string): { sections: { title: string; blocks: ParsedBlock[] }[]; warnings: string[] } {
  const lines = content.split(/\r?\n/);
  const sections: { title: string; blocks: ParsedBlock[] }[] = [];
  const warnings: string[] = [];
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
      const colonIdx = before.indexOf(':');
      if (colonIdx > 0) {
        const pathPart = before.slice(colonIdx + 1).trim();
        // If there is a non-empty path segment before the attrs brace, it's legacy
        if (pathPart.length > 0) {
          language = before.slice(0, colonIdx) || 'plaintext';
          warnings.push('Legacy code fence syntax `lang:path` is deprecated. Use `lang:{title="file.ext"}` instead.');
        } else {
          // Form like `ts:{...}` -> colon is part of the attrs separator, not legacy
          language = before.slice(0, colonIdx) || 'plaintext';
        }
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
        value = value.replace(/,+$/g, ''); // trim trailing commas
        // try number
        if (/^\d+(\.\d+)?$/.test(value)) value = parseFloat(value);
        if (value === 'true') value = true;
        if (value === 'false') value = false;
      }
      out[key] = value;
    }
    return out;
  };

  const isDirective = (line: string, name: string) => new RegExp(`^:{3,}${name}(\\s|$)`).test(line.trim());
  const isDirectiveClose = (line: string) => /^:{3,}\s*$/.test(line.trim());
  const leadingColons = (line: string): number => {
    const m = line.trim().match(/^(:{3,})/);
    return m ? m[1].length : 0;
  };
  const warnIfExtraColons = (line: string, which: string) => {
    const count = leadingColons(line);
    if (count > 3) warnings.push(`${which} opened with ${count} colons; prefer :::`);
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
      if (i >= lines.length) warnings.push('Unclosed code fence');
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

    // Ignore non-rendered notes
    if (isDirective(line, 'note')) {
      // skip until closing :::
      let j = i + 1;
      while (j < lines.length && !isDirectiveClose(lines[j])) j++;
      i = j;
      continue;
    }

    // Layout container
    if (isDirective(line, 'layout')) {
      ensureSection();
      warnIfExtraColons(line, 'layout');
      const attrsStr = line.replace(/^:{3,}layout/, '').trim();
      const attrs = parseDirectiveAttrs(attrsStr);
      const direction = (String(attrs.direction || 'row') === 'column') ? 'column' : 'row';
      const gap = typeof attrs.gap === 'number' ? attrs.gap : undefined;
      let sizes: number[] | undefined;
      if (Array.isArray(attrs.sizes)) {
        sizes = (attrs.sizes as any[]).map((n) => Number(n)).filter((n) => !isNaN(n));
      } else if (typeof attrs.sizes === 'string') {
        sizes = attrs.sizes.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
      } else if (typeof attrs.sizes === 'number') {
        sizes = [Number(attrs.sizes)];
      }

      const panes: LayoutPane[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const ln = lines[j];
        if (isDirective(ln, 'pane')) {
          warnIfExtraColons(ln, 'pane');
          const paneAttrsStr = ln.replace(/^:{3,}pane/, '').trim();
          const paneAttrs = parseDirectiveAttrs(paneAttrsStr);
          const paneTitle = paneAttrs.title as string | undefined;
          const innerBlocks: ParsedBlock[] = [];
          j++;
          while (j < lines.length) {
            const innerLine = lines[j];
            if (isDirectiveClose(innerLine)) { j++; break; }
            if (innerLine.startsWith('```')) {
              const info = innerLine.slice(3).trim();
              const { language, title, flags } = parseInfoString(info);
              const buf: string[] = [];
              j++;
              while (j < lines.length && !lines[j].startsWith('```')) { buf.push(lines[j]); j++; }
              innerBlocks.push({ type: 'code', language, content: buf.join('\n'), title, highlight: typeof flags.highlight === 'boolean' ? flags.highlight : undefined, typeFillin: typeof flags.typeFillin === 'boolean' ? flags.typeFillin : undefined, startFromBlank: typeof flags.startFromBlank === 'boolean' ? flags.startFromBlank : undefined } as any);
            } else if (isDirective(innerLine, 'cutaway')) {
              warnIfExtraColons(innerLine, 'cutaway');
              const attrsStrInner = innerLine.replace(/^:{3,}cutaway/, '').trim();
              const attrsInner = parseDirectiveAttrs(attrsStrInner);
              const typeInner = String(attrsInner.type || 'console');
              const titleInner = attrsInner.title as string | undefined;
              const durationSecondsInner = typeof attrsInner.duration === 'number' ? attrsInner.duration : (attrsInner.durationSeconds as number | undefined);
              if (typeInner === 'image') {
                innerBlocks.push({ type: CutawayType.Image, src: String(attrsInner.src || ''), width: typeof attrsInner.width === 'number' ? attrsInner.width : undefined, height: typeof attrsInner.height === 'number' ? attrsInner.height : undefined, alt: attrsInner.alt as string | undefined, title: titleInner, durationSeconds: durationSecondsInner } as any);
              } else if (typeInner === 'video') {
                innerBlocks.push({ type: CutawayType.Video, src: String(attrsInner.src || ''), start: typeof attrsInner.start === 'number' ? attrsInner.start : undefined, end: typeof attrsInner.end === 'number' ? attrsInner.end : undefined, width: typeof attrsInner.width === 'number' ? attrsInner.width : undefined, height: typeof attrsInner.height === 'number' ? attrsInner.height : undefined, muted: attrsInner.muted === true, playToEnd: attrsInner.playToEnd === true, title: titleInner, durationSeconds: durationSecondsInner, noTransition: attrsInner.noTransition === true ? true : undefined } as any);
              } else if (typeInner === 'gif') {
                innerBlocks.push({ type: CutawayType.Gif, src: String(attrsInner.src || ''), width: typeof attrsInner.width === 'number' ? attrsInner.width : undefined, height: typeof attrsInner.height === 'number' ? attrsInner.height : undefined, alt: attrsInner.alt as string | undefined, title: titleInner, durationSeconds: durationSecondsInner } as any);
              } else {
                const buf: string[] = [];
                j++;
                while (j < lines.length && !isDirectiveClose(lines[j])) { buf.push(lines[j]); j++; }
                innerBlocks.push({ type: CutawayType.Console, content: buf.join('\n'), title: titleInner, durationSeconds: durationSecondsInner, prompt: typeof attrsInner.prompt === 'string' ? attrsInner.prompt : undefined, commandLines: typeof attrsInner.commandLines === 'number' ? attrsInner.commandLines : undefined, commandCps: typeof attrsInner.commandCps === 'number' ? attrsInner.commandCps : undefined, outputCps: typeof attrsInner.outputCps === 'number' ? attrsInner.outputCps : undefined, enterDelay: typeof attrsInner.enterDelay === 'number' ? attrsInner.enterDelay : undefined, showPrompt: attrsInner.showPrompt === false ? false : (attrsInner.showPrompt === true ? true : undefined), maxHeightPx: typeof attrsInner.maxHeightPx === 'number' ? attrsInner.maxHeightPx : undefined, append: attrsInner.append === true ? true : undefined, cwd: typeof attrsInner.cwd === 'string' ? attrsInner.cwd : undefined, prefix: typeof attrsInner.prefix === 'string' ? attrsInner.prefix : undefined, noTransition: attrsInner.noTransition === true ? true : undefined } as any);
              }
            }
            j++;
          }
          panes.push({ title: paneTitle, blocks: innerBlocks });
          continue;
        }
        if (isDirectiveClose(ln)) {
          // Lookahead: if next non-empty is another pane, treat this as pane separator
          let k = j + 1;
          while (k < lines.length && lines[k].trim().length === 0) k++;
          if (k < lines.length && isDirective(lines[k], 'pane')) {
            j = k;
            continue;
          }
          j++;
          break;
        }
        j++;
      }
      currentSection!.blocks.push({
        type: 'layout-split',
        direction,
        gap,
        sizes,
        panes,
      } as any);
      i = j; // skip to closing ::: of layout
      continue;
    }

    // Cutaway directive
    if (isDirective(line, 'cutaway')) {
      ensureSection();
      warnIfExtraColons(line, 'cutaway');
      const attrsStr = line.replace(/^:{3,}cutaway/, '').trim();
      const attrs = parseDirectiveAttrs(attrsStr);
      const type = String(attrs.type || 'console');
      const title = attrs.title as string | undefined;
      const durationSeconds = typeof attrs.duration === 'number' ? attrs.duration : (attrs.durationSeconds as number | undefined);

      if (type === 'image') {
        currentSection!.blocks.push({
          type: CutawayType.Image,
          src: String(attrs.src || ''),
          width: (typeof attrs.width === 'number' || typeof attrs.width === 'string') ? attrs.width : undefined,
          height: (typeof attrs.height === 'number' || typeof attrs.height === 'string') ? attrs.height : undefined,
          alt: attrs.alt as string | undefined,
          title,
          durationSeconds,
        });
        continue;
      }

      if (type === 'gif') {
        currentSection!.blocks.push({
          type: CutawayType.Gif,
          src: String(attrs.src || ''),
          width: (typeof attrs.width === 'number' || typeof attrs.width === 'string') ? attrs.width : undefined,
          height: (typeof attrs.height === 'number' || typeof attrs.height === 'string') ? attrs.height : undefined,
          alt: attrs.alt as string | undefined,
          title,
          durationSeconds,
        } as any);
        continue;
      }

      if (type === 'video') {
        currentSection!.blocks.push({
          type: CutawayType.Video,
          src: String(attrs.src || ''),
          start: typeof attrs.start === 'number' ? attrs.start : undefined,
          end: typeof attrs.end === 'number' ? attrs.end : undefined,
          width: (typeof attrs.width === 'number' || typeof attrs.width === 'string') ? attrs.width : undefined,
          height: (typeof attrs.height === 'number' || typeof attrs.height === 'string') ? attrs.height : undefined,
          muted: attrs.muted === true,
          playToEnd: attrs.playToEnd === true,
          title,
          durationSeconds,
          noTransition: attrs.noTransition === true ? true : undefined,
        });
        continue;
      }

      // console: read content until closing :::
      const buf: string[] = [];
      let j = i + 1;
      while (j < lines.length && !isDirectiveClose(lines[j])) {
        buf.push(lines[j]);
        j++;
      }
      if (j >= lines.length) warnings.push('Unclosed :::cutaway block');
      currentSection!.blocks.push({
        type: CutawayType.Console,
        content: buf.join('\n'),
        title,
        durationSeconds,
        prompt: typeof attrs.prompt === 'string' ? attrs.prompt : undefined,
        commandLines: typeof attrs.commandLines === 'number' ? attrs.commandLines : undefined,
        commandCps: typeof attrs.commandCps === 'number' ? attrs.commandCps : undefined,
        outputCps: typeof attrs.outputCps === 'number' ? attrs.outputCps : undefined,
        enterDelay: typeof attrs.enterDelay === 'number' ? attrs.enterDelay : undefined,
        showPrompt: attrs.showPrompt === false ? false : (attrs.showPrompt === true ? true : undefined),
        maxHeightPx: typeof attrs.maxHeightPx === 'number' ? attrs.maxHeightPx : undefined,
        maxHeight: typeof attrs.maxHeight === 'string' ? attrs.maxHeight : undefined,
        maxWidthPx: typeof attrs.maxWidthPx === 'number' ? attrs.maxWidthPx : undefined,
        maxWidth: typeof attrs.maxWidth === 'string' ? attrs.maxWidth : undefined,
        append: attrs.append === true ? true : undefined,
        cwd: typeof attrs.cwd === 'string' ? attrs.cwd : undefined,
        prefix: typeof attrs.prefix === 'string' ? attrs.prefix : undefined,
        noTransition: attrs.noTransition === true ? true : undefined,
      });
      i = j; // skip to closing ::: line
      continue;
    }
  }

  if (currentSection) sections.push(currentSection);
  if (sections.length === 0) sections.push({ title: 'Intro', blocks: [] });
  return { sections, warnings };
}
