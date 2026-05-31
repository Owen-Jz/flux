'use server';

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
import { User } from '@/models/User';
import { canCreateProject, getUpgradeMessage } from '@/lib/plan-limits';

async function insertTasksForBoard(
    workspaceId: Types.ObjectId,
    boardId: Types.ObjectId,
    tasks: TaskPlanItem[]
): Promise<void> {
    const docs = tasks.map((t, index) => ({
        workspaceId,
        boardId,
        title: t.title,
        description: t.description,
        status: 'BACKLOG' as const,
        priority: t.priority,
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
            await insertTasksForBoard(workspace._id as Types.ObjectId, boardDoc._id as Types.ObjectId, plan.tasks);
            tasksCreated = plan.tasks.length;
            revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
        } else {
            // Project mode: create each board, then insert its tasks
            const userDoc = await User.findById(session.user.id).select('plan');
            const userPlan = (userDoc?.plan || 'free') as 'free' | 'starter' | 'pro' | 'enterprise';
            const currentBoardCount = await Board.countDocuments({ workspaceId: workspace._id });
            if (!canCreateProject(userPlan, currentBoardCount + plan.boards.length - 1)) {
                return {
                    success: false,
                    boardsCreated: 0,
                    tasksCreated: 0,
                    error: getUpgradeMessage(userPlan, 'projects'),
                };
            }
            for (const boardPlan of plan.boards) {
                // createBoard handles plan-limit check, slug gen, webhook
                const newBoard = await createBoard(workspaceSlug, {
                    name: boardPlan.name,
                    description: boardPlan.description,
                });
                boardsCreated++;

                if (boardPlan.tasks && boardPlan.tasks.length > 0) {
                    const newBoardObjectId = new Types.ObjectId(newBoard.id);
                    await insertTasksForBoard(
                        workspace._id as Types.ObjectId,
                        newBoardObjectId,
                        boardPlan.tasks
                    );
                    tasksCreated += boardPlan.tasks.length;
                }
            }
            revalidatePath(`/${workspaceSlug}`);
        }

        return { success: true, boardsCreated, tasksCreated };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Creation failed';
        return { success: false, boardsCreated, tasksCreated, error: msg };
    }
}
