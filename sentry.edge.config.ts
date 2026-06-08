// Sentry edge-runtime initialization (middleware, edge routes).
// No-ops entirely until SENTRY_DSN is set.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

Sentry.init({
    dsn,
    enabled: !!dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: dsn ? 0.1 : 0,
    debug: false,
});
