import { LayoutSplitMetadata } from '../calculations/animation_length';

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

export type CutawayImageProps = { type: 'cutaway-image'; src: string; title?: string; width?: number; height?: number };
export type CutawayGifProps = { type: 'cutaway-gif'; src: string; title?: string; width?: number; height?: number };
export type CutawayVideoProps = { type: 'cutaway-video'; src: string; title?: string; startSec?: number; endSec?: number; width?: number; height?: number; muted?: boolean };
export type CutawayConsoleProps = { type: 'cutaway-console'; content: string; title?: string; durationFrames?: number; prompt?: string; commandLines?: number; commandCps?: number; outputCps?: number; enterDelay?: number; showPrompt?: boolean; cwd?: string; prefix?: string; frameOverride?: number; maxHeightPx?: number; maxWidthPx?: number; historyContent?: string; segments?: Array<{ command: string; output?: string; enterDelay?: number; cwd?: string; prefix?: string; prompt?: string }>; };

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
  blocks: any[];
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


