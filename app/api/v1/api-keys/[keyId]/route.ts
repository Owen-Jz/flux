import { NextRequest, NextResponse } from 'next/server';
import { revokeApiKey } from '@/actions/api-key';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ keyId: string }> }
) {
    try {
        const { keyId } = await params;
        await revokeApiKey(keyId);
        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to revoke API key';
        return NextResponse.json({ error: message }, { status: 404 });
    }
}