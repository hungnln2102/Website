/**
 * Form Controller
 * Handles form template and input field retrieval for product variants.
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
      id: formRow.id,
      name: (formRow as Record<string, unknown>)[String(CF.NAME)],
      description: ((formRow as Record<string, unknown>)[String(CF.DESCRIPTION)] as string) ?? null,
    };
    const fields = fieldsResult.rows.map((r: Record<string, unknown>) => ({
      input_id: r[String(CFI.INPUT_ID)],
      input_name: r[String(CI.INPUT_NAME)],
      input_type: (r[String(CI.INPUT_TYPE)] as string) || "text",
      required: true,
      sort_order: parseInt(String(r[String(CFI.SORT_ORDER)]), 10) || 0,
    }));

    res.json({ data: { form, fields } });
  } catch (err) {
    console.error("Get form fields error:", err);
    res.status(500).json({ error: "Lỗi lấy thông tin form" });
  }
}
