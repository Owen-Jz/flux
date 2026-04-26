import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCurrentAdmin } from '@/lib/admin-auth';

export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ admin: null }, { status: 401 });
    }

    const admin = await getCurrentAdmin();

    if (!admin) {
        return NextResponse.json({ admin: null }, { status: 403 });
    }

    return NextResponse.json({
        admin: {
            name: admin.user?.name || 'Admin',
            email: admin.user?.email || session.user.email,
            image: admin.user?.image,
            role: admin.role,
        }
    });
}