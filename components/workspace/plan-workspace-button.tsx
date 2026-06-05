'use client';

import { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { PlanWithAIModal } from '@/components/board/plan-with-ai-modal';

interface PlanWorkspaceButtonProps {
    workspaceSlug: string;
}

/**
 * Workspace-level "Plan with AI" entry. Opens the planner locked to project scale
 * — it generates whole boards (with tasks) into the current workspace, which is
 * the natural action from the board-grid view (vs. the board-level button, which
 * plans tasks into one board). Mirrors the seeded config used by the first-run
 * intro wrapper, so the empty board props are intentional (project scale creates
 * its own boards and doesn't need an existing one).
 */
export function PlanWorkspaceButton({ workspaceSlug }: PlanWorkspaceButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.02] hover:shadow-md hover:shadow-[var(--brand-primary)]/25 active:scale-[0.98]"
            >
                <SparklesIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Plan with AI</span>
                <span className="sm:hidden">Plan</span>
            </button>

            <PlanWithAIModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                workspaceSlug={workspaceSlug}
                boardId=""
                boardSlug=""
                boardName=""
                forceScale="project"
                initialStep="input"
            />
        </>
    );
}
