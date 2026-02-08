'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import InviteMemberModal from './InviteMemberModal';

export default function InviteButton({ slug }: { slug: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-primary text-sm flex items-center gap-2"
            >
                <Mail className="w-4 h-4" />
                Invite Member
            </button>

            {isOpen && <InviteMemberModal slug={slug} onClose={() => setIsOpen(false)} />}
        </>
    );
}
