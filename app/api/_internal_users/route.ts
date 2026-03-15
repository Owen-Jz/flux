import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

// Internal endpoint for admin operations - MUST be protected
// Only accessible in development or by authenticated admin users
export async function GET() {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    try {
        await connectDB();
        const users = await User.find({}).select('name email image createdAt').lean();
        return NextResponse.json(users);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
