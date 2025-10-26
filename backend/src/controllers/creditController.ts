import { Request, Response } from "express";
import { creditService } from "@/services/creditService";
import { paymentService } from "@/services/paymentService";
import { referralService } from "@/services/referralService";
import { creditExpirationService } from "@/services/creditExpirationService";
import { TransactionType } from "@prisma/client";
import logger from "@/utils/logger";

export class CreditController {
  /**
   * Get user's credit balance
   */
  async getCreditBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const [balance, statistics] = await Promise.all([
        creditService.getCreditBalance(userId),
        creditService.getCreditStatistics(userId),
      ]);

      res.json({
        success: true,
        data: {
          balance,
          statistics,
        },
      });
    } catch (error) {
      logger.error("Error getting credit balance:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "CREDIT_BALANCE_ERROR",
          message: "Failed to get credit balance",
        },
      });
    }
  }

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        type,
        startDate,
        endDate,
        sessionId,
        page = "1",
        limit = "20",
      } = req.query;

      const filters: any = {};

      if (
        type &&
        Object.values(TransactionType).includes(type as TransactionType)
      ) {
        filters.type = type as TransactionType;
      }

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      if (sessionId) {
        filters.sessionId = sessionId as string;
      }

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await creditService.getTransactionHistory(
        userId,
        filters,
        pagination
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error getting transaction history:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "TRANSACTION_HISTORY_ERROR",
          message: "Failed to get transaction history",
        },
      });
    }
  }

  /**
   * Get available credit packages
   */
  async getCreditPackages(req: Request, res: Response): Promise<void> {
    try {
      const packages = paymentService.getCreditPackages();

      res.json({
        success: true,
        data: {
          packages,
        },
      });
    } catch (error) {
      logger.error("Error getting credit packages:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "PACKAGES_ERROR",
          message: "Failed to get credit packages",
        },
      });
    }
  }

  /**
   * Create payment intent for credit purchase
   */
  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { packageId } = req.body;

      if (!packageId) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Package ID is required",
          },
        });
        return;
      }

      const result = await paymentService.createPaymentIntent(
        userId,
        packageId,
        req.user!.email
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error creating payment intent:", error);

      if (
        error instanceof Error &&
        error.message === "Invalid credit package"
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PACKAGE",
            message: "Invalid credit package selected",
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: "PAYMENT_INTENT_ERROR",
          message: "Failed to create payment intent",
        },
      });
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers["stripe-signature"] as string;

      if (!signature) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_SIGNATURE",
            message: "Missing Stripe signature",
          },
        });
        return;
      }

      await paymentService.handleWebhook(req.body, signature);

      res.json({
        success: true,
        data: {
          message: "Webhook processed successfully",
        },
      });
    } catch (error) {
      logger.error("Error handling Stripe webhook:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "WEBHOOK_ERROR",
          message: "Failed to process webhook",
        },
      });
    }
  }

  /**
   * Transfer credits (for referrals, bonuses, admin actions)
   */
  async transferCredits(req: Request, res: Response): Promise<void> {
    try {
      const { recipientId, amount, description, type = "BONUS" } = req.body;

      if (!recipientId || !amount || !description) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Recipient ID, amount, and description are required",
          },
        });
        return;
      }

      if (amount <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_AMOUNT",
            message: "Amount must be positive",
          },
        });
        return;
      }

      let transaction;

      switch (type) {
        case "BONUS":
          transaction = await creditService.awardBonusCredits(
            recipientId,
            amount,
            description
          );
          break;
        case "REFUND":
          transaction = await creditService.refundCredits(
            recipientId,
            amount,
            description
          );
          break;
        default:
          res.status(400).json({
            success: false,
            error: {
              code: "INVALID_TYPE",
              message: "Invalid transfer type",
            },
          });
          return;
      }

      res.json({
        success: true,
        data: {
          transaction,
        },
      });
    } catch (error) {
      logger.error("Error transferring credits:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "TRANSFER_ERROR",
          message: "Failed to transfer credits",
        },
      });
    }
  }

  /**
   * Award referral bonus
   */
  async awardReferralBonus(req: Request, res: Response): Promise<void> {
    try {
      const { referredUserId } = req.body;
      const referrerId = req.user!.id;

      if (!referredUserId) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Referred user ID is required",
          },
        });
        return;
      }

      const REFERRAL_BONUS = 25;

      // Award bonus to referrer
      const transaction = await creditService.awardBonusCredits(
        referrerId,
        REFERRAL_BONUS,
        `Referral bonus for inviting user ${referredUserId}`
      );

      res.json({
        success: true,
        data: {
          transaction,
          bonusAmount: REFERRAL_BONUS,
        },
      });
    } catch (error) {
      logger.error("Error awarding referral bonus:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "REFERRAL_BONUS_ERROR",
          message: "Failed to award referral bonus",
        },
      });
    }
  }
  /**
   * Get referral statistics
   */
  async getReferralStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const stats = await referralService.getReferralStats(userId);

      res.json({
        success: true,
        data: {
          stats,
        },
      });
    } catch (error) {
      logger.error("Error getting referral stats:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "REFERRAL_STATS_ERROR",
          message: "Failed to get referral statistics",
        },
      });
    }
  }

  /**
   * Get credit expiration information
   */
  async getCreditExpirationInfo(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const expirationInfo =
        await creditExpirationService.getCreditExpirationInfo(userId);

      res.json({
        success: true,
        data: {
          expiration: expirationInfo,
        },
      });
    } catch (error) {
      logger.error("Error getting credit expiration info:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "EXPIRATION_INFO_ERROR",
          message: "Failed to get credit expiration information",
        },
      });
    }
  }
}

export const creditController = new CreditController();
