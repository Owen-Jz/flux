'use server';

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
import { TASK_ORDER_INCREMENT } from '@/lib/constants';
import { triggerNotification } from '@/lib/pwa/trigger-notification';

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

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        throw new Error('Board not found');
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

    // EMAIL NOTIFICATION: Task Created
    const memberIds = workspace.members.map((m: any) => m.userId.toString());
    const notifyIds = memberIds.filter((id: string) => id !== session.user.id);

    if (notifyIds.length > 0) {
        const users = await User.find({ _id: { $in: notifyIds } });
        await Promise.all(users.map(async (user) => {
            if (user.email) {
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

    revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
    return { id: task._id.toString() };
}

export async function getTasks(workspaceSlug: string, boardSlug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return [];
    }

    // Verify user is a member
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) {
        return [];
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
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
        comments: (task.comments || []).map((c: any) => ({
            id: c._id.toString(),
            content: c.content,
            userId: c.userId._id?.toString() || c.userId.toString(),
            createdAt: c.createdAt.toISOString(),
            user: {
                id: c.userId._id?.toString() || c.userId.toString(),
                name: c.userId.name || '',
                email: c.userId.email || '',
                image: c.userId.image,
            }
        })),
        dueDate: task.dueDate?.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        links: (task.links || []).map((l: any) => ({
            id: l._id?.toString() || Math.random().toString(36).substr(2, 9),
            url: l.url,
            title: l.title || l.url,
        })),
        createdAt: task.createdAt.toISOString(),
    }));
}

export async function getArchivedTasks(workspaceSlug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return [];
    }

    // Check if user is member
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) {
        return [];
    }

    const tasks = await Task.find({
        workspaceId: workspace._id,
        status: 'ARCHIVED'
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
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        comments: (task.comments || []).map((c: any) => ({
            id: c._id.toString(),
            content: c.content,
            userId: c.userId._id?.toString() || c.userId.toString(),
            createdAt: c.createdAt.toISOString(),
            user: {
                id: c.userId._id?.toString() || c.userId.toString(),
                name: c.userId.name || '',
                email: c.userId.email || '',
                image: c.userId.image,
            }
        })),
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

    // Check if user is an assignee
    const isAssignee = task.assignees.some((id: Types.ObjectId) => id.toString() === session.user.id);

    if (!hasRole(member, 'ADMIN', 'EDITOR') && !isAssignee) {
        throw new Error('You do not have permission to update tasks');
    }

    const previousStatus = task.status;
    task.status = newStatus;
    task.order = newOrder;
    await task.save();

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

        // EMAIL NOTIFICATION: Task Moved
        // Notify all members (except the mover)
        const memberIds = workspace.members.map((m: any) => m.userId.toString());
        const notifyIds = memberIds.filter((id: string) => id !== session.user.id);

        if (notifyIds.length > 0) {
            const users = await User.find({ _id: { $in: notifyIds } });
            await Promise.all(users.map(async (user) => {
                if (user.email) {
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
        subtasks?: { id?: string; title: string; completed: boolean }[];
        categoryId?: string | null;
        dueDate?: string | null;
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
        task.subtasks = data.subtasks.map((s) => ({
            _id: (s.id && Types.ObjectId.isValid(s.id)) ? new Types.ObjectId(s.id) : new Types.ObjectId(),
            title: s.title,
            completed: s.completed,
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
            createdBy: s.createdBy
                ? (typeof s.createdBy === 'string' ? new Types.ObjectId(s.createdBy) : s.createdBy)
                : new Types.ObjectId(session.user.id),
        }));
    }
    if (data.categoryId !== undefined) {
        task.categoryId = data.categoryId ? new Types.ObjectId(data.categoryId) : undefined;
    }
    if (data.dueDate !== undefined) {
        task.dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
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
            const memberIds = workspace.members.map((m: any) => m.userId.toString());
            const notifyIds = memberIds.filter((id: string) => id !== session.user.id);

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

            // Find users to notify (all members except the assigner)
            const memberIds = workspace.members.map((m: any) => m.userId.toString());
            const notifyIds = memberIds.filter((id: string) => id !== session.user.id);
            const usersToNotify = await User.find({ _id: { $in: notifyIds } });

            // Get board for URL
            const board = await Board.findById(task.boardId);
            const boardSlug = board?.slug || 'main';

            // Send emails in parallel
            await Promise.all(usersToNotify.map(async (user) => {
                if (user.email) {
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

            // PUSH NOTIFICATION: Notify each NEW assignee
            for (const assigneeId of newAssignees) {
                triggerNotification({
                    title: 'Task assigned to you',
                    body: `${task.title} in ${board?.name || 'a board'}`,
                    url: `/${workspace.slug}/board/${boardSlug}`,
                    workspaceId: workspace._id.toString(),
                });
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

            // EMAIL: Status Change via Edit Modal (duplicate logic from updateTaskPosition, could be refactored)
            const memberIds = workspace.members.map((m: any) => m.userId.toString());
            const notifyIds = memberIds.filter((id: string) => id !== session.user.id);

            if (notifyIds.length > 0) {
                const users = await User.find({ _id: { $in: notifyIds } });
                await Promise.all(users.map(async (user) => {
                    if (user.email) {
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

            // PUSH NOTIFICATION: Status change broadcast to members
            triggerNotification({
                title: 'Task updated',
                body: `${task.title} → ${data.status}`,
                url: `/${workspace.slug}/board/${board.slug}`,
                workspaceId: workspace._id.toString(),
            });
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

    // Log activity before deleting
    const board = await Board.findById(task.boardId);
    if (board) {
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

    await Task.findByIdAndDelete(taskId);

    revalidatePath(`/${workspace.slug}`);
    revalidatePath(`/${workspace.slug}/archive`);
    return { success: true };
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

    // Check if user is member
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) {
        throw new Error('You do not have permission to comment');
    }

    if (!task.comments) {
        task.comments = [];
    }

    task.comments.push({
        content,
        userId: new Types.ObjectId(session.user.id),
        likes: [],
    } as any);

    await task.save();

    // Re-fetch to populate user
    const updatedTask = await Task.findById(taskId).populate('comments.userId', 'name email image');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newComment = (updatedTask?.comments as any[]).pop();

    // Log activity for comment
    const board = await Board.findById(task.boardId);
    if (board) {
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

        // EMAIL NOTIFICATION: New Comment
        // Notify all members (except the commenter)
        const memberIds = workspace.members.map((m: any) => m.userId.toString());
        const notifyIds = memberIds.filter((id: string) => id !== session.user.id);

        if (notifyIds.length > 0) {
            const users = await User.find({ _id: { $in: notifyIds } });
            await Promise.all(users.map(async (user) => {
                if (user.email) {
                    const html = await render(
                        React.createElement(NewCommentEmail, {
                            taskTitle: task.title,
                            commenterName: session.user.name || 'A teammate',
                            commentContent: content,
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

            // PUSH NOTIFICATION: Comment added
            triggerNotification({
                title: 'New comment',
                body: `${session.user.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                url: `/${workspace.slug}/board/${board.slug}`,
                workspaceId: workspace._id.toString(),
            });
        }
    }

    revalidatePath(`/${workspace.slug}`);

    return {
        id: newComment._id.toString(),
        content: newComment.content,
        userId: newComment.userId._id.toString(),
        user: {
            id: newComment.userId._id.toString(),
            name: newComment.userId.name,
            email: newComment.userId.email,
            image: newComment.userId.image,
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

    if (likeIndex > -1) {
        // Unlike - remove user from likes
        comment.likes.splice(likeIndex, 1);
    } else {
        // Like - add user to likes
        comment.likes.push(userIdStr);
    }

    await task.save();

    revalidatePath(`/${workspace.slug}`);
    return { success: true, liked: likeIndex === -1, likesCount: comment.likes.length };
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

    // Find parent comment
    const parentComment = task.comments?.find((c: any) => c._id.toString() === parentCommentId);
    if (!parentComment) {
        throw new Error('Parent comment not found');
    }

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

    // Re-fetch to populate user
    const updatedTask = await Task.findById(taskId).populate('comments.userId', 'name email image');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newComment = (updatedTask?.comments as any[]).find(
        (c: any) => c.parentId?.toString() === parentCommentId && c.content === content
    );

    revalidatePath(`/${workspace.slug}`);

    if (newComment) {
        return {
            id: newComment._id.toString(),
            content: newComment.content,
            userId: newComment.userId._id.toString(),
            user: {
                id: newComment.userId._id.toString(),
                name: newComment.userId.name,
                email: newComment.userId.email,
                image: newComment.userId.image,
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

    if (existingReactionIndex > -1) {
        // Remove reaction if already exists
        comment.reactions.splice(existingReactionIndex, 1);
    } else {
        // Add new reaction
        comment.reactions.push({ emoji, userId: userIdStr });
    }

    await task.save();

    revalidatePath(`/${workspace.slug}`);
    return { success: true, reactions: comment.reactions };
}

// Helper function to extract @mentions from content
function extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+(?:\s\w+)*)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[1]);
    }
    return mentions;
}

// Get workspace members for @mention autocomplete
export async function getWorkspaceMembers(workspaceSlug: string) {
    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug }).populate('members.userId', 'name email image');
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    return workspace.members.map((m: any) => ({
        id: m.userId._id.toString(),
        name: m.userId.name,
        email: m.userId.email,
        image: m.userId.image,
    }));
}
