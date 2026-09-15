import { z } from "zod";

/**
 * TASK-01 shared contracts: operational endpoints only.
 * Domain contracts (orders, products, ...) arrive with their tasks.
 * Single source of truth for shape; API and web must conform to these.
 */
export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  version: z.string().min(1),
  commit: z.string().min(1),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ReadyResponseSchema = z.object({
  status: z.literal("ready"),
  db: z.literal("up"),
});

export type ReadyResponse = z.infer<typeof ReadyResponseSchema>;

export const NotReadyResponseSchema = z.object({
  status: z.literal("not-ready"),
  db: z.literal("down"),
  message: z.string().min(1),
});

export type NotReadyResponse = z.infer<typeof NotReadyResponseSchema>;
