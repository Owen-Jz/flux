import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import { Board, Workspace } from '@/models';
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

    return NextResponse.json({
        board: {
            id: board._id.toString(),
            name: board.name,
            slug: board.slug,
            color: board.color,
            icon: board.icon,
            description: board.description,
            categories: board.categories,
            workspaceId: board.workspaceId.toString(),
        },
    });
}

export async function PATCH(
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

    const allowed = ['name', 'slug', 'color', 'icon', 'description', 'categories'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
        if (body[key] !== undefined) {
            update[key] = body[key];
        }
    }

    await Board.findByIdAndUpdate(boardId, { $set: update });
    return NextResponse.json({ success: true });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    const auth = await verifyApiKey(request);
    if (!auth) {
        return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
    }

    const { boardId } = await params;
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
    if (!hasRole(member, 'ADMIN')) {
        return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    await Board.findByIdAndDelete(boardId);
    return NextResponse.json({ success: true });
}