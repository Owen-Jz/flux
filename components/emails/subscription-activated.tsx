import * as React from "react";
import { EmailLayout, EHeading, EBody, ECta } from "./email-layout";

interface SubscriptionActivatedEmailProps {
  name: string;
  plan: string;
}

export function SubscriptionActivatedEmail({
  name,
  plan,
}: SubscriptionActivatedEmailProps) {
  return (
    <EmailLayout
      previewText="Your Flux subscription is now active"
      variant="success"
    >
      <EHeading>Subscription Active</EHeading>
      <EBody center>
        Hi {name}, your <strong>{plan}</strong> subscription is now active. Welcome to the full
        Flux experience.
      </EBody>
      <ECta href="https://fluxboard.site/dashboard">Go to Dashboard</ECta>
    </EmailLayout>
  );
}
