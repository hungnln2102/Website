/**
 * Lấy email/username tài khoản để gửi mail (join order_list.customer = username).
 */

import pool from "../../config/database";
import { DB_SCHEMA } from "../../config/db.config";

const ACCOUNT_TABLE = `${DB_SCHEMA.ACCOUNT!.SCHEMA}.${DB_SCHEMA.ACCOUNT!.TABLE}`;
const ORDER_LIST_TABLE = `${DB_SCHEMA.ORDER_LIST!.SCHEMA}.${DB_SCHEMA.ORDER_LIST!.TABLE}`;
const COLS_A = DB_SCHEMA.ACCOUNT!.COLS as { ID: string; EMAIL: string; USERNAME: string; IS_ACTIVE: string };
const COLS_OL = DB_SCHEMA.ORDER_LIST!.COLS as { ID_ORDER: string; CUSTOMER: string };

export async function getAccountEmailById(
  accountId: number
): Promise<{ email: string; username: string } | null> {
  const res = await pool.query<{ email: string; username: string }>(
    `SELECT ${COLS_A.EMAIL} as email, ${COLS_A.USERNAME} as username
     FROM ${ACCOUNT_TABLE}
     WHERE ${COLS_A.ID} = $1 AND COALESCE(${COLS_A.IS_ACTIVE}, true) = true
     LIMIT 1`,
    [accountId]
  );
  const row = res.rows[0];
  if (!row?.email) return null;
  return { email: String(row.email), username: String(row.username ?? "") };
}

export async function getAccountEmailByOrderId(
  idOrder: string
): Promise<{ email: string; username: string } | null> {
  const res = await pool.query<{ email: string; username: string }>(
    `SELECT a.${COLS_A.EMAIL} as email, a.${COLS_A.USERNAME} as username
     FROM ${ORDER_LIST_TABLE} ol
     INNER JOIN ${ACCOUNT_TABLE} a ON LOWER(a.${COLS_A.USERNAME}) = LOWER(ol.${COLS_OL.CUSTOMER})
     WHERE ol.${COLS_OL.ID_ORDER} = $1 AND COALESCE(a.${COLS_A.IS_ACTIVE}, true) = true
     LIMIT 1`,
    [idOrder]
  );
  const row = res.rows[0];
  if (!row?.email) return null;
  return { email: String(row.email), username: String(row.username ?? "") };
}
