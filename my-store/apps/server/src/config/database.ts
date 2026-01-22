import { env } from "@my-store/env/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export default pool;
