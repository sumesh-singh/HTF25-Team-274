import {
  PrismaClient,
  TransactionType,
  User,
  CreditTransaction,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import logger from "@/utils/logger";

export interface CreditTransactionData {
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  sessionId?: string;
  stripePaymentId?: string;
}

export interface CreditTransactionFilters {
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  sessionId?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export class CreditService {
  /**
   * Get user's current credit balance
   */
  async getCreditBalance(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return user.creditBalance;
    } catch (error) {
      logger.error("Error getting credit balance:", error);
      throw error;
    }
  }

  /**
   * Create a credit transaction and update user balance
   */
  async createTransaction(
    data: CreditTransactionData
  ): Promise<CreditTransaction> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create the transaction record
        const transaction = await tx.creditTransaction.create({
          data: {
            userId: data.userId,
            type: data.type,
            amount: data.amount,
            description: data.description,
            sessionId: data.sessionId,
            stripePaymentId: data.stripePaymentId,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            session: {
              select: {
                id: true,
                title: true,
                scheduledAt: true,
              },
            },
          },
        });

        // Calculate balance change based on transaction type
        let balanceChange = 0;
        switch (data.type) {
          case TransactionType.EARNED:
          case TransactionType.PURCHASED:
          case TransactionType.REFUNDED:
          case TransactionType.BONUS:
            balanceChange = data.amount;
            break;
          case TransactionType.SPENT:
            balanceChange = -data.amount;
            break;
        }

        // Update user's credit balance
        await tx.user.update({
          where: { id: data.userId },
          data: {
            creditBalance: {
              increment: balanceChange,
            },
          },
        });

        return transaction;
      });

      // Send credit notification
      await this.sendCreditNotification(result, data.type);

      logger.info(
        `Credit transaction created: ${data.type} ${data.amount} credits for user ${data.userId}`
      );
      return result;
    } catch (error) {
      logger.error("Error creating credit transaction:", error);
      throw error;
    }
  }

  /**
   * Get user's transaction history with filtering and pagination
   */
  async getTransactionHistory(
    userId: string,
    filters: CreditTransactionFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{
    transactions: CreditTransaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        userId,
      };

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      if (filters.sessionId) {
        where.sessionId = filters.sessionId;
      }

      // Get transactions with pagination
      const [transactions, total] = await Promise.all([
        prisma.creditTransaction.findMany({
          where,
          include: {
            session: {
              select: {
                id: true,
                title: true,
                scheduledAt: true,
                teacher: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
                learner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        prisma.creditTransaction.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        transactions,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error("Error getting transaction history:", error);
      throw error;
    }
  }

  /**
   * Check if user has sufficient credits for a transaction
   */
  async hassufficientCredits(userId: string, amount: number): Promise<boolean> {
    try {
      const balance = await this.getCreditBalance(userId);
      return balance >= amount;
    } catch (error) {
      logger.error("Error checking credit sufficiency:", error);
      throw error;
    }
  }

  /**
   * Spend credits (for session booking)
   */
  async spendCredits(
    userId: string,
    amount: number,
    description: string,
    sessionId?: string
  ): Promise<CreditTransaction> {
    try {
      // Check if user has sufficient credits
      const hasSufficientCredits = await this.hassufficientCredits(
        userId,
        amount
      );
      if (!hasSufficientCredits) {
        throw new Error("Insufficient credits");
      }

      return await this.createTransaction({
        userId,
        type: TransactionType.SPENT,
        amount,
        description,
        sessionId,
      });
    } catch (error) {
      logger.error("Error spending credits:", error);
      throw error;
    }
  }

  /**
   * Earn credits (for completed teaching sessions)
   */
  async earnCredits(
    userId: string,
    amount: number,
    description: string,
    sessionId?: string
  ): Promise<CreditTransaction> {
    try {
      return await this.createTransaction({
        userId,
        type: TransactionType.EARNED,
        amount,
        description,
        sessionId,
      });
    } catch (error) {
      logger.error("Error earning credits:", error);
      throw error;
    }
  }

  /**
   * Award bonus credits (for referrals, promotions, etc.)
   */
  async awardBonusCredits(
    userId: string,
    amount: number,
    description: string
  ): Promise<CreditTransaction> {
    try {
      return await this.createTransaction({
        userId,
        type: TransactionType.BONUS,
        amount,
        description,
      });
    } catch (error) {
      logger.error("Error awarding bonus credits:", error);
      throw error;
    }
  }

  /**
   * Refund credits (for cancelled sessions)
   */
  async refundCredits(
    userId: string,
    amount: number,
    description: string,
    sessionId?: string
  ): Promise<CreditTransaction> {
    try {
      return await this.createTransaction({
        userId,
        type: TransactionType.REFUNDED,
        amount,
        description,
        sessionId,
      });
    } catch (error) {
      logger.error("Error refunding credits:", error);
      throw error;
    }
  }

  /**
   * Get credit statistics for a user
   */
  async getCreditStatistics(userId: string): Promise<{
    totalEarned: number;
    totalSpent: number;
    totalPurchased: number;
    totalRefunded: number;
    totalBonus: number;
    currentBalance: number;
  }> {
    try {
      const [stats, currentBalance] = await Promise.all([
        prisma.creditTransaction.groupBy({
          by: ["type"],
          where: { userId },
          _sum: {
            amount: true,
          },
        }),
        this.getCreditBalance(userId),
      ]);

      const result = {
        totalEarned: 0,
        totalSpent: 0,
        totalPurchased: 0,
        totalRefunded: 0,
        totalBonus: 0,
        currentBalance,
      };

      stats.forEach((stat) => {
        const amount = stat._sum.amount || 0;
        switch (stat.type) {
          case TransactionType.EARNED:
            result.totalEarned = amount;
            break;
          case TransactionType.SPENT:
            result.totalSpent = amount;
            break;
          case TransactionType.PURCHASED:
            result.totalPurchased = amount;
            break;
          case TransactionType.REFUNDED:
            result.totalRefunded = amount;
            break;
          case TransactionType.BONUS:
            result.totalBonus = amount;
            break;
        }
      });

      return result;
    } catch (error) {
      logger.error("Error getting credit statistics:", error);
      throw error;
    }
  }

  /**
   * Award starter credits to new users
   */
  async awardStarterCredits(userId: string): Promise<CreditTransaction> {
    try {
      const STARTER_CREDITS = 50;
      return await this.createTransaction({
        userId,
        type: TransactionType.BONUS,
        amount: STARTER_CREDITS,
        description: "Welcome bonus - starter credits",
      });
    } catch (error) {
      logger.error("Error awarding starter credits:", error);
      throw error;
    }
  }
  /**
   * Send credit transaction notification
   */
  private async sendCreditNotification(
    transaction: any,
    transactionType: TransactionType
  ): Promise<void> {
    try {
      // Import notification service dynamically to avoid circular dependency
      const { notificationService } = await import("./notificationService");

      const typeMap = {
        [TransactionType.EARNED]: "earned",
        [TransactionType.SPENT]: "spent",
        [TransactionType.PURCHASED]: "purchased",
        [TransactionType.REFUNDED]: "refunded",
        [TransactionType.BONUS]: "earned", // Treat bonus as earned
      } as const;

      await notificationService.sendCreditNotification(
        transaction.userId,
        typeMap[transactionType],
        transaction.amount,
        transaction.description,
        {
          transactionId: transaction.id,
          sessionId: transaction.sessionId,
          stripePaymentId: transaction.stripePaymentId,
        }
      );
    } catch (error) {
      logger.error("Failed to send credit notification:", error);
      // Don't throw error as transaction was already created successfully
    }
  }
}

export const creditService = new CreditService();
