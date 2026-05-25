import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        await connectDB();

        const result = await User.updateOne(
            { email },
            {
                $set: {
                    plan: 'free',
                    trialEndsAt: null,
                    hasUsedTrial: false,
                    trialPromptDismissedAt: null,
                    trialWarningSent: false
                }
            }
        );

        return NextResponse.json({
            success: true,
            modified: result.modifiedCount,
            email
        });
    } catch (error) {
        console.error('Reset trial error:', error);
        return NextResponse.json({ error: 'Failed to reset trial' }, { status: 500 });
    }
}