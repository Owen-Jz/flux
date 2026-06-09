/**
 * FluxAd — the full 30s hero ad composition.
 *
 * Scenes are sequenced with a small (~12 frame) overlap so each incoming scene
 * crossfades over the outgoing one. A global vignette + faint grain + the
 * synthesized soundtrack tie everything together. Driven entirely by the frame
 * clock, so it scrubs perfectly in the <Player>.
 */

import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame } from "remotion";
import { COLORS, SCENES } from "./theme";
import { Hook } from "./scenes/Hook";
import { Describe } from "./scenes/Describe";
import { Generate } from "./scenes/Generate";
import { Benefits } from "./scenes/Benefits";
import { Cta } from "./scenes/Cta";

const OVERLAP = 12;

/** Crossfades a scene in over its first `fadeIn` frames. */
const SceneWrap: React.FC<{ fadeIn?: number; children: React.ReactNode }> = ({ fadeIn = OVERLAP, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, fadeIn], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/** Soft vignette to focus the eye and add cinematic depth. */
const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse at center, transparent 55%, ${COLORS.bg}cc 100%)`,
    }}
  />
);

/** Very light animated grain for texture (kept subtle and cheap). */
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = (frame % 4) * 7;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: 0.04,
        mixBlendMode: "overlay",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundPosition: `${shift}px ${shift}px`,
      }}
    />
  );
};

export const FluxAd: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Audio src="/audio/flux-ad-theme.wav" volume={0.82} />

      <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.duration + OVERLAP} name="Hook">
        <SceneWrap fadeIn={8}>
          <Hook />
        </SceneWrap>
      </Sequence>

      <Sequence from={SCENES.describe.from} durationInFrames={SCENES.describe.duration + OVERLAP} name="Describe">
        <SceneWrap>
          <Describe />
        </SceneWrap>
      </Sequence>

      <Sequence from={SCENES.generate.from} durationInFrames={SCENES.generate.duration + OVERLAP} name="Generate">
        <SceneWrap>
          <Generate />
        </SceneWrap>
      </Sequence>

      <Sequence from={SCENES.benefits.from} durationInFrames={SCENES.benefits.duration + OVERLAP} name="Benefits">
        <SceneWrap>
          <Benefits />
        </SceneWrap>
      </Sequence>

      <Sequence from={SCENES.cta.from} durationInFrames={SCENES.cta.duration} name="CTA">
        <SceneWrap>
          <Cta />
        </SceneWrap>
      </Sequence>

      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};
