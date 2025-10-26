import prisma from "@/lib/prisma";
import { videoService, CreateMeetingOptions } from "./videoService";
import { notificationService } from "./notificationService";
import { creditService } from "./creditService";
import logger from "@/utils/logger";
import { SessionStatus, SessionType } from "@prisma/client";

export interface CreateSessionRequest {
  teacherId: string;
  learnerId: string;
  skillId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // minutes
  type?: SessionType;
  proposedTimeSlots?: Date[]; // For session proposals
}

export interface SessionProposal {
  id: string;
  teacherId: string;
  learnerId: string;
  skillId: string;
  title: string;
  description?: string;
  proposedTimeSlots: Date[];
  duration: number;
  creditCost: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  expiresAt: Date;
}

export interface UpdateSessionRequest {
  title?: string;
  description?: string;
  scheduledAt?: Date;
  duration?: number;
  status?: SessionStatus;
}

class SessionService {
  /**
   * Create a session proposal with multiple time slots
   */
  async createSessionProposal(
    data: CreateSessionRequest
  ): Promise<SessionProposal> {
    try {
      // Verify users exist and have sufficient credits
      const [teacher, learner] = await Promise.all([
        prisma.user.findUnique({ where: { id: data.teacherId } }),
        prisma.user.findUnique({ where: { id: data.learnerId } }),
      ]);

      if (!teacher || !learner) {
        throw new Error("Teacher or learner not found");
      }

      // Check if learner has sufficient credits
      const creditCost = this.calculateCreditCost(
        data.duration,
        teacher.rating.toNumber(),
        teacher.totalSessions
      );
      const hasSufficientCredits = await creditService.hassufficientCredits(
        data.learnerId,
        creditCost
      );
      if (!hasSufficientCredits) {
        throw new Error("Insufficient credits");
      }

      // Verify skill exists and teacher can teach it
      const teacherSkill = await prisma.userSkill.findFirst({
        where: {
          userId: data.teacherId,
          skillId: data.skillId,
          canTeach: true,
        },
        include: { skill: true },
      });

      if (!teacherSkill) {
        throw new Error("Teacher cannot teach this skill");
      }

      // Check availability for proposed time slots
      const availableSlots = await this.checkAvailability(
        data.teacherId,
        data.proposedTimeSlots || [data.scheduledAt],
        data.duration
      );

      if (availableSlots.length === 0) {
        throw new Error("No available time slots");
      }

      // Create session proposal (stored in a separate table or as pending session)
      const proposal: SessionProposal = {
        id: `proposal_${Date.now()}`,
        teacherId: data.teacherId,
        learnerId: data.learnerId,
        skillId: data.skillId,
        title: data.title,
        description: data.description,
        proposedTimeSlots: availableSlots,
        duration: data.duration,
        creditCost,
        status: "pending",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      };

      // TODO: Store proposal in database or cache
      // For now, we'll create a pending session with the first available slot
      const session = await this.createSession({
        ...data,
        scheduledAt: availableSlots[0],
      });

      return proposal;
    } catch (error) {
      logger.error("Failed to create session proposal:", error);
      throw error;
    }
  }

  /**
   * Create a confirmed session
   */
  async createSession(data: CreateSessionRequest): Promise<any> {
    try {
      // Verify users and credits
      const [teacher, learner] = await Promise.all([
        prisma.user.findUnique({ where: { id: data.teacherId } }),
        prisma.user.findUnique({ where: { id: data.learnerId } }),
      ]);

      if (!teacher || !learner) {
        throw new Error("Teacher or learner not found");
      }

      const creditCost = this.calculateCreditCost(
        data.duration,
        teacher.rating.toNumber(),
        teacher.totalSessions
      );

      const hasSufficientCredits = await creditService.hassufficientCredits(
        data.learnerId,
        creditCost
      );
      if (!hasSufficientCredits) {
        throw new Error("Insufficient credits");
      }

      // Check availability
      const isAvailable = await this.checkSingleAvailability(
        data.teacherId,
        data.scheduledAt,
        data.duration
      );
      if (!isAvailable) {
        throw new Error("Time slot not available");
      }

      // Create video meeting
      const meetingOptions: CreateMeetingOptions = {
        title: data.title,
        startTime: data.scheduledAt,
        duration: data.duration,
        hostEmail: teacher.email,
        participantEmails: [learner.email],
        recordingEnabled: false,
      };

      const videoMeeting = await videoService.createMeeting(meetingOptions);

      // Create session in database
      const session = await prisma.session.create({
        data: {
          teacherId: data.teacherId,
          learnerId: data.learnerId,
          skillId: data.skillId,
          title: data.title,
          description: data.description,
          scheduledAt: data.scheduledAt,
          duration: data.duration,
          type: data.type || SessionType.ONE_TIME,
          videoLink: videoMeeting.url,
          creditCost,
          status: SessionStatus.PENDING,
        },
        include: {
          teacher: true,
          learner: true,
          skill: true,
        },
      });

      // Escrow credits (deduct from learner's balance)
      await creditService.spendCredits(
        data.learnerId,
        creditCost,
        `Session booking: ${data.title}`,
        session.id
      );

      logger.info(`Session created: ${session.id}`);
      return session;
    } catch (error) {
      logger.error("Failed to create session:", error);
      throw error;
    }
  }

  /**
   * Confirm a session (move from pending to confirmed)
   */
  async confirmSession(sessionId: string, userId: string): Promise<any> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { teacher: true, learner: true },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // Only teacher can confirm the session
      if (session.teacherId !== userId) {
        throw new Error("Only the teacher can confirm the session");
      }

      if (session.status !== SessionStatus.PENDING) {
        throw new Error("Session is not in pending status");
      }

      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: { status: SessionStatus.CONFIRMED },
        include: {
          teacher: true,
          learner: true,
          skill: true,
        },
      });

      // Send confirmation notifications
      await notificationService.sendSessionConfirmation(sessionId);

      logger.info(`Session confirmed: ${sessionId}`);
      return updatedSession;
    } catch (error) {
      logger.error("Failed to confirm session:", error);
      throw error;
    }
  }

  /**
   * Reschedule a session with mutual confirmation
   */
  async rescheduleSession(
    sessionId: string,
    newScheduledAt: Date,
    requesterId: string
  ): Promise<any> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { teacher: true, learner: true },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // Check if requester is participant
      if (
        session.teacherId !== requesterId &&
        session.learnerId !== requesterId
      ) {
        throw new Error("Only session participants can reschedule");
      }

      // Check if session can be rescheduled (not completed or cancelled)
      if (
        session.status === SessionStatus.COMPLETED ||
        session.status === SessionStatus.CANCELLED
      ) {
        throw new Error("Cannot reschedule completed or cancelled session");
      }

      // Check availability for new time
      const isAvailable = await this.checkSingleAvailability(
        session.teacherId,
        newScheduledAt,
        session.duration
      );
      if (!isAvailable) {
        throw new Error("New time slot not available");
      }

      // Update session
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          scheduledAt: newScheduledAt,
          status: SessionStatus.PENDING, // Requires confirmation from other party
        },
        include: {
          teacher: true,
          learner: true,
          skill: true,
        },
      });

      // Send reschedule notification to other party
      const otherPartyId =
        requesterId === session.teacherId
          ? session.learnerId
          : session.teacherId;
      const requesterName =
        requesterId === session.teacherId
          ? `${session.teacher.firstName} ${session.teacher.lastName}`
          : `${session.learner.firstName} ${session.learner.lastName}`;

      await notificationService.createNotification({
        userId: otherPartyId,
        type: "SESSION_CONFIRMED", // Reusing this type for reschedule
        title: "Session Rescheduled",
        message: `${requesterName} has requested to reschedule your session "${
          session.title
        }" to ${newScheduledAt.toLocaleString()}. Please confirm the new time.`,
        data: { sessionId, newScheduledAt, requesterId },
      });

      logger.info(`Session rescheduled: ${sessionId}`);
      return updatedSession;
    } catch (error) {
      logger.error("Failed to reschedule session:", error);
      throw error;
    }
  }

  /**
   * Cancel a session with refund logic
   */
  async cancelSession(
    sessionId: string,
    userId: string,
    reason?: string
  ): Promise<any> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { teacher: true, learner: true },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // Check if user is participant
      if (session.teacherId !== userId && session.learnerId !== userId) {
        throw new Error("Only session participants can cancel");
      }

      if (session.status === SessionStatus.CANCELLED) {
        throw new Error("Session is already cancelled");
      }

      // Calculate refund based on cancellation time
      const refundAmount = this.calculateRefund(
        session.scheduledAt,
        session.creditCost,
        userId === session.teacherId
      );

      // Update session status
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: { status: SessionStatus.CANCELLED },
        include: {
          teacher: true,
          learner: true,
          skill: true,
        },
      });

      // Process refund if applicable
      if (refundAmount > 0) {
        await creditService.refundCredits(
          session.learnerId,
          refundAmount,
          `Session cancellation refund${reason ? `: ${reason}` : ""}`,
          sessionId
        );
      }

      // Clean up video meeting
      if (session.videoLink) {
        // Extract meeting ID and provider from video link
        // This is a simplified approach - in practice, you'd store provider info
        const provider = session.videoLink.includes("zoom.us")
          ? "zoom"
          : "daily";
        const meetingId = this.extractMeetingId(session.videoLink, provider);
        if (meetingId) {
          await videoService.deleteMeeting(meetingId, provider);
        }
      }

      // Send cancellation notification
      await notificationService.sendSessionCancellation(
        sessionId,
        userId,
        reason
      );

      logger.info(`Session cancelled: ${sessionId}, refund: ${refundAmount}`);
      return updatedSession;
    } catch (error) {
      logger.error("Failed to cancel session:", error);
      throw error;
    }
  }

  /**
   * Get user sessions with filtering
   */
  async getUserSessions(
    userId: string,
    filters: {
      status?: SessionStatus;
      type?: SessionType;
      role?: "teacher" | "learner";
      upcoming?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    sessions: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 20, ...otherFilters } = filters;
      const skip = (page - 1) * limit;

      const where: any = {
        OR: [{ teacherId: userId }, { learnerId: userId }],
      };

      if (otherFilters.status) {
        where.status = otherFilters.status;
      }

      if (otherFilters.type) {
        where.type = otherFilters.type;
      }

      if (otherFilters.role === "teacher") {
        where.OR = [{ teacherId: userId }];
      } else if (otherFilters.role === "learner") {
        where.OR = [{ learnerId: userId }];
      }

      if (otherFilters.upcoming) {
        where.scheduledAt = { gte: new Date() };
      }

      const [sessions, total] = await Promise.all([
        prisma.session.findMany({
          where,
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                rating: true,
              },
            },
            learner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                rating: true,
              },
            },
            skill: true,
          },
          orderBy: { scheduledAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.session.count({ where }),
      ]);

      return {
        sessions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error("Failed to get user sessions:", error);
      throw error;
    }
  }

  /**
   * Get session details with join capability check
   */
  async getSessionDetails(sessionId: string, userId: string): Promise<any> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          teacher: true,
          learner: true,
          skill: true,
          ratings: true,
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // Check if user is participant
      if (session.teacherId !== userId && session.learnerId !== userId) {
        throw new Error("Access denied");
      }

      // Add join capability info
      const canJoin = videoService.canJoinMeeting(session.scheduledAt);
      const joinUrl = canJoin
        ? videoService.getMeetingJoinUrl(
            session.videoLink || "",
            session.scheduledAt
          )
        : null;

      return {
        ...session,
        canJoin,
        joinUrl,
      };
    } catch (error) {
      logger.error("Failed to get session details:", error);
      throw error;
    }
  }

  /**
   * Check availability for multiple time slots
   */
  private async checkAvailability(
    teacherId: string,
    timeSlots: Date[],
    duration: number
  ): Promise<Date[]> {
    const availableSlots: Date[] = [];

    for (const slot of timeSlots) {
      const isAvailable = await this.checkSingleAvailability(
        teacherId,
        slot,
        duration
      );
      if (isAvailable) {
        availableSlots.push(slot);
      }
    }

    return availableSlots;
  }

  /**
   * Check availability for a single time slot
   */
  private async checkSingleAvailability(
    teacherId: string,
    scheduledAt: Date,
    duration: number
  ): Promise<boolean> {
    const endTime = new Date(scheduledAt.getTime() + duration * 60 * 1000);

    // Check for conflicting sessions
    const conflictingSessions = await prisma.session.findMany({
      where: {
        teacherId,
        status: {
          in: [
            SessionStatus.PENDING,
            SessionStatus.CONFIRMED,
            SessionStatus.IN_PROGRESS,
          ],
        },
        OR: [
          {
            scheduledAt: { lte: scheduledAt },
            // Check if session end time conflicts
          },
          {
            scheduledAt: { gte: scheduledAt, lt: endTime },
          },
        ],
      },
    });

    return conflictingSessions.length === 0;
  }

  /**
   * Calculate credit cost based on duration and teacher premium status
   */
  private calculateCreditCost(
    duration: number,
    teacherRating: number,
    totalSessions: number
  ): number {
    const baseRate = 10; // 10 credits per hour
    const hourlyRate = (duration / 60) * baseRate;

    // Premium teacher pricing (4.8+ rating, 50+ sessions)
    if (teacherRating >= 4.8 && totalSessions >= 50) {
      return Math.ceil(hourlyRate * 1.5); // 15 credits per hour for premium teachers
    }

    return Math.ceil(hourlyRate);
  }

  /**
   * Calculate credits earned by teacher for completed session
   */
  private calculateCreditsEarned(duration: number): number {
    const baseRate = 10; // 10 credits per hour
    const hourlyRate = (duration / 60) * baseRate;
    return Math.ceil(hourlyRate);
  }

  /**
   * Calculate refund amount based on cancellation timing
   */
  private calculateRefund(
    scheduledAt: Date,
    creditCost: number,
    isTeacherCancelling: boolean
  ): number {
    const now = new Date();
    const hoursUntilSession =
      (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (isTeacherCancelling) {
      return creditCost; // Full refund if teacher cancels
    }

    if (hoursUntilSession >= 24) {
      return creditCost; // Full refund (24+ hours notice)
    } else if (hoursUntilSession >= 2) {
      return Math.floor(creditCost * 0.5); // 50% refund (2-24 hours notice)
    } else {
      return 0; // No refund (<2 hours notice)
    }
  }

  /**
   * Start a session (mark as in progress)
   */
  async startSession(sessionId: string, userId: string): Promise<any> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { teacher: true, learner: true },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // Check if user is participant
      if (session.teacherId !== userId && session.learnerId !== userId) {
        throw new Error("Only session participants can start the session");
      }

      if (session.status !== SessionStatus.CONFIRMED) {
        throw new Error("Session must be confirmed to start");
      }

      // Check if session can be started (within 15 minutes of start time)
      if (!videoService.canJoinMeeting(session.scheduledAt)) {
        throw new Error("Session cannot be started yet");
      }

      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: { status: SessionStatus.IN_PROGRESS },
        include: {
          teacher: true,
          learner: true,
          skill: true,
        },
      });

      logger.info(`Session started: ${sessionId}`);
      return updatedSession;
    } catch (error) {
      logger.error("Failed to start session:", error);
      throw error;
    }
  }

  /**
   * Complete a session
   */
  async completeSession(sessionId: string, userId: string): Promise<any> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { teacher: true, learner: true },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // Check if user is participant
      if (session.teacherId !== userId && session.learnerId !== userId) {
        throw new Error("Only session participants can complete the session");
      }

      if (session.status !== SessionStatus.IN_PROGRESS) {
        throw new Error("Session must be in progress to complete");
      }

      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: { status: SessionStatus.COMPLETED },
        include: {
          teacher: true,
          learner: true,
          skill: true,
        },
      });

      // Award credits to teacher for completed session
      const creditsEarned = this.calculateCreditsEarned(session.duration);
      await creditService.earnCredits(
        session.teacherId,
        creditsEarned,
        `Teaching session completed: ${session.title}`,
        sessionId
      );

      // Send completion notifications with rating reminders
      await Promise.all([
        notificationService.createNotification({
          userId: session.teacherId,
          type: "SESSION_CONFIRMED", // Reusing for completion
          title: "Session Completed",
          message: `Your teaching session "${session.title}" with ${session.learner.firstName} ${session.learner.lastName} has been completed. Please rate your experience within 48 hours.`,
          data: { sessionId, requiresRating: true },
        }),
        notificationService.createNotification({
          userId: session.learnerId,
          type: "SESSION_CONFIRMED", // Reusing for completion
          title: "Session Completed",
          message: `Your learning session "${session.title}" with ${session.teacher.firstName} ${session.teacher.lastName} has been completed. Please rate your experience within 48 hours.`,
          data: { sessionId, requiresRating: true },
        }),
      ]);

      logger.info(`Session completed: ${sessionId}`);
      return updatedSession;
    } catch (error) {
      logger.error("Failed to complete session:", error);
      throw error;
    }
  }

  /**
   * Get session analytics for a user
   */
  async getSessionAnalytics(userId: string): Promise<any> {
    try {
      const [teachingStats, learningStats] = await Promise.all([
        // Teaching statistics
        prisma.session.groupBy({
          by: ["status"],
          where: { teacherId: userId },
          _count: { status: true },
        }),
        // Learning statistics
        prisma.session.groupBy({
          by: ["status"],
          where: { learnerId: userId },
          _count: { status: true },
        }),
      ]);

      // Calculate total hours taught and learned
      const [totalHoursTaught, totalHoursLearned] = await Promise.all([
        prisma.session.aggregate({
          where: {
            teacherId: userId,
            status: SessionStatus.COMPLETED,
          },
          _sum: { duration: true },
        }),
        prisma.session.aggregate({
          where: {
            learnerId: userId,
            status: SessionStatus.COMPLETED,
          },
          _sum: { duration: true },
        }),
      ]);

      return {
        teaching: {
          stats: teachingStats.reduce(
            (acc: Record<string, number>, stat: any) => {
              acc[stat.status.toLowerCase()] = stat._count.status;
              return acc;
            },
            {} as Record<string, number>
          ),
          totalHours:
            Math.round(((totalHoursTaught._sum.duration || 0) / 60) * 100) /
            100,
        },
        learning: {
          stats: learningStats.reduce(
            (acc: Record<string, number>, stat: any) => {
              acc[stat.status.toLowerCase()] = stat._count.status;
              return acc;
            },
            {} as Record<string, number>
          ),
          totalHours:
            Math.round(((totalHoursLearned._sum.duration || 0) / 60) * 100) /
            100,
        },
      };
    } catch (error) {
      logger.error("Failed to get session analytics:", error);
      throw error;
    }
  }

  /**
   * Extract meeting ID from video link
   */
  private extractMeetingId(
    videoLink: string,
    provider: "zoom" | "daily"
  ): string | null {
    try {
      if (provider === "zoom") {
        const match = videoLink.match(/\/j\/(\d+)/);
        return match ? match[1] : null;
      } else if (provider === "daily") {
        const match = videoLink.match(/https:\/\/[^.]+\.daily\.co\/([^?]+)/);
        return match ? match[1] : null;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const sessionService = new SessionService();
