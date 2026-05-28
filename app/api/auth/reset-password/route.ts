import { NextRequest, NextResponse, after } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { rateLimit, getClientIp, isSameOrigin } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/lib/email/auth-emails';

export async function POST(request: NextRequest) {
    if (!isSameOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Apply rate limiting - 3 reset requests per 15 minutes per IP
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`reset-${ip}`, 3, 15 * 60);

    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: `Too many reset requests. Please try again in ${rateLimitResult.resetIn} seconds` },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                    'X-RateLimit-Reset': String(rateLimitResult.resetIn),
                    'Retry-After': String(rateLimitResult.resetIn),
                },
            }
        );
    }

    try {
        const { email: rawEmail } = await request.json();

        if (!rawEmail || typeof rawEmail !== 'string') {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const email = rawEmail.toLowerCase().trim();

        await connectDB();

        const user = await User.findOne({ email });

        // Always return success to prevent email enumeration
        // But still process the request if user exists
        if (user) {
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            // SECURITY FIX: Hash the reset token before storing
            // The token sent to user is plain text, but stored hash cannot be reversed
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            user.passwordResetToken = hashedToken;
            user.passwordResetExpires = resetExpires;
            await user.save();

            // `after()` ensures the reset email is actually sent on Vercel
            // serverless, where a bare fire-and-forget Promise can be killed
            // when the function instance recycles after the response.
            after(() => sendPasswordResetEmail(user.email, user.name, resetToken).catch(console.error));
        }

        // Return generic success message
        return NextResponse.json({
            message: 'If an account exists with this email, a password reset link has been sent',
        });
    } catch (error) {
        console.error('[Password Reset] Error:', error);
        return NextResponse.json(
            { error: 'An error occurred. Please try again later.' },
            { status: 500 }
        );
    }
}
