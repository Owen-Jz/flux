'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { ThemeToggle } from '@/components/theme-toggle';

const navLinks = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
];

function FluxLogo() {
    return (
        <Link href="/" className="flex items-center gap-2.5" aria-label="Flux home">
            <svg width="28" height="28" viewBox="0 0 94 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <rect y="30" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.3" />
                <rect x="14" y="15" width="66" height="66" rx="5" fill="#7E3BE9" fillOpacity="0.6" />
                <rect x="28" width="66" height="66" rx="5" fill="#7E3BE9" />
            </svg>
            <span className="font-black text-xl tracking-tight text-[var(--text-primary)]">flux</span>
        </Link>
    );
}

export function LandingNavbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: session, status } = useSession();
    const isLoggedIn = status === 'authenticated' && session?.user;

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMobileMenuOpen]);

    const SPRING = { duration: 0.5, ease: [0.16, 1, 0.3, 1] } as const;

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50" aria-label="Main navigation">
                {/* Outer container — animates max-width + margin to create the pill shrink */}
                <motion.div
                    animate={
                        isScrolled
                            ? { maxWidth: '52rem', marginTop: '14px', paddingLeft: '6px', paddingRight: '6px' }
                            : { maxWidth: '80rem', marginTop: '0px', paddingLeft: '32px', paddingRight: '32px' }
                    }
                    transition={SPRING}
                    style={{ marginLeft: 'auto', marginRight: 'auto' }}
                >
                    {/* Inner pill — animates height, padding, border-radius */}
                    <motion.div
                        animate={
                            isScrolled
                                ? { height: '64px', paddingLeft: '40px', paddingRight: '40px', borderRadius: '9999px' }
                                : { height: '72px', paddingLeft: '0px', paddingRight: '0px', borderRadius: '0px' }
                        }
                        transition={SPRING}
                        className={`flex items-center justify-between transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ${
                            isScrolled
                                ? 'bg-[var(--background)]/90 backdrop-blur-xl border border-[var(--border-subtle)] shadow-xl shadow-black/[0.08] dark:shadow-black/40'
                                : ''
                        }`}
                    >
                        <FluxLogo />

                        {/* Desktop nav links */}
                        <div className="hidden lg:flex items-center gap-7">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>

                        {/* Right side actions */}
                        <div className="flex items-center gap-2">
                            <div className="hidden lg:block">
                                <ThemeToggle />
                            </div>

                            {isLoggedIn ? (
                                <Link
                                    href="/dashboard"
                                    className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                                >
                                    Dashboard →
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="hidden sm:block px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                                    >
                                        Get started free
                                    </Link>
                                </>
                            )}

                            {/* Mobile hamburger */}
                            <button
                                className="lg:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                                onClick={() => setIsMobileMenuOpen(true)}
                                aria-label="Open menu"
                                aria-expanded={isMobileMenuOpen}
                            >
                                <Bars3Icon className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </nav>

            {/* Mobile full-screen overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        key="mobile-menu"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed inset-0 z-[60] bg-[var(--background)] lg:hidden flex flex-col"
                        id="mobile-menu"
                        aria-label="Mobile navigation"
                    >
                        {/* Top bar */}
                        <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--border-subtle)] flex-shrink-0">
                            <FluxLogo />
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                aria-label="Close menu"
                                className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Nav links — vertically centered */}
                        <div className="flex-1 flex flex-col justify-center px-8">
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: {},
                                    visible: {
                                        transition: { staggerChildren: 0.07, delayChildren: 0.05 },
                                    },
                                }}
                                className="space-y-1"
                            >
                                {navLinks.map((link) => (
                                    <motion.a
                                        key={link.href}
                                        href={link.href}
                                        variants={{
                                            hidden: { opacity: 0, x: -20 },
                                            visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' } },
                                        }}
                                        className="block py-3 text-4xl font-black tracking-tight text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </motion.a>
                                ))}
                            </motion.div>
                        </div>

                        {/* Bottom actions */}
                        <div className="px-8 pb-10 pt-6 border-t border-[var(--border-subtle)] space-y-3">
                            <div className="flex items-center justify-between mb-5">
                                <span className="text-sm font-medium text-[var(--text-secondary)]">Appearance</span>
                                <ThemeToggle />
                            </div>

                            {isLoggedIn ? (
                                <Link
                                    href="/dashboard"
                                    className="flex items-center justify-center w-full py-3.5 bg-[var(--brand-primary)] text-white rounded-2xl text-base font-bold hover:opacity-90 transition-opacity"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Go to Dashboard →
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/signup"
                                        className="flex items-center justify-center w-full py-3.5 bg-[var(--brand-primary)] text-white rounded-2xl text-base font-bold hover:opacity-90 transition-opacity"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Get started free
                                    </Link>
                                    <Link
                                        href="/login"
                                        className="flex items-center justify-center w-full py-3.5 border border-[var(--border-default)] text-[var(--text-primary)] rounded-2xl text-base font-semibold hover:bg-[var(--surface)] transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Log in
                                    </Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
