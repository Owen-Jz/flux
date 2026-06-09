import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Workspace } from '@/models/Workspace';
import { Board } from '@/models/Board';
import { Task } from '@/models/Task';
import { ActivityLog } from '@/models/ActivityLog';
import { isAuthorizedCron } from '@/lib/cron-auth';

// Permanently purge workspaces that were soft-deleted more than 30 days ago.
// Schedule via cron (e.g., daily at midnight).
export async function GET(request: NextRequest) {
    if (!isAuthorizedCron(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const stale = await Workspace.find({ deletedAt: { $lt: cutoff } }).select('_id');

    let purged = 0;
    for (const ws of stale) {
        const boards = await Board.find({ workspaceId: ws._id }).select('_id');
        const boardIds = boards.map((b) => b._id);
        if (boardIds.length > 0) {
            await Task.deleteMany({ boardId: { $in: boardIds } });
        }
        await Task.deleteMany({ workspaceId: ws._id });
        await ActivityLog.deleteMany({ workspaceId: ws._id });
        await Board.deleteMany({ workspaceId: ws._id });
        await Workspace.deleteOne({ _id: ws._id });
        purged++;
    }

    return NextResponse.json({ purged });
}
