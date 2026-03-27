/**
 * Topup Controller
 * Handles balance top-up, wallet balance, transaction history, and packages from productid_payment.
 */
import type { Request, Response } from "express";
import { auditService } from "../services/audit.service";
import { walletService } from "../services/wallet.service";
import * as topupService from "../services/topup.service";

/** GET /api/topup/transfer-code — tạo mã nội dung chuyển khoản MAVNAPXXXXX (không trùng wallet_transactions). */
export async function getTransferCode(_req: Request, res: Response): Promise<void> {
  try {
    const code = await topupService.generateTopupTransferCode();
    res.json({ transactionCode: code });
  } catch (err) {
    console.error("Get topup transfer code error:", err);
    res.status(500).json({ error: "Lỗi tạo mã chuyển khoản" });
  }
}

export async function getPackages(_req: Request, res: Response): Promise<void> {
  try {
    const packages = await topupService.getTopupPackages();
    res.json({
      packages: packages.map((p) => ({
        id: p.product_id,
        product_id: p.product_id,
        amount: p.amount,
        promotion_percent: p.promotion_percent,
      })),
    });
  } catch (err) {
    console.error("Get topup packages error:", err);
    res.status(500).json({ error: "Lỗi lấy danh sách gói nạp" });
  }
}

export async function testTopup(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = (req as any).user;
    const { amount: amountBody, product_id, transactionCode } = req.body;

    if (!transactionCode || typeof transactionCode !== "string" || !transactionCode.trim()) {
      res.status(400).json({ error: "Thiếu mã giao dịch. Vui lòng tải lại trang thanh toán." });
      return;
    }
    const code = transactionCode.trim();
    if (!/^MAVNAP[A-Z0-9]{5}$/i.test(code)) {
      res.status(400).json({ error: "Mã giao dịch không hợp lệ (định dạng MAVNAPXXXXX)." });
      return;
    }

    let topupAmount: number;
    let bonus = 0;

    if (product_id != null && String(product_id).trim() !== "") {
      const pkg = await topupService.getTopupPackageByProductId(String(product_id).trim());
      if (!pkg) {
        res.status(400).json({ error: "Gói nạp không tồn tại" });
        return;
      }
      topupAmount = pkg.amount;
      bonus = Math.round((topupAmount * pkg.promotion_percent) / 100);
    } else {
      topupAmount = parseInt(amountBody);
      if (!topupAmount || topupAmount < 10000) {
        res.status(400).json({ error: "Số tiền nạp tối thiểu là 10.000đ" });
        return;
      }
      if (topupAmount > 10000000) {
        res.status(400).json({ error: "Số tiền nạp tối đa là 10.000.000đ" });
        return;
      }
    }

    const totalAmount = topupAmount + bonus;

    const { newBalance, transaction } = await walletService.addFunds(
      parseInt(userId),
      totalAmount,
      "TOPUP",
      {
        method: "topup",
        refType: "TEST",
        refId: code,
        description: bonus > 0
          ? `Nạp ${topupAmount.toLocaleString()}đ + ${bonus.toLocaleString()}đ bonus`
          : `Nạp ${topupAmount.toLocaleString()}đ`,
        transactionId: code,
        bonusApplied: bonus > 0 ? bonus : undefined,
      }
    );

    await auditService.logAuth("TOPUP", userId, req, {
      amount: topupAmount,
      bonus,
      totalAmount,
      product_id: product_id ?? null,
      transactionCode: code,
      transactionId: transaction.id,
      newBalance,
      type: "test",
    });

    res.json({
      success: true,
      message: "Nạp tiền thành công",
      data: {
        amount: topupAmount,
        bonus,
        totalAmount,
        newBalance,
        transactionCode: code,
        transactionId: transaction.id,
      },
    });
  } catch (err) {
    console.error("Topup test error:", err);
    res.status(500).json({ error: "Lỗi nạp tiền" });
  }
}

export async function getBalance(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = (req as any).user;
    const balance = await walletService.getBalance(parseInt(userId));
    res.json({ balance });
  } catch (err) {
    console.error("Get balance error:", err);
    res.status(500).json({ error: "Lỗi lấy số dư" });
  }
}

export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = (req as any).user;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const transactions = await walletService.getTransactions(parseInt(userId), limit);

    res.json({
      history: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        direction: tx.direction,
        amount: tx.amount,
        balanceBefore: tx.balanceBefore,
        balanceAfter: tx.balanceAfter,
        description: tx.description,
        createdAt: tx.createdAt,
      })),
    });
  } catch (err) {
    console.error("Topup history error:", err);
    res.status(500).json({ error: "Lỗi lấy lịch sử giao dịch" });
  }
}
