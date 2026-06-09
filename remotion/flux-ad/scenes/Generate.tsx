/**
 * SCENE 3 — THE MAGIC (frames 360–600 / 12–20s). Musical drop at ~local frame 30.
 * Riser energy bursts into particles that resolve into a generated board; a status
 * line decrypts to "Plan ready in ~60s"; the board tilts back into a hero artifact.
 */

import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT_FAMILY } from "../theme";
import { ScrambleText, ParticleBurst, GlowOrb, GradientSweep, EASE_OUT_EXPO } from "../primitives";
import { BoardView } from "../board";

const DROP = 28;
const HEADERS_AT = 18;
const STATUS_RESOLVE = 70;
const SPOTLIGHT_AT = 58;
const EXIT_AT = 198;

const CheckDraw: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame - at, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT_EXPO });
  const len = 26;
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 13l4 4L19 7"
        stroke={COLORS.green}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - draw)}
      />
    </svg>
  );
};

export const Generate: React.FC = () => {
  const frame = useCurrentFrame();

  // Board entrance + exit transform (tilts back into a hero artifact).
  const exit = interpolate(frame - EXIT_AT, [0, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT_EXPO });
  const tilt = exit * 12; // deg
  const boardScale = interpolate(exit, [0, 1], [1, 0.82]);
  const boardY = interpolate(exit, [0, 1], [0, -40]);
  const bgDeepen = interpolate(exit, [0, 1], [1, 0.6]);

  const statusResolved = frame >= STATUS_RESOLVE;
  const spotlightX = interpolate(frame - SPOTLIGHT_AT, [0, 30], [-30, 130], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spotlightOpacity = interpolate(frame - SPOTLIGHT_AT, [0, 6, 30], [0, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <GlowOrb color={COLORS.violet} size={1200} x="50%" y="50%" opacity={0.18 * bgDeepen} blur={170} />
      <GlowOrb color={COLORS.blue} size={700} x="22%" y="70%" opacity={0.1 * bgDeepen} blur={150} />

      {/* Eyebrow + status */}
      <div style={{ position: "absolute", top: 110, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: bgDeepen }}>
        <span style={{ fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: 800, letterSpacing: "0.3em", color: COLORS.violetSecondary }}>
          02 · REVIEW
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, height: 30 }}>
          {statusResolved ? (
            <>
              <CheckDraw at={STATUS_RESOLVE} />
              <span style={{ fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: 700, color: COLORS.green }}>
                <ScrambleText text="Plan ready in ~60s" startAt={STATUS_RESOLVE} durationInFrames={16} fromColor={COLORS.green} toColor={COLORS.green} />
              </span>
            </>
          ) : (
            <span style={{ fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: 600, color: COLORS.textSecondary, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.violet, boxShadow: `0 0 10px ${COLORS.violet}`, opacity: 0.4 + 0.6 * Math.abs(Math.sin(frame / 6)) }} />
              Flux is planning…
            </span>
          )}
        </div>
      </div>

      {/* Particle burst at the drop */}
      <ParticleBurst startAt={DROP - 4} count={54} radius={620} durationInFrames={38} size={9} origin={{ x: 0, y: 20 }} />

      {/* Board */}
      <div
        style={{
          position: "relative",
          perspective: 1600,
          marginTop: 40,
          transform: `translateY(${boardY}px)`,
        }}
      >
        <div style={{ transform: `rotateX(${tilt}deg) scale(${boardScale})`, transformOrigin: "center top" }}>
          <BoardView landBase={DROP} headerRevealAt={HEADERS_AT} />

          {/* fuchsia spotlight sweep confirming the full board */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: spotlightOpacity,
              background: `linear-gradient(105deg, transparent ${spotlightX - 12}%, ${COLORS.fuchsia}55 ${spotlightX}%, transparent ${spotlightX + 12}%)`,
            }}
          />
        </div>
      </div>

      {/* a subtle outer glint as the board becomes a hero artifact on exit */}
      {exit > 0 ? <GradientSweep startAt={EXIT_AT} durationInFrames={42} band={0.5} color={`${COLORS.violet}33`} /> : null}
    </AbsoluteFill>
  );
};
