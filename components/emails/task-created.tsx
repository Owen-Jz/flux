import * as React from "react";
import {
  EmailLayout,
  EHeading,
  EBody,
  ECard,
  ECta,
} from "@/components/emails/email-layout";

interface TaskCreatedEmailProps {
  taskTitle: string;
  creatorName: string;
  workspaceName: string;
  taskUrl: string;
}

export const TaskCreatedEmail = ({
  taskTitle,
  creatorName,
  workspaceName,
  taskUrl,
}: TaskCreatedEmailProps) => {
  return (
    <EmailLayout previewText={`New task: ${taskTitle}`} variant="default">
      <EHeading>New Task Created</EHeading>
      <EBody>
        <strong>{creatorName}</strong> created a new task in <strong>{workspaceName}</strong>.
      </EBody>
      <ECard>
        <p style={{ margin: "0", fontWeight: "700", fontSize: "15px", color: "#1c1917" }}>{taskTitle}</p>
      </ECard>
      <ECta href={taskUrl}>View Board</ECta>
    </EmailLayout>
  );
};
