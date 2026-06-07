import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

// Public, indexable routes. Authenticated/app routes (dashboard, workspaces,
// settings, auth) are intentionally excluded and disallowed in robots.ts.
const MARKETING_ROUTES = [
  "", // homepage
  "/features",
  "/how-it-works",
  "/pricing",
  "/enterprise",
  "/integrations",
  "/changelog",
  "/about",
  "/careers",
  "/contact",
  "/community",
  "/help",
  "/blog",
  "/docs",
  "/api-reference",
  "/security",
  "/privacy",
  "/terms",
  "/cookies",
  "/licenses",
];

const DOCS_ROUTES = [
  "/docs/quick-start",
  "/docs/creating-workspace",
  "/docs/boards",
  "/docs/tasks",
  "/docs/columns",
  "/docs/custom-fields",
  "/docs/inviting-team",
  "/docs/permissions",
  "/docs/automation",
  "/docs/managing-account",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  ): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    entry("", 1, "weekly"),
    ...MARKETING_ROUTES.slice(1).map((p) => entry(p, 0.7, "weekly")),
    ...DOCS_ROUTES.map((p) => entry(p, 0.6, "monthly")),
  ];
}
