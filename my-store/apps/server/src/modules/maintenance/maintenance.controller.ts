import type { Request, Response } from "express";
import * as svc from "./maintenance.service";
import { getClientIP } from "../../shared/middleware/security/banned-ip";

/** GET /api/maintenance/status — public: check nếu maintenance ON */
export async function getStatus(req: Request, res: Response) {
  const maintenance = await svc.isMaintenanceMode();
  const ip = getClientIP(req);
  const whitelisted = await svc.isWhitelisted(ip);
  res.json({ maintenance, whitelisted, ip });
}

/** PUT /api/maintenance/toggle — admin: bật/tắt maintenance */
export async function toggleMaintenance(req: Request, res: Response) {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") {
    return res.status(400).json({ error: 'Body cần { "enabled": true/false }' });
  }
  await svc.setMaintenanceMode(enabled);
  res.json({ maintenance: enabled });
}

/** GET /api/maintenance/whitelist — admin: danh sách IP */
export async function getWhitelist(_req: Request, res: Response) {
  const list = await svc.listWhitelist();
  res.json(list);
}

/** POST /api/maintenance/whitelist — admin: thêm IP */
export async function addIP(req: Request, res: Response) {
  const { ip, label } = req.body;
  if (!ip || typeof ip !== "string") {
    return res.status(400).json({ error: 'Body cần { "ip": "x.x.x.x" }' });
  }
  const row = await svc.addWhitelistIP(ip, label);
  res.status(201).json(row);
}

/** DELETE /api/maintenance/whitelist/:id — admin: xoá IP */
export async function removeIP(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "id không hợp lệ" });
  const row = await svc.removeWhitelistIP(id);
  if (!row) return res.status(404).json({ error: "Không tìm thấy IP" });
  res.json(row);
}

/** PATCH /api/maintenance/whitelist/:id — admin: toggle active */
export async function toggleIP(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { is_active } = req.body;
  if (!id || typeof is_active !== "boolean") {
    return res.status(400).json({ error: 'Cần { "is_active": true/false }' });
  }
  const row = await svc.toggleWhitelistIP(id, is_active);
  if (!row) return res.status(404).json({ error: "Không tìm thấy IP" });
  res.json(row);
}

/** POST /api/maintenance/whitelist/me — admin: thêm IP hiện tại của mình */
export async function addMyIP(req: Request, res: Response) {
  const ip = getClientIP(req);
  const row = await svc.addWhitelistIP(ip, "Auto: my IP");
  res.status(201).json(row);
}
