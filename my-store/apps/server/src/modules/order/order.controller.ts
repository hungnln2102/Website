/**
 * Order API handlers – notify-done (Hoàn thành) và cancel (Hủy Đơn) từ Bot Telegram.
 */
import type { Request, Response } from "express";
import pool from "../../config/database";
import { DB_SCHEMA } from "../../config/db.config";
import { updateOrderDone, cancelOrder } from "./order-list.service";
import * as customerEmail from "../notification/customer-email.service";
import { getAccountEmailByOrderId } from "../notification/customer-email-lookup";
import logger from "../../shared/utils/logger";

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

/** Không log toàn bộ body (Telegram/bot có thể chứa PII). */
function summarizeOrderWebhookBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { shape: typeof body };
  }
  const o = body as Record<string, unknown>;
  return {
    keys: Object.keys(o),
    id_order: typeof o.id_order === "string" ? o.id_order : undefined,
    has_supply: o.supply_id != null || o.supply != null,
  };
}

/**
 * POST /api/orders/notify-done
 * Body: { id_order: string, information_order?: string, slot?: string, note?: string, supply_id?: number | string }
 * Bot gửi supply (id NCC) — map thành supply_id.
 */
export async function notifyDone(req: Request, res: Response): Promise<void> {
  if (!checkOrderApiKey(req, res)) return;

  console.log("[orders] notify-done", summarizeOrderWebhookBody(req.body));

  const id_order =
    typeof req.body?.id_order === "string" ? req.body.id_order.trim() : "";
  if (!id_order) {
    res.status(400).json({ success: false, error: "id_order is required" });
    return;
  }

  const supplyId = req.body?.supply_id ?? req.body?.supply;

  try {
    const count = await updateOrderDone(id_order, {
      id_order,
      information_order: req.body?.information_order,
      slot: req.body?.slot,
      note: req.body?.note,
      supply_id: supplyId,
    });
    if (count === 0) {
      res.status(404).json({ success: false, error: "Order not found in order_list" });
      return;
    }
    if (customerEmail.isCustomerEmailConfigured()) {
      const slotRaw = req.body?.slot;
      const slot = slotRaw != null && slotRaw !== "" ? String(slotRaw) : undefined;
      const infoRaw = req.body?.information_order;
      const infoSnippet =
        infoRaw != null && infoRaw !== ""
          ? typeof infoRaw === "string"
            ? infoRaw
            : JSON.stringify(infoRaw)
          : undefined;
      getAccountEmailByOrderId(id_order)
        .then((acc) => {
          if (!acc?.email) return;
          return customerEmail.sendOrderFulfilledEmail({
            to: acc.email,
            username: acc.username,
            idOrder: id_order,
            slot,
            infoSnippet,
          });
        })
        .catch((e) => logger.error("[orders] notify-done customer email", { error: e }));
    }
    res.status(200).json({ success: true, updated: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error("[orders] notify-done error", { message, stack });
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

  console.log("[orders] cancel", summarizeOrderWebhookBody(req.body));

  const id_order =
    typeof req.body?.id_order === "string" ? req.body.id_order.trim() : "";
  if (!id_order) {
    res.status(400).json({ success: false, error: "id_order is required" });
    return;
  }

  try {
    const result = await cancelOrder(id_order);
    if (result.updated === 0) {
      res.status(404).json({ success: false, error: "Order not found in order_list" });
      return;
    }
    res.status(200).json({
      success: true,
      canceled: result.updated,
      refundedMcoin: result.refundedMcoin,
      accountId: result.accountId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error("[orders] cancel error", { message, stack });
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
    logger.error("[orders] getSuppliers error", { message, stack });
    const safeMessage =
      process.env.NODE_ENV !== "production" ? message : "Server error";
    res.status(500).json({ success: false, error: safeMessage });
  }
}
