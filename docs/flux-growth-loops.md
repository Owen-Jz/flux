# Flux Growth Loops Analysis

## Product Overview

**Flux** is a kanban-style project management tool for engineering teams with:
- Workspaces → Boards → Columns/Categories → Tasks
- Task assignment, subtasks, comments, tags, priorities
- Real-time collaboration features

---

## Product Growth Analysis

### Current State

| Dimension | Assessment |
|-----------|------------|
| **Acquisition** | Traditional marketing (landing page, SEO) |
| **Referral** | Basic team invites exist, but no structured referral program |
| **Retention** | Core task management, no gamification or retention hooks |
| **Viral** | No shareable features or public visibility |

---

## 3 Growth Loops for Flux

### Loop 1: The Assignment Viral Chain

**Mechanism**: Leverage the natural act of assigning tasks to drive invites.

```
User A assigns task → External email notification → Person B joins → Assigns to Person C → Repeat
```

**Implementation**:
- When assigning a task to an email not associated with the workspace → trigger "invite + preview" email
- Email shows: *"You've been mentioned on Flux: [Task Name]"* with a preview of the task context
- One-click "Join to respond" button → creates account + joins workspace
- Track invite conversion rate in analytics

**Why it works**: Assignment is a core action in a task manager. Every assignment to a new person = a potential new user. The trigger is intrinsic to the product, not an external incentive.

**Viral Coefficient Estimate**: 1.2-1.5x (each user brings 1-2 team members over time)

---

### Loop 2: Template Marketplace (Board Cloning)

**Mechanism**: Teams create useful board templates → share via public gallery → other teams discover, clone, and join.

```
Create useful board → Publish as template → Others discover → Clone to their workspace → Invite chain starts
```

**Implementation**:
- Add "Make Template Public" toggle on any board
- Public templates appear in a `/templates` gallery with search/filter (by category: "Sprint Board", "Bug Tracker", "Project Roadmap")
- Clone = creates copy in user's workspace + optional "Created by @username" attribution
- Templates link back to creator's public profile → easy follow/connect
- Weekly email of "Popular templates this week" to drive engagement

**Why it works**: Templates are inherently shareable. A well-designed sprint board for an engineering team is valuable—other teams want it. The "clone" action is low-friction and delivers instant value.

**Growth Driver**: SEO + word-of-mouth. Templates rank for long-tail searches ("engineering sprint board template").

---

### Loop 3: External Observer Access

**Mechanism**: Non-members can view specific boards via shareable links → experience value → convert to members.

```
Create shareable board link → External person views → Sees real-time updates → Signs up to participate
```

**Implementation**:
- Add "Share Board" button → generates public link (e.g., `flux.app/board/shared/xyz`)
- Shared boards show: task cards, columns, activity feed (read-only)
- CTA banner: *"Want to move tasks or comment? Create free account"*
- Optionally: "Request access" button → workspace owner gets notification to add them
- Analytics: track view-to-signup conversion per link

**Why it works**: Stakeholders outside the team (PMs, clients, executives) often need visibility into progress. They naturally want to participate. The share link provides value without requiring signup upfront—reducing friction.

**Growth Driver**: Organic traffic + network expansion. Every shared board is a potential conversion funnel.

---

## Summary

| Loop | Type | Key Action | Growth Driver |
|------|------|------------|----------------|
| **Assignment Viral** | Viral | Assign task to external email | Intrinsic product action |
| **Template Marketplace** | Referral + SEO | Publish/clone board templates | Network effect + discoverability |
| **External Observer** | Acquisition | Share board via link | Low-friction conversion |

---

## Notes

- These loops are **built into the product's core workflows**, not add-ons
- They scale as usage increases—no extra marketing spend required
- Each loop can be implemented incrementally and measured independently
