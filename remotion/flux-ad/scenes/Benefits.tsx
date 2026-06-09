/**
 * SCENE 4 — WHY FLUX (frames 600–780 / 20–26s)
 * The generated board lives on as a tilted backdrop while three value props swap
 * in via kinetic vertical mask-reveals. Ends by imploding into a single point that
 * seeds the logo in scene 5.
 */

import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT_FAMILY } from "../theme";
import { BENEFITS } from "../data";
import { MaskReveal, GlowOrb, EASE_OUT_EXPO, EASE_IN_BACK } from "../primitives";
import { BoardView } from "../board";

const BEAT = 60; // frames per benefit
const EXIT_AT = 158;

const BenefitBeat: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const start = index * BEAT;
  const local = frame - start;
  const active = local >= 0 && local < BEAT;
  if (!active) return null;

  // Exit upward into a blur streak as the next beat takes over.
  const exiting = interpolate(local, [BEAT - 14, BEAT], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT_EXPO });
  const exitY = exiting * -60;
  const exitBlur = exiting * 10;
  const exitOpacity = 1 - exiting;
  const b = BENEFITS[index];

  return (
    <div style={{ position: "absolute", textAlign: "center", transform: `translateY(${exitY}px)`, filter: `blur(${exitBlur}px)`, opacity: exitOpacity }}>
      <div style={{ overflow: "hidden", paddingBottom: 8 }}>
        <MaskReveal direction="up" startAt={start} durationInFrames={18}>
          <span style={{ fontFamily: FONT_FAMILY, fontSize: 92, fontWeight: 900, letterSpacing: "-0.02em", color: COLORS.textPrimary }}>
            {b.headline}
          </span>
        </MaskReveal>
      </div>
      <div style={{ marginTop: 8, opacity: interpolate(local, [6, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <span style={{ fontFamily: FONT_FAMILY, fontSize: 28, fontWeight: 500, color: COLORS.textSecondary }}>{b.sub}</span>
      </div>
    </div>
  );
};

export const Benefits: React.FC = () => {
  const frame = useCurrentFrame();

  // Implode the whole scene into a point at the end.
  const implode = interpolate(frame - EXIT_AT, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_BACK });
  const scale = interpolate(implode, [0, 1], [1, 0.02]);
  const opacity = interpolate(frame - EXIT_AT, [10, 22], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flash = interpolate(frame - (EXIT_AT + 18), [0, 3, 8], [0, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Connective gradient thread that draws across the montage.
  const thread = interpolate(frame, [10, BEAT * 3 - 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <GlowOrb color={COLORS.violet} size={1100} x="50%" y="46%" opacity={0.16} blur={170} />

      <div style={{ transform: `scale(${scale})`, opacity, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Tilted board backdrop (continuity from scene 3) */}
        <div style={{ position: "absolute", perspective: 1600, opacity: 0.5, transform: "translateY(120px)" }}>
          <div style={{ transform: "rotateX(12deg) scale(0.82)", transformOrigin: "center top", filter: "saturate(0.9)" }}>
            <BoardView landBase={-400} recountBase={BEAT + 4} highlightPriorities />
          </div>
        </div>

        {/* Dim veil so the headline pops over the board */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, ${COLORS.bg}cc 30%, ${COLORS.bg}55 70%)` }} />

        {/* connective thread */}
        <svg style={{ position: "absolute", width: 900, height: 300, top: "62%", pointerEvents: "none" }} viewBox="0 0 900 300">
          <path
            d="M120 220 C 320 60, 580 60, 780 200"
            stroke="url(#threadGrad)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={1000}
            strokeDashoffset={1000 * (1 - thread)}
          />
          <defs>
            <linearGradient id="threadGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLORS.violet} />
              <stop offset="100%" stopColor={COLORS.fuchsia} />
            </linearGradient>
          </defs>
        </svg>

        {/* Benefit headlines */}
        <div style={{ position: "relative", height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {BENEFITS.map((_, i) => (
            <BenefitBeat key={i} index={i} />
          ))}
        </div>
      </div>

      {/* white-violet flash masking the cut to the logo */}
      <AbsoluteFill style={{ background: `radial-gradient(circle, ${COLORS.violetSecondary}, ${COLORS.violet})`, opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
