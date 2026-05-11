import { NextRequest, NextResponse } from 'next/server';
import { deleteWebhook, toggleWebhook, testWebhook } from '@/actions/webhook';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ webhookId: string }> }
) {
    try {
        const { webhookId } = await params;
        const body = await request.json();

        if (body.active !== undefined) {
            await toggleWebhook(webhookId, body.active);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update webhook';
        return NextResponse.json({ error: message }, { status: 404 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ webhookId: string }> }
) {
    try {
        const { webhookId } = await params;
        await deleteWebhook(webhookId);
        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete webhook';
        return NextResponse.json({ error: message }, { status: 404 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ webhookId: string }> }
) {
    try {
        const { webhookId } = await params;
        const result = await testWebhook(webhookId);
        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to test webhook';
        return NextResponse.json({ error: message }, { status: 404 });
    }
}