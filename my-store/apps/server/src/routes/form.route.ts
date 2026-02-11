/**
 * Form (form_desc) routes: lấy mẫu form + danh sách input theo form_id (dùng cho Thông tin bổ sung theo variant)
 */
import { Router } from "express";
import type { Request, Response } from "express";
import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";

const router = Router();
const FORM_NAME = `${DB_SCHEMA.FORM_NAME!.SCHEMA}.${DB_SCHEMA.FORM_NAME!.TABLE}`;
const FORM_INPUT = `${DB_SCHEMA.FORM_INPUT!.SCHEMA}.${DB_SCHEMA.FORM_INPUT!.TABLE}`;
const INPUTS = `${DB_SCHEMA.INPUTS!.SCHEMA}.${DB_SCHEMA.INPUTS!.TABLE}`;
const CF = DB_SCHEMA.FORM_NAME!.COLS;
const CFI = DB_SCHEMA.FORM_INPUT!.COLS;
const CI = DB_SCHEMA.INPUTS!.COLS;

/**
 * GET /api/forms/:formId/fields
 * Trả về form_name (id, name, description) + danh sách input (từ form_input join inputs) theo sort_order.
 * Dùng khi đã chọn variant có form_id để hiển thị đúng số ô input thông tin bổ sung.
 */
router.get("/:formId/fields", async (req: Request, res: Response) => {
  try {
    const formId = parseInt(req.params.formId ?? "", 10);
    if (isNaN(formId) || formId <= 0) {
      return res.status(400).json({ error: "Invalid form ID" });
    }

    const formResult = await pool.query(
      `SELECT id, ${DB_SCHEMA.FORM_NAME!.COLS.NAME}, ${DB_SCHEMA.FORM_NAME!.COLS.DESCRIPTION}
       FROM ${FORM_NAME} WHERE id = $1`,
      [formId]
    );
    if (formResult.rows.length === 0) {
      return res.status(404).json({ error: "Form not found" });
    }
    const formRow = formResult.rows[0];

    const fieldsResult = await pool.query(
      `SELECT fi.${CFI.INPUT_ID}, fi.${CFI.SORT_ORDER},
              i.${CI.INPUT_NAME}, i.${CI.INPUT_TYPE}
       FROM ${FORM_INPUT} fi
       INNER JOIN ${INPUTS} i ON i.${CI.ID} = fi.${CFI.INPUT_ID}
       WHERE fi.${CFI.FORM_ID} = $1
       ORDER BY fi.${CFI.SORT_ORDER} ASC`,
      [formId]
    );

    const form = {
      id: formRow.id,
      name: (formRow as Record<string, unknown>)[String(CF.NAME)],
      description: ((formRow as Record<string, unknown>)[String(CF.DESCRIPTION)] as string) ?? null,
    };
    const fields = fieldsResult.rows.map((r: Record<string, unknown>) => ({
      input_id: r[String(CFI.INPUT_ID)],
      input_name: r[String(CI.INPUT_NAME)],
      input_type: (r[String(CI.INPUT_TYPE)] as string) || "text",
      required: true, // form_input table không có cột required → default tất cả là bắt buộc
      sort_order: parseInt(String(r[String(CFI.SORT_ORDER)]), 10) || 0,
    }));

    res.json({ data: { form, fields } });
  } catch (err) {
    console.error("Get form fields error:", err);
    res.status(500).json({ error: "Lỗi lấy thông tin form" });
  }
});

export default router;
