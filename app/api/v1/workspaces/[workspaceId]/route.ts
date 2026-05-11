import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import { Workspace } from '@/models';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';

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

    return NextResponse.json({
        workspace: {
            id: workspace._id.toString(),
            name: workspace.name,
            slug: workspace.slug,
            ownerId: workspace.ownerId.toString(),
            publicAccess: workspace.settings?.publicAccess || false,
            accentColor: workspace.settings?.accentColor,
            icon: workspace.settings?.icon,
            members: workspace.members.map((m: { userId: { toString: () => string }; role: string }) => ({
                userId: m.userId.toString(),
                role: m.role,
            })),
            createdAt: workspace.createdAt.toISOString(),
        },
    });
}

export async function PATCH(
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
    if (!hasRole(member, 'ADMIN')) {
        return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    const allowed = ['name', 'slug', 'accentColor', 'icon', 'publicAccess'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
        if (body[key] !== undefined) {
            if (key === 'publicAccess') {
                update['settings.publicAccess'] = body[key];
            } else if (key === 'accentColor') {
                update['settings.accentColor'] = body[key];
            } else if (key === 'icon') {
                update['settings.icon'] = body[key];
            } else {
                update[key] = body[key];
            }
        }
    }

    await Workspace.findByIdAndUpdate(workspaceId, { $set: update });
    return NextResponse.json({ success: true });
}