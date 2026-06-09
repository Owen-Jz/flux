/**
 * Remotion CLI entry point (optional). Run `npx remotion studio remotion/index.ts`
 * to preview, or `npx remotion render remotion/index.ts FluxAd out/flux-ad.mp4`
 * to export an MP4 (requires @remotion/cli + @remotion/renderer).
 */

import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
