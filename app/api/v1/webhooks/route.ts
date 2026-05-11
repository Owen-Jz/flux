import { NextRequest, NextResponse } from 'next/server';
import { listWebhooks, createWebhookEndpoint } from '@/actions/webhook';

export async function GET(request: NextRequest) {
    if (request.nextUrl.searchParams.get('plan-check') === '1') {
        const session = await (await import('@/lib/auth')).auth();
        if (!session?.user?.id) return NextResponse.json({ plan: 'free' });
        await (await import('@/lib/db')).connectDB();
        const user = await (await import('@/models/User')).User.findById(session.user.id).select('plan');
        return NextResponse.json({ plan: user?.plan || 'free' });
    }
    try {
        const webhooks = await listWebhooks();
        return NextResponse.json({ webhooks });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list webhooks';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, events, workspaceFilter } = body;

        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }

        if (!events || !Array.isArray(events) || events.length === 0) {
            return NextResponse.json({ error: 'At least one event must be selected' }, { status: 400 });
        }

        const result = await createWebhookEndpoint({ url, events, workspaceFilter }, request as unknown as Request);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create webhook';
        const status = message.includes('Pro subscription') ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}