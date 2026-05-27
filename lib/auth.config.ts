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
    '/community',
    '/contact',
    '/cookies',
    '/docs',
    '/enterprise',
    '/features',
    '/help',
    '/how-it-works',
    '/information',
    '/licenses',
    '/pricing',
    '/privacy',
    '/security',
    '/terms',
]);

const publicPrefixes = ['/api/auth/', '/docs/', '/blog/', '/help/'];

const authRoutes = new Set(['/login', '/signup', '/reset-password']);

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

            if (!isLoggedIn && !isPublic) return false;

            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
