import * as React from "react";
import {
  EmailLayout,
  EHeading,
  EBody,
  ECard,
  ECta,
} from "@/components/emails/email-layout";

interface IssueCreatedEmailProps {
  workspaceName: string;
  issueTitle: string;
  issueType: string;
  reporterName: string;
  issueUrl: string;
}

const ISSUE_COLORS: Record<string, { bg: string; text: string }> = {
  BUG: { bg: "#fee2e2", text: "#ef4444" },
  FEATURE: { bg: "#fef3c7", text: "#f59e0b" },
  IMPROVEMENT: { bg: "#dbeafe", text: "#3b82f6" },
};

export const IssueCreatedEmail = ({
  workspaceName,
  issueTitle,
  issueType,
  reporterName,
  issueUrl,
}: IssueCreatedEmailProps) => {
  const issueColor = ISSUE_COLORS[issueType] ?? { bg: "#f3f4f6", text: "#6b7280" };

  return (
    <EmailLayout previewText={`New ${issueType}: ${issueTitle}`} variant="default">
      <EHeading>New Issue Reported</EHeading>
      <EBody>
        <strong>{reporterName}</strong> opened a new issue in <strong>{workspaceName}</strong>.
      </EBody>
      <ECard>
        <span style={{ display: "inline-block", backgroundColor: issueColor.bg, color: issueColor.text, fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", marginBottom: "8px" }}>
          {issueType}
        </span>
        <p style={{ margin: "0", fontWeight: "700", fontSize: "15px", color: "#1c1917" }}>{issueTitle}</p>
      </ECard>
      <ECta href={issueUrl}>View Issue</ECta>
    </EmailLayout>
  );
};
