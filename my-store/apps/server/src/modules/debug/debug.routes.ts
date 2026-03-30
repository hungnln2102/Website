import express from "express";
import prisma from "@my-store/db";

const router = express.Router();

type CategoryRow = {
  id: number;
  name: string;
  created_at: Date | string | null;
  color: string | null;
};

router.get("/db", async (_req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    res.json({ status: "ok", result });
  } catch (err) {
    console.error("Database test error:", err);
    res.status(500).json({ status: "error", error: String(err) });
  }
});

router.get("/categories-simple", async (_req, res) => {
  try {
    const rows = await prisma.$queryRaw<CategoryRow[]>`
      SELECT c.id, c.name, c.created_at, c.color
      FROM product.category c
      ORDER BY c.id
      LIMIT 10;
    `;
    res.json({ status: "ok", count: rows.length, data: rows });
  } catch (err) {
    console.error("Simple categories test error:", err);
    res.status(500).json({ status: "error", error: String(err) });
  }
});

router.get("/connections", async (_req, res) => {
  try {
    const connections = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
      WHERE datname = current_database();
    `;
    res.json({ status: "ok", data: connections[0] });
  } catch (err) {
    console.error("Check connections error:", err);
    res.status(500).json({ status: "error", error: String(err) });
  }
});

router.get("/locks", async (_req, res) => {
  try {
    const locks = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT 
        l.locktype,
        l.relation::regclass as table_name,
        l.mode,
        l.granted,
        a.usename,
        a.query,
        a.state
      FROM pg_locks l
      LEFT JOIN pg_stat_activity a ON l.pid = a.pid
      WHERE l.relation IS NOT NULL
      ORDER BY l.granted, l.relation
      LIMIT 20;
    `;
    res.json({ status: "ok", count: locks.length, data: locks });
  } catch (err) {
    console.error("Check locks error:", err);
    res.status(500).json({ status: "error", error: String(err) });
  }
});

export default router;
