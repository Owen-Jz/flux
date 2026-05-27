import * as React from "react";
import {
  EmailLayout,
  EHeading,
  EBody,
  ECard,
  ECta,
} from "@/components/emails/email-layout";

interface SubtaskAddedEmailProps {
  taskTitle: string;
  subtaskTitles: string[];
  creatorName: string;
  workspaceName: string;
  taskUrl: string;
}

export const SubtaskAddedEmail = ({
  taskTitle,
  subtaskTitles,
  creatorName,
  workspaceName,
  taskUrl,
}: SubtaskAddedEmailProps) => {
  return (
    <EmailLayout previewText={`New subtasks added to ${taskTitle}`} variant="default">
      <EHeading>Subtasks Added</EHeading>
      <EBody>
        <strong>{creatorName}</strong> added {subtaskTitles.length === 1 ? "a new subtask" : `${subtaskTitles.length} new subtasks`} to <strong>{taskTitle}</strong> in <strong>{workspaceName}</strong>.
      </EBody>
      <ECard>
        <p style={{ margin: "0 0 10px", fontWeight: "600", fontSize: "13px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>New Subtasks</p>
        {subtaskTitles.map((title, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: i < subtaskTitles.length - 1 ? "8px" : "0" }}>
            <span style={{ display: "inline-block", width: "6px", height: "6px", backgroundColor: "#7c3aed", borderRadius: "50%", marginRight: "10px", flexShrink: 0 }} />
            <span style={{ fontSize: "14px", color: "#1c1917" }}>{title}</span>
          </div>
        ))}
      </ECard>
      <ECta href={taskUrl}>View Task</ECta>
    </EmailLayout>
  );
};
