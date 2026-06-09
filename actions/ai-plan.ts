'use server';

import { after } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { Board } from '@/models/Board';
import { Workspace } from '@/models/Workspace';
import { revalidatePath } from 'next/cache';
import { Types } from 'mongoose';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';
import { createBoard } from '@/actions/board';
import type { ConfirmedPlan, TaskPlanItem } from '@/types/ai-plan';
import { canCreateProject, getUpgradeMessage, getTaskLimit } from '@/lib/plan-limits';
import { resolveWorkspacePlan } from '@/lib/workspace-plan';
import { normalizeEstimatedHours } from '@/lib/llm/board-stream-planner';
import { trackEvent } from '@/lib/track';

// This server action is a public entry point: the browser calls it directly
// with a `plan` payload, so the LLM-output validation done in the API route is
// NOT a trust boundary here. Treat every field as untrusted and bound it before
// it reaches the DB (the Task schema has no maxlength / array caps of its own).
const MAX_BOARDS = 20;
const MAX_TASKS_PER_BOARD = 200;
const MAX_TITLE_LEN = 200;
const MAX_DESCRIPTION_LEN = 2000;
const VALID_PRIORITIES: ReadonlyArray<TaskPlanItem['priority']> = ['LOW', 'MEDIUM', 'HIGH'];

function clampString(value: unknown, max: number): string {
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function sanitizeTaskPlanItems(tasks: unknown): TaskPlanItem[] {
    if (!Array.isArray(tasks)) return [];
    return tasks
        .slice(0, MAX_TASKS_PER_BOARD)
        .map((t): TaskPlanItem => {
            const item = (t ?? {}) as Partial<TaskPlanItem>;
            const priority = VALID_PRIORITIES.includes(item.priority as TaskPlanItem['priority'])
                ? (item.priority as TaskPlanItem['priority'])
                : 'MEDIUM';
            return {
                title: clampString(item.title, MAX_TITLE_LEN),
                description: clampString(item.description, MAX_DESCRIPTION_LEN),
                priority,
                estimatedHours: normalizeEstimatedHours(item.estimatedHours),
            };
        })
        .filter((t) => t.title.length > 0);
}

async function insertTasksForBoard(
    workspaceId: Types.ObjectId,
    boardId: Types.ObjectId,
    creatorId: Types.ObjectId,
    tasks: TaskPlanItem[]
): Promise<void> {
    const docs = tasks.map((t, index) => ({
        workspaceId,
        boardId,
        title: t.title,
        description: t.description,
        status: 'BACKLOG' as const,
        priority: t.priority,
        estimatedHours: t.estimatedHours,
        assignees: [creatorId],
        order: index,
    }));
    await Task.insertMany(docs);
}

export async function createFromAIPlan(
    workspaceSlug: string,
    boardSlug: string,       // current board slug (used for board-mode and for revalidation)
    boardId: string,         // current board MongoDB id (used for board-mode task insertion)
    plan: ConfirmedPlan
): Promise<{ success: boolean; boardsCreated: number; tasksCreated: number; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, boardsCreated: 0, tasksCreated: 0, error: 'Unauthorized' };
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return { success: false, boardsCreated: 0, tasksCreated: 0, error: 'Workspace not found' };
    }

    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        return { success: false, boardsCreated: 0, tasksCreated: 0, error: 'Permission denied' };
    }

    let boardsCreated = 0;
    let tasksCreated = 0;

    try {
        // Per-workspace active-task BUDGET, governed by the OWNER's plan. Applies to
        // both board-mode and project-mode so a bulk insert can never push the
        // workspace past its active-task ceiling. `Infinity` means unlimited.
        const ownerPlan = await resolveWorkspacePlan(workspace.ownerId);
        const taskLimit = getTaskLimit(ownerPlan); // number | 'unlimited'
        let taskBudget: number = taskLimit === 'unlimited'
            ? Infinity
            : Math.max(0, taskLimit - await Task.countDocuments({ workspaceId: workspace._id, status: { $ne: 'ARCHIVED' } }));
        if (taskBudget <= 0) {
            return { success: false, boardsCreated: 0, tasksCreated: 0, error: getUpgradeMessage(ownerPlan, 'tasks') };
        }

        if (plan.type === 'board') {
            if (!Types.ObjectId.isValid(boardId)) {
                return { success: false, boardsCreated: 0, tasksCreated: 0, error: 'Invalid board ID' };
            }
            const boardDoc = await Board.findOne({
                _id: boardId,
                workspaceId: workspace._id,
            }).select('_id');
            if (!boardDoc) {
                return { success: false, boardsCreated: 0, tasksCreated: 0, error: 'Board not found' };
            }
            const tasks = sanitizeTaskPlanItems(plan.tasks);
            if (tasks.length === 0) {
                return { success: false, boardsCreated: 0, tasksCreated: 0, error: 'Plan contained no valid tasks' };
            }
            // Cap to the workspace's remaining active-task budget. slice(0, Infinity)
            // returns the whole array, so unlimited plans insert everything.
            const capped = tasks.slice(0, taskBudget);
            await insertTasksForBoard(
                workspace._id as Types.ObjectId,
                boardDoc._id as Types.ObjectId,
                new Types.ObjectId(session.user.id),
                capped
            );
            tasksCreated = capped.length;
            revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
        } else {
            // Project mode: create each board, then insert its tasks
            const boards = (Array.isArray(plan.boards) ? plan.boards : []).slice(0, MAX_BOARDS);
            if (boards.length === 0) {
                return { success: false, boardsCreated: 0, tasksCreated: 0, error: 'Plan contained no valid boards' };
            }
            // Board limit is governed by the workspace owner's plan (same source as
            // createBoard), so this pre-check never disagrees with the real enforcement.
            const currentBoardCount = await Board.countDocuments({ workspaceId: workspace._id });
            if (!canCreateProject(ownerPlan, currentBoardCount + boards.length)) {
                return {
                    success: false,
                    boardsCreated: 0,
                    tasksCreated: 0,
                    error: getUpgradeMessage(ownerPlan, 'projects'),
                };
            }
            for (const boardPlan of boards) {
                const boardName = clampString(boardPlan.name, MAX_TITLE_LEN);
                if (!boardName) continue;
                // createBoard handles plan-limit check, slug gen, webhook
                const newBoard = await createBoard(workspaceSlug, {
                    name: boardName,
                    description: clampString(boardPlan.description, MAX_DESCRIPTION_LEN),
                });
                boardsCreated++;

                const boardTasks = sanitizeTaskPlanItems(boardPlan.tasks);
                // Take only what the remaining active-task budget allows. Boards are
                // still created up to the board limit even once the budget is spent.
                const capped = boardTasks.slice(0, taskBudget);
                if (capped.length > 0) {
                    const newBoardObjectId = new Types.ObjectId(newBoard.id);
                    await insertTasksForBoard(
                        workspace._id as Types.ObjectId,
                        newBoardObjectId,
                        new Types.ObjectId(session.user.id),
                        capped
                    );
                    taskBudget -= capped.length;
                    tasksCreated += capped.length;
                }
            }
            revalidatePath(`/${workspaceSlug}`);
        }

        // First-party funnel: AI plan committed (the "used AI" signal).
        after(() =>
            trackEvent({
                event: 'ai_plan_used',
                userId: session.user.id,
                workspaceId: workspace._id.toString(),
                metadata: { type: plan.type, boardsCreated, tasksCreated },
            })
        );

        return { success: true, boardsCreated, tasksCreated };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Creation failed';
        return { success: false, boardsCreated, tasksCreated, error: msg };
    }
}

export async function undoAIPlan(
    workspaceSlug: string,
    boardSlug: string,
    taskIds: string[]
): Promise<{ success: boolean; deleted: number; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, deleted: 0, error: 'Unauthorized' };
    }

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return { success: true, deleted: 0 };
    }
    const validIds = taskIds.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
        return { success: true, deleted: 0 };
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return { success: false, deleted: 0, error: 'Workspace not found' };
    }

    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        return { success: false, deleted: 0, error: 'Permission denied' };
    }

    const boardDoc = await Board.findOne({ slug: boardSlug, workspaceId: workspace._id }).select('_id');
    if (!boardDoc) {
        return { success: false, deleted: 0, error: 'Board not found' };
    }

    try {
        const result = await Task.deleteMany({
            _id: { $in: validIds.map(id => new Types.ObjectId(id)) },
            boardId: boardDoc._id,
            workspaceId: workspace._id,
        });
        revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
        return { success: true, deleted: result.deletedCount ?? 0 };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Undo failed';
        return { success: false, deleted: 0, error: msg };
    }
}
