import { LayoutSplitMetadata, CodeBlockMetadata } from '../calculations/animation_length';
import { CutawayType } from '../models';

export type CodeBlockRendererProps = {
  oldCode: string;
  newCode: string;
  language?: string;
  progress: number;
  isActive: boolean;
  fileName?: string;
  maxLineLength: number;
  maxLineCount: number;
};

export type CutawayImageProps = { type: typeof CutawayType.Image; src: string; title?: string; width?: number | string; height?: number | string };
export type CutawayGifProps = { type: typeof CutawayType.Gif; src: string; title?: string; width?: number | string; height?: number | string };
export type CutawayVideoProps = { type: typeof CutawayType.Video; src: string; title?: string; startSec?: number; endSec?: number; width?: number | string; height?: number | string; muted?: boolean };
export type CutawayConsoleProps = { type: typeof CutawayType.Console; content: string; title?: string; durationFrames?: number; prompt?: string; commandLines?: number; commandCps?: number; outputCps?: number; enterDelay?: number; showPrompt?: boolean; cwd?: string; prefix?: string; frameOverride?: number; maxHeightPx?: number; maxWidthPx?: number; maxHeight?: string; maxWidth?: string; historyContent?: string; segments?: Array<{ command: string; output?: string; enterDelay?: number; cwd?: string; prefix?: string; prompt?: string }>; };

export type CutawayRendererProps = (CutawayImageProps | CutawayGifProps | CutawayVideoProps | CutawayConsoleProps) & { isActive?: boolean };

export type LayoutSplitProps = {
  block: LayoutSplitMetadata;
  sequenceDuration: number;
  localFrame: number;
  fps: number;
  maxLineLengthGlobal: number;
  maxLineCountGlobal: number;
};

export type MetadataPayload = {
  blocks: Array<CodeBlockMetadata | LayoutSplitMetadata | (
    { type: typeof CutawayType.Image | typeof CutawayType.Gif | typeof CutawayType.Video | typeof CutawayType.Console; start: number; duration: number; addedChars: 0 }
  )>;
  totalFrames: number;
  maxLineLengthGlobal: number;
  maxLineCountGlobal: number;
  fps: number;
  extraFramesPerBlock: number;
  trimSafetyFrames: number;
  perBlockHighlightHoldFrames: number[];
  perBlockTailFrames: number[];
  specVersion: string;
  generatorVersion: string;
};


