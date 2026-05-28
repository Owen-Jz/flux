import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { rateLimit, getClientIp, isSameOrigin } from '@/lib/rate-limit';

// GET: handle the magic-link fallback from the verification email
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const appUrl = process.env.NEXTAUTH_URL || 'https://fluxboard.site';

    if (!token || !email) {
        return NextResponse.redirect(`${appUrl}/verify-email?error=missing-params`);
    }

    try {
        await connectDB();

        const user = await User.findOne({
            email: decodeURIComponent(email).toLowerCase().trim(),
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() },
        });

        if (!user) {
            return NextResponse.redirect(`${appUrl}/verify-email?error=invalid-or-expired&email=${encodeURIComponent(email)}`);
        }

        user.emailVerified = new Date();
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        user.emailOtp = undefined;
        user.emailOtpExpires = undefined;
        await user.save();

        return NextResponse.redirect(`${appUrl}/login?verified=true`);
    } catch (error) {
        console.error('[Verify Email GET] Error:', error);
        return NextResponse.redirect(`${appUrl}/verify-email?error=server-error`);
    }
}

// POST: verify via OTP code (legacy — kept for backwards compat)
export async function POST(request: NextRequest) {
    if (!isSameOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`verify-email-post-${ip}`, 10, 15 * 60);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: `Too many attempts. Try again in ${rateLimitResult.resetIn} seconds.` },
            { status: 429 }
        );
    }

    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() },
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
        }

        user.emailVerified = new Date();
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        user.emailOtp = undefined;
        user.emailOtpExpires = undefined;
        await user.save();

        return NextResponse.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('[Verify Email POST] Error:', error);
        return NextResponse.json({ error: 'An error occurred. Please try again later.' }, { status: 500 });
    }
}
