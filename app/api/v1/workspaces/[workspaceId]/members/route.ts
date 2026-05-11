import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import { Workspace, User } from '@/models';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';
import { nanoid } from 'nanoid';

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

    const populated = await Workspace.findById(workspaceId)
        .populate('members.userId', 'name email image')
        .lean();

    return NextResponse.json({
        members: populated.members.map((m: { userId: { _id: { toString: () => string }; name: string; email: string; image?: string }; role: string }) => ({
            userId: m.userId._id.toString(),
            role: m.role,
            user: {
                name: m.userId.name,
                email: m.userId.email,
                image: m.userId.image,
            },
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
    if (!hasRole(member, 'ADMIN')) {
        return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    // Invite by email
    const email = body.email;
    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const invitee = await User.findOne({ email });
    if (!invitee) {
        return NextResponse.json({ error: 'User not found. They must have a Flux account.' }, { status: 404 });
    }

    const alreadyMember = workspace.members.find(
        (m: { userId: { toString: () => string } }) => m.userId.toString() === invitee._id.toString()
    );
    if (alreadyMember) {
        return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    workspace.members.push({
        userId: invitee._id,
        role: body.role || 'EDITOR',
        joinedAt: new Date(),
    });
    await workspace.save();

    return NextResponse.json({ success: true, userId: invitee._id.toString(), role: body.role || 'EDITOR' });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; userId: string }> }
) {
    const auth = await verifyApiKey(request);
    if (!auth) {
        return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
    }

    const { workspaceId, userId } = await params;
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

    const target = workspace.members.find(
        (m: { userId: { toString: () => string } }) => m.userId.toString() === userId
    );
    if (!target) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (target.userId.toString() === workspace.ownerId.toString()) {
        return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 });
    }

    target.role = body.role;
    await workspace.save();

    return NextResponse.json({ success: true });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; userId: string }> }
) {
    const auth = await verifyApiKey(request);
    if (!auth) {
        return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
    }

    const { workspaceId, userId } = await params;
    await connectDB();

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const member = isWorkspaceMember(workspace, auth.user.id);
    if (!hasRole(member, 'ADMIN')) {
        return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    if (userId === workspace.ownerId.toString()) {
        return NextResponse.json({ error: 'Cannot remove workspace owner' }, { status: 400 });
    }

    workspace.members = workspace.members.filter(
        (m: { userId: { toString: () => string } }) => m.userId.toString() !== userId
    );
    await workspace.save();

    return NextResponse.json({ success: true });
}