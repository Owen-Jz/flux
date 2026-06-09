/**
 * SCENE 2 — DESCRIBE (frames 135–360 / 4.5–12s)
 * User types a plain-English prompt; the "Plan it" button charges and is pressed,
 * firing a riser of light upward to seed the board generation.
 */

import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_FAMILY } from "../theme";
import { DEMO_PROMPT } from "../data";
import { Typewriter, MaskReveal, GradientSweep, GlowOrb, EASE_OUT_EXPO } from "../primitives";

// Local timing (scene-relative frames).
const TYPE_START = 26;
const TYPE_DURATION = 120; // ~prompt length / cps
const PRESS_AT = 178; // ~11.3s
const CARD_DOCK_AT = 196;

export const Describe: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardEnter = spring({ frame, fps, config: { damping: 200, stiffness: 110, mass: 0.9 } });
  const cardOpacity = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Press mechanics.
  const press = interpolate(frame - PRESS_AT, [0, 4, 10], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const buttonInvite = interpolate(frame - (TYPE_START + TYPE_DURATION), [0, 20], [1, 1.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringScale = interpolate(frame - PRESS_AT, [0, 24], [0.4, 2.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT_EXPO });
  const ringOpacity = interpolate(frame - PRESS_AT, [0, 24], [0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Riser line shooting upward after press.
  const riserH = interpolate(frame - (PRESS_AT + 2), [0, 18], [0, 520], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT_EXPO });
  const riserOpacity = interpolate(frame - (PRESS_AT + 2), [0, 6, 24], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Whole card docks to top-left as a compact chip on exit.
  const dock = interpolate(frame - CARD_DOCK_AT, [0, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT_EXPO });
  const dockScale = interpolate(dock, [0, 1], [1, 0.34]);
  const dockX = interpolate(dock, [0, 1], [0, -620]);
  const dockY = interpolate(dock, [0, 1], [0, -300]);
  const dockOpacity = interpolate(frame - CARD_DOCK_AT, [10, 24], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const typingDone = frame - TYPE_START > TYPE_DURATION;

  return (
    <AbsoluteFill style={{ background: COLORS.bg, alignItems: "center", justifyContent: "center" }}>
      <GlowOrb color={COLORS.violet} size={1000} x="50%" y="55%" opacity={0.16} blur={150} />

      {/* Eyebrow */}
      <div style={{ position: "absolute", top: 150, opacity: cardOpacity }}>
        <span style={{ fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: 800, letterSpacing: "0.3em", color: COLORS.violet }}>
          01 · DESCRIBE
        </span>
      </div>

      <div
        style={{
          transform: `translate(${dockX}px, ${dockY}px) scale(${dockScale * interpolate(cardEnter, [0, 1], [0.96, 1])})`,
          opacity: cardOpacity * dockOpacity,
        }}
      >
        {/* Prompt card */}
        <div
          style={{
            position: "relative",
            width: 880,
            background: COLORS.surface,
            border: `1px solid ${COLORS.borderStrong}`,
            borderRadius: 24,
            padding: 36,
            boxShadow: `0 0 0 1px ${COLORS.violet}22, 0 40px 90px -40px ${COLORS.violet}55, 0 30px 60px -30px rgba(0,0,0,0.8)`,
            fontFamily: FONT_FAMILY,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", color: COLORS.textTertiary, marginBottom: 16, textTransform: "uppercase" }}>
            New project
          </div>

          {/* Input field */}
          <div
            style={{
              minHeight: 96,
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 16,
              padding: "20px 22px",
              fontSize: 30,
              fontWeight: 500,
              color: COLORS.textPrimary,
              lineHeight: 1.4,
            }}
          >
            {frame < TYPE_START ? (
              <span style={{ color: COLORS.textTertiary }}>What are you building?</span>
            ) : (
              <Typewriter text={DEMO_PROMPT} startAt={TYPE_START} cps={26} style={{ fontSize: 30 }} />
            )}
          </div>

          {/* Button row */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 24 }}>
            <div
              style={{
                position: "relative",
                padding: "16px 34px",
                background: COLORS.violet,
                color: COLORS.bg,
                fontSize: 20,
                fontWeight: 800,
                borderRadius: 14,
                overflow: "hidden",
                transform: `scale(${buttonInvite}) translateY(${press * 2}px)`,
                boxShadow: press > 0 ? `inset 0 4px 12px rgba(0,0,0,0.35)` : `0 12px 30px -10px ${COLORS.violet}aa`,
              }}
            >
              Plan it
              {typingDone ? <GradientSweep loop band={0.45} durationInFrames={30} color={`${COLORS.fuchsia}cc`} borderRadius={14} /> : null}
              {/* press ripple */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 80,
                  height: 80,
                  marginLeft: -40,
                  marginTop: -40,
                  borderRadius: "50%",
                  border: `2px solid ${COLORS.fuchsia}`,
                  transform: `scale(${ringScale})`,
                  opacity: ringOpacity,
                }}
              />
            </div>

            {/* reassurance line — mask reveal */}
            <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.textSecondary }}>
              <MaskReveal startAt={TYPE_START + TYPE_DURATION - 10} durationInFrames={16}>
                Free forever · No credit card
              </MaskReveal>
            </div>
          </div>

          {/* Riser line of light from button toward the board */}
          <div
            style={{
              position: "absolute",
              left: 90,
              bottom: 56,
              width: 4,
              height: riserH,
              transform: "translateY(0)",
              background: `linear-gradient(to top, ${COLORS.fuchsia}, ${COLORS.violet}, transparent)`,
              opacity: riserOpacity,
              borderRadius: 4,
              boxShadow: `0 0 18px ${COLORS.violet}`,
              filter: "blur(0.4px)",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
