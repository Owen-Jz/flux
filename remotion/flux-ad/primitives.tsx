/**
 * Reusable motion primitives for the Flux ad. Every component is driven purely by
 * `useCurrentFrame()` (relative to the nearest <Sequence>), so they are fully
 * deterministic and scrub correctly in the Player.
 */

import React from "react";
import {
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { COLORS, FONT_FAMILY } from "./theme";

/* ------------------------------------------------------------------ */
/* Easing helpers                                                       */
/* ------------------------------------------------------------------ */

/** A crisp, slightly-overshooting ease used across reveals. */
export const EASE_OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN_BACK = Easing.bezier(0.36, 0, 0.66, -0.56);

/* ------------------------------------------------------------------ */
/* ScrambleText — glyphs decrypt from noise, locking left-to-right      */
/* ------------------------------------------------------------------ */

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>*#";

export const ScrambleText: React.FC<{
  text: string;
  /** Frame (local) at which the decrypt begins. */
  startAt?: number;
  /** How long the whole settle takes. */
  durationInFrames?: number;
  style?: React.CSSProperties;
  fromColor?: string;
  toColor?: string;
}> = ({
  text,
  startAt = 0,
  durationInFrames = 22,
  style,
  fromColor = COLORS.textSecondary,
  toColor = COLORS.textPrimary,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startAt;
  const chars = text.split("");
  // Each glyph locks at a staggered point across the first 60% of the window.
  const lockSpan = durationInFrames * 0.6;

  return (
    <span style={{ ...style, fontFamily: style?.fontFamily ?? FONT_FAMILY }}>
      {chars.map((ch, i) => {
        if (ch === " ") return <span key={i}>&nbsp;</span>;
        const lockFrame = (i / Math.max(1, chars.length)) * lockSpan;
        const locked = local >= lockFrame;
        if (locked) {
          return (
            <span key={i} style={{ color: toColor }}>
              {ch}
            </span>
          );
        }
        if (local < 0) {
          return (
            <span key={i} style={{ opacity: 0 }}>
              {ch}
            </span>
          );
        }
        // Cycle a pseudo-random glyph; reseed each frame so it visibly churns.
        const seed = `${i}-${Math.floor(local / 1.5)}`;
        const idx = Math.floor(random(seed) * SCRAMBLE_CHARS.length);
        return (
          <span key={i} style={{ color: fromColor, opacity: 0.85 }}>
            {SCRAMBLE_CHARS[idx]}
          </span>
        );
      })}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* MaskRevealText — clip-path wipe from one edge                        */
/* ------------------------------------------------------------------ */

export const MaskReveal: React.FC<{
  children: React.ReactNode;
  startAt?: number;
  durationInFrames?: number;
  direction?: "left" | "up";
  style?: React.CSSProperties;
}> = ({ children, startAt = 0, durationInFrames = 18, direction = "left", style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - startAt, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT_EXPO,
  });
  const hidden = (1 - p) * 100;
  const clipPath =
    direction === "left"
      ? `inset(0 ${hidden}% 0 0)`
      : `inset(${hidden}% 0 0 0)`;
  const translate =
    direction === "up"
      ? `translateY(${(1 - p) * 18}px)`
      : `translateY(0px)`;
  return (
    <span style={{ display: "inline-block", clipPath, transform: translate, ...style }}>
      {children}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* CountUpNumber — eases 0 → value, with a unit suffix                  */
/* ------------------------------------------------------------------ */

export const CountUp: React.FC<{
  value: number;
  startAt?: number;
  durationInFrames?: number;
  suffix?: string;
  style?: React.CSSProperties;
}> = ({ value, startAt = 0, durationInFrames = 14, suffix = "", style }) => {
  const frame = useCurrentFrame();
  const current = interpolate(frame - startAt, [0, durationInFrames], [0, value], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT_EXPO,
  });
  return (
    <span style={style}>
      {Math.round(current)}
      {suffix}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* GradientSweep — moving specular highlight (buttons, logo)            */
/* ------------------------------------------------------------------ */

export const GradientSweep: React.FC<{
  startAt?: number;
  durationInFrames?: number;
  loop?: boolean;
  /** Width of the light band as a fraction of the element. */
  band?: number;
  color?: string;
  borderRadius?: number;
}> = ({ startAt = 0, durationInFrames = 30, loop = false, band = 0.4, color = "rgba(255,255,255,0.45)", borderRadius = 0 }) => {
  const frame = useCurrentFrame();
  const t = loop
    ? ((frame - startAt) % durationInFrames) / durationInFrames
    : interpolate(frame - startAt, [0, durationInFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const x = interpolate(t, [0, 1], [-band * 100 - 20, 120]);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: `${x}%`,
          width: `${band * 100}%`,
          height: "140%",
          background: `linear-gradient(105deg, transparent, ${color}, transparent)`,
          transform: "skewX(-18deg)",
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Caret — blinking, motion-blurred typing caret                       */
/* ------------------------------------------------------------------ */

export const Caret: React.FC<{ height?: number; advancing?: boolean }> = ({
  height = 30,
  advancing = false,
}) => {
  const frame = useCurrentFrame();
  const blink = Math.sin((frame / 30) * Math.PI * 4) > 0 ? 1 : 0.25;
  return (
    <span
      style={{
        display: "inline-block",
        width: 3,
        height,
        marginLeft: 2,
        borderRadius: 2,
        background: COLORS.violet,
        opacity: advancing ? 1 : blink,
        filter: advancing ? "blur(1.5px)" : "none",
        transform: "translateY(4px)",
        boxShadow: `0 0 12px ${COLORS.violet}`,
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Typewriter — types `text` with subtle human jitter                  */
/* ------------------------------------------------------------------ */

export const Typewriter: React.FC<{
  text: string;
  startAt?: number;
  /** Characters per second. */
  cps?: number;
  style?: React.CSSProperties;
  showCaret?: boolean;
}> = ({ text, startAt = 0, cps = 26, style, showCaret = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = Math.max(0, frame - startAt);
  const charsPerFrame = cps / fps;
  // A touch of jitter so the cadence reads as human, not metronomic.
  const jitter = Math.sin(elapsed / 3) * 0.4;
  const count = Math.min(text.length, Math.floor(elapsed * charsPerFrame + jitter));
  const visible = text.slice(0, Math.max(0, count));
  const advancing = count > 0 && count < text.length && elapsed % 2 === 0;
  return (
    <span style={{ ...style, fontFamily: style?.fontFamily ?? FONT_FAMILY }}>
      {visible}
      {showCaret && count < text.length + 4 ? (
        <Caret height={(style?.fontSize as number) ?? 30} advancing={advancing} />
      ) : null}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* ParticleBurst — radial spray that flies out and fades               */
/* ------------------------------------------------------------------ */

export const ParticleBurst: React.FC<{
  startAt?: number;
  count?: number;
  /** Spread radius in px. */
  radius?: number;
  durationInFrames?: number;
  colors?: string[];
  size?: number;
  origin?: { x: number; y: number };
}> = ({
  startAt = 0,
  count = 46,
  radius = 520,
  durationInFrames = 40,
  colors = [COLORS.violet, COLORS.fuchsia, COLORS.violetSecondary],
  size = 8,
  origin = { x: 0, y: 0 },
}) => {
  const frame = useCurrentFrame();
  const local = frame - startAt;
  if (local < 0 || local > durationInFrames + 6) return null;
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(${origin.x}px, ${origin.y}px)` }}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = random(`a-${i}`) * Math.PI * 2;
        const dist = (0.4 + random(`d-${i}`) * 0.6) * radius;
        const delay = random(`delay-${i}`) * 6;
        const p = interpolate(local - delay, [0, durationInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_OUT_EXPO,
        });
        const x = Math.cos(angle) * dist * p;
        const y = Math.sin(angle) * dist * p;
        const opacity = interpolate(p, [0, 0.15, 1], [0, 1, 0]);
        const s = size * (0.5 + random(`s-${i}`) * 1.2);
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
              boxShadow: `0 0 ${s * 1.6}px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* useEnter — a reusable spring-in 0→1 for scene/element entrances      */
/* ------------------------------------------------------------------ */

export const useEnter = (startAt = 0, damping = 200): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - startAt,
    fps,
    config: { damping, stiffness: 120, mass: 0.9 },
  });
};

/* ------------------------------------------------------------------ */
/* GlowOrb — soft ambient background light                              */
/* ------------------------------------------------------------------ */

export const GlowOrb: React.FC<{
  color: string;
  size: number;
  x: string;
  y: string;
  opacity?: number;
  blur?: number;
}> = ({ color, size, x, y, opacity = 0.5, blur = 90 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: `blur(${blur}px)`,
      opacity,
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
    }}
  />
);
