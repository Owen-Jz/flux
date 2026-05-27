import * as React from "react";
import {
  EmailLayout,
  EHeading,
  EBody,
  ECta,
} from "@/components/emails/email-layout";

interface NewCommentEmailProps {
  taskTitle: string;
  commenterName: string;
  commentContent: string;
  taskUrl: string;
}

export const NewCommentEmail = ({
  taskTitle,
  commenterName,
  commentContent,
  taskUrl,
}: NewCommentEmailProps) => {
  return (
    <EmailLayout previewText={`New comment on ${taskTitle}`} variant="default">
      <EHeading>New Comment</EHeading>
      <EBody>
        <strong>{commenterName}</strong> commented on <strong>{taskTitle}</strong>:
      </EBody>
      <div style={{ backgroundColor: "#faf5ff", borderLeft: "3px solid #7c3aed", borderRadius: "0 8px 8px 0", padding: "14px 18px", margin: "20px 0", fontStyle: "italic", color: "#4b5563", fontSize: "15px", lineHeight: "1.7" }}>
        &ldquo;{commentContent}&rdquo;
      </div>
      <ECta href={taskUrl}>Reply to Comment</ECta>
    </EmailLayout>
  );
};
