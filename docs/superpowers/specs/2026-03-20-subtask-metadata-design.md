# Subtask Metadata & Task Creation Date Display

## Status
- **Approved**: 2026-03-20
- **Status**: Implemented

## Overview
Add creator and timestamp tracking to subtasks, displayed via a collapsible "Subtask Details" section. Also display the task creation date in the task detail modal header.

---

## Changes

### 1. Model: `models/Task.ts`
**Subtask schema change**

```diff
subtasks: {
    _id: Types.ObjectId;
    title: string;
    completed: boolean;
+   createdAt: Date;        // already exists
+   createdBy: Types.ObjectId; // NEW - tracks creator
}
```

**Mongoose subtask subdocument** (within `TaskSchema`):
```typescript
subtasks: [
    {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, // NEW
    },
],
```

---

### 2. API: `actions/task.ts`

**`getTasks`** — already returns `createdAt` for subtasks; add `createdBy` populated:
```typescript
subtasks: (task.subtasks || []).map((s: any) => ({
    id: s._id.toString(),
    title: s.title,
    completed: s.completed,
    createdAt: s.createdAt ? s.createdAt.toISOString() : undefined,
    createdBy: s.createdBy ? {
        id: s.createdBy._id?.toString() || s.createdBy.toString(),
        name: s.createdBy.name || '',
        email: s.createdBy.email || '',
        image: s.createdBy.image,
    } : undefined,
})),
```

**`updateTask`** — when adding new subtasks, set `createdBy` from session user:
```typescript
if (data.subtasks !== undefined) {
    task.subtasks = data.subtasks.map((s) => ({
        _id: (s.id && Types.ObjectId.isValid(s.id)) ? new Types.ObjectId(s.id) : new Types.ObjectId(),
        title: s.title,
        completed: s.completed,
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        // NEW: preserve createdBy if editing existing subtask, otherwise set to current user
        createdBy: s.createdBy
            ? (typeof s.createdBy === 'string' ? new Types.ObjectId(s.createdBy) : s.createdBy)
            : new Types.ObjectId(session.user.id),
    }));
}
```

**`createTask`** — when creating tasks with initial subtasks, set `createdBy`:
```typescript
subtasks: data.subtasks?.map((s) => ({
    title: s.title,
    completed: s.completed || false,
    createdAt: new Date(),
    createdBy: new Types.ObjectId(session.user.id),
})),
```

---

### 3. Type: `components/board/task-card.tsx`

**`TaskData` interface update**:
```typescript
subtasks?: {
    id: string;
    title: string;
    completed: boolean;
    createdAt?: string;
    createdBy?: Member; // NEW
}[];
```

---

### 4. UI: `components/board/task-detail-modal.tsx`

#### 4a. Task Creation Date in Header
Add creation date display next to the status badge in the modal header:
```tsx
<div className="flex items-center gap-3 mb-2">
    <span className="px-2.5 py-1 rounded-md bg-[var(--background-subtle)] text-[var(--text-secondary)] font-bold text-[10px] tracking-wider uppercase border border-[var(--border-subtle)]">
        {task.status.replace('_', ' ')}
    </span>
    <span className="text-[11px] text-[var(--text-tertiary)]">
        Created {new Date(task.createdAt).toLocaleString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit',
        })}
    </span>
</div>
```

#### 4b. Collapsible "Subtask Details" Section
Add below the subtask list (after line ~477). Uses `useState` for expanded/collapsed:

```tsx
// State (add to existing state declarations):
const [showSubtaskDetails, setShowSubtaskDetails] = useState(false);

// Section (add after the subtask list div):
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

Import `InformationCircleIcon` and `ChevronDownIcon` from `@heroicons/react/24/outline`.

---

## Files to Modify
1. `models/Task.ts` — add `createdBy` to subtask subdocument schema
2. `actions/task.ts` — populate and set `createdBy` in `getTasks`, `updateTask`, `createTask`
3. `components/board/task-card.tsx` — update `TaskData` interface
4. `components/board/task-detail-modal.tsx` — add creation date to header + collapsible Subtask Details section
