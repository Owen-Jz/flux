import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { addUserToWorkspaceFromInvite } from '@/lib/process-workspace-invite';
import { signupSchema } from '@/lib/validations/auth';
import { sendTrialStartedEmail } from '@/lib/email/subscription-notifications';
import { sendOtpEmail } from '@/lib/email/auth-emails';

export async function POST(request: NextRequest) {
    // Apply rate limiting - 5 signup attempts per 15 minutes per IP
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(ip, 5, 15 * 60);

    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: `Too many signup attempts. Please try again in ${rateLimitResult.resetIn} seconds` },
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
        const body = await request.json();

        // Validate input using Zod schema
        const validationResult = signupSchema.safeParse(body);
        if (!validationResult.success) {
            const errors = validationResult.error.issues.map(e => e.message);
            return NextResponse.json(
                { error: errors[0], errors },
                { status: 400 }
            );
        }

        const { name, email, password, plan } = validationResult.data;

        // Default to free, but if a plan is specified and it's a valid trial plan, set up the trial
        const trialPlans = ['starter', 'pro'] as const;
        const isTrialPlan = plan && trialPlans.includes(plan);
        const initialPlan = isTrialPlan ? plan : 'free';
        const trialEndsAt = isTrialPlan
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
            : undefined;

        await connectDB();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate a 6-digit OTP for email verification
        const rawOtp = String(Math.floor(100000 + Math.random() * 900000));
        const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');
        const emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Also keep a fallback link token (24 hr)
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            emailVerificationToken,
            emailVerificationExpires,
            emailOtp: hashedOtp,
            emailOtpExpires,
            plan: initialPlan,
            trialEndsAt,
            hasUsedTrial: isTrialPlan ? true : false,
        });

        if (trialEndsAt) {
            sendTrialStartedEmail({ email: user.email, name: user.name }, initialPlan, trialEndsAt);
        }

        // Process any pending workspace invitations
        const addedWorkspaces = await addUserToWorkspaceFromInvite(
            user._id.toString(),
            email
        );

        // Send OTP verification email (non-blocking)
        sendOtpEmail(email, name, rawOtp).catch(console.error);

        return NextResponse.json(
            {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                addedWorkspaces,
                requiresVerification: true,
                message: 'Account created. Please check your email for your 6-digit verification code.',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
