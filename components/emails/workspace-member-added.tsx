import * as React from "react";
import { EmailLayout, EHeading, EBody, ECta, ECard } from "./email-layout";

interface WorkspaceMemberAddedEmailProps {
  invitedByName: string;
  workspaceName: string;
  workspaceUrl: string;
  role: "VIEWER" | "EDITOR" | "ADMIN";
}

const ROLE_COLORS: Record<"VIEWER" | "EDITOR" | "ADMIN", string> = {
  ADMIN: "#7c3aed",
  EDITOR: "#0ea5e9",
  VIEWER: "#6b7280",
};

export function WorkspaceMemberAddedEmail({
  invitedByName,
  workspaceName,
  workspaceUrl,
  role,
}: WorkspaceMemberAddedEmailProps) {
  const roleColor = ROLE_COLORS[role];

  return (
    <EmailLayout
      previewText={`You've been added to ${workspaceName} on Flux`}
      variant="default"
    >
      <EHeading>Welcome to {workspaceName}</EHeading>
      <EBody>
        {invitedByName} has added you to the <strong>{workspaceName}</strong> workspace.
      </EBody>
      <ECard accentColor="#7c3aed">
        <p style={{ margin: "0", fontSize: "14px", color: "#4b5563" }}>
          Your role:{" "}
          <strong>{role}</strong>{" "}
          <span
            style={{
              display: "inline-block",
              backgroundColor: roleColor,
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: "600",
              padding: "2px 8px",
              borderRadius: "4px",
              verticalAlign: "middle",
            }}
          >
            {role}
          </span>
        </p>
      </ECard>
      <EBody>
        You now have immediate access to view boards, tasks, and team activity.
      </EBody>
      <ECta href={workspaceUrl}>Open {workspaceName}</ECta>
    </EmailLayout>
  );
}
