'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { ThemeProvider } from './theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider>
                {children}
                <Toaster
                    position="bottom-right"
                    richColors
                    closeButton
                    theme="system"
                />
            </ThemeProvider>
        </SessionProvider>
    );
}
