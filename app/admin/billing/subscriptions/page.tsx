import { Suspense } from 'react';
import { getSubscriptions } from '@/actions/admin/billing';
import { SubscriptionTable } from '@/components/admin/billing/subscription-table';

export default async function SubscriptionsPage() {
    const initialData = await getSubscriptions({ page: 1 });

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-50">Subscriptions</h1>
                <p className="text-zinc-500">Manage all user subscriptions and plans</p>
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }>
                <SubscriptionTable initialData={initialData} />
            </Suspense>
        </div>
    );
}
