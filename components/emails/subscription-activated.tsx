import * as React from "react";
import { EmailLayout, EHeading, EBody, ECta, ECard, EDivider } from "./email-layout";

interface SubscriptionActivatedEmailProps {
  name: string;
  plan: string;
  amount?: string;
  currency?: string;
}

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    "Up to 5 Projects",
    "Up to 10 Team Members",
    "Custom Workflows",
    "Email Support",
    "API Access",
  ],
  pro: [
    "Unlimited Projects",
    "Up to 25 Team Members",
    "Advanced Analytics",
    "Priority Support",
    "Admin Controls & SSO",
  ],
  enterprise: [
    "Unlimited Everything",
    "Dedicated Success Manager",
    "SLA Guarantee",
    "On-premise Deployment",
    "Custom Contracts",
  ],
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Individual",
  pro: "Entrepreneur",
  enterprise: "Business",
};

export function SubscriptionActivatedEmail({
  name,
  plan,
  amount,
}: SubscriptionActivatedEmailProps) {
  const planLabel = PLAN_LABELS[plan] || plan;
  const features = PLAN_FEATURES[plan] || PLAN_FEATURES.starter;

  return (
    <EmailLayout
      previewText={`Welcome to Flux ${planLabel} - your subscription is now active`}
      variant="success"
    >
      <EHeading>Welcome to Flux {planLabel}!</EHeading>
      <EBody center>
        Hi {name}, your payment was successful and your <strong>{planLabel}</strong> plan is now
        active. You have full access to all {planLabel} features starting today.
      </EBody>

      {amount && (
        <ECard accentColor="#10b981">
          <table width="100%" cellPadding={0} cellSpacing={0}>
            <tbody>
              <tr>
                <td style={{ color: "#6b7280", fontSize: "13px" }}>Amount Paid</td>
                <td style={{ textAlign: "right", fontWeight: "700", fontSize: "16px", color: "#1c1917" }}>
                  ${amount}
                </td>
              </tr>
              <tr>
                <td style={{ color: "#6b7280", fontSize: "13px", paddingTop: "8px" }}>Plan</td>
                <td style={{ textAlign: "right", fontWeight: "600", fontSize: "14px", color: "#1c1917", paddingTop: "8px" }}>
                  {planLabel}
                </td>
              </tr>
              <tr>
                <td style={{ color: "#6b7280", fontSize: "13px", paddingTop: "8px" }}>Billing</td>
                <td style={{ textAlign: "right", fontWeight: "600", fontSize: "14px", color: "#1c1917", paddingTop: "8px" }}>
                  Monthly
                </td>
              </tr>
            </tbody>
          </table>
        </ECard>
      )}

      <EDivider />

      <EBody>
        <strong>What you now have access to:</strong>
      </EBody>

      <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "24px" }}>
        <tbody>
          {features.map((feature) => (
            <tr key={feature}>
              <td style={{ padding: "6px 0", verticalAlign: "top", width: "24px" }}>
                <span style={{ color: "#10b981", fontSize: "16px", fontWeight: "bold" }}>&#10003;</span>
              </td>
              <td style={{ padding: "6px 0", color: "#4b5563", fontSize: "14px" }}>
                {feature}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ECta href="https://fluxboard.site/dashboard">Go to Your Dashboard</ECta>

      <EBody center>
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>
          Questions about your plan? Reply to this email or visit our{" "}
          <a href="https://fluxboard.site/help" style={{ color: "#7c3aed", textDecoration: "none" }}>Help Center</a>.
        </span>
      </EBody>
    </EmailLayout>
  );
}
