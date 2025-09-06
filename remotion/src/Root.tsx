import React from "react";
import "./tailwind.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { COMPOSITION, COMPOSITION_PREVIEW } from "./config";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMPOSITION.id}
        component={MyComposition}
        durationInFrames={Math.round(COMPOSITION.maxDurationSeconds * COMPOSITION.fps)}
        fps={COMPOSITION.fps}
        width={COMPOSITION.width}
        height={COMPOSITION.height}
        defaultProps={{ markdownFile: 'input.md', userSettings: undefined }}
      />
      <Composition
        id={COMPOSITION_PREVIEW.id}
        component={MyComposition}
        durationInFrames={Math.round(COMPOSITION.maxDurationSeconds * COMPOSITION.fps)}
        fps={COMPOSITION.fps}
        width={COMPOSITION_PREVIEW.width as number}
        height={COMPOSITION_PREVIEW.height as number}
        defaultProps={{ markdownFile: 'input.md', userSettings: undefined }}
      />
    </>
  );
};
