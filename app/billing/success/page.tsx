import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { BillingSuccessClient } from './success-client';

type PlanId = 'starter' | 'pro' | 'enterprise';

interface BillingSuccessPageProps {
    searchParams: Promise<{ plan?: string; currency?: string; reference?: string; trxref?: string }>;
}

export default async function BillingSuccessPage({ searchParams }: BillingSuccessPageProps) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/billing/success');
    }

    const params = await searchParams;
    const reference = params.reference || params.trxref || null;

    await connectDB();

    const dbUser = await User.findById(session.user.id)
        .select('plan subscriptionStatus subscriptionPlanId lastUpgradeAt name email')
        .lean();

    if (!dbUser) {
        redirect('/login');
    }

    const initialPlan: PlanId = (dbUser.subscriptionPlanId as PlanId | undefined)
        || (dbUser.plan as PlanId | undefined)
        || 'pro';
    const isAlreadyActive = dbUser.subscriptionStatus === 'active' && dbUser.plan !== 'free';

    return (
        <BillingSuccessClient
            reference={reference}
            initialPlan={initialPlan}
            initialIsActive={isAlreadyActive}
            userName={dbUser.name || ''}
        />
    );
}
