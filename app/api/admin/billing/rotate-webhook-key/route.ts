import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { WebhookKeyRotation } from '@/models/WebhookKeyRotation';
import { AuditLog } from '@/models/AuditLog';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
    try {
        const admin = await requireAdmin();
        await connectDB();

        const currentSecret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;

        const newSecret = crypto.randomBytes(32).toString('hex');
        const newSecretHash = crypto.createHash('sha256').update(newSecret).digest('hex');

        const currentHash = crypto.createHash('sha256').update(currentSecret).digest('hex');

        let previousHash = '';
        const existing = await WebhookKeyRotation.findOne().sort({ rotatedAt: -1 });
        if (existing) {
            previousHash = existing.currentKeyHash;
        }

        const keyHint = newSecret.slice(0, 8) + '...' + newSecret.slice(-4);

        await WebhookKeyRotation.create({
            currentKeyHash: newSecretHash,
            previousKeyHash: currentHash,
            keyHint,
        });

        await AuditLog.create({
            adminId: admin.id,
            action: 'ROTATE_WEBHOOK_SECRET',
            targetType: 'admin',
            targetId: admin.id,
            details: { keyHint, rotatedAt: new Date().toISOString() },
        });

        return NextResponse.json({
            success: true,
            newSecret,
            keyHint,
            message: 'Store this secret securely. It will not be shown again.',
        });
    } catch (error) {
        console.error('Webhook key rotation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to rotate webhook secret' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        await requireAdmin();
        await connectDB();

        const rotation = await WebhookKeyRotation.findOne().sort({ rotatedAt: -1 });

        if (!rotation) {
            return NextResponse.json({ rotated: false });
        }

        return NextResponse.json({
            rotated: true,
            keyHint: rotation.keyHint,
            rotatedAt: rotation.rotatedAt,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to get rotation status' },
            { status: 500 }
        );
    }
}