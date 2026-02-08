'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { createWorkspace } from '@/actions/workspace';

export default function OnboardingPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleNameChange = (value: string) => {
        setName(value);
        // Auto-generate slug from name
        setSlug(
            value
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 30)
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await createWorkspace({ name, slug });
            router.push(`/${result.slug}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create workspace');
        } finally {
            setIsLoading(false);
        }
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
                        <img src="/icon.svg" alt="Flux Logo" className="w-16 h-16 rounded-2xl" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)]">
                        Create your workspace
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2">
                        Workspaces are where your team collaborates on projects.
                    </p>
                </div>

                {/* Card */}
                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                <input
                                    type="text"
                                    placeholder="Acme Inc."
                                    value={name}
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
                                    value={slug}
                                    onChange={(e) =>
                                        setSlug(
                                            e.target.value
                                                .toLowerCase()
                                                .replace(/[^a-z0-9-]/g, '')
                                                .substring(0, 30)
                                        )
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

                        <button
                            type="submit"
                            disabled={isLoading || !name || !slug}
                            className="btn btn-primary w-full"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Create workspace
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
