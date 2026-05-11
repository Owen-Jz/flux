'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ApiKey } from '@/models';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const KEY_PREFIX_LENGTH = 8;

function generateApiKey(): string {
    const randomBytes = nanoid(32);
    return `flx_${randomBytes.slice(0, KEY_PREFIX_LENGTH)}${randomBytes.slice(KEY_PREFIX_LENGTH)}`;
}

export async function createApiKey(data: { name: string; expiresAt?: string }) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const user = await (await import('@/models/User')).User.findById(session.user.id);
    if (!user) {
        throw new Error('User not found');
    }

    // Pro-tier check
    if (user.plan === 'free' || user.plan === 'starter') {
        throw new Error('API keys require a Pro subscription or higher');
    }

    const rawKey = generateApiKey();
    const keyPrefix = rawKey.slice(4, 12); // after "flx_"
    const keyHash = await bcrypt.hash(rawKey, 12);

    const apiKey = await ApiKey.create({
        userId: session.user.id,
        name: data.name,
        keyPrefix,
        keyHash,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    return {
        id: apiKey._id.toString(),
        name: apiKey.name,
        key: rawKey, // only returned once
        keyPrefix: apiKey.keyPrefix,
        expiresAt: apiKey.expiresAt?.toISOString() || null,
        createdAt: apiKey.createdAt.toISOString(),
    };
}

export async function listApiKeys() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const keys = await ApiKey.find({ userId: session.user.id })
        .select('name keyPrefix expiresAt lastUsedAt createdAt')
        .sort({ createdAt: -1 });

    return keys.map((k) => ({
        id: k._id.toString(),
        name: k.name,
        keyPrefix: k.keyPrefix,
        expiresAt: k.expiresAt?.toISOString() || null,
        lastUsedAt: k.lastUsedAt?.toISOString() || null,
        createdAt: k.createdAt.toISOString(),
    }));
}

export async function revokeApiKey(keyId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await connectDB();

    const result = await ApiKey.deleteOne({ _id: keyId, userId: session.user.id });
    if (result.deletedCount === 0) {
        throw new Error('API key not found');
    }

    return { success: true };
}