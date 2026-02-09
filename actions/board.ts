'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Board } from '@/models/Board';
import { Workspace } from '@/models/Workspace';
import { revalidatePath } from 'next/cache';
import { Types } from 'mongoose';

interface CreateBoardData {
    name: string;
    description?: string;
    color?: string;
}

export async function createBoard(workspaceSlug: string, data: CreateBoardData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check membership and role
    const member = workspace.members.find(
        (m: { userId: { toString: () => string }; role: string }) => m.userId.toString() === session.user.id
    );
    // Only ADMIN and EDITOR can create boards
    if (!member || !['ADMIN', 'EDITOR'].includes(member.role)) {
        throw new Error('You do not have permission to create boards');
    }

    // Generate slug from name
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if board with this slug exists in this workspace
    const existing = await Board.findOne({ workspaceId: workspace._id, slug });
    if (existing) {
        throw new Error('A board with this name already exists');
    }

    const board = await Board.create({
        workspaceId: workspace._id,
        name: data.name,
        slug,
        description: data.description,
        color: data.color || '#6366f1',
    });

    revalidatePath(`/${workspaceSlug}`);
    return { id: board._id.toString(), slug: board.slug };
}

export async function getBoards(workspaceSlug: string) {
    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return [];
    }

    const boards = await Board.find({ workspaceId: workspace._id })
        .sort({ createdAt: 1 })
        .lean();

    return boards.map((board) => ({
        id: board._id.toString(),
        name: board.name,
        slug: board.slug,
        description: board.description,
        color: board.color,
    }));
}

export async function getBoardCategories(workspaceSlug: string, boardSlug: string) {
    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return [];
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        return [];
    }

    return (board.categories || []).map((c: any) => ({
        id: c._id.toString(),
        name: c.name,
        color: c.color,
    }));
}

export async function getBoardBySlug(workspaceSlug: string, boardSlug: string) {
    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return null;
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        return null;
    }

    return {
        id: board._id.toString(),
        name: board.name,
        slug: board.slug,
        description: board.description,
        color: board.color,
        categories: (board.categories || []).map((c: any) => ({
            id: c._id.toString(),
            name: c.name,
            color: c.color,
        })),
    };
}

export async function updateBoard(
    workspaceSlug: string,
    boardSlug: string,
    data: { name?: string; description?: string; color?: string }
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Only ADMIN and EDITOR can update boards
    const member = workspace.members.find(
        (m: { userId: { toString: () => string }; role: string }) => m.userId.toString() === session.user.id
    );
    if (!member || !['ADMIN', 'EDITOR'].includes(member.role)) {
        throw new Error('You do not have permission to update boards');
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        throw new Error('Board not found');
    }

    if (data.name !== undefined) board.name = data.name;
    if (data.description !== undefined) board.description = data.description;
    if (data.color !== undefined) board.color = data.color;

    await board.save();

    revalidatePath(`/${workspaceSlug}`);
    revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
    return { success: true };
}

export async function deleteBoard(workspaceSlug: string, boardSlug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Only ADMIN can delete boards
    const member = workspace.members.find(
        (m: { userId: { toString: () => string }; role: string }) => m.userId.toString() === session.user.id
    );
    if (!member || member.role !== 'ADMIN') {
        throw new Error('Only the workspace admin can delete boards');
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        throw new Error('Board not found');
    }

    // Note: You may want to also delete or archive tasks associated with this board
    await Board.findByIdAndDelete(board._id);

    revalidatePath(`/${workspaceSlug}`);
    revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
    return { success: true };
}

export async function addCategory(
    workspaceSlug: string,
    boardSlug: string,
    data: { name: string; color: string }
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Only ADMIN and EDITOR can manage categories
    const member = workspace.members.find(
        (m: { userId: { toString: () => string }; role: string }) => m.userId.toString() === session.user.id
    );
    if (!member || !['ADMIN', 'EDITOR'].includes(member.role)) {
        throw new Error('You do not have permission to manage categories');
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        throw new Error('Board not found');
    }

    if (!board.categories) {
        board.categories = [];
    }

    board.categories.push({
        _id: new Types.ObjectId(),
        name: data.name,
        color: data.color,
    });

    await board.save();

    revalidatePath(`/${workspaceSlug}`);
    revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
    const newCategory = board.categories[board.categories.length - 1];
    return { id: newCategory._id.toString(), name: newCategory.name, color: newCategory.color };
}

export async function deleteCategory(workspaceSlug: string, boardSlug: string, categoryId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    const member = workspace.members.find(
        (m: { userId: { toString: () => string }; role: string }) => m.userId.toString() === session.user.id
    );
    if (!member || !['ADMIN', 'EDITOR'].includes(member.role)) {
        throw new Error('You do not have permission to manage categories');
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        throw new Error('Board not found');
    }

    if (!board.categories) {
        board.categories = [];
    }
    board.categories = board.categories.filter((c: any) => c._id.toString() !== categoryId);
    await board.save();

    revalidatePath(`/${workspaceSlug}`);
    revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
    return { success: true };
}

export async function updateCategory(
    workspaceSlug: string,
    boardSlug: string,
    categoryId: string,
    data: { name?: string; color?: string }
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    const member = workspace.members.find(
        (m: { userId: { toString: () => string }; role: string }) => m.userId.toString() === session.user.id
    );
    if (!member || !['ADMIN', 'EDITOR'].includes(member.role)) {
        throw new Error('You do not have permission to manage categories');
    }

    const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
    if (!board) {
        throw new Error('Board not found');
    }

    if (!board.categories) {
        throw new Error('Category not found');
    }

    const category = board.categories.find((c: any) => c._id.toString() === categoryId);
    if (!category) {
        throw new Error('Category not found');
    }

    if (data.name) category.name = data.name;
    if (data.color) category.color = data.color;

    await board.save();

    revalidatePath(`/${workspaceSlug}`);
    revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
    return { success: true };
}
