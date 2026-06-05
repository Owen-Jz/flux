import { ImageResponse } from "next/og";

// File-based OG image (Next auto-wires it as og:image and the twitter:image
// fallback). Produces a real PNG — unlike the previous SVG, this renders on
// Facebook, LinkedIn, X, Slack, iMessage, etc.

export const alt = "Flux — Describe your project, AI plans it";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0b0612 0%, #1a0b2e 45%, #2b0f52 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
            }}
          />
          <div
            style={{
              fontSize: "44px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.03em",
            }}
          >
            flux
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "56px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            Describe your project.
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              marginTop: "8px",
              color: "#c4b5fd",
            }}
          >
            Flux plans it.
          </div>
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: "30px",
            color: "#a1a1aa",
            marginTop: "40px",
            maxWidth: "900px",
          }}
        >
          AI turns any project — in any field — into a board of tasks, priorities
          &amp; time estimates, in seconds.
        </div>
      </div>
    ),
    { ...size }
  );
}
