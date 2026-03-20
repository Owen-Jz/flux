# Subtask Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `createdBy` tracking to subtasks, display creator/date in a collapsible "Subtask Details" section, and show task creation date in the modal header.

**Architecture:** Subtask creator is stored as a User ObjectId reference in the subtask subdocument. On subtask creation (via `createTask` or `updateTask`), the session user's ID is stamped as `createdBy`. The `getTasks` action populates `createdBy` with user info. The UI renders this in a collapsible section below the subtask list.

**Tech Stack:** Next.js, Mongoose, TypeScript, Framer Motion, Heroicons

---

## File Map

| File | Responsibility |
|------|----------------|
| `models/Task.ts` | Add `createdBy` to subtask subdocument schema |
| `actions/task.ts` | Set and populate `createdBy` in `createTask`, `updateTask`, `getTasks` |
| `components/board/task-card.tsx` | Update `TaskData` interface with `createdBy` |
| `components/board/task-detail-modal.tsx` | Add creation date to header + collapsible Subtask Details section |

---

## Task 1: Update Task Model

**Files:**
- Modify: `models/Task.ts:15-16` (ITask interface)
- Modify: `models/Task.ts:47-54` (subtasks schema)

- [ ] **Step 1: Add `createdBy` to `ITask` interface (line 16)**

Update the TypeScript interface `ITask` at line 15-16 to include `createdBy` in the subtasks type:

```typescript
subtasks: { _id: Types.ObjectId; title: string; completed: boolean; createdAt: Date; createdBy?: Types.ObjectId }[];
```

- [ ] **Step 2: Add `createdBy` to subtask subdocument schema**

Locate the `subtasks` array definition in `TaskSchema` (around line 47-54). Add `createdBy` field:

```typescript
subtasks: [
    {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, // ADD THIS
    },
],
```

- [ ] **Step 3: Commit**

```bash
git add models/Task.ts
git commit -m "feat(tasks): add createdBy to subtask schema"
```

---

## Task 2: Update API Actions

**Files:**
- Modify: `actions/task.ts:28` (CreateTaskData interface)
- Modify: `actions/task.ts:67-78` (createTask subtasks)
- Modify: `actions/task.ts:409-416` (updateTask subtasks)
- Modify: `actions/task.ts:170-175` (getTasks subtasks return)

- [ ] **Step 1: Update `CreateTaskData` interface (line 28)**

Update the `CreateTaskData.subtasks` type to include `createdBy` so `updateTask` can preserve the field:

```typescript
subtasks?: { id?: string; title: string; completed: boolean; createdBy?: string }[];
```

- [ ] **Step 2: Update `createTask` — set `createdBy` on initial subtasks**

In `createTask`, find where subtasks are set on the new task (around line 77):

```typescript
subtasks: data.subtasks?.map((s) => ({
    title: s.title,
    completed: s.completed || false,
    createdAt: new Date(),
    createdBy: new Types.ObjectId(session.user.id), // ADD THIS
})),
```

- [ ] **Step 3: Update `getTasks` — populate `createdBy` user info**

Find the subtasks mapping in `getTasks` (around line 170):

```typescript
subtasks: (task.subtasks || []).map((s: any) => ({
    id: s._id.toString(),
    title: s.title,
    completed: s.completed,
    createdAt: s.createdAt ? s.createdAt.toISOString() : undefined,
    // ADD: populate createdBy
    createdBy: s.createdBy ? {
        id: s.createdBy._id?.toString() || s.createdBy.toString(),
        name: s.createdBy.name || '',
        email: s.createdBy.email || '',
        image: s.createdBy.image,
    } : undefined,
})),
```

Also update the Mongoose `populate` call (around line 148-152) to include `subtasks.createdBy`:

```typescript
const tasks = await Task.find({ boardId: board._id })
    .populate('assignees', 'name email image')
    .populate('comments.userId', 'name email image')
    // ADD: populate subtask creators
    .populate('subtasks.createdBy', 'name email image')
    .sort({ order: 1 })
    .lean();
```

- [ ] **Step 4: Update `updateTask` — set `createdBy` on new subtasks**

Find the subtasks mapping in `updateTask` (around line 409-416). Add `createdBy` so new subtasks are stamped with the current user, and existing subtasks preserve theirs:

```typescript
task.subtasks = data.subtasks.map((s) => ({
    _id: (s.id && Types.ObjectId.isValid(s.id)) ? new Types.ObjectId(s.id) : new Types.ObjectId(),
    title: s.title,
    completed: s.completed,
    createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
    // ADD: preserve createdBy if editing existing subtask, otherwise set to current user
    createdBy: s.createdBy
        ? (typeof s.createdBy === 'string' ? new Types.ObjectId(s.createdBy) : s.createdBy)
        : new Types.ObjectId(session.user.id),
}));
```

- [ ] **Step 5: Commit**

```bash
git add actions/task.ts
git commit -m "feat(tasks): track createdBy on subtasks in createTask, updateTask, getTasks"
```

---

## Task 3: Update TaskData Interface

**Files:**
- Modify: `components/board/task-card.tsx:27-32`

- [ ] **Step 1: Add `createdBy` to `TaskData.subtasks` interface**

```typescript
subtasks?: {
    id: string;
    title: string;
    completed: boolean;
    createdAt?: string;
    createdBy?: Member; // ADD THIS
}[];
```

- [ ] **Step 2: Commit**

```bash
git add components/board/task-card.tsx
git commit -m "feat(types): add createdBy to TaskData subtasks interface"
```

---

## Task 4: Update Task Detail Modal UI

**Files:**
- Modify: `components/board/task-detail-modal.tsx`
  - Add `InformationCircleIcon`, `ChevronDownIcon` imports (line 5)
  - Add `useState` for `showSubtaskDetails` (line ~37)
  - Add creation date to header (line ~336)
  - Add collapsible Subtask Details section (after subtask list, ~line 477)

- [ ] **Step 1: Add icon imports**

Add `InformationCircleIcon` and `ChevronDownIcon` to the existing heroicons import on line 5:

```typescript
import { XMarkIcon, CalendarIcon, CheckIcon, UserPlusIcon, Bars3BottomLeftIcon, TagIcon, ClockIcon, Squares2X2Icon, PlusIcon, TrashIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, ArrowPathIcon, ExclamationCircleIcon, HeartIcon, ArrowUturnLeftIcon, FaceSmileIcon, LinkIcon, InformationCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
```

- [ ] **Step 2: Add `showSubtaskDetails` state**

Add after the existing `useState` declarations (around line 54):

```typescript
const [showSubtaskDetails, setShowSubtaskDetails] = useState(false);
```

- [ ] **Step 3: Add task creation date to header**

Find the header area where the status badge is rendered (around line 337). Add the creation date next to the status badge:

```tsx
<span className="px-2.5 py-1 rounded-md bg-[var(--background-subtle)] text-[var(--text-secondary)] font-bold text-[10px] tracking-wider uppercase border border-[var(--border-subtle)]">
    {task.status.replace('_', ' ')}
</span>
<span className="text-[11px] text-[var(--text-tertiary)]">
    Created {new Date(task.createdAt).toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
    })}
</span>
```

- [ ] **Step 4: Add collapsible Subtask Details section**

After the subtask list closing `</div>` (around line 477, after the `{!isReadOnly && (...)}` block for adding subtasks), add:

```tsx
{(task.subtasks || []).length > 0 && (
    <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
        <button
            onClick={() => setShowSubtaskDetails(!showSubtaskDetails)}
            className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
            <InformationCircleIcon className="w-4 h-4" />
            Subtask Details
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showSubtaskDetails ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
            {showSubtaskDetails && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="mt-3 space-y-2">
                        {(task.subtasks || []).map((subtask) => (
                            <div key={subtask.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--background-subtle)] border border-[var(--border-subtle)]">
                                <div className="w-6 h-6 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                                    {subtask.createdBy?.image ? (
                                        <img src={subtask.createdBy.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        <span className="text-[9px] font-bold text-[var(--brand-primary)]">
                                            {subtask.createdBy?.name?.charAt(0) || '?'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{subtask.title}</p>
                                    <p className="text-[11px] text-[var(--text-tertiary)]">
                                        {subtask.createdBy?.name || 'Unknown'} · {subtask.createdAt ? new Date(subtask.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Unknown date'}
                                    </p>
                                </div>
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${subtask.completed ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-[var(--background-subtle)] border border-[var(--border-default)]'}`}>
                                    {subtask.completed && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
)}
```

- [ ] **Step 5: Commit**

```bash
git add components/board/task-detail-modal.tsx
git commit -m "feat(tasks): display task creation date in header and add collapsible Subtask Details section"
```

---

## Verification

After all tasks:
1. Start dev server: `npm run dev`
2. Open any task in the detail modal — verify:
   - Task creation date appears next to the status badge in the header
   - Subtask list has a "Subtask Details" toggle below it
   - Clicking "Subtask Details" shows creator avatar, name, and date for each subtask
3. Create a new subtask — verify the Subtask Details section shows your name as creator
