# Workspace Dashboard — Design Spec

## Overview

Replace the current behavior where `/dashboard` immediately redirects to the user's first workspace with a **workspace selection grid** — a visual dashboard showing all workspaces as clickable cards. Users land here after login instead of being dropped directly into a workspace.

## Layout

### Page Structure
- **Header**: Page title "Your Workspaces" with a subtitle showing user name
- **Grid**: Responsive card grid (3-4 columns on large, 2 on tablet, 1 on mobile)
- **Empty state**: Shown when user has no workspaces — illustration + CTA to onboarding

### Card Design
Each workspace card contains:
- **Colored gradient header** — Uses workspace's accent color (stored in `workspace.settings.accentColor`), falls back to a deterministic gradient based on workspace name
- **Workspace name** — Bold, primary text
- **Member count** — Icon + number (e.g., "👥 4 members")
- **Board count** — Icon + number (e.g., "📋 12 boards")
- **Last active timestamp** — Relative time showing when the workspace was last accessed

### Empty State Design
- Centered layout with:
  - Rocket illustration emoji (or subtle SVG illustration)
  - "No workspaces yet" heading
  - Supporting text: "Create your first workspace to get started with your projects"
  - Primary CTA button: "Create your first workspace →" that navigates to `/onboarding`

## Behavior

### Interactions
- **Card click**: Navigate to `/{workspaceSlug}` — enter that workspace
- **Empty state CTA click**: Navigate to `/onboarding`
- No kebab menus, settings, or additional actions on cards (keep it simple — click to enter)

### Responsive Breakpoints
- **Desktop (1024px+)**: 3-4 column grid
- **Tablet (768px-1023px)**: 2 column grid
- **Mobile (<768px)**: 1 column grid, cards stack vertically

## Data Requirements

### For each workspace, fetch:
- `name` — Workspace display name
- `slug` — URL-safe identifier for navigation
- `accentColor` — From `workspace.settings.accentColor` (optional)
- `memberCount` — Count of workspace members
- `boardCount` — Count of boards in workspace
- `lastActiveAt` — Most recent `updatedAt` across boards in the workspace (or workspace's own `updatedAt`)

### Sorting
- Workspaces sorted by `lastActiveAt` descending (most recently active first)

## Component Inventory

### `<WorkspaceDashboard>` (page component)
- Server component that fetches user's workspaces
- Renders header + grid or empty state
- Redirects unauthenticated users to login

### `<WorkspaceCard>` (client component)
- Displays single workspace as a clickable card
- Props: `{ id, name, slug, accentColor, memberCount, boardCount, lastActiveAt }`
- States: default, hover (subtle lift shadow + scale)

### `<EmptyWorkspaces>` (client component)
- Shown when `workspaces.length === 0`
- Renders illustration, text, and CTA button

## Technical Approach

### Route Change
- **`app/dashboard/page.tsx`**: Change from redirect-to-first-workspace logic to render workspace grid
- Keep existing auth check (redirect to `/login` if no session)

### Data Fetching
- Reuse existing `getWorkspaces()` action but enhance it to include:
  - Member count per workspace
  - Board count per workspace
  - Last active timestamp (most recent board update)
- Consider adding a new optimized action like `getWorkspacesWithStats()` to fetch all needed data in one query

### CSS/Styling
- Use existing Tailwind CSS setup
- Cards use existing border/background utilities
- Responsive grid via Tailwind's `grid-cols-*` classes

### Navigation
- Use Next.js `Link` component for card navigation
- Empty state CTA uses `<Button>` or styled link to `/onboarding`
