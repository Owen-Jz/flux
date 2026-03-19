'use client';

import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, leftIcon, rightIcon, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
                            w-full px-4 py-2.5
                            bg-[var(--surface)]
                            border rounded-xl
                            text-[var(--text-primary)]
                            placeholder:text-[var(--text-tertiary)]
                            transition-all duration-150
                            hover:border-[var(--border-default)]
                            focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20
                            disabled:bg-[var(--background-subtle)] disabled:cursor-not-allowed disabled:opacity-70
                            ${leftIcon ? 'pl-11' : ''}
                            ${rightIcon ? 'pr-11' : ''}
                            ${error ? 'border-[var(--error-primary)] focus:border-[var(--error-primary)] focus:ring-2 focus:ring-[var(--error-primary)]/30' : 'border-[var(--border-subtle)]'}
                            ${className}
                        `}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-1.5 text-sm text-[var(--error-primary)]">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
