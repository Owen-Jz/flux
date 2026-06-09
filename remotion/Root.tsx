/**
 * Remotion root registration. Only used if you open Remotion Studio or render the
 * ad to a file via the Remotion CLI (`npx remotion studio remotion/index.ts`).
 * The landing page itself does NOT need this — it embeds <FluxAd> live via
 * @remotion/player. Kept so the composition can also be exported to MP4 later.
 */

import React from "react";
import { Composition } from "remotion";
import { FluxAd } from "./flux-ad/FluxAd";
import { VIDEO } from "./flux-ad/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="FluxAd"
      component={FluxAd}
      durationInFrames={VIDEO.durationInFrames}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
    />
  );
};
