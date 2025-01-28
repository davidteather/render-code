import { registerRoot, staticFile } from "remotion";
import { RemotionRoot } from "./Root";
import { Buffer } from 'buffer';

(globalThis as any).Buffer = Buffer;

registerRoot(RemotionRoot);
