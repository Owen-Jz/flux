import { NextRequest, NextResponse } from 'next/server';
import { listApiKeys, createApiKey } from '@/actions/api-key';

export async function GET(request: NextRequest) {
    if (request.nextUrl.searchParams.get('plan-check') === '1') {
        const session = await (await import('@/lib/auth')).auth();
        if (!session?.user?.id) return NextResponse.json({ plan: 'free' });
        await (await import('@/lib/db')).connectDB();
        const user = await (await import('@/models/User')).User.findById(session.user.id).select('plan');
        return NextResponse.json({ plan: user?.plan || 'free' });
    }
    try {
        const keys = await listApiKeys();
        return NextResponse.json({ keys });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list API keys';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, expiresAt } = body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        if (name.length > 100) {
            return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 });
        }

        const result = await createApiKey({ name: name.trim(), expiresAt });
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create API key';
        const status = message.includes('Pro subscription') ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}