import { env } from "@my-store/env/server";
import { Pool } from "pg";

/** PostgreSQL connection pool. Schema ref: docs/database.md */
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default pool;
