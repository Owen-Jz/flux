import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

function meetsPasswordComplexity(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    return password.length >= 8 &&
        [hasUpperCase, hasLowerCase, hasNumber, hasSymbol].filter(Boolean).length >= 3;
}

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`reset-confirm-${ip}`, 5, 15 * 60);

    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: `Too many attempts. Please try again in ${rateLimitResult.resetIn} seconds` },
            { status: 429 }
        );
    }

    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: 'Token and new password are required' },
                { status: 400 }
            );
        }

        if (!meetsPasswordComplexity(password)) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters and contain at least 3 of: uppercase, lowercase, numbers, symbols' },
                { status: 400 }
            );
        }

        await connectDB();

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid or expired reset token' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        user.password = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        // Clear any active lockout so the user can log in immediately after reset
        user.failedLoginAttempts = 0;
        user.lockoutUntil = undefined;
        await user.save();

        return NextResponse.json({
            message: 'Password has been reset successfully. Please log in with your new password.',
        });
    } catch (error) {
        console.error('[Password Reset Confirm] Error:', error);
        return NextResponse.json(
            { error: 'An error occurred. Please try again later.' },
            { status: 500 }
        );
    }
}
