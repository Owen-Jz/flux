import { connectDB } from '@/lib/db';
import { WorkspaceInvite } from '@/models/WorkspaceInvite';
import { Workspace } from '@/models/Workspace';
import { revalidatePath } from 'next/cache';
import { triggerNotification } from '@/lib/pwa/trigger-notification';

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

    // Check if user is already a member - compare against invite's _id (temporary placeholder)
    // This prevents duplicate additions when the invite is processed multiple times
    const isAlreadyMember = workspace.members.some(
      (m: any) => m.userId.toString() === (invite as any)._id.toString()
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
    triggerNotification({
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
