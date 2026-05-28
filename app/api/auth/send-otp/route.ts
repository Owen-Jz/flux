import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { rateLimit, getClientIp, isSameOrigin } from '@/lib/rate-limit';
import { sendOtpEmail } from '@/lib/email/auth-emails';

export async function POST(request: NextRequest) {
    if (!isSameOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`send-otp-${ip}`, 3, 15 * 60);

    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: `Too many requests. Try again in ${rateLimitResult.resetIn} seconds.` },
            {
                status: 429,
                headers: {
                    'Retry-After': String(rateLimitResult.resetIn),
                },
            }
        );
    }

    try {
        const { email } = await request.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        // Return generic success to prevent email enumeration
        if (!user || user.emailVerified) {
            return NextResponse.json({ message: 'If this account exists and is unverified, a new code has been sent.' });
        }

        // Generate new 6-digit OTP
        const rawOtp = crypto.randomInt(100000, 1000000).toString();
        const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');

        user.emailOtp = hashedOtp;
        user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await user.save();

        // Send non-blocking
        sendOtpEmail(user.email, user.name, rawOtp).catch(console.error);

        return NextResponse.json({ message: 'If this account exists and is unverified, a new code has been sent.' });
    } catch (error) {
        console.error('[Send OTP] Error:', error);
        return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 });
    }
}
