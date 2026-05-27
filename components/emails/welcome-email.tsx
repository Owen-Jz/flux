import * as React from "react";
import { EmailLayout, EHeading, EBody, ECta, ECard, EDivider } from "./email-layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://fluxboard.site";

interface WelcomeEmailProps {
  name: string;
}

const FEATURES = [
  { label: "Boards", description: "Organize work into visual project boards" },
  { label: "Tasks", description: "Track tasks with priorities, due dates, and assignees" },
  { label: "Workspaces", description: "Collaborate with your team in shared spaces" },
];

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <EmailLayout previewText="Welcome to Flux — your workspace is ready" variant="success">
      <EHeading>Welcome to Flux, {name}!</EHeading>
      <EBody center>
        Your account is ready. Start organizing your work and collaborating with your team.
      </EBody>

      <ECard accentColor="#10b981">
        {FEATURES.map((feature, i) => (
          <p key={feature.label} style={{ margin: i === FEATURES.length - 1 ? "0" : "0 0 12px", fontSize: "14px", color: "#374151", lineHeight: "1.5" }}>
            <strong style={{ color: "#1c1917" }}>{feature.label}</strong>
            {" — "}
            <span style={{ color: "#6b7280" }}>{feature.description}</span>
          </p>
        ))}
      </ECard>

      <ECta href={`${APP_URL}/onboarding`}>Get Started</ECta>

      <EDivider />

      <p style={{ margin: "0", color: "#9ca3af", fontSize: "12px", textAlign: "center", lineHeight: "1.6" }}>
        Questions? Reply to this email — we&apos;re happy to help.
      </p>
    </EmailLayout>
  );
}
