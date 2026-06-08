// Sentry browser initialization. Uses the public DSN so it can run client-side.
// No-ops entirely until NEXT_PUBLIC_SENTRY_DSN is set.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
    dsn,
    enabled: !!dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: dsn ? 0.1 : 0,
    debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
