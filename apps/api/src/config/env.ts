/**
 * Environment configuration and validation
 * Centralized, typed env parsing with fail-fast checks for production
 */
import dotenv from 'dotenv';
dotenv.config();

import { z } from 'zod';

function toBool(val: unknown, defaultVal = false): boolean {
  if (val === undefined || val === null) return defaultVal;
  const s = String(val).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'off'].includes(s)) return false;
  return defaultVal;
}

function parseCsv(input?: string, defaults: string[] = []): string[] {
  if (!input) return defaults;
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  PORT: z.coerce.number().default(5000),
  HOST: z.string().default('0.0.0.0'),
  TRUST_PROXY: z.string().optional(),

  // Database
  MONGODB_URI: z.string().default('mongodb://localhost:27017/uae-work-hub'),
  MONGODB_TEST_URI: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_EMAIL_SECRET: z.string().optional(),
  JWT_RESET_SECRET: z.string().optional(),

  // UAE Pass
  UAE_PASS_CLIENT_ID: z.string().optional(),
  UAE_PASS_CLIENT_SECRET: z.string().optional(),
  UAE_PASS_REDIRECT_URI: z.string().optional(),
  UAE_PASS_API_URL: z.string().default('https://uaepass.gov.ae/api'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_MODE: z.enum(['prod', 'dev', 'none']).optional(),

  // File/Storage
  MAX_FILE_SIZE: z.string().optional(),
  UPLOAD_DIR: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // AI Service
  AI_SERVICE_URL: z.string().optional(),
  AI_SERVICE_API_KEY: z.string().optional(),

  // Security/CORS
  CORS_ORIGIN: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  REQUIRE_ORIGIN_IN_PROD: z.string().optional(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().optional(),
  RATE_LIMIT_MAX: z.coerce.number().optional(),

  // Logging
  LOG_LEVEL: z.string().optional(),
  LOG_FORMAT: z.string().optional(),

  // Cultural
  DEFAULT_TIMEZONE: z.string().optional(),
  DEFAULT_LANGUAGE: z.string().optional(),
  HIJRI_CALENDAR_ENABLED: z.string().optional(),

  // Misc
  FRONTEND_URL: z.string().optional(),
  ENABLE_PROMETHEUS_METRICS: z.string().optional(),
  ENABLE_TRACING: z.string().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().optional(),
  OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),
  REQUIRE_REDIS_READY: z.string().optional(),
  APP_VERSION: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),
});

const raw = EnvSchema.parse(process.env);

// Resolve derived/defaulted fields
const NODE_ENV = raw.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const REDIS_MODE = raw.REDIS_MODE ?? (IS_PROD ? 'prod' : 'dev');
const ALLOWED_ORIGINS_ARRAY = parseCsv(raw.ALLOWED_ORIGINS, [
  'http://localhost:3000',
  'http://localhost:5173',
]);

// Fail-fast checks for production
if (IS_PROD) {
  const problems: string[] = [];

  if (!raw.JWT_SECRET || raw.JWT_SECRET.includes('your-super-secure')) {
    problems.push('JWT_SECRET must be set to a strong secret in production.');
  }
  if (!raw.JWT_REFRESH_SECRET || raw.JWT_REFRESH_SECRET.includes('your-refresh-token-secret')) {
    problems.push('JWT_REFRESH_SECRET must be set in production.');
  }
  if (!raw.MONGODB_URI) {
    problems.push('MONGODB_URI must be set in production.');
  }
  if (REDIS_MODE === 'none') {
    problems.push('REDIS_MODE=none is not allowed in production. Use prod or dev.');
  }

  if (problems.length > 0) {
    const message = `Environment validation failed:\n - ${problems.join('\n - ')}`;
    throw new Error(message);
  }
}

export const env = {
  ...raw,
  NODE_ENV,
  IS_PROD,
  REDIS_MODE,
  ALLOWED_ORIGINS_ARRAY,
  ENABLE_PROMETHEUS_METRICS_BOOL: toBool(raw.ENABLE_PROMETHEUS_METRICS, false),
  ENABLE_TRACING_BOOL: toBool(raw.ENABLE_TRACING, false),
  REQUIRE_REDIS_READY_BOOL: toBool(raw.REQUIRE_REDIS_READY, IS_PROD),
  REQUIRE_ORIGIN_IN_PROD_BOOL: toBool(raw.REQUIRE_ORIGIN_IN_PROD, IS_PROD),
};

export function computeTrustProxyValue(): any {
  const trustProxyEnv = raw.TRUST_PROXY ?? (IS_PROD ? '1' : '0');
  if (trustProxyEnv === 'true') return true;
  if (trustProxyEnv === 'false') return false;
  const num = Number(trustProxyEnv);
  if (!Number.isNaN(num)) return num;
  return true;
}
