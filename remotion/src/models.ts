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
  /** Display title/filename; may be parsed from {title="..."} or lang:path */
  title?: string;
  /** Show highlight overlay for this block (default: true) */
  highlight?: boolean;
  /** Animate typing in from previous content (default: true) */
  typeFillin?: boolean;
  /** Start diffing from blank instead of previous code (default: false). Also auto-applied when title changes. */
  startFromBlank?: boolean;
}

export interface CutawayBase extends BaseBlock {
  /** Optional human label for the cutaway */
  title?: string;
  /** Optional explicit duration in seconds (overrides defaults) */
  durationSeconds?: number;
}

export interface CutawayImageBlock extends CutawayBase {
  type: 'cutaway-image';
  src: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface CutawayVideoBlock extends CutawayBase {
  type: 'cutaway-video';
  src: string;
  /** Optional in/out (seconds) */
  start?: number;
  end?: number;
  width?: number;
  height?: number;
  muted?: boolean;
}

export interface CutawayConsoleBlock extends CutawayBase {
  type: 'cutaway-console';
  /** Raw console text (could be structured later) */
  content: string;
  /** Optional shell prompt prefix (e.g., "$" or "(venv) ➜ proj %"). */
  prompt?: string;
  /** Number of initial lines considered command input (typed at command speed). */
  commandLines?: number;
  /** Override command typing speed (chars/sec). */
  commandCps?: number;
  /** Override output reveal speed (chars/sec). */
  outputCps?: number;
  /** Override enter delay (seconds) between command and output. */
  enterDelay?: number;
  /** Show the prompt prefix before command lines (default true). */
  showPrompt?: boolean;
}

export type ParsedBlock =
  | TypedCodeBlock
  | CutawayImageBlock
  | CutawayVideoBlock
  | CutawayConsoleBlock;

export interface ParsedMarkdown {
  frontmatter: MarkdownFrontmatter;
  sections: {
    title: string;
    blocks: ParsedBlock[];
  }[];
}
