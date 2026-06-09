/**
 * SCENE 5 — CTA / LOGO CLOSE (frames 780–900 / 26–30s)
 * Particles re-assemble into the Flux wordmark (bookending scene 3), a specular
 * glint sweeps the logo, and the end-card settles into a clean, clickable CTA.
 */

import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_FAMILY } from "../theme";
import { TRUST_SIGNALS } from "../data";
import { MaskReveal, GradientSweep, GlowOrb, EASE_OUT_EXPO } from "../primitives";

const LOGO_AT = 14;
const GLINT_AT = 90; // ~870 global — lands on the final downbeat
const TAGLINE_AT = 30;
const BUTTON_AT = 44;
const TRUST_AT = 64;

/** Particles converging inward to form the logo. */
const ParticleConverge: React.FC<{ at: number; count?: number }> = ({ at, count = 50 }) => {
  const frame = useCurrentFrame();
  const local = frame - at;
  if (local < -10 || local > 30) return null;
  const colors = [COLORS.violet, COLORS.fuchsia, COLORS.violetSecondary];
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%" }}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = random(`ca-${i}`) * Math.PI * 2;
        const dist = (0.5 + random(`cd-${i}`) * 0.5) * 560;
        const p = interpolate(local, [0, 20], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT_EXPO });
        const x = Math.cos(angle) * dist * p;
        const y = Math.sin(angle) * dist * p;
        const opacity = interpolate(local, [0, 4, 18, 24], [0, 1, 1, 0]);
        const s = 6 * (0.5 + random(`cs-${i}`));
        const color = colors[i % colors.length];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: s,
              height: s,
              borderRadius: "50%",
              background: color,
              transform: `translate(${x}px, ${y}px)`,
              opacity,
              boxShadow: `0 0 ${s * 2}px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
};

const FluxMark: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - LOGO_AT, fps, config: { damping: 16, stiffness: 140, mass: 0.8 } });
  const scale = interpolate(enter, [0, 1], [0.6, 1]);
  const opacity = interpolate(frame - LOGO_AT, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 22, transform: `scale(${scale})`, opacity }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.fuchsia})`,
          boxShadow: `0 0 40px ${COLORS.violet}88`,
        }}
      />
      <div style={{ position: "relative" }}>
        <span style={{ fontFamily: FONT_FAMILY, fontSize: 108, fontWeight: 900, letterSpacing: "-0.03em", color: COLORS.textPrimary }}>
          Flux
        </span>
        {/* specular glint */}
        <GradientSweep startAt={GLINT_AT} durationInFrames={20} band={0.35} color="rgba(255,255,255,0.7)" />
      </div>
    </div>
  );
};

export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Button breathing + glow.
  const breathe = 1 + 0.03 * Math.sin(Math.max(0, frame - BUTTON_AT) / 8);
  const buttonEnter = spring({ frame: frame - BUTTON_AT, fps, config: { damping: 18, stiffness: 160, mass: 0.7 } });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <GlowOrb color={COLORS.violet} size={1100} x="50%" y="42%" opacity={0.2} blur={170} />
      <GlowOrb color={COLORS.fuchsia} size={600} x="62%" y="64%" opacity={0.1} blur={150} />

      <ParticleConverge at={2} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <FluxMark />

        <div style={{ height: 40 }}>
          <MaskReveal startAt={TAGLINE_AT} durationInFrames={20}>
            <span style={{ fontFamily: FONT_FAMILY, fontSize: 32, fontWeight: 500, color: COLORS.textSecondary }}>
              Describe your project. Flux plans it.
            </span>
          </MaskReveal>
        </div>

        {/* CTA button */}
        <div
          style={{
            position: "relative",
            marginTop: 8,
            padding: "20px 48px",
            background: COLORS.violet,
            color: COLORS.bg,
            fontSize: 24,
            fontWeight: 900,
            borderRadius: 16,
            transform: `scale(${interpolate(buttonEnter, [0, 1], [0.8, breathe])})`,
            opacity: interpolate(frame - BUTTON_AT, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            boxShadow: `0 0 50px ${COLORS.violet}aa, 0 20px 40px -16px ${COLORS.violet}`,
          }}
        >
          Start free
        </div>

        {/* Trust line — letters stagger in */}
        <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
          {TRUST_SIGNALS.map((sig, i) => {
            const at = TRUST_AT + i * 5;
            const o = interpolate(frame - at, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const y = interpolate(frame - at, [0, 8], [8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <span key={sig} style={{ display: "inline-flex", alignItems: "center", gap: 14, opacity: o, transform: `translateY(${y}px)` }}>
                {i > 0 ? <span style={{ color: COLORS.textTertiary }}>·</span> : null}
                <span style={{ fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: 600, color: COLORS.textSecondary }}>{sig}</span>
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
