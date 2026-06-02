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

    useEffect(() => {
        let active = true;
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
