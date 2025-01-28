import "./tailwind.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={1000}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
