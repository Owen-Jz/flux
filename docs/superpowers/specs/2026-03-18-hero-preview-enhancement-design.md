# Enhanced Hero Preview Section Design

**Date:** 2026-03-18
**Topic:** Hero Dashboard Preview Enhancement
**Status:** Approved

## Overview

Transform the landing page hero preview section from a simple animated dashboard mockup into a highly interactive, content-rich demonstration of the Flux platform capabilities. The enhanced preview will showcase the latest features through an engaging, self-performing demo that runs in a loop.

## Goals

1. Increase content density 5x while maintaining readability
2. Add rich cursor interactivity with both ambient and scenario-based interactions
3. Showcase latest dashboard features (AI decomposition, real-time presence, filtering, etc.)
4. Create a memorable "live demo" experience that communicates product value

---

## UI/UX Specification

### Layout Structure

#### Main Dashboard Container
- **Size:** 900px max-width, 500px height (desktop), scales down for tablet/mobile
- **Position:** Centered, elevated with shadow
- **Border radius:** 16px
- **Background:** White (light) / Slate-900 (dark)

#### 5-Column Board Layout
- **Columns:** Backlog | To Do | In Progress | Review | Done
- **Column width:** Equal distribution, ~150px each
- **Column header:** Status name + task count badge
- **Spacing:** 12px gap between columns, 8px between cards

#### Left Sidebar (64px width)
- Workspace icons (Product, Engineering, Design)
- Active workspace indicator (purple highlight)
- Team members with presence dots (green = online)
- Collapsed state shown (icon-only)

#### Right Panel (200px width)
- **Stats Widget:** 3 metric cards (Tasks Completed, In Progress, Team Velocity)
- **Activity Feed:** 4-5 recent activities with timestamps

#### Floating Elements
- **Top-right:** "AI Decompose" suggestion toast (appears periodically)
- **Bottom-left:** Notification toasts (task moved, comment added)
- **Top-left:** Search bar + filter buttons

### Visual Design

#### Color Palette
- **Primary:** Purple-500 (#8b5cf6)
- **Secondary:** Blue-500 (#3b82f6)
- **Accent:** Green-400 (#4ade80) for online status
- **Background:** White / Slate-950
- **Surface:** Slate-50 / Slate-800
- **Text Primary:** Slate-800 / Slate-100
- **Text Secondary:** Slate-500 / Slate-400
- **Border:** Slate-200 / Slate-700

#### Task Card Colors (category dots)
- Design: Orange-400
- Development: Purple-400
- Research: Green-400
- Feature: Blue-400

#### Typography
- **Font Family:** Inter / system-ui
- **Column Headers:** 11px, semibold, uppercase, letter-spacing 0.5px
- **Task Titles:** 13px, medium
- **Task Meta:** 10px, regular
- **Stats Numbers:** 18px, bold
- **Activity Text:** 11px, regular

#### Spacing System
- **Card padding:** 12px
- **Column padding:** 8px
- **Section gaps:** 16px
- **Element margins:** 8px

#### Visual Effects
- **Card hover:** translateY(-2px), shadow increase, border-color change
- **Floating notifications:** Glassmorphism (backdrop-blur-lg, semi-transparent bg)
- **Presence dots:** Pulsing green glow animation
- **AI toast:** Gradient border animation
- **Cursor:** Custom SVG cursor with "You" label

### Components

#### Task Card
- Category color dot (top)
- Task title (truncated at 2 lines)
- Assignee avatars (stack, max 3 visible)
- Due date (if set)
- Priority badge (low/medium/high)
- Progress bar (if in-progress)
- **States:** Default, Hover (lifted), Dragging (opacity 0.8)

#### Column
- Header with count badge
- Scrollable card container
- Drop zone indicator (dashed border on drag-over)

#### Sidebar
- Workspace icons with hover state
- Team member list with presence
- Collapse/expand animation

#### Stats Widget
- Metric value (animated count-up)
- Metric label
- Trend indicator (up/down arrow)

#### Activity Feed Item
- Avatar
- Action text (e.g., "Sarah moved Task to Done")
- Relative timestamp

#### Notification Toast
- Icon (check/comment/user)
- Message text
- Close button
- Auto-dismiss after 3s
- Slide-in animation

#### Detail Modal (on click)
- Task title (editable)
- Description
- Assignees
- Comments section with avatars
- AI Decompose button
- Subtasks list

---

## Functionality Specification

### Cursor Interactions

#### Ambient Interactions (continuous)
1. **Hover on task cards:**
   - Card lifts (translateY -2px)
   - Subtle shadow increase
   - Border color shifts to purple-300

2. **Hover on buttons:**
   - Scale 1.05
   - Background color shift

3. **Hover on sidebar items:**
   - Background highlight
   - Tooltip with full name appears

#### Scenario-Based Interactions (looped every 12s)

**Phase 1 (0-3s):** Cursor moves to "In Progress" column, hovers over task
**Phase 2 (3-5s):** Clicks task → Detail modal slides in from right
**Phase 3 (5-8s):** Cursor "types" in comment field → AI suggestion appears
**Phase 4 (8-10s):** Clicks "AI Decompose" → Task visually splits into 3 subtasks
**Phase 5 (10-12s):** Closes modal, drags main task to "Done" → Notification pops up

#### Cursor Movement
- Smooth easing (easeInOut)
- Variable timing based on action
- Trail effect optional

### Animation Sequences

#### Initial Load (0-2s)
1. Dashboard fades in (0-0.5s)
2. Columns stagger in from bottom (0.3-1s)
3. Task cards stagger in (0.5-1.5s)
4. Sidebar + stats fade in (1-1.5s)
5. Cursor appears (1.5s)

#### Notification Cycle
- New notification slides in from right (0.3s)
- Holds for 3s
- Fades out (0.3s)
- Next notification after 2s delay
- Rotates through 3-4 different notification types

#### AI Toast Cycle
- Appears top-right with gradient border animation
- Holds for 4s
- Suggests "Decompose this task?"
- Auto-dismisses or user can close

### Data Handling

All data is mock/static — no real API calls. Data structure:

```typescript
interface MockTask {
  id: string;
  title: string;
  category: 'Design' | 'Development' | 'Research' | 'Feature';
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority?: 'low' | 'medium' | 'high';
  assignees: string[]; // initials
  dueDate?: string;
  progress?: number;
  comments?: number;
}

interface MockActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}
```

### Edge Cases
- **Mobile view:** Collapse to simplified 2-column view + "View more" indicator
- **Reduced motion preference:** Disable cursor movement, keep hover effects only
- **Dark mode:** Full support with appropriate color shifts

---

## Acceptance Criteria

### Visual Checkpoints
- [ ] Dashboard displays 5 columns with 3-4 tasks each (15-20 total tasks)
- [ ] Left sidebar shows 3 workspaces + 4 team members with green presence dots
- [ ] Right panel shows stats widget + 4 activity feed items
- [ ] At least 2 floating notifications appear in a cycle
- [ ] AI toast appears with "Decompose" suggestion
- [ ] Dark mode renders correctly with proper contrast

### Interaction Checkpoints
- [ ] Cursor moves smoothly along defined path
- [ ] Clicking task opens detail modal
- [ ] AI decomposition visually splits task into subtasks
- [ ] Drag animation shows task moving to Done column
- [ ] Notification toast appears after task move
- [ ] Hover effects work on all interactive elements

### Performance
- [ ] Animations run at 60fps
- [ ] No layout shift during animations
- [ ] Page load to animation start < 2s

### Responsive
- [ ] Desktop (1200px+): Full 5-column + sidebar + stats
- [ ] Tablet (768px): 3 columns, sidebar collapses
- [ ] Mobile (375px): Single column with tabs

---

## Technical Implementation Notes

- Use Framer Motion for all animations
- Custom cursor component with position state
- CSS-in-JS or Tailwind for styling
- Intersection Observer for scroll-based reveals
- useReducedMotion hook for accessibility
- Portal for modal rendering
