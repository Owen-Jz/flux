'use server';

import { Types } from 'mongoose';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Workspace } from '@/models/Workspace';
import { Task } from '@/models/Task';
import { ApiKey } from '@/models/ApiKey';
import { WebhookEndpoint } from '@/models/WebhookEndpoint';
import { PushSubscription } from '@/models/PushSubscription';

/**
 * Permanently delete the authenticated user's account (GDPR right to erasure).
 *
 * Behaviour:
 *  - Workspaces the user OWNS are soft-deleted (the existing purge cron cascades
 *    their boards/tasks/activity after 30 days), matching `deleteWorkspace`.
 *  - In workspaces owned by others, the user is removed from the member list and
 *    pulled from every task assignment.
 *  - The user's API keys, webhook endpoints, and push subscriptions are deleted.
 *  - Finally the user record itself is removed.
 *
 * The caller is expected to sign the user out immediately afterwards.
 */
export async function deleteAccount(confirmation: string): Promise<{ success: true }> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    if (confirmation !== 'delete') {
        throw new Error('Please type "delete" to confirm.');
    }

    await connectDB();

    const userId = session.user.id;
    const userObjectId = new Types.ObjectId(userId);

    const user = await User.findById(userId).select('_id').lean();
    if (!user) {
        throw new Error('Account not found');
    }

    // 1. Soft-delete workspaces this user owns; the purge cron handles the cascade.
    await Workspace.updateMany(
        { ownerId: userObjectId, deletedAt: { $exists: false } },
        { $set: { deletedAt: new Date() } }
    );

    // 2. Remove the user from workspaces owned by others (and any task assignments).
    const memberWorkspaces = await Workspace.find({
        'members.userId': userObjectId,
        ownerId: { $ne: userObjectId },
    })
        .select('_id')
        .lean();

    if (memberWorkspaces.length > 0) {
        const memberWorkspaceIds = memberWorkspaces.map((w) => w._id);
        await Task.updateMany(
            { workspaceId: { $in: memberWorkspaceIds }, assignees: userId },
            { $pull: { assignees: userId } }
        );
        await Workspace.updateMany(
            { _id: { $in: memberWorkspaceIds } },
            { $pull: { members: { userId: userObjectId } } }
        );
    }

    // 3. Delete credentials and device subscriptions tied to this user.
    await Promise.all([
        ApiKey.deleteMany({ userId: userObjectId }),
        WebhookEndpoint.deleteMany({ userId: userObjectId }),
        PushSubscription.deleteMany({ userId: userObjectId }),
    ]);

    // 4. Erase the user record itself.
    await User.findByIdAndDelete(userId);

    revalidatePath('/dashboard');
    return { success: true };
}
