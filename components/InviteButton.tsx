'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import InviteMemberModal from './InviteMemberModal';

export default function InviteButton({ slug }: { slug: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-primary text-sm"
            >
                <UserPlusIcon className="h-4 w-4" />
                Invite member
            </button>

            <AnimatePresence>
                {isOpen && <InviteMemberModal slug={slug} onClose={() => setIsOpen(false)} />}
            </AnimatePresence>
        </>
    );
}
