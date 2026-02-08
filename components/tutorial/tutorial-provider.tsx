'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { updateTutorialProgress, getTutorialProgress } from '@/actions/tutorial';

interface TutorialState {
    hasSeenWelcome: boolean;
    hasSeenDashboard: boolean;
    hasSeenBoard: boolean;
    hasSeenSettings: boolean;
}

export function TutorialProvider() {
    const pathname = usePathname();
    const [progress, setProgress] = useState<TutorialState | null>(null);
    const driverRef = useRef<any>(null);
    const isTourActive = useRef(false);

    // Fetch initial progress
    useEffect(() => {
        const fetchProgress = async () => {
            const data = await getTutorialProgress();
            if (data) setProgress(data);
        };
        fetchProgress();
    }, []);

    // Handle Route Changes and Tours
    useEffect(() => {
        if (!progress || isTourActive.current) return;

        // Clean up previous instance just in case
        if (driverRef.current) {
            driverRef.current.destroy();
            driverRef.current = null;
        }

        let steps: DriveStep[] = [];
        let tourKey: keyof TutorialState = 'hasSeenWelcome'; // Default

        // --- 1. Dashboard Tour ---
        // Runs on workspace root or dashboard if not seen
        // Detects if we are on a workspace root page (e.g. /workspace-slug) but NOT board or settings
        const isWorkspaceRoot = pathname !== '/dashboard' && !pathname.includes('/board/') && !pathname.includes('/settings');

        if (isWorkspaceRoot && !progress.hasSeenDashboard) {
            tourKey = 'hasSeenDashboard';
            steps = [
                {
                    element: '#sidebar-workspace-switcher',
                    popover: {
                        title: 'Workspace Switcher',
                        description: 'Switch between multiple workspaces or create a new one here.',
                        side: 'bottom',
                        align: 'start',
                    },
                },
                {
                    element: '#sidebar-board-list',
                    popover: {
                        title: 'Your Boards',
                        description: 'Access all your project boards here. Organize tasks by department or project.',
                        side: 'right',
                        align: 'start',
                    },
                },
                {
                    element: '#board-create-btn',
                    popover: {
                        title: 'Create Board',
                        description: 'Click here to create a new board and start organizing tasks.',
                        side: 'right',
                        align: 'start',
                    },
                },
                {
                    element: '#sidebar-nav-team',
                    popover: {
                        title: 'Team Management',
                        description: 'Invite members and manage permissions for your workspace.',
                        side: 'right',
                        align: 'start',
                    },
                },
                {
                    element: '#sidebar-nav-archive',
                    popover: {
                        title: 'Archive',
                        description: 'View and restore archived tasks and boards.',
                        side: 'right',
                        align: 'start',
                    },
                },
            ];
        }

        // --- 2. Board Tour ---
        else if (pathname.includes('/board/') && !progress.hasSeenBoard) {
            tourKey = 'hasSeenBoard';
            steps = [
                {
                    element: '#board-header',
                    popover: {
                        title: 'Board Header',
                        description: 'See board details and members here.',
                        side: 'bottom',
                        align: 'start',
                    },
                },
                {
                    element: '.board-column',
                    popover: {
                        title: 'Task Columns',
                        description: 'Tasks are organized in columns. Move them through stages like To Do, In Progress, Done.',
                        side: 'right',
                        align: 'start',
                    },
                },
                {
                    element: '.add-task-btn',
                    popover: {
                        title: 'Add New Task',
                        description: 'Quickly add new tasks to this column.',
                        side: 'bottom',
                        align: 'start',
                    },
                },
            ];
        }

        // --- 3. Settings Tour ---
        else if (pathname.includes('/settings') && !progress.hasSeenSettings) {
            tourKey = 'hasSeenSettings';
            steps = [
                {
                    element: '#settings-general',
                    popover: {
                        title: 'General Settings',
                        description: 'Update workspace name and visibility.',
                        side: 'right',
                        align: 'start',
                    },
                },
                {
                    element: '#settings-danger',
                    popover: {
                        title: 'Danger Zone',
                        description: 'Delete your workspace if needed. Be careful!',
                        side: 'top',
                        align: 'start',
                    },
                },
            ];
        }

        // Start the tour if we have steps
        if (steps.length > 0) {
            isTourActive.current = true;

            driverRef.current = driver({
                showProgress: true,
                steps: steps,
                animate: true,
                allowClose: true,
                overlayColor: 'rgba(0,0,0,0.6)',
                onDestroyStarted: () => {
                    // Update server state on finish/close
                    // Even if closed early, we mark as seen to avoid annoyance.
                    // Or we could check if it was last step.
                    // For now, mark as seen once started/dismissed.
                    isTourActive.current = false;

                    // Optimistic update local
                    setProgress(prev => prev ? ({ ...prev, [tourKey]: true }) : prev);

                    // Update server
                    let stepName: 'dashboard' | 'board' | 'settings' | 'welcome' = 'welcome';
                    if (tourKey === 'hasSeenDashboard') stepName = 'dashboard';
                    if (tourKey === 'hasSeenBoard') stepName = 'board';
                    if (tourKey === 'hasSeenSettings') stepName = 'settings';

                    updateTutorialProgress(stepName);
                },
            });

            // Small delay to ensure rendering
            setTimeout(() => {
                driverRef.current?.drive();
            }, 500);
        }

    }, [pathname, progress]);

    return null;
}
