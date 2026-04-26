'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCardIcon, CheckIcon, ArrowPathIcon, ExclamationCircleIcon, XMarkIcon, TrophyIcon, BoltIcon, BuildingOffice2Icon, GlobeAltIcon, ShieldCheckIcon, HandRaisedIcon, DocumentChartBarIcon, ServerIcon, ArrowPathIcon as SubmitIcon } from '@heroicons/react/24/outline';

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
            name: 'Starter',
            price: PLAN_PRICES.starter,
            period: '/month',
            icon: TrophyIcon,
            color: 'text-amber-500',
            bg: 'bg-amber-100',
        },
        {
            id: 'pro',
            name: 'Pro',
            price: PLAN_PRICES.pro,
            period: '/month',
            icon: TrophyIcon,
            color: 'text-purple-500',
            bg: 'bg-purple-100',
            popular: true,
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
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
            {!loading && subscription?.trialEndsAt && subscription?.status === 'inactive' && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-violet-300">
                                Your {subscription.plan?.charAt(0).toUpperCase() + subscription.plan?.slice(1)} Trial
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining` : 'Trial ended'}
                            </p>
                        </div>
                        <button
                            onClick={() => handleSubscribe(subscription.plan || 'pro')}
                            className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                            Upgrade Now
                        </button>
                    </div>
                </div>
            )}
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
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Available Plans</h2>
                    {/* Currency Selector */}
                    <div className="flex items-center gap-2">
                        <GlobeAltIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                        <span className="text-xs text-[var(--text-secondary)]">
                            {geoInfo?.isNigeria === false ? 'Detected: ' : 'Showing prices in: '}
                        </span>
                        <select
                            value={displayCurrency}
                            onChange={(e) => setCurrencyOverride(e.target.value as 'NGN' | 'USD')}
                            className="text-xs border border-[var(--border-subtle)] rounded-md px-2 py-1 bg-[var(--background)] text-[var(--foreground)]"
                        >
                            <option value="NGN">₦ NGN (Naira)</option>
                            <option value="USD">$ USD (Dollar)</option>
                        </select>
                        {geoInfo && !geoInfo.isNigeria && !currencyOverride && (
                            <span className="text-xs text-[var(--text-tertiary)]">
                                (auto-detected: {geoInfo.country})
                            </span>
                        )}
                    </div>
                </div>
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
                                {formatPrice(plan.price)}
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
                <button onClick={() => setShowEnterpriseModal(true)} className="btn btn-secondary text-sm">
                    Contact Sales
                </button>
            </div>
        </div>
            <EnterpriseModal isOpen={showEnterpriseModal} onClose={() => setShowEnterpriseModal(false)} />
        </>
    );
}
