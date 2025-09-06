import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
import { Buffer } from 'buffer';

// Provide Buffer in the browser environment without using any
const g = globalThis as unknown as { Buffer?: typeof Buffer };
if (!g.Buffer) {
  g.Buffer = Buffer;
}

registerRoot(RemotionRoot);
