import * as React from "react";
import { EmailLayout, EHeading, EBody, ECta } from "./email-layout";

interface WorkspaceInviteEmailProps {
  invitedByName: string;
  workspaceName: string;
  signupUrl: string;
}

export function WorkspaceInviteEmail({
  invitedByName,
  workspaceName,
  signupUrl,
}: WorkspaceInviteEmailProps) {
  return (
    <EmailLayout
      previewText={`You've been invited to join ${workspaceName} on Flux`}
      variant="default"
    >
      <EHeading>{invitedByName} invited you to Flux</EHeading>
      <EBody center>
        You&apos;ve been invited to join the <strong>{workspaceName}</strong> workspace — a collaborative
        project management tool for teams.
      </EBody>
      <ECta href={signupUrl}>Accept Invitation &amp; Sign Up</ECta>
      <p
        style={{
          fontSize: "13px",
          color: "#6b7280",
          textAlign: "center",
          marginTop: "-16px",
        }}
      >
        This invitation expires in 7 days. If you already have an account, sign in and the
        workspace will be added automatically.
      </p>
    </EmailLayout>
  );
}
