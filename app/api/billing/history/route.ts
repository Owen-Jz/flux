import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getCustomer, listCustomerTransactions } from '@/lib/paystack';

/**
 * GET /api/billing/history
 *
 * Returns the authenticated user's Paystack payment history (successful and
 * failed charges) so the billing page can render receipts. Degrades to an empty
 * list for users who have never paid.
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id)
        .select('email billingEmail paystackCustomerCode')
        .lean();

    if (!user) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // No Paystack customer yet → no billing history.
    if (!user.paystackCustomerCode) {
        return NextResponse.json({ transactions: [] });
    }

    const email = user.billingEmail || user.email;
    const customer = await getCustomer(email);
    if (!customer) {
        return NextResponse.json({ transactions: [] });
    }

    const transactions = await listCustomerTransactions(customer.id);

    const formatted = transactions
        .map((t) => ({
            reference: t.reference,
            amount: t.amount / 100,
            currency: t.currency,
            status: t.status,
            date: t.paid_at || t.created_at,
            channel: t.channel ?? null,
        }))
        // Most recent first.
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ transactions: formatted });
}
