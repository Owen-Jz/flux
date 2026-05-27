import * as React from "react";
import { EmailLayout, EHeading, EBody, ECta, ECard } from "./email-layout";

interface SubscriptionPastDueEmailProps {
  name: string;
}

export function SubscriptionPastDueEmail({ name }: SubscriptionPastDueEmailProps) {
  return (
    <EmailLayout
      previewText="Action required: payment issue with your Flux subscription"
      variant="urgent"
    >
      <EHeading>Payment Failed</EHeading>
      <EBody center>
        Hi {name}, we couldn&apos;t process your payment and your subscription is now past due.
      </EBody>
      <ECard accentColor="#ef4444">
        <p style={{ margin: "0", fontSize: "14px", color: "#4b5563" }}>
          To avoid service interruption, please update your payment method.
        </p>
      </ECard>
      <ECta href="https://fluxboard.site/dashboard">Update Payment</ECta>
    </EmailLayout>
  );
}
