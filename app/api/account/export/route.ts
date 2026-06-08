import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Workspace } from '@/models/Workspace';
import { Board } from '@/models/Board';
import { Task } from '@/models/Task';
import { Issue } from '@/models/Issue';
import { ApiKey } from '@/models/ApiKey';
import { WebhookEndpoint } from '@/models/WebhookEndpoint';

/**
 * GET /api/account/export
 *
 * GDPR right-of-access / data-portability endpoint. Returns a JSON file
 * containing the authenticated user's profile and every workspace, board,
 * task, and issue they can access, plus the metadata (never the secrets) of
 * their API keys and webhook endpoints.
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;
    const userObjectId = new Types.ObjectId(userId);

    const user = await User.findById(userId).lean();
    if (!user) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Workspaces the user is a member of (excluding soft-deleted ones).
    const workspaces = await Workspace.find({
        'members.userId': userObjectId,
        deletedAt: { $exists: false },
    }).lean();

    const workspaceIds = workspaces.map((w) => w._id);

    const [boards, tasks, issues, apiKeys, webhooks] = await Promise.all([
        Board.find({ workspaceId: { $in: workspaceIds } }).lean(),
        Task.find({ workspaceId: { $in: workspaceIds } }).lean(),
        Issue.find({ workspaceId: { $in: workspaceIds } }).lean(),
        ApiKey.find({ userId: userObjectId })
            .select('name keyPrefix lastUsedAt expiresAt createdAt')
            .lean(),
        WebhookEndpoint.find({ userId: userObjectId })
            .select('url events active createdAt')
            .lean(),
    ]);

    const roleByWorkspace = new Map<string, string | undefined>(
        workspaces.map((w) => {
            const member = w.members?.find(
                (m: { userId?: { toString: () => string } }) => m.userId?.toString() === userId
            );
            return [w._id.toString(), member?.role];
        })
    );

    const exportData = {
        format: 'flux-account-export-v1',
        exportedAt: new Date().toISOString(),
        account: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image ?? null,
            plan: user.plan,
            subscriptionStatus: user.subscriptionStatus ?? null,
            emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
            createdAt: user.createdAt ? user.createdAt.toISOString() : null,
        },
        workspaces: workspaces.map((w) => ({
            id: w._id.toString(),
            name: w.name,
            slug: w.slug,
            yourRole: roleByWorkspace.get(w._id.toString()) ?? null,
            isOwner: w.ownerId.toString() === userId,
            memberCount: w.members?.length ?? 0,
        })),
        boards: boards.map((b) => ({
            id: b._id.toString(),
            workspaceId: b.workspaceId.toString(),
            name: b.name,
            description: b.description ?? null,
        })),
        tasks: tasks.map((t) => ({
            id: t._id.toString(),
            boardId: t.boardId?.toString() ?? null,
            workspaceId: t.workspaceId.toString(),
            title: t.title,
            description: t.description ?? null,
            status: t.status,
            priority: t.priority ?? null,
            dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
            assignees: (t.assignees ?? []).map((a: unknown) => String(a)),
            subtasks: (t.subtasks ?? []).map((s: { title?: string; completed?: boolean }) => ({
                title: s.title ?? '',
                completed: s.completed ?? false,
            })),
            createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : null,
        })),
        issues: issues.map((i) => ({
            id: i._id.toString(),
            workspaceId: i.workspaceId.toString(),
            title: i.title,
            description: i.description ?? null,
            status: i.status,
            priority: i.priority,
            type: i.type,
        })),
        apiKeys: apiKeys.map((k) => ({
            name: k.name,
            keyPrefix: k.keyPrefix,
            lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : null,
            expiresAt: k.expiresAt ? new Date(k.expiresAt).toISOString() : null,
            createdAt: k.createdAt ? new Date(k.createdAt).toISOString() : null,
        })),
        webhooks: webhooks.map((wh) => ({
            url: wh.url,
            events: wh.events ?? [],
            active: wh.active,
        })),
    };

    const filename = `flux-export-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
        },
    });
}
