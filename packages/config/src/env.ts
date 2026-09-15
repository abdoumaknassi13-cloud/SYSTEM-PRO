import { z } from "zod";

/**
 * TASK-01 environment schema.
 * SECURITY: fail fast on missing/invalid config; never fall back to
 * insecure defaults; never log secret values.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  WEB_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  POSTGRES_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (v) => v.startsWith("postgresql://") || v.startsWith("postgres://"),
      "DATABASE_URL must be a postgresql:// connection string",
    ),
  APP_VERSION: z.string().min(1).default("0.1.0"),
  GIT_COMMIT: z.string().min(1).default("unknown"),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function loadEnv(input: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = EnvSchema.safeParse(input);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return parsed.data;
}
