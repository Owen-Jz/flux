# Changelog

All notable changes to Flux are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and versions use a 4-digit
`MAJOR.MINOR.PATCH.MICRO` scheme.

## [0.2.0.0] - 2026-06-05

### Added
- **Plan with AI on the workspace page** — generate whole boards of tasks for the
  current workspace, not just one board.
- **Domain-aware, engaging loading phrases** while the AI plans (finance, events,
  marketing, writing, research, software, and more) so the wait feels alive.
- **Reliable post-signup handoff** — a project typed on the marketing hero is now
  picked up after sign-up and opened in Plan with AI with a "picking up where you
  left off" welcome, instead of being silently lost.
- **A real Open Graph image** (1200×630 PNG), `sitemap.xml`, `robots.txt`,
  JSON-LD structured data, and AI-positioned page metadata for SEO.
- **Calendar date picker** in the task detail modal (replaces the native date
  input and fixes an off-by-one timezone bug).
- **A dedicated "workspace unavailable" page** for deleted or inaccessible
  workspaces, instead of a silent redirect.
- **Mobile entry point** for Plan with AI on boards.

### Changed
- **AI planning is no longer tech-biased.** Prompts now infer the project's
  real-world domain and use that domain's language and examples.
- **"Issues" became "Feedback"** — repositioned as a bug/feature intake that
  converts into board tasks, role-gated to editors, and fully typed.
- **Smoother board interactions** — dragging a task now highlights and drops into
  the column under the cursor (was sticking to the nearest column), card hover is
  no longer jagged, and AI-streamed tasks stream in one-by-one.
- **New tasks auto-assign to their creator** when no assignee is chosen (manual
  creation and Plan with AI); solo boards hide assignee filters and the
  "Unassigned" label.
- **The task detail modal** is a responsive bottom sheet on mobile with metadata
  reachable before the comment thread.
- **Comment likes, reactions, and replies now persist** across reloads, and
  posting a comment no longer fires a redundant task-update write/webhook.
- **The streaming plan banner** shows an instant "analyzing" state with a real
  progress shimmer and no longer shifts the board layout.

### Fixed
- **AI request reliability** — each retry now gets a fresh timeout and abort
  controller (a shared controller previously made retries fail instantly), and
  only transient errors are retried. Added `max_tokens` to bound latency.
- **Orphaned workspace members** (whose user account was deleted) no longer crash
  the workspace route.
- The streaming planner now keeps the connection alive with heartbeats and never
  leaks raw provider errors to the UI.
