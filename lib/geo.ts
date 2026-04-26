// Simple IP-based country detection using a free geolocation API

interface GeoLocationResult {
    country: string;
    countryCode: string;
    currency: 'NGN' | 'USD';
    isNigeria: boolean;
}

let cachedGeoLocation: GeoLocationResult | null = null;
let geoLocationCacheTime: number = 0;
const GEO_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getUserCountry(): Promise<GeoLocationResult> {
    const now = Date.now();

    // Return cached result if still valid
    if (cachedGeoLocation && (now - geoLocationCacheTime) < GEO_CACHE_DURATION) {
        return cachedGeoLocation;
    }

    // Try multiple free geolocation APIs
    const apis = [
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

    // Use result or fallback to cached value or Nigeria default
    if (geoResult) {
        cachedGeoLocation = geoResult;
        geoLocationCacheTime = now;
        return geoResult;
    }

    // Return cached value if available, otherwise default to Nigeria
    if (cachedGeoLocation) {
        return cachedGeoLocation;
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
