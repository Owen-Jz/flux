'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { changeUserPlan } from '@/actions/admin/change-plan';
import { PlanBadge } from './plan-badge';
import { PLAN_META } from '@/lib/plan-limits';
import type { PlanType, SubscriptionRow } from '@/lib/types/billing';

const PLAN_ORDER: PlanType[] = ['free', 'starter', 'pro', 'enterprise'];

interface PlanChangeModalProps {
    user: SubscriptionRow;
    onClose: () => void;
    onSuccess: () => void;
}

export function PlanChangeModal({ user, onClose, onSuccess }: PlanChangeModalProps) {
    const [selectedPlan, setSelectedPlan] = useState<PlanType>(user.plan);
    const [effectiveDate, setEffectiveDate] = useState<'immediately' | 'end_of_cycle'>('immediately');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const currentMeta = PLAN_META[user.plan];
    const selectedMeta = PLAN_META[selectedPlan];

    const handleSubmit = async () => {
        if (selectedPlan === user.plan) return;
        setLoading(true);
        setError('');

        const result = await changeUserPlan({
            userId: user.id,
            newPlan: selectedPlan,
            effectiveDate,
            reason: reason.trim() || undefined,
        });

        setLoading(false);
        if (result.error) {
            setError(result.error);
        } else {
            onSuccess();
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-50">Change Plan</h2>
                            <p className="text-sm text-zinc-500 mt-0.5">Update {user.name}&apos;s subscription plan</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* User info */}
                    <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-800/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden">
                                {user.image
                                    ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-400">{user.name.charAt(0)}</div>
                                }
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-200">{user.name}</p>
                                <p className="text-xs text-zinc-500">{user.email}</p>
                            </div>
                            <div className="ml-auto">
                                <PlanBadge plan={user.plan} />
                            </div>
                        </div>
                    </div>

                    {/* Plan options */}
                    <div className="p-6 space-y-3">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Select New Plan</p>
                        {PLAN_ORDER.filter(p => p !== user.plan).map((plan) => {
                            const meta = PLAN_META[plan];
                            const isSelected = selectedPlan === plan;
                            const isUpgrade = PLAN_ORDER.indexOf(plan) > PLAN_ORDER.indexOf(user.plan);

                            return (
                                <button
                                    key={plan}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                                        isSelected
                                            ? 'border-violet-500/50 bg-violet-500/10'
                                            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-800/30'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        isSelected ? 'border-violet-500 bg-violet-500' : 'border-zinc-600'
                                    }`}>
                                        {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-zinc-200">{meta.label}</span>
                                            {isUpgrade
                                                ? <span className="text-xs px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded">Upgrade</span>
                                                : <span className="text-xs px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">Downgrade</span>
                                            }
                                        </div>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {meta.projects} projects · {meta.members} members
                                        </p>
                                    </div>
                                    <span className="text-sm font-medium text-zinc-300">{meta.priceDisplay}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Preview */}
                    {selectedPlan !== user.plan && (
                        <div className="px-6 pb-4">
                            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
                                <p className="text-xs text-zinc-500 mb-2">Plan change preview</p>
                                <div className="flex items-center gap-3 text-sm">
                                    <PlanBadge plan={user.plan} />
                                    <span className="text-zinc-600">→</span>
                                    <PlanBadge plan={selectedPlan} />
                                    <span className="text-zinc-500 ml-auto text-xs">
                                        {String(currentMeta.projects)} → {String(selectedMeta.projects)} projects
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Effective date + reason */}
                    <div className="px-6 pb-4 space-y-3">
                        <div>
                            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Effective date</label>
                            <div className="flex gap-3">
                                {(['immediately', 'end_of_cycle'] as const).map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="effectiveDate"
                                            value={opt}
                                            checked={effectiveDate === opt}
                                            onChange={() => setEffectiveDate(opt)}
                                            className="accent-violet-500"
                                        />
                                        <span className="text-sm text-zinc-400">
                                            {opt === 'immediately' ? 'Immediately' : 'End of billing cycle'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Reason (optional)</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Reason for plan change..."
                                rows={2}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 resize-none"
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="px-6 pb-4">
                            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-3">{error}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || selectedPlan === user.plan}
                            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-violet-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Confirm Plan Change'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
