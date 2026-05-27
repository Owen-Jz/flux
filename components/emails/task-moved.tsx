import * as React from "react";
import {
  EmailLayout,
  EHeading,
  EBody,
  ECard,
  ECta,
} from "@/components/emails/email-layout";

interface TaskMovedEmailProps {
  taskTitle: string;
  moverName: string;
  fromStatus: string;
  toStatus: string;
  taskUrl: string;
  workspaceName: string;
}

const getStatusColor = (status: string): string => {
  const s = status.toUpperCase();
  if (s.includes("DONE")) return "#10b981";
  if (s.includes("PROGRESS")) return "#3b82f6";
  if (s.includes("REVIEW")) return "#7c3aed";
  return "#6b7280";
};

export const TaskMovedEmail = ({
  taskTitle,
  moverName,
  fromStatus,
  toStatus,
  taskUrl,
  workspaceName,
}: TaskMovedEmailProps) => {
  return (
    <EmailLayout previewText={`Task update: ${taskTitle}`} variant="default">
      <EHeading>Task Status Updated</EHeading>
      <EBody>
        <strong>{moverName}</strong> moved a task in <strong>{workspaceName}</strong>.
      </EBody>
      <ECard>
        <p style={{ margin: "0 0 8px", fontWeight: "700", fontSize: "15px", color: "#1c1917" }}>{taskTitle}</p>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "13px", color: "#9ca3af", textDecoration: "line-through", marginRight: "8px" }}>{fromStatus}</span>
          <span style={{ fontSize: "13px", color: "#9ca3af", marginRight: "8px" }}>→</span>
          <span style={{ fontSize: "13px", fontWeight: "600", color: getStatusColor(toStatus) }}>{toStatus}</span>
        </div>
      </ECard>
      <ECta href={taskUrl}>View Board</ECta>
    </EmailLayout>
  );
};
