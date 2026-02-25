import { NextResponse } from 'next/server';

// TEMPORARY diagnostic endpoint - DELETE after debugging
// Visit: https://www.fluxboard.site/api/debug-auth
export async function GET() {
    return NextResponse.json({
        env: process.env.NODE_ENV,
        auth: {
            hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
            hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            hasAuthSecret: !!process.env.AUTH_SECRET,
            hasAuthUrl: !!process.env.AUTH_URL,
            hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
            hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
            authUrl: process.env.AUTH_URL,
            nextAuthUrl: process.env.NEXTAUTH_URL,
            authTrustHost: process.env.AUTH_TRUST_HOST,
        },
    });
}
