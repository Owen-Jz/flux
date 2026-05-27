import * as React from "react";
import { EmailLayout, EHeading, EBody, ECta } from "./email-layout";

interface SubscriptionDisabledEmailProps {
  name: string;
}

export function SubscriptionDisabledEmail({ name }: SubscriptionDisabledEmailProps) {
  return (
    <EmailLayout
      previewText="Your Flux subscription has been disabled"
      variant="warning"
    >
      <EHeading>Subscription Disabled</EHeading>
      <EBody>
        Hi {name}, your subscription has been disabled due to payment failure. Your account has
        moved to the free tier — basic features are still available.
      </EBody>
      <ECta href="https://fluxboard.site/dashboard">Reactivate Subscription</ECta>
    </EmailLayout>
  );
}
