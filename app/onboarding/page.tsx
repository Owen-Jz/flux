'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BuildingOffice2Icon, ArrowRightIcon, ArrowPathIcon, SparklesIcon, UserIcon } from '@heroicons/react/24/outline';
import { createWorkspace } from '@/actions/workspace';

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        image: '',
        workspaceName: '',
        workspaceSlug: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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

        setIsLoading(true);
        setError('');

        try {
            const result = await createWorkspace({ name: formData.workspaceName, slug: formData.workspaceSlug });
            router.push(`/${result.slug}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create workspace');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStep1Submit = async () => {
        if (!formData.name.trim()) return;
        try {
            await fetch('/api/auth/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: 1, data: { name: formData.name, image: formData.image } }),
            });
        } catch (e) {
            // Continue anyway
        }
        setStep(2);
    };

    const handleStep3Submit = async (completed: boolean) => {
        try {
            await fetch('/api/auth/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: 3, data: { completed } }),
            });
        } catch (e) {
            // Continue anyway
        }
        router.push('/dashboard');
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
                        <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--brand-primary)]">
                            <img src="/icon.svg" alt="Flux Logo" className="w-10 h-10 text-white" />
                        </span>
                    </motion.div>
                </div>

                {/* Progress indicator */}
                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`w-2 h-2 rounded-full transition-colors ${
                                s === step
                                    ? 'bg-[var(--brand-primary)]'
                                    : s < step
                                    ? 'bg-green-500'
                                    : 'bg-gray-300'
                            }`}
                        />
                    ))}
                </div>

                {/* Card */}
                <div className="card p-8">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Welcome/Profile */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-[var(--foreground)]">Welcome to Flux!</h2>
                                    <p className="text-[var(--text-secondary)]">Let's set up your profile</p>
                                </div>

                                {/* Profile photo */}
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-[var(--surface)] flex items-center justify-center overflow-hidden border-2 border-[var(--border)]">
                                            {formData.image ? (
                                                <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon className="w-10 h-10 text-[var(--text-secondary)]" />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="absolute bottom-0 right-0 w-8 h-8 bg-[var(--brand-primary)] rounded-full flex items-center justify-center text-white text-sm"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                        Your name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter your name"
                                        className="input"
                                        required
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleStep1Submit}
                                    disabled={!formData.name.trim()}
                                    className="btn btn-primary w-full"
                                >
                                    Continue
                                    <ArrowRightIcon className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}

                        {/* Step 2: Workspace */}
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
                                    <p className="text-[var(--text-secondary)]">Workspaces are where your team collaborates</p>
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
                                    <button type="button" onClick={() => setStep(1)} className="btn btn-secondary flex-1">
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

                        {/* Step 3: Dashboard Tour */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <SparklesIcon className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-[var(--foreground)]">You're all set!</h2>
                                    <p className="text-[var(--text-secondary)]">Let's take a quick tour of your dashboard</p>
                                </div>

                                {/* Tour highlights */}
                                <div className="space-y-3">
                                    <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
                                        <h3 className="font-medium text-[var(--foreground)]">Sidebar</h3>
                                        <p className="text-sm text-[var(--text-secondary)]">Navigate between workspaces and settings</p>
                                    </div>
                                    <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
                                        <h3 className="font-medium text-[var(--foreground)]">Create Boards</h3>
                                        <p className="text-sm text-[var(--text-secondary)]">Organize tasks with boards, lists, and cards</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/dashboard')}
                                        className="btn btn-secondary flex-1"
                                    >
                                        Skip
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleWorkspaceSubmit()}
                                        className="btn btn-primary flex-1"
                                    >
                                        Start Tour
                                        <ArrowRightIcon className="w-4 h-4" />
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
