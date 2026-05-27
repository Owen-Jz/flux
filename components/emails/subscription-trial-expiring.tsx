import * as React from "react";
import { EmailLayout, EHeading, EBody, ECta } from "./email-layout";

interface SubscriptionTrialExpiringEmailProps {
  name: string;
  daysLeft: number;
}

export function SubscriptionTrialExpiringEmail({
  name,
  daysLeft,
}: SubscriptionTrialExpiringEmailProps) {
  return (
    <EmailLayout
      previewText={`Your Flux trial expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
      variant="warning"
    >
      <EHeading>Trial Ending Soon</EHeading>
      <EBody center>
        Hi {name}, your free trial expires in{" "}
        <strong>
          {daysLeft} day{daysLeft === 1 ? "" : "s"}
        </strong>
        . Upgrade now to keep your premium features.
      </EBody>
      <ECta href="https://fluxboard.site/dashboard">Upgrade Now</ECta>
    </EmailLayout>
  );
}
