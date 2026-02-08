'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Workspace } from '@/models/Workspace';
import { User } from '@/models/User';
import { revalidatePath } from 'next/cache';

export async function inviteMemberToWorkspace(slug: string, email: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const workspace = await Workspace.findOne({ slug });
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    // Check if inviter is owner (only owner can invite)
    // Note: The structure of members object might depend on mongoose version. 
    // Assuming members is an array of objects with userId
    const inviter = workspace.members.find(
        (m: any) => m.userId.toString() === session.user.id
    );

    // Only ADMIN can invite
    if (!inviter || inviter.role !== 'ADMIN') {
        throw new Error('Only the workspace admin can invite members');
    }

    const user = await User.findOne({ email });
    if (!user) {
        // For MVP, we only allow inviting existing users
        // Ideally we would create a pending invite or send an email to signup
        throw new Error('User not found. They need to sign up for Flux first.');
    }

    // Check if user is already a member
    const isMember = workspace.members.some(
        (m: any) => m.userId.toString() === user._id.toString()
    );
    if (isMember) {
        throw new Error('User is already a member of this workspace');
    }

    workspace.members.push({
        userId: user._id,
        role: 'VIEWER',
        joinedAt: new Date(),
    });

    await workspace.save();
    revalidatePath(`/${slug}/team`);

    return { success: true };
}
