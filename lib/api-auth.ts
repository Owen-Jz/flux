import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { ApiKey, User } from '@/models';

export interface ApiKeyAuthResult {
    user: {
        id: string;
        email: string;
        name: string;
        plan: string;
    };
    apiKey: {
        id: string;
        name: string;
        keyPrefix: string;
    };
}

export async function verifyApiKey(request: NextRequest): Promise<{ user: ApiKeyAuthResult['user']; apiKey: ApiKeyAuthResult['apiKey'] } | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7);
    if (!token || !token.startsWith('flx_')) {
        return null;
    }

    // First 8 chars after "flx_" are the prefix
    const keyPrefix = token.slice(0, 8);
    const fullKey = token;

    await connectDB();

    const apiKeyRecord = await ApiKey.findOne({ keyPrefix });
    if (!apiKeyRecord) {
        return null;
    }

    // Check expiry
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
        return null;
    }

    // Verify key against hash
    const isValid = await bcrypt.compare(fullKey, apiKeyRecord.keyHash);
    if (!isValid) {
        return null;
    }

    // Update last used
    apiKeyRecord.lastUsedAt = new Date();
    await apiKeyRecord.save();

    // Fetch user
    const user = await User.findById(apiKeyRecord.userId).select('name email plan');
    if (!user) {
        return null;
    }

    return {
        user: {
            id: apiKeyRecord.userId.toString(),
            email: user.email,
            name: user.name,
            plan: user.plan,
        },
        apiKey: {
            id: apiKeyRecord._id.toString(),
            name: apiKeyRecord.name,
            keyPrefix: apiKeyRecord.keyPrefix,
        },
    };
}

export function requireApiKey() {
    return async (request: NextRequest) => {
        const result = await verifyApiKey(request);
        if (!result) {
            return NextResponse.json({ error: 'Invalid or expired API key' }, { status: 401 });
        }
        return result;
    };
}