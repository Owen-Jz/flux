// app/api/ai/plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Board } from '@/models/Board';
import { Workspace } from '@/models/Workspace';
import { isWorkspaceMember } from '@/lib/workspace-utils';
import { createMinimaxClient } from '@/lib/llm/client';
import type { AIPlanRequest, AIPlan } from '@/types/ai-plan';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let body: AIPlanRequest;
    try {
        body = await request.json() as AIPlanRequest;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { description, scale, boardId, workspaceSlug, deadline, contextLinks, maxTasksPerBoard } = body;

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
        return NextResponse.json(
            { error: 'description must be at least 10 characters' },
            { status: 400 }
        );
    }
    if (scale !== 'board' && scale !== 'project') {
        return NextResponse.json({ error: 'scale must be "board" or "project"' }, { status: 400 });
    }
    if (!workspaceSlug) {
        return NextResponse.json({ error: 'workspaceSlug is required' }, { status: 400 });
    }
    if (scale === 'board' && !boardId) {
        return NextResponse.json({ error: 'boardId is required for board scale' }, { status: 400 });
    }

    await connectDB();

    // Verify workspace membership
    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For board scale, verify the board exists in this workspace
    if (scale === 'board' && boardId) {
        const board = await Board.findOne({ _id: boardId, workspaceId: workspace._id });
        if (!board) {
            return NextResponse.json({ error: 'Board not found' }, { status: 404 });
        }
    }

    try {
        const client = createMinimaxClient();
        const llmResult = await client.planProject({
            description: description.trim(),
            scale,
            deadline,
            contextLinks,
            maxTasksPerBoard: maxTasksPerBoard ?? 10,
        });

        // Normalise priority from title-case (LLM output) to uppercase (app convention)
        const normalisePriority = (p: string): 'LOW' | 'MEDIUM' | 'HIGH' => {
            const map: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
                Low: 'LOW', Medium: 'MEDIUM', High: 'HIGH',
                low: 'LOW', medium: 'MEDIUM', high: 'HIGH',
                LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH',
            };
            return map[p] ?? 'MEDIUM';
        };

        const plan: AIPlan = {
            type: scale,
            title: llmResult.title,
            summary: llmResult.summary,
        };

        if (scale === 'board' && llmResult.tasks) {
            plan.tasks = llmResult.tasks.map(t => ({
                title: t.title,
                description: t.description,
                priority: normalisePriority(t.priority),
                estimatedHours: t.estimatedHours,
            }));
        } else if (scale === 'project' && llmResult.boards) {
            plan.boards = llmResult.boards.map(b => ({
                name: b.name,
                description: b.description,
                tasks: b.tasks.map(t => ({
                    title: t.title,
                    description: t.description,
                    priority: normalisePriority(t.priority),
                    estimatedHours: t.estimatedHours,
                })),
            }));
        }

        return NextResponse.json(plan);
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Planning failed';
        if (msg.includes('timed out')) {
            return NextResponse.json({ error: 'Request timed out — please try again' }, { status: 504 });
        }
        return NextResponse.json({ error: msg }, { status: 502 });
    }
}
