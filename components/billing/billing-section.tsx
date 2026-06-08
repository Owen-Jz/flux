'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCardIcon, CheckIcon, ArrowPathIcon, ExclamationCircleIcon, XMarkIcon, TrophyIcon, BoltIcon, BuildingOffice2Icon, ShieldCheckIcon, HandRaisedIcon, DocumentChartBarIcon, ServerIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid';
import { PLAN_META } from '@/lib/plan-limits';
import { USD_TO_NGN_PRICING_RATE } from '@/lib/paystack';
import { startTrial } from '@/actions/billing/start-trial';

interface Subscription {
    plan: string;
    status: string;
    subscriptionId?: string;
    trialEndsAt?: string;
    hasUsedTrial: boolean;
}

interface BillingTransaction {
    reference: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
    channel: string | null;
}

// Render a Paystack transaction amount as a USD string. `amount` arrives from
// /api/billing/history already expressed in MAJOR units (the API divides the
// raw kobo/cents amount by 100), e.g. 17000 for a ₦17,000 charge or 10 for a
// $10 charge. USD transactions show their dollar value directly; historical
// NGN charges are converted to an approximate USD figure using the same pricing
// rate the plans are priced at. The platform always displays dollars — no Naira
// is ever shown.
function formatTransactionUsd(amount: number, currency: string): string {
    const usd = currency.toUpperCase() === 'USD' ? amount : amount / USD_TO_NGN_PRICING_RATE;
    return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

// Display prices in USD. The actual Paystack charge is configured separately
// (in NGN via dashboard plan codes) and is unaffected by these display values.
const PLAN_PRICES_USD: Record<string, number> = {
    free: 0,
    starter: 10,
    pro: 25,
};

const TEAM_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

const ENTERPRISE_FEATURES = [
    { icon: ShieldCheckIcon, title: 'SSO/SAML', description: 'Secure single sign-on with SAML 2.0' },
    { icon: HandRaisedIcon, title: 'Dedicated Success Manager', description: 'Personal support to ensure your team thrives' },
    { icon: DocumentChartBarIcon, title: 'SLA Guarantee', description: '99.99% uptime SLA' },
    { icon: ServerIcon, title: 'On-Premise', description: 'Run on your own infrastructure' },
];

function EnterpriseModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        phone: '',
        teamSize: '',
        message: '',
    });

    useEffect(() => {
        if (!isOpen) {
            setSubmitted(false);
            setError(null);
            setFormData({ name: '', email: '', company: '', phone: '', teamSize: '', message: '' });
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) { setError('Name is required'); return; }
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Valid email is required'); return; }
        if (!formData.company.trim()) { setError('Company is required'); return; }
        if (!formData.teamSize) { setError('Team size is required'); return; }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/enterprise/inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit inquiry');
            }

            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border-subtle)]"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
                            <div>
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">Enterprise Inquiry</h2>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">Get custom pricing for your organization</p>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--background-subtle)] text-[var(--text-tertiary)]">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <AnimatePresence mode="wait">
                                {submitted ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-8"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                            <CheckIcon className="w-8 h-8 text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Thank you!</h3>
                                        <p className="text-[var(--text-secondary)]">We&apos;ve received your inquiry and will contact you shortly.</p>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        key="form"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onSubmit={handleSubmit}
                                        className="space-y-4"
                                    >
                                        {error && (
                                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                                                <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                                                {error}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Full Name <span className="text-red-500">*</span></label>
                                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input w-full" placeholder="John Smith" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Work Email <span className="text-red-500">*</span></label>
                                                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input w-full" placeholder="john@company.com" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Company <span className="text-red-500">*</span></label>
                                            <input type="text" name="company" value={formData.company} onChange={handleChange} required className="input w-full" placeholder="Acme Corporation" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Phone</label>
                                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input w-full" placeholder="+1 (555) 000-0000" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Team Size <span className="text-red-500">*</span></label>
                                                <select name="teamSize" value={formData.teamSize} onChange={handleChange} required className="input w-full">
                                                    <option value="">Select</option>
                                                    {TEAM_SIZES.map(size => (
                                                        <option key={size} value={size}>{size}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Message</label>
                                            <textarea name="message" value={formData.message} onChange={handleChange} rows={3} className="input w-full resize-none" placeholder="Tell us about your requirements..." />
                                        </div>

                                        <button type="submit" disabled={isSubmitting} className="w-full btn btn-primary py-3 font-semibold disabled:opacity-50">
                                            {isSubmitting ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                                    Submitting...
                                                </span>
                                            ) : (
                                                'Submit Inquiry'
                                            )}
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--background)]">
                            <div className="flex flex-wrap justify-center gap-4">
                                {ENTERPRISE_FEATURES.map(f => (
                                    <div key={f.title} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                                        <f.icon className="w-4 h-4 text-blue-500" />
                                        {f.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function BillingSection() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
    const [showTrialActivation, setShowTrialActivation] = useState(false);
    const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
    const [upgradedPlan, setUpgradedPlan] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
    const trialActivating = useRef(false);

    // Load billing history (payment receipts).
    useEffect(() => {
        let cancelled = false;
        fetch('/api/billing/history')
            .then((res) => (res.ok ? res.json() : { transactions: [] }))
            .then((data) => {
                if (!cancelled) setTransactions(data.transactions || []);
            })
            .catch(() => {
                if (!cancelled) setTransactions([]);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Check for payment callback — Paystack appends ?trxref=xxx&reference=xxx to the callback URL
    // We check for reference/trxref presence (Paystack may overwrite original query params)
    useEffect(() => {
        const reference = searchParams.get('reference') || searchParams.get('trxref');

        if (reference && !processing) {
            verifyPayment(reference);
            router.replace(window.location.pathname, { scroll: false });
        }
    }, [searchParams, router]);

    // Load current subscription
    useEffect(() => {
        fetchSubscription();
    }, []);

    // Check for trial activation action
    useEffect(() => {
        const action = searchParams.get('action');
        const billing = searchParams.get('billing');
        if ((action === 'activate-trial' || billing === 'trial') && !loading && subscription) {
            if (!subscription.hasUsedTrial && subscription.status !== 'active') {
                setShowTrialActivation(true);
            } else if (subscription.hasUsedTrial || subscription.status === 'active') {
                // User already has trial or subscription - redirect to dashboard
                router.replace('/dashboard');
            }
        }
    }, [searchParams, loading, subscription, router]);

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
                body: JSON.stringify({ reference }),
            });
            const data = await res.json();
            if (data.success) {
                setUpgradedPlan(data.plan || null);
                setShowUpgradeSuccess(true);
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
                body: JSON.stringify({ plan, currency: 'USD' }),
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

    const handleActivateTrial = async (plan: 'starter' | 'pro' = 'starter') => {
        if (trialActivating.current) return;
        trialActivating.current = true;
        setProcessing(true);
        setError(null);
        try {
            const result = await startTrial(plan);
            if (result.success) {
                setSuccess(`Your free trial has been activated! Enjoy 14 days of ${plan === 'pro' ? 'Entrepreneur' : 'Individual'} plan features.`);
                setShowTrialActivation(false);
                // Redirect to dashboard to start the guided tutorial
                router.push('/dashboard');
            } else {
                setError(result.error || 'Failed to activate trial');
            }
        } catch (err) {
            setError('Failed to activate trial');
        } finally {
            setProcessing(false);
            trialActivating.current = false;
        }
    };

    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: PLAN_PRICES_USD.free,
            period: '/month',
            icon: BoltIcon,
            color: 'text-gray-500',
            bg: 'bg-gray-100',
        },
        {
            id: 'starter',
            name: 'Individual',
            price: PLAN_PRICES_USD.starter,
            period: '/month',
            icon: TrophyIcon,
            color: 'text-amber-500',
            bg: 'bg-amber-100',
        },
        {
            id: 'pro',
            name: 'Entrepreneur',
            price: PLAN_PRICES_USD.pro,
            period: '/month',
            icon: TrophyIcon,
            color: 'text-purple-500',
            bg: 'bg-purple-100',
            popular: true,
        },
        {
            id: 'enterprise',
            name: 'Business',
            price: null,
            period: '',
            icon: BuildingOffice2Icon,
            color: 'text-blue-500',
            bg: 'bg-blue-100',
        },
    ];

    // Pricing is always displayed in USD.
    const formatPrice = (priceUSD: number | null, planId?: string) => {
        if (priceUSD === null) return 'Custom';
        const usd = planId ? (PLAN_PRICES_USD[planId] ?? priceUSD) : priceUSD;
        return usd > 0 ? `$${usd}` : 'Free';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <ArrowPathIcon className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
            </div>
        );
    }

    const currentPlan = subscription?.plan || 'free';
    const isActive = subscription?.status === 'active';
    const isPastDue = subscription?.status === 'past_due';
    const isTrialing = Boolean(subscription?.trialEndsAt) && subscription?.status !== 'active';
    const daysLeft = subscription?.trialEndsAt
        ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;
    const isTrialActive = isTrialing && daysLeft > 0;

    return (
        <>
            <div className="space-y-5">
            {(error || success) && (
                <div
                    className="flex items-center gap-3 rounded-xl border p-4"
                    style={
                        error
                            ? { background: 'var(--flux-error-bg)', borderColor: 'var(--flux-error-border)', color: 'var(--flux-error-text-strong)' }
                            : { background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.35)', color: 'rgb(5, 150, 105)' }
                    }
                >
                    {error ? (
                        <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                    ) : (
                        <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                    )}
                    <p className="text-sm font-medium">{error || success}</p>
                    <button
                        onClick={() => { setError(null); setSuccess(null); }}
                        className="ml-auto rounded-lg p-1 opacity-70 transition-opacity hover:opacity-100"
                        aria-label="Dismiss"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Past-due / dunning banner */}
            {isPastDue && (
                <div
                    className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                    style={{ background: 'var(--flux-error-bg)', borderColor: 'var(--flux-error-border)' }}
                >
                    <div className="flex flex-1 items-start gap-3">
                        <ExclamationCircleIcon className="mt-0.5 w-5 h-5 flex-shrink-0" style={{ color: 'var(--flux-error-primary)' }} />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold" style={{ color: 'var(--flux-error-text-strong)' }}>
                                Payment past due
                            </p>
                            <p className="mt-0.5 text-xs" style={{ color: 'var(--flux-error-text)' }}>
                                We couldn&apos;t process your latest payment. Update your billing to keep your premium features.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleSubscribe(currentPlan)}
                        disabled={processing}
                        className="btn btn-danger btn-sm flex-shrink-0 self-start sm:self-auto disabled:opacity-50"
                    >
                        {processing ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : 'Update Payment'}
                    </button>
                </div>
            )}

            {/* Current Plan */}
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <CreditCardIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                    <h2 className="font-semibold">Current Plan</h2>
                </div>

                <div
                    className={`relative overflow-hidden rounded-xl border p-5 transition-colors ${
                        currentPlan !== 'free'
                            ? 'border-[var(--brand-primary)]'
                            : 'border-[var(--border-subtle)] bg-[var(--surface)]'
                    }`}
                    style={
                        currentPlan !== 'free'
                            ? { background: 'color-mix(in srgb, var(--brand-primary) 6%, var(--surface))' }
                            : undefined
                    }
                >
                    <div className="flex items-start gap-4">
                        <div
                            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                            style={
                                currentPlan === 'free'
                                    ? { background: 'var(--background-subtle)' }
                                    : { background: 'color-mix(in srgb, var(--brand-primary) 14%, transparent)' }
                            }
                        >
                            {(() => {
                                const PlanIcon = plans.find(p => p.id === currentPlan)?.icon || BoltIcon;
                                return (
                                    <PlanIcon
                                        className="w-6 h-6"
                                        style={{ color: currentPlan === 'free' ? 'var(--text-tertiary)' : 'var(--brand-primary)' }}
                                    />
                                );
                            })()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-bold capitalize">{PLAN_META[currentPlan as keyof typeof PLAN_META]?.label || currentPlan}</p>
                                {isTrialActive ? (
                                    <span
                                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                                        style={{ background: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)', color: 'var(--brand-primary)' }}
                                    >
                                        <SparklesIconSolid className="w-3 h-3" />
                                        Trial — {daysLeft}d left
                                    </span>
                                ) : isPastDue ? (
                                    <span
                                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                                        style={{ background: 'var(--flux-error-bg-subtle)', color: 'var(--flux-error-text-strong)' }}
                                    >
                                        <ExclamationCircleIcon className="w-3 h-3" />
                                        Past due
                                    </span>
                                ) : isActive ? (
                                    <span
                                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                                        style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'rgb(5, 150, 105)' }}
                                    >
                                        <CheckCircleIcon className="w-3 h-3" />
                                        Active
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-[var(--background-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--text-tertiary)]">
                                        Free
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                {PLAN_META[currentPlan as keyof typeof PLAN_META]?.projects === 'unlimited'
                                    ? 'Unlimited Projects'
                                    : `${PLAN_META[currentPlan as keyof typeof PLAN_META]?.projects || 0} Projects`}
                                {' • '}
                                {PLAN_META[currentPlan as keyof typeof PLAN_META]?.members === 'unlimited'
                                    ? 'Unlimited Members'
                                    : `${PLAN_META[currentPlan as keyof typeof PLAN_META]?.members || 0} Team Members`}
                            </p>

                            {isTrialActive && subscription?.trialEndsAt && (
                                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                                    {daysLeft} day{daysLeft === 1 ? '' : 's'} remaining — trial ends{' '}
                                    {new Date(subscription.trialEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            )}
                        </div>

                        {isTrialActive && (
                            <button
                                onClick={() => handleSubscribe(subscription?.plan || 'starter')}
                                disabled={processing}
                                className="btn btn-primary btn-sm flex-shrink-0 disabled:opacity-50"
                            >
                                Upgrade
                            </button>
                        )}
                    </div>

                    {currentPlan !== 'free' && (isActive || isPastDue) && (
                        <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
                            <button
                                onClick={handleCancelSubscription}
                                disabled={processing}
                                className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
                                style={{ color: 'var(--flux-error-primary)' }}
                            >
                                Cancel Subscription
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Available Plans */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Available Plans</h2>
                    <span className="text-xs text-[var(--text-secondary)]">Prices in USD</span>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {plans.filter(p => p.id !== 'enterprise').map((plan) => {
                        const planOrder = { free: 0, starter: 1, pro: 2, enterprise: 3 };
                        const isCurrentPlan = currentPlan === plan.id;
                        const isDowngrade = planOrder[plan.id as keyof typeof planOrder] < planOrder[currentPlan as keyof typeof planOrder];
                        const isPopular = plan.id === 'pro' && !isCurrentPlan;

                        return (
                            <div
                                key={plan.id}
                                className={`relative flex flex-col rounded-xl border p-5 transition-all ${
                                    isCurrentPlan
                                        ? 'border-[var(--brand-primary)] shadow-sm'
                                        : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:shadow-sm'
                                }`}
                                style={
                                    isCurrentPlan
                                        ? { background: 'color-mix(in srgb, var(--brand-primary) 5%, var(--surface))' }
                                        : { background: 'var(--surface)' }
                                }
                            >
                                {isPopular && (
                                    <span
                                        className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
                                        style={{ background: 'var(--brand-primary)' }}
                                    >
                                        <SparklesIconSolid className="w-3 h-3" />
                                        Popular
                                    </span>
                                )}

                                <div className="mb-3 flex items-center gap-2.5">
                                    <div
                                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                                        style={{ background: 'var(--background-subtle)' }}
                                    >
                                        <plan.icon className="w-4 h-4 text-[var(--text-secondary)]" />
                                    </div>
                                    <span className="font-semibold">{plan.name}</span>
                                </div>

                                <p className="mb-4 flex items-baseline gap-1">
                                    <span className="text-3xl font-bold tracking-tight">{formatPrice(plan.price, plan.id)}</span>
                                    {plan.price !== null && plan.price > 0 && (
                                        <span className="text-sm font-normal text-[var(--text-tertiary)]">{plan.period}</span>
                                    )}
                                </p>

                                <ul className="mb-5 flex-1 space-y-2">
                                    {PLAN_FEATURES[plan.id as keyof typeof PLAN_FEATURES]?.features?.map((feature: string) => (
                                        <li key={feature} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                            <CheckIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgb(16, 185, 129)' }} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {isCurrentPlan ? (
                                    <button
                                        disabled
                                        className="w-full rounded-lg border border-[var(--brand-primary)] py-2 text-sm font-semibold"
                                        style={{ color: 'var(--brand-primary)', background: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)' }}
                                    >
                                        Current Plan
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={processing}
                                        className={`w-full text-sm ${isDowngrade ? 'btn btn-secondary' : 'btn btn-primary'} disabled:opacity-50`}
                                    >
                                        {processing ? (
                                            <ArrowPathIcon className="w-4 h-4 animate-spin mx-auto" />
                                        ) : (
                                            isDowngrade ? 'Downgrade' : 'Upgrade'
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Billing History */}
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <DocumentChartBarIcon className="w-4 h-4 text-[var(--brand-primary)]" />
                    <h2 className="font-semibold">Billing History</h2>
                </div>

                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] px-6 py-10 text-center">
                        <div
                            className="mb-3 flex h-11 w-11 items-center justify-center rounded-full"
                            style={{ background: 'var(--background-subtle)' }}
                        >
                            <DocumentChartBarIcon className="w-5 h-5 text-[var(--text-tertiary)]" />
                        </div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">No billing history yet</p>
                        <p className="mt-1 max-w-xs text-xs text-[var(--text-tertiary)]">
                            Your payment receipts will appear here once you subscribe to a paid plan.
                        </p>
                    </div>
                ) : (
                    <div className="-mx-2 overflow-x-auto">
                        <table className="w-full min-w-[480px] text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border-subtle)] text-left text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                                    <th className="px-2 py-2.5 font-medium">Date</th>
                                    <th className="px-2 py-2.5 font-medium">Amount</th>
                                    <th className="px-2 py-2.5 font-medium">Status</th>
                                    <th className="px-2 py-2.5 text-right font-medium">Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((t) => (
                                    <tr key={t.reference} className="border-b border-[var(--border-subtle)] transition-colors last:border-0 hover:bg-[var(--background-subtle)]">
                                        <td className="whitespace-nowrap px-2 py-3 text-[var(--text-secondary)]">
                                            {new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="whitespace-nowrap px-2 py-3 font-semibold tabular-nums text-[var(--text-primary)]">
                                            {formatTransactionUsd(t.amount, t.currency)}
                                        </td>
                                        <td className="px-2 py-3">
                                            <span
                                                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                                                style={
                                                    t.status === 'success'
                                                        ? { background: 'rgba(16, 185, 129, 0.12)', color: 'rgb(5, 150, 105)' }
                                                        : { background: 'var(--flux-error-bg-subtle)', color: 'var(--flux-error-text-strong)' }
                                                }
                                            >
                                                {t.status === 'success' ? 'Paid' : t.status}
                                            </span>
                                        </td>
                                        <td className="px-2 py-3 text-right">
                                            {t.status === 'success' ? (
                                                <a
                                                    href={`/api/billing/receipt/${encodeURIComponent(t.reference)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-[var(--brand-primary)] hover:underline"
                                                >
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-[var(--text-tertiary)]">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Trial Activation Modal */}
            <AnimatePresence>
                {showTrialActivation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowTrialActivation(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[var(--border-subtle)]"
                        >
                            <div className="p-6 text-center border-b border-[var(--border-subtle)]">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                                    <SparklesIcon className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-[var(--foreground)]">Start Your Free Trial</h2>
                                <p className="text-sm text-[var(--text-secondary)] mt-2">
                                    Get 14 days of full Pro access — no credit card required
                                </p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-3">
                                    {['Unlimited Projects', '25 Team Members', 'Priority Support', 'Advanced Analytics', 'Admin Controls'].map((feature) => (
                                        <div key={feature} className="flex items-center gap-3 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                                <CheckIcon className="w-3 h-3 text-green-600" />
                                            </div>
                                            <span className="text-[var(--text-secondary)]">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                                        <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowTrialActivation(false)}
                                        className="flex-1 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm font-medium hover:bg-[var(--background)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleActivateTrial('pro')}
                                        disabled={processing}
                                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                                Activating...
                                            </span>
                                        ) : (
                                            'Start 14-Day Trial'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Enterprise Contact */}
            <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ background: 'var(--background-subtle)' }}
                    >
                        <BuildingOffice2Icon className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-semibold">Business</h2>
                        <p className="mt-1 max-w-md text-sm text-[var(--text-secondary)]">
                            Need custom pricing, SSO, SLA guarantees, or on-premise deployment? Contact us for a custom solution.
                        </p>
                    </div>
                </div>
                <button onClick={() => setShowEnterpriseModal(true)} className="btn btn-secondary flex-shrink-0 text-sm">
                    Contact Sales
                </button>
            </div>
        </div>
            {/* Upgrade Success Modal */}
            <AnimatePresence>
                {showUpgradeSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setShowUpgradeSuccess(false);
                            router.push('/dashboard');
                        }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[var(--border-subtle)]"
                        >
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-500/30">
                                    <CheckIcon className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                                    Upgrade Successful!
                                </h2>
                                <p className="text-[var(--text-secondary)] mb-2">
                                    You&apos;re now on the
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-bold mb-6 shadow-lg">
                                    <TrophyIcon className="w-5 h-5" />
                                    {PLAN_META[upgradedPlan as keyof typeof PLAN_META]?.label || upgradedPlan} Plan
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] mb-6">
                                    Enjoy your new features and unlimited possibilities!
                                </p>
                                <button
                                    onClick={() => {
                                        setShowUpgradeSuccess(false);
                                        router.push('/dashboard');
                                    }}
                                    className="w-full py-3 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/25"
                                >
                                    Go to Workspace
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <EnterpriseModal isOpen={showEnterpriseModal} onClose={() => setShowEnterpriseModal(false)} />
        </>
    );
}
