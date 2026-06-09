/**
 * Board UI used by the "generate" and "benefits" scenes — a faithful, miniature
 * version of the real Flux Kanban card so the ad shows the actual product surface.
 */

import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_FAMILY } from "./theme";
import { CountUp } from "./primitives";
import {
  PRIORITY_COLOR,
  COLUMN_ORDER,
  COLUMN_LABELS,
  GENERATED_TASKS,
  type GeneratedTask,
} from "./data";

export const Eyebrow: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <div
    style={{
      fontFamily: FONT_FAMILY,
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "0.28em",
      textTransform: "uppercase",
      color,
    }}
  >
    {label}
  </div>
);

export const PriorityChip: React.FC<{ priority: GeneratedTask["priority"]; popAt?: number; highlight?: boolean }> = ({
  priority,
  popAt = 0,
  highlight = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - popAt, fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
  const color = PRIORITY_COLOR[priority];
  // A 1-frame brighter flash as it pops in.
  const flash = interpolate(frame - popAt, [0, 2, 6], [1.6, 1.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: `${color}1f`,
        border: `1px solid ${color}${highlight ? "" : "66"}`,
        color,
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: "0.06em",
        transform: `scale(${pop})`,
        filter: highlight ? `brightness(${flash}) drop-shadow(0 0 10px ${color}aa)` : `brightness(${flash})`,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
      {priority}
    </span>
  );
};

const ClockGlyph: React.FC<{ color: string }> = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TaskCard: React.FC<{
  task: GeneratedTask;
  /** Local frame at which this card begins materializing. */
  landAt: number;
  /** Re-trigger the estimate count-up (used in the benefits montage). */
  recountAt?: number;
  highlightPriority?: boolean;
  width?: number;
}> = ({ task, landAt, recountAt, highlightPriority = false, width = 360 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame: frame - landAt, fps, config: { damping: 14, stiffness: 130, mass: 0.8 } });
  const opacity = interpolate(frame - landAt, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Overshoot upward then settle — easeOutBack feel via spring.
  const translateY = interpolate(enter, [0, 1], [26, 0]);
  const scale = interpolate(enter, [0, 1], [0.92, 1]);

  return (
    <div
      style={{
        width,
        background: COLORS.surfaceElevated,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: "16px 18px",
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        boxShadow: `0 18px 40px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.02)`,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <span style={{ color: COLORS.textPrimary, fontSize: 19, fontWeight: 600, lineHeight: 1.3 }}>{task.title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
        <PriorityChip priority={task.priority} popAt={landAt + 4} highlight={highlightPriority} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: COLORS.textSecondary, fontSize: 15, fontWeight: 600 }}>
          <ClockGlyph color={COLORS.textTertiary} />
          <CountUp
            value={task.estimateHours}
            startAt={recountAt ?? landAt + 2}
            durationInFrames={12}
            suffix="h"
          />
        </span>
      </div>
    </div>
  );
};

/**
 * The full 5-column board. Cards land staggered relative to `landBase`. Pass a
 * deeply-negative `landBase` to render the board fully-settled (used as the
 * tilted backdrop in the benefits scene). `recountBase`, when set, re-triggers
 * the estimate count-ups for the montage.
 */
export const BoardView: React.FC<{
  landBase: number;
  headerRevealAt?: number;
  recountBase?: number;
  highlightPriorities?: boolean;
}> = ({ landBase, headerRevealAt = landBase - 12, recountBase, highlightPriorities = false }) => {
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start", width: 1680 }}>
      {COLUMN_ORDER.map((col, ci) => {
        const cards = GENERATED_TASKS.filter((t) => t.column === col);
        return (
          <div key={col} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            <ColumnHeader label={COLUMN_LABELS[col]} index={ci} revealAt={headerRevealAt} />
            {cards.map((task) => {
              const globalIndex = GENERATED_TASKS.findIndex((t) => t.id === task.id);
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  landAt={landBase + globalIndex * 4}
                  recountAt={recountBase !== undefined ? recountBase + globalIndex * 2 : undefined}
                  highlightPriority={highlightPriorities}
                  width={300}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export const ColumnHeader: React.FC<{ label: string; index: number; revealAt: number }> = ({ label, index, revealAt }) => {
  const frame = useCurrentFrame();
  const start = revealAt + index * 3;
  const opacity = interpolate(frame - start, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(frame - start, [0, 10], [-14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const underline = interpolate(frame - start, [4, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, fontFamily: FONT_FAMILY }}>
      <div style={{ color: COLORS.textSecondary, fontSize: 15, fontWeight: 800, letterSpacing: "0.16em" }}>{label}</div>
      <div
        style={{
          height: 2,
          marginTop: 8,
          width: `${underline * 100}%`,
          background: `linear-gradient(90deg, ${COLORS.violet}, transparent)`,
          borderRadius: 2,
        }}
      />
    </div>
  );
};
