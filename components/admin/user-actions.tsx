'use client';

import { useState } from 'react';
import { LucideIcon } from '@heroicons/react/24/outline';
import { suspendUser, unsuspendUser, deleteUser, updateUserPlan } from '@/actions/admin/users';
import { toast } from 'sonner';

interface UserActionButtonProps {
    userId: string;
    action: 'view' | 'suspend' | 'delete' | 'change-plan';
    label: string;
    icon: LucideIcon;
    destructive?: boolean;
}

export function UserActionButton({ userId, action, label, icon: Icon, destructive }: UserActionButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            switch (action) {
                case 'suspend': {
                    const confirmed = confirm('Are you sure you want to suspend this user?');
                    if (!confirmed) return;
                    await suspendUser(userId, 'Suspended by admin');
                    toast.success('User suspended');
                    break;
                }
                case 'delete': {
                    const confirmed = confirm('Are you sure you want to permanently delete this user? This action cannot be undone.');
                    if (!confirmed) return;
                    await deleteUser(userId);
                    toast.success('User deleted');
                    break;
                }
                case 'change-plan': {
                    const plans = ['free', 'starter', 'pro', 'enterprise'] as const;
                    const currentPlan = prompt('Enter new plan (free, starter, pro, enterprise):');
                    if (!currentPlan || !plans.includes(currentPlan as typeof plans[number])) {
                        toast.error('Invalid plan');
                        return;
                    }
                    await updateUserPlan(userId, currentPlan as typeof plans[number]);
                    toast.success('User plan updated');
                    break;
                }
            }
            // Refresh the page to show updated data
            window.location.reload();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Action failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                destructive
                    ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--background-subtle)]'
            } disabled:opacity-50`}
        >
            <Icon className="w-4 h-4" />
            {loading ? 'Loading...' : label}
        </button>
    );
}
