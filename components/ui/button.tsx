'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: `
        bg-[var(--brand-primary)] text-[var(--text-inverse)]
        hover:bg-[var(--brand-primary-hover)]
        active:bg-[var(--brand-primary-active)]
        disabled:bg-[var(--border-default)] disabled:text-[var(--text-tertiary)]
    `,
    secondary: `
        bg-[var(--surface)] text-[var(--text-primary)]
        border border-[var(--border-subtle)]
        hover:bg-[var(--background-subtle)] hover:border-[var(--border-default)]
        active:bg-[var(--border-subtle)]
        disabled:bg-[var(--background-subtle)] disabled:text-[var(--text-tertiary)]
    `,
    ghost: `
        bg-transparent text-[var(--text-secondary)]
        hover:bg-[var(--background-subtle)] hover:text-[var(--text-primary)]
        active:bg-[var(--border-subtle)]
        disabled:text-[var(--text-tertiary)]
    `,
    danger: `
        bg-[var(--error-primary)] text-[var(--text-inverse)]
        hover:opacity-90
        active:opacity-80
        disabled:bg-[var(--border-default)] disabled:text-[var(--text-tertiary)]
    `,
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-base rounded-xl gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            children,
            className = '',
            disabled,
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || isLoading;

        return (
            <motion.button
                ref={ref}
                disabled={isDisabled}
                className={`
                    inline-flex items-center justify-center
                    font-medium transition-all duration-150
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2
                    disabled:cursor-not-allowed disabled:opacity-70
                    ${variantStyles[variant]}
                    ${sizeStyles[size]}
                    ${className}
                `}
                whileHover={!isDisabled ? { scale: 1.02 } : undefined}
                whileTap={!isDisabled ? { scale: 0.98 } : undefined}
                transition={{ duration: 0.15 }}
                {...(props as HTMLMotionProps<'button'>)}
            >
                {isLoading ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : leftIcon ? (
                    <span className="flex-shrink-0">{leftIcon}</span>
                ) : null}
                {children}
                {rightIcon && !isLoading && (
                    <span className="flex-shrink-0">{rightIcon}</span>
                )}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';
