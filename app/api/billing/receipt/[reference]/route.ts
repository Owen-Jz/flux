import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { verifyTransaction } from '@/lib/paystack';

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * GET /api/billing/receipt/[reference]
 *
 * Renders a printable HTML receipt for one of the authenticated user's
 * transactions. The transaction must belong to the requesting user (verified by
 * matching the Paystack customer email) — you can never fetch someone else's.
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ reference: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reference } = await params;

    await connectDB();

    const user = await User.findById(session.user.id)
        .select('name email billingEmail')
        .lean();
    if (!user) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    let transaction;
    try {
        transaction = await verifyTransaction(reference);
    } catch {
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    // Ownership check — the transaction's customer email must match this account.
    const ownedEmails = [user.email, user.billingEmail]
        .filter(Boolean)
        .map((e) => (e as string).toLowerCase());
    if (!ownedEmails.includes(transaction.customer.email.toLowerCase())) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (transaction.status !== 'success') {
        return NextResponse.json({ error: 'Receipt is only available for successful payments' }, { status: 400 });
    }

    const amount = (transaction.amount / 100).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    const currency = escapeHtml(transaction.currency);
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const name = escapeHtml(user.name || 'Customer');
    const email = escapeHtml(transaction.customer.email);
    const ref = escapeHtml(transaction.reference);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Receipt ${ref} — Flux</title>
<style>
  :root { color-scheme: light; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 40px; background: #f9fafb; }
  .receipt { max-width: 640px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 24px; }
  .brand { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
  .badge { display: inline-block; background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; }
  .row .label { color: #6b7280; }
  .row .value { font-weight: 600; text-align: right; }
  .total { border-top: 2px solid #111827; margin-top: 16px; padding-top: 16px; font-size: 20px; font-weight: 800; }
  .foot { margin-top: 32px; font-size: 12px; color: #9ca3af; text-align: center; }
  @media print { body { background: #fff; padding: 0; } .receipt { border: none; } .noprint { display: none; } }
  .btn { display: inline-block; margin: 24px auto 0; background: #111827; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 0; }
</style>
</head>
<body>
  <div class="receipt">
    <div class="head">
      <div>
        <div class="brand">Flux</div>
        <div style="color:#6b7280;font-size:13px;margin-top:4px;">Payment Receipt</div>
      </div>
      <span class="badge">Paid</span>
    </div>
    <div class="row"><span class="label">Billed to</span><span class="value">${name}<br/>${email}</span></div>
    <div class="row"><span class="label">Date</span><span class="value">${date}</span></div>
    <div class="row"><span class="label">Reference</span><span class="value">${ref}</span></div>
    <div class="row total"><span>Total paid</span><span>${currency} ${amount}</span></div>
    <div class="foot">Thank you for using Flux. This receipt was generated for your records.</div>
    <div style="text-align:center;"><button class="btn noprint" onclick="window.print()">Print / Save as PDF</button></div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
}
