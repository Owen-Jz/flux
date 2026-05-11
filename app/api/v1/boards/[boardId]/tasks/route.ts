import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import { Task, Board, Workspace } from '@/models';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    const auth = await verifyApiKey(request);
    if (!auth) {
        return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
    }

    const { boardId } = await params;
    await connectDB();

    const board = await Board.findById(boardId).lean();
    if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const workspace = await Workspace.findById(board.workspaceId).lean();
    if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const member = isWorkspaceMember(workspace, auth.user.id);
    if (!member) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const tasks = await Task.find({ boardId }).sort({ order: 1 }).lean();

    return NextResponse.json({
        tasks: tasks.map((t) => ({
            id: t._id.toString(),
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            boardId: t.boardId.toString(),
            workspaceId: t.workspaceId.toString(),
            order: t.order,
            assignees: t.assignees.map((a) => a.toString()),
            tags: t.tags,
            dueDate: t.dueDate?.toISOString() || null,
            subtasks: t.subtasks,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
        })),
    });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    const auth = await verifyApiKey(request);
    if (!auth) {
        return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
    }

    const { boardId } = await params;
    const body = await request.json();
    await connectDB();

    const board = await Board.findById(boardId);
    if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const workspace = await Workspace.findById(board.workspaceId);
    if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const member = isWorkspaceMember(workspace, auth.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        return NextResponse.json({ error: 'Editor role required' }, { status: 403 });
    }

    const task = await Task.create({
        workspaceId: board.workspaceId,
        boardId,
        title: body.title,
        description: body.description,
        status: body.status || 'BACKLOG',
        priority: body.priority || 'MEDIUM',
        order: body.order ?? 0,
        assignees: body.assignees || [],
        tags: body.tags || [],
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        subtasks: body.subtasks || [],
    });

    return NextResponse.json({ task: { id: task._id.toString(), title: task.title, status: task.status } }, { status: 201 });
}