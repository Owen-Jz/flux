'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EnvelopeIcon, LockClosedIcon, UserIcon, ArrowRightIcon, ArrowPathIcon, CheckIcon, XMarkIcon, EyeIcon, EyeSlashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { FcGoogle } from 'react-icons/fc';
import { signIn, useSession } from 'next-auth/react';
import { usePasswordStrength } from '@/hooks/use-password-strength';
import { strengthColors, strengthLabels } from '@/lib/password-strength';

export default function SignupPage() {
    const router = useRouter();
    const { data: session } = useSession();

    // Redirect if already logged in
    useEffect(() => {
        if (session) {
            router.replace('/dashboard');
        }
    }, [session, router]);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [emailChecking, setEmailChecking] = useState(false);
    const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [pendingPlan, setPendingPlan] = useState<string | null>(null);

    // Surface the project the visitor typed on the marketing hero, so signing up
    // feels like a continuation. The board consumes the stored value after auth.
    useEffect(() => {
        try {
            const p = sessionStorage.getItem('flux_pending_plan');
            if (p && p.trim()) setPendingPlan(p.trim());
        } catch {
            /* sessionStorage unavailable */
        }
    }, []);

    // Get plan from URL query parameter (e.g., /signup?plan=starter)
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const planParam = searchParams.get('plan');

    const { strength, score, requirements } = usePasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedName) {
            setError('Please enter your name');
            return;
        }

        // Validate email format first
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        // Frontend password complexity check (matches API requirements)
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        const complexityTypes = [
            /[A-Z]/.test(password),
            /[a-z]/.test(password),
            /\d/.test(password),
            /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        ].filter(Boolean).length;
        if (complexityTypes < 3) {
            setError('Password must contain at least 3 of: uppercase, lowercase, numbers, symbols');
            return;
        }

        // Check email availability if not already checked
        if (emailAvailable === null) {
            const isAvailable = await checkEmailAvailability(trimmedEmail);
            if (!isAvailable) {
                setError(emailError || 'This email is not available');
                return;
            }
        } else if (emailAvailable === false) {
            setError(emailError || 'This email is not available');
            return;
        }

        // Only forward plan to the API if it's a recognized trial plan
        const validTrialPlans = ['starter', 'pro'];
        const plan = planParam && validTrialPlans.includes(planParam) ? planParam : undefined;

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password, ...(plan && { plan }) }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to create account');
                return;
            }

            // Email requires verification before login is allowed — redirect to OTP page
            router.push(`/verify-email?email=${encodeURIComponent(trimmedEmail)}`);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        try {
            await signIn('google', { callbackUrl: '/onboarding' });
        } finally {
            // Loading will persist until redirect
        }
    };

    const checkEmailAvailability = async (emailValue: string): Promise<boolean> => {
        if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            setEmailError('Please enter a valid email address');
            setEmailAvailable(null);
            return false;
        }

        setEmailChecking(true);
        try {
            const res = await fetch('/api/auth/validate-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailValue }),
            });
            const data = await res.json();
            if (!data.available) {
                setEmailError(data.message || 'This email is not available');
                setEmailAvailable(false);
                return false;
            }
            setEmailError('');
            setEmailAvailable(true);
            return true;
        } catch {
            // On network error, don't block the user — let the signup API be authoritative
            setEmailAvailable(null);
            return true;
        } finally {
            setEmailChecking(false);
        }
    };

    const handleEmailBlur = async () => {
        await checkEmailAvailability(email.trim().toLowerCase());
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
                        Your team&apos;s<br />command center.
                    </h2>
                    <p className="text-[#c4a8f0] text-base leading-relaxed mb-10 max-w-xs">
                        Join thousands of teams shipping faster with Flux — free to start, powerful to scale.
                    </p>

                    <div className="space-y-4">
                        {[
                            { label: 'Free forever on the starter plan', accent: '#a78bfa' },
                            { label: 'No credit card required', accent: '#818cf8' },
                            { label: 'Set up in under 2 minutes', accent: '#c084fc' },
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
                            Create your account
                        </h1>
                        <p className="text-[var(--text-secondary)] text-sm">
                            {planParam === 'pro'
                                ? 'Start your 14-day Pro trial — no credit card required.'
                                : 'Get started for free. No credit card needed.'}
                        </p>
                    </div>

                    {pendingPlan && (
                        <div className="mb-6 rounded-xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 px-4 py-3">
                            <p className="text-xs font-semibold text-[var(--brand-primary)] mb-1 flex items-center gap-1.5">
                                <SparklesIcon className="w-3.5 h-3.5" /> Your plan is saved
                            </p>
                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                                We&apos;ll turn &ldquo;{pendingPlan}&rdquo; into a plan as soon as your workspace is ready.
                            </p>
                        </div>
                    )}

                    {/* Pro trial banner */}
                    {planParam === 'pro' && (
                        <div className="mb-5 p-3.5 rounded-xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20">
                            <p className="text-sm text-[var(--foreground)]">
                                14-day Pro trial included.{' '}
                                <Link href="/pricing" className="text-[var(--brand-primary)] font-medium hover:underline">
                                    See what&apos;s included →
                                </Link>
                            </p>
                        </div>
                    )}

                    {/* Google Sign Up */}
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
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                <input
                                    type="text"
                                    placeholder="Full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input !pl-11"
                                    required
                                />
                            </div>

                            <div>
                                <div className="relative">
                                    <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setEmailAvailable(null);
                                            setEmailError('');
                                        }}
                                        onBlur={handleEmailBlur}
                                        className="input !pl-11"
                                        required
                                    />
                                </div>
                                {emailChecking && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-1.5 mt-1.5 text-xs text-[var(--text-secondary)]"
                                    >
                                        <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                                        <span>Checking availability...</span>
                                    </motion.div>
                                )}
                                {!emailChecking && (emailError || emailAvailable === true) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex items-center gap-1.5 mt-1.5 text-xs ${
                                            emailAvailable ? 'text-[var(--success-primary)]' : 'text-[var(--error-primary)]'
                                        }`}
                                    >
                                        {emailAvailable ? (
                                            <CheckIcon className="w-3.5 h-3.5" />
                                        ) : (
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                        )}
                                        <span>{emailAvailable ? 'Email available' : emailError}</span>
                                    </motion.div>
                                )}
                            </div>

                            <div>
                                <div className="relative">
                                    <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input !pl-11 !pr-11"
                                        minLength={8}
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

                                {password && (
                                    <div className="mt-2 space-y-1.5">
                                        <div className="flex gap-1">
                                            {[0, 1, 2, 3].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full transition-colors ${
                                                        i <= score ? strengthColors[strength] : 'bg-[var(--border-subtle)]'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className={strength !== 'empty' ? strengthColors[strength].replace('bg-', 'text-') : 'text-[var(--text-tertiary)]'}>
                                                {strengthLabels[strength]}
                                            </span>
                                            <span className="text-[var(--text-secondary)]">
                                                {password.length < 8
                                                    ? '8+ characters'
                                                    : score < 3
                                                    ? 'Add uppercase, number, or symbol'
                                                    : score === 3
                                                    ? 'Good password'
                                                    : 'Strong password'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
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
                                    Create account
                                    <ArrowRightIcon className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-[var(--text-tertiary)] leading-relaxed">
                            By creating an account, you agree to our{' '}
                            <Link href="/terms" className="hover:text-[var(--brand-primary)] underline underline-offset-2 transition-colors">Terms</Link>
                            {' '}and{' '}
                            <Link href="/privacy" className="hover:text-[var(--brand-primary)] underline underline-offset-2 transition-colors">Privacy Policy</Link>.
                        </p>
                    </form>

                    <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[var(--brand-primary)] font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
