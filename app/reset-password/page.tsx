'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EnvelopeIcon, LockClosedIcon, ArrowRightIcon, ArrowPathIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [mode, setMode] = useState<'request' | 'reset'>(token ? 'reset' : 'request');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (token) {
            setMode('reset');
        }
    }, [token]);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to request password reset');
                return;
            }

            setSuccess(true);
        } catch {
            setError('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/reset-password/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to reset password');
                return;
            }

            setSuccess(true);
            // Redirect to login after a short delay
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch {
            setError('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    if (success && mode === 'request') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md text-center"
                >
                    <div className="card p-8">
                        <div className="flex justify-center mb-4">
                            <CheckCircleIcon className="w-16 h-16 text-[var(--success-primary)]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Check your email</h1>
                        <p className="text-[var(--text-secondary)] mb-6">
                            If an account exists with this email, you will receive a password reset link shortly.
                        </p>
                        <Link href="/login" className="text-[var(--brand-primary)] font-medium hover:underline">
                            Back to login
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

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
                <p className="text-[var(--text-secondary)] mt-2 text-center">
                    {mode === 'request' ? 'Reset your password' : 'Create new password'}
                </p>

                {/* Card */}
                <div className="card p-8">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-lg bg-[var(--error-bg)] text-[var(--error-primary)] text-sm mb-6"
                        >
                            {error}
                        </motion.div>
                    )}

                    {success && mode === 'reset' ? (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-lg bg-[var(--success-bg)] text-[var(--success-primary)] text-center"
                        >
                            <CheckCircleIcon className="w-8 h-8 mx-auto mb-2" />
                            <p>Password reset successfully! Redirecting to login...</p>
                        </motion.div>
                    ) : mode === 'request' ? (
                        <form onSubmit={handleRequestReset} className="space-y-6">
                            <div className="relative">
                                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input !pl-12"
                                    required
                                />
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
                                        Send reset link
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="relative">
                                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="New password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input !pl-12 !pr-12"
                                    minLength={6}
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

                            <div className="relative">
                                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input !pl-12 !pr-12"
                                    minLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
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
                                        Reset password
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
                        Remember your password?{' '}
                        <Link
                            href="/login"
                            className="text-[var(--brand-primary)] font-medium hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
