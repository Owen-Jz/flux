import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaystackCustomer {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
}

interface PaystackSubscription {
    customer: string;
    plan: string;
}

interface PaystackPlan {
    name: string;
    description: string;
    amount: number;
    interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
    send_invoices?: boolean;
    send_sms?: boolean;
}

interface InitializeTransactionResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

interface VerifyTransactionResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        domain: string;
        status: 'success' | 'failed' | 'abandoned';
        reference: string;
        amount: number;
        currency: string;
        customer: {
            id: number;
            email: string;
            customer_code: string;
        };
    };
}

interface CreateCustomerResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        customer_code: string;
        email: string;
    };
}

interface CreatePlanResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        name: string;
        plan_code: string;
        amount: number;
        interval: string;
    };
}

interface GetSubscriptionResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        customer: string;
        plan: string;
        status: string;
        subscription_code: string;
        email_token: string;
    };
}

// Retry helper with exponential backoff (exported for testing)
// Only retries on 5xx/network errors — 4xx client errors are permanent failures
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelayMs: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const is4xx = lastError.message.includes('Paystack API error: 4');
            if (is4xx || attempt >= maxAttempts) {
                throw lastError;
            }
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

async function paystackFetch<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'POST', body?: object): Promise<T> {
    return withRetry(async () => {
        const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
            method,
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Paystack API error: ${response.status} - ${error}`);
        }

        return response.json();
    });
}

// Create a Paystack customer
export async function createCustomer(data: PaystackCustomer): Promise<string> {
    const result = await paystackFetch<CreateCustomerResponse>('/customer', 'POST', data);
    if (!result.status) {
        throw new Error(result.message);
    }
    return result.data.customer_code;
}

// Get existing customer by email
export async function getCustomer(email: string): Promise<CreateCustomerResponse['data'] | null> {
    try {
        const result = await paystackFetch<{ status: boolean; data: CreateCustomerResponse['data'] }>(
            `/customer/${encodeURIComponent(email)}`,
            'GET'
        );
        return result.status ? result.data : null;
    } catch {
        return null;
    }
}

// Create a subscription plan
export async function createPlan(data: PaystackPlan): Promise<string> {
    const result = await paystackFetch<CreatePlanResponse>('/plan', 'POST', data);
    if (!result.status) {
        throw new Error(result.message);
    }
    return result.data.plan_code;
}

// Get plan by code
export async function getPlan(planCode: string): Promise<CreatePlanResponse['data'] | null> {
    try {
        const result = await paystackFetch<{ status: boolean; data: CreatePlanResponse['data'] }>(
            `/plan/${planCode}`,
            'GET'
        );
        return result.status ? result.data : null;
    } catch {
        return null;
    }
}

// Initialize a transaction (subscription payment)
export async function initializeTransaction(
    email: string,
    amount: number,
    currency: string = 'NGN',
    reference?: string,
    callbackUrl?: string
): Promise<InitializeTransactionResponse> {
    const result = await paystackFetch<InitializeTransactionResponse>('/transaction/initialize', 'POST', {
        email,
        amount: amount * 100, // Paystack expects kobo
        currency,
        reference: reference || `sub_${crypto.randomBytes(12).toString('hex')}`,
        callback_url: callbackUrl,
        metadata: {
            type: 'subscription',
        },
    });

    if (!result.status) {
        throw new Error(result.message);
    }

    return result;
}

// Initialize subscription checkout (with plan)
export async function initializeSubscription(
    email: string,
    planCode: string,
    amountKobo: number,
    callbackUrl?: string
): Promise<InitializeTransactionResponse> {
    const result = await paystackFetch<InitializeTransactionResponse>('/transaction/initialize', 'POST', {
        email,
        plan: planCode,
        amount: amountKobo,
        reference: `sub_${crypto.randomBytes(12).toString('hex')}`,
        callback_url: callbackUrl,
    });

    if (!result.status) {
        throw new Error(result.message);
    }

    return result;
}

// Verify a transaction
export async function verifyTransaction(reference: string): Promise<VerifyTransactionResponse['data']> {
    const result = await paystackFetch<VerifyTransactionResponse>(`/transaction/verify/${reference}`, 'GET');

    if (!result.status) {
        throw new Error(result.message);
    }

    return result.data;
}

export interface PaystackTransaction {
    id: number;
    reference: string;
    amount: number; // smallest currency unit (kobo / cents)
    currency: string;
    status: string; // 'success' | 'failed' | 'abandoned' | ...
    paid_at: string | null;
    created_at: string;
    channel?: string;
}

// List a customer's transactions (most recent first). Returns [] on any error so
// the billing page degrades gracefully rather than throwing.
export async function listCustomerTransactions(
    customerId: number,
    perPage: number = 50
): Promise<PaystackTransaction[]> {
    try {
        const result = await paystackFetch<{ status: boolean; data: PaystackTransaction[] }>(
            `/transaction?customer=${customerId}&perPage=${perPage}`,
            'GET'
        );
        return result.status ? result.data : [];
    } catch (error) {
        console.error('Failed to list customer transactions:', error);
        return [];
    }
}

// Create a subscription
export async function createSubscription(data: PaystackSubscription): Promise<string> {
    const result = await paystackFetch<{ status: boolean; message: string; data: { subscription_code: string } }>(
        '/subscription',
        'POST',
        data
    );

    if (!result.status) {
        throw new Error(result.message);
    }

    return result.data.subscription_code;
}

// Get subscription details
export async function getSubscription(subscriptionCode: string): Promise<GetSubscriptionResponse['data']> {
    const result = await paystackFetch<GetSubscriptionResponse>(
        `/subscription/${subscriptionCode}`,
        'GET'
    );

    if (!result.status) {
        throw new Error(result.message);
    }

    return result.data;
}

// Enable a subscription
export async function enableSubscription(subscriptionCode: string, token: string): Promise<boolean> {
    const result = await paystackFetch<{ status: boolean; message: string }>('/subscription/enable', 'POST', {
        code: subscriptionCode,
        token,
    });

    return result.status;
}

// Disable a subscription — requires both the code and the email token from Paystack
export async function disableSubscription(subscriptionCode: string, token: string): Promise<boolean> {
    const result = await paystackFetch<{ status: boolean; message: string }>('/subscription/disable', 'POST', {
        code: subscriptionCode,
        token,
    });

    return result.status;
}

// Verify webhook signature — supports key rotation by checking both current and previous key
export function verifyWebhookSignature(payload: string, signature: string): boolean {
    const currentKey = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
    if (!currentKey) return false;

    const previousKey = process.env.PAYSTACK_SECRET_KEY;

    try {
        const sigBuffer = Buffer.from(signature, 'hex');
        const currentHash = crypto.createHmac('sha512', currentKey).update(payload).digest();
        if (sigBuffer.length === currentHash.length && crypto.timingSafeEqual(currentHash, sigBuffer)) {
            return true;
        }

        if (previousKey && previousKey !== currentKey) {
            const previousHash = crypto.createHmac('sha512', previousKey).update(payload).digest();
            if (sigBuffer.length === previousHash.length && crypto.timingSafeEqual(previousHash, sigBuffer)) {
                return true;
            }
        }
    } catch {
        return false;
    }

    return false;
}

// List all subscription plans (cached)
let cachedPlans: Map<string, string> | null = null;

export async function getPlanCodes(): Promise<Map<string, string>> {
    if (cachedPlans) {
        return cachedPlans;
    }

    try {
        const response = await paystackFetch<{
            status: boolean;
            data: Array<{ name: string; plan_code: string }>;
        }>('/plan', 'GET');

        if (response.status) {
            cachedPlans = new Map(response.data.map((p) => [p.name.toLowerCase(), p.plan_code]));
        }
    } catch (error) {
        console.error('Failed to fetch plans:', error);
    }

    return cachedPlans || new Map();
}

// Predefined plan codes (these would be created in Paystack dashboard)
const isTestMode = process.env.NODE_ENV === 'test' || process.env.PAYSTACK_TEST_MODE === 'true';
export const PLAN_CODES = {
    starter: isTestMode
        ? (process.env.PAYSTACK_TEST_STARTER_PLAN_CODE || process.env.PAYSTACK_STARTER_PLAN_CODE || 'PLN_starter_monthly')
        : (process.env.PAYSTACK_STARTER_PLAN_CODE || 'PLN_starter_monthly'),
    pro: isTestMode
        ? (process.env.PAYSTACK_TEST_PRO_PLAN_CODE || process.env.PAYSTACK_PRO_PLAN_CODE || 'PLN_pro_monthly')
        : (process.env.PAYSTACK_PRO_PLAN_CODE || 'PLN_pro_monthly'),
    enterprise: isTestMode
        ? (process.env.PAYSTACK_TEST_ENTERPRISE_PLAN_CODE || process.env.PAYSTACK_ENTERPRISE_PLAN_CODE || 'PLN_enterprise_monthly')
        : (process.env.PAYSTACK_ENTERPRISE_PLAN_CODE || 'PLN_enterprise_monthly'),
};

// Plan pricing in USD (the canonical prices shown to users)
export const PLAN_PRICES_USD = {
    starter: 10,   // $10/month
    pro: 25,       // $25/month
    enterprise: 100, // $100/month (custom)
};

// USD→NGN rate used to PRICE the NGN subscription plans, so the Naira amount
// Paystack actually charges corresponds to the USD figure shown to users
// (display is USD; Paystack settles in NGN). Override via env when FX moves
// materially — and re-sync the Paystack dashboard plans afterwards by running
// `scripts/setup-paystack-plans.ts`, which derives plan amounts from this same
// source so code and Paystack never drift apart.
export const USD_TO_NGN_PRICING_RATE = Number(process.env.PAYSTACK_USD_NGN_RATE) || 1700;

// Cache for exchange rate (refreshes every hour)
let cachedExchangeRate: number = 0;
let exchangeRateCacheTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Get live exchange rate (USD to NGN)
export async function getExchangeRate(): Promise<number> {
    const now = Date.now();

    // Return cached rate if still valid
    if (cachedExchangeRate && (now - exchangeRateCacheTime) < CACHE_DURATION) {
        return cachedExchangeRate;
    }

    try {
        // Using free exchange rate API
        const exchangeRateApiUrl = process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest/USD';
        const response = await fetch(
            exchangeRateApiUrl,
            { next: { revalidate: 3600 } }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch exchange rate');
        }

        const data = await response.json();
        cachedExchangeRate = data.rates.NGN;
        exchangeRateCacheTime = now;

        console.log(`Exchange rate: 1 USD = ${cachedExchangeRate} NGN`);
        return cachedExchangeRate;
    } catch (error) {
        console.error('Exchange rate fetch error:', error);
        // Fallback to cached rate or default
        if (cachedExchangeRate) {
            return cachedExchangeRate;
        }
        // Default fallback rate (can be updated manually if API fails)
        return 1700; // ~1700 NGN per USD
    }
}

// Convert USD price to Naira for Paystack
export async function getNairaPrice(usdPrice: number): Promise<number> {
    const exchangeRate = await getExchangeRate();
    return Math.round(usdPrice * exchangeRate);
}

// Plan pricing in Naira, DERIVED from the USD price so the charged amount tracks
// the displayed dollar price (e.g. $10 × 1700 = ₦17,000). Never hardcode these
// independently — they must equal what the live Paystack plans charge.
export const PLAN_PRICES = {
    starter: PLAN_PRICES_USD.starter * USD_TO_NGN_PRICING_RATE,
    pro: PLAN_PRICES_USD.pro * USD_TO_NGN_PRICING_RATE,
    enterprise: PLAN_PRICES_USD.enterprise * USD_TO_NGN_PRICING_RATE,
};

// Plan pricing in kobo (Paystack's smallest NGN unit = 1/100 Naira).
export const PLAN_PRICES_KOBO = {
    starter: PLAN_PRICES.starter * 100,
    pro: PLAN_PRICES.pro * 100,
    enterprise: PLAN_PRICES.enterprise * 100,
};

// Map a Paystack plan code to the internal plan name
export function planFromPaystackCode(planCode: string): 'starter' | 'pro' | 'enterprise' | null {
    const codeMap: Record<string, 'starter' | 'pro' | 'enterprise'> = {};
    codeMap[PLAN_CODES.starter] = 'starter';
    codeMap[PLAN_CODES.pro] = 'pro';
    codeMap[PLAN_CODES.enterprise] = 'enterprise';
    if (codeMap[planCode]) return codeMap[planCode];
    const lower = planCode.toLowerCase();
    if (lower.includes('starter')) return 'starter';
    if (lower.includes('pro')) return 'pro';
    if (lower.includes('enterprise')) return 'enterprise';
    return null;
}

// Map a Paystack transaction amount (smallest currency unit) to a plan name
export function planFromAmount(amount: number, currency: string): 'starter' | 'pro' | 'enterprise' | null {
    if (currency === 'USD' || currency === 'usd') {
        const usdCents = amount;
        if (usdCents === PLAN_PRICES_USD.starter * 100) return 'starter';
        if (usdCents === PLAN_PRICES_USD.pro * 100) return 'pro';
        if (usdCents === PLAN_PRICES_USD.enterprise * 100) return 'enterprise';
        return null;
    }
    // NGN — amount is in kobo
    if (amount === PLAN_PRICES_KOBO.starter) return 'starter';
    if (amount === PLAN_PRICES_KOBO.pro) return 'pro';
    if (amount === PLAN_PRICES_KOBO.enterprise) return 'enterprise';
    return null;
}

// Plan limits — the runtime source of truth for quota enforcement.
//
// `tasks` is the cap on ACTIVE (non-ARCHIVED) tasks per workspace; `aiCredits` is the
// number of "Plan with AI" generations allowed per rolling 30-day window. A value of
// `'unlimited'` means uncapped. These are intentionally single-constant edits: change a
// number here and every enforcement point + the pricing/usage UI follows.
export const PLAN_LIMITS = {
    free: {
        projects: 3,
        members: 3,
        tasks: 20,
        aiCredits: 3,
        features: ['basic_analytics', 'community_support'],
    },
    starter: {
        projects: 5,
        members: 10,
        tasks: 'unlimited',
        aiCredits: 50,
        features: ['basic_analytics', 'email_support', 'custom_workflows'],
    },
    pro: {
        projects: 'unlimited',
        members: 25,
        tasks: 'unlimited',
        aiCredits: 200,
        features: ['advanced_analytics', 'priority_support', 'custom_workflows', 'admin_controls', 'api_access'],
    },
    enterprise: {
        projects: 'unlimited',
        members: 'unlimited',
        tasks: 'unlimited',
        aiCredits: 'unlimited',
        features: ['advanced_analytics', 'dedicated_support', 'custom_workflows', 'admin_controls', 'api_access', 'sso', 'sla', 'on_premise'],
    },
};
