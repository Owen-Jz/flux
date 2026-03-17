import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { addUserToWorkspaceFromInvite } from '@/lib/process-workspace-invite';

export async function POST(request: NextRequest) {
    // Apply rate limiting - 5 signup attempts per 15 minutes per IP
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(ip, 5, 15 * 60);

    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: `Too many signup attempts. Please try again in ${rateLimitResult.resetIn} seconds` },
            { status: 429 }
        );
    }

    try {
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        await connectDB();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        // Process any pending workspace invitations
        const addedWorkspaces = await addUserToWorkspaceFromInvite(
            user._id.toString(),
            email
        );

        return NextResponse.json(
            {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                addedWorkspaces,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
