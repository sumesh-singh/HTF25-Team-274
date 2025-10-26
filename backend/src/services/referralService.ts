import prisma from "@/lib/prisma";
import { creditService } from "./creditService";
import logger from "@/utils/logger";

export interface ReferralData {
  referrerId: string;
  referredUserId: string;
  referralCode?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  totalBonusEarned: number;
  pendingReferrals: number;
}

export class ReferralService {
  private readonly REFERRAL_BONUS = 25;
  private readonly REFERRAL_CODE_LENGTH = 8;

  /**
   * Generate a unique referral code for a user
   */
  async generateReferralCode(userId: string): Promise<string> {
    try {
      // Check if user already has a referral code
      const existingCode = await this.getUserReferralCode(userId);
      if (existingCode) {
        return existingCode;
      }

      // Generate a unique code
      let referralCode: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        referralCode = this.generateRandomCode();

        // Check if code is unique (you'd need to add a referral_codes table)
        // For now, we'll assume it's unique after a few attempts
        isUnique =
          attempts > 3 || !(await this.isReferralCodeTaken(referralCode));
        attempts++;
      } while (!isUnique && attempts < maxAttempts);

      if (!isUnique) {
        throw new Error("Failed to generate unique referral code");
      }

      // Store the referral code (you'd need to add this to user model or separate table)
      // For now, we'll return the generated code
      logger.info(`Generated referral code ${referralCode} for user ${userId}`);
      return referralCode;
    } catch (error) {
      logger.error("Error generating referral code:", error);
      throw error;
    }
  }

  /**
   * Get user's referral code
   */
  async getUserReferralCode(userId: string): Promise<string | null> {
    try {
      // This would require adding referral code to user model
      // For now, return null to indicate no existing code
      return null;
    } catch (error) {
      logger.error("Error getting user referral code:", error);
      throw error;
    }
  }

  /**
   * Track a referral when a new user signs up
   */
  async trackReferral(data: ReferralData): Promise<void> {
    try {
      // Verify both users exist
      const [referrer, referred] = await Promise.all([
        prisma.user.findUnique({ where: { id: data.referrerId } }),
        prisma.user.findUnique({ where: { id: data.referredUserId } }),
      ]);

      if (!referrer || !referred) {
        throw new Error("Referrer or referred user not found");
      }

      // Check if referral already exists
      const existingReferral = await this.getReferralRecord(
        data.referrerId,
        data.referredUserId
      );
      if (existingReferral) {
        logger.warn(
          `Referral already exists: ${data.referrerId} -> ${data.referredUserId}`
        );
        return;
      }

      // Create referral record (you'd need a referrals table)
      // For now, we'll just log it and award the bonus immediately
      logger.info(
        `Referral tracked: ${data.referrerId} referred ${data.referredUserId}`
      );

      // Award referral bonus immediately
      await this.awardReferralBonus(data.referrerId, data.referredUserId);
    } catch (error) {
      logger.error("Error tracking referral:", error);
      throw error;
    }
  }

  /**
   * Award referral bonus to referrer
   */
  async awardReferralBonus(
    referrerId: string,
    referredUserId: string
  ): Promise<void> {
    try {
      // Get referred user info for description
      const referredUser = await prisma.user.findUnique({
        where: { id: referredUserId },
        select: { firstName: true, lastName: true, email: true },
      });

      if (!referredUser) {
        throw new Error("Referred user not found");
      }

      // Award bonus credits to referrer
      await creditService.awardBonusCredits(
        referrerId,
        this.REFERRAL_BONUS,
        `Referral bonus for inviting ${referredUser.firstName} ${referredUser.lastName}`
      );

      logger.info(
        `Referral bonus awarded: ${this.REFERRAL_BONUS} credits to ${referrerId} for referring ${referredUserId}`
      );
    } catch (error) {
      logger.error("Error awarding referral bonus:", error);
      throw error;
    }
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId: string): Promise<ReferralStats> {
    try {
      // This would require a referrals table to track properly
      // For now, return mock data
      const stats: ReferralStats = {
        totalReferrals: 0,
        successfulReferrals: 0,
        totalBonusEarned: 0,
        pendingReferrals: 0,
      };

      // Get total bonus earned from referrals by checking credit transactions
      const referralTransactions = await prisma.creditTransaction.findMany({
        where: {
          userId,
          type: "BONUS",
          description: {
            contains: "Referral bonus",
          },
        },
      });

      stats.totalBonusEarned = referralTransactions.reduce(
        (sum, tx) => sum + tx.amount,
        0
      );
      stats.successfulReferrals = referralTransactions.length;

      return stats;
    } catch (error) {
      logger.error("Error getting referral stats:", error);
      throw error;
    }
  }

  /**
   * Validate referral code and get referrer
   */
  async validateReferralCode(referralCode: string): Promise<string | null> {
    try {
      // This would require a referral codes table or field in user model
      // For now, return null to indicate invalid code
      return null;
    } catch (error) {
      logger.error("Error validating referral code:", error);
      throw error;
    }
  }

  /**
   * Get user's referral history
   */
  async getReferralHistory(userId: string): Promise<any[]> {
    try {
      // This would require a referrals table
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error("Error getting referral history:", error);
      throw error;
    }
  }

  /**
   * Generate random referral code
   */
  private generateRandomCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < this.REFERRAL_CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Check if referral code is already taken
   */
  private async isReferralCodeTaken(code: string): Promise<boolean> {
    try {
      // This would check against stored referral codes
      // For now, return false to indicate code is available
      return false;
    } catch (error) {
      logger.error("Error checking referral code availability:", error);
      return true; // Assume taken on error for safety
    }
  }

  /**
   * Get existing referral record
   */
  private async getReferralRecord(
    referrerId: string,
    referredUserId: string
  ): Promise<any> {
    try {
      // This would check a referrals table
      // For now, return null to indicate no existing record
      return null;
    } catch (error) {
      logger.error("Error getting referral record:", error);
      return null;
    }
  }
}

export const referralService = new ReferralService();
