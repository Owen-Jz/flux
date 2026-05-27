import * as React from "react";
import { EmailLayout, EHeading, EBody, ECta, EDivider } from "./email-layout";

interface AuthPasswordResetEmailProps {
  name: string;
  resetUrl: string;
}

export function AuthPasswordResetEmail({ name, resetUrl }: AuthPasswordResetEmailProps) {
  return (
    <EmailLayout previewText="Reset your Flux password" variant="default">
      <EHeading>Reset your password</EHeading>
      <EBody center>
        Hi {name}, click the button below to set a new password. This link expires in{" "}
        <strong>1 hour</strong>.
      </EBody>

      <ECta href={resetUrl}>Reset Password</ECta>

      <EDivider />

      <p
        style={{
          margin: "0 0 8px",
          color: "#9ca3af",
          fontSize: "12px",
          textAlign: "center",
          lineHeight: "1.6",
        }}
      >
        Or copy this link:{" "}
        <span
          style={{
            fontSize: "11px",
            wordBreak: "break-all",
          }}
        >
          {resetUrl}
        </span>
      </p>

      <p
        style={{
          margin: "0",
          color: "#9ca3af",
          fontSize: "12px",
          textAlign: "center",
          lineHeight: "1.6",
        }}
      >
        If you didn&apos;t request a password reset, you can safely ignore this email.
      </p>
    </EmailLayout>
  );
}
