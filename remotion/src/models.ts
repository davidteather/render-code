export interface MarkdownFrontmatter {
  theme: string;
}

export interface CodeBlock {
  language: string;
  content: string;
}

export type BlockType = 'code' | 'cutaway-image' | 'cutaway-video' | 'cutaway-console' | 'cutaway-gif' | 'layout-split';

export const CutawayType = {
  Image: 'cutaway-image',
  Gif: 'cutaway-gif',
  Video: 'cutaway-video',
  Console: 'cutaway-console',
} as const;
export type CutawayTypeValue = typeof CutawayType[keyof typeof CutawayType];

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
  /** If true, skip appear/transition for this block. */
  noTransition?: boolean;
}

export interface CutawayBase extends BaseBlock {
  /** Optional human label for the cutaway */
  title?: string;
  /** Optional explicit duration in seconds (overrides defaults) */
  durationSeconds?: number;
}

export interface CutawayImageBlock extends CutawayBase {
  type: typeof CutawayType.Image;
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  noTransition?: boolean;
}

export interface CutawayGifBlock extends CutawayBase {
  type: typeof CutawayType.Gif;
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  noTransition?: boolean;
}

export interface CutawayVideoBlock extends CutawayBase {
  type: typeof CutawayType.Video;
  src: string;
  /** Optional in/out (seconds) */
  start?: number;
  end?: number;
  width?: number;
  height?: number;
  muted?: boolean;
  /** If true, play to the end of the source clip (duration inferred elsewhere). */
  playToEnd?: boolean;
  noTransition?: boolean;
}

export interface CutawayConsoleBlock extends CutawayBase {
  type: typeof CutawayType.Console;
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
  /** Optional maximum height to allow scroll for long outputs. */
  maxHeightPx?: number;
  /** If true, include previous console history (by matching title) above this content. */
  append?: boolean;
  /** Optional working directory label to show in the prompt, e.g. 'portfolio'. */
  cwd?: string;
  /** Optional explicit prefix to render before command, overrides prompt/cwd combo. */
  prefix?: string;
  /** Play multiple commands+outputs sequentially inside one block if provided. */
  segments?: Array<{ command: string; output?: string; enterDelay?: number }>;
  /** Skip appear/transition for this block. */
  noTransition?: boolean;
}

export type LayoutDirection = 'row' | 'column';

export interface LayoutPane {
  /** Optional pane title (not currently rendered by default). */
  title?: string;
  /** Blocks rendered within this pane, sequentially over time. */
  blocks: ParsedBlock[];
}

export interface LayoutSplitBlock extends BaseBlock {
  type: 'layout-split';
  /** Flex direction for the layout container. */
  direction: LayoutDirection;
  /** Gap in pixels between panes. */
  gap?: number;
  /** Optional sizes (as percentages) for panes, e.g., [60, 40]. Length should match panes length. */
  sizes?: number[];
  /** Child panes to render side-by-side or stacked. */
  panes: LayoutPane[];
}

export type ParsedBlock =
  | TypedCodeBlock
  | CutawayImageBlock
  | CutawayGifBlock
  | CutawayVideoBlock
  | CutawayConsoleBlock
  | LayoutSplitBlock;

export interface ParsedMarkdown {
  frontmatter: MarkdownFrontmatter;
  sections: {
    title: string;
    blocks: ParsedBlock[];
  }[];
}
