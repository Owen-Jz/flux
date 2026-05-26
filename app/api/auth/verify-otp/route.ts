import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`verify-otp-${ip}`, 10, 15 * 60);

    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: `Too many attempts. Try again in ${rateLimitResult.resetIn} seconds.` },
            { status: 429 }
        );
    }

    try {
        const { email, otp } = await request.json();

        if (!email || !otp || typeof email !== 'string' || typeof otp !== 'string') {
            return NextResponse.json({ error: 'Email and verification code are required.' }, { status: 400 });
        }

        const trimmedOtp = otp.trim().replace(/\s/g, '');
        if (!/^\d{6}$/.test(trimmedOtp)) {
            return NextResponse.json({ error: 'Verification code must be 6 digits.' }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
        }

        if (user.emailVerified) {
            return NextResponse.json({ message: 'Email already verified. You can log in.' });
        }

        if (!user.emailOtp || !user.emailOtpExpires) {
            return NextResponse.json(
                { error: 'No verification code found. Please request a new one.' },
                { status: 400 }
            );
        }

        if (user.emailOtpExpires < new Date()) {
            return NextResponse.json(
                { error: 'Verification code has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        const hashedInput = crypto.createHash('sha256').update(trimmedOtp).digest('hex');
        if (hashedInput !== user.emailOtp) {
            return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
        }

        // Mark verified and clear OTP fields
        user.emailVerified = new Date();
        user.emailOtp = undefined;
        user.emailOtpExpires = undefined;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        return NextResponse.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error('[Verify OTP] Error:', error);
        return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 });
    }
}
