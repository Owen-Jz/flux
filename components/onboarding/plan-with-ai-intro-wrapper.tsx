'use client';

import { useState, useEffect } from 'react';
import { PlanWithAIIntroModal } from './plan-with-ai-intro-modal';
import { PlanWithAIModal } from '@/components/board/plan-with-ai-modal';
import { shouldShowPlanWithAIIntro, markPlanWithAIIntroShown } from '@/actions/onboarding';

interface PlanWithAIIntroWrapperProps {
    workspaceSlug: string;
}

type Phase = 'checking' | 'intro' | 'plan' | 'done';

export function PlanWithAIIntroWrapper({ workspaceSlug }: PlanWithAIIntroWrapperProps) {
    const [phase, setPhase] = useState<Phase>('checking');
    const [description, setDescription] = useState('');
    // True when the plan was carried over from the marketing hero (vs. the generic
    // first-run intro), so the modal can greet the user accordingly.
    const [fromHero, setFromHero] = useState(false);

    useEffect(() => {
        let active = true;

        // 1. A project the visitor typed on the marketing hero takes priority.
        //    Claim it (remove so it's consumed once) and jump straight to a seeded
        //    plan, skipping the generic first-run intro — this is the "picking up
        //    where you left off" moment the signup promised.
        let pending: string | null = null;
        try {
            pending = sessionStorage.getItem('flux_pending_plan');
            if (pending) sessionStorage.removeItem('flux_pending_plan');
        } catch {
            /* sessionStorage unavailable (private mode / blocked) */
        }
        const claimed = pending?.trim() ?? '';
        if (claimed) {
            // Don't also pop the generic intro on a later visit.
            markPlanWithAIIntroShown().catch(() => {});
            // Defer state updates out of the synchronous effect body (avoids the
            // cascading-render the synchronous setState lint rule warns about).
            Promise.resolve().then(() => {
                if (!active) return;
                setDescription(claimed);
                setFromHero(true);
                setPhase('plan');
            });
            return () => {
                active = false;
            };
        }

        // 2. Otherwise fall back to the server-driven first-run intro.
        shouldShowPlanWithAIIntro()
            .then((show) => {
                if (active) setPhase(show ? 'intro' : 'done');
            })
            .catch(() => {
                if (active) setPhase('done');
            });
        return () => {
            active = false;
        };
    }, []);

    const handleSubmit = (desc: string) => {
        setDescription(desc);
        markPlanWithAIIntroShown().catch(console.error);
        setPhase('plan');
    };

    const handleSkip = () => {
        markPlanWithAIIntroShown().catch(console.error);
        setPhase('done');
    };

    if (phase === 'checking' || phase === 'done') {
        return null;
    }

    if (phase === 'plan') {
        return (
            <PlanWithAIModal
                isOpen
                onClose={() => setPhase('done')}
                workspaceSlug={workspaceSlug}
                boardId=""
                boardSlug=""
                boardName=""
                initialStep="input"
                initialDescription={description}
                forceScale="project"
                welcomeBack={fromHero}
            />
        );
    }

    return (
        <PlanWithAIIntroModal
            isOpen
            onSubmit={handleSubmit}
            onSkip={handleSkip}
        />
    );
}
