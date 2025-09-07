import { CodeBlockMetadata, CutawayBlockMetadata, LayoutSplitMetadata } from '../../calculations/animation_length';
// generatorVersion is injected at build time; avoid importing JSON to keep tsconfig minimal
const generatorVersion = '0.0.0';

export type BuiltMetadata = {
  blocks: Array<CodeBlockMetadata | CutawayBlockMetadata | LayoutSplitMetadata>;
  totalFrames: number;
  maxLineLengthGlobal: number;
  maxLineCountGlobal: number;
  fps: number;
  extraFramesPerBlock: number;
  trimSafetyFrames: number;
  perBlockHighlightHoldFrames: number[];
  perBlockTailFrames: number[];
  cutPoints?: number[];
  cutDetails?: Array<{ start: number; endOfHighlight?: number; endOfBlock: number; sequenceDuration: number; isCode: boolean }>; 
  specVersion: string;
  generatorVersion: string;
};

export function buildMetadata(input: {
  blocks: Array<CodeBlockMetadata | CutawayBlockMetadata | LayoutSplitMetadata>;
  totalFrames: number;
  maxLineLengthGlobal: number;
  maxLineCountGlobal: number;
  fps: number;
  extraFramesPerBlock: number;
  trimSafetyFrames: number;
  perBlockHighlightHoldFrames: number[];
  perBlockTailFrames: number[];
  cutPoints?: number[];
  cutDetails?: Array<{ start: number; endOfHighlight?: number; endOfBlock: number; sequenceDuration: number; isCode: boolean }>; 
}): BuiltMetadata {
  return {
    blocks: input.blocks,
    totalFrames: input.totalFrames,
    maxLineLengthGlobal: input.maxLineLengthGlobal,
    maxLineCountGlobal: input.maxLineCountGlobal,
    fps: input.fps,
    extraFramesPerBlock: input.extraFramesPerBlock,
    trimSafetyFrames: input.trimSafetyFrames,
    perBlockHighlightHoldFrames: input.perBlockHighlightHoldFrames,
    perBlockTailFrames: input.perBlockTailFrames,
    cutPoints: input.cutPoints,
    cutDetails: input.cutDetails,
    specVersion: 'v0',
    generatorVersion,
  };
}


