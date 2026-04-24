import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptions } from '@/actions/admin/billing';
import type { PlanType } from '@/lib/types/billing';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    const search = searchParams.get('search') || undefined;
    const plan = (searchParams.get('plan') || undefined) as PlanType | undefined;
    const status = searchParams.get('status') || undefined;
    const page = Number(searchParams.get('page')) || 1;

    try {
        const data = await getSubscriptions({ search, plan, status, page });
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
}
