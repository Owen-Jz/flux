'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Workspace } from '@/models/Workspace';
import { User } from '@/models/User';
import { WorkspaceInvite } from '@/models/WorkspaceInvite';
import { revalidatePath } from 'next/cache';
import { canAddMember, getUpgradeMessage } from '@/lib/plan-limits';
import { sendWorkspaceInviteEmail } from '@/lib/email/workspace-invite';
import crypto from 'crypto';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';

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

        const inviterUser = await User.findById(session.user.id).select('plan name');
        const plan = (inviterUser?.plan || 'free') as 'free' | 'starter' | 'pro' | 'enterprise';
        const currentMemberCount = workspace.members.length;

        if (!canAddMember(plan, currentMemberCount)) {
            return { error: getUpgradeMessage(plan, 'members') };
        }

        const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
        });

        if (user) {
            // Check if user is already a member
            const isMember = workspace.members.some(
                (m: any) => m.userId.toString() === user._id.toString()
            );
            if (isMember) {
                return { error: 'User is already a member of this workspace' };
            }

            // Add existing user directly to workspace
            workspace.members.push({
                userId: user._id,
                role,
                joinedAt: new Date(),
            });

            await workspace.save();
            revalidatePath(`/${slug}/team`);

            return { success: true, message: 'Member added successfully' };
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

        return { success: true, message: 'Invitation sent! The user will be added to the workspace after they sign up.' };
    } catch (err: any) {
        console.error('Error in inviteMemberToWorkspace:', err);
        return { error: err.message || 'Something went wrong' };
    }
}
