import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import { Task, Workspace } from '@/models';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';

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

    const oldStatus = task.status;
    const newStatus = body.status;

    await Task.findByIdAndUpdate(taskId, { $set: { status: newStatus } });

    return NextResponse.json({
        success: true,
        task: {
            id: task._id.toString(),
            oldStatus,
            newStatus,
        },
    });
}