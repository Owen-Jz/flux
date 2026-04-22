import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Workspace } from '@/models/Workspace';
import { Board } from '@/models/Board';
import { Task } from '@/models/Task';
import bcrypt from 'bcryptjs';

// In-memory store for test user tracking (survives across API calls within same process)
const testUsers = new Map<string, { email: string; password: string; userId: string }>();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const { email, password, name } = body;

        // Generate unique test user if not provided
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const testEmail = email || `test.${uniqueSuffix}@example.com`;
        const testPassword = password || 'TestPassword123!';
        const testName = name || `Test User ${uniqueSuffix}`;

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email: testEmail });
        if (existingUser) {
            return NextResponse.json({
                email: existingUser.email,
                password: testPassword,
                userId: existingUser._id.toString(),
                message: 'Test user already exists',
            });
        }

        // Create new test user
        const hashedPassword = await bcrypt.hash(testPassword, 12);
        const user = await User.create({
            name: testName,
            email: testEmail,
            password: hashedPassword,
            emailVerified: new Date(),
            plan: 'free',
        });

        const userId = user._id.toString();

        // Track this test user
        testUsers.set(userId, {
            email: testEmail,
            password: testPassword,
            userId,
        });

        return NextResponse.json({
            email: testEmail,
            password: testPassword,
            userId,
            message: 'Test user created',
        }, { status: 201 });
    } catch (error) {
        console.error('[test-users] POST error:', error);
        return NextResponse.json(
            { error: 'Failed to create test user' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const email = searchParams.get('email');

        await connectDB();

        // Find user by ID or email
        let user;
        if (userId) {
            user = await User.findById(userId);
        } else if (email) {
            user = await User.findOne({ email });
        }

        if (!user) {
            return NextResponse.json({ message: 'User not found, nothing to delete' });
        }

        const userIdStr = user._id.toString();

        // Delete all tasks in user's workspaces
        const workspaces = await Workspace.find({
            'members.userId': user._id,
        });
        for (const workspace of workspaces) {
            await Task.deleteMany({ workspaceId: workspace._id });
            await Board.deleteMany({ workspaceId: workspace._id });
        }

        // Delete all workspaces for this user
        await Workspace.deleteMany({ 'members.userId': user._id });

        // Delete the user
        await User.findByIdAndDelete(userIdStr);

        // Remove from tracking
        testUsers.delete(userIdStr);

        return NextResponse.json({ message: 'Test user and all associated data deleted' });
    } catch (error) {
        console.error('[test-users] DELETE error:', error);
        return NextResponse.json(
            { error: 'Failed to delete test user' },
            { status: 500 }
        );
    }
}

export async function GET() {
    // Return list of tracked test users (for debugging)
    const users = Array.from(testUsers.values()).map(u => ({
        email: u.email,
        userId: u.userId,
    }));
    return NextResponse.json({ users, count: users.length });
}
