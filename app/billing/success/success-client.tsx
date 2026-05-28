'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckIcon,
    SparklesIcon,
    BoltIcon,
    UsersIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    ArrowPathIcon,
    ExclamationCircleIcon,
    ArrowRightIcon,
    TrophyIcon,
    StarIcon,
    GiftIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid';
import { dismissUpgradeWelcome } from '@/actions/billing/dismiss-upgrade-welcome';
import { PLAN_META } from '@/lib/plan-limits';

type PlanId = 'starter' | 'pro' | 'enterprise';

interface BillingSuccessClientProps {
    reference: string | null;
    initialPlan: PlanId;
    initialIsActive: boolean;
    userName: string;
}

interface VerifyResponse {
    success?: boolean;
    plan?: string;
    status?: string;
    amount?: number;
    currency?: string;
    error?: string;
}

const PLAN_BENEFITS: Record<PlanId, Array<{ icon: typeof BoltIcon; title: string; description: string }>> = {
    starter: [
        { icon: BoltIcon, title: '5 Projects', description: 'Plenty of room to organize your work' },
        { icon: UsersIcon, title: '10 Team Members', description: 'Invite collaborators with the right permissions' },
        { icon: ChartBarIcon, title: 'Email Support', description: 'Get direct help when you need it' },
        { icon: ShieldCheckIcon, title: 'Custom Workflows', description: 'Tailor boards to your team\'s process' },
    ],
    pro: [
        { icon: BoltIcon, title: 'Unlimited Projects', description: 'No more limits — build as much as you need' },
        { icon: UsersIcon, title: '25 Team Members', description: 'Scale collaboration across your organization' },
        { icon: SparklesIconSolid, title: 'Priority Support', description: 'Front-of-the-line response from our team' },
        { icon: ChartBarIcon, title: 'Advanced Analytics', description: 'Deep insight into team velocity and trends' },
    ],
    enterprise: [
        { icon: BoltIcon, title: 'Unlimited Everything', description: 'No usage caps anywhere in the product' },
        { icon: UsersIcon, title: 'Unlimited Members', description: 'Onboard your entire company' },
        { icon: ShieldCheckIcon, title: 'SSO & SLA Guarantee', description: '99.99% uptime with enterprise security' },
        { icon: GiftIcon, title: 'Dedicated Success Manager', description: 'A real person, always available' },
    ],
};

const NEXT_STEPS: Array<{ icon: typeof BoltIcon; title: string; description: string }> = [
    { icon: BoltIcon, title: 'Create a new project', description: 'Use your expanded project allowance right away' },
    { icon: UsersIcon, title: 'Invite your team', description: 'Workspace members can now collaborate at scale' },
    { icon: ChartBarIcon, title: 'Explore analytics', description: 'See how your team is shipping' },
];

export function BillingSuccessClient({ reference, initialPlan, initialIsActive, userName }: BillingSuccessClientProps) {
    const router = useRouter();
    const verifyAttempted = useRef(false);
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
        reference ? 'verifying' : (initialIsActive ? 'success' : 'error')
    );
    const [plan, setPlan] = useState<PlanId>(initialPlan);
    const [error, setError] = useState<string | null>(
        reference ? null : (initialIsActive ? null : 'No payment reference provided. If your payment was successful, please refresh this page or contact support.')
    );

    useEffect(() => {
        if (!reference || verifyAttempted.current) return;
        verifyAttempted.current = true;

        async function verify() {
            try {
                const res = await fetch('/api/billing/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reference }),
                });
                const data: VerifyResponse = await res.json();

                if (data.success && data.plan) {
                    setPlan(data.plan as PlanId);
                    setStatus('success');
                } else if (initialIsActive) {
                    // Idempotent fallback — server says already active, treat as success
                    setStatus('success');
                } else {
                    setStatus('error');
                    setError(data.error || 'We could not verify your payment. Please contact support if you were charged.');
                }
            } catch {
                if (initialIsActive) {
                    setStatus('success');
                } else {
                    setStatus('error');
                    setError('Network error while verifying payment. Please refresh the page.');
                }
            }
        }

        void verify();
    }, [reference, initialIsActive]);

    const handleContinue = async () => {
        // Clear the lastUpgradeAt flag so the dashboard's fallback welcome
        // modal does not fire a second time after this page already onboarded the user.
        try {
            await dismissUpgradeWelcome();
        } catch {
            // Non-fatal — dashboard modal will just show once more.
        }
        router.push('/dashboard');
    };

    const planLabel = PLAN_META[plan]?.label || plan;
    const benefits = PLAN_BENEFITS[plan] || PLAN_BENEFITS.pro;
    const firstName = userName.split(' ')[0] || 'there';

    return (
        <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
            {/* Ambient gradient background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-40"
                    style={{
                        background: 'radial-gradient(ellipse, rgba(168, 85, 247, 0.35) 0%, transparent 70%)',
                        filter: 'blur(80px)',
                    }}
                />
                <div
                    className="absolute -bottom-40 -right-40 w-[700px] h-[400px] opacity-30"
                    style={{
                        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.35) 0%, transparent 70%)',
                        filter: 'blur(100px)',
                    }}
                />
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
                <AnimatePresence mode="wait">
                    {status === 'verifying' && (
                        <motion.div
                            key="verifying"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="flex flex-col items-center justify-center text-center min-h-[60vh]"
                        >
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/30">
                                <ArrowPathIcon className="w-10 h-10 text-white animate-spin" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">
                                Confirming your payment&hellip;
                            </h1>
                            <p className="text-[var(--text-secondary)] max-w-md">
                                Just a moment while we activate your subscription.
                            </p>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="flex flex-col items-center justify-center text-center min-h-[60vh]"
                        >
                            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                                <ExclamationCircleIcon className="w-10 h-10 text-red-500" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-3">
                                We hit a snag
                            </h1>
                            <p className="text-[var(--text-secondary)] max-w-md mb-8">
                                {error}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => router.push('/settings')}
                                    className="px-5 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm font-medium hover:bg-[var(--background)] transition-colors"
                                >
                                    Go to Billing
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="px-5 py-2.5 bg-[var(--brand-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                                >
                                    Continue to Dashboard
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="space-y-8"
                        >
                            {/* Hero */}
                            <div className="text-center">
                                <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.05 }}
                                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 shadow-2xl shadow-emerald-500/30 mb-6"
                                >
                                    <CheckIcon className="w-12 h-12 text-white" strokeWidth={3} />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                >
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold uppercase tracking-wider mb-4 shadow-lg">
                                        {plan === 'pro' ? <TrophyIcon className="w-3.5 h-3.5" /> : <StarIcon className="w-3.5 h-3.5" />}
                                        {planLabel} Plan
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-bold text-[var(--foreground)] tracking-tight mb-3">
                                        You&apos;re in, {firstName}.
                                    </h1>
                                    <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
                                        Payment confirmed. Your account has been upgraded to{' '}
                                        <span className="font-semibold text-[var(--foreground)]">{planLabel}</span>.
                                    </p>
                                </motion.div>
                            </div>

                            {/* Benefits grid */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 md:p-8 shadow-xl"
                            >
                                <div className="flex items-center gap-2 mb-5">
                                    <SparklesIcon className="w-5 h-5 text-purple-500" />
                                    <h2 className="text-lg font-bold text-[var(--foreground)]">
                                        What you&apos;ve unlocked
                                    </h2>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {benefits.map((benefit, idx) => (
                                        <motion.div
                                            key={benefit.title}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + idx * 0.05 }}
                                            className="flex gap-3 items-start"
                                        >
                                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                                <benefit.icon className="w-5 h-5 text-purple-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-[var(--foreground)]">
                                                    {benefit.title}
                                                </p>
                                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                                    {benefit.description}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Next steps */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 md:p-8 shadow-xl"
                            >
                                <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">
                                    A few things to try first
                                </h2>
                                <div className="space-y-3">
                                    {NEXT_STEPS.map((step, idx) => (
                                        <motion.div
                                            key={step.title}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.45 + idx * 0.05 }}
                                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--background-subtle)] transition-colors"
                                        >
                                            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/15 to-purple-500/15 flex items-center justify-center text-purple-600">
                                                <step.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-[var(--foreground)]">
                                                    {step.title}
                                                </p>
                                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                                    {step.description}
                                                </p>
                                            </div>
                                            <span className="flex-shrink-0 text-xs font-semibold text-[var(--text-tertiary)]">
                                                {idx + 1}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* CTA */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="flex flex-col sm:flex-row gap-3 justify-center"
                            >
                                <button
                                    onClick={handleContinue}
                                    className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-xl shadow-purple-500/30 flex items-center justify-center gap-2"
                                >
                                    Continue to Dashboard
                                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                </button>
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.75 }}
                                className="text-center text-xs text-[var(--text-tertiary)]"
                            >
                                A receipt has been sent to your email. Manage your subscription anytime in Settings &rarr; Billing.
                            </motion.p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
