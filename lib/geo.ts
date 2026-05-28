// IP-based country detection using free geolocation APIs
// Accepts a client IP to geolocate the end user, not the server.

interface GeoLocationResult {
    country: string;
    countryCode: string;
    currency: 'NGN' | 'USD';
    isNigeria: boolean;
}

// Per-IP cache: avoids re-fetching for the same client IP within the TTL
const GEO_CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const GEO_CACHE_MAX_ENTRIES = 1000;
const ipCache = new Map<string, { result: GeoLocationResult; timestamp: number }>();

function pruneCache(): void {
    if (ipCache.size <= GEO_CACHE_MAX_ENTRIES) return;
    // Evict oldest entries until we're under the limit
    const entries = [...ipCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, entries.length - GEO_CACHE_MAX_ENTRIES);
    for (const [key] of toRemove) {
        ipCache.delete(key);
    }
}

export async function getUserCountry(clientIp?: string): Promise<GeoLocationResult> {
    const now = Date.now();

    // Return cached result for this IP if still valid
    if (clientIp) {
        const cached = ipCache.get(clientIp);
        if (cached && (now - cached.timestamp) < GEO_CACHE_DURATION) {
            return cached.result;
        }
    }

    // Build API URLs -- when a clientIp is provided, pass it to get the user's location
    const apis = clientIp
        ? [
            { url: `https://ipapi.co/${clientIp}/json/`, name: 'ipapi.co' },
            { url: `https://ipwho.is/${clientIp}`, name: 'ipwho.is' },
        ]
        : [
            { url: 'https://ipapi.co/json/', name: 'ipapi.co' },
            { url: 'https://ipwho.is/', name: 'ipwho.is' },
        ];

    let geoResult: GeoLocationResult | null = null;

    for (const api of apis) {
        try {
            const response = await fetch(api.url, {
                next: { revalidate: 3600 }
            });

            if (!response.ok) {
                console.warn(`GeoAPI ${api.name} returned ${response.status}`);
                continue;
            }

            const data = await response.json();

            // Handle different API response formats
            let countryCode = '';
            let countryName = '';

            if (api.name === 'ipapi.co') {
                countryCode = data.country_code || '';
                countryName = data.country || '';
            } else if (api.name === 'ipwho.is') {
                countryCode = data.country_code || '';
                countryName = data.country || data.country_name || '';
            }

            const isNigeria = countryCode === 'NG' ||
                countryName.toLowerCase() === 'nigeria';

            geoResult = {
                country: countryName || 'Unknown',
                countryCode: countryCode || 'XX',
                currency: isNigeria ? 'NGN' : 'USD',
                isNigeria
            };

            console.log(`GeoIP (${api.name}): ${geoResult.country} (${geoResult.countryCode}) -> ${geoResult.currency}`);
            break; // Success, exit loop

        } catch (error) {
            console.warn(`GeoAPI ${api.name} failed:`, error);
        }
    }

    // Cache successful result per IP
    if (geoResult) {
        if (clientIp) {
            ipCache.set(clientIp, { result: geoResult, timestamp: now });
            pruneCache();
        }
        return geoResult;
    }

    // Check cache for a stale entry for this IP (better than nothing)
    if (clientIp) {
        const stale = ipCache.get(clientIp);
        if (stale) {
            return stale.result;
        }
    }

    // Default to NGN for Nigerian users (most common case)
    console.log('GeoIP: Using fallback (Nigeria)');
    return {
        country: 'Nigeria',
        countryCode: 'NG',
        currency: 'NGN',
        isNigeria: true
    };
}

export function isNigeriaCountry(countryCode: string): boolean {
    return countryCode === 'NG';
}
