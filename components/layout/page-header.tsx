'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { ArrowRightOnRectangleIcon, UserIcon, Cog6ToothIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { ThemeToggle } from '../theme-toggle';

interface PageHeaderProps {
  activeLink?: string;
}

export function PageHeader({ activeLink }: PageHeaderProps) {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  const navLinks = [
    { label: 'Features', href: '/features' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Pricing', href: '/pricing' },
  ];

  const isLoggedIn = status === 'authenticated' && session?.user;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-3 group" aria-label="Flux home">
            <span className="inline-flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[var(--brand-primary)]">
              <img
                src="/icon.svg"
                alt=""
                className="w-6 h-6 lg:w-7 lg:h-7 text-white"
              />
            </span>
            <span className="font-extrabold text-2xl tracking-tight text-[var(--text-primary)]">flux</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  activeLink === link.href
                    ? 'text-[var(--brand-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--brand-primary)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-[var(--background-subtle)] transition-colors"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'Profile'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-[var(--text-inverse)] text-sm font-bold">
                      {session.user.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <ChevronDownIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                </button>

                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface)] rounded-xl shadow-xl border border-[var(--border-subtle)] py-2 z-50">
                      <div className="px-4 py-2 border-b border-[var(--border-subtle)]">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {session.user.name}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] truncate">
                          {session.user.email}
                        </p>
                      </div>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <UserIcon className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          signOut();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--error-primary)] hover:bg-[var(--error-bg)] transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-xl text-sm font-semibold hover:opacity-90 transition-colors"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}