import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const mode = process.argv.includes('--mode=test') ? 'test' : 'live';
const SECRET_KEY = mode === 'test'
    ? process.env.PAYSTACK_TEST_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY
    : process.env.PAYSTACK_SECRET_KEY;

if (!SECRET_KEY) {
    console.error(`Error: PAYSTACK_${mode === 'test' ? 'TEST_' : ''}SECRET_KEY environment variable is not set`);
    process.exit(1);
}

interface PaystackPlan {
    name: string;
    description: string;
    amount: number;
    interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
    send_invoices?: boolean;
    send_sms?: boolean;
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

interface GetPlanResponse {
    status: boolean;
    message: string;
    data: CreatePlanResponse['data'];
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts: number = 3, baseDelayMs: number = 1000): Promise<T> {
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
                Authorization: `Bearer ${SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const errorText = await response.text();
        if (!response.ok) {
            throw new Error(`Paystack API error: ${response.status} - ${errorText}`);
        }

        return JSON.parse(errorText);
    });
}

async function createOrGetPlan(data: PaystackPlan): Promise<{ planCode: string; isExisting: boolean }> {
    try {
        const result = await paystackFetch<CreatePlanResponse>('/plan', 'POST', data);
        if (!result.status) {
            throw new Error(result.message);
        }
        return { planCode: result.data.plan_code, isExisting: false };
    } catch (error) {
        if (error instanceof Error && error.message.includes('409')) {
            console.log(`  Plan "${data.name}" already exists, fetching...`);
            const plans = await paystackFetch<{ status: boolean; data: CreatePlanResponse['data'][] }>('/plan', 'GET');
            const existingPlan = plans.data.find(p => p.name.toLowerCase() === data.name.toLowerCase());
            if (existingPlan) {
                return { planCode: existingPlan.plan_code, isExisting: true };
            }
        }
        throw error;
    }
}

interface PlanDefinition {
    name: string;
    description: string;
    amount: number;
    interval: 'monthly';
}

const plans: PlanDefinition[] = [
    {
        name: 'Starter',
        description: 'Starter plan - up to 5 projects, 10 members',
        amount: 1000000,
        interval: 'monthly',
    },
    {
        name: 'Pro',
        description: 'Pro plan - unlimited projects, 25 members',
        amount: 2500000,
        interval: 'monthly',
    },
    {
        name: 'Enterprise',
        description: 'Enterprise plan - unlimited everything',
        amount: 5000000,
        interval: 'monthly',
    },
];

async function main() {
    const prefix = mode === 'test' ? 'TEST_' : '';
    console.log(`Setting up Paystack subscription plans (${mode} mode)...\n`);

    const results: { name: string; planCode: string; isExisting: boolean }[] = [];

    for (const plan of plans) {
        console.log(`Creating/fetching plan: ${plan.name}`);
        const result = await createOrGetPlan(plan);
        results.push({ name: plan.name, planCode: result.planCode, isExisting: result.isExisting });
        console.log(`  Plan code: ${result.planCode} ${result.isExisting ? '(existing)' : '(new)'}`);
    }

    console.log('\n--- Summary ---');
    console.log('Environment variables to set:\n');
    for (const r of results) {
        const envVar = `PAYSTACK_${prefix}${r.name.toUpperCase()}_PLAN_CODE`;
        console.log(`${envVar}=${r.planCode}`);
    }

    console.log('\nAdd these to your .env.local file:');
    console.log('---');
    for (const r of results) {
        console.log(`PAYSTACK_${prefix}${r.name.toUpperCase()}_PLAN_CODE=${r.planCode}`);
    }
    console.log('---\n');

    console.log('You can now use these plan codes in your application.');
    process.exit(0);
}

main().catch((error) => {
    console.error('Error setting up plans:', error.message);
    process.exit(1);
});
