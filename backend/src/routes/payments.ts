import { Router } from "express";
import { validateRequest, commonSchemas } from "@/middleware/validation";
import { authenticateToken } from "@/middleware/auth";
import { paymentService } from "@/services/paymentService";
import prisma from "@/lib/prisma";
import logger from "@/utils/logger";
import Joi from "joi";

const router = Router();

// Validation schemas
const attachPaymentMethodSchema = {
  body: Joi.object({
    paymentMethodId: Joi.string().required(),
  }),
};

// GET /api/v1/payments/methods - Get payment methods
router.get("/methods", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
      return;
    }

    // For now, return empty array as we don't store Stripe customer IDs yet
    // In a full implementation, you'd store the Stripe customer ID in the user model
    res.json({
      success: true,
      data: {
        paymentMethods: [],
        message: "Payment methods will be available after first purchase",
      },
    });
  } catch (error) {
    logger.error("Error getting payment methods:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "PAYMENT_METHODS_ERROR",
        message: "Failed to get payment methods",
      },
    });
  }
});

// POST /api/v1/payments/methods - Add payment method
router.post(
  "/methods",
  authenticateToken,
  validateRequest(attachPaymentMethodSchema),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { paymentMethodId } = req.body;

      // This would require storing Stripe customer IDs
      // For now, return a placeholder response
      res.json({
        success: true,
        data: {
          message:
            "Payment method management will be available after implementing customer ID storage",
          paymentMethodId,
        },
      });
    } catch (error) {
      logger.error("Error adding payment method:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "ADD_PAYMENT_METHOD_ERROR",
          message: "Failed to add payment method",
        },
      });
    }
  }
);

// DELETE /api/v1/payments/methods/:id - Remove payment method
router.delete(
  "/methods/:id",
  authenticateToken,
  validateRequest({ params: { id: commonSchemas.id } }),
  async (req, res) => {
    try {
      const paymentMethodId = req.params.id;

      // This would require storing Stripe customer IDs and payment method associations
      // For now, return a placeholder response
      res.json({
        success: true,
        data: {
          message:
            "Payment method management will be available after implementing customer ID storage",
          paymentMethodId,
        },
      });
    } catch (error) {
      logger.error("Error removing payment method:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "REMOVE_PAYMENT_METHOD_ERROR",
          message: "Failed to remove payment method",
        },
      });
    }
  }
);

// GET /api/v1/payments/history - Get payment history
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get credit transactions that were purchases
    const purchaseTransactions = await prisma.creditTransaction.findMany({
      where: {
        userId,
        type: "PURCHASED",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    res.json({
      success: true,
      data: {
        transactions: purchaseTransactions,
      },
    });
  } catch (error) {
    logger.error("Error getting payment history:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "PAYMENT_HISTORY_ERROR",
        message: "Failed to get payment history",
      },
    });
  }
});

export default router;
