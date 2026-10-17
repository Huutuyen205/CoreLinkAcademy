import { z } from 'zod';

/**
 * RFC 7807 Problem Details
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: {
      status: 'up' | 'down';
      latencyMs?: number;
      error?: string;
    };
    redis: {
      status: 'up' | 'down' | 'mock';
      latencyMs?: number;
    };
    storage: {
      status: 'up' | 'down' | 'mock';
    };
  };
  version: string;
}

export const HealthCheckResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  timestamp: z.string(),
  services: z.object({
    database: z.object({
      status: z.enum(['up', 'down']),
      latencyMs: z.number().optional(),
      error: z.string().optional()
    }),
    redis: z.object({
      status: z.enum(['up', 'down', 'mock']),
      latencyMs: z.number().optional()
    }),
    storage: z.object({
      status: z.enum(['up', 'down', 'mock'])
    })
  }),
  version: z.string()
});
