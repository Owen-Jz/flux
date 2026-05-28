'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BuildingOffice2Icon, ArrowRightIcon, SparklesIcon, UsersIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { createWorkspace } from '@/actions/workspace';
import { getWorkspaces } from '@/actions/workspace';
import { getInvitedWorkspaces } from '@/actions/onboarding';

export default function OnboardingPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    // Steps: 1=Welcome, 2=CreateWorkspace, 3=Tour, 4=InviteSwitch (only for invited users)
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ workspaceName: '', workspaceSlug: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [invitedWorkspaces, setInvitedWorkspaces] = useState<Array<{ slug: string; name: string; role: string }>>([]);
    const [ownWorkspaceSlug, setOwnWorkspaceSlug] = useState<string | null>(null);

    useEffect(() => {
        async function checkAccess() {
            try {
                // Fetch workspaces the user was invited to (not ones they created)
                const invited = await getInvitedWorkspaces();
                if (invited.length > 0) {
                    setInvitedWorkspaces(invited);
                }

                // If no invites, redirect to dashboard if user already has workspaces
                if (invited.length === 0) {
                    const workspaces = await getWorkspaces();
                    if (workspaces.length > 0) {
                        router.replace('/dashboard');
                        return;
                    }
                }
            } catch (e) {
                // Don't redirect on error — that can cause a /dashboard ↔ /onboarding loop
                // when hasCompletedOnboarding is still false. Just let the user proceed.
                console.error('[Onboarding] checkAccess failed:', e);
            }
            setIsLoading(false);
        }
        checkAccess();
    }, [router]);

    // Skip onboarding if already completed (manual navigation guard)
    useEffect(() => {
        async function checkOnboardingStatus() {
            try {
                const res = await fetch('/api/auth/onboarding');
                if (res.ok) {
                    const data = await res.json();
                    if (data.hasCompletedOnboarding) {
                        router.replace('/dashboard');
                    }
                }
            } catch {
                // allow onboarding to proceed
            }
        }
        checkOnboardingStatus();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <motion.div
                    animate={{ scale: [0.97, 1.03, 0.97] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ filter: 'drop-shadow(0 0 18px rgba(126,59,233,0.45))' }}
                >
                    <svg width="56" height="56" viewBox="0 0 94 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <motion.rect
                            y="30" width="66" height="66" rx="5" fill="#7E3BE9"
                            animate={{ opacity: [0.15, 0.45, 0.15] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
                        />
                        <motion.rect
                            x="14" y="15" width="66" height="66" rx="5" fill="#7E3BE9"
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                        />
                        <motion.rect
                            x="28" y="0" width="66" height="66" rx="5" fill="#7E3BE9"
                            animate={{ opacity: [0.55, 1, 0.55] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                        />
                    </svg>
                </motion.div>
            </div>
        );
    }

    const handleNameChange = (value: string) => {
        setFormData({
            workspaceName: value,
            workspaceSlug: value
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 30),
        });
    };

    // Step 2 → creates workspace, saves slug, advances to tour step
    const handleWorkspaceCreate = async () => {
        if (!formData.workspaceName || !formData.workspaceSlug) return;
        setIsSubmitting(true);
        setError('');
        try {
            const result = await createWorkspace({ name: formData.workspaceName, slug: formData.workspaceSlug });
            setOwnWorkspaceSlug(result.slug);
            setStep(3);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create workspace');
        } finally {
            setIsSubmitting(false);
        }
    };

    const markOnboardingComplete = async () => {
        try { await fetch('/api/auth/onboarding', { method: 'PATCH' }); } catch { /* ignore */ }
    };

    const hasInvite = invitedWorkspaces.length > 0;
    const totalSteps = hasInvite ? 4 : 3;

    const getProgressStep = () => {
        if (step === 1) return 1;
        if (step === 2) return 2;
        if (step === 3) return 3;
        if (step === 4) return 4;
        return 1;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="inline-flex items-center justify-center mb-4"
                    >
                        <svg width="48" height="48" viewBox="0 0 94 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                            <rect y="30" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.3"/>
                            <rect x="14" y="15" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.6"/>
                            <rect x="28" width="66" height="66" rx="5" fill="#7E3BE9"/>
                        </svg>
                    </motion.div>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-6">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                        <div
                            key={s}
                            className={`w-2 h-2 rounded-full transition-colors ${
                                s === getProgressStep()
                                    ? 'bg-[var(--brand-primary)]'
                                    : s < getProgressStep()
                                    ? 'bg-green-500'
                                    : 'bg-gray-300'
                            }`}
                        />
                    ))}
                </div>

                <div className="card p-8">
                    <AnimatePresence mode="wait">

                        {/* Step 1: Welcome */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center">
                                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-3">
                                        Welcome to Flux
                                    </h1>
                                    <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-sm mx-auto">
                                        Organize your team&apos;s work, track tasks, and ship faster — all in one place.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[var(--foreground)]">Boards &amp; Tasks</h3>
                                            <p className="text-sm text-[var(--text-secondary)]">Visualize work with kanban boards and track progress</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[var(--foreground)]">Team Collaboration</h3>
                                            <p className="text-sm text-[var(--text-secondary)]">Invite your team and collaborate in real-time</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[var(--foreground)]">AI-Powered</h3>
                                            <p className="text-sm text-[var(--text-secondary)]">Break down complex tasks automatically</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="btn btn-primary w-full"
                                >
                                    Get Started
                                    <ArrowRightIcon className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}

                        {/* Step 2: Create Workspace */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-[var(--foreground)]">Create your workspace</h2>
                                    <p className="text-[var(--text-secondary)]">This is where your team collaborates</p>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-lg bg-red-50 text-red-600 text-sm"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-[var(--foreground)]">
                                        Workspace name
                                    </label>
                                    <div className="relative">
                                        <BuildingOffice2Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                        <input
                                            type="text"
                                            placeholder="Acme Inc."
                                            value={formData.workspaceName}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            className="input !pl-12"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-[var(--foreground)]">
                                        Workspace URL
                                    </label>
                                    <div className="flex items-center gap-2 p-3 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
                                        <span className="text-[var(--text-secondary)] text-sm">fluxboard.site/</span>
                                        <input
                                            type="text"
                                            value={formData.workspaceSlug}
                                            onChange={(e) =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    workspaceSlug: e.target.value
                                                        .toLowerCase()
                                                        .replace(/[^a-z0-9-]/g, '')
                                                        .substring(0, 30),
                                                }))
                                            }
                                            className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                                            placeholder="acme-inc"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        This will be your workspace&apos;s unique URL
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setStep(1)} className="btn btn-secondary flex-1" disabled={isSubmitting}>
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleWorkspaceCreate}
                                        disabled={!formData.workspaceName.trim() || !formData.workspaceSlug.trim() || isSubmitting}
                                        className="btn btn-primary flex-1"
                                    >
                                        {isSubmitting ? (
                                            <span className="animate-spin">⟳</span>
                                        ) : (
                                            <>
                                                Continue
                                                <ArrowRightIcon className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Tour */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                        <SparklesIcon className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-[var(--foreground)]">Quick tour</h2>
                                    <p className="text-[var(--text-secondary)]">Here&apos;s what you can do in your workspace</p>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { num: '1', color: 'blue', title: 'Drag a task', desc: 'Move a task between columns' },
                                        { num: '2', color: 'purple', title: 'Assign yourself', desc: 'Click on a task and assign it to yourself' },
                                        { num: '3', color: 'green', title: 'Add a comment', desc: 'Update task description or add a comment' },
                                    ].map(({ num, color, title, desc }) => (
                                        <div key={num} className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
                                                <span className={`text-sm font-bold text-${color}-600`}>{num}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-[var(--foreground)]">{title}</h3>
                                                <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await markOnboardingComplete();
                                            if (invitedWorkspaces.length > 0) {
                                                setStep(4);
                                            } else {
                                                router.push('/dashboard');
                                            }
                                        }}
                                        className="btn btn-secondary flex-1"
                                    >
                                        Skip Tour
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await markOnboardingComplete();
                                            if (invitedWorkspaces.length > 0) {
                                                setStep(4);
                                            } else {
                                                router.push('/dashboard');
                                            }
                                        }}
                                        className="btn btn-primary flex-1"
                                    >
                                        Start Tour
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Invited workspace switch prompt (only for invited users) */}
                        {step === 4 && invitedWorkspaces.length > 0 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                                        className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                                    >
                                        <CheckCircleIcon className="w-8 h-8 text-white" />
                                    </motion.div>
                                    <h2 className="text-2xl font-bold text-[var(--foreground)]">You&apos;re all set!</h2>
                                    <p className="text-[var(--text-secondary)] mt-1">
                                        Your workspace is ready. One more thing —
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--brand-primary)]/10 to-purple-500/10 border border-[var(--brand-primary)]/20">
                                    <div className="flex items-center gap-3 mb-2">
                                        <UsersIcon className="w-5 h-5 text-[var(--brand-primary)]" />
                                        <p className="font-semibold text-[var(--foreground)]">You were also added to a team</p>
                                    </div>
                                    {invitedWorkspaces.map((ws) => (
                                        <div key={ws.slug} className="ml-8">
                                            <p className="text-lg font-bold text-[var(--foreground)]">{ws.name}</p>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                Your role: <span className="font-medium capitalize">{ws.role.toLowerCase()}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <p className="text-sm text-center text-[var(--text-secondary)]">
                                    Where would you like to go first?
                                </p>

                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await markOnboardingComplete();
                                            router.push(`/${invitedWorkspaces[0].slug}`);
                                        }}
                                        className="btn btn-primary w-full"
                                    >
                                        <UsersIcon className="w-4 h-4" />
                                        Go to {invitedWorkspaces[0].name}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await markOnboardingComplete();
                                            router.push(ownWorkspaceSlug ? `/${ownWorkspaceSlug}` : '/dashboard');
                                        }}
                                        className="btn btn-secondary w-full"
                                    >
                                        Go to my workspace
                                        {ownWorkspaceSlug && (
                                            <span className="ml-1 text-xs opacity-70">({formData.workspaceName})</span>
                                        )}
                                    </button>
                                </div>

                                <p className="text-xs text-center text-[var(--text-tertiary)]">
                                    You can switch between workspaces anytime from the sidebar.
                                </p>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
