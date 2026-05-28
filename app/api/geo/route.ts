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

        return NextResponse.json({
            country: geo.country,
            countryCode: geo.countryCode,
            currency: geo.currency,
            isNigeria: geo.isNigeria,
            exchangeRate: exchangeRate,
            displayCurrency: geo.currency === 'NGN' ? '₦' : '$',
        });
    } catch (error) {
        console.error('Geo API error:', error);
        // Always return valid fallback data
        return NextResponse.json({
            country: 'Nigeria',
            countryCode: 'NG',
            currency: 'NGN',
            isNigeria: true,
            exchangeRate: 1348,
            displayCurrency: '₦',
        });
    }
}
