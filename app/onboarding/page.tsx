'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { BuildingOffice2Icon, ArrowRightIcon, SparklesIcon, UsersIcon } from '@heroicons/react/24/outline';
import { createWorkspace } from '@/actions/workspace';
import { getWorkspaces } from '@/actions/workspace';

export default function OnboardingPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState(1); // 1=Welcome, 1.5=InvitePrompt, 2=CreateWorkspace, 3=Tour
    const [formData, setFormData] = useState({
        workspaceName: '',
        workspaceSlug: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [invitedWorkspaces, setInvitedWorkspaces] = useState<Array<{ slug: string; name: string; role: string }>>([]);
    const [joinedWorkspace, setJoinedWorkspace] = useState<{ slug: string; name: string } | null>(null);

    useEffect(() => {
        async function checkAccess() {
            try {
                const workspaces = await getWorkspaces();
                if (workspaces.length > 0) {
                    router.replace('/dashboard');
                    return;
                }

                // Parse invited workspaces from URL
                const params = new URLSearchParams(window.location.search);
                const invitedParam = params.get('invited');
                if (invitedParam) {
                    try {
                        const parsed = JSON.parse(decodeURIComponent(invitedParam));
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setInvitedWorkspaces(parsed);
                        }
                    } catch (e) {
                        console.error('Failed to parse invited workspaces');
                    }
                }
            } catch (e) {
                router.replace('/dashboard');
                return;
            }
            setIsLoading(false);
        }
        checkAccess();
    }, [router]);

    // Check if user has already completed onboarding - if so, redirect to dashboard
    useEffect(() => {
        async function checkOnboardingStatus() {
            try {
                const res = await fetch('/api/auth/onboarding-status');
                if (res.ok) {
                    const data = await res.json();
                    if (data.hasCompletedOnboarding) {
                        router.replace('/dashboard');
                        return;
                    }
                }
            } catch (e) {
                // If error checking status, allow onboarding to proceed
            }
        }
        checkOnboardingStatus();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="animate-pulse text-[var(--text-secondary)]">Loading...</div>
            </div>
        );
    }

    const handleNameChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            workspaceName: value,
            workspaceSlug: value
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 30)
        }));
    };

    const handleWorkspaceSubmit = async () => {
        if (!formData.workspaceName || !formData.workspaceSlug) return;

        setIsSubmitting(true);
        setError('');

        try {
            if (joinedWorkspace) {
                // User joined an invited workspace, redirect there after tour completes
                // Mark onboarding as complete since they have a workspace now
                try {
                    await fetch('/api/auth/onboarding', { method: 'PATCH' });
                } catch (e) {
                    // Ignore errors
                }
                router.push(`/${joinedWorkspace.slug}`);
            } else {
                const result = await createWorkspace({ name: formData.workspaceName, slug: formData.workspaceSlug });
                router.push(`/${result.slug}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create workspace');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleJoinWorkspace = (workspace: { slug: string; name: string; role: string }) => {
        setJoinedWorkspace({ slug: workspace.slug, name: workspace.name });
        setStep(3); // Skip to tour, then route to joined workspace
    };

    const handleSkipInvite = () => {
        setInvitedWorkspaces([]);
        setStep(2);
    };

    // Determine which steps to show in progress indicator
    const showInviteStep = invitedWorkspaces.length > 0;
    const totalSteps = showInviteStep ? 4 : 3;
    const getProgressStep = () => {
        if (step === 1) return 1;
        if (step === 1.5) return 2;
        if (step === 2) return showInviteStep ? 3 : 2;
        if (step === 3) return showInviteStep ? 4 : 3;
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
                {/* Header */}
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

                {/* Progress indicator */}
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

                {/* Card */}
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
                                            <h3 className="font-medium text-[var(--foreground)]">Boards & Tasks</h3>
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
                                    onClick={() => {
                                        if (showInviteStep) {
                                            setStep(1.5);
                                        } else {
                                            setStep(2);
                                        }
                                    }}
                                    className="btn btn-primary w-full"
                                >
                                    Get Started
                                    <ArrowRightIcon className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}

                        {/* Step 1.5: Invite Prompt (NEW) */}
                        {step === 1.5 && (
                            <motion.div
                                key="step-invite"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                        <UsersIcon className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-[var(--foreground)]">
                                        You&apos;ve been invited!
                                    </h2>
                                    <p className="text-[var(--text-secondary)]">
                                        You were invited to join the following workspace(s)
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {invitedWorkspaces.map((workspace) => (
                                        <div
                                            key={workspace.slug}
                                            className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]"
                                        >
                                            <h3 className="font-bold text-lg text-[var(--foreground)]">{workspace.name}</h3>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                Role: <span className="font-medium">{workspace.role}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleJoinWorkspace(invitedWorkspaces[0])}
                                        className="btn btn-primary flex-1"
                                    >
                                        Join {invitedWorkspaces[0].name}
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSkipInvite}
                                        className="btn btn-secondary flex-1"
                                    >
                                        Skip, create my own
                                    </button>
                                </div>

                                <p className="text-xs text-[var(--text-secondary)] text-center">
                                    You can create your own workspace and join this one later from your dashboard.
                                </p>
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
                                        <span className="text-[var(--text-secondary)] text-sm">
                                            flux.com/
                                        </span>
                                        <input
                                            type="text"
                                            value={formData.workspaceSlug}
                                            onChange={(e) =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    workspaceSlug: e.target.value
                                                        .toLowerCase()
                                                        .replace(/[^a-z0-9-]/g, '')
                                                        .substring(0, 30)
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
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="btn btn-secondary flex-1"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        disabled={!formData.workspaceName.trim() || !formData.workspaceSlug.trim()}
                                        className="btn btn-primary flex-1"
                                    >
                                        Continue
                                        <ArrowRightIcon className="w-4 h-4" />
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
                                    <h2 className="text-2xl font-bold text-[var(--foreground)]">Learn by doing!</h2>
                                    <p className="text-[var(--text-secondary)]">Take a quick interactive tour of your board</p>
                                </div>

                                {/* Interactive steps preview */}
                                <div className="space-y-3">
                                    <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-bold text-blue-600">1</span>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[var(--foreground)]">Drag a task</h3>
                                            <p className="text-sm text-[var(--text-secondary)]">Move a task between columns</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-bold text-purple-600">2</span>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[var(--foreground)]">Assign yourself</h3>
                                            <p className="text-sm text-[var(--text-secondary)]">Click on a task and assign it to yourself</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-bold text-green-600">3</span>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[var(--foreground)]">Add a comment</h3>
                                            <p className="text-sm text-[var(--text-secondary)]">Update task description or add a comment</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Multi-workspace explanation */}
                                {joinedWorkspace && (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            <strong>Note:</strong> You can work in multiple workspaces — the one you were invited to ({joinedWorkspace.name}) and any you create yourself. Your dashboard will show all your workspaces.
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            // Mark onboarding as skipped
                                            try {
                                                await fetch('/api/auth/onboarding', { method: 'PATCH' });
                                            } catch (e) {
                                                // Ignore errors
                                            }
                                            router.push('/dashboard');
                                        }}
                                        className="btn btn-secondary flex-1"
                                    >
                                        Skip
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleWorkspaceSubmit()}
                                        disabled={isSubmitting}
                                        className="btn btn-primary flex-1"
                                    >
                                        {isSubmitting ? (
                                            <span className="animate-spin">⟳</span>
                                        ) : (
                                            <>
                                                Start Tour
                                                <ArrowRightIcon className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}