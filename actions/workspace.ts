'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Workspace } from '@/models/Workspace';
import { User } from '@/models/User';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';
import { Types } from 'mongoose';

export async function createWorkspace(data: { name: string; slug: string }) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    // Check if slug is taken
    const existing = await Workspace.findOne({ slug: data.slug });
    if (existing) {
        throw new Error('Workspace slug already taken');
    }

    const workspace = await Workspace.create({
        name: data.name,
        slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
        ownerId: session.user.id,
        inviteCode: nanoid(10),
        settings: {
            publicAccess: false,
        },
        members: [
            {
                userId: session.user.id,
                role: 'ADMIN',
                joinedAt: new Date(),
            },
        ],
    });

    revalidatePath('/dashboard');
    return { slug: workspace.slug };
}

export async function getWorkspaces() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    await connectDB();

    const workspaces = await Workspace.find({
        'members.userId': session.user.id,
    })
        .select('name slug settings')
        .lean();

    return workspaces.map((w) => ({
        id: w._id.toString(),
        name: w.name,
        slug: w.slug,
        publicAccess: w.settings?.publicAccess || false,
    }));
}

export async function getWorkspaceBySlug(slug: string) {
    await connectDB();

    const workspace = await Workspace.findOne({ slug })
        .populate('members.userId', 'name email image')
        .lean();

    if (!workspace) {
        return null;
    }

    return {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        ownerId: workspace.ownerId.toString(),
        publicAccess: workspace.settings?.publicAccess || false,
        members: workspace.members.map((m: {
            userId: { _id: { toString: () => string }; name: string; email: string; image?: string } | { toString: () => string };
            role: string;
        }) => ({
            userId: typeof m.userId === 'object' && '_id' in m.userId ? m.userId._id.toString() : m.userId.toString(),
            role: m.role,
            user: typeof m.userId === 'object' && 'name' in m.userId ? {
                name: m.userId.name,
                email: m.userId.email,
                image: m.userId.image,
            } : null,
        })),
        inviteCode: workspace.inviteCode,
    };
}

export async function updateWorkspaceSettings(
    slug: string,
    settings: { publicAccess?: boolean }
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if user is owner (only owner can modify settings)
    const member = workspace.members.find(
        (m: { userId: { toString: () => string }; role: string }) => m.userId.toString() === session.user.id
    );
    if (!member || member.role !== 'ADMIN') {
        throw new Error('Only the workspace admin can modify settings');
    }

    if (settings.publicAccess !== undefined) {
        workspace.settings.publicAccess = settings.publicAccess;
    }

    await workspace.save();
    revalidatePath(`/${slug}`);

    return { success: true };
}

export async function addViewerToWorkspace(slug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if already a member
    const isMember = workspace.members.some(
        (m: { userId: { toString: () => string } }) => m.userId.toString() === session.user.id
    );

    if (isMember) {
        return { success: true };
    }

    // Add as viewer
    workspace.members.push({
        userId: new Types.ObjectId(session.user.id),
        role: 'VIEWER',
        joinedAt: new Date(),
    });

    await workspace.save();
    revalidatePath(`/${slug}`);

    return { success: true };
}

export async function updateMemberRole(slug: string, memberId: string, newRole: 'EDITOR' | 'VIEWER') {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if requester is OWNER
    const requester = workspace.members.find(
        (m: { userId: { toString: () => string }; role: string }) => m.userId.toString() === session.user.id
    );

    if (!requester || requester.role !== 'ADMIN') {
        throw new Error('Only the workspace admin can update member roles');
    }

    // Find the member to update
    const memberIndex = workspace.members.findIndex(
        (m: { userId: { toString: () => string } }) => m.userId.toString() === memberId
    );

    if (memberIndex === -1) {
        throw new Error('Member not found');
    }

    // Prevent changing owner's role
    if (workspace.members[memberIndex].userId.toString() === workspace.ownerId.toString()) {
        throw new Error('Cannot change owner role');
    }

    workspace.members[memberIndex].role = newRole;
    await workspace.save();
    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/team`);

    return { success: true };
}

export async function removeMember(slug: string, memberId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if requester is OWNER
    const requester = workspace.members.find(
        (m: { userId: { toString: () => string }; role: string }) => m.userId.toString() === session.user.id
    );

    if (!requester || requester.role !== 'ADMIN') {
        throw new Error('Only the workspace admin can remove members');
    }

    // Prevent removing owner
    if (memberId === workspace.ownerId.toString()) {
        throw new Error('Cannot remove workspace owner');
    }

    workspace.members = workspace.members.filter(
        (m: { userId: { toString: () => string } }) => m.userId.toString() !== memberId
    );

    await workspace.save();
    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/team`);

    return { success: true };
}
