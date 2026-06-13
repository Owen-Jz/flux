'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { driver, type DriveStep, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tour.css';
import { updateTutorialProgress, getTutorialProgress } from '@/actions/tutorial';
import { updateOnboardingProgress } from '@/actions/onboarding';

/**
 * Flux product tour.
 *
 * A single driver.js-based guided tour for the whole app. It replaces the two
 * older systems (the route-based driver tour AND the hand-rolled board
 * contextual tooltips) that used to run at the same time on the board page and
 * fought each other for the screen.
 *
 * What makes this one safe:
 *  - It never starts while a modal/dialog is open (the old tooltips drew on top
 *    of dialogs and intercepted the first click). It waits for the screen to be
 *    clear, then runs.
 *  - It drops any step whose target isn't actually on screen — so an empty
 *    board (no task cards) or a mobile layout (sidebar hidden behind the
 *    hamburger) never gets a spotlight pointing at nothing.
 *  - It respects `prefers-reduced-motion`.
 *  - It can be restarted on demand: dispatch `window` event `flux:start-tour`
 *    (or call `startFluxTour()`), which replays the current page's tour.
 */

type TourKey = 'hasSeenDashboard' | 'hasSeenBoard' | 'hasSeenSettings';
type StepName = 'dashboard' | 'board' | 'settings';

interface TutorialState {
    hasSeenWelcome: boolean;
    hasSeenDashboard: boolean;
    hasSeenBoard: boolean;
    hasSeenSettings: boolean;
}

const STEP_NAME: Record<TourKey, StepName> = {
    hasSeenDashboard: 'dashboard',
    hasSeenBoard: 'board',
    hasSeenSettings: 'settings',
};

/** Custom event other components can dispatch to (re)start the tour. */
export const START_TOUR_EVENT = 'flux:start-tour';

/** Programmatic entry point — wire this to a "Take a tour" / help menu item. */
export function startFluxTour() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(START_TOUR_EVENT));
    }
}

/** Is an element present AND actually rendered (not display:none / zero-size)? */
function isVisible(selector: string): boolean {
    if (typeof document === 'undefined') return false;
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

/**
 * Is a modal/dialog currently open? Flux modals use one of two conventions:
 * an explicit `role="dialog"`/`aria-modal`, or a Tailwind `fixed inset-0`
 * overlay at z-index >= 40. We treat either as "screen is busy — don't start".
 */
function isModalOpen(): boolean {
    if (typeof document === 'undefined') return false;
    if (document.querySelector('[role="dialog"], [aria-modal="true"]')) return true;

    const overlays = document.querySelectorAll<HTMLElement>('.fixed.inset-0');
    for (const el of Array.from(overlays)) {
        if (el.className.includes('driver-')) continue; // our own overlay
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const z = parseInt(style.zIndex || '0', 10);
        if (z >= 40) return true;
    }
    return false;
}

function dashboardSteps(): DriveStep[] {
    return [
        {
            element: '#sidebar-workspace-switcher',
            popover: {
                title: 'Switch workspaces',
                description: 'Jump between workspaces or spin up a new one from here.',
                side: 'bottom',
                align: 'start',
            },
        },
        {
            element: '#sidebar-board-list',
            popover: {
                title: 'Your boards',
                description: 'Every project board lives here. Organise work by client, team, or goal.',
                side: 'right',
                align: 'start',
            },
        },
        {
            element: '#board-create-btn',
            popover: {
                title: 'Create a board',
                description: 'Start a new board — or describe your project and let Flux plan it with AI.',
                side: 'right',
                align: 'start',
            },
        },
        {
            element: '#sidebar-nav-team',
            popover: {
                title: 'Invite your team',
                description: 'Add teammates and set who can view or edit each board.',
                side: 'right',
                align: 'start',
            },
        },
        {
            element: '#sidebar-nav-archive',
            popover: {
                title: 'Archive',
                description: 'Closed something too soon? Restore archived tasks and boards here.',
                side: 'right',
                align: 'start',
            },
        },
    ];
}

function boardSteps(): DriveStep[] {
    return [
        {
            element: '#board-header',
            popover: {
                title: 'Your board',
                description: 'Board name, members, and view switches live up here.',
                side: 'bottom',
                align: 'start',
            },
        },
        {
            element: '.board-column',
            popover: {
                title: 'Columns are stages',
                description: 'Tasks flow left to right — Backlog, To Do, In Progress, Review, Done.',
                side: 'right',
                align: 'start',
            },
        },
        {
            element: '.task-card-drag-handle',
            popover: {
                title: 'Drag to move',
                description: 'Grab a task and drop it in another column to change its status.',
                side: 'right',
                align: 'start',
            },
        },
        {
            element: '.task-card-assignees',
            popover: {
                title: 'Assign teammates',
                description: 'Click the assignee area on any task to add or remove people.',
                side: 'top',
                align: 'start',
            },
        },
        {
            element: '.add-task-btn',
            popover: {
                title: 'Add a task',
                description: 'Use the + button to drop a new task straight into a column.',
                side: 'bottom',
                align: 'start',
            },
        },
    ];
}

function settingsSteps(): DriveStep[] {
    return [
        {
            element: '#settings-general',
            popover: {
                title: 'Workspace settings',
                description: 'Rename the workspace and control who can see it.',
                side: 'right',
                align: 'start',
            },
        },
        {
            element: '#settings-danger',
            popover: {
                title: 'Danger zone',
                description: 'Permanently delete this workspace and all of its data.',
                side: 'top',
                align: 'start',
            },
        },
    ];
}

/** Resolve which tour applies to the current route. */
function resolveTour(pathname: string): { key: TourKey; steps: DriveStep[] } | null {
    if (pathname.includes('/board/')) {
        return { key: 'hasSeenBoard', steps: boardSteps() };
    }
    if (pathname.includes('/settings')) {
        return { key: 'hasSeenSettings', steps: settingsSteps() };
    }
    // Workspace root (e.g. /acme) — but not the global /dashboard chrome.
    if (pathname !== '/dashboard') {
        return { key: 'hasSeenDashboard', steps: dashboardSteps() };
    }
    return null;
}

export function TutorialProvider() {
    const pathname = usePathname();
    const progressRef = useRef<TutorialState | null>(null);
    const driverRef = useRef<Driver | null>(null);
    const startTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const waitTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const runningRef = useRef(false);

    // Load saved progress once.
    useEffect(() => {
        let active = true;
        getTutorialProgress().then((data) => {
            if (active && data) progressRef.current = data;
        });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const clearTimers = () => {
            if (startTimerRef.current) clearTimeout(startTimerRef.current);
            if (waitTimerRef.current) clearInterval(waitTimerRef.current);
        };

        /**
         * @param force when true (manual restart), ignore the "already seen" flag.
         */
        const launch = (force: boolean) => {
            if (runningRef.current) return;

            const tour = resolveTour(pathname);
            if (!tour) return;
            if (!force && progressRef.current?.[tour.key]) return;

            // Final guard: a modal may have mounted during the settle delay
            // (e.g. the "What are you working on?" AI-plan prompt fetches first,
            // then appears). If so, go back to waiting instead of drawing over it.
            if (isModalOpen()) {
                launchWhenClear(force);
                return;
            }

            // Drop steps whose target isn't on screen (empty board, hidden
            // mobile sidebar, etc.) so the spotlight never lands on nothing.
            const steps = tour.steps.filter((s) => typeof s.element === 'string' && isVisible(s.element));
            if (steps.length === 0) return;

            const reduceMotion =
                typeof window !== 'undefined' &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            // Tear down any prior instance before starting a fresh one.
            driverRef.current?.destroy();
            runningRef.current = true;
            document.body.classList.add('flux-tour-active');

            const obj = driver({
                showProgress: true,
                progressText: '{{current}} of {{total}}',
                steps,
                animate: !reduceMotion,
                allowClose: true,
                overlayColor: '#000000',
                overlayOpacity: 0.6,
                stagePadding: 6,
                stageRadius: 10,
                smoothScroll: true,
                popoverClass: 'flux-tour',
                nextBtnText: 'Next',
                prevBtnText: 'Back',
                doneBtnText: 'Got it',
                onDestroyStarted: () => {
                    // Mark seen once dismissed (even early) so it doesn't nag,
                    // then tear down. Manual restarts re-show it regardless.
                    runningRef.current = false;
                    document.body.classList.remove('flux-tour-active');
                    if (progressRef.current) {
                        progressRef.current = { ...progressRef.current, [tour.key]: true };
                    }
                    updateTutorialProgress(STEP_NAME[tour.key]);
                    updateOnboardingProgress('completedTutorial');
                    driverRef.current?.destroy();
                },
            });

            driverRef.current = obj;
            obj.drive();
        };

        /** Wait until no modal is open, then launch. Polls briefly, then gives up. */
        const launchWhenClear = (force: boolean) => {
            clearTimers();
            const tour = resolveTour(pathname);
            if (!tour) return;
            if (!force && progressRef.current?.[tour.key]) return;

            let waited = 0;
            let clearStreak = 0;
            const tryStart = () => {
                if (!isModalOpen()) {
                    // Require the screen to stay clear across two consecutive
                    // polls (~1s) before launching, so a modal that mounts a beat
                    // after its data fetch (e.g. the AI-plan prompt) isn't missed.
                    clearStreak += 1;
                    if (clearStreak >= 2) {
                        if (waitTimerRef.current) clearInterval(waitTimerRef.current);
                        startTimerRef.current = setTimeout(() => launch(force), 400);
                    }
                    return;
                }
                clearStreak = 0;
                waited += 500;
                if (waited >= 60000) {
                    // Modal never closed within a minute — don't badger the user.
                    if (waitTimerRef.current) clearInterval(waitTimerRef.current);
                }
            };
            // First check after the route paints + the first-run modals have had
            // a chance to mount, then poll.
            startTimerRef.current = setTimeout(tryStart, 900);
            waitTimerRef.current = setInterval(tryStart, 500);
        };

        // Auto-run for the current route (first visit only).
        launchWhenClear(false);

        // Manual restart via custom event (help menu, "Take a tour" button).
        const onRestart = () => launchWhenClear(true);
        window.addEventListener(START_TOUR_EVENT, onRestart);

        return () => {
            clearTimers();
            window.removeEventListener(START_TOUR_EVENT, onRestart);
            driverRef.current?.destroy();
            driverRef.current = null;
            runningRef.current = false;
            document.body.classList.remove('flux-tour-active');
        };
    }, [pathname]);

    return null;
}
