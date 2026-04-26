'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EnvelopeIcon, LockClosedIcon, ArrowRightIcon, ArrowPathIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                if (result.error.includes('locked') || result.error.includes('too many attempts')) {
                    setError('Too many failed attempts. Please try again in 15 minutes.');
                } else if (result.error.includes('credentials')) {
                    setError('Invalid email or password. Please try again.');
                } else {
                    setError('Something went wrong. Please try again.');
                }
            } else {
                router.push('/dashboard');
            }
        } catch {
            setError('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        try {
            await signIn('google', { callbackUrl: '/dashboard' });
        } finally {
            // Loading will persist until redirect
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-8">
                    <svg width="36" height="36" viewBox="0 0 94 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                        <rect y="30" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.3"/>
                        <rect x="14" y="15" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.6"/>
                        <rect x="28" width="66" height="66" rx="5" fill="#7E3BE9"/>
                    </svg>
                    <span className="text-3xl font-black text-[var(--foreground)]">flux</span>
                </Link>
                <p className="text-[var(--text-secondary)] mt-2 text-center">Welcome back</p>

                {/* Card */}
                <div className="card p-8">
                    {/* Google Sign In */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                        className="btn btn-secondary w-full mb-6 disabled:opacity-70"
                    >
                        {isGoogleLoading ? (
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        )}
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[var(--border-subtle)]" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[var(--background)] text-[var(--text-secondary)]">
                                or continue with email
                            </span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg bg-[var(--error-bg)] text-[var(--error-primary)] text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="relative">
                            <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input !pl-12"
                                required
                            />
                        </div>

                        <div className="relative">
                            <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input !pl-12 !pr-12"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="w-5 h-5" />
                                ) : (
                                    <EyeIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full"
                        >
                            {isLoading ? (
                                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRightIcon className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <div className="text-center mt-4">
                            <Link
                                href="/reset-password"
                                className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary)]"
                            >
                                Forgot password?
                            </Link>
                        </div>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/signup"
                            className="text-[var(--brand-primary)] font-medium hover:underline"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
