/**
 * Static content shown inside the ad. Pulled out so the on-screen copy lives in
 * one place and stays consistent with the marketing storyboard.
 *
 * Accuracy guardrails (honoured): no invented metrics; trust signals limited to
 * "Free forever / No credit card / Plan in ~60s"; board columns and priorities
 * match the real product data model.
 */

import { COLORS } from "./theme";

export type Priority = "HIGH" | "MEDIUM" | "LOW";

export const PRIORITY_COLOR: Record<Priority, string> = {
  HIGH: COLORS.red,
  MEDIUM: COLORS.amber,
  LOW: COLORS.green,
};

export type BoardColumn = "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

export const COLUMN_LABELS: Record<BoardColumn, string> = {
  BACKLOG: "BACKLOG",
  TODO: "TODO",
  IN_PROGRESS: "IN PROGRESS",
  REVIEW: "REVIEW",
  DONE: "DONE",
};

export const COLUMN_ORDER: BoardColumn[] = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export type GeneratedTask = {
  id: string;
  title: string;
  priority: Priority;
  column: BoardColumn;
  /** Whole-hour estimate; the card counts up to this value as it lands. */
  estimateHours: number;
};

/** The literal prompt the visitor "types" in scene 2. */
export const DEMO_PROMPT =
  "Launch my coffee shop website — online ordering, menu, and a launch email.";

/** The 6 tasks Flux "generates" in scene 3. Order = land order (staggered). */
export const GENERATED_TASKS: GeneratedTask[] = [
  { id: "t1", title: "Design homepage & menu layout", priority: "HIGH", column: "TODO", estimateHours: 6 },
  { id: "t2", title: "Set up online ordering + payments", priority: "HIGH", column: "TODO", estimateHours: 8 },
  { id: "t3", title: "Write menu copy & item descriptions", priority: "MEDIUM", column: "BACKLOG", estimateHours: 3 },
  { id: "t4", title: "Connect domain & deploy", priority: "MEDIUM", column: "TODO", estimateHours: 2 },
  { id: "t5", title: "Build launch email campaign", priority: "MEDIUM", column: "BACKLOG", estimateHours: 4 },
  { id: "t6", title: "SEO basics + Google listing", priority: "LOW", column: "BACKLOG", estimateHours: 2 },
];

export const BENEFITS: { headline: string; sub: string }[] = [
  { headline: "Tasks, prioritized.", sub: "HIGH · MEDIUM · LOW, sorted for you." },
  { headline: "Estimates, included.", sub: "Know your timeline instantly." },
  { headline: "Plan in ~60s.", sub: "Not an afternoon of spreadsheets." },
];

export const TRUST_SIGNALS = ["Free forever", "No credit card", "Plan in ~60s"];
