'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EnvelopeIcon, LockClosedIcon, ArrowRightIcon, ArrowPathIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { FcGoogle } from 'react-icons/fc';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    useEffect(() => {
        const urlError = searchParams.get('error');
        const verified = searchParams.get('verified');
        if (urlError === 'account-exists-with-credentials') {
            setError('An account with this email already exists. Please sign in with your email and password instead.');
        } else if (urlError === 'OAuthCallback' || urlError === 'OAuthSignin') {
            setError('Google sign-in failed. Please try again.');
        } else if (urlError === 'OAuthCreateAccount') {
            setError('Could not create your account. Please try again.');
        } else if (urlError === 'AccessDenied') {
            setError('Access denied. Please try signing in again.');
        } else if (urlError === 'Configuration') {
            setError('There is a server configuration issue. Please try again later.');
        } else if (urlError) {
            setError('Something went wrong during sign-in. Please try again.');
        } else if (verified === 'true') {
            setInfo('Email verified! You can now log in.');
        }
    }, [searchParams]);

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
        } catch {
            setIsGoogleLoading(false);
            setError('Failed to start Google sign in. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Brand Panel — always dark, theme-independent */}
            <div
                className="hidden md:flex md:w-[44%] lg:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
                style={{ background: 'linear-gradient(145deg, #0d0024 0%, #1c0550 45%, #2e0875 80%, #0d0024 100%)' }}
            >
                {/* Atmospheric glow blobs */}
                <div
                    className="absolute top-[-120px] right-[-80px] w-[420px] h-[420px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(126,59,233,0.42) 0%, transparent 70%)' }}
                />
                <div
                    className="absolute bottom-[-100px] left-[-60px] w-[340px] h-[340px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(100,50,210,0.3) 0%, transparent 70%)' }}
                />
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(165,112,255,0.14) 0%, transparent 70%)' }}
                />

                {/* Subtle dot grid overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)',
                        backgroundSize: '36px 36px',
                        opacity: 0.04,
                    }}
                />

                {/* Top: Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                >
                    <Link href="/" className="flex items-center gap-3 w-fit">
                        <svg width="38" height="38" viewBox="0 0 94 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                            <rect y="30" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.3"/>
                            <rect x="14" y="15" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.6"/>
                            <rect x="28" width="66" height="66" rx="5" fill="#7E3BE9"/>
                        </svg>
                        <span className="text-2xl font-black text-white tracking-tight">flux</span>
                    </Link>
                </motion.div>

                {/* Center: Value proposition */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.7 }}
                    className="relative z-10"
                >
                    <h2 className="text-[2.6rem] font-black text-white leading-[1.1] mb-4 tracking-tight">
                        Work moves<br />faster here.
                    </h2>
                    <p className="text-[#c4a8f0] text-base leading-relaxed mb-10 max-w-xs">
                        Boards, tasks, and team collaboration — all in one beautiful space.
                    </p>

                    <div className="space-y-4">
                        {[
                            { label: 'Visual boards & backlogs', accent: '#a78bfa' },
                            { label: 'Real-time team collaboration', accent: '#818cf8' },
                            { label: 'Smart priorities & deadlines', accent: '#c084fc' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.label}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.45 + i * 0.1, duration: 0.5 }}
                                className="flex items-center gap-3"
                            >
                                <div
                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                    style={{
                                        backgroundColor: item.accent,
                                        boxShadow: `0 0 10px ${item.accent}99`,
                                    }}
                                />
                                <span className="text-[#d8c5f5] text-sm font-medium">{item.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Bottom: Trust signal */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="text-[#7c5fae] text-xs font-medium tracking-widest uppercase"
                >
                    Trusted by teams worldwide
                </motion.p>
            </div>

            {/* Right Form Panel */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[var(--background)] overflow-y-auto">
                {/* Mobile logo */}
                <div className="md:hidden mb-8">
                    <Link href="/" className="flex items-center gap-2.5">
                        <svg width="30" height="30" viewBox="0 0 94 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                            <rect y="30" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.3"/>
                            <rect x="14" y="15" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.6"/>
                            <rect x="28" width="66" height="66" rx="5" fill="#7E3BE9"/>
                        </svg>
                        <span className="text-2xl font-black text-[var(--foreground)]">flux</span>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="w-full max-w-[400px]"
                >
                    <div className="mb-7">
                        <h1 className="text-[1.625rem] font-bold text-[var(--foreground)] tracking-tight mb-1">
                            Welcome back
                        </h1>
                        <p className="text-[var(--text-secondary)] text-sm">
                            Sign in to continue to your workspace
                        </p>
                    </div>

                    {/* Google Sign In */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--background-subtle)] active:scale-[0.99] transition-all duration-150 mb-5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isGoogleLoading ? (
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        ) : (
                            <FcGoogle className="w-5 h-5" />
                        )}
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="relative mb-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[var(--border-subtle)]" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-[var(--background)] text-[var(--text-secondary)]">
                                or continue with email
                            </span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {info && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm"
                            >
                                {info}
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl bg-[var(--error-bg)] text-[var(--error-primary)] text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-3">
                            <div className="relative">
                                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input !pl-11"
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
                                    className="input !pl-11 !pr-11"
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
                        </div>

                        <div className="flex items-center justify-between">
                            <Link
                                href="/reset-password"
                                className="text-xs text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                            >
                                Forgot password?
                            </Link>
                            <Link
                                href="/verify-email"
                                className="text-xs text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                            >
                                Verify email
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full"
                        >
                            {isLoading ? (
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRightIcon className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[var(--text-secondary)] mt-7">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-[var(--brand-primary)] font-medium hover:underline">
                            Sign up free
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}
