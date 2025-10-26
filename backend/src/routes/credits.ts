import { Router } from "express";
import { validateRequest, commonSchemas } from "@/middleware/validation";
import { authenticateToken } from "@/middleware/auth";
import { creditController } from "@/controllers/creditController";
import Joi from "joi";

const router = Router();

// Validation schemas
const purchaseSchema = {
  body: Joi.object({
    packageId: Joi.string().required(),
  }),
};

const transferSchema = {
  body: Joi.object({
    recipientId: Joi.string().uuid().required(),
    amount: Joi.number().integer().min(1).required(),
    description: Joi.string().min(1).max(255).required(),
    type: Joi.string().valid("BONUS", "REFUND").default("BONUS"),
  }),
};

const referralSchema = {
  body: Joi.object({
    referredUserId: Joi.string().uuid().required(),
  }),
};

const transactionQuerySchema = {
  query: Joi.object({
    type: Joi.string().valid(
      "EARNED",
      "SPENT",
      "PURCHASED",
      "REFUNDED",
      "BONUS"
    ),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    sessionId: Joi.string().uuid(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

// GET /api/v1/credits/balance - Get credit balance
router.get(
  "/balance",
  authenticateToken,
  creditController.getCreditBalance.bind(creditController)
);

// GET /api/v1/credits/transactions - Get transaction history
router.get(
  "/transactions",
  authenticateToken,
  validateRequest(transactionQuerySchema),
  creditController.getTransactionHistory.bind(creditController)
);

// GET /api/v1/credits/packages - Get available credit packages
router.get(
  "/packages",
  authenticateToken,
  creditController.getCreditPackages.bind(creditController)
);

// POST /api/v1/credits/purchase - Create payment intent for credit purchase
router.post(
  "/purchase",
  authenticateToken,
  validateRequest(purchaseSchema),
  creditController.createPaymentIntent.bind(creditController)
);

// POST /api/v1/credits/transfer - Transfer credits (for referrals, bonuses)
router.post(
  "/transfer",
  authenticateToken,
  validateRequest(transferSchema),
  creditController.transferCredits.bind(creditController)
);

// POST /api/v1/credits/referral - Award referral bonus
router.post(
  "/referral",
  authenticateToken,
  validateRequest(referralSchema),
  creditController.awardReferralBonus.bind(creditController)
);

// POST /api/v1/credits/webhook - Stripe webhook handler
router.post("/webhook", creditController.handleWebhook.bind(creditController));

// GET /api/v1/credits/referrals/stats - Get referral statistics
router.get(
  "/referrals/stats",
  authenticateToken,
  creditController.getReferralStats.bind(creditController)
);

// GET /api/v1/credits/expiration - Get credit expiration information
router.get(
  "/expiration",
  authenticateToken,
  creditController.getCreditExpirationInfo.bind(creditController)
);

export default router;
