'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailParam = searchParams.get('email') || '';
    const errorParam = searchParams.get('error');

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [email, setEmail] = useState(emailParam);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState(
        errorParam === 'invalid-or-expired'
            ? 'That link has expired. Enter your email to receive a new code.'
            : errorParam === 'missing-params'
            ? 'Invalid verification link. Please request a new code.'
            : ''
    );
    const [success, setSuccess] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleOtpChange = (index: number, value: string) => {
        // Allow paste of full 6-digit code
        if (value.length === 6 && /^\d{6}$/.test(value)) {
            const digits = value.split('');
            setOtp(digits);
            inputRefs.current[5]?.focus();
            return;
        }

        const digit = value.replace(/\D/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) {
            setError('Please enter the full 6-digit code.');
            return;
        }
        if (!email) {
            setError('Please enter your email address.');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase().trim(), otp: code }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Verification failed. Please try again.');
                return;
            }

            setSuccess('Email verified! Redirecting to login…');
            setTimeout(() => router.push('/login?verified=true'), 1500);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            setError('Please enter your email address first.');
            return;
        }
        setIsResending(true);
        setError('');

        try {
            await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase().trim() }),
            });
            setSuccess('A new code has been sent to your inbox.');
            setResendCooldown(60);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch {
            setError('Failed to resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-8">
                    <svg width="32" height="32" viewBox="0 0 94 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect y="30" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.3"/>
                        <rect x="14" y="15" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.6"/>
                        <rect x="28" width="66" height="66" rx="5" fill="#7E3BE9"/>
                    </svg>
                    <span className="text-2xl font-black text-[var(--foreground)]">flux</span>
                </Link>

                <div className="card p-8">
                    {/* Icon */}
                    <div className="flex justify-center mb-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-400 flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-[var(--foreground)] text-center mb-1">
                        Check your email
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
                        We sent a 6-digit code to{' '}
                        <strong className="text-[var(--foreground)]">{email || 'your email'}</strong>.
                        Enter it below to verify your account.
                    </p>

                    <form onSubmit={handleVerify} className="space-y-5">
                        {/* Email field (if not pre-filled) */}
                        {!emailParam && (
                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="input w-full"
                                    required
                                />
                            </div>
                        )}

                        {/* OTP boxes */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-3 text-center">
                                Verification code
                            </label>
                            <div className="flex gap-3 justify-center">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={el => { inputRefs.current[i] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={digit}
                                        onChange={e => handleOtpChange(i, e.target.value)}
                                        onKeyDown={e => handleKeyDown(i, e)}
                                        onPaste={e => {
                                            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                                            if (pasted) handleOtpChange(i, pasted);
                                        }}
                                        className="w-11 h-14 text-center text-xl font-bold rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Feedback */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.p
                                    key="error"
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-sm text-red-500 text-center"
                                >
                                    {error}
                                </motion.p>
                            )}
                            {success && (
                                <motion.p
                                    key="success"
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-sm text-emerald-500 text-center font-medium"
                                >
                                    {success}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={isVerifying || otp.join('').length !== 6}
                            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isVerifying ? 'Verifying…' : 'Verify email'}
                        </button>
                    </form>

                    <div className="mt-5 text-center space-y-2">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Didn&apos;t receive a code?{' '}
                            <button
                                onClick={handleResend}
                                disabled={isResending || resendCooldown > 0}
                                className="font-medium text-[var(--brand-primary)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isResending
                                    ? 'Sending…'
                                    : resendCooldown > 0
                                    ? `Resend in ${resendCooldown}s`
                                    : 'Resend code'}
                            </button>
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Already verified?{' '}
                            <Link href="/login" className="font-medium text-[var(--brand-primary)] hover:underline">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense>
            <VerifyEmailContent />
        </Suspense>
    );
}
