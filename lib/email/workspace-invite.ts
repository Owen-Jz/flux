import { render } from '@react-email/components';
import { sendEmail } from './resend';
import { WorkspaceMemberAddedEmail } from '@/components/emails/workspace-member-added';
import { WorkspaceInviteEmail } from '@/components/emails/workspace-invite-email';
import { getAppUrl } from '@/lib/port';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || getAppUrl();

export async function sendMemberAddedEmail({
  to,
  invitedByName,
  workspaceName,
  workspaceSlug,
  role,
}: {
  to: string;
  invitedByName: string;
  workspaceName: string;
  workspaceSlug: string;
  role: 'VIEWER' | 'EDITOR' | 'ADMIN';
}) {
  const workspaceUrl = `${APP_URL}/${workspaceSlug}`;
  const html = await render(WorkspaceMemberAddedEmail({ invitedByName, workspaceName, workspaceUrl, role }));
  await sendEmail({
    to,
    subject: `You've been added to ${workspaceName} on Flux`,
    html,
  });
}

export async function sendWorkspaceInviteEmail(params: {
  to: string;
  invitedByName: string;
  workspaceName: string;
  workspaceSlug: string;
  inviteToken: string;
}) {
  const { to, invitedByName, workspaceName, inviteToken } = params;
  const signupUrl = `${APP_URL}/signup?invite=${inviteToken}`;
  const html = await render(WorkspaceInviteEmail({ invitedByName, workspaceName, signupUrl }));
  await sendEmail({
    to,
    subject: `You've been invited to join ${workspaceName} on Flux`,
    html,
  });
}
