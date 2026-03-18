type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  action?: string;
  duration_ms?: number;
  [key: string]: unknown;
}

export function createLogger(context: {
  requestId?: string;
  userId?: string;
  action?: string;
}) {
  return {
    info: (message: string, extra?: Record<string, unknown>) => {
      log('info', message, { ...context, ...extra });
    },
    warn: (message: string, extra?: Record<string, unknown>) => {
      log('warn', message, { ...context, ...extra });
    },
    error: (message: string, extra?: Record<string, unknown>) => {
      log('error', message, { ...context, ...extra });
    },
    debug: (message: string, extra?: Record<string, unknown>) => {
      log('debug', message, { ...context, ...extra });
    },
  };
}

function log(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...extra,
  };
  console.log(JSON.stringify(entry));
}
