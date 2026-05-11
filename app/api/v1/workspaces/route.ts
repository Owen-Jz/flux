import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import { Workspace } from '@/models';

export async function GET(request: NextRequest) {
    const auth = await verifyApiKey(request);
    if (!auth) {
        return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
    }

    await connectDB();

    const workspaces = await Workspace.find({
        'members.userId': auth.user.id,
    })
        .select('name slug settings ownerId members createdAt')
        .lean();

    const result = workspaces.map((w) => ({
        id: w._id.toString(),
        name: w.name,
        slug: w.slug,
        ownerId: w.ownerId.toString(),
        publicAccess: w.settings?.publicAccess || false,
        accentColor: w.settings?.accentColor,
        icon: w.settings?.icon,
        memberCount: w.members.length,
        createdAt: w.createdAt.toISOString(),
    }));

    return NextResponse.json({ workspaces: result });
}