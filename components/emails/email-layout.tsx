import * as React from "react";
import { Body, Head, Html, Preview, Tailwind } from "@react-email/components";

export type EmailVariant = "default" | "warning" | "urgent" | "success";

const ACCENT_COLORS: Record<EmailVariant, string> = {
  default: "#7c3aed",
  warning: "#f59e0b",
  urgent: "#ef4444",
  success: "#10b981",
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://fluxboard.site";

interface EmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
  variant?: EmailVariant;
}

export function EmailLayout({ previewText, children, variant = "default" }: EmailLayoutProps) {
  const accentColor = ACCENT_COLORS[variant];

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body style={{ backgroundColor: "#f5f3ff", margin: "0", padding: "0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
          <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: "#f5f3ff", padding: "48px 16px" }}>
            <tbody>
              <tr>
                <td align="center">
                  <table width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: "560px", backgroundColor: "#ffffff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <tbody>
                      <tr>
                        <td style={{ height: "4px", backgroundColor: accentColor, lineHeight: "4px", fontSize: "0" }}>&nbsp;</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "28px 40px 0", textAlign: "center" }}>
                          <span style={{ display: "inline-block", backgroundColor: "#7c3aed", color: "#ffffff", fontWeight: "800", fontSize: "15px", letterSpacing: "0.5px", padding: "5px 14px", borderRadius: "8px" }}>
                            flux
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "32px 40px 40px" }}>
                          {children}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ backgroundColor: "#f9fafb", borderTop: "1px solid #e5e7eb", padding: "20px 40px", textAlign: "center" }}>
                          <p style={{ margin: "0 0 6px", color: "#9ca3af", fontSize: "12px", lineHeight: "1.5" }}>
                            Flux Board &bull;{" "}
                            <a href={APP_URL} style={{ color: "#7c3aed", textDecoration: "none" }}>fluxboard.site</a>
                          </p>
                          <p style={{ margin: "0", fontSize: "11px", lineHeight: "1.5", color: "#9ca3af" }}>
                            <a href={`${APP_URL}/unsubscribe`} style={{ color: "#9ca3af", textDecoration: "none" }}>Unsubscribe</a>
                            {" · "}
                            <a href={`${APP_URL}/privacy`} style={{ color: "#9ca3af", textDecoration: "none" }}>Privacy Policy</a>
                            {" · "}
                            <a href={`${APP_URL}/terms`} style={{ color: "#9ca3af", textDecoration: "none" }}>Terms of Service</a>
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </Body>
      </Tailwind>
    </Html>
  );
}

export function EHeading({ children, center = true }: { children: React.ReactNode; center?: boolean }) {
  return (
    <h1 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: "700", color: "#1c1917", textAlign: center ? "center" : "left", lineHeight: "1.3" }}>
      {children}
    </h1>
  );
}

export function EBody({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p style={{ margin: "0 0 20px", color: "#4b5563", fontSize: "15px", lineHeight: "1.7", textAlign: center ? "center" : "left" }}>
      {children}
    </p>
  );
}

export function ECta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", margin: "32px 0" }}>
      <a href={href} style={{ display: "inline-block", backgroundColor: "#7c3aed", color: "#ffffff", fontWeight: "600", fontSize: "15px", padding: "14px 28px", borderRadius: "10px", textDecoration: "none" }}>
        {children}
      </a>
    </div>
  );
}

export function ECard({ children, accentColor = "#7c3aed" }: { children: React.ReactNode; accentColor?: string }) {
  return (
    <div style={{ backgroundColor: "#faf5ff", border: "1px solid #ede9fe", borderLeft: `3px solid ${accentColor}`, borderRadius: "10px", padding: "16px 20px", margin: "24px 0" }}>
      {children}
    </div>
  );
}

export function EDivider() {
  return <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "28px 0" }} />;
}
