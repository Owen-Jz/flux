import * as React from "react";
import { EmailLayout, EHeading, EBody, ECta } from "./email-layout";

interface SubscriptionTrialExpiredEmailProps {
  name: string;
}

export function SubscriptionTrialExpiredEmail({ name }: SubscriptionTrialExpiredEmailProps) {
  return (
    <EmailLayout
      previewText="Your Flux trial has expired"
      variant="warning"
    >
      <EHeading>Trial Expired</EHeading>
      <EBody>
        Hi {name}, your trial has ended and your account has moved to the free tier. You can
        still use core Flux features — upgrade anytime to unlock everything.
      </EBody>
      <ECta href="https://fluxboard.site/dashboard">Upgrade to Pro</ECta>
    </EmailLayout>
  );
}
