import { sendEmail } from './resend';
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

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been added to ${workspaceName} on Flux</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; margin: -20px -20px 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Flux</h1>
  </div>

  <p style="font-size: 18px; margin-bottom: 20px;">Hi there,</p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    <strong>${invitedByName}</strong> has added you to the <strong>${workspaceName}</strong> workspace on Flux as <strong>${role}</strong>.
  </p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    You now have immediate access to collaborate in <strong>${workspaceName}</strong>. You can start viewing boards, tasks, and team activity right away.
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${workspaceUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Go to ${workspaceName}
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="font-size: 12px; color: #999; text-align: center;">
    If you didn't expect this invitation, you can contact the workspace admin or ignore this email.
  </p>
</body>
</html>
  `.trim();

  await sendEmail({
    to,
    subject: `You've been added to ${workspaceName} on Flux`,
    html,
  });
}

export async function sendWorkspaceInviteEmail({
  to,
  invitedByName,
  workspaceName,
  workspaceSlug,
  inviteToken,
}: {
  to: string;
  invitedByName: string;
  workspaceName: string;
  workspaceSlug: string;
  inviteToken: string;
}) {
  const signupUrl = `${APP_URL}/signup?invite=${inviteToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to join ${workspaceName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; margin: -20px -20px 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Flux</h1>
  </div>

  <p style="font-size: 18px; margin-bottom: 20px;">Hi there,</p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    <strong>${invitedByName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on Flux.
  </p>

  <p style="font-size: 16px; margin-bottom: 30px;">
    Flux is a powerful project management tool that helps teams collaborate and get things done.
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${signupUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Accept Invitation & Sign Up
    </a>
  </div>

  <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
    This invitation will expire in 7 days.
  </p>

  <p style="font-size: 14px; color: #666; margin-bottom: 30px;">
    If you already have a Flux account, you can sign in and the workspace will be automatically added to your account.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p style="font-size: 12px; color: #999; text-align: center;">
    If you didn't expect this invitation, you can safely ignore this email.
  </p>
</body>
</html>
  `.trim();

  await sendEmail({
    to,
    subject: `You've been invited to join ${workspaceName} on Flux`,
    html,
  });
}
