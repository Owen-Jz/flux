import { WebhookEndpoint } from '@/models';

async function deliverWithRetry(
    url: string,
    payloadStr: string,
    headers: Record<string, string>,
    maxRetries = 2
): Promise<void> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, { method: 'POST', headers, body: payloadStr });
            if (response.ok) return;
            // 4xx errors are caller's fault — don't retry
            if (response.status >= 400 && response.status < 500) return;
        } catch {
            if (attempt === maxRetries) return;
        }
        if (attempt < maxRetries) {
            await new Promise<void>((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
    }
}

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
            const payloadStr = JSON.stringify(payload);
            const msgId = crypto.randomUUID();
            const timestamp = new Date();
            const signature = wh.sign(msgId, timestamp, payloadStr);
            const headers = {
                'Content-Type': 'application/json',
                'svix-id': msgId,
                'svix-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
                'svix-signature': signature,
            };

            await deliverWithRetry(
                endpoint.url,
                payloadStr,
                {
                    'Content-Type': 'application/json',
                    'svix-id': headers['svix-id'],
                    'svix-timestamp': headers['svix-timestamp'],
                    'svix-signature': headers['svix-signature'],
                }
            );
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