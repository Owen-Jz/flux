'use server';

import { connectDB } from '@/lib/db';
import { WebhookEndpoint } from '@/models';
import { nanoid } from 'nanoid';
import { verifyApiKey } from '@/lib/api-auth';
import { Webhook } from 'svix';

function generateSigningSecret(): string {
    return `whsk_${nanoid(32)}`;
}

export async function createWebhookEndpoint(
    data: { url: string; events: string[]; workspaceFilter?: string },
    request: Request
) {
    const auth = await (await import('@/lib/auth')).auth();
    if (!auth?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const user = await (await import('@/models/User')).User.findById(auth.user.id);
    if (!user || user.plan === 'free' || user.plan === 'starter') {
        throw new Error('Webhook endpoints require a Pro subscription or higher');
    }

    const signingSecret = generateSigningSecret();

    const endpoint = await WebhookEndpoint.create({
        userId: auth.user.id,
        url: data.url,
        signingSecret,
        events: data.events,
        workspaceFilter: data.workspaceFilter || null,
        active: true,
    });

    return {
        id: endpoint._id.toString(),
        url: endpoint.url,
        signingSecret,
        events: endpoint.events,
        workspaceFilter: endpoint.workspaceFilter?.toString() || null,
        active: endpoint.active,
    };
}

export async function listWebhooks() {
    const auth = await (await import('@/lib/auth')).auth();
    if (!auth?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const endpoints = await WebhookEndpoint.find({ userId: auth.user.id }).sort({ createdAt: -1 });

    return endpoints.map((e) => ({
        id: e._id.toString(),
        url: e.url,
        events: e.events,
        workspaceFilter: e.workspaceFilter?.toString() || null,
        active: e.active,
        createdAt: e.createdAt.toISOString(),
    }));
}

export async function deleteWebhook(webhookId: string) {
    const auth = await (await import('@/lib/auth')).auth();
    if (!auth?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const result = await WebhookEndpoint.deleteOne({ _id: webhookId, userId: auth.user.id });
    if (result.deletedCount === 0) {
        throw new Error('Webhook endpoint not found');
    }

    return { success: true };
}

export async function toggleWebhook(webhookId: string, active: boolean) {
    const auth = await (await import('@/lib/auth')).auth();
    if (!auth?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    await WebhookEndpoint.updateOne({ _id: webhookId, userId: auth.user.id }, { $set: { active } });
    return { success: true };
}

export async function testWebhook(webhookId: string) {
    const auth = await (await import('@/lib/auth')).auth();
    if (!auth?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const endpoint = await WebhookEndpoint.findOne({ _id: webhookId, userId: auth.user.id });
    if (!endpoint) {
        throw new Error('Webhook endpoint not found');
    }

    const testPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: { message: 'This is a test webhook delivery' },
    };

    const payloadStr = JSON.stringify(testPayload);
    const wh = new Webhook(endpoint.signingSecret);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = wh.create(payloadStr, { 'svix-id': crypto.randomUUID(), 'svix-timestamp': timestamp } as Record<string, string>);

    const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'svix-id': crypto.randomUUID(),
            'svix-timestamp': timestamp,
            'svix-signature': signature,
        },
        body: payloadStr,
    });

    return {
        success: response.ok,
        statusCode: response.status,
    };
}