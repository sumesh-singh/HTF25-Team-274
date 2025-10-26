import prisma from "@/lib/prisma";
import logger from "@/utils/logger";
import { SessionStatus } from "@prisma/client";

export interface CreateRatingData {
  sessionId: string;
  raterId: string;
  knowledgeRating: number; // 1-5
  communicationRating: number; // 1-5
  professionalismRating: number; // 1-5
  feedback?: string;
}

export interface SessionRatingStats {
  averageKnowledge: number;
  averageCommunication: number;
  averageProfessionalism: number;
  overallAverage: number;
  totalRatings: number;
}

class SessionRatingService {
  /**
   * Create a session rating
   */
  async createRating(data: CreateRatingData): Promise<any> {
    try {
      // Verify session exists and is completed
      const session = await prisma.session.findUnique({
        where: { id: data.sessionId },
        include: {
          teacher: true,
          learner: true,
          ratings: true,
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      if (session.status !== SessionStatus.COMPLETED) {
        throw new Error("Can only rate completed sessions");
      }

      // Check if rater is a participant
      if (
        session.teacherId !== data.raterId &&
        session.learnerId !== data.raterId
      ) {
        throw new Error("Only session participants can rate");
      }

      // Check if user already rated this session
      const existingRating = session.ratings.find(
        (r) => r.raterId === data.raterId
      );
      if (existingRating) {
        throw new Error("You have already rated this session");
      }

      // Create the rating
      const rating = await prisma.sessionRating.create({
        data: {
          sessionId: data.sessionId,
          raterId: data.raterId,
          knowledgeRating: data.knowledgeRating,
          communicationRating: data.communicationRating,
          professionalismRating: data.professionalismRating,
          feedback: data.feedback,
        },
      });

      // Update user ratings if both participants have rated
      await this.updateUserRatings(data.sessionId);

      // Award credits to teacher if both parties have rated
      await this.awardTeacherCredits(data.sessionId);

      logger.info(`Session rating created: ${rating.id}`);
      return rating;
    } catch (error) {
      logger.error("Failed to create session rating:", error);
      throw error;
    }
  }

  /**
   * Get session ratings
   */
  async getSessionRatings(sessionId: string, userId: string): Promise<any[]> {
    try {
      // Verify user is a participant
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { teacherId: true, learnerId: true },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      if (session.teacherId !== userId && session.learnerId !== userId) {
        throw new Error("Access denied");
      }

      const ratings = await prisma.sessionRating.findMany({
        where: { sessionId },
        include: {
          rater: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      return ratings;
    } catch (error) {
      logger.error("Failed to get session ratings:", error);
      throw error;
    }
  }

  /**
   * Get user rating statistics
   */
  async getUserRatingStats(
    userId: string,
    role: "teacher" | "learner"
  ): Promise<SessionRatingStats> {
    try {
      const sessions = await prisma.session.findMany({
        where:
          role === "teacher" ? { teacherId: userId } : { learnerId: userId },
        include: { ratings: true },
      });

      const allRatings = sessions.flatMap((session) =>
        session.ratings.filter((rating) => rating.raterId !== userId)
      );

      if (allRatings.length === 0) {
        return {
          averageKnowledge: 0,
          averageCommunication: 0,
          averageProfessionalism: 0,
          overallAverage: 0,
          totalRatings: 0,
        };
      }

      const averageKnowledge =
        allRatings.reduce((sum, r) => sum + r.knowledgeRating, 0) /
        allRatings.length;
      const averageCommunication =
        allRatings.reduce((sum, r) => sum + r.communicationRating, 0) /
        allRatings.length;
      const averageProfessionalism =
        allRatings.reduce((sum, r) => sum + r.professionalismRating, 0) /
        allRatings.length;
      const overallAverage =
        (averageKnowledge + averageCommunication + averageProfessionalism) / 3;

      return {
        averageKnowledge: Math.round(averageKnowledge * 100) / 100,
        averageCommunication: Math.round(averageCommunication * 100) / 100,
        averageProfessionalism: Math.round(averageProfessionalism * 100) / 100,
        overallAverage: Math.round(overallAverage * 100) / 100,
        totalRatings: allRatings.length,
      };
    } catch (error) {
      logger.error("Failed to get user rating stats:", error);
      throw error;
    }
  }

  /**
   * Check if session can be rated
   */
  async canRateSession(
    sessionId: string,
    userId: string
  ): Promise<{ canRate: boolean; reason?: string }> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { ratings: true },
      });

      if (!session) {
        return { canRate: false, reason: "Session not found" };
      }

      if (session.teacherId !== userId && session.learnerId !== userId) {
        return { canRate: false, reason: "Not a session participant" };
      }

      if (session.status !== SessionStatus.COMPLETED) {
        return { canRate: false, reason: "Session not completed" };
      }

      const existingRating = session.ratings.find((r) => r.raterId === userId);
      if (existingRating) {
        return { canRate: false, reason: "Already rated" };
      }

      // Check if rating window has expired (48 hours after session)
      const ratingDeadline = new Date(
        session.scheduledAt.getTime() +
          session.duration * 60 * 1000 +
          48 * 60 * 60 * 1000
      );
      if (new Date() > ratingDeadline) {
        return { canRate: false, reason: "Rating window expired" };
      }

      return { canRate: true };
    } catch (error) {
      logger.error("Failed to check if session can be rated:", error);
      return { canRate: false, reason: "Error checking rating eligibility" };
    }
  }

  /**
   * Update user overall ratings based on session ratings
   */
  private async updateUserRatings(sessionId: string): Promise<void> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { ratings: true },
      });

      if (!session || session.ratings.length < 2) {
        return; // Need both participants to rate
      }

      // Update teacher rating
      const teacherStats = await this.getUserRatingStats(
        session.teacherId,
        "teacher"
      );
      await prisma.user.update({
        where: { id: session.teacherId },
        data: { rating: teacherStats.overallAverage },
      });

      // Update learner rating
      const learnerStats = await this.getUserRatingStats(
        session.learnerId,
        "learner"
      );
      await prisma.user.update({
        where: { id: session.learnerId },
        data: { rating: learnerStats.overallAverage },
      });

      logger.info(`Updated user ratings for session: ${sessionId}`);
    } catch (error) {
      logger.error("Failed to update user ratings:", error);
    }
  }

  /**
   * Award credits to teacher after both parties have rated
   */
  private async awardTeacherCredits(sessionId: string): Promise<void> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          ratings: true,
          creditTransactions: true,
        },
      });

      if (!session || session.ratings.length < 2) {
        return; // Need both participants to rate
      }

      // Check if credits were already awarded
      const existingAward = session.creditTransactions.find(
        (t) => t.type === "EARNED" && t.userId === session.teacherId
      );

      if (existingAward) {
        return; // Credits already awarded
      }

      // Calculate credits to award (same as session cost)
      const creditsToAward = session.creditCost;

      // Award credits to teacher
      await prisma.$transaction([
        prisma.user.update({
          where: { id: session.teacherId },
          data: { creditBalance: { increment: creditsToAward } },
        }),
        prisma.creditTransaction.create({
          data: {
            userId: session.teacherId,
            type: "EARNED",
            amount: creditsToAward,
            description: `Teaching session completed: ${session.title}`,
            sessionId: session.id,
          },
        }),
      ]);

      // Update teacher's total sessions count
      await prisma.user.update({
        where: { id: session.teacherId },
        data: { totalSessions: { increment: 1 } },
      });

      logger.info(
        `Awarded ${creditsToAward} credits to teacher for session: ${sessionId}`
      );
    } catch (error) {
      logger.error("Failed to award teacher credits:", error);
    }
  }

  /**
   * Get sessions requiring rating
   */
  async getSessionsRequiringRating(userId: string): Promise<any[]> {
    try {
      const sessions = await prisma.session.findMany({
        where: {
          OR: [{ teacherId: userId }, { learnerId: userId }],
          status: SessionStatus.COMPLETED,
          ratings: {
            none: { raterId: userId },
          },
        },
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          learner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          skill: true,
          ratings: true,
        },
      });

      // Filter out sessions where rating window has expired
      const now = new Date();
      return sessions.filter((session) => {
        const ratingDeadline = new Date(
          session.scheduledAt.getTime() +
            session.duration * 60 * 1000 +
            48 * 60 * 60 * 1000
        );
        return now <= ratingDeadline;
      });
    } catch (error) {
      logger.error("Failed to get sessions requiring rating:", error);
      throw error;
    }
  }
}

export const sessionRatingService = new SessionRatingService();
