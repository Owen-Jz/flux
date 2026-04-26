# Task Card Optimistic UI & Links Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two bugs: (1) links added via the edit modal never persist to the backend, and (2) task field updates from the modal use broken optimistic UI that doesn't properly rollback or pass all fields.

**Architecture:** Fix `handleUpdateTask` in `board.tsx` to pass all fields (including `links` and `dueDate`) to the `updateTask` server action, and fix the optimistic state rollback so errors don't leave the UI in a bad state.

**Tech Stack:** Next.js App Router, React `useOptimistic`, React `useTransition`, Mongoose backend

---

## Task 1: Fix Links Not Persisting

**Files:**
- Modify: `components/board/board.tsx:430-463` (handleUpdateTask function)

- [ ] **Step 1: Add `links` and `dueDate` to the updateTask server call**

Find this block in `handleUpdateTask`:
```typescript
await updateTask(taskId, {
    title: data.title,
    description: data.description,
    priority: data.priority,
    assignees: data.assignees?.map((a) => a.id),
    subtasks: data.subtasks?.map(s => ({
        id: s.id,
        title: s.title,
        completed: s.completed
    })),
    categoryId: data.categoryId,
    status: data.status as TaskStatus,
});
```

Replace with:
```typescript
await updateTask(taskId, {
    title: data.title,
    description: data.description,
    priority: data.priority,
    assignees: data.assignees?.map((a) => a.id),
    subtasks: data.subtasks?.map(s => ({
        id: s.id,
        title: s.title,
        completed: s.completed
    })),
    categoryId: data.categoryId,
    status: data.status as TaskStatus,
    dueDate: data.dueDate,
    links: data.links,
});
```

- [ ] **Step 2: Commit**

```bash
git add components/board/board.tsx
git commit -m "fix: pass links and dueDate to updateTask server action"
```

---

## Task 2: Fix Optimistic UI Rollback

**Files:**
- Modify: `components/board/board.tsx:430-463` (handleUpdateTask function)

- [ ] **Step 1: Fix the optimistic state management**

The current implementation updates both `dispatchOptimistic` AND `setTasks` in the same `startTransition`, then reverts `setTasks` on error but doesn't revert `dispatchOptimistic`. This causes the UI to get stuck in an optimistic state after an error.

Replace the current `startTransition` block in `handleUpdateTask`:
```typescript
startTransition(async () => {
    dispatchOptimistic({ type: 'UPDATE', task: updatedTask });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    try {
        await updateTask(taskId, {
            title: data.title,
            description: data.description,
            priority: data.priority,
            assignees: data.assignees?.map((a) => a.id),
            subtasks: data.subtasks?.map(s => ({
                id: s.id,
                title: s.title,
                completed: s.completed
            })),
            categoryId: data.categoryId,
            status: data.status as TaskStatus,
            dueDate: data.dueDate,
            links: data.links,
        });
    } catch (error) {
        console.error('Failed to update task:', error);
        setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
    }
});
```

With this fixed version:
```typescript
startTransition(async () => {
    // Optimistic update
    const optimisticTask = { ...task, ...data };
    dispatchOptimistic({ type: 'UPDATE', task: optimisticTask });

    try {
        await updateTask(taskId, {
            title: data.title,
            description: data.description,
            priority: data.priority,
            assignees: data.assignees?.map((a) => a.id),
            subtasks: data.subtasks?.map(s => ({
                id: s.id,
                title: s.title,
                completed: s.completed
            })),
            categoryId: data.categoryId,
            status: data.status as TaskStatus,
            dueDate: data.dueDate,
            links: data.links,
        });
        // On success, sync with server state via setTasks
        setTasks((prev) => prev.map((t) => (t.id === taskId ? optimisticTask : t)));
    } catch (error) {
        console.error('Failed to update task:', error);
        // Revert optimistic update by dispatching original task
        dispatchOptimistic({ type: 'UPDATE', task });
        setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
    }
});
```

**Key changes:**
1. Store original `task` before computing `updatedTask` so we have it for rollback
2. Only `dispatchOptimistic` happens before the await — the `setTasks` sync only happens on success or is used for rollback on failure
3. On error, BOTH `dispatchOptimistic` AND `setTasks` revert to original `task`

- [ ] **Step 2: Verify the rollback behavior by testing manually**

To test the rollback:
1. Open a task in the edit modal
2. Change a field (e.g., title) and save
3. Immediately change it again before the server responds
4. Then make the server throw an error (can temporarily add `throw new Error('test')` before the save)
5. Verify the UI reverts to the pre-error state, not the in-flight optimistic state

Run: `npm run dev` and test manually — no automated test needed for this UI behavior.

- [ ] **Step 3: Commit**

```bash
git add components/board/board.tsx
git commit -m "fix: proper optimistic UI rollback in handleUpdateTask"
```