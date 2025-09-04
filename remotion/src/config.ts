/**
 * Central configuration for Remotion rendering, theme, and animations.
 * All constants are documented with intended purpose and sensible defaults.
 */

// Composition/video defaults
export type CompositionConfig = {
  /** Unique ID for the Remotion composition (used as output folder name). */
  id: string;
  /** Output width in pixels; default to 4K width. */
  width: number;
  /** Output height in pixels; default to 4K height. */
  height: number;
  /** Frames per second of the render; default to 60fps. */
  fps: number;
  /** Background color for the overall page. */
  backgroundColor: string;
  /**
   * Optional maximum duration ceiling, in seconds. Only used as a fallback placeholder
   * in the Composition tag; when calculateMetadata is enabled, the real duration overrides it.
   */
  maxDurationSeconds: number;
};

export const COMPOSITION: CompositionConfig = {
  id: "MyComp",
  width: 3840,
  height: 2160,
  fps: 60,
  backgroundColor: "#282c34",
  maxDurationSeconds: 30,
};

// Environment and input
export type EnvConfig = {
  /** Environment variable name that points to the markdown file within public/. */
  markdownEnvVar: string;
  /** Default markdown file used when an explicit value is provided; kept for reference. */
  defaultMarkdownFile: string;
  /** If true, throw when markdownEnvVar is not set. */
  requireMarkdownEnv: boolean;
};

export const ENV: EnvConfig = {
  markdownEnvVar: "MARKDOWN_FILE",
  defaultMarkdownFile: "input.md",
  requireMarkdownEnv: true,
};

// Theme and layout
export type ThemeConfig = {
  /** Background behind the composition content. */
  pageBackground: string;
  /** Stage/background for the animation area. */
  stageBackground: string;
  /** Code block container background. */
  codeBackground: string;
  /** Rounded corner radius for code containers (in px). */
  codeBorderRadiusPx: number;
  /** CSS box shadow for code containers. */
  codeShadow: string;
  /** Filename bar background color. */
  filenameBarBackground: string;
  /** Filename bar text color. */
  filenameBarTextColor: string;
  /** Filename bar bottom border color. */
  filenameBarBorderColor: string;
  /** Code text color. */
  codeTextColor: string;
  /** Monospace font family used for code. */
  codeFontFamily: string;
};

export const THEME: ThemeConfig = {
  pageBackground: "#282c34",
  stageBackground: "#1e1e1e",
  codeBackground: "#2d2d2d",
  codeBorderRadiusPx: 8,
  codeShadow: "0 8px 30px rgba(0,0,0,0.3)",
  filenameBarBackground: "#252526",
  filenameBarTextColor: "#888",
  filenameBarBorderColor: "#404040",
  codeTextColor: "#d4d4d4",
  codeFontFamily: '"Fira Code", monospace',
};

export type LayoutConfig = {
  /** Viewport width below which layout is considered mobile. */
  mobileBreakpointPx: number;
  /** Code font size (mobile). */
  codeFontSizeMobile: string;
  /** Code font size (desktop). */
  codeFontSizeDesktop: string;
  /** Code font size (desktop, 4K). */
  codeFontSizeDesktop4k: string;
  /** Max code width (desktop). */
  codeMaxWidthDesktop: string;
  /** Max code width (desktop, 4K). */
  codeMaxWidthDesktop4k: string;
  /** Max code width (mobile). */
  codeMaxWidthMobile: string;
  /** Padding inside code block <pre> in px. */
  codePaddingPx: number;
  /** Extra vertical padding budget for static sizing (px). */
  staticVerticalPaddingPx: number;
  /** Filename bar height in px when visible. */
  filenameBarHeightPx: number;
  /** Multiplier for line-height in static sizing calculations. */
  staticLineHeightMultiplier: number;
};

export const LAYOUT: LayoutConfig = {
  mobileBreakpointPx: 768,
  codeFontSizeMobile: "1.6rem",
  codeFontSizeDesktop: "2rem",
  codeFontSizeDesktop4k: "2.6rem",
  codeMaxWidthDesktop: "80ch",
  codeMaxWidthDesktop4k: "90ch",
  codeMaxWidthMobile: "90%",
  codePaddingPx: 20,
  staticVerticalPaddingPx: 40,
  filenameBarHeightPx: 44,
  staticLineHeightMultiplier: 1.5,
};

// Animation pacing and behavior
export type AnimationConfig = {
  /** Global multiplier to speed up/slow down all timings (1 = default). */
  timingMultiplier: number;
  /** Inter-block transition time in seconds */
  transitionSeconds: number;
  /** If true, typing is instant. */
  instantChanges: boolean;
  /** Characters threshold below which typing is accelerated. */
  smallCharsFastThreshold: number;
  /** Minimum typing duration (seconds) for short snippets. */
  minDurationSmallSnippetSeconds: number;
  /** Seconds per char for small snippets (~0.033 -> 1 char per 2 frames at 60fps). */
  smallSnippetSecondsPerChar: number;
  /** Seconds per char factor for larger snippets. */
  largeSnippetSecondsPerChar: number;
  /** Minimum typing duration (seconds) for larger snippets. */
  minDurationLargeSnippetSeconds: number;
  /** Tail hold lower clamp (seconds). */
  tailHoldMinSeconds: number;
  /** Tail hold upper clamp (seconds). */
  tailHoldMaxSeconds: number;
  /** Base hold used in scaling (seconds). */
  tailHoldScaleBaseSeconds: number;
  /** Slope used to scale tail hold by added characters (seconds per char). */
  tailHoldScaleSecondsPerChar: number;
  /** Extra seconds appended on the very last block's tail. */
  lastBlockTailBonusSeconds: number;
  /** Extra seconds added at trim time to avoid accidental cutoff. */
  trimSafetySeconds: number;
};

export const ANIMATION: AnimationConfig = {
  timingMultiplier: 0.3,
  transitionSeconds: 0.67, // ~20 frames at 30fps
  instantChanges: false,
  smallCharsFastThreshold: 12,
  minDurationSmallSnippetSeconds: 0.27, // ~8 frames at 30fps
  smallSnippetSecondsPerChar: 1 / 30, // ~1 frame at 30fps per char
  largeSnippetSecondsPerChar: 0.3 / 30, // ~0.3 frames at 30fps per char
  minDurationLargeSnippetSeconds: 0.67, // ~20 frames at 30fps
  tailHoldMinSeconds: 0.4, // ~12 frames at 30fps
  tailHoldMaxSeconds: 0.93, // ~28 frames at 30fps
  tailHoldScaleBaseSeconds: 8 / 30, // base 8 frames at 30fps
  tailHoldScaleSecondsPerChar: 0.5 / 30, // 0.5 frames per char at 30fps
  lastBlockTailBonusSeconds: 0.1, // ~3 frames at 30fps
  trimSafetySeconds: 0.2,
};


