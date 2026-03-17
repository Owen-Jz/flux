# Flux Project Management Platform - Feature Audit

## Executive Summary

This is a comprehensive project management/collaboration platform similar to Trello, Asana, or Linear. The product supports Kanban boards, task management, issue tracking, team collaboration, and workspace organization.

---

## Detailed Feature Classification

### Authentication & User Management

| Feature | Classification | User Value |
|---------|---------------|------------|
| Email/password auth | **Core** | Basic access control - essential |
| Google OAuth | **Supporting** | Convenience for users who prefer SSO |
| Account lockout (5 failures) | **Supporting** | Security hardening - nice to have |
| Password reset | **Core** | Essential for password-based auth |
| Tutorial/onboarding | **Unnecessary** | Can be replaced with inline hints |

### Workspace Management

| Feature | Classification | User Value |
|---------|---------------|------------|
| Multiple workspaces | **Core** | Essential for separating projects/orgs |
| Workspace slug/URL | **Core** | Enables shareable links |
| Public/private toggle | **Supporting** | Adds complexity - rarely used by teams |
| Accent color customization | **Unnecessary** | Purely cosmetic, no functional value |
| Invite codes | **Supporting** | One way to invite - could consolidate |
| Role system (Admin/Editor/Viewer) | **Core** | Essential for team collaboration |

### Team Management

| Feature | Classification | User Value |
|---------|---------------|------------|
| Invite via email | **Core** | Essential for onboarding |
| View member list | **Supporting** | Management overhead |
| Role management | **Core** | Essential permission control |
| Access requests | **Unnecessary** | Adds friction, rare edge case |

### Board (Kanban)

| Feature | Classification | User Value |
|---------|---------------|------------|
| Multiple boards | **Core** | Essential for project organization |
| Custom colors/icons | **Supporting** | Visual organization - nice to have |
| Board CRUD | **Core** | Basic functionality |
| Predefined columns (Backlog/To Do/etc.) | **Core** | Standard workflow |

### Task Management

| Feature | Classification | User Value |
|---------|---------------|------------|
| Create tasks (title, description) | **Core** | Essential |
| Drag-and-drop between columns | **Core** | Core interaction |
| Priority levels | **Core** | Essential triage |
| Assign to members | **Core** | Core responsibility assignment |
| Subtasks | **Supporting** | Useful but adds complexity |
| Comments | **Supporting** | Collaboration - nice to have |
| Tags | **Unnecessary** | Rarely used in practice |
| Due dates | **Supporting** | Scheduling - nice to have |
| Categories | **Unnecessary** | Overlap with boards |
| Search/filter | **Supporting** | Useful at scale |

### Issue Tracking

| Feature | Classification | User Value |
|---------|---------------|------------|
| Issue types (Bug/Feature) | **Core** | Essential for tech teams |
| Priority & status | **Core** | Essential workflow |
| Reporter/assignee | **Core** | Essential accountability |
| List/board toggle view | **Supporting** | Preference - nice to have |
| Activity logging | **Unnecessary** | Devolves into audit trail |

### Archive

| Feature | Classification | User Value |
|---------|---------------|------------|
| View/restore archived | **Supporting** | Recovery - rare need |
| Permanent delete | **Supporting** | Privacy/compliance |

### Notifications

| Feature | Classification | User Value |
|---------|---------------|------------|
| Email notifications (tasks, assignments, comments) | **Supporting** | Keeps users informed but adds infrastructure |
| In-app notifications | **Unnecessary** | Not implemented |

### Theme & UI

| Feature | Classification | User Value |
|---------|---------------|------------|
| Light/dark mode | **Supporting** | Developer preference |
| Landing page (hero, pricing, FAQ, testimonials) | **Unnecessary** | Marketing - not core product |

---

## Features to Remove

1. **Tutorial/onboarding flow** - Replace with simple inline hints
2. **Workspace accent colors** - Pure decoration
3. **Access request system** - Rarely used, adds friction
4. **Task tags** - Low adoption, adds UI complexity
5. **Board categories** - Redundant with boards themselves
6. **Activity logging** - Devolves into noise
7. **Public workspace toggle** - Rarely used, adds permission complexity
8. **Landing page** - Not core to authenticated product

---

## Minimal Viable Product (MVP)

### What Wins: A focused Kanban task manager for small teams

**Keep (Core + Supporting):**
- Email/password + Google OAuth authentication
- Workspace with Admin/Editor/Viewer roles
- Multiple boards per workspace
- Tasks with title, description, priority, assignee
- Drag-and-drop between columns
- Kanban columns (Backlog, To Do, In Progress, Done)
- Issues with types (Bug/Feature), priority, status
- Invite members via email
- Dark mode toggle
- Subtasks and due dates (keep, they're high-value)

**Simplify:**
- Single role system per workspace (Admin/Member) - remove Viewer
- Remove board custom colors/icons - use defaults
- Remove tags and categories
- Remove activity logging
- Remove landing page entirely (or simplify to one-page signup)
- Remove access request system
- Consolidate notifications (just task assignment emails)

### Simplified Architecture

```
Users → Workspaces → Boards → Tasks
                         → Issues
```

### Why This Wins

- **Solves one problem well**: Team task management via Kanban
- **Faster to build**: ~60% less surface area
- **Easier to maintain**: Fewer edge cases
- **Still competitive**: Beats bare-bones alternatives, competes with Trello's free tier

The product wins by being a clean, focused tool rather than a feature-swamped platform that users struggle to learn.

---

## Data Entities Reference

| Entity | Key Properties |
|--------|---------------|
| **User** | name, email, image, password, tutorial progress |
| **Workspace** | name, slug, owner, members (with roles), settings, invite code |
| **Board** | name, slug, color, icon, categories |
| **Task** | title, description, status, priority, assignees, subtasks, comments, tags, due date, category |
| **Issue** | title, description, type, priority, status, reporter, assignee |
| **ActivityLog** | type, description, metadata, timestamps |
| **AccessRequest** | user, workspace, requested role, status, message |
