// Sentry server-side (Node runtime) initialization.
// No-ops entirely until SENTRY_DSN is set, so it is safe to ship un-configured.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

Sentry.init({
    dsn,
    enabled: !!dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: dsn ? 0.1 : 0,
    debug: false,
});
