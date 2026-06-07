// Single source of truth for the site's public base URL, used by metadata,
// the sitemap, robots, and canonical/OG links.
//
// Production sets NEXT_PUBLIC_APP_URL (e.g. https://www.fluxboard.site); local
// dev sets NEXT_PUBLIC_BASE_URL. We accept either (plus a hard production
// fallback) so absolute OG/canonical URLs never silently break — an undefined
// metadataBase makes social/preview images fail to resolve.
export const SITE_URL = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.fluxboard.site'
).replace(/\/+$/, '');

export const SITE_NAME = 'Flux';
