/**
 * Form Controller
 * Handles form template and input field retrieval for product variants.
 *
 * Luồng dữ liệu: variant.form_id → form_input (form_id) → inputs (input_id)
 * - Bảng variant có cột form_id.
 * - form_input liên kết form_id với các input_id (và sort_order).
 * - inputs chứa định nghĩa từng input (input_name, input_type).
 * Frontend: ProductDetailPage lấy form_id từ durationOption → fetchFormFields(formId) → AdditionalInfoSection.
 */
import type { Request, Response } from "express";
import pool from "../config/database";
import { DB_SCHEMA } from "../config/db.config";

const FORM_NAME = `${DB_SCHEMA.FORM_NAME!.SCHEMA}.${DB_SCHEMA.FORM_NAME!.TABLE}`;
const FORM_INPUT = `${DB_SCHEMA.FORM_INPUT!.SCHEMA}.${DB_SCHEMA.FORM_INPUT!.TABLE}`;
const INPUTS = `${DB_SCHEMA.INPUTS!.SCHEMA}.${DB_SCHEMA.INPUTS!.TABLE}`;
const CF = DB_SCHEMA.FORM_NAME!.COLS;
const CFI = DB_SCHEMA.FORM_INPUT!.COLS;
const CI = DB_SCHEMA.INPUTS!.COLS;

export async function getFormFields(req: Request, res: Response): Promise<void> {
  try {
    const formId = parseInt(req.params.formId ?? "", 10);
    if (isNaN(formId) || formId <= 0) {
      res.status(400).json({ error: "Invalid form ID" });
      return;
    }

    const formResult = await pool.query(
      `SELECT id, ${CF.NAME}, ${CF.DESCRIPTION}
       FROM ${FORM_NAME} WHERE id = $1`,
      [formId]
    );
    if (formResult.rows.length === 0) {
      res.status(404).json({ error: "Form not found" });
      return;
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
      id: typeof formRow.id === "bigint" ? Number(formRow.id) : Number(formRow.id ?? 0),
      name: (formRow as Record<string, unknown>)[String(CF.NAME)],
      description: ((formRow as Record<string, unknown>)[String(CF.DESCRIPTION)] as string) ?? null,
    };
    const fields = fieldsResult.rows.map((r: Record<string, unknown>) => {
      const inputId = r[String(CFI.INPUT_ID)];
      const sortOrder = r[String(CFI.SORT_ORDER)];
      return {
        input_id: typeof inputId === "bigint" ? Number(inputId) : Number(inputId ?? 0),
        input_name: r[String(CI.INPUT_NAME)],
        input_type: (r[String(CI.INPUT_TYPE)] as string) || "text",
        required: true,
        sort_order: typeof sortOrder === "bigint" ? Number(sortOrder) : parseInt(String(sortOrder ?? 0), 10) || 0,
      };
    });

    res.json({ data: { form, fields } });
  } catch (err) {
    console.error("Get form fields error:", err);
    res.status(500).json({ error: "Lỗi lấy thông tin form" });
  }
}
