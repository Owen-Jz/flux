# Hero Preview Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the landing page hero preview into a highly interactive, content-rich dashboard demo with 5x more content, rich cursor interactivity, and showcase of latest dashboard features.

**Architecture:** Replace existing `hero-preview.tsx` with an enhanced version containing a full 5-column Kanban board, sidebar with workspaces and team presence, right stats/activity panel, scenario-based cursor animations, and floating notifications. Use Framer Motion for all animations.

**Tech Stack:** React, Next.js, Framer Motion, Tailwind CSS

---

## File Structure

```
components/landing/
├── hero-preview.tsx          # Modify - Replace with enhanced version
└── hero-preview-data.ts     # Create - Mock data for the enhanced preview
```

---

### Task 1: Create Mock Data File

**Files:**
- Create: `components/landing/hero-preview-data.ts`

- [ ] **Step 1: Create mock data file with all task, activity, and notification data**

```typescript
// components/landing/hero-preview-data.ts

export interface MockTask {
  id: string;
  title: string;
  category: 'Design' | 'Development' | 'Research' | 'Feature';
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority?: 'low' | 'medium' | 'high';
  assignees: string[];
  dueDate?: string;
  progress?: number;
}

export const mockTasks: MockTask[] = [
  // Backlog
  { id: 'b1', title: 'Research competitor analytics features', category: 'Research', status: 'BACKLOG', priority: 'medium', assignees: ['JD'], dueDate: 'Nov 1' },
  { id: 'b2', title: 'Define Q1 OKRs', category: 'Feature', status: 'BACKLOG', priority: 'high', assignees: ['SK', 'MR'] },
  { id: 'b3', title: 'Update API documentation', category: 'Development', status: 'BACKLOG', priority: 'low', assignees: ['AL'] },

  // To Do
  { id: 't1', title: 'Design system audit', category: 'Design', status: 'TODO', priority: 'medium', assignees: ['JD', 'AL'] },
  { id: 't2', title: 'API v2 integration', category: 'Feature', status: 'TODO', priority: 'high', assignees: ['SK', 'MR'], dueDate: 'Oct 28' },
  { id: 't3', title: 'Performance optimization', category: 'Development', status: 'TODO', priority: 'low', assignees: ['JD'] },
  { id: 't4', title: 'Mobile responsive layout', category: 'Design', status: 'TODO', priority: 'medium', assignees: ['AL'], dueDate: 'Nov 5' },

  // In Progress
  { id: 'p1', title: 'Dashboard redesign', category: 'Development', status: 'IN_PROGRESS', priority: 'high', assignees: ['MR', 'SK', 'AL'], progress: 65 },
  { id: 'p2', title: 'User authentication flow', category: 'Feature', status: 'IN_PROGRESS', priority: 'medium', assignees: ['JD', 'SK'], progress: 40 },
  { id: 'p3', title: 'Real-time notifications', category: 'Development', status: 'IN_PROGRESS', priority: 'high', assignees: ['MR'], progress: 80 },
  { id: 'p4', title: 'Export to CSV feature', category: 'Feature', status: 'IN_PROGRESS', priority: 'low', assignees: ['SK'], progress: 25 },

  // Review
  { id: 'r1', title: 'Login page redesign', category: 'Design', status: 'REVIEW', priority: 'medium', assignees: ['AL', 'JD'], progress: 100 },
  { id: 'r2', title: 'Database migration', category: 'Development', status: 'REVIEW', priority: 'high', assignees: ['MR'], progress: 100 },

  // Done
  { id: 'd1', title: 'User interviews', category: 'Research', status: 'DONE', assignees: ['SK'] },
  { id: 'd2', title: 'Wireframe prototypes', category: 'Design', status: 'DONE', assignees: ['AL'] },
  { id: 'd3', title: 'Setup CI/CD pipeline', category: 'Development', status: 'DONE', assignees: ['MR', 'JD'] },
  { id: 'd4', title: 'Security audit', category: 'Feature', status: 'DONE', assignees: ['SK'] },
];

export const mockTeamMembers = [
  { initials: 'JD', name: 'John Doe', role: 'Product Lead', online: true },
  { initials: 'SK', name: 'Sarah Kim', role: 'Engineering', online: true },
  { initials: 'MR', name: 'Mike Ross', role: 'Designer', online: false },
  { initials: 'AL', name: 'Alex Lee', role: 'Developer', online: true },
];

export const mockActivities = [
  { id: '1', user: 'Sarah Kim', action: 'moved', target: 'Dashboard redesign to In Progress', time: '2m ago' },
  { id: '2', user: 'Alex Lee', action: 'commented on', target: 'API v2 integration', time: '5m ago' },
  { id: '3', user: 'Mike Ross', action: 'completed', target: 'Database migration', time: '12m ago' },
  { id: '4', user: 'John Doe', action: 'created', target: 'Q1 OKRs task', time: '1h ago' },
];

export const mockNotifications = [
  { id: '1', type: 'success', message: 'Security audit completed', time: 'Just now' },
  { id: '2', type: 'comment', message: 'Sarah commented on your task', time: '2m ago' },
  { id: '3', type: 'user', message: 'Alex joined the board', time: '5m ago' },
  { id: '4', type: 'success', message: 'Deployment to prod successful', time: '10m ago' },
];

export const columns = [
  { id: 'BACKLOG', title: 'Backlog' },
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' },
];
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/hero-preview-data.ts
git commit -m "feat: add mock data for enhanced hero preview

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Build Enhanced Task Card Component

**Files:**
- Create: `components/landing/hero-task-card.tsx`

- [ ] **Step 1: Create TaskCard component for hero preview**

```tsx
// components/landing/hero-task-card.tsx
"use client";

import { motion } from "framer-motion";
import { MockTask } from "./hero-preview-data";

interface HeroTaskCardProps {
  task: MockTask;
  onClick?: () => void;
  isModalOpen?: boolean;
}

const categoryColors: Record<string, string> = {
  Design: 'bg-orange-400',
  Development: 'bg-purple-400',
  Research: 'bg-green-400',
  Feature: 'bg-blue-400',
};

const priorityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

export function HeroTaskCard({ task, onClick, isModalOpen }: HeroTaskCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        p-3 bg-white dark:bg-slate-800 rounded-lg border cursor-pointer group
        ${isModalOpen ? 'border-purple-400 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500'}
        shadow-sm hover:shadow-md transition-all
      `}
    >
      {/* Category dot */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${categoryColors[task.category]}`} />
        <span className="text-[9px] font-medium uppercase text-slate-400">{task.category}</span>
        {task.priority && (
          <span className={`ml-auto text-[8px] px-1.5 py-0.5 rounded-full font-medium uppercase ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-white transition-colors">
        {task.title}
      </div>

      {/* Progress bar */}
      {task.progress !== undefined && (
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full mt-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${task.progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full"
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex -space-x-1">
          {task.assignees.slice(0, 3).map((initials, i) => (
            <div
              key={initials}
              className="w-5 h-5 rounded-full border border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold text-white"
              style={{ backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"][i % 4], zIndex: 10 - i }}
            >
              {initials}
            </div>
          ))}
          {task.assignees.length > 3 && (
            <div className="w-5 h-5 rounded-full border border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[7px] text-slate-500">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
        {task.dueDate && (
          <span className="text-[9px] text-slate-400">{task.dueDate}</span>
        )}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/hero-task-card.tsx
git commit -m "feat: create HeroTaskCard component for enhanced preview

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Build Detail Modal Component

**Files:**
- Create: `components/landing/hero-detail-modal.tsx`

- [ ] **Step 1: Create DetailModal component**

```tsx
// components/landing/hero-detail-modal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MockTask } from "./hero-preview-data";
import { XMarkIcon, PaperAirplaneIcon, SparklesIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";

interface HeroDetailModalProps {
  task: MockTask | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HeroDetailModal({ task, isOpen, onClose }: HeroDetailModalProps) {
  return (
    <AnimatePresence>
      {isOpen && task && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-4 top-4 bottom-4 w-[380px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  task.category === 'Design' ? 'bg-orange-400' :
                  task.category === 'Development' ? 'bg-purple-400' :
                  task.category === 'Research' ? 'bg-green-400' : 'bg-blue-400'
                }`} />
                <span className="text-xs font-medium text-slate-500 uppercase">{task.category}</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                {task.title}
              </h3>

              {/* Description placeholder */}
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Add a description to this task...
              </p>

              {/* Progress */}
              {task.progress !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Assignees */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500 uppercase">Assignees</div>
                <div className="flex -space-x-2">
                  {task.assignees.map((initials, i) => (
                    <div
                      key={initials}
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"][i % 4], zIndex: 10 - i }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase">
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  Comments
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] font-bold">SK</div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Sarah Kim</span>
                    <span className="text-[10px] text-slate-400">2m ago</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">This looks great! Can we add a progress indicator?</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              {/* AI Decompose button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
              >
                <SparklesIcon className="w-4 h-4" />
                AI Decompose Task
              </motion.button>

              {/* Comment input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm border-0 focus:ring-2 focus:ring-purple-500"
                />
                <button className="p-2 bg-purple-500 text-white rounded-lg">
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/hero-detail-modal.tsx
git commit -m "feat: create HeroDetailModal component

Co-Authored-By: Claude Opus 4.6 <noreput@anthropic.com>"
```

---

### Task 4: Build Notification Toast System

**Files:**
- Create: `components/landing/hero-notification.tsx`

- [ ] **Step 1: Create NotificationToast component**

```tsx
// components/landing/hero-notification.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, ChatBubbleLeftIcon, UserPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Notification {
  id: string;
  type: 'success' | 'comment' | 'user' | 'success';
  message: string;
  time: string;
}

interface NotificationToastProps {
  notification: Notification | null;
}

const iconMap = {
  success: CheckCircleIcon,
  comment: ChatBubbleLeftIcon,
  user: UserPlusIcon,
};

const colorMap = {
  success: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400',
  comment: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  user: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
};

export function NotificationToast({ notification }: NotificationToastProps) {
  if (!notification) return null;

  const Icon = iconMap[notification.type] || CheckCircleIcon;
  const colorClass = colorMap[notification.type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 100, opacity: 0, scale: 0.9 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        exit={{ x: 100, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="absolute -right-4 top-20 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl flex items-center gap-3 z-30"
      >
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-medium text-slate-800 dark:text-white">{notification.message}</div>
          <div className="text-[10px] text-slate-400">{notification.time}</div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/hero-notification.tsx
git commit -m "feat: create notification toast component

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Build Main Enhanced Hero Preview Component

**Files:**
- Modify: `components/landing/hero-preview.tsx` (replace entire file)

- [ ] **Step 1: Replace hero-preview.tsx with enhanced version**

```tsx
// components/landing/hero-preview.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { SparklesIcon, BoltIcon, ShieldCheckIcon, UsersIcon, CheckIcon, ClockIcon, MagnifyingGlassIcon, FunnelIcon, PlusIcon } from "@heroicons/react/24/outline";
import { mockTasks, mockTeamMembers, mockActivities, mockNotifications, columns, MockTask } from "./hero-preview-data";
import { HeroTaskCard } from "./hero-task-card";
import { HeroDetailModal } from "./hero-detail-modal";
import { NotificationToast } from "./hero-notification";

// Custom cursor component
function CustomCursor({ x, y, isVisible }: { x: number; y: number; isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <motion.div
      animate={{ x: x - 10, y: y - 10 }}
      transition={{ type: "tween", duration: 0.1 }}
      className="fixed top-0 left-0 z-[100] pointer-events-none"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L23.0003 11.6923L12.411 11.6923C11.7236 11.6923 11.018 11.9523 10.2523 12.3973L5.65376 12.3673Z"
          fill="#0f172a"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
      <div className="ml-5 -mt-2 bg-[#8b5cf6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
        You
      </div>
    </motion.div>
  );
}

// Sidebar component
function Sidebar() {
  return (
    <div className="w-16 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 p-3 flex flex-col gap-4">
      {/* Workspace icons */}
      <div className="space-y-2">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 cursor-pointer"
        >
          <BoltIcon className="w-5 h-5" />
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          <ShieldCheckIcon className="w-5 h-5" />
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          <UsersIcon className="w-5 h-5" />
        </motion.div>
      </div>

      {/* Team members */}
      <div className="mt-auto space-y-2">
        {mockTeamMembers.map((member, i) => (
          <motion.div
            key={member.initials}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 + i * 0.1 }}
            whileHover={{ scale: 1.1 }}
            className="relative cursor-pointer"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"][i] }}
            >
              {member.initials}
            </div>
            {member.online && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white dark:border-slate-900 rounded-full"
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Stats and Activity Panel
function RightPanel() {
  return (
    <div className="w-48 bg-slate-50 dark:bg-slate-800/50 border-l border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-4">
      {/* Stats */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stats</div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <div className="text-xl font-bold text-slate-800 dark:text-white">24</div>
          <div className="text-[10px] text-slate-500 uppercase">Completed</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">8</div>
          <div className="text-[10px] text-slate-500 uppercase">In Progress</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">+12%</div>
          <div className="text-[10px] text-slate-500 uppercase">Velocity</div>
        </motion.div>
      </div>

      {/* Activity */}
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity</div>
        {mockActivities.map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 + i * 0.1 }}
            className="text-[10px] space-y-1"
          >
            <div className="flex items-center gap-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">{activity.user.split(' ')[0]}</span>
              <span className="text-slate-400">{activity.action}</span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 line-clamp-1">{activity.target}</div>
            <div className="text-slate-300 dark:text-slate-500">{activity.time}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// AI Toast component
function AIToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="absolute -left-8 top-16 bg-white dark:bg-slate-800 p-3 rounded-xl border-2 border-transparent shadow-xl z-30"
          style={{
            backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #8b5cf6, #3b82f6)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <SparklesIcon className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-white">AI Suggestion</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Decompose "Dashboard redesign" into smaller tasks?
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Main component
export function HeroPreviewSection() {
  const [selectedTask, setSelectedTask] = useState<MockTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<typeof mockNotifications[0] | null>(null);
  const [showAIToast, setShowAIToast] = useState(false);
  const [cursorPhase, setCursorPhase] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const tasksByColumn = columns.reduce((acc, col) => {
    acc[col.id] = mockTasks.filter(t => t.status === col.id);
    return acc;
  }, {} as Record<string, MockTask[]>);

  // Cursor animation phases
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorPhase(prev => (prev + 1) % 6);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Position cursor based on phase
  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const positions = [
      { x: rect.width * 0.3, y: rect.height * 0.4 },  // Hover task
      { x: rect.width * 0.5, y: rect.height * 0.5 },  // Click task
      { x: rect.width * 0.7, y: rect.height * 0.6 },  // Type comment
      { x: rect.width * 0.5, y: rect.height * 0.85 }, // Click AI button
      { x: rect.width * 0.4, y: rect.height * 0.4 },  // Close modal
      { x: rect.width * 0.8, y: rect.height * 0.3 },  // Drag task
    ];

    setCursorPos(positions[cursorPhase]);
  }, [cursorPhase]);

  // Notification cycle
  useEffect(() => {
    const showNotification = () => {
      const notif = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
      setCurrentNotification(notif);
      setTimeout(() => setCurrentNotification(null), 3000);
    };

    showNotification();
    const interval = setInterval(showNotification, 5000);
    return () => clearInterval(interval);
  }, []);

  // AI toast cycle
  useEffect(() => {
    const showAI = () => setShowAIToast(true);
    const hideAI = () => setShowAIToast(false);

    const timeout = setTimeout(showAI, 8000);
    const hideTimeout = setTimeout(hideAI, 12000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  // Modal open/close based on cursor phase
  useEffect(() => {
    if (cursorPhase === 1) {
      const task = mockTasks.find(t => t.status === 'IN_PROGRESS');
      if (task) {
        setSelectedTask(task);
        setTimeout(() => setIsModalOpen(true), 300);
      }
    } else if (cursorPhase === 4) {
      setIsModalOpen(false);
    }
  }, [cursorPhase]);

  const getColumnCount = (status: string) => tasksByColumn[status]?.length || 0;

  return (
    <section className="relative bg-white dark:bg-slate-950 overflow-hidden py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div
          ref={containerRef}
          className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]/80" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]/80" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]/80" />
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Search bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-400 flex-1 max-w-[200px]">
              <MagnifyingGlassIcon className="w-4 h-4" />
              Search tasks...
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-xs text-slate-500">
                <FunnelIcon className="w-3 h-3" />
                Filter
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-7 px-3 rounded-md bg-purple-500 text-white text-xs flex items-center font-medium cursor-pointer"
              >
                <PlusIcon className="w-3 h-3 mr-1" />
                New Task
              </motion.div>
            </div>
          </div>

          {/* Content */}
          <div className="flex">
            <Sidebar />

            {/* Board */}
            <div className="flex-1 p-4 overflow-x-auto">
              <div className="flex gap-3 min-w-max">
                {columns.map((column, colIndex) => (
                  <div key={column.id} className="w-[180px] flex-shrink-0">
                    {/* Column header */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: colIndex * 0.1 }}
                      className="flex items-center justify-between mb-3 px-1"
                    >
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {column.title}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        column.id === 'DONE' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
                        column.id === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' :
                        'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {getColumnCount(column.id)}
                      </span>
                    </motion.div>

                    {/* Tasks */}
                    <div className="space-y-2">
                      {tasksByColumn[column.id]?.map((task, taskIndex) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + colIndex * 0.1 + taskIndex * 0.05 }}
                        >
                          <HeroTaskCard
                            task={task}
                            onClick={() => {
                              setSelectedTask(task);
                              setIsModalOpen(true);
                            }}
                            isModalOpen={isModalOpen && selectedTask?.id === task.id}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <RightPanel />
          </div>

          {/* Floating elements */}
          <AIToast show={showAIToast} />
          <NotificationToast notification={currentNotification} />
        </div>
      </div>

      {/* Custom cursor */}
      <CustomCursor x={cursorPos.x} y={cursorPos.y} isVisible={true} />

      {/* Detail modal */}
      <HeroDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/hero-preview.tsx
git commit -m "feat: replace hero preview with enhanced interactive version

- Add 5-column Kanban board layout
- Add sidebar with workspaces and team presence
- Add stats and activity panel
- Add scenario-based cursor animations
- Add notification toast system
- Add detail modal with AI decompose button

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Test and Verify Implementation

**Files:**
- Test: Open browser and verify at `/`

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify visual checkpoints**
- [ ] 5 columns visible with tasks (15-20 total)
- [ ] Left sidebar shows workspaces + team members with presence dots
- [ ] Right panel shows stats + activity feed
- [ ] Floating notifications appear
- [ ] Cursor moves through animation phases
- [ ] Clicking task opens modal
- [ ] Dark mode renders correctly

- [ ] **Step 3: Fix any issues found**

- [ ] **Step 4: Commit any fixes**

```bash
git add components/landing/
git commit -m "fix: hero preview styling and animation fixes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Summary

This implementation plan creates an enhanced hero preview with:
- ✅ 5x more content (5 columns, 20+ tasks, sidebar, stats panel)
- ✅ Rich cursor interactivity (ambient hover + scenario-based animations)
- ✅ Latest dashboard features (AI decompose, real-time presence, filtering)
- ✅ Notification toast system
- ✅ Detail modal with comments and assignees
- ✅ Dark mode support

**Total Tasks:** 6 major tasks with multiple steps
**Estimated Time:** 30-45 minutes
