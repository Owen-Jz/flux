'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { BoardCreatorStep } from './steps/board-creator-step';
import { InviteFormStep } from './steps/invite-form-step';
import { TaskCreatorStep } from './steps/task-creator-step';
import { DragDemoStep } from './steps/drag-demo-step';
import { ShortcutsStep } from './steps/shortcuts-step';

export type GuidedStepId =
    | 'createdFirstBoard'
    | 'addedFirstTeamMember'
    | 'createdFirstTask'
    | 'completedFirstDragDrop'
    | 'completedTutorial';

interface GuidedSessionModalProps {
    isOpen: boolean;
    stepId: GuidedStepId | null;
    workspaceSlug: string;
    boardSlug?: string;
    onClose: () => void;
    onComplete: () => void;
}

const STEP_META: Record<
    GuidedStepId,
    { title: string }
> = {
    createdFirstBoard: { title: 'Create your first board' },
    addedFirstTeamMember: { title: 'Add team members' },
    createdFirstTask: { title: 'Create your first task' },
    completedFirstDragDrop: { title: 'Try drag-and-drop' },
    completedTutorial: { title: 'Complete the tutorial' },
};

export function GuidedSessionModal({
    isOpen,
    stepId,
    workspaceSlug,
    boardSlug,
    onClose,
    onComplete,
}: GuidedSessionModalProps) {
    const meta = stepId ? STEP_META[stepId] : null;

    const renderStepContent = () => {
        switch (stepId) {
            case 'createdFirstBoard':
                return (
                    <BoardCreatorStep
                        workspaceSlug={workspaceSlug}
                        onComplete={onComplete}
                        onSkip={onClose}
                    />
                );
            case 'addedFirstTeamMember':
                return (
                    <InviteFormStep
                        workspaceSlug={workspaceSlug}
                        onComplete={onComplete}
                        onSkip={onClose}
                    />
                );
            case 'createdFirstTask':
                return (
                    <TaskCreatorStep
                        workspaceSlug={workspaceSlug}
                        boardSlug={boardSlug || ''}
                        onComplete={onComplete}
                        onSkip={onClose}
                    />
                );
            case 'completedFirstDragDrop':
                return (
                    <DragDemoStep
                        onComplete={onComplete}
                        onSkip={onClose}
                    />
                );
            case 'completedTutorial':
                return (
                    <ShortcutsStep
                        onComplete={onComplete}
                        onSkip={onClose}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && stepId && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border-subtle)]">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
                                <h2 className="text-lg font-bold text-[var(--foreground)]">
                                    {meta?.title || 'Guided Session'}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] hover:text-[var(--foreground)] transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-5">
                                {renderStepContent()}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}