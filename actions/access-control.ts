'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Workspace, MemberRole } from '@/models/Workspace';
import { AccessRequest } from '@/models/AccessRequest';
import { revalidatePath } from 'next/cache';
import { Types } from 'mongoose';

/**
 * Request edit access to a workspace
 * Only viewers can request edit access
 */
export async function requestEditAccess(workspaceSlug: string, message?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if user is a member
    const member = workspace.members.find(
        (m: any) => m.userId.toString() === session.user.id
    );

    // If already an EDITOR or ADMIN, no need to request
    if (member && ['ADMIN', 'EDITOR'].includes(member.role)) {
        throw new Error('You already have edit access');
    }

    // Check if there's already a pending request
    const existingRequest = await AccessRequest.findOne({
        workspaceId: workspace._id,
        userId: session.user.id,
        status: 'PENDING',
    });

    if (existingRequest) {
        throw new Error('You already have a pending request');
    }

    // If not a member at all, add them as a viewer first
    if (!member) {
        workspace.members.push({
            userId: new Types.ObjectId(session.user.id),
            role: 'VIEWER',
            joinedAt: new Date(),
        });
        await workspace.save();
    }

    // Create access request
    await AccessRequest.create({
        workspaceId: workspace._id,
        userId: session.user.id,
        requestedRole: 'EDITOR',
        status: 'PENDING',
        message,
    });

    revalidatePath(`/${workspaceSlug}/team`);
    return { success: true };
}

/**
 * Get pending access requests for a workspace
 * Only OWNER can view requests
 */
export async function getAccessRequests(workspaceSlug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return [];
    }

    // Check if user is the owner
    const member = workspace.members.find(
        (m: any) => m.userId.toString() === session.user.id
    );

    if (!member || member.role !== 'ADMIN') {
        return [];
    }

    const requests = await AccessRequest.find({
        workspaceId: workspace._id,
        status: 'PENDING',
    })
        .populate('userId', 'name email image')
        .sort({ createdAt: -1 })
        .lean();

    return requests.map((req: any) => ({
        id: req._id.toString(),
        user: {
            id: req.userId._id.toString(),
            name: req.userId.name,
            email: req.userId.email,
            image: req.userId.image,
        },
        requestedRole: req.requestedRole,
        message: req.message,
        createdAt: req.createdAt.toISOString(),
    }));
}

/**
 * Approve or deny an access request
 * Only OWNER can approve/deny requests
 */
export async function handleAccessRequest(
    requestId: string,
    action: 'approve' | 'deny'
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const request = await AccessRequest.findById(requestId);
    if (!request) {
        throw new Error('Request not found');
    }

    const workspace = await Workspace.findById(request.workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if user is the owner
    const member = workspace.members.find(
        (m: any) => m.userId.toString() === session.user.id
    );

    if (!member || member.role !== 'ADMIN') {
        throw new Error('Only the workspace admin can approve requests');
    }

    // Update request status
    request.status = action === 'approve' ? 'APPROVED' : 'DENIED';
    request.reviewedBy = new Types.ObjectId(session.user.id);
    request.reviewedAt = new Date();
    await request.save();

    // If approved, update member role
    if (action === 'approve') {
        const memberToUpdate = workspace.members.find(
            (m: any) => m.userId.toString() === request.userId.toString()
        );

        if (memberToUpdate) {
            memberToUpdate.role = request.requestedRole;
            await workspace.save();
        }
    }

    revalidatePath(`/${workspace.slug}/team`);
    return { success: true };
}

/**
 * Update a member's role in the workspace
 * Only OWNER can update roles
 */
export async function updateMemberRole(
    workspaceSlug: string,
    memberId: string,
    newRole: MemberRole
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if user is the owner
    const currentMember = workspace.members.find(
        (m: any) => m.userId.toString() === session.user.id
    );

    if (!currentMember || currentMember.role !== 'ADMIN') {
        throw new Error('Only the workspace admin can update member roles');
    }

    // Cannot change the owner's role
    if (memberId === workspace.ownerId.toString()) {
        throw new Error('Cannot change the owner\'s role');
    }

    // Find and update the member
    const memberToUpdate = workspace.members.find(
        (m: any) => m.userId.toString() === memberId
    );

    if (!memberToUpdate) {
        throw new Error('Member not found');
    }

    memberToUpdate.role = newRole;
    await workspace.save();

    revalidatePath(`/${workspaceSlug}/team`);
    return { success: true };
}

/**
 * Remove a member from the workspace
 * Only OWNER can remove members
 */
export async function removeMember(workspaceSlug: string, memberId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if user is the owner
    const currentMember = workspace.members.find(
        (m: any) => m.userId.toString() === session.user.id
    );

    if (!currentMember || currentMember.role !== 'ADMIN') {
        throw new Error('Only the workspace admin can remove members');
    }

    // Cannot remove the owner
    if (memberId === workspace.ownerId.toString()) {
        throw new Error('Cannot remove the workspace owner');
    }

    workspace.members = workspace.members.filter(
        (m: any) => m.userId.toString() !== memberId
    );
    await workspace.save();

    revalidatePath(`/${workspaceSlug}/team`);
    return { success: true };
}

/**
 * Delete a workspace
 * Only OWNER can delete the workspace
 */
export async function deleteWorkspace(workspaceSlug: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if user is the owner
    if (workspace.ownerId.toString() !== session.user.id) {
        throw new Error('Only the workspace owner can delete the workspace');
    }

    // Delete all access requests for this workspace
    await AccessRequest.deleteMany({ workspaceId: workspace._id });

    // Delete the workspace
    await Workspace.deleteOne({ _id: workspace._id });

    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * Check user's role in a workspace
 */
export async function getUserRole(workspaceSlug: string): Promise<MemberRole | null> {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return null;
    }

    const member = workspace.members.find(
        (m: any) => m.userId.toString() === session.user.id
    );

    return member?.role || null;
}

/**
 * Check if user has a pending access request
 */
export async function hasPendingRequest(workspaceSlug: string): Promise<boolean> {
    const session = await auth();
    if (!session?.user?.id) {
        return false;
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return false;
    }

    const request = await AccessRequest.findOne({
        workspaceId: workspace._id,
        userId: session.user.id,
        status: 'PENDING',
    });

    return !!request;
}
