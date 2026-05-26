'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCardIcon, CheckIcon, ArrowPathIcon, ExclamationCircleIcon, XMarkIcon, TrophyIcon, BoltIcon, BuildingOffice2Icon, GlobeAltIcon, ShieldCheckIcon, HandRaisedIcon, DocumentChartBarIcon, ServerIcon, ArrowPathIcon as SubmitIcon, SparklesIcon, StarIcon, FireIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid';
import { PLAN_META } from '@/lib/plan-limits';
import { startTrial } from '@/actions/billing/start-trial';

interface Subscription {
    plan: string;
    status: string;
    subscriptionId?: string;
    trialEndsAt?: string;
    hasUsedTrial: boolean;
}

interface GeoInfo {
    country: string;
    countryCode: string;
    currency: 'NGN' | 'USD';
    isNigeria: boolean;
    exchangeRate: number;
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

const PLAN_PRICES = {
    free: 0,
    starter: 10000,
    pro: 25000,
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
    const [geoInfo, setGeoInfo] = useState<GeoInfo | null>(null);
    const [currencyOverride, setCurrencyOverride] = useState<'NGN' | 'USD' | null>(null);
    const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
    const [showTrialActivation, setShowTrialActivation] = useState(false);
    const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
    const [upgradedPlan, setUpgradedPlan] = useState<string | null>(null);
    const trialActivating = useRef(false);

    // Fetch user's geo location for currency detection
    useEffect(() => {
        async function fetchGeoInfo() {
            try {
                const res = await fetch('/api/geo');
                const data = await res.json();
                setGeoInfo(data);
            } catch (err) {
                console.error('Failed to fetch geo info:', err);
            }
        }
        fetchGeoInfo();
    }, []);

    // Check for payment callback
    useEffect(() => {
        const billingStatus = searchParams.get('billing');
        const reference = searchParams.get('reference') || searchParams.get('trxref');
        const plan = searchParams.get('plan');

        if (billingStatus === 'success' && reference && plan) {
            verifyPayment(reference, plan);
            // Clear URL params
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

    const verifyPayment = async (reference: string, plan: string = 'pro') => {
        setProcessing(true);
        setError(null);
        try {
            const res = await fetch('/api/billing/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference, plan }),
            });
            const data = await res.json();
            if (data.success) {
                setUpgradedPlan(plan);
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
                body: JSON.stringify({ plan, currency: displayCurrency }),
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
                setSuccess('Your free trial has been activated! Enjoy 14 days of Individual plan features.');
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
            price: PLAN_PRICES.free,
            period: '/month',
            icon: BoltIcon,
            color: 'text-gray-500',
            bg: 'bg-gray-100',
        },
        {
            id: 'starter',
            name: 'Individual',
            price: PLAN_PRICES.starter,
            period: '/month',
            icon: TrophyIcon,
            color: 'text-amber-500',
            bg: 'bg-amber-100',
        },
        {
            id: 'pro',
            name: 'Entrepreneur',
            price: PLAN_PRICES.pro,
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

    // Determine which currency to display
    const displayCurrency = currencyOverride || geoInfo?.currency || 'NGN';

    // Format price based on currency
    const formatPrice = (priceNGN: number | null) => {
        if (priceNGN === null) return 'Custom';
        if (priceNGN === 0) return '₦0';
        if (displayCurrency === 'USD') {
            const priceUSD = Math.round(priceNGN / 1700);
            return `$${priceUSD}`;
        }
        return `₦${priceNGN.toLocaleString()}`;
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
    const daysLeft = subscription?.trialEndsAt
        ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    return (
        <>
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

                {/* Trial active banner */}
                {subscription?.trialEndsAt && subscription?.status !== 'active' && daysLeft > 0 && (
                    <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500/15 to-pink-500/15 border border-violet-500/30">
                        <SparklesIconSolid className="w-5 h-5 text-violet-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                                Free Trial Active
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                {daysLeft} day{daysLeft === 1 ? '' : 's'} remaining &mdash; trial ends{' '}
                                {new Date(subscription.trialEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <button
                            onClick={() => handleSubscribe(subscription.plan || 'starter')}
                            className="flex-shrink-0 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                            Upgrade
                        </button>
                    </div>
                )}

                <div className={`relative overflow-hidden rounded-xl border-2 ${
                    subscription?.trialEndsAt && subscription?.status !== 'active' && daysLeft > 0
                        ? 'border-violet-400 bg-gradient-to-br from-violet-500/5 via-transparent to-pink-500/5'
                        : currentPlan === 'pro'
                        ? 'border-purple-500 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5'
                        : currentPlan === 'starter'
                        ? 'border-amber-500 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5'
                        : 'border-[var(--border-subtle)] bg-[var(--surface)]'
                } p-5`}>
                    {/* Trial pill */}
                    {subscription?.trialEndsAt && subscription?.status !== 'active' && daysLeft > 0 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full text-white text-xs font-bold shadow-lg shadow-violet-500/25 animate-pulse">
                            <SparklesIconSolid className="w-3 h-3" />
                            TRIAL
                        </div>
                    )}
                    {!subscription?.trialEndsAt && currentPlan === 'pro' && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-xs font-bold shadow-lg shadow-purple-500/25">
                            <SparklesIconSolid className="w-3 h-3" />
                            PRO
                        </div>
                    )}
                    {!subscription?.trialEndsAt && currentPlan === 'starter' && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-white text-xs font-bold shadow-lg shadow-amber-500/25">
                            <StarIcon className="w-3 h-3" />
                            INDIVIDUAL
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${plans.find(p => p.id === currentPlan)?.bg} ${currentPlan === 'pro' ? 'shadow-lg shadow-purple-500/20' : ''}`}>
                            {(() => {
                                const PlanIcon = plans.find(p => p.id === currentPlan)?.icon || BoltIcon;
                                return <PlanIcon className={`w-6 h-6 ${plans.find(p => p.id === currentPlan)?.color}`} />;
                            })()}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-bold capitalize">{PLAN_META[currentPlan as keyof typeof PLAN_META]?.label || currentPlan}</p>
                                {subscription?.trialEndsAt && subscription?.status !== 'active' && daysLeft > 0 ? (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-semibold rounded-full">
                                        <SparklesIconSolid className="w-3 h-3" />
                                        Trial — {daysLeft}d left
                                    </span>
                                ) : isActive ? (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 text-xs font-medium rounded-full">
                                        <CheckCircleIcon className="w-3 h-3" />
                                        Active
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 bg-gray-500/10 text-gray-500 text-xs font-medium rounded-full">
                                        Free
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                                {PLAN_META[currentPlan as keyof typeof PLAN_META]?.projects === 'unlimited'
                                    ? 'Unlimited Projects'
                                    : `${PLAN_META[currentPlan as keyof typeof PLAN_META]?.projects || 0} Projects`} • {' '}
                                {PLAN_META[currentPlan as keyof typeof PLAN_META]?.members === 'unlimited'
                                    ? 'Unlimited Members'
                                    : `${PLAN_META[currentPlan as keyof typeof PLAN_META]?.members || 0} Team Members`}
                            </p>
                        </div>
                    </div>

                    {currentPlan !== 'free' && isActive && (
                        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                            <button
                                onClick={handleCancelSubscription}
                                disabled={processing}
                                className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
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
                    <div className="flex items-center gap-2">
                        <GlobeAltIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                        <select
                            value={displayCurrency}
                            onChange={(e) => setCurrencyOverride(e.target.value as 'NGN' | 'USD')}
                            className="text-xs border border-[var(--border-subtle)] rounded-lg px-2 py-1 bg-[var(--background)]"
                        >
                            <option value="NGN">₦ NGN</option>
                            <option value="USD">$ USD</option>
                        </select>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {plans.filter(p => p.id !== 'enterprise').map((plan) => {
                        const isCurrentPlan = currentPlan === plan.id;
                        const isBlurred = plan.id === 'free' && currentPlan !== 'free';

                        return (
                            <div
                                key={plan.id}
                                className={`relative p-4 rounded-lg border-2 transition-all ${
                                    isCurrentPlan
                                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                                        : isBlurred
                                            ? 'border-[var(--border-subtle)] opacity-50 grayscale'
                                            : 'border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/50'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-1.5 rounded ${plan.bg}`}>
                                        <plan.icon className={`w-4 h-4 ${plan.color}`} />
                                    </div>
                                    <span className="font-semibold">{plan.name}</span>
                                    {plan.id === 'pro' && !isCurrentPlan && (
                                        <span className="ml-auto text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full font-medium">PRO</span>
                                    )}
                                </div>

                                <p className="text-2xl font-bold mb-3">
                                    {formatPrice(plan.price)}
                                    {plan.price !== null && plan.price > 0 && (
                                        <span className="text-sm font-normal text-[var(--text-secondary)]">/{plan.period}</span>
                                    )}
                                </p>

                                <ul className="space-y-1 mb-4">
                                    {PLAN_FEATURES[plan.id as keyof typeof PLAN_FEATURES]?.features?.map((feature: string) => (
                                        <li key={feature} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                            <CheckIcon className="w-3 h-3 text-green-500" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {isCurrentPlan ? (
                                    <button disabled className="w-full btn btn-secondary text-sm" style={{ backgroundColor: 'var(--brand-primary)', color: 'white' }}>
                                        Current Plan
                                    </button>
                                ) : isBlurred ? (
                                    <button disabled className="w-full btn btn-secondary text-sm bg-gray-100 text-gray-400 cursor-not-allowed">
                                        Current
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={processing}
                                        className="w-full btn btn-primary text-sm"
                                    >
                                        {processing ? (
                                            <ArrowPathIcon className="w-4 h-4 animate-spin mx-auto" />
                                        ) : (
                                            `Upgrade`
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
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
                                        onClick={() => handleActivateTrial('starter')}
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
            <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <div className="flex items-center gap-2 mb-2">
                    <BuildingOffice2Icon className="w-5 h-5 text-blue-600" />
                    <h2 className="font-semibold">Enterprise</h2>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Need custom pricing, SSO, SLA guarantees, or on-premise deployment? Contact us for a custom solution.
                </p>
                <button onClick={() => setShowEnterpriseModal(true)} className="btn btn-secondary text-sm">
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
                                    You're now on the
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
