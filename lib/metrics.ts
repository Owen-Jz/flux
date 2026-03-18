import { Counter, Registry, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();

collectDefaultMetrics({ register });

export const requestsTotal = new Counter({
  name: 'requests_total',
  help: 'Total number of requests',
  labelNames: ['method', 'endpoint', 'status'],
  registers: [register],
});

export const rateLimitedTotal = new Counter({
  name: 'rate_limited_total',
  help: 'Total number of rate-limited requests',
  labelNames: ['user_id', 'limit_type'],
  registers: [register],
});

export const llmErrorsTotal = new Counter({
  name: 'llm_errors_total',
  help: 'Total number of LLM errors',
  labelNames: ['error_type'],
  registers: [register],
});
