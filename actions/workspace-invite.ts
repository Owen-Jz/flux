'use server';

import { after } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Workspace, IMember } from '@/models/Workspace';
import { User } from '@/models/User';
import { WorkspaceInvite } from '@/models/WorkspaceInvite';
import { revalidatePath } from 'next/cache';
import { canAddMember, getUpgradeMessage } from '@/lib/plan-limits';
import { resolveWorkspacePlan } from '@/lib/workspace-plan';
import { sendWorkspaceInviteEmail, sendExistingUserJoinEmail } from '@/lib/email/workspace-invite';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';
import { trackEvent } from '@/lib/track';

function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function inviteMemberToWorkspace(slug: string, email: string, role: 'VIEWER' | 'EDITOR' | 'ADMIN' = 'VIEWER') {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized' };
        }

        await connectDB();

        const workspace = await Workspace.findOne({ slug });
        if (!workspace) {
            return { error: 'Workspace not found' };
        }

        const inviter = isWorkspaceMember(workspace, session.user.id);

        if (!hasRole(inviter, 'ADMIN')) {
            return { error: 'Only the workspace admin can invite members' };
        }

        // The inviter's name is still used for the invite emails below; the
        // member cap, however, is governed by the workspace OWNER's plan.
        const inviterUser = await User.findById(session.user.id).select('name');
        const plan = await resolveWorkspacePlan(workspace.ownerId);
        const currentMemberCount = workspace.members.length;

        if (!canAddMember(plan, currentMemberCount)) {
            return { error: getUpgradeMessage(plan, 'members') };
        }

        const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
        });

        if (user) {
            // Check if already a member
            const isMember = workspace.members.some(
                (m: IMember) => m.userId.toString() === user._id.toString()
            );
            if (isMember) {
                return { error: 'User is already a member of this workspace' };
            }

            // Check for an existing pending invite
            const existingInvite = await WorkspaceInvite.findOne({
                email: user.email,
                workspaceId: workspace._id,
                expiresAt: { $gt: new Date() },
            });
            if (existingInvite) {
                return { error: 'An invitation has already been sent to this email' };
            }

            // Create consent-gated invite — they must click the join link to be added
            const inviteToken = generateInviteToken();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await WorkspaceInvite.create({
                email: user.email,
                workspaceId: workspace._id,
                workspaceSlug: workspace.slug,
                workspaceName: workspace.name,
                invitedBy: session.user.id,
                role,
                token: inviteToken,
                expiresAt,
                requiresAcceptance: true,
            });

            await sendExistingUserJoinEmail({
                to: user.email,
                invitedByName: inviterUser?.name || 'A team member',
                workspaceName: workspace.name,
                inviteToken,
            });

            revalidatePath(`/${slug}/team`);
            // First-party funnel: teammate invited (existing Flux user).
            after(() =>
                trackEvent({
                    event: 'member_invited',
                    userId: session.user.id,
                    workspaceId: workspace._id.toString(),
                    metadata: { role, targetExists: true },
                })
            );
            return { success: true, message: 'Invitation sent! They will receive an email to join the workspace.' };
        }

        // User doesn't exist - create pending invite and send email
        // Check for existing pending invite
        const existingInvite = await WorkspaceInvite.findOne({
            email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') },
            workspaceId: workspace._id,
            expiresAt: { $gt: new Date() },
        });

        if (existingInvite) {
            return { error: 'An invitation has already been sent to this email' };
        }

        // Create invite token
        const inviteToken = generateInviteToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        await WorkspaceInvite.create({
            email: email.toLowerCase(),
            workspaceId: workspace._id,
            workspaceSlug: workspace.slug,
            workspaceName: workspace.name,
            invitedBy: session.user.id,
            role,
            token: inviteToken,
            expiresAt,
        });

        // Send invite email
        await sendWorkspaceInviteEmail({
            to: email,
            invitedByName: inviterUser?.name || 'A team member',
            workspaceName: workspace.name,
            workspaceSlug: workspace.slug,
            inviteToken,
        });

        // First-party funnel: teammate invited (not yet a Flux user).
        after(() =>
            trackEvent({
                event: 'member_invited',
                userId: session.user.id,
                workspaceId: workspace._id.toString(),
                metadata: { role, targetExists: false },
            })
        );
        return { success: true, message: 'Invitation sent! The user will be added to the workspace after they sign up.' };
    } catch (err: unknown) {
        console.error('Error in inviteMemberToWorkspace:', err);
        const message = err instanceof Error ? err.message : 'Something went wrong';
        return { error: message };
    }
}

export async function acceptWorkspaceInvite(token: string): Promise<{ error: string } | { success: true; workspaceSlug: string }> {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
        return { error: 'Unauthorized' };
    }

    await connectDB();

    const invite = await WorkspaceInvite.findOne({
        token,
        expiresAt: { $gt: new Date() },
    });

    if (!invite) {
        return { error: 'This invite link is invalid or has expired.' };
    }

    if (invite.email !== session.user.email?.toLowerCase()) {
        return { error: 'This invite was sent to a different email address.' };
    }

    const workspace = await Workspace.findById(invite.workspaceId);
    if (!workspace) {
        return { error: 'Workspace not found.' };
    }

    const isAlreadyMember = workspace.members.some(
        (m: IMember) => m.userId.toString() === session.user.id
    );

    if (!isAlreadyMember) {
        workspace.members.push({
            userId: new Types.ObjectId(session.user.id),
            role: invite.role,
            joinedAt: new Date(),
        });
        await workspace.save();
    }

    await WorkspaceInvite.deleteOne({ _id: invite._id });
    revalidatePath(`/${invite.workspaceSlug}/team`);
    revalidatePath('/');

    return { success: true, workspaceSlug: invite.workspaceSlug };
}

export async function cancelWorkspaceInvite(inviteId: string): Promise<{ error: string } | { success: true }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    await connectDB();

    const invite = await WorkspaceInvite.findById(inviteId);
    if (!invite) {
        return { error: 'Invite not found.' };
    }

    const workspace = await Workspace.findById(invite.workspaceId);
    if (!workspace) {
        return { error: 'Workspace not found.' };
    }

    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN')) {
        return { error: 'Only admins can cancel invitations.' };
    }

    await WorkspaceInvite.deleteOne({ _id: inviteId });
    revalidatePath(`/${invite.workspaceSlug}/team`);

    return { success: true };
}
