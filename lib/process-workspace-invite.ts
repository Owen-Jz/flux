import { connectDB } from '@/lib/db';
import { WorkspaceInvite } from '@/models/WorkspaceInvite';
import { Workspace } from '@/models/Workspace';
import { revalidatePath } from 'next/cache';

// Helper to trigger push notification (non-blocking)
async function triggerPush(data: { title: string; body: string; url?: string; workspaceId?: string }) {
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
      },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('[PWA] Push trigger failed:', err);
  }
}

export async function processWorkspaceInvites(email: string) {
  await connectDB();

  const pendingInvites = await WorkspaceInvite.find({
    email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    expiresAt: { $gt: new Date() },
  });

  if (pendingInvites.length === 0) {
    return [];
  }

  const addedWorkspaces: string[] = [];

  for (const invite of pendingInvites) {
    const workspace = await Workspace.findById(invite.workspaceId);
    if (!workspace) continue;

    // Check if user is already a member
    const isAlreadyMember = workspace.members.some(
      (m: any) => m.userId.toString() === invite.workspaceId.toString()
    );

    if (isAlreadyMember) {
      await WorkspaceInvite.deleteOne({ _id: invite._id });
      continue;
    }

    // Add user to workspace
    workspace.members.push({
      userId: (invite as any)._id, // This will be set after user creation
      role: invite.role,
      joinedAt: new Date(),
    });

    await workspace.save();
    addedWorkspaces.push(workspace.slug);

    // Delete the invite after processing
    await WorkspaceInvite.deleteOne({ _id: invite._id });

    revalidatePath(`/${workspace.slug}/team`);
  }

  return addedWorkspaces;
}

export async function addUserToWorkspaceFromInvite(userId: string, email: string) {
  await connectDB();

  const pendingInvites = await WorkspaceInvite.find({
    email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    expiresAt: { $gt: new Date() },
  });

  if (pendingInvites.length === 0) {
    return [];
  }

  const addedWorkspaces: string[] = [];

  for (const invite of pendingInvites) {
    const workspace = await Workspace.findById(invite.workspaceId);
    if (!workspace) continue;

    // Check if user is already a member
    const isAlreadyMember = workspace.members.some(
      (m: any) => m.userId.toString() === userId
    );

    if (isAlreadyMember) {
      await WorkspaceInvite.deleteOne({ _id: invite._id });
      continue;
    }

    // Add user to workspace
    workspace.members.push({
      userId,
      role: invite.role,
      joinedAt: new Date(),
    });

    await workspace.save();
    addedWorkspaces.push(workspace.slug);

    // PUSH NOTIFICATION: Notify the new member they joined
    triggerPush({
        title: 'New team member',
        body: `You joined ${workspace.name}`,
        url: `/${workspace.slug}`,
        workspaceId: workspace._id.toString(),
    });

    // Delete the invite after processing
    await WorkspaceInvite.deleteOne({ _id: invite._id });

    revalidatePath(`/${workspace.slug}/team`);
  }

  return addedWorkspaces;
}
