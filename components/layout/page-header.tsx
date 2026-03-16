'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

interface PageHeaderProps {
  activeLink?: string;
}

export function PageHeader({ activeLink }: PageHeaderProps) {
  const navLinks = [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Docs', href: '/docs' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-3 group" aria-label="Flux home">
            <img
              src="/icon.svg"
              alt=""
              className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl transform group-hover:scale-105 transition-transform"
            />
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">flux</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  activeLink === link.href
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:block text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}