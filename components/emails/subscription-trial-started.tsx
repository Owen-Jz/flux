import * as React from "react";
import { EmailLayout, EHeading, EBody, ECta, ECard } from "./email-layout";

interface SubscriptionTrialStartedEmailProps {
  name: string;
  plan: string;
  expirationDate: string;
}

const TRIAL_FEATURES = [
  "Unlimited boards",
  "25 team members",
  "Priority support",
  "Advanced analytics",
  "Admin controls",
  "API access",
];

export function SubscriptionTrialStartedEmail({
  name,
  plan,
  expirationDate,
}: SubscriptionTrialStartedEmailProps) {
  return (
    <EmailLayout
      previewText="Your Flux Pro trial has started — 14 days free"
      variant="success"
    >
      <EHeading>Your Pro Trial is Active!</EHeading>
      <EBody center>
        Hi {name}, your <strong>{plan}</strong> trial is active until{" "}
        <strong>{expirationDate}</strong>. Here&apos;s what&apos;s unlocked:
      </EBody>
      <ECard accentColor="#7c3aed">
        <ul style={{ listStyle: "none", padding: "0", margin: "0" }}>
          {TRIAL_FEATURES.map((feature) => (
            <li
              key={feature}
              style={{ fontSize: "14px", color: "#4b5563", marginBottom: "8px" }}
            >
              <span
                style={{ color: "#7c3aed", marginRight: "8px", fontWeight: "700" }}
              >
                &middot;
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </ECard>
      <ECta href="https://fluxboard.site/dashboard">Start Using Pro</ECta>
    </EmailLayout>
  );
}
