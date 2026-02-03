/**
 * Topup Routes
 * Handles balance top-up functionality
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { auditService } from "../services/audit.service";
import { walletService } from "../services/wallet.service";

const router = Router();

/**
 * Test topup (Development only)
 * POST /api/topup/test
 * 
 * This endpoint is for testing purposes only.
 * In production, use webhook from payment gateway.
 */
router.post("/test", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { amount, transactionCode } = req.body;

    // Validate amount
    const topupAmount = parseInt(amount);
    if (!topupAmount || topupAmount < 10000) {
      return res.status(400).json({ error: "Số tiền nạp tối thiểu là 10.000đ" });
    }

    if (topupAmount > 10000000) {
      return res.status(400).json({ error: "Số tiền nạp tối đa là 10.000.000đ" });
    }

    // Calculate bonus
    let bonus = 0;
    if (topupAmount >= 1000000) {
      bonus = Math.floor(topupAmount * 0.12);
    } else if (topupAmount >= 500000) {
      bonus = Math.floor(topupAmount * 0.1);
    } else if (topupAmount >= 200000) {
      bonus = Math.floor(topupAmount * 0.075);
    } else if (topupAmount >= 100000) {
      bonus = Math.floor(topupAmount * 0.05);
    }

    const totalAmount = topupAmount + bonus;

    // Add funds to wallet
    const { newBalance, transaction } = await walletService.addFunds(
      parseInt(userId),
      totalAmount,
      "TOPUP",
      {
        refType: "TEST",
        refId: transactionCode,
        description: bonus > 0 
          ? `Nạp ${topupAmount.toLocaleString()}đ + ${bonus.toLocaleString()}đ bonus`
          : `Nạp ${topupAmount.toLocaleString()}đ`,
      }
    );

    // Audit log
    await auditService.logAuth("TOPUP", userId, req, {
      amount: topupAmount,
      bonus,
      totalAmount,
      transactionCode,
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
        transactionCode,
        transactionId: transaction.id,
      },
    });
  } catch (err) {
    console.error("Topup test error:", err);
    res.status(500).json({ error: "Lỗi nạp tiền" });
  }
});

/**
 * Get wallet balance
 * GET /api/topup/balance
 */
router.get("/balance", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const balance = await walletService.getBalance(parseInt(userId));
    
    res.json({ balance });
  } catch (err) {
    console.error("Get balance error:", err);
    res.status(500).json({ error: "Lỗi lấy số dư" });
  }
});

/**
 * Get transaction history
 * GET /api/topup/history
 */
router.get("/history", authenticate, async (req: Request, res: Response) => {
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
});

export default router;
