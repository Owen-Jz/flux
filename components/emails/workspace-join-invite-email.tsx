import * as React from "react";
import { EmailLayout, EHeading, EBody, ECta } from "./email-layout";

interface WorkspaceJoinInviteEmailProps {
  invitedByName: string;
  workspaceName: string;
  joinUrl: string;
}

export function WorkspaceJoinInviteEmail({
  invitedByName,
  workspaceName,
  joinUrl,
}: WorkspaceJoinInviteEmailProps) {
  return (
    <EmailLayout
      previewText={`${invitedByName} invited you to join ${workspaceName} on Flux`}
      variant="default"
    >
      <EHeading>You&apos;ve been invited to {workspaceName}</EHeading>
      <EBody center>
        <strong>{invitedByName}</strong> has invited you to join the{" "}
        <strong>{workspaceName}</strong> workspace. Since you already have a Flux
        account, you can join with one click.
      </EBody>
      <ECta href={joinUrl}>Join {workspaceName}</ECta>
      <p
        style={{
          fontSize: "13px",
          color: "#6b7280",
          textAlign: "center",
          marginTop: "-16px",
        }}
      >
        This invitation expires in 7 days. If you did not expect this invitation,
        you can safely ignore it.
      </p>
    </EmailLayout>
  );
}
