import "./tailwind.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { COMPOSITION } from "./config";

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
      />
    </>
  );
};
