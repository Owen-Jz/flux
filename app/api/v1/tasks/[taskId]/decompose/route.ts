import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import { Task, Board, Workspace } from '@/models';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';
import { createMinimaxClient } from '@/lib/llm/client';

export async function POST(
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

    const board = await Board.findById(task.boardId);
    if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const minimaxClient = createMinimaxClient();
    const result = await minimaxClient.decomposesTask({
        taskTitle: task.title,
        taskDescription: task.description || '',
        contextLinks: body.contextLinks,
        maxSubtasks: body.maxSubtasks,
    });

    task.summary = result.summary;
    task.isDecomposedTask = true;
    task.subtasks = result.subtasks.map((s) => ({
        title: s.title,
        completed: false,
    }));
    await task.save();

    const subtasks = await Task.find({ parentTaskId: task._id });

    return NextResponse.json({
        taskId: task._id.toString(),
        summary: result.summary,
        subtasks: result.subtasks,
        createdSubtasks: subtasks.length,
    });
}