import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
        newUser: '/onboarding',
    },
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        authorized({ auth, request }) {
            const isLoggedIn = !!auth?.user;
            const isPublicRoute =
                request.nextUrl.pathname === '/' ||
                request.nextUrl.pathname === '/login' ||
                request.nextUrl.pathname === '/signup';

            const isAuthRoute = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup';

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
