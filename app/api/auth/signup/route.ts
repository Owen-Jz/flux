import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { addUserToWorkspaceFromInvite } from '@/lib/process-workspace-invite';
import { signupSchema } from '@/lib/validations/auth';
import { sendTrialStartedEmail } from '@/lib/email/subscription-notifications';
import { sendEmail } from '@/lib/email/resend';

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

        const verifyUrl = `${process.env.NEXTAUTH_URL || 'https://fluxboard.site'}/api/auth/verify-email?token=${emailVerificationToken}&email=${encodeURIComponent(email)}`;
        sendEmail({
            to: email,
            subject: 'Verify your Flux account',
            html: `<p>Hi ${name},</p><p>Welcome to Flux! Please verify your email address by clicking the link below:</p><p><a href="${verifyUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Verify Email</a></p><p>This link expires in 24 hours.</p><p>If you didn't create this account, you can safely ignore this email.</p>`,
        }).catch(console.error);

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
