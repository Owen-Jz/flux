import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import { Task, Board, Workspace } from '@/models';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    const auth = await verifyApiKey(request);
    if (!auth) {
        return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
    }

    const { taskId } = await params;
    await connectDB();

    const task = await Task.findById(taskId).lean();
    if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const workspace = await Workspace.findById(task.workspaceId).lean();
    if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const member = isWorkspaceMember(workspace, auth.user.id);
    if (!member) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ task });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    const auth = await verifyApiKey(request);
    if (!auth) {
        return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await request.json();
    await connectDB();

    const task = await Task.findById(taskId);
    if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const workspace = await Workspace.findById(task.workspaceId);
    if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const member = isWorkspaceMember(workspace, auth.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        return NextResponse.json({ error: 'Editor role required' }, { status: 403 });
    }

    const allowed = ['title', 'description', 'status', 'priority', 'assignees', 'tags', 'dueDate', 'order'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
        if (body[key] !== undefined) {
            if (key === 'dueDate') {
                update[key] = body[key] ? new Date(body[key]) : null;
            } else {
                update[key] = body[key];
            }
        }
    }

    await Task.findByIdAndUpdate(taskId, { $set: update });
    return NextResponse.json({ success: true });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    const auth = await verifyApiKey(request);
    if (!auth) {
        return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
    }

    const { taskId } = await params;
    await connectDB();

    const task = await Task.findById(taskId);
    if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const workspace = await Workspace.findById(task.workspaceId);
    if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const member = isWorkspaceMember(workspace, auth.user.id);
    if (!hasRole(member, 'ADMIN')) {
        return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    await Task.findByIdAndDelete(taskId);
    return NextResponse.json({ success: true });
}