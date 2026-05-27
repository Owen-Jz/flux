import * as React from "react";
import {
  EmailLayout,
  EHeading,
  EBody,
  ECard,
  ECta,
} from "@/components/emails/email-layout";

interface TaskOverdueEmailProps {
  recipientName: string;
  taskTitle: string;
  workspaceName: string;
  boardName: string;
  taskUrl: string;
  dueDate: string;
}

export const TaskOverdueEmail = ({
  recipientName,
  taskTitle,
  workspaceName,
  boardName,
  taskUrl,
  dueDate,
}: TaskOverdueEmailProps) => {
  const formattedDueDate = new Date(dueDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <EmailLayout previewText={`Overdue: ${taskTitle}`} variant="urgent">
      <EHeading>Task Overdue</EHeading>
      <EBody>
        <strong>{recipientName}</strong>, the following task has passed its due date:
      </EBody>
      <ECard accentColor="#ef4444">
        <p style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "15px", color: "#1c1917" }}>{taskTitle}</p>
        <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#ef4444" }}>Due {formattedDueDate}</p>
        <p style={{ margin: "0", fontSize: "13px", color: "#6b7280" }}>{boardName} · {workspaceName}</p>
      </ECard>
      <ECta href={taskUrl}>View Task</ECta>
    </EmailLayout>
  );
};
