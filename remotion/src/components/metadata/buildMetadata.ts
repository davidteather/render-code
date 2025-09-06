import { CodeBlockMetadata, CutawayBlockMetadata, LayoutSplitMetadata } from '../../calculations/animation_length';
import pkg from '../../../package.json';

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
    specVersion: 'v0',
    generatorVersion: (pkg as any).version || '0.0.0',
  };
}


