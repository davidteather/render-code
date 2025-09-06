import React from 'react';
import { ImageCutaway, GifCutaway } from '../cutaways/ImageCutaway';
import { VideoCutaway } from '../cutaways/VideoCutaway';
import { VideoPlaceholder } from '../cutaways/VideoPlaceholder';
import { ConsoleCutaway } from '../cutaways/ConsoleCutaway';
import { RENDER_FLAGS } from '../../config';
import { CutawayRendererProps } from '../../types/components';
import { CutawayType } from '../../models';

export const CutawayRenderer: React.FC<CutawayRendererProps> = (props) => {
  if (props.type === CutawayType.Image) {
    return RENDER_FLAGS.showImageCutaways ? (
      <ImageCutaway src={props.src} title={props.title} width={props.width} height={props.height} isActive={props.isActive ?? true} />
    ) : null;
  }
  if (props.type === CutawayType.Gif) {
    return (
      <GifCutaway src={props.src} title={props.title} width={props.width} height={props.height} isActive={props.isActive ?? true} />
    );
  }
  if (props.type === CutawayType.Video) {
    return RENDER_FLAGS.showVideoCutaways ? (
      <VideoCutaway src={props.src} title={props.title} start={props.startSec} end={props.endSec} width={props.width} height={props.height} muted={props.muted} />
    ) : (
      <VideoPlaceholder src={props.src} title={props.title} />
    );
  }
  if (props.type === CutawayType.Console) {
    return (
      <ConsoleCutaway
        content={props.content}
        title={props.title}
        durationFrames={props.durationFrames}
        prompt={props.prompt}
        commandLines={props.commandLines}
        commandCps={props.commandCps}
        outputCps={props.outputCps}
        enterDelay={props.enterDelay}
        showPrompt={props.showPrompt}
        cwd={props.cwd}
        prefix={props.prefix}
        frameOverride={props.frameOverride}
        maxHeightPx={props.maxHeightPx}
        maxWidthPx={props.maxWidthPx}
        segments={props.segments}
      />
    );
  }
  return null;
};

export default CutawayRenderer;


