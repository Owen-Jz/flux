import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

// Allow crawling of public marketing/docs pages; keep app, auth, and API routes
// out of the index. Public workspace pages (/[slug]) stay crawlable since they
// can be intentionally shared.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/settings",
          "/onboarding",
          "/login",
          "/signup",
          "/reset-password",
          "/verify-email",
          "/join",
          "/billing/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
