import { NextResponse } from 'next/server';
import { getExchangeRate } from '@/lib/paystack';

// Get current USD to NGN exchange rate
export async function GET() {
    try {
        const rate = await getExchangeRate();

        return NextResponse.json({
            success: true,
            rate: rate,
            source: 'USD',
            target: 'NGN',
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Exchange rate error:', error);
        return NextResponse.json(
            { error: 'Failed to get exchange rate' },
            { status: 500 }
        );
    }
}