import { WebhookEndpoint } from '@/models';

interface WebhookPayload {
    event: string;
    timestamp: string;
    workspaceId: string;
    data: Record<string, unknown>;
}

export async function emitEvent(
    userId: string,
    event: string,
    workspaceId: string,
    data: Record<string, unknown>
): Promise<void> {
    const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        workspaceId,
        data,
    };

    // Find all active endpoints for this user that subscribe to this event
    const endpoints = await WebhookEndpoint.find({
        userId,
        active: true,
        events: event,
        $or: [
            { workspaceFilter: null },
            { workspaceFilter: workspaceId },
        ],
    });

    if (endpoints.length === 0) return;

    // Deliver to each endpoint using Svix
    const { Webhook } = await import('svix');

    const deliveryPromises = endpoints.map(async (endpoint) => {
        try {
            const wh = new Webhook(endpoint.signingSecret);
            // Svix expects raw body + headers signature verification
            // We send as JSON string
            const payloadStr = JSON.stringify(payload);
            const headers = {
                'Content-Type': 'application/json',
                'svix-id': crypto.randomUUID(),
                'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
                'svix-signature': '',
            };

            // Create signature
            const signature = wh.create(payloadStr, headers);
            headers['svix-signature'] = signature;

            const response = await fetch(endpoint.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'svix-id': headers['svix-id'],
                    'svix-timestamp': headers['svix-timestamp'],
                    'svix-signature': headers['svix-signature'],
                },
                body: payloadStr,
            });

            if (!response.ok) {
                console.error(`Webhook delivery failed for endpoint ${endpoint._id}: ${response.status}`);
            }
        } catch (error) {
            console.error(`Webhook delivery error for endpoint ${endpoint._id}:`, error);
        }
    });

    await Promise.allSettled(deliveryPromises);
}

export function buildTaskPayload(event: string, task: Record<string, unknown>, workspaceId: string) {
    return { event, workspaceId, data: { taskId: task._id?.toString(), boardId: task.boardId?.toString(), workspaceId, ...task } };
}

export function buildBoardPayload(event: string, board: Record<string, unknown>, workspaceId: string) {
    return { event, workspaceId, data: { boardId: board._id?.toString(), workspaceId, ...board } };
}

export function buildMemberPayload(event: string, workspaceId: string, userId: string, role?: string) {
    return { event, workspaceId, data: { workspaceId, userId, role } };
}

export function buildWorkspacePayload(event: string, workspaceId: string, settings: Record<string, unknown>) {
    return { event, workspaceId, data: { workspaceId, ...settings } };
}

export function buildDecomposePayload(event: string, task: Record<string, unknown>, workspaceId: string) {
    return { event, workspaceId, data: { taskId: task._id?.toString(), workspaceId, title: task.title, summary: task.summary } };
}