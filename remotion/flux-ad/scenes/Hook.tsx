/**
 * SCENE 1 — HOOK (frames 0–135 / 0–4.5s)
 * Three "old way" words get struck through, then the headline decrypts in.
 */

import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT_FAMILY } from "../theme";
import { ScrambleText, GlowOrb, EASE_OUT_EXPO } from "../primitives";

const OLD_WAYS = [
  { word: "Spreadsheets.", at: 6 },
  { word: "Sticky notes.", at: 24 },
  { word: "Tabs you forgot.", at: 42 },
];

const StruckWord: React.FC<{ word: string; at: number; exitAt: number }> = ({ word, at, exitAt }) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame - at, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT_EXPO });
  const strike = interpolate(frame - at, [4, 13], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT_EXPO });
  const desaturate = interpolate(frame - at, [8, 16], [1, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // All three fall away together to clear the stage for the headline.
  const fall = interpolate(frame - exitAt, [0, 16], [0, 90], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT_EXPO });
  const fallOpacity = interpolate(frame - exitAt, [0, 16], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        fontFamily: FONT_FAMILY,
        fontSize: 52,
        fontWeight: 700,
        color: COLORS.textSecondary,
        opacity: appear * fallOpacity,
        filter: `grayscale(${1 - desaturate})`,
        transform: `translateY(${(1 - appear) * 14 + fall}px)`,
      }}
    >
      {word}
      <div
        style={{
          position: "absolute",
          top: "52%",
          left: 0,
          height: 4,
          width: `${strike * 100}%`,
          background: COLORS.red,
          borderRadius: 4,
          boxShadow: `0 0 12px ${COLORS.red}aa`,
        }}
      />
    </div>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const headlineStart = 64;
  const glow = interpolate(frame - (headlineStart + 18), [0, 10, 24], [1, 1.04, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitAt = 88;
  const headlineY = interpolate(frame - exitAt, [0, 20], [0, -70], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT_EXPO });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, alignItems: "center", justifyContent: "center" }}>
      <GlowOrb color={COLORS.violet} size={900} x="50%" y="46%" opacity={interpolate(frame, [headlineStart, headlineStart + 24], [0, 0.22], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * glow} blur={140} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, transform: `translateY(${headlineY}px)` }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, height: 200, justifyContent: "center" }}>
          {OLD_WAYS.map((w) => (
            <StruckWord key={w.word} word={w.word} at={w.at} exitAt={exitAt} />
          ))}
        </div>

        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 88,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            textAlign: "center",
            transform: `scale(${glow})`,
          }}
        >
          <ScrambleText text="There's a faster way to plan." startAt={headlineStart} durationInFrames={26} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
