import type { NextAuthConfig } from 'next-auth';

const publicPaths = new Set([
    '/',
    '/login',
    '/signup',
    '/reset-password',
    '/verify-email',
    '/about',
    '/blog',
    '/careers',
    '/changelog',
    '/community',
    '/contact',
    '/cookies',
    '/docs',
    '/enterprise',
    '/features',
    '/help',
    '/how-it-works',
    '/information',
    '/integrations',
    '/licenses',
    '/pricing',
    '/privacy',
    '/security',
    '/terms',
    '/webinars',
]);

const publicPrefixes = ['/api/auth/', '/docs/', '/blog/', '/help/'];

const authRoutes = new Set(['/login', '/signup', '/reset-password']);

// Every reserved top-level app route. The first path segment of a workspace URL
// (`/{slug}/...`) is a workspace slug ONLY if it is NOT one of these. Keep in
// sync with the directories under app/. Defense-in-depth: even if one is missed,
// those pages run their own auth() guard.
const reservedTopLevel = new Set([
    'about', 'admin', 'api', 'api-reference', 'billing', 'blog', 'careers',
    'changelog', 'community', 'contact', 'cookies', 'dashboard', 'docs',
    'enterprise', 'features', 'help', 'how-it-works', 'information',
    'integrations', 'join', 'licenses', 'login', 'offline', 'onboarding',
    'pricing', 'privacy', 'reset-password', 'security', 'settings', 'signup',
    'terms', 'verify-email', 'webinars',
]);

// Workspace sections that support public (read-only) viewing when a workspace has
// publicAccess enabled. Middleware can't read the per-workspace flag from the DB,
// so it lets guests through to these routes and the page/layout enforce the flag
// (redirecting to /login for non-public workspaces). Workspace settings is
// deliberately excluded — it stays members-only.
const publicWorkspaceSections = new Set([
    'board', 'calendar', 'analytics', 'team', 'issues', 'archive',
]);

/**
 * A workspace-scoped content route (`/{slug}` or `/{slug}/<public-section>/...`)
 * that an unauthenticated guest may reach so the page can apply the workspace's
 * publicAccess flag. Returns false for reserved app routes and `/{slug}/settings`.
 */
function isWorkspaceContentRoute(pathname: string): boolean {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return false;
    if (reservedTopLevel.has(segments[0])) return false;
    if (segments.length === 1) return true; // workspace home: /{slug}
    return publicWorkspaceSections.has(segments[1]); // /{slug}/<section>/...
}

function isPublicRoute(pathname: string): boolean {
    if (publicPaths.has(pathname)) return true;
    return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: '/login',
        newUser: '/onboarding',
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60,
    },
    callbacks: {
        authorized({ auth, request }) {
            const isLoggedIn = !!auth?.user;
            const pathname = request.nextUrl.pathname;
            const isPublic = isPublicRoute(pathname);
            const isAuth = authRoutes.has(pathname);

            if (isPublic && !isAuth) return true;

            if (isAuth && isLoggedIn) {
                return Response.redirect(new URL('/dashboard', request.nextUrl));
            }

            if (!isLoggedIn && !isPublic) {
                // Let guests reach workspace content routes so the page can honor
                // the workspace's publicAccess flag (it redirects to /login for
                // non-public workspaces). Everything else still requires auth.
                if (isWorkspaceContentRoute(pathname)) return true;
                return false;
            }

            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
