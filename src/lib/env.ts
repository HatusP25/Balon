import { z } from "zod";

const Schema = z.object({
  ADMIN_PASSWORD: z.string().min(1, "ADMIN_PASSWORD is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 chars"),
  DATABASE_URL: z.string().url(),
  DATA_DIR: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = Schema.parse(process.env);
export type Env = z.infer<typeof Schema>;
