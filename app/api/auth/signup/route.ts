import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { addUserToWorkspaceFromInvite } from '@/lib/process-workspace-invite';
import { signupSchema } from '@/lib/validations/auth';
import { sendTrialStartedEmail } from '@/lib/email/subscription-notifications';

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
            const errors = validationResult.error.errors.map(e => e.message);
            return NextResponse.json(
                { error: errors[0], errors },
                { status: 400 }
            );
        }

        const { name, email, password, plan } = validationResult.data;

        // Default to free, but if a plan is specified and it's a valid trial plan, set up the trial
        const trialPlans = ['starter', 'pro'];
        const initialPlan = trialPlans.includes(plan) ? plan : 'free';
        const trialEndsAt = trialPlans.includes(plan)
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

        // SECURITY FIX: Generate email verification token
        // User will not be verified until they click the verification link
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            // emailVerified remains undefined/null until email is confirmed
            emailVerificationToken,
            emailVerificationExpires,
            plan: initialPlan,
            trialEndsAt,
            hasUsedTrial: trialPlans.includes(plan) ? true : false,
        });

        if (trialEndsAt) {
            sendTrialStartedEmail({ email: user.email, name: user.name }, initialPlan, trialEndsAt);
        }

        // Process any pending workspace invitations
        const addedWorkspaces = await addUserToWorkspaceFromInvite(
            user._id.toString(),
            email
        );

        // TODO: Send verification email with the token
        // await sendEmailVerification(email, emailVerificationToken);

        return NextResponse.json(
            {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                addedWorkspaces,
                message: 'Account created. Please check your email to verify your account.',
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
