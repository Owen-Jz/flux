'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCardIcon, CheckIcon, ArrowPathIcon, ExclamationCircleIcon, XMarkIcon, TrophyIcon, BoltIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

interface Subscription {
    plan: string;
    status: string;
    subscriptionId?: string;
    trialEndsAt?: string;
    hasUsedTrial: boolean;
}

const PLAN_FEATURES = {
    free: {
        projects: '3 Projects',
        members: '3 Team Members',
        features: ['Basic Analytics', 'Community Support'],
    },
    starter: {
        projects: '5 Projects',
        members: '10 Team Members',
        features: ['Email Support', 'Custom Workflows', 'API Access'],
    },
    pro: {
        projects: 'Unlimited Projects',
        members: '25 Team Members',
        features: ['Priority Support', 'Advanced Analytics', 'Admin Controls', 'SSO'],
    },
    enterprise: {
        projects: 'Unlimited Everything',
        members: 'Unlimited Members',
        features: ['Dedicated Support', 'SLA Guarantee', 'On-premise', 'Custom Contracts'],
    },
};

export function BillingSection() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Check for payment callback
    useEffect(() => {
        const billingStatus = searchParams.get('billing');
        const reference = searchParams.get('reference');

        if (billingStatus === 'success' && reference) {
            verifyPayment(reference);
            // Clear URL params
            router.replace(window.location.pathname, { scroll: false });
        }
    }, [searchParams, router]);

    // Load current subscription
    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const res = await fetch('/api/billing/verify', { method: 'GET' });
            const data = await res.json();
            setSubscription(data);
        } catch (err) {
            console.error('Failed to load subscription:', err);
        } finally {
            setLoading(false);
        }
    };

    const verifyPayment = async (reference: string) => {
        setProcessing(true);
        setError(null);
        try {
            const res = await fetch('/api/billing/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference, plan: subscription?.plan || 'pro' }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Payment successful! Your subscription is now active.');
                fetchSubscription();
            } else {
                setError(data.error || 'Payment verification failed');
            }
        } catch (err) {
            setError('Failed to verify payment');
        } finally {
            setProcessing(false);
        }
    };

    const handleSubscribe = async (plan: string) => {
        setProcessing(true);
        setError(null);
        try {
            const res = await fetch('/api/billing/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            });
            const data = await res.json();
            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl;
            } else {
                setError(data.error || 'Failed to initialize subscription');
            }
        } catch (err) {
            setError('Failed to start subscription');
        } finally {
            setProcessing(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
            return;
        }

        setProcessing(true);
        setError(null);
        try {
            const res = await fetch('/api/billing/cancel', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setSuccess('Subscription cancelled. You have been moved to the free plan.');
                fetchSubscription();
            } else {
                setError(data.error || 'Failed to cancel subscription');
            }
        } catch (err) {
            setError('Failed to cancel subscription');
        } finally {
            setProcessing(false);
        }
    };

    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: '$0',
            period: '/month',
            icon: BoltIcon,
            color: 'text-gray-500',
            bg: 'bg-gray-100',
        },
        {
            id: 'starter',
            name: 'Starter',
            price: '$10',
            period: '/month',
            icon: TrophyIcon,
            color: 'text-amber-500',
            bg: 'bg-amber-100',
        },
        {
            id: 'pro',
            name: 'Pro',
            price: '$25',
            period: '/month',
            icon: TrophyIcon,
            color: 'text-purple-500',
            bg: 'bg-purple-100',
            popular: true,
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: 'Custom',
            period: '',
            icon: BuildingOffice2Icon,
            color: 'text-blue-500',
            bg: 'bg-blue-100',
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <ArrowPathIcon className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
            </div>
        );
    }

    const currentPlan = subscription?.plan || 'free';
    const isActive = subscription?.status === 'active';

    return (
        <div className="space-y-6">
            {(error || success) && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                    {error ? (
                        <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    ) : (
                        <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                    <p className="text-sm font-medium">{error || success}</p>
                    <button onClick={() => { setError(null); setSuccess(null); }} className="ml-auto text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Current Plan */}
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <CreditCardIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                    <h2 className="font-semibold">Current Plan</h2>
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${plans.find(p => p.id === currentPlan)?.bg}`}>
                            {(() => {
                                const PlanIcon = plans.find(p => p.id === currentPlan)?.icon || BoltIcon;
                                return <PlanIcon className={`w-5 h-5 ${plans.find(p => p.id === currentPlan)?.color}`} />;
                            })()}
                        </div>
                        <div>
                            <p className="font-semibold capitalize">{currentPlan}</p>
                            <p className="text-xs text-[var(--text-secondary)]">
                                {isActive ? (
                                    <span className="text-green-600">Active</span>
                                ) : (
                                    <span>Inactive</span>
                                )}
                            </p>
                        </div>
                    </div>
                    {currentPlan !== 'free' && isActive && (
                        <button
                            onClick={handleCancelSubscription}
                            disabled={processing}
                            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {currentPlan !== 'free' && (
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        {Object.entries(PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES] || {}).map(([key, value]) => (
                            <div key={key}>
                                <p className="text-[var(--text-secondary)] capitalize">{key}</p>
                                <p className="font-medium">{Array.isArray(value) ? value.join(', ') : value}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upgrade Plans */}
            <div className="card p-6">
                <h2 className="font-semibold mb-4">Available Plans</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {plans.filter(p => p.id !== 'enterprise').map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative p-4 rounded-lg border-2 transition-all ${
                                currentPlan === plan.id
                                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                                    : 'border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/50'
                            }`}
                        >
                            {plan.popular && (
                                <span className="absolute -top-2 -right-2 bg-[var(--brand-primary)] text-white text-xs px-2 py-0.5 rounded-full">
                                    Popular
                                </span>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-1.5 rounded ${plan.bg}`}>
                                    <plan.icon className={`w-4 h-4 ${plan.color}`} />
                                </div>
                                <span className="font-semibold">{plan.name}</span>
                            </div>
                            <p className="text-2xl font-bold mb-2">
                                {plan.price}
                                <span className="text-sm font-normal text-[var(--text-secondary)]">{plan.period}</span>
                            </p>
                            <ul className="space-y-1 mb-4">
                                {PLAN_FEATURES[plan.id as keyof typeof PLAN_FEATURES]?.features?.map((feature: string) => (
                                    <li key={feature} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                        <CheckIcon className="w-3 h-3 text-green-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            {currentPlan === plan.id ? (
                                <button disabled className="w-full btn btn-secondary text-sm" style={{ backgroundColor: 'var(--brand-primary)', color: 'white' }}>
                                    Current Plan
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={processing}
                                    className="w-full btn btn-primary text-sm"
                                >
                                    {processing ? (
                                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    ) : (
                                        `Upgrade to ${plan.name}`
                                    )}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Enterprise Contact */}
            <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <div className="flex items-center gap-2 mb-2">
                    <BuildingOffice2Icon className="w-5 h-5 text-blue-600" />
                    <h2 className="font-semibold">Enterprise</h2>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Need custom pricing, SSO, SLA guarantees, or on-premise deployment? Contact us for a custom solution.
                </p>
                <a href="mailto:billing@flux.com?subject=Enterprise%20Pricing" className="btn btn-secondary text-sm">
                    Contact Sales
                </a>
            </div>
        </div>
    );
}
