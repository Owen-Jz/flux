'use server';

import { after } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, TaskStatus, TaskPriority } from '@/models/Task';
import { User } from '@/models/User';
import { Types } from 'mongoose';
import { Workspace } from '@/models/Workspace';
import { Board } from '@/models/Board';
import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { sendEmail } from '@/lib/email/resend';
import { TaskCreatedEmail } from '@/components/emails/task-created';
import { TaskAssignedEmail } from '@/components/emails/task-assigned';
import { TaskMovedEmail } from '@/components/emails/task-moved';
import { NewCommentEmail } from '@/components/emails/new-comment';
import { SubtaskAddedEmail } from '@/components/emails/subtask-added';
import { render } from '@react-email/components';
import React from 'react';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';
import { canAccessBoard, canGuestAccessBoard, boardVisibilityFilter } from '@/lib/board-access';
import { TASK_ORDER_INCREMENT } from '@/lib/constants';
import { triggerNotification } from '@/lib/pwa/trigger-notification';
import { emitEvent } from '@/lib/webhook-emitter';
import { renderMentionsToPlainText, extractUserChipIds } from '@/lib/mentions';
import { resolveWorkspacePlan } from '@/lib/workspace-plan';
import { canCreateTask, getUpgradeMessage } from '@/lib/plan-limits';
import { trackEvent } from '@/lib/track';

interface CreateTaskData {
    title: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    categoryId?: string;
    assignees?: string[];
    subtasks?: { id?: string; title: string; completed: boolean; createdBy?: string }[];
}

export async function createTask(workspaceSlug: string, boardSlug: string, data: CreateTaskData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check role - only ADMIN and EDITOR can create tasks
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        throw new Error('You do not have permission to create tasks');
    }

    // Validate title — reject blank/whitespace-only
    if (!data.title || !data.title.trim()) {
        throw new Error('Task title cannot be empty');
    }
    data.title = data.title.trim();

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        throw new Error('Board not found');
    }

    // Enforce the workspace's active-task cap (governed by the OWNER's plan).
    const plan = await resolveWorkspacePlan(workspace.ownerId);
    const activeTaskCount = await Task.countDocuments({ workspaceId: workspace._id, status: { $ne: 'ARCHIVED' } });
    if (!canCreateTask(plan, activeTaskCount)) {
        throw new Error(getUpgradeMessage(plan, 'tasks'));
    }

    // Get the highest order in this status column for this board
    const highestOrder = await Task.findOne({
        boardId: board._id,
        status: data.status || 'BACKLOG',
    })
        .sort({ order: -1 })
        .select('order');

    const newOrder = (highestOrder?.order ?? 0) + TASK_ORDER_INCREMENT;

    const task = await Task.create({
        workspaceId: workspace._id,
        boardId: board._id,
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'BACKLOG',
        categoryId: data.categoryId ? new Types.ObjectId(data.categoryId) : undefined,
        order: newOrder,
        assignees: data.assignees && data.assignees.length > 0 ? data.assignees : [session.user.id],
        subtasks: data.subtasks?.map((s) => ({
            title: s.title,
            completed: s.completed || false,
            createdAt: new Date(),
            createdBy: new Types.ObjectId(session.user.id),
        })),
    });

    // First-party funnel: manual task creation (AI-inserted tasks bypass this
    // path, so this isolates genuine hands-on engagement from bulk AI output).
    after(() =>
        trackEvent({
            event: 'task_created',
            userId: session.user.id,
            workspaceId: workspace._id.toString(),
            metadata: { priority: task.priority },
        })
    );

    // Log activity
    await logActivity({
        workspaceSlug,
        boardSlug,
        taskId: task._id.toString(),
        type: 'TASK_CREATED',
        title: 'Task Created',
        description: `Created task "${data.title}"`,
        metadata: {
            taskTitle: data.title,
        },
    });

    // EMAIL NOTIFICATION: Task Created — only the task's assignees and workspace
    // admins are notified, never the whole board.
    const assigneeIds = (data.assignees && data.assignees.length > 0 ? data.assignees : [session.user.id]);
    const notifyIds = taskNotifyTargets(assigneeIds, workspace.members, session.user.id);

    if (notifyIds.length > 0) {
        const users = await User.find({ _id: { $in: notifyIds } });
        await Promise.all(users.map(async (user) => {
            // Respect each recipient's task-updates preference (defaults to on).
            if (user.email && user.notificationPreferences?.taskUpdates !== false) {
                const html = await render(
                    React.createElement(TaskCreatedEmail, {
                        taskTitle: data.title,
                        creatorName: session.user.name || 'A teammate',
                        workspaceName: workspace.name,
                        taskUrl: `${process.env.NEXTAUTH_URL}/${workspace.slug}/board/${boardSlug}`,
                    })
                );
                await sendEmail({
                    to: user.email,
                    subject: `New Task in ${workspace.name}: ${data.title}`,
                    html,
                });
            }
        }));
    }

    // PUSH: notify assignees other than the creator.
    const pushTargets = assigneeIds.filter((id) => id !== session.user.id);
    if (pushTargets.length > 0) {
        const creatorName = session.user.name || 'A teammate';
        after(() => triggerNotification({
            title: 'Task assigned to you',
            body: `${creatorName} created "${data.title}" in ${workspace.name}`,
            url: `/${workspace.slug}/board/${boardSlug}`,
            userIds: pushTargets,
        }));
    }

    revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);

    // Emit webhook - fire and forget
    emitEvent(
        workspace.members.find((m: { userId: { toString: () => string } }) =>
            workspace.members[0]?.userId?.toString()
        )?.userId?.toString() || session.user.id,
        'task.created',
        workspace._id.toString(),
        { taskId: task._id.toString(), boardId: board._id.toString(), workspaceId: workspace._id.toString(), title: task.title, status: task.status, priority: task.priority }
    ).catch(console.error);

    return { id: task._id.toString() };
}

export async function getTasks(workspaceSlug: string, boardSlug: string) {
    const session = await auth();

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return [];
    }

    // Verify user is a member OR workspace allows public access
    const member = session?.user?.id ? isWorkspaceMember(workspace, session.user.id) : null;
    const hasPublicAccess = workspace.settings?.publicAccess === true;

    // Non-members can only access if workspace is publicly accessible
    if (!member && !hasPublicAccess) {
        return [];
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        return [];
    }

    // Enforce board-level visibility before returning any tasks.
    const allowed = member
        ? canAccessBoard(board, session?.user?.id, member)
        : canGuestAccessBoard(board);
    if (!allowed) {
        return [];
    }

    const tasks = await Task.find({ boardId: board._id })
        .populate('assignees', 'name email image')
        .populate('comments.userId', 'name email image')
        .populate('subtasks.createdBy', 'name email image')
        .sort({ order: 1 })
        .lean();

    return tasks.map((task) => ({
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        categoryId: task.categoryId?.toString(),
        order: task.order,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assignees: (task.assignees as any[]).map((a) => ({
            id: a._id?.toString() || a.toString(),
            name: a.name || '',
            email: a.email || '',
            image: a.image,
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        comments: (task.comments || []).map((c: any) => {
            const populatedUser = c.userId && typeof c.userId === 'object' && '_id' in c.userId ? c.userId : null;
            const userId = populatedUser?._id?.toString() ?? c.userId?.toString() ?? '';
            return {
                id: c._id.toString(),
                content: c.content,
                userId,
                parentId: c.parentId ? c.parentId.toString() : null,
                likes: (c.likes ?? []).map((id: Types.ObjectId) => id.toString()),
                reactions: (c.reactions ?? []).map((r: { emoji: string; userId?: Types.ObjectId }) => ({
                    emoji: r.emoji,
                    userId: r.userId?.toString(),
                })),
                createdAt: c.createdAt.toISOString(),
                user: {
                    id: populatedUser?._id?.toString() ?? userId,
                    name: populatedUser?.name || 'Unknown User',
                    email: populatedUser?.email ?? '',
                    image: populatedUser?.image,
                },
            };
        }),
        dueDate: task.dueDate?.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        links: (task.links || []).map((l: any) => ({
            id: l._id?.toString() || Math.random().toString(36).substr(2, 9),
            url: l.url,
            title: l.title || l.url,
        })),
        // Fall back to the timestamp embedded in the ObjectId when `createdAt`
        // is missing (e.g. docs inserted by a loose-schema seed script without
        // Mongoose timestamps). Prevents a crash on `.toISOString()` of undefined.
        createdAt: (task.createdAt ?? task._id.getTimestamp()).toISOString(),
    }));
}

export async function getArchivedTasks(workspaceSlug: string) {
    const session = await auth();

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return [];
    }

    // Members see their accessible boards' archive; guests get a read-only view
    // of a publicly-accessible workspace's non-RESTRICTED boards. Otherwise nothing.
    const member = session?.user?.id ? isWorkspaceMember(workspace, session.user.id) : null;
    const hasPublicAccess = workspace.settings?.publicAccess === true;
    if (!member && !hasPublicAccess) {
        return [];
    }

    // Limit archived tasks to boards this user (or guest) may see.
    const accessibleBoards = await Board.find({
        workspaceId: workspace._id,
        ...boardVisibilityFilter(session?.user?.id, member),
    })
        .select('_id')
        .lean();
    const accessibleBoardIds = accessibleBoards.map((b) => b._id);

    const tasks = await Task.find({
        workspaceId: workspace._id,
        status: 'ARCHIVED',
        boardId: { $in: accessibleBoardIds },
    })
        .populate('assignees', 'name email image')
        .populate('comments.userId', 'name email image')
        .sort({ updatedAt: -1 })
        .lean();

    return tasks.map((task) => ({
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        boardId: task.boardId.toString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assignees: (task.assignees as any[]).map((a) => ({
            id: a._id?.toString() || a.toString(),
            name: a.name || '',
            email: a.email || '',
            image: a.image,
        })),
        // Loose-schema seed inserts may omit timestamps; fall back to the
        // ObjectId-embedded creation time rather than crashing the render.
        createdAt: (task.createdAt ?? task._id.getTimestamp()).toISOString(),
        updatedAt: (task.updatedAt ?? task._id.getTimestamp()).toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        comments: (task.comments || []).map((c: any) => {
            const populatedUser = c.userId && typeof c.userId === 'object' && '_id' in c.userId ? c.userId : null;
            return {
                id: c._id.toString(),
                content: c.content,
                userId: populatedUser?._id?.toString() ?? c.userId?.toString() ?? '',
                parentId: c.parentId ? c.parentId.toString() : null,
                likes: (c.likes ?? []).map((id: Types.ObjectId) => id.toString()),
                reactions: (c.reactions ?? []).map((r: { emoji: string; userId?: Types.ObjectId }) => ({
                    emoji: r.emoji,
                    userId: r.userId?.toString(),
                })),
                createdAt: c.createdAt.toISOString(),
                user: populatedUser ? {
                    id: populatedUser._id.toString(),
                    name: populatedUser.name || 'Unknown User',
                    email: populatedUser.email || '',
                    image: populatedUser.image,
                } : null,
            };
        }),
    }));
}

export async function updateTaskPosition(
    taskId: string,
    newStatus: TaskStatus,
    newOrder: number
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    const workspace = await Workspace.findById(task.workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    const board = await Board.findById(task.boardId);

    // Check role - ADMIN, EDITOR, or ASSIGNEE can update task positions
    const member = isWorkspaceMember(workspace, session.user.id);

    // Enforce board-level access before any mutation.
    if (!board || !canAccessBoard(board, session.user.id, member)) {
        throw new Error('You do not have access to this board');
    }

    // Check if user is an assignee
    const isAssignee = task.assignees.some((id: Types.ObjectId) => id.toString() === session.user.id);

    // Only admins can move any card; everyone else can only move cards assigned to them
    if (!hasRole(member, 'ADMIN') && !isAssignee) {
        throw new Error('You can only move tasks assigned to you');
    }

    const previousStatus = task.status;
    task.status = newStatus;
    task.order = newOrder;
    await task.save();

    // Rebalance column orders if midpoint arithmetic has converged gaps below threshold
    const MIN_ORDER_GAP = 1.0;
    const colTasks = await Task.find({ boardId: task.boardId, status: newStatus })
        .sort({ order: 1 })
        .select('_id order');
    const needsRebalance = colTasks.length > 1 &&
        colTasks.some((t, i) => i > 0 && colTasks[i].order - colTasks[i - 1].order < MIN_ORDER_GAP);
    if (needsRebalance) {
        await Task.bulkWrite(
            colTasks.map((t, i) => ({
                updateOne: {
                    filter: { _id: t._id },
                    update: { $set: { order: (i + 1) * TASK_ORDER_INCREMENT } },
                },
            }))
        );
    }

    // Log activity if status changed (task moved to different column)
    if (previousStatus !== newStatus && board) {
        await logActivity({
            workspaceSlug: workspace.slug,
            boardSlug: board.slug,
            taskId: task._id.toString(),
            type: 'TASK_MOVED',
            title: 'Task Moved',
            description: `Moved "${task.title}" from ${previousStatus} to ${newStatus}`,
            metadata: {
                taskTitle: task.title,
                previousStatus,
                newStatus,
            },
        });

        // EMAIL NOTIFICATION: Task Moved — assignees + admins only, not the board.
        const notifyIds = taskNotifyTargets(
            task.assignees.map((id: Types.ObjectId) => id.toString()),
            workspace.members,
            session.user.id,
        );

        if (notifyIds.length > 0) {
            const users = await User.find({ _id: { $in: notifyIds } });
            await Promise.all(users.map(async (user) => {
                // Respect each recipient's task-updates preference (defaults to on).
                if (user.email && user.notificationPreferences?.taskUpdates !== false) {
                    const html = await render(
                        React.createElement(TaskMovedEmail, {
                            taskTitle: task.title,
                            moverName: session.user.name || 'A teammate',
                            fromStatus: previousStatus,
                            toStatus: newStatus,
                            workspaceName: workspace.name,
                            taskUrl: `${process.env.NEXTAUTH_URL}/${workspace.slug}/board/${board.slug}`,
                        })
                    );
                    await sendEmail({
                        to: user.email,
                        subject: `Task Update: ${task.title} moved to ${newStatus}`,
                        html,
                    });
                }
            }));
        }

        // Emit webhook for task moved
        emitEvent(
            session.user.id,
            'task.moved',
            workspace._id.toString(),
            { taskId: task._id.toString(), boardId: task.boardId.toString(), workspaceId: workspace._id.toString(), oldStatus: previousStatus, newStatus, title: task.title }
        ).catch(console.error);

        // PUSH: notify assignees (excluding the mover).
        const assigneePushTargets = task.assignees
            .map((id: Types.ObjectId) => id.toString())
            .filter((id: string) => id !== session.user.id);
        if (assigneePushTargets.length > 0 && board) {
            const taskTitle = task.title;
            const boardSlug = board.slug;
            const workspaceSlug = workspace.slug;
            after(() => triggerNotification({
                title: 'Task moved',
                body: `${taskTitle} → ${newStatus}`,
                url: `/${workspaceSlug}/board/${boardSlug}`,
                userIds: assigneePushTargets,
            }));
        }
    }

    revalidatePath(`/${workspace.slug}`);
    return { success: true };
}

export async function updateTask(
    taskId: string,
    data: {
        title?: string;
        description?: string;
        priority?: TaskPriority;
        status?: TaskStatus;
        assignees?: string[];
        subtasks?: { id?: string; title: string; completed: boolean; createdAt?: string; createdBy?: string | Types.ObjectId | { id?: string; _id?: string } | null }[];
        categoryId?: string | null;
        dueDate?: string | null;
        scheduledDate?: string | null;
        links?: { id: string; url: string; title: string }[];
    }
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    const workspace = await Workspace.findById(task.workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check role - ADMIN, EDITOR, or ASSIGNEE can update tasks
    const member = isWorkspaceMember(workspace, session.user.id);

    // Check if user is an assignee
    const isAssignee = task.assignees.some((id: Types.ObjectId) => id.toString() === session.user.id);

    if (!hasRole(member, 'ADMIN', 'EDITOR') && !isAssignee) {
        throw new Error('You do not have permission to update tasks');
    }

    // Enforce board-level access before any mutation.
    const accessBoard = await Board.findById(task.boardId).select('visibility memberIds');
    if (!accessBoard || !canAccessBoard(accessBoard, session.user.id, member)) {
        throw new Error('You do not have access to this board');
    }

    // Track if significant changes happened
    const previousStatus = task.status;
    const previousTitle = task.title;
    const previousAssignees = task.assignees.map(id => id.toString());
    const previousSubtaskTitles = (task.subtasks || []).map(s => s.title);

    if (data.title !== undefined) task.title = data.title;
    if (data.description !== undefined) task.description = data.description;
    if (data.priority !== undefined) task.priority = data.priority;
    if (data.status !== undefined) task.status = data.status;
    if (data.assignees !== undefined) {
        task.assignees = data.assignees as unknown as Types.ObjectId[];
    }
    if (data.subtasks !== undefined) {
        // Normalize `createdBy` from whatever the client round-trips: a raw id
        // string, an already-cast ObjectId, or a serialized member object
        // ({ id } / populated { _id }). Falls back to the editing user only when
        // no original author is present (e.g. a brand-new subtask), so editing
        // an existing subtask never reassigns its authorship.
        const coerceCreatedBy = (raw: unknown): Types.ObjectId => {
            if (!raw) return new Types.ObjectId(session.user.id);
            if (raw instanceof Types.ObjectId) return raw;
            if (typeof raw === 'string') {
                return Types.ObjectId.isValid(raw) ? new Types.ObjectId(raw) : new Types.ObjectId(session.user.id);
            }
            const candidate = (raw as { id?: string; _id?: string }).id ?? (raw as { id?: string; _id?: string })._id;
            return candidate && Types.ObjectId.isValid(candidate.toString())
                ? new Types.ObjectId(candidate.toString())
                : new Types.ObjectId(session.user.id);
        };
        task.subtasks = data.subtasks.map((s) => ({
            _id: (s.id && Types.ObjectId.isValid(s.id)) ? new Types.ObjectId(s.id) : new Types.ObjectId(),
            title: s.title,
            completed: s.completed,
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
            createdBy: coerceCreatedBy(s.createdBy),
        }));
    }
    if (data.categoryId !== undefined) {
        task.categoryId = data.categoryId ? new Types.ObjectId(data.categoryId) : undefined;
    }
    if (data.dueDate !== undefined) {
        task.dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
    }
    if (data.scheduledDate !== undefined) {
        task.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : undefined;
    }
    if (data.links !== undefined) {
        task.links = data.links.map((l) => ({
            _id: (l.id && Types.ObjectId.isValid(l.id) && !l.id.startsWith('temp-')) ? new Types.ObjectId(l.id) : new Types.ObjectId(),
            url: l.url,
            title: l.title,
        }));
    }

    await task.save();

    // EMAIL NOTIFICATION: New Subtasks Added
    if (data.subtasks !== undefined) {
        const newSubtaskTitles = data.subtasks
            .map(s => s.title)
            .filter(title => !previousSubtaskTitles.includes(title));

        if (newSubtaskTitles.length > 0) {
            // Assignees + admins only — not the whole board.
            const notifyIds = taskNotifyTargets(
                task.assignees.map((id: Types.ObjectId) => id.toString()),
                workspace.members,
                session.user.id,
            );

            if (notifyIds.length > 0) {
                const board = await Board.findById(task.boardId);
                const boardSlug = board?.slug || 'main';

                const users = await User.find({ _id: { $in: notifyIds } });
                await Promise.all(users.map(async (user) => {
                    if (user.email) {
                        const html = await render(
                            React.createElement(SubtaskAddedEmail, {
                                taskTitle: task.title,
                                subtaskTitles: newSubtaskTitles,
                                creatorName: session.user.name || 'A teammate',
                                workspaceName: workspace.name,
                                taskUrl: `${process.env.NEXTAUTH_URL}/${workspace.slug}/board/${boardSlug}`,
                            })
                        );
                        await sendEmail({
                            to: user.email,
                            subject: `New Subtasks Added to "${task.title}" in ${workspace.name}`,
                            html,
                        });
                    }
                }));

                // PUSH: notify task assignees (excluding the adder).
                const subtaskPushTargets = task.assignees
                    .map((id: Types.ObjectId) => id.toString())
                    .filter((id: string) => id !== session.user.id);
                if (subtaskPushTargets.length > 0) {
                    const adderName = session.user.name || 'A teammate';
                    const taskTitle = task.title;
                    const workspaceSlug = workspace.slug;
                    const preview = newSubtaskTitles.length === 1
                        ? newSubtaskTitles[0]
                        : `${newSubtaskTitles.slice(0, 2).join(', ')}${newSubtaskTitles.length > 2 ? ` and ${newSubtaskTitles.length - 2} more` : ''}`;
                    after(() => triggerNotification({
                        title: `New subtask on "${taskTitle}"`,
                        body: `${adderName} added: ${preview}`,
                        url: `/${workspaceSlug}/board/${boardSlug}`,
                        userIds: subtaskPushTargets,
                    }));
                }
            }
        }
    }

    // EMAIL NOTIFICATION: New Assignment
    // Check for NEW assignees
    if (data.assignees) {
        const newAssignees = data.assignees.filter(id => !previousAssignees.includes(id));

        if (newAssignees.length > 0) {
            const newAssigneeUsers = await User.find({ _id: { $in: newAssignees } });
            const newAssigneeNames = newAssigneeUsers.map(u => u.name || 'Someone').join(', ');

            // Notify the newly-assigned people plus admins — minus the assigner.
            const notifyIds = taskNotifyTargets(newAssignees, workspace.members, session.user.id);
            const usersToNotify = await User.find({ _id: { $in: notifyIds } });

            // Get board for URL
            const board = await Board.findById(task.boardId);
            const boardSlug = board?.slug || 'main';

            // Respect each recipient's email preference (defaults to on for
            // accounts created before the preference existed).
            const optedOutOfAssignment = new Set(
                usersToNotify
                    .filter((u) => u.notificationPreferences?.taskAssigned === false)
                    .map((u) => u._id.toString())
            );

            // Send emails in parallel
            await Promise.all(usersToNotify.map(async (user) => {
                if (user.email && !optedOutOfAssignment.has(user._id.toString())) {
                    const html = await render(
                        React.createElement(TaskAssignedEmail, {
                            recipientName: user.name || 'Teammate',
                            assigneeNames: newAssigneeNames,
                            taskTitle: task.title,
                            workspaceName: workspace.name,
                            taskUrl: `${process.env.NEXTAUTH_URL}/${workspace.slug}/board/${boardSlug}`,
                            assignerName: session.user.name || 'A teammate',
                        })
                    );

                    await sendEmail({
                        to: user.email,
                        subject: `New Assignment in ${workspace.name}: ${task.title}`,
                        html,
                    });
                }
            }));

            // PUSH NOTIFICATION: target the NEW assignees only (single fanout, not N broadcasts),
            // minus anyone who turned assignment notifications off.
            const pushAssignees = newAssignees.filter((id) => !optedOutOfAssignment.has(id));
            if (pushAssignees.length > 0) {
                const assignerName = session.user.name || 'A teammate';
                const taskTitle = task.title;
                const boardName = board?.name || 'a board';
                const workspaceSlug = workspace.slug;
                const actorId = session.user.id;
                after(() => triggerNotification({
                    title: 'Task assigned to you',
                    body: `${assignerName} assigned "${taskTitle}" in ${boardName}`,
                    url: `/${workspaceSlug}/board/${boardSlug}`,
                    userIds: pushAssignees,
                    excludeUserId: actorId,
                }));
            }
        }
    }

    // Log activity for significant updates
    const board = await Board.findById(task.boardId);
    if (board) {
        // Log status change
        if (data.status && previousStatus !== data.status) {
            await logActivity({
                workspaceSlug: workspace.slug,
                boardSlug: board.slug,
                taskId: task._id.toString(),
                type: 'TASK_MOVED',
                title: 'Task Status Changed',
                description: `Changed "${task.title}" from ${previousStatus} to ${data.status}`,
                metadata: {
                    taskTitle: task.title,
                    previousStatus,
                    newStatus: data.status,
                },
            });

            // EMAIL: Status Change via Edit Modal — assignees + admins only.
            const notifyIds = taskNotifyTargets(
                task.assignees.map((id: Types.ObjectId) => id.toString()),
                workspace.members,
                session.user.id,
            );

            if (notifyIds.length > 0) {
                const users = await User.find({ _id: { $in: notifyIds } });
                await Promise.all(users.map(async (user) => {
                    // Respect each recipient's task-updates preference (defaults to on).
                    if (user.email && user.notificationPreferences?.taskUpdates !== false) {
                        const html = await render(
                            React.createElement(TaskMovedEmail, {
                                taskTitle: task.title,
                                moverName: session.user.name || 'A teammate',
                                fromStatus: previousStatus,
                                toStatus: data.status!,
                                workspaceName: workspace.name,
                                taskUrl: `${process.env.NEXTAUTH_URL}/${workspace.slug}/board/${board.slug}`,
                            })
                        );
                        await sendEmail({
                            to: user.email,
                            subject: `Task Update: ${task.title} moved to ${data.status}`,
                            html,
                        });
                    }
                }));
            }

            // PUSH NOTIFICATION: target assignees (excluding the actor).
            const statusPushTargets = task.assignees
                .map((id: Types.ObjectId) => id.toString())
                .filter((id: string) => id !== session.user.id);
            if (statusPushTargets.length > 0) {
                const taskTitle = task.title;
                const newStatus = data.status;
                const workspaceSlug = workspace.slug;
                const boardSlug = board.slug;
                after(() => triggerNotification({
                    title: 'Task updated',
                    body: `${taskTitle} → ${newStatus}`,
                    url: `/${workspaceSlug}/board/${boardSlug}`,
                    userIds: statusPushTargets,
                }));
            }
        }

        // Log general update (title changes, etc)
        if (data.title && previousTitle !== data.title) {
            await logActivity({
                workspaceSlug: workspace.slug,
                boardSlug: board.slug,
                taskId: task._id.toString(),
                type: 'TASK_UPDATED',
                title: 'Task Updated',
                description: `Renamed "${previousTitle}" to "${data.title}"`,
                metadata: {
                    taskTitle: data.title,
                },
            });
        }
    }

    // Emit webhook for task updated (any significant field change)
    if (data.title || data.description || data.status || data.priority || data.assignees || data.categoryId) {
        emitEvent(
            session.user.id,
            'task.updated',
            workspace._id.toString(),
            { taskId: task._id.toString(), boardId: task.boardId.toString(), workspaceId: workspace._id.toString(), title: task.title, status: task.status, priority: task.priority }
        ).catch(console.error);
    }

    revalidatePath(`/${workspace.slug}`);
    revalidatePath(`/${workspace.slug}/archive`);
    return { success: true };
}

export async function deleteTask(taskId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    const workspace = await Workspace.findById(task.workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check role - only ADMIN and EDITOR can delete tasks
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        throw new Error('You do not have permission to delete tasks');
    }

    // Enforce board-level access before deletion.
    const board = await Board.findById(task.boardId);
    if (!board || !canAccessBoard(board, session.user.id, member)) {
        throw new Error('You do not have access to this board');
    }

    // Log activity before deleting
    const taskTitle = task.title;
    const taskWorkspaceId = workspace._id.toString();
    {
        await logActivity({
            workspaceSlug: workspace.slug,
            boardSlug: board.slug,
            taskId: task._id.toString(),
            type: 'TASK_DELETED',
            title: 'Task Deleted',
            description: `Deleted task "${task.title}"`,
            metadata: {
                taskTitle: task.title,
            },
        });
    }

    // Emit webhook for task deleted
    emitEvent(
        session.user.id,
        'task.deleted',
        taskWorkspaceId,
        { taskId: task._id.toString(), boardId: task.boardId.toString(), workspaceId: taskWorkspaceId, title: taskTitle }
    ).catch(console.error);

    await Task.findByIdAndDelete(taskId);

    revalidatePath(`/${workspace.slug}`);
    revalidatePath(`/${workspace.slug}/archive`);
    return { success: true };
}

export async function archiveTasks(taskIds: string[]) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    if (!taskIds || taskIds.length === 0) {
        return { success: true, archivedCount: 0 };
    }

    await connectDB();

    // Get tasks to archive with workspace info
    const tasks = await Task.find({ _id: { $in: taskIds } });
    if (tasks.length === 0) {
        throw new Error('Tasks not found');
    }

    const workspace = await Workspace.findById(tasks[0].workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check role - only ADMIN and EDITOR can archive tasks
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        throw new Error('You do not have permission to archive tasks');
    }

    // Enforce board-level access for every board these tasks belong to.
    const distinctBoardIds = [...new Set(tasks.map((t) => t.boardId.toString()))];
    const involvedBoards = await Board.find({ _id: { $in: distinctBoardIds } }).select('visibility memberIds');
    const allAccessible =
        involvedBoards.length === distinctBoardIds.length &&
        involvedBoards.every((b) => canAccessBoard(b, session.user.id, member));
    if (!allAccessible) {
        throw new Error('You do not have access to one or more of these boards');
    }

    const board = await Board.findById(tasks[0].boardId);

    // Archive all tasks
    await Task.updateMany(
        { _id: { $in: taskIds } },
        { $set: { status: 'ARCHIVED' as TaskStatus } }
    );

    // Log activity for each archived task
    await Promise.all(tasks.map(async (task) => {
        await logActivity({
            workspaceSlug: workspace.slug,
            boardSlug: board?.slug || '',
            taskId: task._id.toString(),
            type: 'TASK_UPDATED',
            title: 'Tasks Archived',
            description: `Archived task "${task.title}"`,
            metadata: {
                taskTitle: task.title,
            },
        });
    }));

    // Emit webhook for each archived task
    await Promise.all(tasks.map(async (task) => {
        emitEvent(
            session.user.id,
            'task.updated',
            workspace._id.toString(),
            { taskId: task._id.toString(), boardId: task.boardId.toString(), workspaceId: workspace._id.toString(), title: task.title, status: 'ARCHIVED' }
        ).catch(console.error);
    }));

    revalidatePath(`/${workspace.slug}`);
    revalidatePath(`/${workspace.slug}/archive`);
    return { success: true, archivedCount: tasks.length };
}

export async function addComment(taskId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    const workspace = await Workspace.findById(task.workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Only ADMIN and EDITOR can comment; VIEWERs are read-only
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        throw new Error('You do not have permission to comment');
    }

    // Enforce board-level access — a restricted board's task is off-limits to
    // members who haven't been granted access to that board.
    const board = await Board.findById(task.boardId);
    if (!board || !canAccessBoard(board, session.user.id, member)) {
        throw new Error('You do not have access to this board');
    }

    if (!task.comments) {
        task.comments = [];
    }

    task.comments.push({
        content,
        userId: new Types.ObjectId(session.user.id),
    } as any);

    await task.save();

    // Capture the just-pushed subdoc directly (its _id is the source of truth).
    const created = task.comments[task.comments.length - 1];
    const createdId = created._id.toString();

    // Re-fetch to populate the comment author, then locate the exact subdoc by id.
    const updatedTask = await Task.findById(taskId).populate('comments.userId', 'name email image');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newComment = (updatedTask?.comments as any[]).find((c) => c._id.toString() === createdId);

    // Log activity for comment
    {
        await logActivity({
            workspaceSlug: workspace.slug,
            boardSlug: board.slug,
            taskId: task._id.toString(),
            type: 'COMMENT_ADDED',
            title: 'New Comment',
            description: `Commented on "${task.title}"`,
            metadata: {
                taskTitle: task.title,
                commentContent: content.length > 100 ? content.substring(0, 100) + '...' : content,
            },
        });

        // Notification targets: only people actually involved with this task —
        // its assignees and anyone @mentioned in the comment — never the whole team,
        // and never the commenter themselves. Targets are also filtered to users who
        // can actually access the board, so a restricted board never leaks via a
        // comment notification (e.g. an @mention of a non-board-member).
        const roleByUserId = new Map<string, string | undefined>(
            workspace.members.map((m) => [m.userId.toString(), m.role])
        );
        const canSeeBoard = (uid: string) => canAccessBoard(board, uid, { role: roleByUserId.get(uid) });

        const assigneeIds = task.assignees.map((id: Types.ObjectId) => id.toString());
        const mentionedIds = (
            await resolveMentionedUserIds(content, workspace.members, session.user.id)
        ).filter(canSeeBoard);
        const mentionedSet = new Set(mentionedIds);

        // Resolve `@[user:<id>]` / `@[subtask:<id>]` chip tokens to readable text
        // for every surface that shows the raw comment body (email + push). The
        // rich modal renderer handles its own chips; everything else must not
        // leak the literal `@[user:6a17...]` token.
        const chipUserIds = extractUserChipIds(content);
        const chipUsers = chipUserIds.length
            ? await User.find({ _id: { $in: chipUserIds } }).select('name')
            : [];
        const mentionNameById = new Map<string, string>(
            chipUsers.map((u) => [u._id.toString(), u.name as string]),
        );
        const subtaskTitleById = new Map<string, string>(
            (task.subtasks || []).map((s: { _id: { toString(): string }; title: string }) => [s._id.toString(), s.title]),
        );
        const displayContent = renderMentionsToPlainText(
            content,
            mentionNameById,
            subtaskTitleById,
        );

        // EMAIL NOTIFICATION: New Comment — assignees ∪ admins ∪ mentioned, minus
        // the commenter. Admins are folded in so they see every comment.
        const emailTargetIds = taskNotifyTargets(
            assigneeIds,
            workspace.members,
            session.user.id,
            mentionedIds,
        ).filter(canSeeBoard);

        if (emailTargetIds.length > 0) {
            const users = await User.find({ _id: { $in: emailTargetIds } });
            await Promise.all(users.map(async (user) => {
                // Respect each recipient's comment-email preference (defaults to on).
                if (user.email && user.notificationPreferences?.comments !== false) {
                    const html = await render(
                        React.createElement(NewCommentEmail, {
                            taskTitle: task.title,
                            commenterName: session.user.name || 'A teammate',
                            commentContent: displayContent,
                            taskUrl: `${process.env.NEXTAUTH_URL}/${workspace.slug}/board/${board.slug}`,
                        })
                    );
                    await sendEmail({
                        to: user.email,
                        subject: `New Comment on: ${task.title}`,
                        html,
                    });
                }
            }));
        }

        // PUSH NOTIFICATION: send two distinct pushes so mentioned users see
        // "X mentioned you" while plain assignees see "New comment".
        const assigneePushTargets = uniqueExcluding(
            [...assigneeIds, ...adminUserIds(workspace.members)].filter((id: string) => !mentionedSet.has(id)),
            session.user.id,
        ).filter(canSeeBoard);

        const commenterName = session.user.name || 'A teammate';
        const snippet = displayContent.substring(0, 60) + (displayContent.length > 60 ? '…' : '');
        const taskTitle = task.title;
        const workspaceSlug = workspace.slug;
        const boardSlug = board.slug;

        if (mentionedIds.length > 0) {
            after(() => triggerNotification({
                title: `${commenterName} mentioned you`,
                body: `On "${taskTitle}": ${snippet}`,
                url: `/${workspaceSlug}/board/${boardSlug}`,
                userIds: mentionedIds,
            }));
        }
        if (assigneePushTargets.length > 0) {
            after(() => triggerNotification({
                title: `New comment on "${taskTitle}"`,
                body: `${commenterName}: ${snippet}`,
                url: `/${workspaceSlug}/board/${boardSlug}`,
                userIds: assigneePushTargets,
            }));
        }
    }

    revalidatePath(`/${workspace.slug}`);

    if (!newComment) {
        throw new Error('Failed to retrieve saved comment');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const populatedUser: any = (newComment.userId && typeof newComment.userId === 'object' && '_id' in newComment.userId) ? newComment.userId : null;

    return {
        id: createdId,
        content: newComment.content,
        userId: populatedUser?._id?.toString() ?? session.user.id,
        user: {
            id: populatedUser?._id?.toString() ?? session.user.id,
            name: populatedUser?.name || 'Unknown User',
            email: populatedUser?.email ?? '',
            image: populatedUser?.image ?? null,
        },
        createdAt: newComment.createdAt.toISOString(),
        likes: [],
        reactions: [],
    };
}

export async function deleteComment(taskId: string, commentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    const workspace = await Workspace.findById(task.workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    if (!task.comments) {
        throw new Error('Comment not found');
    }

    // Find comment to check ownership
    const comment = task.comments.find((c: any) => c._id.toString() === commentId);
    if (!comment) {
        throw new Error('Comment not found');
    }

    // Allow author or admin to delete
    const isAuthor = comment.userId.toString() === session.user.id;
    const member = isWorkspaceMember(workspace, session.user.id);
    const isAdmin = hasRole(member, 'ADMIN');

    if (!isAuthor && !isAdmin) {
        throw new Error('You do not have permission to delete this comment');
    }

    // Enforce board-level access.
    const board = await Board.findById(task.boardId).select('visibility memberIds');
    if (!board || !canAccessBoard(board, session.user.id, member)) {
        throw new Error('You do not have access to this board');
    }

    // Remove comment
    task.comments = task.comments.filter((c: any) => c._id.toString() !== commentId);
    await task.save();

    revalidatePath(`/${workspace.slug}`);
    return { success: true };
}

export async function likeComment(taskId: string, commentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    const workspace = await Workspace.findById(task.workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if user is member
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) {
        throw new Error('You do not have permission to like comments');
    }

    // Enforce board-level access.
    const accessBoard = await Board.findById(task.boardId).select('visibility memberIds');
    if (!accessBoard || !canAccessBoard(accessBoard, session.user.id, member)) {
        throw new Error('You do not have access to this board');
    }

    if (!task.comments) {
        throw new Error('Comment not found');
    }

    const comment = task.comments.find((c: any) => c._id.toString() === commentId) as any;
    if (!comment) {
        throw new Error('Comment not found');
    }

    // Initialize likes array if it doesn't exist
    if (!comment.likes) {
        comment.likes = [];
    }

    const userIdStr = session.user.id;
    const likeIndex = comment.likes.indexOf(userIdStr);
    const isAdding = likeIndex === -1;

    if (likeIndex > -1) {
        // Unlike - remove user from likes
        comment.likes.splice(likeIndex, 1);
    } else {
        // Like - add user to likes
        comment.likes.push(userIdStr);
    }

    await task.save();

    // PUSH: only on like-add, only to the comment author, never to self.
    if (isAdding) {
        const commentAuthorId = comment.userId.toString();
        if (commentAuthorId !== userIdStr) {
            const likerName = session.user.name || 'Someone';
            const board = await Board.findById(task.boardId);
            const boardSlug = board?.slug || 'main';
            const taskTitle = task.title;
            const workspaceSlug = workspace.slug;
            after(() => triggerNotification({
                title: `${likerName} liked your comment`,
                body: `On "${taskTitle}"`,
                url: `/${workspaceSlug}/board/${boardSlug}`,
                userIds: [commentAuthorId],
            }));
        }
    }

    revalidatePath(`/${workspace.slug}`);
    return { success: true, liked: isAdding, likesCount: comment.likes.length };
}

export async function replyToComment(taskId: string, parentCommentId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    const workspace = await Workspace.findById(task.workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if user is member
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) {
        throw new Error('You do not have permission to reply to comments');
    }

    // Enforce board-level access.
    const accessBoard = await Board.findById(task.boardId).select('visibility memberIds');
    if (!accessBoard || !canAccessBoard(accessBoard, session.user.id, member)) {
        throw new Error('You do not have access to this board');
    }

    // Find parent comment
    const parentComment = task.comments?.find((c: any) => c._id.toString() === parentCommentId);
    if (!parentComment) {
        throw new Error('Parent comment not found');
    }
    const parentAuthorId = parentComment.userId.toString();

    if (!task.comments) {
        task.comments = [];
    }

    // Add reply
    task.comments.push({
        content,
        userId: new Types.ObjectId(session.user.id),
        parentId: new Types.ObjectId(parentCommentId),
    } as any);

    await task.save();

    // Capture the just-pushed subdoc directly (its _id is the source of truth).
    const created = task.comments[task.comments.length - 1];
    const createdId = created._id.toString();

    // Re-fetch to populate the comment author, then locate the exact subdoc by id.
    const updatedTask = await Task.findById(taskId).populate('comments.userId', 'name email image');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newComment = (updatedTask?.comments as any[]).find((c) => c._id.toString() === createdId);

    // PUSH NOTIFICATION: parent author ∪ assignees ∪ mentions, split between
    // "mentioned you" and the standard reply title.
    const board = await Board.findById(task.boardId);
    if (board) {
        const assigneeIds = task.assignees.map((id: Types.ObjectId) => id.toString());
        const mentionedIds = await resolveMentionedUserIds(
            content,
            workspace.members,
            session.user.id,
        );
        const mentionedSet = new Set(mentionedIds);
        const standardTargets = uniqueExcluding(
            [parentAuthorId, ...assigneeIds].filter((id: string) => !mentionedSet.has(id)),
            session.user.id,
        );

        const replierName = session.user.name || 'A teammate';
        const replyChipUserIds = extractUserChipIds(content);
        const replyChipUsers = replyChipUserIds.length
            ? await User.find({ _id: { $in: replyChipUserIds } }).select('name')
            : [];
        const replyMentionNameById = new Map<string, string>(
            replyChipUsers.map((u) => [u._id.toString(), u.name as string]),
        );
        const replySubtaskTitleById = new Map<string, string>(
            (task.subtasks || []).map((s: { _id: { toString(): string }; title: string }) => [s._id.toString(), s.title]),
        );
        const replyDisplayContent = renderMentionsToPlainText(
            content,
            replyMentionNameById,
            replySubtaskTitleById,
        );
        const snippet = replyDisplayContent.substring(0, 60) + (replyDisplayContent.length > 60 ? '…' : '');
        const taskTitle = task.title;
        const workspaceSlug = workspace.slug;
        const boardSlug = board.slug;

        // EMAIL NOTIFICATION: New Reply — parent author ∪ assignees ∪ admins ∪
        // mentioned, minus the replier. Mirrors addComment so a reply (and any
        // @mention inside it) reaches people by email, not just push. Targets are
        // filtered to users who can actually access the board, and every send
        // respects the recipient's `comments` email preference (defaults to on).
        const roleByUserId = new Map<string, string | undefined>(
            workspace.members.map((m) => [m.userId.toString(), m.role]),
        );
        const canSeeBoard = (uid: string) =>
            canAccessBoard(board, uid, { role: roleByUserId.get(uid) });
        const emailTargetIds = taskNotifyTargets(
            assigneeIds,
            workspace.members,
            session.user.id,
            [parentAuthorId, ...mentionedIds],
        ).filter(canSeeBoard);

        if (emailTargetIds.length > 0) {
            const recipients = await User.find({ _id: { $in: emailTargetIds } });
            await Promise.all(recipients.map(async (user) => {
                if (user.email && user.notificationPreferences?.comments !== false) {
                    const html = await render(
                        React.createElement(NewCommentEmail, {
                            taskTitle: task.title,
                            commenterName: replierName,
                            commentContent: replyDisplayContent,
                            taskUrl: `${process.env.NEXTAUTH_URL}/${workspace.slug}/board/${board.slug}`,
                        }),
                    );
                    await sendEmail({
                        to: user.email,
                        subject: `New Reply on: ${task.title}`,
                        html,
                    });
                }
            }));
        }

        if (mentionedIds.length > 0) {
            after(() => triggerNotification({
                title: `${replierName} mentioned you`,
                body: `On "${taskTitle}": ${snippet}`,
                url: `/${workspaceSlug}/board/${boardSlug}`,
                userIds: mentionedIds,
            }));
        }
        if (standardTargets.length > 0) {
            after(() => triggerNotification({
                title: `${replierName} replied`,
                body: `On "${taskTitle}": ${snippet}`,
                url: `/${workspaceSlug}/board/${boardSlug}`,
                userIds: standardTargets,
            }));
        }
    }

    revalidatePath(`/${workspace.slug}`);

    if (newComment) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const replyPopulatedUser: any = (newComment.userId && typeof newComment.userId === 'object' && '_id' in newComment.userId) ? newComment.userId : null;
        return {
            id: createdId,
            content: newComment.content,
            userId: replyPopulatedUser?._id?.toString() ?? session.user.id,
            user: {
                id: replyPopulatedUser?._id?.toString() ?? session.user.id,
                name: replyPopulatedUser?.name || 'Unknown User',
                email: replyPopulatedUser?.email ?? '',
                image: replyPopulatedUser?.image ?? null,
            },
            createdAt: newComment.createdAt.toISOString(),
            parentId: parentCommentId,
            likes: [],
            reactions: [],
        };
    }

    return { success: false };
}

export async function addReaction(taskId: string, commentId: string, emoji: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const task = await Task.findById(taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    const workspace = await Workspace.findById(task.workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if user is member
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) {
        throw new Error('You do not have permission to react');
    }

    // Enforce board-level access.
    const accessBoard = await Board.findById(task.boardId).select('visibility memberIds');
    if (!accessBoard || !canAccessBoard(accessBoard, session.user.id, member)) {
        throw new Error('You do not have access to this board');
    }

    if (!task.comments) {
        throw new Error('Comment not found');
    }

    const comment = task.comments.find((c: any) => c._id.toString() === commentId) as any;
    if (!comment) {
        throw new Error('Comment not found');
    }

    // Initialize reactions array if it doesn't exist
    if (!comment.reactions) {
        comment.reactions = [];
    }

    const userIdStr = session.user.id;
    // Check if user already reacted with this emoji
    const existingReactionIndex = comment.reactions.findIndex(
        (r: { emoji: string; userId: string }) => r.emoji === emoji && r.userId === userIdStr
    );
    const isAdding = existingReactionIndex === -1;

    if (existingReactionIndex > -1) {
        // Remove reaction if already exists
        comment.reactions.splice(existingReactionIndex, 1);
    } else {
        // Add new reaction
        comment.reactions.push({ emoji, userId: userIdStr });
    }

    await task.save();

    // PUSH: only when adding a reaction, never to self.
    if (isAdding) {
        const commentAuthorId = comment.userId.toString();
        if (commentAuthorId !== userIdStr) {
            const reactorName = session.user.name || 'Someone';
            const board = await Board.findById(task.boardId);
            const boardSlug = board?.slug || 'main';
            const taskTitle = task.title;
            const workspaceSlug = workspace.slug;
            after(() => triggerNotification({
                title: `${reactorName} reacted ${emoji}`,
                body: `On your comment on "${taskTitle}"`,
                url: `/${workspaceSlug}/board/${boardSlug}`,
                userIds: [commentAuthorId],
            }));
        }
    }

    revalidatePath(`/${workspace.slug}`);
    return { success: true, reactions: comment.reactions };
}

// Matches chip-style mentions emitted by the composer: `@[user:<24-hex-id>]`.
const MENTION_CHIP_REGEX = /@\[user:([a-f\d]{24})\]/gi;

// Helper: extract the raw ObjectId strings from `@[user:<id>]` chip tokens.
function extractMentionChipIds(content: string): string[] {
    const ids: string[] = [];
    let match: RegExpExecArray | null;
    MENTION_CHIP_REGEX.lastIndex = 0;
    while ((match = MENTION_CHIP_REGEX.exec(content)) !== null) {
        ids.push(match[1]);
    }
    return ids;
}

// Helper function to extract @Name mentions from content. Chip tokens
// (`@[user:<id>]`) are stripped first so their ids aren't mis-parsed as names.
function extractMentions(content: string): string[] {
    const withoutChips = content.replace(MENTION_CHIP_REGEX, ' ');
    const mentionRegex = /@(\w+(?:\s\w+)*)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(withoutChips)) !== null) {
        mentions.push(match[1]);
    }
    return mentions;
}

function escapeForRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolve mentions in `content` to userId strings, scoped to a workspace's
 * members. Two mention forms are supported:
 *   1. Chip tokens `@[user:<id>]` emitted by the composer — the id is taken
 *      directly and validated against the workspace member list.
 *   2. `@Name` fallback — matched case-insensitively and exactly (no partial
 *      name matching, so "@John" won't match "Johnny"). Ambiguous names (two
 *      members named "John") notify all matches.
 */
async function resolveMentionedUserIds(
    content: string,
    members: Array<{ userId: { toString(): string } }>,
    excludeUserId: string,
): Promise<string[]> {
    const memberIdSet = new Set(members.map((m) => m.userId.toString()));

    // Form 1: chip ids — keep only ids that are actually workspace members.
    const chipIds = extractMentionChipIds(content).filter((id) => memberIdSet.has(id));

    // Form 2: @Name fallback — resolve names against the member roster.
    const names = extractMentions(content);
    let nameIds: string[] = [];
    if (names.length > 0) {
        const matchers = names.map((n) => new RegExp(`^${escapeForRegex(n.trim())}$`, 'i'));
        const users = await User.find({
            _id: { $in: Array.from(memberIdSet) },
            $or: matchers.map((rx) => ({ name: rx })),
        }).select('_id');
        nameIds = users.map((u) => u._id.toString());
    }

    const ids = [...chipIds, ...nameIds].filter((id) => id !== excludeUserId);
    return Array.from(new Set(ids));
}

function uniqueExcluding(ids: string[], excludeId: string): string[] {
    const set = new Set(ids);
    set.delete(excludeId);
    return Array.from(set);
}

/** User IDs of every workspace ADMIN. Admins get oversight of all task activity. */
function adminUserIds(
    members: Array<{ userId: { toString(): string }; role?: string }>,
): string[] {
    return members
        .filter((m) => m.role === 'ADMIN')
        .map((m) => m.userId.toString());
}

/**
 * Recipients for a task-scoped notification: the task's assignees plus every
 * workspace admin, minus the person who performed the action. This is the
 * single source of truth for "who hears about this task" — assignees because
 * it's their task, admins because they oversee everything. The whole board is
 * deliberately NOT notified. `extra` folds in ad-hoc recipients (e.g. the
 * @mentioned users on a comment) before de-duplication.
 */
function taskNotifyTargets(
    assigneeIds: string[],
    members: Array<{ userId: { toString(): string }; role?: string }>,
    actorId: string,
    extra: string[] = [],
): string[] {
    return uniqueExcluding(
        [...assigneeIds, ...adminUserIds(members), ...extra],
        actorId,
    );
}

// Get workspace members for @mention autocomplete
export async function getWorkspaceMembers(workspaceSlug: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug }).populate('members.userId', 'name email image');
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    if (!isWorkspaceMember(workspace, session.user.id)) {
        throw new Error('Access denied');
    }

    // Defensive: a member whose user document was deleted leaves an orphaned
    // reference that `.populate()` resolves to null. Skip those rather than
    // throwing on `m.userId._id` — one bad ref must not blank the whole roster.
    return workspace.members
        .filter((m: any) => m.userId && m.userId._id)
        .map((m: any) => ({
            id: m.userId._id.toString(),
            name: m.userId.name,
            email: m.userId.email,
            image: m.userId.image,
        }));
}

export interface CalendarTask {
    id: string;
    title: string;
    /** Full task description (markdown-ish plain text). Surfaced so the calendar's
     *  edit modal can show/edit it without a second fetch. */
    description?: string;
    /** Workspace calendar positions by this. Optional because the board calendar
     *  positions by `scheduledDate` instead. */
    dueDate?: string;          // ISO string
    /** Per-board calendar positions by this. */
    scheduledDate?: string;    // ISO string
    status: TaskStatus;
    priority: TaskPriority;
    boardId: string;
    boardSlug: string;
    createdAt: string;         // ISO string
}

export async function getCalendarTasks(workspaceSlug: string): Promise<CalendarTask[]> {
    const session = await auth();

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) return [];

    // Members get their accessible boards; guests get a read-only view of a
    // publicly-accessible workspace's non-RESTRICTED boards. Non-public, non-member → nothing.
    const member = session?.user?.id ? isWorkspaceMember(workspace, session.user.id) : null;
    const hasPublicAccess = workspace.settings?.publicAccess === true;
    if (!member && !hasPublicAccess) return [];

    // Get all boards this member (or guest) can access — boardVisibilityFilter
    // excludes RESTRICTED boards when there is no membership.
    const boards = await Board.find({
        workspaceId: workspace._id,
        ...boardVisibilityFilter(session?.user?.id, member),
    }).select('_id slug').lean();

    const boardIds = boards.map((b) => b._id);
    const boardSlugMap = new Map(boards.map((b) => [b._id.toString(), b.slug]));

    const tasks = await Task.find({
        workspaceId: workspace._id,
        boardId: { $in: boardIds },
        dueDate: { $exists: true, $ne: null },
        status: { $ne: 'ARCHIVED' },
    })
        .select('_id title description dueDate status priority boardId createdAt')
        .lean();

    return tasks
        .filter((t) => boardSlugMap.has(t.boardId.toString()))
        .map((t) => ({
            id: t._id.toString(),
            title: t.title,
            description: t.description,
            dueDate: t.dueDate!.toISOString(),
            status: t.status,
            priority: t.priority,
            boardId: t.boardId.toString(),
            boardSlug: boardSlugMap.get(t.boardId.toString())!,
            // Same defensive fallback as getTasks/getBoardCalendarTasks: docs
            // inserted by a loose-schema seed may omit `createdAt`, so derive it
            // from the ObjectId rather than crashing the calendar render.
            createdAt: (t.createdAt ?? t._id.getTimestamp()).toISOString(),
        }));
}

export async function updateTaskDueDate(taskId: string, newDate: Date, workspaceSlug: string): Promise<void> {
    await updateTask(taskId, { dueDate: newDate.toISOString() });
    // updateTask revalidates the workspace root; this additionally invalidates the calendar sub-path.
    revalidatePath(`/${workspaceSlug}/calendar`);
}

/**
 * Per-board calendar feed. Mirrors getCalendarTasks but scoped to a single board
 * and positioned by `scheduledDate` instead of `dueDate`, so board-scheduled items
 * stay isolated from the workspace calendar (which only ever reads `dueDate`).
 */
export async function getBoardCalendarTasks(workspaceSlug: string, boardSlug: string): Promise<CalendarTask[]> {
    const session = await auth();

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) return [];

    const member = session?.user?.id ? isWorkspaceMember(workspace, session.user.id) : null;
    const hasPublicAccess = workspace.settings?.publicAccess === true;
    if (!member && !hasPublicAccess) return [];

    // Resolve the single board, enforcing the same visibility rules as the
    // workspace calendar (RESTRICTED boards are hidden from non-members).
    const board = await Board.findOne({
        workspaceId: workspace._id,
        slug: boardSlug,
        ...boardVisibilityFilter(session?.user?.id, member),
    }).select('_id slug').lean();
    if (!board) return [];

    const tasks = await Task.find({
        workspaceId: workspace._id,
        boardId: board._id,
        scheduledDate: { $exists: true, $ne: null },
        status: { $ne: 'ARCHIVED' },
    })
        .select('_id title description scheduledDate status priority boardId createdAt')
        .lean();

    return tasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        description: t.description,
        scheduledDate: t.scheduledDate!.toISOString(),
        status: t.status,
        priority: t.priority,
        boardId: t.boardId.toString(),
        boardSlug: board.slug,
        // Same defensive fallback as getTasks: loose-schema seed inserts may omit
        // `createdAt`, so derive it from the ObjectId rather than crashing.
        createdAt: (t.createdAt ?? t._id.getTimestamp()).toISOString(),
    }));
}

export async function updateTaskScheduledDate(taskId: string, newDate: Date): Promise<void> {
    await updateTask(taskId, { scheduledDate: newDate.toISOString() });
    // updateTask already revalidates the workspace root, and the board page is
    // force-dynamic (re-fetches every request), so the per-board calendar at
    // ?view=calendar picks this up without an extra revalidate.
}
