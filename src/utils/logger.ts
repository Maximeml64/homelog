// src/utils/logger.ts
// Logger minimaliste — remplace les try/catch silencieux.
// Aujourd'hui : forward vers console.{warn,error}. Demain : Sentry/Bugsnag.

type LogLevel = 'info' | 'warn' | 'error';

function format(scope: string, message: string): string {
  return `[${scope}] ${message}`;
}

export const logger = {
  info(scope: string, message: string, data?: unknown) {
    console.log(format(scope, message), data ?? '');
  },
  warn(scope: string, message: string, data?: unknown) {
    console.warn(format(scope, message), data ?? '');
  },
  error(scope: string, message: string, error?: unknown) {
    console.error(format(scope, message), error ?? '');
  },
};

export type { LogLevel };
