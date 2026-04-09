import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: '/login',
        newUser: '/onboarding',
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
        authorized({ auth, request }) {
            const isLoggedIn = !!auth?.user;
            const isPublicRoute =
                request.nextUrl.pathname === '/' ||
                request.nextUrl.pathname === '/login' ||
                request.nextUrl.pathname === '/signup' ||
                request.nextUrl.pathname === '/reset-password';

            const isAuthRoute = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/reset-password';

            // Allow public routes
            if (isPublicRoute && !isAuthRoute) {
                return true;
            }

            // Redirect logged-in users away from auth pages
            if (isAuthRoute && isLoggedIn) {
                return Response.redirect(new URL('/dashboard', request.nextUrl));
            }

            // Redirect to login if not authenticated and not on public route
            if (!isLoggedIn && !isPublicRoute) {
                return false;
            }

            return true;
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
