import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={`animate-shimmer rounded-md bg-[var(--surface)] ${className || ''}`}
            {...props}
        />
    );
}
