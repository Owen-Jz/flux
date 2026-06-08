import { NextRequest, NextResponse } from 'next/server';
import { getUserCountry } from '@/lib/geo';
import { getExchangeRate } from '@/lib/paystack';

export async function GET(request: NextRequest) {
    try {
        // Extract the end-user's IP from proxy headers
        const forwarded = request.headers.get('x-forwarded-for');
        const clientIp = forwarded
            ? forwarded.split(',')[0].trim()
            : request.headers.get('x-real-ip') || undefined;

        const geo = await getUserCountry(clientIp);
        const exchangeRate = await getExchangeRate();

        // Pricing is always displayed in USD regardless of the visitor's location.
        // We still surface the detected country for informational purposes, but the
        // currency is fixed to USD so the UI never renders Naira.
        return NextResponse.json({
            country: geo.country,
            countryCode: geo.countryCode,
            currency: 'USD',
            isNigeria: geo.isNigeria,
            exchangeRate: exchangeRate,
            displayCurrency: '$',
        });
    } catch (error) {
        console.error('Geo API error:', error);
        // Always return valid fallback data — USD display in all cases.
        return NextResponse.json({
            country: 'Unknown',
            countryCode: 'XX',
            currency: 'USD',
            isNigeria: false,
            exchangeRate: 1348,
            displayCurrency: '$',
        });
    }
}
