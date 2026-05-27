import * as React from "react";
import { EmailLayout, EHeading, EBody } from "./email-layout";

interface AuthOtpEmailProps {
  name: string;
  otp: string;
}

export function AuthOtpEmail({ name, otp }: AuthOtpEmailProps) {
  return (
    <EmailLayout previewText={`Your Flux verification code: ${otp}`} variant="default">
      <EHeading>Verify your email</EHeading>
      <EBody center>Hi {name}, enter this code to verify your email address.</EBody>

      <div
        style={{
          backgroundColor: "#faf5ff",
          border: "1px solid #ede9fe",
          borderRadius: "12px",
          padding: "28px",
          textAlign: "center",
          margin: "24px 0",
        }}
      >
        <span
          style={{
            fontSize: "40px",
            fontWeight: "800",
            color: "#7c3aed",
            fontFamily: "'Courier New', monospace",
            letterSpacing: "12px",
          }}
        >
          {otp}
        </span>
      </div>

      <p
        style={{
          margin: "0 0 16px",
          color: "#6b7280",
          fontSize: "13px",
          textAlign: "center",
          lineHeight: "1.6",
        }}
      >
        This code expires in <strong>10 minutes</strong>.
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
        If you didn&apos;t create a Flux account, you can safely ignore this email.
      </p>
    </EmailLayout>
  );
}
