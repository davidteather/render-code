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
  id: "MyComp", // Output name and folder id for artifacts
  width: 3840, // Canvas width
  height: 2160, // Canvas height
  fps: 60, // Global frame rate; higher = smoother/more frames to render
  backgroundColor: "#282c34", // Page background color (visible outside stage if any padding)
  maxDurationSeconds: 180, // Higher ceiling to prevent early cutoff; content drives actual usage
};

export const COMPOSITION_PREVIEW: Partial<CompositionConfig> & { id: string } = {
  id: "MyCompPreview",
  width: 1920,
  height: 1080,
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
  pageBackground: "#282c34", // Overall page background under the composition
  stageBackground: "#1e1e1e", // Main stage backdrop color behind code blocks
  codeBackground: "#2d2d2d", // Code pane background
  codeBorderRadiusPx: 8, // Rounded corner radius of code container
  codeShadow: "0 8px 30px rgba(0,0,0,0.3)", // Elevation shadow for the code container
  filenameBarBackground: "#252526", // Title bar background (if/when shown)
  filenameBarTextColor: "#888", // Title bar text color
  filenameBarBorderColor: "#404040", // Divider under the title bar
  codeTextColor: "#d4d4d4", // Default code foreground color
  codeFontFamily: '"Fira Code", monospace', // Monospace font used for rendering code
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
  /** Optional maximum width for console cutaway container (px). */
  consoleMaxWidthPx?: number;
};

export const LAYOUT: LayoutConfig = {
  mobileBreakpointPx: 768, // Below this width, mobile font sizes/max-widths apply
  codeFontSizeMobile: "1.6rem", // Code font size for narrow/mobile viewports
  codeFontSizeDesktop: "2rem", // Code font size for desktop FHD/QHD
  codeFontSizeDesktop4k: "2.6rem", // Larger default for 4K so text isn’t too small
  codeMaxWidthDesktop: "80ch", // Limits line length on desktop for readability
  codeMaxWidthDesktop4k: "90ch", // Slightly wider lines on 4K to match larger text
  codeMaxWidthMobile: "90%", // Mobile max width relative to viewport
  codePaddingPx: 20, // Inner padding of the <pre> code container
  staticVerticalPaddingPx: 40, // Extra vertical budget when precomputing block heights
  filenameBarHeightPx: 44, // Reserved height for optional filename bar
  staticLineHeightMultiplier: 1.5, // Line height multiplier; higher = more vertical spacing
  consoleMaxWidthPx: 1200,
};

// Animation pacing and behavior
export type AnimationConfig = {
  /** Global multiplier to speed up/slow down all timings (1 = default). */
  timingMultiplier: number;
  /** Inter-block transition time in seconds */
  transitionSeconds: number;
  /** If true, disable all inter-block transitions/appears globally. */
  disableTransitions?: boolean;
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
  /** Console typing speed in chars/sec for the command. */
  consoleCommandCharsPerSecond: number;
  /** Delay in seconds after the command finishes before output appears (simulated Enter). */
  consoleEnterDelaySeconds: number;
  /** Console output reveal speed in chars/sec (fast). */
  consoleOutputCharsPerSecond: number;
  /** Additional hang after typing when there is no output (seconds). */
  consoleCommandOnlyTailSeconds: number;
  /** Extra tail seconds for any console block after fully filled (global). */
  consoleGlobalTailSeconds: number;
  /** Default seconds for an image cutaway if not specified. */
  imageDefaultSeconds: number;
  /** Default seconds for a video cutaway if not specified and no start/end given. */
  videoDefaultSeconds: number;
  /** Fallback seconds for a last video with playToEnd=true when intrinsic length is unknown. */
  videoPlayToEndFallbackSeconds: number;
};

export const ANIMATION: AnimationConfig = {
  timingMultiplier: 1, // Global pacing knob: <1 = faster overall; >1 = slower overall
  transitionSeconds: 0.67, // Time between blocks; higher adds more pause between steps (~20f@30fps)
  disableTransitions: false,
  instantChanges: false, // If true, typing is instantaneous (debug/demo mode)
  smallCharsFastThreshold: 12, // Typing ≤ this count uses the “small snippet” timing curve (faster)
  minDurationSmallSnippetSeconds: 0.27, // Minimum typing time for short snippets (~8f@30fps)
  smallSnippetSecondsPerChar: 1 / 30, // Typing seconds per char for small snippets (~1f@30fps/char). Higher = slower typing
  largeSnippetSecondsPerChar: 0.3 / 30, // Typing seconds per char for large snippets. Higher = slower typing
  minDurationLargeSnippetSeconds: 0.67, // Minimum typing time for larger snippets (~20f@30fps)
  tailHoldMinSeconds: 0.4, // Minimum time to keep highlight on after typing (~12f@30fps). Lower = snappier
  tailHoldMaxSeconds: 0.93, // Clamp for highlight/tail hold. Higher = can hang longer (~28f@30fps)
  tailHoldScaleBaseSeconds: 8 / 30, // Base for scaling hold vs. added chars (start point). Higher = more baseline hang
  tailHoldScaleSecondsPerChar: 0.5 / 30, // Additional hold per added char. Higher = longer hang for bigger diffs
  lastBlockTailBonusSeconds: 0.5, // Longer hang at the very end
  trimSafetySeconds: 0.2, // Extra seconds added at trimming only to avoid accidental cutoffs
  consoleCommandCharsPerSecond: 14, // Human-ish typing speed for commands
  consoleEnterDelaySeconds: 0.2, // Small delay to simulate pressing Enter
  consoleOutputCharsPerSecond: 240, // Fast output reveal
  consoleCommandOnlyTailSeconds: 1.0, // Shorter hang on command-only cutaways
  consoleGlobalTailSeconds: 2.0, // Extra hang after console completes (requested 2s)
  imageDefaultSeconds: 2.5,
  videoDefaultSeconds: 8,
  videoPlayToEndFallbackSeconds: 30,
};

// Development/render-time flags to temporarily hide heavy cutaways
export const RENDER_FLAGS = {
  showImageCutaways: true,
  showVideoCutaways: false, // Disable by default for faster previews
  showConsoleCutaways: true,
};


