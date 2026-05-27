import * as React from "react";
import { EmailLayout, EHeading, EBody, ECta } from "./email-layout";

interface SubscriptionCancelledEmailProps {
  name: string;
}

export function SubscriptionCancelledEmail({ name }: SubscriptionCancelledEmailProps) {
  return (
    <EmailLayout
      previewText="Your Flux subscription has been cancelled"
      variant="default"
    >
      <EHeading>Subscription Cancelled</EHeading>
      <EBody>
        Hi {name}, your subscription has been cancelled. You&apos;ll retain access to premium
        features until the end of your current billing period, then your account will move to
        the free tier.
      </EBody>
      <EBody>
        Questions? Reply to this email — we&apos;re always here to help.
      </EBody>
      <ECta href="https://fluxboard.site/dashboard">Go to Dashboard</ECta>
    </EmailLayout>
  );
}
