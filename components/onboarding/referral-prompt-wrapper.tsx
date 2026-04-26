'use client';

import { ReferralPrompt } from '@/components/onboarding/referral-prompt';

export function ReferralPromptWrapper({ workspaceSlug }: { workspaceSlug: string }) {
    return <ReferralPrompt workspaceSlug={workspaceSlug} />;
}