import * as React from "react";
import {
  EmailLayout,
  EHeading,
  EBody,
  ECard,
  ECta,
} from "@/components/emails/email-layout";

interface TaskAssignedEmailProps {
  recipientName: string;
  assigneeNames: string;
  taskTitle: string;
  workspaceName: string;
  taskUrl: string;
  assignerName: string;
}

export const TaskAssignedEmail = ({
  recipientName,
  assigneeNames,
  taskTitle,
  workspaceName,
  taskUrl,
  assignerName,
}: TaskAssignedEmailProps) => {
  return (
    <EmailLayout previewText={`New task assignment: ${taskTitle}`} variant="default">
      <EHeading>New Assignment</EHeading>
      <EBody>
        <strong>{assignerName}</strong> assigned <strong>{assigneeNames}</strong> to a task in <strong>{workspaceName}</strong>.
      </EBody>
      <ECard>
        <p style={{ margin: "0 0 4px", fontWeight: "700", fontSize: "15px", color: "#1c1917" }}>{taskTitle}</p>
        <p style={{ margin: "0", fontSize: "13px", color: "#6b7280" }}>in {workspaceName}</p>
      </ECard>
      <ECta href={taskUrl}>View Task</ECta>
    </EmailLayout>
  );
};
