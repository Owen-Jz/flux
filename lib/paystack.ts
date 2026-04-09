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
    };
}

// Retry helper with exponential backoff
async function withRetry<T>(
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
            if (attempt < maxAttempts) {
                const delay = baseDelayMs * Math.pow(2, attempt - 1);
                console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
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
        subscription: subscriptionCode,
        token,
    });

    return result.status;
}

// Disable a subscription
export async function disableSubscription(subscriptionCode: string): Promise<boolean> {
    const result = await paystackFetch<{ status: boolean; message: string }>('/subscription/disable', 'POST', {
        subscription: subscriptionCode,
    });

    return result.status;
}

// Verify webhook signature
export function verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(payload).digest('hex');
    return hash === signature;
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
export const PLAN_CODES = {
    starter: process.env.PAYSTACK_STARTER_PLAN_CODE || 'PLN_starter_monthly',
    pro: process.env.PAYSTACK_PRO_PLAN_CODE || 'PLN_pro_monthly',
    enterprise: process.env.PAYSTACK_ENTERPRISE_PLAN_CODE || 'PLN_enterprise_monthly',
};

// Plan pricing in USD (display prices)
export const PLAN_PRICES_USD = {
    starter: 10,   // $10/month
    pro: 25,       // $25/month
    enterprise: 100, // $100/month (custom)
};

// Cache for exchange rate (refreshes every hour)
let cachedExchangeRate: number | null = null;
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

// Legacy: Plan pricing in Naira (for reference)
export const PLAN_PRICES = {
    starter: 10000, // ₦10,000/month (~ $10)
    pro: 25000,    // ₦25,000/month (~ $25)
    enterprise: 50000, // ₦50,000/month (~ $50)
};

// Plan pricing in kobo (Paystack's smallest currency unit)
export const PLAN_PRICES_KOBO = {
    starter: 1000000, // ₦10,000 = 1,000,000 kobo
    pro: 2500000,    // ₦25,000 = 2,500,000 kobo
    enterprise: 5000000, // ₦50,000 = 5,000,000 kobo
};

// Plan limits
export const PLAN_LIMITS = {
    free: {
        projects: 3,
        members: 3,
        tasks: 'unlimited',
        features: ['basic_analytics', 'community_support'],
    },
    starter: {
        projects: 5,
        members: 10,
        tasks: 'unlimited',
        features: ['basic_analytics', 'email_support', 'custom_workflows'],
    },
    pro: {
        projects: 'unlimited',
        members: 25,
        tasks: 'unlimited',
        features: ['advanced_analytics', 'priority_support', 'custom_workflows', 'admin_controls', 'api_access'],
    },
    enterprise: {
        projects: 'unlimited',
        members: 'unlimited',
        tasks: 'unlimited',
        features: ['advanced_analytics', 'dedicated_support', 'custom_workflows', 'admin_controls', 'api_access', 'sso', 'sla', 'on_premise'],
    },
};
