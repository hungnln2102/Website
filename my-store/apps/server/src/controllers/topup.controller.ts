/**
 * Topup Controller
 * Handles balance top-up, wallet balance, and transaction history.
 */
import type { Request, Response } from "express";
import { auditService } from "../services/audit.service";
import { walletService } from "../services/wallet.service";

export async function testTopup(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = (req as any).user;
    const { amount, transactionCode } = req.body;

    const topupAmount = parseInt(amount);
    if (!topupAmount || topupAmount < 10000) {
      res.status(400).json({ error: "Số tiền nạp tối thiểu là 10.000đ" });
      return;
    }

    if (topupAmount > 10000000) {
      res.status(400).json({ error: "Số tiền nạp tối đa là 10.000.000đ" });
      return;
    }

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
