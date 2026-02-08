'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, TaskStatus, TaskPriority } from '@/models/Task';
import { Types } from 'mongoose';
import { Workspace } from '@/models/Workspace';
import { Board } from '@/models/Board';
import { revalidatePath } from 'next/cache';

interface CreateTaskData {
    title: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
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
    const member = workspace.members.find(
        (m: { userId: { toString: () => string }; role: string }) => m.userId.toString() === session.user.id
    );
    if (!member || !['ADMIN', 'EDITOR'].includes(member.role)) {
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

    const newOrder = (highestOrder?.order ?? 0) + 1000;

    const task = await Task.create({
        workspaceId: workspace._id,
        boardId: board._id,
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'BACKLOG',
        order: newOrder,
        assignees: [session.user.id],
        subtasks: [],
    });

    revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
    return { id: task._id.toString() };
}

export async function getTasks(workspaceSlug: string, boardSlug: string) {
    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return [];
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        return [];
    }

    const tasks = await Task.find({ boardId: board._id })
        .populate('assignees', 'name email image')
        .populate('comments.userId', 'name email image')
        .sort({ order: 1 })
        .lean();

    return tasks.map((task) => ({
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
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
    const isMember = workspace.members.some(
        (m: { userId: { toString: () => string } }) => m.userId.toString() === session.user.id
    );
    if (!isMember) {
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

    // Check role - ADMIN, EDITOR, or ASSIGNEE can update task positions
    const member = workspace.members.find(
        (m: { userId: { toString: () => string }; role: string }) => m.userId.toString() === session.user.id
    );

    // Check if user is an assignee
    const isAssignee = task.assignees.some((id: Types.ObjectId) => id.toString() === session.user.id);

    if ((!member || !['ADMIN', 'EDITOR'].includes(member.role)) && !isAssignee) {
        throw new Error('You do not have permission to update tasks');
    }

    task.status = newStatus;
    task.order = newOrder;
    await task.save();

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
    const member = workspace.members.find(
        (m: { userId: { toString: () => string }; role: string }) => m.userId.toString() === session.user.id
    );

    // Check if user is an assignee
    const isAssignee = task.assignees.some((id: Types.ObjectId) => id.toString() === session.user.id);

    if ((!member || !['ADMIN', 'EDITOR'].includes(member.role)) && !isAssignee) {
        throw new Error('You do not have permission to update tasks');
    }

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
        }));
    }

    await task.save();

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
    const member = workspace.members.find(
        (m: { userId: { toString: () => string }; role: string }) => m.userId.toString() === session.user.id
    );
    if (!member || !['ADMIN', 'EDITOR'].includes(member.role)) {
        throw new Error('You do not have permission to delete tasks');
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
    const isMember = workspace.members.some(
        (m: { userId: { toString: () => string } }) => m.userId.toString() === session.user.id
    );
    if (!isMember) {
        throw new Error('You do not have permission to comment');
    }

    task.comments.push({
        content,
        userId: new Types.ObjectId(session.user.id),
    } as any);

    await task.save();

    // Re-fetch to populate user
    const updatedTask = await Task.findById(taskId).populate('comments.userId', 'name email image');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newComment = (updatedTask?.comments as any[]).pop();

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

    // Find comment to check ownership
    const comment = task.comments.find((c: any) => c._id.toString() === commentId);
    if (!comment) {
        throw new Error('Comment not found');
    }

    // Allow author or admin to delete
    const isAuthor = comment.userId.toString() === session.user.id;
    const member = workspace.members.find(
        (m: { userId: { toString: () => string }; role: string }) => m.userId.toString() === session.user.id
    );
    const isAdmin = member?.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
        throw new Error('You do not have permission to delete this comment');
    }

    // Remove comment
    task.comments = task.comments.filter((c: any) => c._id.toString() !== commentId);
    await task.save();

    revalidatePath(`/${workspace.slug}`);
    return { success: true };
}
