import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import { Board, Workspace } from '@/models';
import { User } from '@/models/User';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';
import { boardVisibilityFilter } from '@/lib/board-access';
import { canCreateProject } from '@/lib/plan-limits';
import type { PlanType } from '@/lib/types/billing';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    const auth = await verifyApiKey(request);
    if (!auth) {
        return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
    }

    const { workspaceId } = await params;
    await connectDB();

    const workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const member = isWorkspaceMember(workspace, auth.user.id);
    if (!member) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Restrict to boards the authenticated key's user is allowed to see.
    const boards = await Board.find({
        workspaceId,
        ...boardVisibilityFilter(auth.user.id, member),
    }).select('name slug color icon description categories').lean();

    return NextResponse.json({
        boards: boards.map((b) => ({
            id: b._id.toString(),
            name: b.name,
            slug: b.slug,
            color: b.color,
            icon: b.icon,
            description: b.description,
            categories: b.categories,
        })),
    });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    const auth = await verifyApiKey(request);
    if (!auth) {
        return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
    }

    const { workspaceId } = await params;
    const body = await request.json();
    await connectDB();

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const member = isWorkspaceMember(workspace, auth.user.id);
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        return NextResponse.json({ error: 'Editor role required' }, { status: 403 });
    }

    // Enforce plan board limits
    const user = await User.findById(auth.user.id).select('plan');
    const currentBoardCount = await Board.countDocuments({ workspaceId });
    if (!canCreateProject(((user?.plan as PlanType) || 'free'), currentBoardCount)) {
        return NextResponse.json(
            { error: 'Board limit reached for your current plan. Please upgrade to create more boards.' },
            { status: 403 }
        );
    }

    const board = await Board.create({
        workspaceId,
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
        color: body.color || '#7E3BE9',
        icon: body.icon,
        description: body.description,
        categories: body.categories || [],
    });

    return NextResponse.json({ board: { id: board._id.toString(), name: board.name, slug: board.slug } }, { status: 201 });
}