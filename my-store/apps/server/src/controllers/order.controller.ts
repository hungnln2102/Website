/**
 * Order API handlers – notify-done (Hoàn thành) và cancel (Hủy Đơn) từ Bot Telegram.
 */
import type { Request, Response } from "express";
import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";
import { updateOrderDone, cancelOrder } from "../services/order-list.service";

function getApiKey(req: Request): string | undefined {
  const header = req.headers["x-api-key"];
  if (typeof header === "string" && header.trim()) return header.trim();
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer "))
    return auth.slice(7).trim();
  return undefined;
}

function checkOrderApiKey(req: Request, res: Response): boolean {
  const expected = process.env.NOTIFY_ORDER_API_KEY;
  if (!expected || typeof expected !== "string" || !expected.trim()) {
    res.status(503).json({ success: false, error: "NOTIFY_ORDER_API_KEY not configured" });
    return false;
  }
  const provided = getApiKey(req);
  if (provided !== expected) {
    res.status(401).json({ success: false, error: "Invalid or missing API key" });
    return false;
  }
  return true;
}

/**
 * POST /api/orders/notify-done
 * Body: { id_order: string, information_order?: string, slot?: string, note?: string, supply?: string | number }
 */
export async function notifyDone(req: Request, res: Response): Promise<void> {
  if (!checkOrderApiKey(req, res)) return;

  console.log("[orders] notify-done – body from bot:", JSON.stringify(req.body, null, 2));

  const id_order =
    typeof req.body?.id_order === "string" ? req.body.id_order.trim() : "";
  if (!id_order) {
    res.status(400).json({ success: false, error: "id_order is required" });
    return;
  }

  try {
    const count = await updateOrderDone(id_order, {
      id_order,
      information_order: req.body?.information_order,
      slot: req.body?.slot,
      note: req.body?.note,
      supply: req.body?.supply,
    });
    if (count === 0) {
      res.status(404).json({ success: false, error: "Order not found in order_list" });
      return;
    }
    res.status(200).json({ success: true, updated: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[orders] notify-done error:", message, stack ?? "");
    const safeMessage =
      process.env.NODE_ENV !== "production" ? message : "Server error";
    res.status(500).json({ success: false, error: safeMessage });
  }
}

/**
 * POST /api/orders/cancel
 * Body: { id_order: string }
 */
export async function cancel(req: Request, res: Response): Promise<void> {
  if (!checkOrderApiKey(req, res)) return;

  console.log("[orders] cancel – body from bot:", JSON.stringify(req.body, null, 2));

  const id_order =
    typeof req.body?.id_order === "string" ? req.body.id_order.trim() : "";
  if (!id_order) {
    res.status(400).json({ success: false, error: "id_order is required" });
    return;
  }

  try {
    const count = await cancelOrder(id_order);
    if (count === 0) {
      res.status(404).json({ success: false, error: "Order not found in order_list" });
      return;
    }
    res.status(200).json({ success: true, canceled: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[orders] cancel error:", message, stack ?? "");
    const safeMessage =
      process.env.NODE_ENV !== "production" ? message : "Server error";
    res.status(500).json({ success: false, error: safeMessage });
  }
}

const SUPPLIER_SCHEMA = DB_SCHEMA.SUPPLIER!;
const SUPPLIER_TABLE = `${SUPPLIER_SCHEMA.SCHEMA}.${SUPPLIER_SCHEMA.TABLE}`;
const COLS_SUPPLIER = SUPPLIER_SCHEMA.COLS as Record<string, string>;

/**
 * GET /api/orders/suppliers
 * Trả về danh sách NCC (id, supplier_name) theo db.config SUPPLIER (partner.supplier).
 * Chỉ lấy bản ghi active_supply = true nếu có cột đó.
 */
export async function getSuppliers(req: Request, res: Response): Promise<void> {
  if (!checkOrderApiKey(req, res)) return;

  try {
    const idCol = COLS_SUPPLIER.ID;
    const nameCol = COLS_SUPPLIER.SUPPLIER_NAME;
    const activeCol = COLS_SUPPLIER.ACTIVE_SUPPLY;
    const whereActive =
      activeCol != null
        ? ` WHERE ${activeCol} = true`
        : "";
    const result = await pool.query<{ id: number; supplier_name: string }>(
      `SELECT ${idCol} AS id, ${nameCol} AS supplier_name
       FROM ${SUPPLIER_TABLE}${whereActive}
       ORDER BY ${nameCol}`
    );
    res.status(200).json({ success: true, suppliers: result.rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[orders] getSuppliers error:", message, stack ?? "");
    const safeMessage =
      process.env.NODE_ENV !== "production" ? message : "Server error";
    res.status(500).json({ success: false, error: safeMessage });
  }
}
