import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const cwd = process.cwd();
const envCandidates = [
  path.join(cwd, ".env"),
  path.join(cwd, "apps", "server", ".env"),
  path.join(cwd, "my-store", "apps", "server", ".env"),
];
const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
