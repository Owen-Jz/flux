'use client';

import { useState } from 'react';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import CreateWorkspaceModal from '@/components/CreateWorkspaceModal';

export default function NewWorkspaceButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary inline-flex items-center gap-2 shadow-lg shadow-[var(--flux-brand-primary)]/20 hover:shadow-xl hover:shadow-[var(--flux-brand-primary)]/30 transition-shadow"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Workspace
            </button>

            {isModalOpen && (
                <CreateWorkspaceModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={(slug) => {
                        // Redirect happens inside the modal via router.push
                    }}
                />
            )}
        </>
    );
}